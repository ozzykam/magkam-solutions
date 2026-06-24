'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getProspects } from '@/services/prospect-service';
import { getActivityStats, getActivities, formatDuration } from '@/services/activity-service';
import { getProjects } from '@/services/project-service';
import { createTodo, toggleTodo, deleteTodo } from '@/services/todo-service';
import { getUnreadMessageCount } from '@/services/contact-message-service';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  Prospect,
  ProspectStatus,
  PROSPECT_STATUS_LABELS,
  PROSPECT_STATUS_COLORS,
  PROSPECT_PIPELINE_STAGES,
} from '@/types/prospect';
import {
  Project,
  ProjectStatus,
  PROJECT_PRIORITY_COLORS,
  PROJECT_PRIORITY_LABELS,
} from '@/types/project';
import { ActivityEntry, ActivityStats, ACTIVITY_CATEGORY_LABELS, ACTIVITY_CATEGORY_COLORS } from '@/types/activity';
import { Todo } from '@/types/todo';
import { Invoice, InvoiceStatus } from '@/types/invoice';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  ClockIcon,
  FolderIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  EnvelopeIcon,
  ChartBarIcon,
  CalendarIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';

const ACTIVE_PROJECT_STATUSES = [
  ProjectStatus.PLANNING,
  ProjectStatus.IN_PROGRESS,
  ProjectStatus.REVIEW,
  ProjectStatus.ON_HOLD,
];
const DONE_PROJECT_STATUSES = [ProjectStatus.COMPLETED, ProjectStatus.CANCELLED];

export default function AdminDashboard() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activityStats, setActivityStats] = useState<ActivityStats>({
    todayMinutes: 0, weekMinutes: 0, monthMinutes: 0, byCategory: {},
  });
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [revenueThisMonth, setRevenueThisMonth] = useState(0);
  const [outstandingBalance, setOutstandingBalance] = useState(0);

  // Todos — live via onSnapshot
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const todoInputRef = useRef<HTMLInputElement>(null);

  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [prospectList, stats, projectList, unread, activity, invoiceSnap] = await Promise.all([
        getProspects(),
        getActivityStats(user.uid),
        getProjects(),
        getUnreadMessageCount(),
        getActivities(user.uid, { limitCount: 5 }),
        getDocs(query(collection(db, 'invoices'), orderBy('createdAt', 'desc'), limit(200))),
      ]);

      setProspects(prospectList);
      setActivityStats(stats);
      setProjects(projectList);
      setUnreadCount(unread);
      setRecentActivity(activity);

      // Compute invoice KPIs client-side
      const invoices = invoiceSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Invoice[];
      const monthStartMs = monthStart.getTime();
      let rev = 0;
      let outstanding = 0;
      for (const inv of invoices) {
        if (inv.status === InvoiceStatus.PAID && inv.paidAt && inv.paidAt.toMillis() >= monthStartMs) {
          rev += inv.total || 0;
        }
        if (
          inv.status !== InvoiceStatus.PAID &&
          inv.status !== InvoiceStatus.CANCELLED &&
          inv.status !== InvoiceStatus.DRAFT
        ) {
          outstanding += inv.amountDue || 0;
        }
      }
      setRevenueThisMonth(rev);
      setOutstandingBalance(outstanding);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Live todos via onSnapshot
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'todos'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setTodos(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Todo[]);
    });
    return () => unsub();
  }, [user]);

  const handleAddTodo = async () => {
    if (!user || !newTodoText.trim()) return;
    setIsAddingTodo(true);
    try {
      await createTodo(user.uid, { text: newTodoText.trim() });
      setNewTodoText('');
      todoInputRef.current?.focus();
    } catch (err) {
      console.error('Failed to add todo', err);
    } finally {
      setIsAddingTodo(false);
    }
  };

  const handleToggleTodo = async (todo: Todo) => {
    try {
      await toggleTodo(todo.id, !todo.isCompleted);
    } catch (err) {
      console.error('Failed to toggle todo', err);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      await deleteTodo(id);
    } catch (err) {
      console.error('Failed to delete todo', err);
    }
  };

  // Derived data
  const now = Date.now();
  const activeProspects = prospects.filter(
    p => p.status !== ProspectStatus.WON && p.status !== ProspectStatus.LOST
  );
  const pipelineValue = activeProspects.reduce((sum, p) => sum + (p.estimatedValue || 0), 0);
  const activeProjects = projects.filter(p => ACTIVE_PROJECT_STATUSES.includes(p.status));

  const overdueFollowUps = prospects.filter(
    p =>
      p.nextFollowUpAt &&
      p.nextFollowUpAt.toMillis() < now &&
      p.status !== ProspectStatus.WON &&
      p.status !== ProspectStatus.LOST
  );
  const overdueProjects = projects.filter(
    p => !DONE_PROJECT_STATUSES.includes(p.status) && p.deadline.toMillis() < now
  );

  const upcomingDeadlines = projects
    .filter(p => {
      if (DONE_PROJECT_STATUSES.includes(p.status)) return false;
      const ms = p.deadline.toMillis();
      return ms >= now && ms <= now + 14 * 86400000;
    })
    .sort((a, b) => a.deadline.toMillis() - b.deadline.toMillis());

  const openTodos = todos.filter(t => !t.isCompleted);
  const completedTodos = todos.filter(t => t.isCompleted).slice(0, 5);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDeadlineLabel = (ms: number) => {
    const diff = ms - now;
    const days = Math.floor(diff / 86400000);
    if (days === 0) return { label: 'Today', color: 'text-red-600' };
    if (days === 1) return { label: 'Tomorrow', color: 'text-red-600' };
    if (days < 7) return { label: `in ${days} days`, color: 'text-amber-600' };
    return { label: `in ${days} days`, color: 'text-gray-500' };
  };

  const daysOverdue = (ms: number) => {
    const days = Math.floor((now - ms) / 86400000);
    if (days === 0) return 'today';
    if (days === 1) return '1 day overdue';
    return `${days} days overdue`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {greeting()}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-gray-500 mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          title="Pipeline Value"
          value={`$${pipelineValue.toLocaleString()}`}
          sub={`${activeProspects.length} active prospects`}
          icon={<ChartBarIcon className="h-5 w-5" />}
          color="purple"
          href="/admin/prospects"
        />
        <KpiCard
          title="Revenue (Month)"
          value={`$${revenueThisMonth.toLocaleString()}`}
          sub="Paid invoices"
          icon={<CurrencyDollarIcon className="h-5 w-5" />}
          color="green"
          href="/admin/invoices"
        />
        <KpiCard
          title="Outstanding"
          value={`$${outstandingBalance.toLocaleString()}`}
          sub="Unpaid invoices"
          icon={<CurrencyDollarIcon className="h-5 w-5" />}
          color={outstandingBalance > 0 ? 'red' : 'gray'}
          href="/admin/invoices"
        />
        <KpiCard
          title="Time (Week)"
          value={formatDuration(activityStats.weekMinutes)}
          sub={`${activityStats.todayMinutes}m today`}
          icon={<ClockIcon className="h-5 w-5" />}
          color="blue"
          href="/admin/activity"
        />
        <KpiCard
          title="Active Projects"
          value={String(activeProjects.length)}
          sub={`${overdueProjects.length} overdue`}
          icon={<FolderIcon className="h-5 w-5" />}
          color={overdueProjects.length > 0 ? 'red' : 'indigo'}
          href="/admin/projects"
        />
        <KpiCard
          title="Messages"
          value={String(unreadCount)}
          sub="Unread"
          icon={<EnvelopeIcon className="h-5 w-5" />}
          color={unreadCount > 0 ? 'amber' : 'gray'}
          href="/admin/messages"
        />
      </div>

      {/* Middle row: Alerts | Todos | Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts */}
        <Card>
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
              Alerts
            </h2>
          </div>
          <div className="p-4 space-y-2">
            {overdueFollowUps.length === 0 && overdueProjects.length === 0 ? (
              <div className="flex flex-col items-center py-4 text-center text-gray-400">
                <CheckCircleIcon className="h-8 w-8 text-green-400 mb-2" />
                <p className="text-sm font-medium text-green-600">All clear</p>
                <p className="text-xs mt-0.5">No overdue follow-ups or projects</p>
              </div>
            ) : (
              <>
                {overdueFollowUps.map(p => (
                  <Link
                    key={p.id}
                    href="/admin/prospects"
                    className="flex items-start gap-2 p-2 rounded-lg bg-red-50 hover:bg-red-100 transition-colors group"
                  >
                    <UserGroupIcon className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-red-800 truncate">{p.name}</p>
                      <p className="text-xs text-red-600">
                        Follow-up {daysOverdue(p.nextFollowUpAt!.toMillis())}
                      </p>
                    </div>
                    <ArrowRightIcon className="h-3.5 w-3.5 text-red-400 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </Link>
                ))}
                {overdueProjects.map(p => (
                  <Link
                    key={p.id}
                    href="/admin/projects"
                    className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors group"
                  >
                    <FolderIcon className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-amber-800 truncate">{p.name}</p>
                      <p className="text-xs text-amber-600">
                        Deadline {daysOverdue(p.deadline.toMillis())}
                      </p>
                    </div>
                    <ArrowRightIcon className="h-3.5 w-3.5 text-amber-400 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </Link>
                ))}
              </>
            )}
          </div>
        </Card>

        {/* Todos */}
        <Card>
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <CheckIcon className="h-4 w-4 text-primary-500" />
              To-do
              {openTodos.length > 0 && (
                <span className="ml-auto text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                  {openTodos.length}
                </span>
              )}
            </h2>
          </div>
          <div className="p-4 space-y-3">
            {/* Add input */}
            <div className="flex gap-2">
              <input
                ref={todoInputRef}
                type="text"
                value={newTodoText}
                onChange={e => setNewTodoText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTodo()}
                placeholder="Add a to-do..."
                className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                onClick={handleAddTodo}
                disabled={isAddingTodo || !newTodoText.trim()}
                className="p-1.5 text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-40 rounded-lg transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Open todos */}
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {openTodos.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">Nothing here yet</p>
              )}
              {openTodos.slice(0, 10).map(todo => (
                <div key={todo.id} className="flex items-center gap-2 group py-1">
                  <button
                    onClick={() => handleToggleTodo(todo)}
                    className="w-4 h-4 rounded border border-gray-300 hover:border-primary-500 flex items-center justify-center flex-shrink-0 transition-colors"
                  />
                  <span className="flex-1 text-sm text-gray-700 truncate">{todo.text}</span>
                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-300 hover:text-red-400 transition-all flex-shrink-0"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {openTodos.length > 10 && (
                <p className="text-xs text-gray-400 text-center pt-1">{openTodos.length - 10} more</p>
              )}
            </div>

            {/* Completed todos */}
            {completedTodos.length > 0 && (
              <div className="border-t border-gray-100 pt-3 space-y-1">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Completed</p>
                {completedTodos.map(todo => (
                  <div key={todo.id} className="flex items-center gap-2 group py-0.5">
                    <button
                      onClick={() => handleToggleTodo(todo)}
                      className="w-4 h-4 rounded border border-green-400 bg-green-100 flex items-center justify-center flex-shrink-0"
                    >
                      <CheckIcon className="h-2.5 w-2.5 text-green-600" />
                    </button>
                    <span className="flex-1 text-sm text-gray-400 line-through truncate">{todo.text}</span>
                    <button
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-300 hover:text-red-400 transition-all flex-shrink-0"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-indigo-500" />
              Upcoming Deadlines
              <span className="ml-auto text-xs text-gray-400">Next 14 days</span>
            </h2>
          </div>
          <div className="p-4">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No deadlines in the next 14 days</p>
            ) : (
              <div className="space-y-2">
                {upcomingDeadlines.map(p => {
                  const { label, color } = formatDeadlineLabel(p.deadline.toMillis());
                  return (
                    <Link
                      key={p.id}
                      href="/admin/projects"
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge
                            variant={PROJECT_PRIORITY_COLORS[p.priority] as Parameters<typeof Badge>[0]['variant']}
                            size="sm"
                          >
                            {PROJECT_PRIORITY_LABELS[p.priority]}
                          </Badge>
                          <span className={`text-xs font-medium ${color}`}>{label}</span>
                        </div>
                      </div>
                      <ArrowRightIcon className="h-3.5 w-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Bottom row: Pipeline Funnel + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Pipeline Funnel */}
        <Card className="lg:col-span-3">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <UserGroupIcon className="h-4 w-4 text-purple-500" />
              Prospect Pipeline
            </h2>
            <Link href="/admin/prospects" className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              View all <ArrowRightIcon className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-4 space-y-2">
            {PROSPECT_PIPELINE_STAGES.map(stage => {
              const count = prospects.filter(p => p.status === stage).length;
              const total = prospects.filter(p => PROSPECT_PIPELINE_STAGES.includes(p.status as ProspectStatus)).length;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={stage} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-28 flex-shrink-0">{PROSPECT_STATUS_LABELS[stage]}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: stageColor(stage),
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-6 text-right flex-shrink-0">{count}</span>
                </div>
              );
            })}
            {/* Won / Lost */}
            <div className="border-t border-gray-100 pt-2 grid grid-cols-2 gap-3 mt-1">
              {([ProspectStatus.WON, ProspectStatus.LOST] as ProspectStatus[]).map(stage => {
                const count = prospects.filter(p => p.status === stage).length;
                return (
                  <div key={stage} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-gray-50">
                    <span className="text-xs text-gray-500">{PROSPECT_STATUS_LABELS[stage]}</span>
                    <Badge
                      variant={PROSPECT_STATUS_COLORS[stage] as Parameters<typeof Badge>[0]['variant']}
                      size="sm"
                    >
                      {count}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-blue-500" />
              Recent Activity
            </h2>
            <Link href="/admin/activity" className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              View all <ArrowRightIcon className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-4">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No activity logged yet</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map(entry => (
                  <div key={entry.id} className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{entry.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant={ACTIVITY_CATEGORY_COLORS[entry.category] as Parameters<typeof Badge>[0]['variant']}
                          size="sm"
                        >
                          {ACTIVITY_CATEGORY_LABELS[entry.category]}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {entry.startTime.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-gray-500 flex-shrink-0 mt-0.5">
                      {formatDuration(entry.durationMinutes)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// Maps pipeline stage to a hex color for the funnel bar
function stageColor(stage: ProspectStatus): string {
  const map: Partial<Record<ProspectStatus, string>> = {
    [ProspectStatus.NEW]: '#93c5fd',
    [ProspectStatus.CONTACTED]: '#67e8f9',
    [ProspectStatus.QUALIFIED]: '#86efac',
    [ProspectStatus.PROPOSAL_SENT]: '#fcd34d',
    [ProspectStatus.NEGOTIATING]: '#f9a8d4',
  };
  return map[stage] || '#d1d5db';
}

interface KpiCardProps {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
  href: string;
}

function KpiCard({ title, value, sub, icon, color, href }: KpiCardProps) {
  const iconBg: Record<string, string> = {
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600',
    gray: 'bg-gray-50 text-gray-400',
  };
  const valColor: Record<string, string> = {
    purple: 'text-purple-700',
    green: 'text-green-700',
    red: 'text-red-700',
    blue: 'text-blue-700',
    indigo: 'text-indigo-700',
    amber: 'text-amber-700',
    gray: 'text-gray-700',
  };
  return (
    <Link href={href}>
      <Card hover>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-xs font-medium text-gray-500 leading-tight">{title}</p>
            <div className={`p-1.5 rounded-lg flex-shrink-0 ${iconBg[color] || iconBg.gray}`}>
              {icon}
            </div>
          </div>
          <p className={`text-xl font-bold ${valColor[color] || 'text-gray-900'}`}>{value}</p>
          <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
        </div>
      </Card>
    </Link>
  );
}
