'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  getProjectById,
  updateProject,
  deleteProject,
  addProjectPayment,
} from '@/services/project-service';
import { getInvoices } from '@/services/invoice-service';
import { getActivitiesByLinkedProject, formatDuration } from '@/services/activity-service';
import { getClients } from '@/services/client-service';
import {
  Project,
  ProjectType,
  ProjectStatus,
  ProjectPriority,
  ProjectPayment,
  calculateProjectAmountPaid,
  PROJECT_STATUS_LABELS,
  PROJECT_PRIORITY_LABELS,
  PROJECT_TYPE_LABELS,
  PROJECT_STATUS_COLORS,
  PROJECT_PRIORITY_COLORS,
} from '@/types/project';
import { Client } from '@/types/client';
import { Invoice, InvoiceStatus } from '@/types/invoice';
import { ActivityEntry, ACTIVITY_CATEGORY_LABELS } from '@/types/activity';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

const INVOICE_STATUS_COLORS: Record<InvoiceStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  [InvoiceStatus.DRAFT]: 'default',
  [InvoiceStatus.SENT]: 'info',
  [InvoiceStatus.VIEWED]: 'warning',
  [InvoiceStatus.PAID]: 'success',
  [InvoiceStatus.PARTIALLY_PAID]: 'warning',
  [InvoiceStatus.OVERDUE]: 'error',
  [InvoiceStatus.CANCELLED]: 'error',
};

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [linkedInvoices, setLinkedInvoices] = useState<Invoice[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<ProjectType>(ProjectType.CLIENT);
  const [formStatus, setFormStatus] = useState<ProjectStatus>(ProjectStatus.PLANNING);
  const [formPriority, setFormPriority] = useState<ProjectPriority>(ProjectPriority.MEDIUM);
  const [formDeadline, setFormDeadline] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formProgress, setFormProgress] = useState(0);
  const [formScopeAmount, setFormScopeAmount] = useState('');
  const [formLinkedClientId, setFormLinkedClientId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payMethod, setPayMethod] = useState<ProjectPayment['method']>('other');
  const [payNote, setPayNote] = useState('');
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  const loadData = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const p = await getProjectById(id);
      setProject(p);
      if (p) {
        const [invoices, acts] = await Promise.all([
          getInvoices({ linkedProjectId: p.id }),
          getActivitiesByLinkedProject(p.id),
        ]);
        setLinkedInvoices(invoices);
        setActivities(acts);
      }
    } catch {
      showToast('Failed to load project', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (params.id) loadData(params.id as string);
  }, [params.id, loadData]);

  useEffect(() => {
    getClients().then(setClients).catch(() => {});
  }, []);

  const hasLinkedInvoices = linkedInvoices.length > 0;

  const financials = useMemo(() => {
    if (!project) return { billed: 0, received: 0, balance: 0 };
    if (hasLinkedInvoices) {
      const billed = linkedInvoices.reduce((sum, inv) => sum + inv.total, 0);
      const received = linkedInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
      return { billed, received, balance: billed - received };
    }
    const billed = project.scopeAmount || 0;
    const received = calculateProjectAmountPaid(project.payments);
    return { billed, received, balance: billed - received };
  }, [project, linkedInvoices, hasLinkedInvoices]);

  const formatDate = (ts?: Timestamp | null) => {
    if (!ts) return '—';
    return ts.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const openEditModal = () => {
    if (!project) return;
    setFormName(project.name);
    setFormDescription(project.description);
    setFormType(project.type);
    setFormStatus(project.status);
    setFormPriority(project.priority);
    setFormDeadline(project.deadline.toDate().toISOString().split('T')[0]);
    setFormStartDate(project.startDate ? project.startDate.toDate().toISOString().split('T')[0] : '');
    setFormProgress(project.progress);
    setFormScopeAmount(project.scopeAmount !== undefined ? String(project.scopeAmount) : '');
    setFormLinkedClientId(project.linkedClientId || '');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!project || !formName.trim() || !formDeadline) {
      showToast('Name and deadline are required', 'error');
      return;
    }
    setIsSaving(true);
    try {
      await updateProject(project.id, {
        name: formName.trim(),
        description: formDescription.trim(),
        type: formType,
        status: formStatus,
        priority: formPriority,
        deadline: Timestamp.fromDate(new Date(formDeadline)),
        ...(formStartDate && { startDate: Timestamp.fromDate(new Date(formStartDate)) }),
        progress: formProgress,
        ...(formScopeAmount && { scopeAmount: parseFloat(formScopeAmount) }),
        ...(formLinkedClientId && {
          linkedClientId: formLinkedClientId,
          linkedClientName: clients.find(c => c.id === formLinkedClientId)?.name || '',
        }),
      });
      showToast('Project updated', 'success');
      setShowEditModal(false);
      loadData(project.id);
    } catch {
      showToast('Failed to update project', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;
    try {
      await deleteProject(project.id);
      showToast('Project deleted', 'success');
      router.push(project.linkedClientId ? `/admin/clients/${project.linkedClientId}` : '/admin/projects');
    } catch {
      showToast('Failed to delete project', 'error');
    }
  };

  const handleLogPayment = async () => {
    if (!user || !project || !payAmount || parseFloat(payAmount) <= 0) {
      showToast('Enter a valid payment amount', 'error');
      return;
    }
    setIsSavingPayment(true);
    try {
      await addProjectPayment(project.id, {
        amount: parseFloat(payAmount),
        paidAt: Timestamp.fromDate(new Date(payDate)),
        method: payMethod,
        ...(payNote.trim() && { note: payNote.trim() }),
        recordedBy: user.uid,
        recordedByName: user.name,
      });
      showToast('Payment logged', 'success');
      setShowPaymentModal(false);
      setPayAmount('');
      setPayNote('');
      loadData(project.id);
    } catch {
      showToast('Failed to log payment', 'error');
    } finally {
      setIsSavingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Project not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/admin/projects')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeftIcon className="h-4 w-4" /> Back to Projects
        </button>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <Badge variant={PROJECT_STATUS_COLORS[project.status] as Parameters<typeof Badge>[0]['variant']}>
                {PROJECT_STATUS_LABELS[project.status]}
              </Badge>
              <Badge variant={PROJECT_PRIORITY_COLORS[project.priority] as Parameters<typeof Badge>[0]['variant']}>
                {PROJECT_PRIORITY_LABELS[project.priority]}
              </Badge>
            </div>
            {project.description && <p className="text-gray-600 mt-1">{project.description}</p>}
            {project.linkedClientId && (
              <button
                onClick={() => router.push(`/admin/clients/${project.linkedClientId}`)}
                className="text-sm text-primary-600 hover:underline mt-1"
              >
                Client: {project.linkedClientName}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={openEditModal} leftIcon={<PencilIcon className="h-4 w-4" />}>
              Edit
            </Button>
            <Button variant="danger" onClick={() => setShowDeleteDialog(true)} leftIcon={<TrashIcon className="h-4 w-4" />}>
              Delete
            </Button>
          </div>
        </div>

        {/* Progress + deadline */}
        <div className="mt-4 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-48">
            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${
                  project.status === ProjectStatus.COMPLETED ? 'bg-green-500' : 'bg-primary-500'
                }`}
                style={{ width: `${project.progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">{project.progress}%</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <CalendarIcon className="h-4 w-4 text-gray-400" />
            Deadline: {formatDate(project.deadline)}
          </div>
        </div>
      </div>

      {/* Billing section */}
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-900">Billing</p>
            {!hasLinkedInvoices && (
              <Button size="sm" onClick={() => setShowPaymentModal(true)} leftIcon={<PlusIcon className="h-4 w-4" />}>
                Log Payment
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Billed</p>
              <p className="text-xl font-bold text-gray-900">${financials.billed.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Received</p>
              <p className="text-xl font-bold text-green-700">${financials.received.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Balance</p>
              <p className={`text-xl font-bold ${financials.balance > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                ${financials.balance.toLocaleString()}
              </p>
            </div>
          </div>

          {hasLinkedInvoices ? (
            <div>
              <p className="text-xs text-gray-500 mb-2">
                This project has linked invoices — billing is tracked through them, not the manual payment log.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice #</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Paid</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {linkedInvoices.map(inv => (
                      <tr
                        key={inv.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/admin/invoices/${inv.id}`)}
                      >
                        <td className="px-3 py-2 font-medium text-gray-900">{inv.invoiceNumber}</td>
                        <td className="px-3 py-2">
                          <Badge variant={INVOICE_STATUS_COLORS[inv.status]} size="sm">{inv.status}</Badge>
                        </td>
                        <td className="px-3 py-2">${inv.total.toLocaleString()}</td>
                        <td className="px-3 py-2 text-green-700">${inv.amountPaid.toLocaleString()}</td>
                        <td className="px-3 py-2">${inv.amountDue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div>
              {project.payments.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No payments logged yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Note</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Recorded By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[...project.payments]
                        .sort((a, b) => b.paidAt.toMillis() - a.paidAt.toMillis())
                        .map(p => (
                          <tr key={p.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-gray-500 text-xs">{formatDate(p.paidAt)}</td>
                            <td className="px-3 py-2 font-medium text-green-700">${p.amount.toLocaleString()}</td>
                            <td className="px-3 py-2 text-gray-600">{p.method || '—'}</td>
                            <td className="px-3 py-2 text-gray-600">{p.note || '—'}</td>
                            <td className="px-3 py-2 text-gray-500 text-xs">{p.recordedByName}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Activity Log */}
      <Card>
        <div className="p-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">Activity Log</p>
        </div>
        {activities.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No activity logged for this project yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activities.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(a.startTime)}</td>
                    <td className="px-4 py-3 text-gray-700">{a.userName}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{a.title}</td>
                    <td className="px-4 py-3">
                      <Badge variant="default" size="sm">{ACTIVITY_CATEGORY_LABELS[a.category]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDuration(a.durationMinutes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Edit Project Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Project" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                rows={2}
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
                {Object.values(ProjectType).map(t => <option key={t} value={t}>{PROJECT_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formStatus}
                onChange={e => setFormStatus(e.target.value as ProjectStatus)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formPriority}
                onChange={e => setFormPriority(e.target.value as ProjectPriority)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {Object.values(ProjectPriority).map(p => <option key={p} value={p}>{PROJECT_PRIORITY_LABELS[p]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scope Amount ($)</label>
              <Input type="number" value={formScopeAmount} onChange={e => setFormScopeAmount(e.target.value)} min="0" disabled={hasLinkedInvoices} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link to Client</label>
              <select
                value={formLinkedClientId}
                onChange={e => setFormLinkedClientId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">None</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={formStartDate}
                onChange={e => setFormStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline *</label>
              <input
                type="date"
                value={formDeadline}
                onChange={e => setFormDeadline(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
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
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} loading={isSaving}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Delete Project" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Delete &quot;{project.name}&quot;? This cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>

      {/* Log Payment Modal */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Log Payment" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($) *</label>
            <Input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="0.00" min="0" step="0.01" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={payDate}
              onChange={e => setPayDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
            <select
              value={payMethod}
              onChange={e => setPayMethod(e.target.value as ProjectPayment['method'])}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="card">Card</option>
              <option value="ach">ACH</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="check">Check</option>
              <option value="cash">Cash</option>
              <option value="wire">Wire</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <textarea
              value={payNote}
              onChange={e => setPayNote(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              placeholder="e.g. Down payment, Installment 1 of 3..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
            <Button onClick={handleLogPayment} loading={isSavingPayment}>Log Payment</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
