'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  createActivity,
  startTimer,
  stopTimer,
  pauseTimer,
  resumeTimer,
  getActivities,
  getRunningTimer,
  updateActivity,
  deleteActivity,
  getActivityStats,
  formatDuration,
  formatElapsed,
  getElapsedSeconds,
} from '@/services/activity-service';
import { getProspects } from '@/services/prospect-service';
import {
  ActivityEntry,
  ActivityCategory,
  ActivityStats,
  CreateActivityData,
  ACTIVITY_CATEGORY_LABELS,
  ACTIVITY_CATEGORY_COLORS,
} from '@/types/activity';
import { Prospect } from '@/types/prospect';
import { Timestamp } from 'firebase/firestore';
import {
  ClockIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  StopIcon,
  PlayIcon,
  PauseIcon,
  CalendarIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { collection, getDocs, query, orderBy as fbOrderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

type DateRangeFilter = 'today' | 'week' | 'month' | 'all';
type LogMode = 'duration' | 'timer';

export default function ActivityPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<ActivityEntry[]>([]);
  const [stats, setStats] = useState<ActivityStats>({
    todayMinutes: 0,
    weekMinutes: 0,
    monthMinutes: 0,
    byCategory: {},
  });
  const [runningTimer, setRunningTimer] = useState<ActivityEntry | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<ActivityCategory | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>('week');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [showLogModal, setShowLogModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ActivityEntry | null>(null);

  // Form state
  const [logMode, setLogMode] = useState<LogMode>('duration');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<ActivityCategory>(ActivityCategory.CLIENT_WORK);
  const [formDescription, setFormDescription] = useState('');
  const [formHours, setFormHours] = useState('0');
  const [formMinutes, setFormMinutes] = useState('30');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTime, setFormTime] = useState(new Date().toTimeString().slice(0, 5));
  const [formLinkedType, setFormLinkedType] = useState<'none' | 'prospect' | 'proposal' | 'invoice'>('none');
  const [formLinkedId, setFormLinkedId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Linked items for dropdowns
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [proposals, setProposals] = useState<{ id: string; title: string }[]>([]);
  const [invoices, setInvoices] = useState<{ id: string; invoiceNumber: string }[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [allEntries, activityStats, timer] = await Promise.all([
        getActivities(user.uid),
        getActivityStats(user.uid),
        getRunningTimer(user.uid),
      ]);
      setEntries(allEntries);
      setStats(activityStats);
      setRunningTimer(timer);
      if (timer) setElapsedSeconds(getElapsedSeconds(timer));
    } catch {
      showToast('Failed to load activity data', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  const loadLinkableItems = useCallback(async () => {
    try {
      const [prospectList, proposalSnap, invoiceSnap] = await Promise.all([
        getProspects(),
        getDocs(query(collection(db, 'proposals'), fbOrderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'invoices'), fbOrderBy('createdAt', 'desc'))),
      ]);
      setProspects(prospectList);
      setProposals(
        proposalSnap.docs.map(d => ({
          id: d.id,
          title: (d.data().title as string) || (d.data().client?.name as string) || d.id,
        }))
      );
      setInvoices(
        invoiceSnap.docs.map(d => ({
          id: d.id,
          invoiceNumber: (d.data().invoiceNumber as string) || d.id,
        }))
      );
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    loadData();
    loadLinkableItems();
  }, [loadData, loadLinkableItems]);

  // Tick the running timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (runningTimer && !runningTimer.isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(getElapsedSeconds(runningTimer));
      }, 1000);
    } else if (runningTimer?.isPaused) {
      setElapsedSeconds(Math.floor(runningTimer.accumulatedMs / 1000));
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [runningTimer]);

  // Filter entries
  useEffect(() => {
    let result = [...entries];
    if (categoryFilter !== 'all') result = result.filter(e => e.category === categoryFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        e =>
          (e.title || '').toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q)
      );
    }
    const now = new Date();
    if (dateFilter === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      result = result.filter(e => e.startTime.toMillis() >= start);
    } else if (dateFilter === 'week') {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      result = result.filter(e => e.startTime.toMillis() >= weekStart.getTime());
    } else if (dateFilter === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      result = result.filter(e => e.startTime.toMillis() >= monthStart);
    }
    setFilteredEntries(result);
  }, [entries, categoryFilter, dateFilter, searchQuery]);

  const openLogModal = (entry?: ActivityEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setFormTitle(entry.title || '');
      setFormCategory(entry.category);
      setFormDescription(entry.description);
      setFormHours(String(Math.floor(entry.durationMinutes / 60)));
      setFormMinutes(String(entry.durationMinutes % 60));
      const d = entry.startTime.toDate();
      setFormDate(d.toISOString().split('T')[0]);
      setFormTime(d.toTimeString().slice(0, 5));
      setLogMode('duration');
      if (entry.linkedProspectId) {
        setFormLinkedType('prospect');
        setFormLinkedId(entry.linkedProspectId);
      } else if (entry.linkedProposalId) {
        setFormLinkedType('proposal');
        setFormLinkedId(entry.linkedProposalId);
      } else if (entry.linkedInvoiceId) {
        setFormLinkedType('invoice');
        setFormLinkedId(entry.linkedInvoiceId);
      } else {
        setFormLinkedType('none');
        setFormLinkedId('');
      }
    } else {
      setEditingEntry(null);
      setFormTitle('');
      setFormCategory(ActivityCategory.CLIENT_WORK);
      setFormDescription('');
      setFormHours('0');
      setFormMinutes('30');
      setFormDate(new Date().toISOString().split('T')[0]);
      setFormTime(new Date().toTimeString().slice(0, 5));
      setFormLinkedType('none');
      setFormLinkedId('');
      setLogMode('duration');
    }
    setShowLogModal(true);
  };

  const resolveLinkedFields = () => {
    if (formLinkedType === 'prospect' && formLinkedId) {
      const p = prospects.find(x => x.id === formLinkedId);
      return { linkedProspectId: formLinkedId, linkedProspectName: p?.name || '' };
    }
    if (formLinkedType === 'proposal' && formLinkedId) {
      const p = proposals.find(x => x.id === formLinkedId);
      return { linkedProposalId: formLinkedId, linkedProposalTitle: p?.title || '' };
    }
    if (formLinkedType === 'invoice' && formLinkedId) {
      const inv = invoices.find(x => x.id === formLinkedId);
      return { linkedInvoiceId: formLinkedId, linkedInvoiceNumber: inv?.invoiceNumber || '' };
    }
    return {};
  };

  const handleSave = async () => {
    if (!user || !formTitle.trim()) {
      showToast('Please enter a title', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const linkedFields = resolveLinkedFields();

      if (editingEntry) {
        const updates: Parameters<typeof updateActivity>[1] = {
          title: formTitle.trim(),
          category: formCategory,
          description: formDescription.trim(),
          linkedProspectId: undefined,
          linkedProspectName: undefined,
          linkedProposalId: undefined,
          linkedProposalTitle: undefined,
          linkedInvoiceId: undefined,
          linkedInvoiceNumber: undefined,
          ...linkedFields,
        };
        // Only update duration/time when not running
        if (!editingEntry.isRunning) {
          const totalMinutes = parseInt(formHours || '0') * 60 + parseInt(formMinutes || '0');
          const startDate = new Date(`${formDate}T${formTime}`);
          updates.durationMinutes = Math.max(1, totalMinutes);
          updates.startTime = Timestamp.fromDate(startDate);
        }
        await updateActivity(editingEntry.id, updates);
        showToast('Activity updated', 'success');
      } else if (logMode === 'duration') {
        const totalMinutes = parseInt(formHours || '0') * 60 + parseInt(formMinutes || '0');
        if (totalMinutes < 1) {
          showToast('Duration must be at least 1 minute', 'error');
          setIsSaving(false);
          return;
        }
        const startDate = new Date(`${formDate}T${formTime}`);
        const data: CreateActivityData = {
          title: formTitle.trim(),
          category: formCategory,
          description: formDescription.trim(),
          durationMinutes: totalMinutes,
          startTime: Timestamp.fromDate(startDate),
          ...linkedFields,
        };
        await createActivity(user.uid, user.name, data);
        showToast('Activity logged', 'success');
      } else {
        // Start timer mode
        await startTimer(user.uid, user.name, {
          title: formTitle.trim(),
          category: formCategory,
          description: formDescription.trim(),
          ...linkedFields,
        });
        showToast('Timer started', 'success');
      }

      setShowLogModal(false);
      loadData();
    } catch {
      showToast('Failed to save activity', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStopTimer = async () => {
    if (!runningTimer) return;
    try {
      await stopTimer(runningTimer.id, runningTimer);
      showToast('Timer stopped', 'success');
      loadData();
    } catch {
      showToast('Failed to stop timer', 'error');
    }
  };

  const handlePauseTimer = async () => {
    if (!runningTimer || runningTimer.isPaused) return;
    try {
      await pauseTimer(runningTimer.id, runningTimer);
      loadData();
    } catch {
      showToast('Failed to pause timer', 'error');
    }
  };

  const handleResumeTimer = async () => {
    if (!runningTimer || !runningTimer.isPaused) return;
    try {
      await resumeTimer(runningTimer.id);
      loadData();
    } catch {
      showToast('Failed to resume timer', 'error');
    }
  };

  const handleDelete = async (entry: ActivityEntry) => {
    if (!confirm('Delete this activity entry?')) return;
    try {
      await deleteActivity(entry.id);
      showToast('Activity deleted', 'success');
      loadData();
    } catch {
      showToast('Failed to delete activity', 'error');
    }
  };

  const formatEntryDate = (ts: Timestamp) =>
    ts.toDate().toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const linkedItemOptions =
    formLinkedType === 'prospect'
      ? prospects.map(p => ({ id: p.id, label: `${p.name}${p.company ? ` (${p.company})` : ''}` }))
      : formLinkedType === 'proposal'
      ? proposals.map(p => ({ id: p.id, label: p.title }))
      : formLinkedType === 'invoice'
      ? invoices.map(i => ({ id: i.id, label: i.invoiceNumber }))
      : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activity Tracker</h1>
          <p className="text-gray-600 mt-1">Log and track time spent on work</p>
        </div>
        <Button onClick={() => openLogModal()} leftIcon={<PlusIcon className="h-4 w-4" />}>
          Log Activity
        </Button>
      </div>

      {/* Active timer banner */}
      {runningTimer && (
        <div className={`border rounded-xl p-4 flex items-center justify-between ${
          runningTimer.isPaused
            ? 'bg-amber-50 border-amber-200'
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              runningTimer.isPaused ? 'bg-amber-500' : 'bg-green-500 animate-pulse'
            }`} />
            <div>
              <div className="flex items-center gap-2">
                <p className={`font-semibold ${runningTimer.isPaused ? 'text-amber-900' : 'text-green-900'}`}>
                  {runningTimer.title}
                </p>
                {runningTimer.isPaused && (
                  <Badge variant="warning" size="sm">Paused</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge
                  variant={ACTIVITY_CATEGORY_COLORS[runningTimer.category] as Parameters<typeof Badge>[0]['variant']}
                  size="sm"
                >
                  {ACTIVITY_CATEGORY_LABELS[runningTimer.category]}
                </Badge>
                {runningTimer.description && (
                  <span className={`text-sm ${runningTimer.isPaused ? 'text-amber-700' : 'text-green-700'}`}>
                    {runningTimer.description}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-2xl font-mono font-bold ${
              runningTimer.isPaused ? 'text-amber-800' : 'text-green-800'
            }`}>
              {formatElapsed(elapsedSeconds)}
            </span>
            <button
              onClick={() => openLogModal(runningTimer)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/60 rounded-lg transition-colors"
              title="Edit activity"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            {runningTimer.isPaused ? (
              <Button size="sm" onClick={handleResumeTimer} leftIcon={<PlayIcon className="h-4 w-4" />}>
                Resume
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handlePauseTimer}
                leftIcon={<PauseIcon className="h-4 w-4" />}
              >
                Pause
              </Button>
            )}
            <Button
              variant="danger"
              size="sm"
              onClick={handleStopTimer}
              leftIcon={<StopIcon className="h-4 w-4" />}
            >
              Stop
            </Button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today" minutes={stats.todayMinutes} color="blue" />
        <StatCard title="This Week" minutes={stats.weekMinutes} color="green" />
        <StatCard title="This Month" minutes={stats.monthMinutes} color="purple" />
        <Card>
          <div className="p-4">
            <p className="text-sm font-medium text-gray-600">Top Category (Month)</p>
            {Object.keys(stats.byCategory).length > 0 ? (() => {
              const top = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1])[0];
              return (
                <>
                  <p className="text-xl font-bold text-gray-900 mt-1">{formatDuration(top[1])}</p>
                  <Badge
                    variant={ACTIVITY_CATEGORY_COLORS[top[0] as ActivityCategory] as Parameters<typeof Badge>[0]['variant']}
                    size="sm"
                    className="mt-1"
                  >
                    {ACTIVITY_CATEGORY_LABELS[top[0] as ActivityCategory]}
                  </Badge>
                </>
              );
            })() : (
              <p className="text-xl font-bold text-gray-400 mt-1">—</p>
            )}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search by title or description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value as ActivityCategory | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Categories</option>
            {Object.values(ActivityCategory).map(c => (
              <option key={c} value={c}>{ACTIVITY_CATEGORY_LABELS[c]}</option>
            ))}
          </select>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(['today', 'week', 'month', 'all'] as DateRangeFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setDateFilter(f)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  dateFilter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {f === 'all' ? 'All time' : f === 'week' ? 'This week' : f === 'month' ? 'This month' : 'Today'}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Activity table */}
      <Card>
        {filteredEntries.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <ClockIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No activity entries found</p>
            <p className="text-sm mt-1">Click &quot;Log Activity&quot; to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Time Start</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEntries.map(entry => {
                  const startDate = entry.startTime.toDate();
                  const dateStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  const timeStr = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                  const isActive = entry.isRunning && !entry.isPaused;
                  const rowBg = isActive ? 'bg-green-50/40' : entry.isPaused ? 'bg-amber-50/40' : '';

                  return (
                    <tr key={entry.id} className={`hover:bg-gray-50 transition-colors ${rowBg}`}>
                      {/* Date */}
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{dateStr}</td>

                      {/* Category */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge
                          variant={ACTIVITY_CATEGORY_COLORS[entry.category] as Parameters<typeof Badge>[0]['variant']}
                          size="sm"
                        >
                          {ACTIVITY_CATEGORY_LABELS[entry.category]}
                        </Badge>
                      </td>

                      {/* Title */}
                      <td className="px-4 py-3 max-w-xs">
                        <p className="font-medium text-gray-900 truncate">{entry.title}</p>
                        {entry.description && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">{entry.description}</p>
                        )}
                        {(entry.linkedProspectId || entry.linkedProposalId || entry.linkedInvoiceId) && (
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                            <LinkIcon className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                              {entry.linkedProspectName && `Prospect: ${entry.linkedProspectName}`}
                              {entry.linkedProposalTitle && `Proposal: ${entry.linkedProposalTitle}`}
                              {entry.linkedInvoiceNumber && `Invoice: ${entry.linkedInvoiceNumber}`}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Time Start */}
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{timeStr}</td>

                      {/* Duration */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`font-mono font-medium ${isActive ? 'text-green-700' : entry.isPaused ? 'text-amber-700' : 'text-gray-800'}`}>
                          {entry.isRunning ? formatElapsed(elapsedSeconds) : formatDuration(entry.durationMinutes)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isActive && <Badge variant="success" size="sm">Active</Badge>}
                        {entry.isPaused && <Badge variant="warning" size="sm">Paused</Badge>}
                        {!entry.isRunning && <Badge variant="default" size="sm">Completed</Badge>}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openLogModal(entry)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          {entry.isRunning && (
                            entry.isPaused ? (
                              <button
                                onClick={handleResumeTimer}
                                className="p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors"
                                title="Resume"
                              >
                                <PlayIcon className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={handlePauseTimer}
                                className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                title="Pause"
                              >
                                <PauseIcon className="h-4 w-4" />
                              </button>
                            )
                          )}
                          {entry.isRunning ? (
                            <button
                              onClick={handleStopTimer}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Stop"
                            >
                              <StopIcon className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDelete(entry)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {filteredEntries.length > 0 && (
        <p className="text-sm text-gray-500">
          {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'} &middot;{' '}
          {formatDuration(filteredEntries.filter(e => !e.isRunning).reduce((sum, e) => sum + e.durationMinutes, 0))} total
        </p>
      )}

      {/* Log / Edit Activity Modal */}
      <Modal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        title={editingEntry ? 'Edit Activity' : 'Log Activity'}
        size="md"
      >
        <div className="space-y-4">
          {/* Mode toggle — only shown when creating new */}
          {!editingEntry && (
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setLogMode('duration')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors ${
                  logMode === 'duration' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
                }`}
              >
                <ClockIcon className="h-4 w-4" /> Enter Duration
              </button>
              <button
                onClick={() => setLogMode('timer')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors ${
                  logMode === 'timer' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
                }`}
              >
                <PlayIcon className="h-4 w-4" /> Start Timer
              </button>
            </div>
          )}

          {/* Running notice */}
          {editingEntry?.isRunning && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-800">
              Timer is active — duration is calculated automatically and cannot be edited while running.
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <Input
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              placeholder="e.g. Client call with John"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={formCategory}
              onChange={e => setFormCategory(e.target.value as ActivityCategory)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {Object.values(ActivityCategory).map(c => (
                <option key={c} value={c}>{ACTIVITY_CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </div>

          {/* Description / notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
              rows={2}
              placeholder="Additional details..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>

          {/* Duration fields — only in duration mode, and not when editing a running entry */}
          {((!editingEntry && logMode === 'duration') || (editingEntry && !editingEntry.isRunning)) && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    value={formHours}
                    onChange={e => setFormHours(e.target.value)}
                    min="0"
                    className="w-20"
                  />
                  <span className="text-sm text-gray-600">hrs</span>
                  <Input
                    type="number"
                    value={formMinutes}
                    onChange={e => setFormMinutes(e.target.value)}
                    min="0"
                    max="59"
                    className="w-20"
                  />
                  <span className="text-sm text-gray-600">min</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={e => setFormTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Link to */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link to (optional)</label>
            <div className="flex gap-2">
              <select
                value={formLinkedType}
                onChange={e => {
                  setFormLinkedType(e.target.value as typeof formLinkedType);
                  setFormLinkedId('');
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="none">None</option>
                <option value="prospect">Prospect</option>
                <option value="proposal">Proposal</option>
                <option value="invoice">Invoice</option>
              </select>
              {formLinkedType !== 'none' && (
                <select
                  value={formLinkedId}
                  onChange={e => setFormLinkedId(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select {formLinkedType}…</option>
                  {linkedItemOptions.map(item => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowLogModal(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              loading={isSaving}
              leftIcon={logMode === 'timer' && !editingEntry ? <PlayIcon className="h-4 w-4" /> : undefined}
            >
              {editingEntry ? 'Save Changes' : logMode === 'timer' ? 'Start Timer' : 'Log Activity'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function StatCard({ title, minutes, color }: { title: string; minutes: number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
  };
  return (
    <Card>
      <div className="p-4">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className={`text-2xl font-bold mt-1 ${colorMap[color] || 'text-gray-900'}`}>
          {formatDuration(minutes)}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{minutes} minutes</p>
      </div>
    </Card>
  );
}
