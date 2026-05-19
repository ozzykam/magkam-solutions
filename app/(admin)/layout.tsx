'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, onSnapshot, collection, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { pauseTimer, resumeTimer, stopTimer, getElapsedSeconds, formatElapsed } from '@/services/activity-service';
import { ActivityEntry } from '@/types/activity';
import { useAuth } from '@/lib/contexts/AuthContext';
import { UserRole } from '@/types';
import { StoreSettings } from '@/types/business-info';
import { getUnreadMessageCount } from '@/services/contact-message-service';
import {
  UsersIcon,
  Cog6ToothIcon,
  CubeIcon,
  ChartBarIcon,
  BuildingStorefrontIcon,
  Bars3Icon,
  XMarkIcon,
  EnvelopeIcon,
  PencilSquareIcon,
  PresentationChartLineIcon,
  RocketLaunchIcon,
  CalculatorIcon,
  HomeIcon,
  DocumentTextIcon,
  AdjustmentsHorizontalIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserGroupIcon,
  FolderIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import { PauseIcon, StopIcon, PlayIcon as PlayIconSolid } from '@heroicons/react/24/solid';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [serviceLabel, setServiceLabel] = useState('Services');
  const [runningTimer, setRunningTimer] = useState<ActivityEntry | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerTickRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Redirect if not admin or loading finished
    if (!loading && (!user || ![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role))) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Load service label from settings
  useEffect(() => {
    const loadServiceLabel = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'storeSettings', 'main'));
        if (settingsDoc.exists()) {
          const settings = settingsDoc.data() as StoreSettings;
          if (settings.serviceSettings?.serviceNamePlural) {
            setServiceLabel(settings.serviceSettings.serviceNamePlural);
          }
        }
      } catch (error) {
        console.error('Error loading service label:', error);
      }
    };

    loadServiceLabel();
  }, []);

  // Load unread message count
  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const count = await getUnreadMessageCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Error loading unread count:', error);
      }
    };

    if (user) {
      loadUnreadCount();

      // Poll every 30 seconds for updates
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Real-time listener for running activity timer
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'activityEntries'),
      where('userId', '==', user.uid),
      where('isRunning', '==', true),
      limit(1)
    );
    const unsub = onSnapshot(q, snap => {
      if (snap.empty) {
        setRunningTimer(null);
      } else {
        const d = snap.docs[0];
        setRunningTimer({ id: d.id, ...d.data() } as ActivityEntry);
      }
    });
    return () => unsub();
  }, [user]);

  // Tick elapsed seconds for active timer
  useEffect(() => {
    if (timerTickRef.current) clearInterval(timerTickRef.current);
    if (runningTimer && !runningTimer.isPaused) {
      timerTickRef.current = setInterval(() => {
        setElapsedSeconds(getElapsedSeconds(runningTimer));
      }, 1000);
    } else if (runningTimer?.isPaused) {
      setElapsedSeconds(Math.floor(runningTimer.accumulatedMs / 1000));
    } else {
      setElapsedSeconds(0);
    }
    return () => { if (timerTickRef.current) clearInterval(timerTickRef.current); };
  }, [runningTimer]);

  const handleTimerPause = async () => {
    if (!runningTimer || runningTimer.isPaused) return;
    await pauseTimer(runningTimer.id, runningTimer);
  };

  const handleTimerResume = async () => {
    if (!runningTimer || !runningTimer.isPaused) return;
    await resumeTimer(runningTimer.id);
  };

  const handleTimerStop = async () => {
    if (!runningTimer) return;
    await stopTimer(runningTimer.id, runningTimer);
  };

  // Show nothing while loading or if not admin
  if (loading || !user || ![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role)) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo/Brand */}
        <div className={`flex flex-col border-b border-gray-200 ${runningTimer ? '' : 'h-16 justify-center'}`}>
          <div className="flex items-center justify-between px-6 h-16">
            <Link href="/admin" className="text-xl font-bold text-primary-600">
              Admin Panel
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <XMarkIcon className="h-6 w-6 text-gray-600" />
            </button>
          </div>
          {runningTimer && (
            <SidebarTimerWidget
              timer={runningTimer}
              elapsedSeconds={elapsedSeconds}
              onPause={handleTimerPause}
              onResume={handleTimerResume}
              onStop={handleTimerStop}
            />
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-1">
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin" icon={ChartBarIcon}>
                Dashboard
              </NavLink>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/proposals" icon={CurrencyDollarIcon} badge={unreadCount > 0 ? unreadCount : undefined}>
                Proposals
              </NavLink>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/invoices" icon={CurrencyDollarIcon} badge={unreadCount > 0 ? unreadCount : undefined}>
                Invoices
              </NavLink>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/messages" icon={EnvelopeIcon} badge={unreadCount > 0 ? unreadCount : undefined}>
                Messages
              </NavLink>
            </div>

            {/* CRM Section */}
            <div className="pt-4 pb-2 px-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                CRM
              </p>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/prospects" icon={UserGroupIcon}>
                Prospects
              </NavLink>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/activity" icon={ClockIcon}>
                Activity Tracker
              </NavLink>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/projects" icon={FolderIcon}>
                Projects
              </NavLink>
            </div>

            {/* Job Search Section */}
            <div className="pt-4 pb-2 px-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Job Search
              </p>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/applications" icon={BriefcaseIcon}>
                Applications
              </NavLink>
            </div>

            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/services" icon={CubeIcon}>
                {serviceLabel}
              </NavLink>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/content" icon={PencilSquareIcon}>
                Content Management
              </NavLink>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/content-categories" icon={DocumentTextIcon}>
                Content Categories
              </NavLink>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/users" icon={UsersIcon}>
                Users
              </NavLink>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/calculators" icon={CalculatorIcon}>
                Calculators
              </NavLink>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/seo" icon={BuildingStorefrontIcon}>
                SEO Management
              </NavLink>
            </div>

            {/* Analytics Section */}
            <div className="pt-4 pb-2 px-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Analytics
              </p>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/analytics" icon={PresentationChartLineIcon}>
                Analytics Dashboard
              </NavLink>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/analytics/performance" icon={RocketLaunchIcon}>
                Performance Metrics
              </NavLink>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/analytics/settings" icon={Cog6ToothIcon}>
                Analytics Settings
              </NavLink>
            </div>

            {/* Settings Section */}
            <div className="pt-4 pb-2 px-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                System
              </p>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/presets" icon={CubeIcon}>
                Business Presets
              </NavLink>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/theme" icon={PencilSquareIcon}>
                Theme & Branding
              </NavLink>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/homepage" icon={HomeIcon}>
                Homepage Settings
              </NavLink>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/features" icon={AdjustmentsHorizontalIcon}>
                Feature Management
              </NavLink>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/settings" icon={Cog6ToothIcon}>
                Business Settings
              </NavLink>
            </div>
          </div>
        </nav>

        {/* User Info */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-medium">
                {user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500">{user.role}</p>
            </div>
          </div>
          <Link
            href="/"
            className="mt-3 w-full block text-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Back to Main
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Bars3Icon className="h-6 w-6 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
            <div className="w-10" />
          </div>
          {runningTimer && (
            <div className={`px-4 py-2 border-t ${runningTimer.isPaused ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
              <SidebarTimerWidget
                timer={runningTimer}
                elapsedSeconds={elapsedSeconds}
                onPause={handleTimerPause}
                onResume={handleTimerResume}
                onStop={handleTimerStop}
                compact
              />
            </div>
          )}
        </div>

        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

interface SidebarTimerWidgetProps {
  timer: ActivityEntry;
  elapsedSeconds: number;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  compact?: boolean;
}

function SidebarTimerWidget({ timer, elapsedSeconds, onPause, onResume, onStop, compact }: SidebarTimerWidgetProps) {
  const isPaused = timer.isPaused;
  return (
    <div className={`${compact ? '' : `mx-3 mb-3 rounded-lg px-3 py-2 ${isPaused ? 'bg-amber-50' : 'bg-green-50'}`}`}>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isPaused ? 'bg-amber-500' : 'bg-green-500 animate-pulse'}`} />
        <span className="text-sm font-medium text-gray-900 truncate flex-1 min-w-0">
          {timer.title}
        </span>
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className={`font-mono text-sm font-bold ${isPaused ? 'text-amber-700' : 'text-green-700'}`}>
          {formatElapsed(elapsedSeconds)}
          {isPaused && <span className="text-xs font-normal ml-1 text-amber-600">(paused)</span>}
        </span>
        <div className="flex items-center gap-1">
          {isPaused ? (
            <button
              onClick={onResume}
              className="p-1 rounded hover:bg-white/60 text-amber-700 transition-colors"
              title="Resume"
            >
              <PlayIconSolid className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={onPause}
              className="p-1 rounded hover:bg-white/60 text-green-700 transition-colors"
              title="Pause"
            >
              <PauseIcon className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={onStop}
            className="p-1 rounded hover:bg-white/60 text-red-600 transition-colors"
            title="Stop"
          >
            <StopIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface NavLinkProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  badge?: number;
}

function NavLink({ href, icon: Icon, children, badge }: NavLinkProps) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
        isActive || isHovered
          ? 'bg-green-50 text-green-700'
          : 'text-gray-700'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}

    >
      <Icon
        className={`h-5 w-5 transition-colors ${
          isActive || isHovered ? 'text-green-600' : 'text-gray-600'
        }`}
      />
      <span className="flex-1">{children}</span>
      {badge !== undefined && (
        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold text-white bg-red-500 rounded-full">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  );
}
