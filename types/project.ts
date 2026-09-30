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

/**
 * A single manually-logged payment/installment against a Project's declared scope.
 * Used ONLY when the project has no linked formal Invoice — see the Client/Project
 * financial rollup rule: a project is billed through either its linked Invoices OR
 * this manual ledger, never both, to avoid double-counting.
 */
export interface ProjectPayment {
  id: string;
  amount: number;
  paidAt: Timestamp;
  method?: 'card' | 'ach' | 'bank_transfer' | 'check' | 'cash' | 'wire' | 'other';
  note?: string;
  recordedBy: string;
  recordedByName: string;
  createdAt: Timestamp;
}

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
  linkedClientId?: string;
  linkedClientName?: string;
  scopeAmount?: number; // manually-declared/contracted total value of this project
  payments: ProjectPayment[]; // manual installment/down-payment log (see ProjectPayment doc)
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
  linkedClientId?: string;
  linkedClientName?: string;
  scopeAmount?: number;
}

/**
 * Helper to sum a project's manually-logged payments
 */
export const calculateProjectAmountPaid = (payments: ProjectPayment[]): number => {
  return (payments || []).reduce((sum, p) => sum + p.amount, 0);
};
