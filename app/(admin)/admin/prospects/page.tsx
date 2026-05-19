'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  getProspects,
  createProspect,
  updateProspect,
  updateProspectStatus,
  deleteProspect,
  addProspectNote,
} from '@/services/prospect-service';
import {
  Prospect,
  ProspectStatus,
  ProspectSource,
  CreateProspectData,
  PROSPECT_STATUS_LABELS,
  PROSPECT_SOURCE_LABELS,
  PROSPECT_STATUS_COLORS,
  PROSPECT_PIPELINE_STAGES,
} from '@/types/prospect';
import { Timestamp } from 'firebase/firestore';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  ChatBubbleLeftIcon,
  ViewColumnsIcon,
  ListBulletIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

type ViewMode = 'list' | 'kanban';

const KANBAN_COLUMNS: ProspectStatus[] = [
  ProspectStatus.NEW,
  ProspectStatus.CONTACTED,
  ProspectStatus.QUALIFIED,
  ProspectStatus.PROPOSAL_SENT,
  ProspectStatus.NEGOTIATING,
  ProspectStatus.WON,
  ProspectStatus.LOST,
];

export default function ProspectsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProspectStatus | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<ProspectSource | 'all'>('all');

  // Detail / view modal
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Add / edit modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  const [formSource, setFormSource] = useState<ProspectSource>(ProspectSource.MANUAL);
  const [formStatus, setFormStatus] = useState<ProspectStatus>(ProspectStatus.NEW);
  const [formValue, setFormValue] = useState('');
  const [formFollowUp, setFormFollowUp] = useState('');
  const [isSavingForm, setIsSavingForm] = useState(false);

  // Drag state for kanban
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const loadProspects = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProspects();
      setProspects(data);
    } catch {
      showToast('Failed to load prospects', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadProspects();
  }, [loadProspects]);

  const filteredProspects = prospects.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (sourceFilter !== 'all' && p.source !== sourceFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.company || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Stats
  const activeProspects = prospects.filter(
    p => p.status !== ProspectStatus.WON && p.status !== ProspectStatus.LOST
  );
  const pipelineValue = activeProspects.reduce((sum, p) => sum + (p.estimatedValue || 0), 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const followUpsDue = prospects.filter(p => {
    if (!p.nextFollowUpAt) return false;
    return p.nextFollowUpAt.toMillis() <= Date.now();
  });

  const openFormModal = (prospect?: Prospect) => {
    if (prospect) {
      setEditingProspect(prospect);
      setFormName(prospect.name);
      setFormEmail(prospect.email);
      setFormPhone(prospect.phone || '');
      setFormCompany(prospect.company || '');
      setFormWebsite(prospect.website || '');
      setFormSource(prospect.source);
      setFormStatus(prospect.status);
      setFormValue(prospect.estimatedValue ? String(prospect.estimatedValue) : '');
      setFormFollowUp(
        prospect.nextFollowUpAt
          ? prospect.nextFollowUpAt.toDate().toISOString().split('T')[0]
          : ''
      );
    } else {
      setEditingProspect(null);
      setFormName('');
      setFormEmail('');
      setFormPhone('');
      setFormCompany('');
      setFormWebsite('');
      setFormSource(ProspectSource.MANUAL);
      setFormStatus(ProspectStatus.NEW);
      setFormValue('');
      setFormFollowUp('');
    }
    setShowFormModal(true);
  };

  const handleSaveForm = async () => {
    if (!user || !formName.trim() || !formEmail.trim()) {
      showToast('Name and email are required', 'error');
      return;
    }
    setIsSavingForm(true);
    try {
      const data: CreateProspectData = {
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim() || undefined,
        company: formCompany.trim() || undefined,
        website: formWebsite.trim() || undefined,
        source: formSource,
        status: formStatus,
        estimatedValue: formValue ? parseFloat(formValue) : undefined,
        nextFollowUpAt: formFollowUp
          ? Timestamp.fromDate(new Date(formFollowUp))
          : undefined,
      };

      if (editingProspect) {
        await updateProspect(editingProspect.id, data);
        showToast('Prospect updated', 'success');
        // Refresh detail modal if open
        if (selectedProspect?.id === editingProspect.id) {
          setSelectedProspect({ ...selectedProspect, ...data });
        }
      } else {
        await createProspect(data, user.uid);
        showToast('Prospect added', 'success');
      }
      setShowFormModal(false);
      loadProspects();
    } catch {
      showToast('Failed to save prospect', 'error');
    } finally {
      setIsSavingForm(false);
    }
  };

  const handleDelete = async (prospect: Prospect) => {
    if (!confirm(`Delete "${prospect.name}"? This cannot be undone.`)) return;
    try {
      await deleteProspect(prospect.id);
      showToast('Prospect deleted', 'success');
      if (showDetailModal && selectedProspect?.id === prospect.id) {
        setShowDetailModal(false);
      }
      loadProspects();
    } catch {
      showToast('Failed to delete prospect', 'error');
    }
  };

  const handleStatusChange = async (prospect: Prospect, newStatus: ProspectStatus) => {
    try {
      await updateProspectStatus(prospect.id, newStatus);
      setProspects(prev =>
        prev.map(p => p.id === prospect.id ? { ...p, status: newStatus } : p)
      );
      if (selectedProspect?.id === prospect.id) {
        setSelectedProspect({ ...selectedProspect, status: newStatus });
      }
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  const handleAddNote = async () => {
    if (!user || !selectedProspect || !newNoteText.trim()) return;
    setIsSavingNote(true);
    try {
      await addProspectNote(selectedProspect.id, newNoteText.trim(), user.uid, user.name);
      setNewNoteText('');
      showToast('Note added', 'success');
      // Reload and refresh selected prospect
      const updated = await getProspects();
      setProspects(updated);
      const fresh = updated.find(p => p.id === selectedProspect.id);
      if (fresh) setSelectedProspect(fresh);
    } catch {
      showToast('Failed to add note', 'error');
    } finally {
      setIsSavingNote(false);
    }
  };

  // Kanban drag-and-drop
  const handleDragStart = (prospectId: string) => setDraggedId(prospectId);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = async (e: React.DragEvent, targetStatus: ProspectStatus) => {
    e.preventDefault();
    if (!draggedId) return;
    const prospect = prospects.find(p => p.id === draggedId);
    if (!prospect || prospect.status === targetStatus) {
      setDraggedId(null);
      return;
    }
    await handleStatusChange(prospect, targetStatus);
    setDraggedId(null);
  };

  const formatDate = (ts?: Timestamp | null) => {
    if (!ts) return '—';
    return ts.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isFollowUpOverdue = (p: Prospect) =>
    p.nextFollowUpAt ? p.nextFollowUpAt.toMillis() < Date.now() : false;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prospects</h1>
          <p className="text-gray-600 mt-1">Track and manage your sales pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              title="List view"
            >
              <ListBulletIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              title="Kanban view"
            >
              <ViewColumnsIcon className="h-4 w-4" />
            </button>
          </div>
          <Button onClick={() => openFormModal()} leftIcon={<PlusIcon className="h-4 w-4" />}>
            Add Prospect
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Prospects"
          value={prospects.length}
          icon={<UserGroupIcon className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Active Pipeline"
          value={activeProspects.length}
          icon={<ChevronRightIcon className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Pipeline Value"
          value={`$${pipelineValue.toLocaleString()}`}
          icon={<CurrencyDollarIcon className="h-6 w-6" />}
          color="purple"
        />
        <StatCard
          title="Follow-ups Due"
          value={followUpsDue.length}
          icon={<CalendarIcon className="h-6 w-6" />}
          color={followUpsDue.length > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, or company..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as ProspectStatus | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Statuses</option>
            {Object.values(ProspectStatus).map(s => (
              <option key={s} value={s}>{PROSPECT_STATUS_LABELS[s]}</option>
            ))}
          </select>
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value as ProspectSource | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Sources</option>
            {Object.values(ProspectSource).map(s => (
              <option key={s} value={s}>{PROSPECT_SOURCE_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* List View */}
      {viewMode === 'list' && (
        <>
          <Card>
            {filteredProspects.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <UserGroupIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>{searchQuery || statusFilter !== 'all' || sourceFilter !== 'all' ? 'No prospects match your filters' : 'No prospects yet'}</p>
                <p className="text-sm mt-1">Click &quot;Add Prospect&quot; to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Company</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Source</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Value</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Follow-up</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Added</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProspects.map(prospect => (
                      <tr key={prospect.id} className="hover:bg-gray-50 transition-colors">
                        {/* Name */}
                        <td className="px-4 py-3 max-w-xs">
                          <p className="font-medium text-gray-900 truncate">{prospect.name}</p>
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                            <EnvelopeIcon className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{prospect.email}</span>
                          </div>
                          {prospect.phone && (
                            <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                              <PhoneIcon className="h-3 w-3 flex-shrink-0" />
                              {prospect.phone}
                            </div>
                          )}
                        </td>

                        {/* Company */}
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {prospect.company || <span className="text-gray-300">—</span>}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant={PROSPECT_STATUS_COLORS[prospect.status] as Parameters<typeof Badge>[0]['variant']}
                              size="sm"
                            >
                              {PROSPECT_STATUS_LABELS[prospect.status]}
                            </Badge>
                            {isFollowUpOverdue(prospect) && (
                              <Badge variant="error" size="sm">Overdue</Badge>
                            )}
                          </div>
                        </td>

                        {/* Source */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant="default" size="sm">{PROSPECT_SOURCE_LABELS[prospect.source]}</Badge>
                        </td>

                        {/* Value */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {prospect.estimatedValue ? (
                            <span className="font-medium text-green-700">${prospect.estimatedValue.toLocaleString()}</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>

                        {/* Follow-up */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {prospect.nextFollowUpAt ? (
                            <span className={`text-sm ${isFollowUpOverdue(prospect) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                              {formatDate(prospect.nextFollowUpAt)}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>

                        {/* Added */}
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                          {formatDate(prospect.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setSelectedProspect(prospect); setShowDetailModal(true); }}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                              title="View details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openFormModal(prospect)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                              title="Edit"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(prospect)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          {filteredProspects.length > 0 && (
            <p className="text-sm text-gray-500">
              Showing {filteredProspects.length} of {prospects.length} prospects
            </p>
          )}
        </>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {KANBAN_COLUMNS.map(status => {
              const columnProspects = filteredProspects.filter(p => p.status === status);
              return (
                <div
                  key={status}
                  className="w-64 flex-shrink-0"
                  onDragOver={handleDragOver}
                  onDrop={e => handleDrop(e, status)}
                >
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={PROSPECT_STATUS_COLORS[status] as Parameters<typeof Badge>[0]['variant']}
                        size="sm"
                      >
                        {PROSPECT_STATUS_LABELS[status]}
                      </Badge>
                      <span className="text-xs text-gray-500 font-medium">{columnProspects.length}</span>
                    </div>
                  </div>
                  <div
                    className={`min-h-32 rounded-xl p-2 space-y-2 transition-colors ${
                      draggedId ? 'bg-gray-100 border-2 border-dashed border-gray-300' : 'bg-gray-50'
                    }`}
                  >
                    {columnProspects.map(prospect => (
                      <div
                        key={prospect.id}
                        draggable
                        onDragStart={() => handleDragStart(prospect.id)}
                        onDragEnd={() => setDraggedId(null)}
                        className={`bg-white rounded-lg border p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow ${
                          draggedId === prospect.id ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">{prospect.name}</p>
                            {prospect.company && (
                              <p className="text-xs text-gray-500 truncate">{prospect.company}</p>
                            )}
                          </div>
                          <button
                            onClick={() => { setSelectedProspect(prospect); setShowDetailModal(true); }}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                          >
                            <EyeIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {prospect.estimatedValue && (
                          <p className="text-xs text-green-700 font-medium mt-1.5">
                            ${prospect.estimatedValue.toLocaleString()}
                          </p>
                        )}
                        {isFollowUpOverdue(prospect) && (
                          <p className="text-xs text-red-600 mt-1">Follow-up overdue</p>
                        )}
                        {prospect.notes.length > 0 && (
                          <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
                            <ChatBubbleLeftIcon className="h-3 w-3" />
                            {prospect.notes.length}
                          </div>
                        )}
                      </div>
                    ))}
                    {columnProspects.length === 0 && (
                      <p className="text-center text-xs text-gray-400 py-4">Drop here</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Prospect Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setNewNoteText(''); }}
        title="Prospect Details"
        size="lg"
      >
        {selectedProspect && (
          <div className="space-y-5">
            {/* Contact info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Contact</p>
                <p className="font-semibold text-gray-900 text-lg">{selectedProspect.name}</p>
                <div className="space-y-1 mt-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                    <a href={`mailto:${selectedProspect.email}`} className="hover:underline">{selectedProspect.email}</a>
                  </div>
                  {selectedProspect.phone && (
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="h-4 w-4 text-gray-400" />
                      {selectedProspect.phone}
                    </div>
                  )}
                  {selectedProspect.company && (
                    <div className="flex items-center gap-2">
                      <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                      {selectedProspect.company}
                    </div>
                  )}
                  {selectedProspect.website && (
                    <div className="flex items-center gap-2">
                      <GlobeAltIcon className="h-4 w-4 text-gray-400" />
                      <a href={selectedProspect.website} target="_blank" rel="noreferrer" className="hover:underline truncate">
                        {selectedProspect.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Status</p>
                  <select
                    value={selectedProspect.status}
                    onChange={e => handleStatusChange(selectedProspect, e.target.value as ProspectStatus)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {Object.values(ProspectStatus).map(s => (
                      <option key={s} value={s}>{PROSPECT_STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Source</p>
                    <Badge variant="default" size="sm" className="mt-0.5">
                      {PROSPECT_SOURCE_LABELS[selectedProspect.source]}
                    </Badge>
                  </div>
                  {selectedProspect.estimatedValue && (
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Est. Value</p>
                      <p className="font-semibold text-green-700">${selectedProspect.estimatedValue.toLocaleString()}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Added</p>
                    <p className="text-gray-700">{formatDate(selectedProspect.createdAt)}</p>
                  </div>
                  {selectedProspect.nextFollowUpAt && (
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Follow-up</p>
                      <p className={`${isFollowUpOverdue(selectedProspect) ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                        {formatDate(selectedProspect.nextFollowUpAt)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pipeline progress (non-terminal stages) */}
            {selectedProspect.status !== ProspectStatus.WON &&
              selectedProspect.status !== ProspectStatus.LOST && (
              <div className="border-t pt-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">Pipeline Stage</p>
                <div className="flex items-center gap-1">
                  {PROSPECT_PIPELINE_STAGES.map((stage, i) => {
                    const currentIdx = PROSPECT_PIPELINE_STAGES.indexOf(selectedProspect.status as ProspectStatus);
                    const isActive = stage === selectedProspect.status;
                    const isPast = i < currentIdx;
                    return (
                      <React.Fragment key={stage}>
                        <button
                          onClick={() => handleStatusChange(selectedProspect, stage)}
                          className={`flex-1 text-xs py-1.5 px-2 rounded-md font-medium transition-colors truncate ${
                            isActive
                              ? 'bg-primary-600 text-white'
                              : isPast
                              ? 'bg-primary-100 text-primary-700'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {PROSPECT_STATUS_LABELS[stage]}
                        </button>
                        {i < PROSPECT_PIPELINE_STAGES.length - 1 && (
                          <ChevronRightIcon className="h-3 w-3 text-gray-300 flex-shrink-0" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="border-t pt-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">
                Notes ({selectedProspect.notes.length})
              </p>
              <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                {selectedProspect.notes.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No notes yet</p>
                ) : (
                  [...selectedProspect.notes]
                    .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
                    .map(note => (
                      <div key={note.id} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {note.createdByName} &middot; {formatDate(note.createdAt)}
                        </p>
                      </div>
                    ))
                )}
              </div>
              {/* Add note */}
              <div className="flex gap-2">
                <textarea
                  value={newNoteText}
                  onChange={e => setNewNoteText(e.target.value)}
                  placeholder="Add a note..."
                  rows={2}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                />
                <Button
                  size="sm"
                  onClick={handleAddNote}
                  loading={isSavingNote}
                  disabled={!newNoteText.trim()}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 border-t pt-4">
              <Button
                variant="outline"
                onClick={() => { setShowDetailModal(false); openFormModal(selectedProspect); }}
                leftIcon={<PencilIcon className="h-4 w-4" />}
                fullWidth
              >
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = `mailto:${selectedProspect.email}`}
                leftIcon={<EnvelopeIcon className="h-4 w-4" />}
                fullWidth
              >
                Email
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(selectedProspect)}
                leftIcon={<TrashIcon className="h-4 w-4" />}
                fullWidth
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add / Edit Prospect Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={editingProspect ? 'Edit Prospect' : 'Add Prospect'}
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <Input
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <Input
                type="email"
                value={formEmail}
                onChange={e => setFormEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <Input
                value={formPhone}
                onChange={e => setFormPhone(e.target.value)}
                placeholder="(555) 000-0000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <Input
                value={formCompany}
                onChange={e => setFormCompany(e.target.value)}
                placeholder="Company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <Input
                value={formWebsite}
                onChange={e => setFormWebsite(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Est. Value ($)</label>
              <Input
                type="number"
                value={formValue}
                onChange={e => setFormValue(e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <select
                value={formSource}
                onChange={e => setFormSource(e.target.value as ProspectSource)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {Object.values(ProspectSource).map(s => (
                  <option key={s} value={s}>{PROSPECT_SOURCE_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formStatus}
                onChange={e => setFormStatus(e.target.value as ProspectStatus)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {Object.values(ProspectStatus).map(s => (
                  <option key={s} value={s}>{PROSPECT_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Next Follow-up Date</label>
            <input
              type="date"
              value={formFollowUp}
              onChange={e => setFormFollowUp(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowFormModal(false)}>Cancel</Button>
            <Button onClick={handleSaveForm} loading={isSavingForm}>
              {editingProspect ? 'Save Changes' : 'Add Prospect'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50',
    red: 'text-red-600 bg-red-50',
  };
  return (
    <Card>
      <div className="p-4 flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${colorMap[color] || 'text-gray-600 bg-gray-50'}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </Card>
  );
}
