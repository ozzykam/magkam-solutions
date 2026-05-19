import { Timestamp } from 'firebase/firestore';

export enum ActivityCategory {
  PROSPECTING = 'prospecting',
  CLIENT_WORK = 'client_work',
  ADMIN = 'admin',
  SALES = 'sales',
  MARKETING = 'marketing',
  MEETINGS = 'meetings',
  OTHER = 'other',
}

export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategory, string> = {
  [ActivityCategory.PROSPECTING]: 'Prospecting',
  [ActivityCategory.CLIENT_WORK]: 'Client Work',
  [ActivityCategory.ADMIN]: 'Admin',
  [ActivityCategory.SALES]: 'Sales',
  [ActivityCategory.MARKETING]: 'Marketing',
  [ActivityCategory.MEETINGS]: 'Meetings',
  [ActivityCategory.OTHER]: 'Other',
};

export const ACTIVITY_CATEGORY_COLORS: Record<ActivityCategory, string> = {
  [ActivityCategory.PROSPECTING]: 'info',
  [ActivityCategory.CLIENT_WORK]: 'success',
  [ActivityCategory.ADMIN]: 'default',
  [ActivityCategory.SALES]: 'warning',
  [ActivityCategory.MARKETING]: 'primary',
  [ActivityCategory.MEETINGS]: 'manager',
  [ActivityCategory.OTHER]: 'default',
};

export interface ActivityEntry {
  id: string;
  userId: string;
  userName: string;
  title: string;
  category: ActivityCategory;
  description: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  durationMinutes: number;
  isRunning: boolean;
  isPaused: boolean;
  pausedAt?: Timestamp;
  lastResumeTime: Timestamp;
  accumulatedMs: number;
  linkedProspectId?: string;
  linkedProspectName?: string;
  linkedProposalId?: string;
  linkedProposalTitle?: string;
  linkedInvoiceId?: string;
  linkedInvoiceNumber?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateActivityData {
  title: string;
  category: ActivityCategory;
  description: string;
  durationMinutes: number;
  startTime: Timestamp;
  linkedProspectId?: string;
  linkedProspectName?: string;
  linkedProposalId?: string;
  linkedProposalTitle?: string;
  linkedInvoiceId?: string;
  linkedInvoiceNumber?: string;
}

export interface ActivityStats {
  todayMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
  byCategory: Partial<Record<ActivityCategory, number>>;
}
