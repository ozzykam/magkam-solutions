import { Timestamp } from 'firebase/firestore';

export enum ProjectStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  CANCELLED = 'cancelled',
}

export enum ProjectPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum ProjectType {
  CLIENT = 'client',
  INTERNAL = 'internal',
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  [ProjectStatus.PLANNING]: 'Planning',
  [ProjectStatus.IN_PROGRESS]: 'In Progress',
  [ProjectStatus.REVIEW]: 'Review',
  [ProjectStatus.COMPLETED]: 'Completed',
  [ProjectStatus.ON_HOLD]: 'On Hold',
  [ProjectStatus.CANCELLED]: 'Cancelled',
};

export const PROJECT_PRIORITY_LABELS: Record<ProjectPriority, string> = {
  [ProjectPriority.LOW]: 'Low',
  [ProjectPriority.MEDIUM]: 'Medium',
  [ProjectPriority.HIGH]: 'High',
  [ProjectPriority.URGENT]: 'Urgent',
};

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  [ProjectType.CLIENT]: 'Client',
  [ProjectType.INTERNAL]: 'Internal',
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  [ProjectStatus.PLANNING]: 'info',
  [ProjectStatus.IN_PROGRESS]: 'primary',
  [ProjectStatus.REVIEW]: 'warning',
  [ProjectStatus.COMPLETED]: 'success',
  [ProjectStatus.ON_HOLD]: 'default',
  [ProjectStatus.CANCELLED]: 'error',
};

export const PROJECT_PRIORITY_COLORS: Record<ProjectPriority, string> = {
  [ProjectPriority.LOW]: 'default',
  [ProjectPriority.MEDIUM]: 'info',
  [ProjectPriority.HIGH]: 'warning',
  [ProjectPriority.URGENT]: 'error',
};

export interface Project {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  priority: ProjectPriority;
  deadline: Timestamp;
  startDate?: Timestamp;
  progress: number;
  linkedProspectId?: string;
  linkedProspectName?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface CreateProjectData {
  name: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  priority: ProjectPriority;
  deadline: Timestamp;
  startDate?: Timestamp;
  progress: number;
  linkedProspectId?: string;
  linkedProspectName?: string;
}
