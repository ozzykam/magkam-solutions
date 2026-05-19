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
  getJobApplications,
  createJobApplication,
  updateJobApplication,
  updateJobApplicationStatus,
  deleteJobApplication,
  addApplicationNote,
} from '@/services/job-application-service';
import {
  JobApplication,
  ApplicationStatus,
  ApplicationSource,
  LocationType,
  CreateJobApplicationData,
  APPLICATION_PIPELINE_STAGES,
  APPLICATION_TERMINAL_STAGES,
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
  APPLICATION_SOURCE_LABELS,
  LOCATION_TYPE_LABELS,
  LOCATION_TYPE_COLORS,
} from '@/types/job-application';
import { Timestamp } from 'firebase/firestore';
import {
  PlusIcon,
  BriefcaseIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  ViewColumnsIcon,
  ListBulletIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  ChatBubbleLeftIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

type ViewMode = 'list' | 'kanban';

const KANBAN_COLUMNS = APPLICATION_PIPELINE_STAGES;

const isFollowUpOverdue = (app: JobApplication) =>
  app.nextFollowUpAt ? app.nextFollowUpAt.toMillis() < Date.now() : false;

const formatDate = (ts?: Timestamp | null) => {
  if (!ts) return '—';
  return ts.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const followUpClass = (app: JobApplication) => {
  if (!app.nextFollowUpAt) return 'text-gray-300';
  const diff = app.nextFollowUpAt.toMillis() - Date.now();
  if (diff < 0) return 'text-red-600 font-semibold';
  if (diff < 7 * 86400000) return 'text-amber-600 font-semibold';
  return 'text-gray-600';
};

const salaryDisplay = (app: JobApplication) => {
  if (app.salaryOffered) return `$${app.salaryOffered.toLocaleString()} offered`;
  if (app.salaryMin && app.salaryMax)
    return `$${app.salaryMin.toLocaleString()} – $${app.salaryMax.toLocaleString()}`;
  if (app.salaryMin) return `$${app.salaryMin.toLocaleString()}+`;
  if (app.salaryMax) return `Up to $${app.salaryMax.toLocaleString()}`;
  return null;
};

export default function ApplicationsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<ApplicationSource | 'all'>('all');

  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);

  // Form state
  const [formCompany, setFormCompany] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formLocationType, setFormLocationType] = useState<LocationType>(LocationType.REMOTE);
  const [formStatus, setFormStatus] = useState<ApplicationStatus>(ApplicationStatus.SAVED);
  const [formSource, setFormSource] = useState<ApplicationSource>(ApplicationSource.LINKEDIN);
  const [formAppliedAt, setFormAppliedAt] = useState('');
  const [formFollowUp, setFormFollowUp] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formSalaryMin, setFormSalaryMin] = useState('');
  const [formSalaryMax, setFormSalaryMax] = useState('');
  const [formSalaryOffered, setFormSalaryOffered] = useState('');
  const [formContactName, setFormContactName] = useState('');
  const [formContactEmail, setFormContactEmail] = useState('');
  const [formResumeVersion, setFormResumeVersion] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [draggedId, setDraggedId] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      setApplications(await getJobApplications());
    } catch {
      showToast('Failed to load applications', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const filtered = applications.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (sourceFilter !== 'all' && a.source !== sourceFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q);
    }
    return true;
  });

  // Stats
  const now = Date.now();
  const activeApps = applications.filter(a => !APPLICATION_TERMINAL_STAGES.includes(a.status));
  const inInterview = applications.filter(a =>
    [ApplicationStatus.PHONE_SCREEN, ApplicationStatus.INTERVIEWING, ApplicationStatus.FINAL_ROUND].includes(a.status)
  );
  const offers = applications.filter(a =>
    [ApplicationStatus.OFFER_RECEIVED, ApplicationStatus.ACCEPTED].includes(a.status)
  );
  const followUpsDue = activeApps.filter(a => a.nextFollowUpAt && a.nextFollowUpAt.toMillis() < now);
  const appliedCount = applications.filter(a => a.status !== ApplicationStatus.SAVED).length;
  const noResponseCount = applications.filter(a => a.status === ApplicationStatus.NO_RESPONSE).length;
  const responseRate = appliedCount > 0 ? Math.round(((appliedCount - noResponseCount) / appliedCount) * 100) : null;

  const openFormModal = (app?: JobApplication) => {
    if (app) {
      setEditingApp(app);
      setFormCompany(app.company);
      setFormRole(app.role);
      setFormLocation(app.location || '');
      setFormLocationType(app.locationType);
      setFormStatus(app.status);
      setFormSource(app.source);
      setFormAppliedAt(app.appliedAt ? app.appliedAt.toDate().toISOString().split('T')[0] : '');
      setFormFollowUp(app.nextFollowUpAt ? app.nextFollowUpAt.toDate().toISOString().split('T')[0] : '');
      setFormUrl(app.jobPostingUrl || '');
      setFormSalaryMin(app.salaryMin !== undefined ? String(app.salaryMin) : '');
      setFormSalaryMax(app.salaryMax !== undefined ? String(app.salaryMax) : '');
      setFormSalaryOffered(app.salaryOffered !== undefined ? String(app.salaryOffered) : '');
      setFormContactName(app.contactName || '');
      setFormContactEmail(app.contactEmail || '');
      setFormResumeVersion(app.resumeVersion || '');
    } else {
      setEditingApp(null);
      setFormCompany('');
      setFormRole('');
      setFormLocation('');
      setFormLocationType(LocationType.REMOTE);
      setFormStatus(ApplicationStatus.SAVED);
      setFormSource(ApplicationSource.LINKEDIN);
      setFormAppliedAt('');
      setFormFollowUp('');
      setFormUrl('');
      setFormSalaryMin('');
      setFormSalaryMax('');
      setFormSalaryOffered('');
      setFormContactName('');
      setFormContactEmail('');
      setFormResumeVersion('');
    }
    setShowFormModal(true);
  };

  const handleSave = async () => {
    if (!user || !formCompany.trim() || !formRole.trim()) {
      showToast('Company and role are required', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const data: CreateJobApplicationData = {
        company: formCompany.trim(),
        role: formRole.trim(),
        locationType: formLocationType,
        status: formStatus,
        source: formSource,
        ...(formLocation.trim() && { location: formLocation.trim() }),
        ...(formAppliedAt && { appliedAt: Timestamp.fromDate(new Date(formAppliedAt)) }),
        ...(formFollowUp && { nextFollowUpAt: Timestamp.fromDate(new Date(formFollowUp)) }),
        ...(formUrl.trim() && { jobPostingUrl: formUrl.trim() }),
        ...(formSalaryMin && { salaryMin: Number(formSalaryMin) }),
        ...(formSalaryMax && { salaryMax: Number(formSalaryMax) }),
        ...(formSalaryOffered && { salaryOffered: Number(formSalaryOffered) }),
        ...(formContactName.trim() && { contactName: formContactName.trim() }),
        ...(formContactEmail.trim() && { contactEmail: formContactEmail.trim() }),
        ...(formResumeVersion.trim() && { resumeVersion: formResumeVersion.trim() }),
      };

      if (editingApp) {
        await updateJobApplication(editingApp.id, {
          ...data,
          // clear optional fields that were removed
          location: formLocation.trim() || undefined,
          jobPostingUrl: formUrl.trim() || undefined,
          contactName: formContactName.trim() || undefined,
          contactEmail: formContactEmail.trim() || undefined,
          resumeVersion: formResumeVersion.trim() || undefined,
          nextFollowUpAt: formFollowUp ? Timestamp.fromDate(new Date(formFollowUp)) : undefined,
          appliedAt: formAppliedAt ? Timestamp.fromDate(new Date(formAppliedAt)) : undefined,
          salaryMin: formSalaryMin ? Number(formSalaryMin) : undefined,
          salaryMax: formSalaryMax ? Number(formSalaryMax) : undefined,
          salaryOffered: formSalaryOffered ? Number(formSalaryOffered) : undefined,
        });
        if (selectedApp?.id === editingApp.id) {
          const updated = await getJobApplications();
          const fresh = updated.find(a => a.id === editingApp.id);
          if (fresh) setSelectedApp(fresh);
        }
        showToast('Application updated', 'success');
      } else {
        await createJobApplication(data, user.uid);
        showToast('Application added', 'success');
      }
      setShowFormModal(false);
      loadApplications();
    } catch {
      showToast('Failed to save application', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (app: JobApplication) => {
    if (!confirm(`Delete "${app.role} at ${app.company}"?`)) return;
    try {
      await deleteJobApplication(app.id);
      showToast('Application deleted', 'success');
      if (selectedApp?.id === app.id) setShowDetailModal(false);
      loadApplications();
    } catch {
      showToast('Failed to delete application', 'error');
    }
  };

  const handleStatusChange = async (app: JobApplication, status: ApplicationStatus) => {
    try {
      await updateJobApplicationStatus(app.id, status);
      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status } : a));
      if (selectedApp?.id === app.id) setSelectedApp({ ...selectedApp, status });
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  const handleAddNote = async () => {
    if (!user || !selectedApp || !newNoteText.trim()) return;
    setIsSavingNote(true);
    try {
      await addApplicationNote(selectedApp.id, newNoteText.trim(), user.uid, user.name);
      setNewNoteText('');
      showToast('Note added', 'success');
      const updated = await getJobApplications();
      setApplications(updated);
      const fresh = updated.find(a => a.id === selectedApp.id);
      if (fresh) setSelectedApp(fresh);
    } catch {
      showToast('Failed to add note', 'error');
    } finally {
      setIsSavingNote(false);
    }
  };

  // Kanban
  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = async (e: React.DragEvent, targetStatus: ApplicationStatus) => {
    e.preventDefault();
    if (!draggedId) return;
    const app = applications.find(a => a.id === draggedId);
    if (!app || app.status === targetStatus) { setDraggedId(null); return; }
    await handleStatusChange(app, targetStatus);
    setDraggedId(null);
  };

  const showOfferField = [ApplicationStatus.OFFER_RECEIVED, ApplicationStatus.ACCEPTED].includes(formStatus);

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
          <h1 className="text-3xl font-bold text-gray-900">Job Applications</h1>
          <p className="text-gray-600 mt-1">Track your W-2 job search pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              title="Table view"
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
            Add Application
          </Button>
        </div>
      </div>

      {/* Mini-dashboard stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Active" value={activeApps.length} color="blue" />
        <StatCard title="In Interview" value={inInterview.length} color="amber" />
        <StatCard title="Offers" value={offers.length} color="green" />
        <StatCard
          title="Follow-ups Due"
          value={followUpsDue.length}
          color={followUpsDue.length > 0 ? 'red' : 'green'}
          alert={followUpsDue.length > 0}
        />
        <StatCard
          title="Response Rate"
          value={responseRate !== null ? `${responseRate}%` : '—'}
          color={responseRate !== null && responseRate >= 50 ? 'green' : responseRate !== null ? 'amber' : 'gray'}
        />
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by company or role..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as ApplicationStatus | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Statuses</option>
            {Object.values(ApplicationStatus).map(s => (
              <option key={s} value={s}>{APPLICATION_STATUS_LABELS[s]}</option>
            ))}
          </select>
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value as ApplicationSource | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Sources</option>
            {Object.values(ApplicationSource).map(s => (
              <option key={s} value={s}>{APPLICATION_SOURCE_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* List View */}
      {viewMode === 'list' && (
        <>
          <Card>
            {filtered.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <BriefcaseIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>{searchQuery || statusFilter !== 'all' ? 'No applications match your filters' : 'No applications yet'}</p>
                <p className="text-sm mt-1">Click &quot;Add Application&quot; to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Source</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Salary</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Follow-up</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Applied</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map(app => (
                      <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 max-w-[160px]">
                          <p className="font-medium text-gray-900 truncate">{app.company}</p>
                          {app.contactName && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">{app.contactName}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-[180px]">
                          <p className="text-gray-700 truncate">{app.role}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge
                            variant={LOCATION_TYPE_COLORS[app.locationType] as Parameters<typeof Badge>[0]['variant']}
                            size="sm"
                          >
                            {LOCATION_TYPE_LABELS[app.locationType]}
                          </Badge>
                          {app.location && (
                            <p className="text-xs text-gray-400 mt-0.5">{app.location}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge
                            variant={APPLICATION_STATUS_COLORS[app.status] as Parameters<typeof Badge>[0]['variant']}
                            size="sm"
                          >
                            {APPLICATION_STATUS_LABELS[app.status]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant="default" size="sm">{APPLICATION_SOURCE_LABELS[app.source]}</Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {salaryDisplay(app) ? (
                            <span className={`text-sm ${app.salaryOffered ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
                              {salaryDisplay(app)}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${followUpClass(app)}`}>
                          {app.nextFollowUpAt ? (
                            <div className="flex items-center gap-1">
                              {isFollowUpOverdue(app) && <ExclamationTriangleIcon className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />}
                              {formatDate(app.nextFollowUpAt)}
                            </div>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(app.appliedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setSelectedApp(app); setShowDetailModal(true); }}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                              title="View"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openFormModal(app)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                              title="Edit"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(app)}
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
          {filtered.length > 0 && (
            <p className="text-sm text-gray-500">
              Showing {filtered.length} of {applications.length} applications
            </p>
          )}
        </>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="space-y-4">
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-3 min-w-max">
              {KANBAN_COLUMNS.map(status => {
                const columnApps = filtered.filter(a => a.status === status);
                return (
                  <div
                    key={status}
                    className="w-60 flex-shrink-0"
                    onDragOver={handleDragOver}
                    onDrop={e => handleDrop(e, status)}
                  >
                    <div className="flex items-center justify-between mb-2 px-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={APPLICATION_STATUS_COLORS[status] as Parameters<typeof Badge>[0]['variant']}
                          size="sm"
                        >
                          {APPLICATION_STATUS_LABELS[status]}
                        </Badge>
                        <span className="text-xs text-gray-500 font-medium">{columnApps.length}</span>
                      </div>
                    </div>
                    <div
                      className={`min-h-32 rounded-xl p-2 space-y-2 transition-colors ${
                        draggedId ? 'bg-gray-100 border-2 border-dashed border-gray-300' : 'bg-gray-50'
                      }`}
                    >
                      {columnApps.map(app => (
                        <div
                          key={app.id}
                          draggable
                          onDragStart={() => handleDragStart(app.id)}
                          onDragEnd={() => setDraggedId(null)}
                          className={`bg-white rounded-lg border p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow ${
                            draggedId === app.id ? 'opacity-50' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-gray-900 truncate">{app.company}</p>
                              <p className="text-xs text-gray-500 truncate">{app.role}</p>
                            </div>
                            <button
                              onClick={() => { setSelectedApp(app); setShowDetailModal(true); }}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded flex-shrink-0"
                            >
                              <EyeIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5 mt-2">
                            <Badge
                              variant={LOCATION_TYPE_COLORS[app.locationType] as Parameters<typeof Badge>[0]['variant']}
                              size="sm"
                            >
                              {LOCATION_TYPE_LABELS[app.locationType]}
                            </Badge>
                          </div>
                          {salaryDisplay(app) && (
                            <p className="text-xs text-green-700 font-medium mt-1.5">{salaryDisplay(app)}</p>
                          )}
                          {isFollowUpOverdue(app) && (
                            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                              <ExclamationTriangleIcon className="h-3 w-3" />
                              Follow-up overdue
                            </p>
                          )}
                          {app.notes.length > 0 && (
                            <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
                              <ChatBubbleLeftIcon className="h-3 w-3" />
                              {app.notes.length}
                            </div>
                          )}
                        </div>
                      ))}
                      {columnApps.length === 0 && (
                        <p className="text-center text-xs text-gray-400 py-4">Drop here</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Terminal stages summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {APPLICATION_TERMINAL_STAGES.map(status => {
              const count = filtered.filter(a => a.status === status).length;
              return (
                <div key={status} className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-sm text-gray-500">{APPLICATION_STATUS_LABELS[status]}</span>
                  <Badge
                    variant={APPLICATION_STATUS_COLORS[status] as Parameters<typeof Badge>[0]['variant']}
                    size="sm"
                  >
                    {count}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setNewNoteText(''); }}
        title="Application Details"
        size="lg"
      >
        {selectedApp && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Left: contact info */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Position</p>
                <p className="font-bold text-gray-900 text-lg">{selectedApp.role}</p>
                <p className="text-base text-gray-600">{selectedApp.company}</p>
                <div className="space-y-1 mt-2 text-sm text-gray-600">
                  {selectedApp.location && (
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={LOCATION_TYPE_COLORS[selectedApp.locationType] as Parameters<typeof Badge>[0]['variant']}
                        size="sm"
                      >
                        {LOCATION_TYPE_LABELS[selectedApp.locationType]}
                      </Badge>
                      <span>{selectedApp.location}</span>
                    </div>
                  )}
                  {selectedApp.contactName && (
                    <p className="text-sm text-gray-600">{selectedApp.contactName}</p>
                  )}
                  {selectedApp.contactEmail && (
                    <div className="flex items-center gap-2">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                      <a href={`mailto:${selectedApp.contactEmail}`} className="hover:underline">
                        {selectedApp.contactEmail}
                      </a>
                    </div>
                  )}
                  {selectedApp.jobPostingUrl && (
                    <div className="flex items-center gap-2">
                      <GlobeAltIcon className="h-4 w-4 text-gray-400" />
                      <a href={selectedApp.jobPostingUrl} target="_blank" rel="noreferrer" className="hover:underline truncate text-primary-600">
                        Job Posting
                      </a>
                    </div>
                  )}
                </div>
                {salaryDisplay(selectedApp) && (
                  <p className={`mt-2 font-semibold ${selectedApp.salaryOffered ? 'text-green-700' : 'text-gray-700'}`}>
                    {salaryDisplay(selectedApp)}
                  </p>
                )}
              </div>

              {/* Right: status + meta */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Status</p>
                  <select
                    value={selectedApp.status}
                    onChange={e => handleStatusChange(selectedApp, e.target.value as ApplicationStatus)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                  >
                    {Object.values(ApplicationStatus).map(s => (
                      <option key={s} value={s}>{APPLICATION_STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Source</p>
                    <Badge variant="default" size="sm" className="mt-0.5">
                      {APPLICATION_SOURCE_LABELS[selectedApp.source]}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Applied</p>
                    <p className="text-gray-700">{formatDate(selectedApp.appliedAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Follow-up</p>
                    <p className={selectedApp.nextFollowUpAt && isFollowUpOverdue(selectedApp) ? 'text-red-600 font-medium' : 'text-gray-700'}>
                      {formatDate(selectedApp.nextFollowUpAt)}
                    </p>
                  </div>
                  {selectedApp.resumeVersion && (
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Resume</p>
                      <p className="text-gray-700">{selectedApp.resumeVersion}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="border-t pt-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">
                Notes ({selectedApp.notes.length})
              </p>
              <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                {selectedApp.notes.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No notes yet — add interview notes, recruiter info, etc.</p>
                ) : (
                  [...selectedApp.notes]
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
              <div className="flex gap-2">
                <textarea
                  value={newNoteText}
                  onChange={e => setNewNoteText(e.target.value)}
                  placeholder="Add a note (interview feedback, recruiter details, next steps...)"
                  rows={2}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 resize-none"
                />
                <Button size="sm" onClick={handleAddNote} loading={isSavingNote} disabled={!newNoteText.trim()}>
                  Add
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 border-t pt-4">
              <Button
                variant="outline"
                onClick={() => { setShowDetailModal(false); openFormModal(selectedApp); }}
                leftIcon={<PencilIcon className="h-4 w-4" />}
                fullWidth
              >
                Edit
              </Button>
              {selectedApp.contactEmail && (
                <Button
                  variant="outline"
                  onClick={() => { window.location.href = `mailto:${selectedApp.contactEmail}`; }}
                  leftIcon={<EnvelopeIcon className="h-4 w-4" />}
                  fullWidth
                >
                  Email
                </Button>
              )}
              <Button
                variant="danger"
                onClick={() => handleDelete(selectedApp)}
                leftIcon={<TrashIcon className="h-4 w-4" />}
                fullWidth
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={editingApp ? 'Edit Application' : 'Add Application'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
              <Input value={formCompany} onChange={e => setFormCompany(e.target.value)} placeholder="e.g. Google" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <Input value={formRole} onChange={e => setFormRole(e.target.value)} placeholder="e.g. Senior Software Engineer" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <Input value={formLocation} onChange={e => setFormLocation(e.target.value)} placeholder="e.g. New York, NY" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location Type</label>
              <select
                value={formLocationType}
                onChange={e => setFormLocationType(e.target.value as LocationType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                {Object.values(LocationType).map(t => (
                  <option key={t} value={t}>{LOCATION_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formStatus}
                onChange={e => setFormStatus(e.target.value as ApplicationStatus)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                {Object.values(ApplicationStatus).map(s => (
                  <option key={s} value={s}>{APPLICATION_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <select
                value={formSource}
                onChange={e => setFormSource(e.target.value as ApplicationSource)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                {Object.values(ApplicationSource).map(s => (
                  <option key={s} value={s}>{APPLICATION_SOURCE_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Applied</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={formAppliedAt}
                  onChange={e => setFormAppliedAt(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Next Follow-up</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={formFollowUp}
                  onChange={e => setFormFollowUp(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Posting URL</label>
              <div className="relative">
                <GlobeAltIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input value={formUrl} onChange={e => setFormUrl(e.target.value)} placeholder="https://..." className="pl-9" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salary Min ($)</label>
              <Input type="number" value={formSalaryMin} onChange={e => setFormSalaryMin(e.target.value)} placeholder="80000" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salary Max ($)</label>
              <Input type="number" value={formSalaryMax} onChange={e => setFormSalaryMax(e.target.value)} placeholder="120000" min="0" />
            </div>
            {showOfferField && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Salary Offered ($)</label>
                <Input type="number" value={formSalaryOffered} onChange={e => setFormSalaryOffered(e.target.value)} placeholder="100000" min="0" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
              <Input value={formContactName} onChange={e => setFormContactName(e.target.value)} placeholder="Recruiter or hiring manager" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <Input type="email" value={formContactEmail} onChange={e => setFormContactEmail(e.target.value)} placeholder="recruiter@company.com" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Resume Version</label>
              <Input value={formResumeVersion} onChange={e => setFormResumeVersion(e.target.value)} placeholder="e.g. v3 - Senior SWE focus" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowFormModal(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={isSaving}>
              {editingApp ? 'Save Changes' : 'Add Application'}
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
  color,
  alert,
}: {
  title: string;
  value: number | string;
  color: string;
  alert?: boolean;
}) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    amber: 'text-amber-600',
    gray: 'text-gray-400',
  };
  return (
    <Card>
      <div className="p-4 flex items-center gap-3">
        {alert && <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />}
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold mt-0.5 ${colorMap[color] || 'text-gray-900'}`}>{value}</p>
        </div>
      </div>
    </Card>
  );
}
