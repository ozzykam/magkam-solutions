import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  ActivityEntry,
  ActivityCategory,
  ActivityStats,
  CreateActivityData,
} from '@/types/activity';

const COLLECTION = 'activityEntries';

export const getElapsedSeconds = (entry: ActivityEntry): number => {
  if (entry.isPaused) return Math.floor(entry.accumulatedMs / 1000);
  const activeMs = entry.accumulatedMs + (Date.now() - entry.lastResumeTime.toMillis());
  return Math.floor(Math.max(0, activeMs) / 1000);
};

export const formatElapsed = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const createActivity = async (
  userId: string,
  userName: string,
  data: CreateActivityData
): Promise<string> => {
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, COLLECTION), {
      userId,
      userName,
      title: data.title,
      category: data.category,
      description: data.description,
      startTime: data.startTime,
      lastResumeTime: data.startTime,
      durationMinutes: data.durationMinutes,
      isRunning: false,
      isPaused: false,
      accumulatedMs: 0,
      ...(data.linkedProspectId && { linkedProspectId: data.linkedProspectId }),
      ...(data.linkedProspectName && { linkedProspectName: data.linkedProspectName }),
      ...(data.linkedProposalId && { linkedProposalId: data.linkedProposalId }),
      ...(data.linkedProposalTitle && { linkedProposalTitle: data.linkedProposalTitle }),
      ...(data.linkedInvoiceId && { linkedInvoiceId: data.linkedInvoiceId }),
      ...(data.linkedInvoiceNumber && { linkedInvoiceNumber: data.linkedInvoiceNumber }),
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating activity:', error);
    throw error;
  }
};

export const startTimer = async (
  userId: string,
  userName: string,
  data: Omit<CreateActivityData, 'durationMinutes' | 'startTime'> & { startTime?: Timestamp }
): Promise<string> => {
  try {
    const now = Timestamp.now();
    const startTime = data.startTime || now;
    const docRef = await addDoc(collection(db, COLLECTION), {
      userId,
      userName,
      title: data.title,
      category: data.category,
      description: data.description,
      startTime,
      lastResumeTime: startTime,
      durationMinutes: 0,
      isRunning: true,
      isPaused: false,
      accumulatedMs: 0,
      ...(data.linkedProspectId && { linkedProspectId: data.linkedProspectId }),
      ...(data.linkedProspectName && { linkedProspectName: data.linkedProspectName }),
      ...(data.linkedProposalId && { linkedProposalId: data.linkedProposalId }),
      ...(data.linkedProposalTitle && { linkedProposalTitle: data.linkedProposalTitle }),
      ...(data.linkedInvoiceId && { linkedInvoiceId: data.linkedInvoiceId }),
      ...(data.linkedInvoiceNumber && { linkedInvoiceNumber: data.linkedInvoiceNumber }),
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error starting timer:', error);
    throw error;
  }
};

export const stopTimer = async (id: string, entry: ActivityEntry): Promise<void> => {
  try {
    const endTime = Timestamp.now();
    const elapsedMs = entry.isPaused
      ? 0
      : endTime.toMillis() - entry.lastResumeTime.toMillis();
    const totalMs = entry.accumulatedMs + elapsedMs;
    const durationMinutes = Math.max(1, Math.round(totalMs / 60000));
    await updateDoc(doc(db, COLLECTION, id), {
      endTime,
      durationMinutes,
      isRunning: false,
      isPaused: false,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error stopping timer:', error);
    throw error;
  }
};

export const pauseTimer = async (id: string, entry: ActivityEntry): Promise<void> => {
  try {
    const now = Timestamp.now();
    const newAccumulatedMs =
      entry.accumulatedMs + (now.toMillis() - entry.lastResumeTime.toMillis());
    await updateDoc(doc(db, COLLECTION, id), {
      isPaused: true,
      pausedAt: now,
      accumulatedMs: newAccumulatedMs,
      updatedAt: now,
    });
  } catch (error) {
    console.error('Error pausing timer:', error);
    throw error;
  }
};

export const resumeTimer = async (id: string): Promise<void> => {
  try {
    const now = Timestamp.now();
    await updateDoc(doc(db, COLLECTION, id), {
      isPaused: false,
      pausedAt: null,
      lastResumeTime: now,
      updatedAt: now,
    });
  } catch (error) {
    console.error('Error resuming timer:', error);
    throw error;
  }
};

export const getActivities = async (
  userId: string,
  filters?: { category?: ActivityCategory; dateFrom?: Date; dateTo?: Date; limitCount?: number }
): Promise<ActivityEntry[]> => {
  try {
    const constraints: Parameters<typeof query>[1][] = [
      where('userId', '==', userId),
      orderBy('startTime', 'desc'),
    ];

    if (filters?.category) {
      constraints.push(where('category', '==', filters.category));
    }
    if (filters?.limitCount) {
      constraints.push(limit(filters.limitCount));
    }

    const q = query(collection(db, COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    let entries = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ActivityEntry[];

    if (filters?.dateFrom) {
      const from = Timestamp.fromDate(filters.dateFrom);
      entries = entries.filter(e => e.startTime.toMillis() >= from.toMillis());
    }
    if (filters?.dateTo) {
      const to = Timestamp.fromDate(filters.dateTo);
      entries = entries.filter(e => e.startTime.toMillis() <= to.toMillis());
    }

    return entries;
  } catch (error) {
    console.error('Error fetching activities:', error);
    throw error;
  }
};

export const getRunningTimer = async (userId: string): Promise<ActivityEntry | null> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      where('isRunning', '==', true),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return { id: d.id, ...d.data() } as ActivityEntry;
  } catch (error) {
    console.error('Error fetching running timer:', error);
    return null;
  }
};

export const updateActivity = async (
  id: string,
  updates: Partial<Omit<ActivityEntry, 'id' | 'userId' | 'createdAt'>>
): Promise<void> => {
  try {
    await updateDoc(doc(db, COLLECTION, id), {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating activity:', error);
    throw error;
  }
};

export const deleteActivity = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (error) {
    console.error('Error deleting activity:', error);
    throw error;
  }
};

export const getActivityStats = async (userId: string): Promise<ActivityStats> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      orderBy('startTime', 'desc')
    );
    const snapshot = await getDocs(q);
    const entries = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ActivityEntry[];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - todayStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats: ActivityStats = {
      todayMinutes: 0,
      weekMinutes: 0,
      monthMinutes: 0,
      byCategory: {},
    };

    for (const entry of entries) {
      if (entry.isRunning) continue;
      const entryMs = entry.startTime.toMillis();
      const minutes = entry.durationMinutes;

      if (entryMs >= todayStart.getTime()) stats.todayMinutes += minutes;
      if (entryMs >= weekStart.getTime()) stats.weekMinutes += minutes;
      if (entryMs >= monthStart.getTime()) {
        stats.monthMinutes += minutes;
        stats.byCategory[entry.category] = (stats.byCategory[entry.category] || 0) + minutes;
      }
    }

    return stats;
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    throw error;
  }
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};
