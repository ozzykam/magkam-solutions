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
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from '@/services/project-service';
import { getProspects } from '@/services/prospect-service';
import {
  Project,
  ProjectStatus,
  ProjectType,
  ProjectPriority,
  CreateProjectData,
  PROJECT_STATUS_LABELS,
  PROJECT_PRIORITY_LABELS,
  PROJECT_TYPE_LABELS,
  PROJECT_STATUS_COLORS,
  PROJECT_PRIORITY_COLORS,
} from '@/types/project';
import { Prospect } from '@/types/prospect';
import { Timestamp } from 'firebase/firestore';
import {
  PlusIcon,
  FolderIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

const ACTIVE_STATUSES = [ProjectStatus.PLANNING, ProjectStatus.IN_PROGRESS, ProjectStatus.REVIEW, ProjectStatus.ON_HOLD];
const DONE_STATUSES = [ProjectStatus.COMPLETED, ProjectStatus.CANCELLED];

function deadlineClass(deadline: Timestamp, status: ProjectStatus): string {
  if (DONE_STATUSES.includes(status)) return 'text-gray-400';
  const now = Date.now();
  const ms = deadline.toMillis();
  if (ms < now) return 'text-red-600 font-semibold';
  if (ms - now < 7 * 24 * 60 * 60 * 1000) return 'text-amber-600 font-semibold';
  return 'text-gray-600';
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ProjectType | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<ProjectPriority | 'all'>('all');

  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<ProjectType>(ProjectType.CLIENT);
  const [formStatus, setFormStatus] = useState<ProjectStatus>(ProjectStatus.PLANNING);
  const [formPriority, setFormPriority] = useState<ProjectPriority>(ProjectPriority.MEDIUM);
  const [formDeadline, setFormDeadline] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formProgress, setFormProgress] = useState(0);
  const [formLinkedProspectId, setFormLinkedProspectId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [projectList, prospectList] = await Promise.all([
        getProjects(),
        getProspects(),
      ]);
      setProjects(projectList);
      setProspects(prospectList);
    } catch {
      showToast('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = projects.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (typeFilter !== 'all' && p.type !== typeFilter) return false;
    if (priorityFilter !== 'all' && p.priority !== priorityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    }
    return true;
  });

  const now = Date.now();
  const activeProjects = projects.filter(p => ACTIVE_STATUSES.includes(p.status));
  const overdueProjects = projects.filter(
    p => !DONE_STATUSES.includes(p.status) && p.deadline.toMillis() < now
  );
  const dueThisWeek = projects.filter(
    p => !DONE_STATUSES.includes(p.status) && p.deadline.toMillis() >= now && p.deadline.toMillis() < now + 7 * 86400000
  );
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const completedThisMonth = projects.filter(
    p => p.status === ProjectStatus.COMPLETED && p.updatedAt.toMillis() >= monthStart.getTime()
  );

  const openModal = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormName(project.name);
      setFormDescription(project.description);
      setFormType(project.type);
      setFormStatus(project.status);
      setFormPriority(project.priority);
      setFormDeadline(project.deadline.toDate().toISOString().split('T')[0]);
      setFormStartDate(project.startDate ? project.startDate.toDate().toISOString().split('T')[0] : '');
      setFormProgress(project.progress);
      setFormLinkedProspectId(project.linkedProspectId || '');
    } else {
      setEditingProject(null);
      setFormName('');
      setFormDescription('');
      setFormType(ProjectType.CLIENT);
      setFormStatus(ProjectStatus.PLANNING);
      setFormPriority(ProjectPriority.MEDIUM);
      setFormDeadline('');
      setFormStartDate('');
      setFormProgress(0);
      setFormLinkedProspectId('');
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!user || !formName.trim() || !formDeadline) {
      showToast('Name and deadline are required', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const linkedProspect = prospects.find(p => p.id === formLinkedProspectId);
      const data: CreateProjectData = {
        name: formName.trim(),
        description: formDescription.trim(),
        type: formType,
        status: formStatus,
        priority: formPriority,
        deadline: Timestamp.fromDate(new Date(formDeadline)),
        progress: formProgress,
        ...(formStartDate && { startDate: Timestamp.fromDate(new Date(formStartDate)) }),
        ...(formLinkedProspectId && { linkedProspectId: formLinkedProspectId, linkedProspectName: linkedProspect?.name || '' }),
      };

      if (editingProject) {
        await updateProject(editingProject.id, data);
        showToast('Project updated', 'success');
      } else {
        await createProject(data, user.uid);
        showToast('Project created', 'success');
      }
      setShowModal(false);
      loadData();
    } catch {
      showToast('Failed to save project', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (project: Project) => {
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    try {
      await deleteProject(project.id);
      showToast('Project deleted', 'success');
      loadData();
    } catch {
      showToast('Failed to delete project', 'error');
    }
  };

  const formatDate = (ts: Timestamp) =>
    ts.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

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
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">Track deadlines and progress for client and internal work</p>
        </div>
        <Button onClick={() => openModal()} leftIcon={<PlusIcon className="h-4 w-4" />}>
          New Project
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active" value={activeProjects.length} color="blue" />
        <StatCard
          title="Overdue"
          value={overdueProjects.length}
          color={overdueProjects.length > 0 ? 'red' : 'green'}
          alert={overdueProjects.length > 0}
        />
        <StatCard title="Due This Week" value={dueThisWeek.length} color={dueThisWeek.length > 0 ? 'amber' : 'green'} />
        <StatCard title="Completed This Month" value={completedThisMonth.length} color="green" />
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4 flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as ProjectStatus | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Statuses</option>
            {Object.values(ProjectStatus).map(s => (
              <option key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as ProjectType | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Types</option>
            {Object.values(ProjectType).map(t => (
              <option key={t} value={t}>{PROJECT_TYPE_LABELS[t]}</option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value as ProjectPriority | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Priorities</option>
            {Object.values(ProjectPriority).map(p => (
              <option key={p} value={p}>{PROJECT_PRIORITY_LABELS[p]}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FolderIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>{searchQuery || statusFilter !== 'all' ? 'No projects match your filters' : 'No projects yet'}</p>
            <p className="text-sm mt-1">Click &quot;New Project&quot; to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-32">Progress</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Deadline</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Client</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(project => (
                  <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                    {/* Name */}
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium text-gray-900 truncate">{project.name}</p>
                      {project.description && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{project.description}</p>
                      )}
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant={project.type === ProjectType.CLIENT ? 'info' : 'default'} size="sm">
                        {PROJECT_TYPE_LABELS[project.type]}
                      </Badge>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge
                        variant={PROJECT_STATUS_COLORS[project.status] as Parameters<typeof Badge>[0]['variant']}
                        size="sm"
                      >
                        {PROJECT_STATUS_LABELS[project.status]}
                      </Badge>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge
                        variant={PROJECT_PRIORITY_COLORS[project.priority] as Parameters<typeof Badge>[0]['variant']}
                        size="sm"
                      >
                        {PROJECT_PRIORITY_LABELS[project.priority]}
                      </Badge>
                    </td>

                    {/* Progress */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-16">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              project.status === ProjectStatus.COMPLETED
                                ? 'bg-green-500'
                                : project.status === ProjectStatus.CANCELLED
                                ? 'bg-gray-400'
                                : 'bg-primary-500'
                            }`}
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">{project.progress}%</span>
                      </div>
                    </td>

                    {/* Deadline */}
                    <td className={`px-4 py-3 whitespace-nowrap text-sm ${deadlineClass(project.deadline, project.status)}`}>
                      <div className="flex items-center gap-1">
                        {!DONE_STATUSES.includes(project.status) && project.deadline.toMillis() < now && (
                          <ExclamationTriangleIcon className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                        )}
                        {formatDate(project.deadline)}
                      </div>
                    </td>

                    {/* Client */}
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {project.linkedProspectName || <span className="text-gray-300">—</span>}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openModal(project)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(project)}
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
          {filtered.length} of {projects.length} projects
        </p>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProject ? 'Edit Project' : 'New Project'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <Input
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="e.g. Website Redesign for Acme Corp"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                rows={2}
                placeholder="Brief description of scope and goals..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={formType}
                onChange={e => setFormType(e.target.value as ProjectType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {Object.values(ProjectType).map(t => (
                  <option key={t} value={t}>{PROJECT_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formStatus}
                onChange={e => setFormStatus(e.target.value as ProjectStatus)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {Object.values(ProjectStatus).map(s => (
                  <option key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formPriority}
                onChange={e => setFormPriority(e.target.value as ProjectPriority)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {Object.values(ProjectPriority).map(p => (
                  <option key={p} value={p}>{PROJECT_PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link to Prospect</label>
              <select
                value={formLinkedProspectId}
                onChange={e => setFormLinkedProspectId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">None</option>
                {prospects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}{p.company ? ` (${p.company})` : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={formStartDate}
                  onChange={e => setFormStartDate(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline *</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={formDeadline}
                  onChange={e => setFormDeadline(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Progress — <span className="text-primary-600 font-semibold">{formProgress}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={formProgress}
                onChange={e => setFormProgress(Number(e.target.value))}
                className="w-full accent-primary-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={isSaving}>
              {editingProject ? 'Save Changes' : 'Create Project'}
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
  value: number;
  color: string;
  alert?: boolean;
}) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    amber: 'text-amber-600',
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
