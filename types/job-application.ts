import { Timestamp } from 'firebase/firestore';

export enum ApplicationStatus {
  SAVED = 'saved',
  APPLIED = 'applied',
  PHONE_SCREEN = 'phone_screen',
  INTERVIEWING = 'interviewing',
  FINAL_ROUND = 'final_round',
  OFFER_RECEIVED = 'offer_received',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
  NO_RESPONSE = 'no_response',
}

export enum ApplicationSource {
  LINKEDIN = 'linkedin',
  INDEED = 'indeed',
  REFERRAL = 'referral',
  COMPANY_SITE = 'company_site',
  GLASSDOOR = 'glassdoor',
  RECRUITER = 'recruiter',
  OTHER = 'other',
}

export enum LocationType {
  REMOTE = 'remote',
  HYBRID = 'hybrid',
  ONSITE = 'onsite',
}

export const APPLICATION_PIPELINE_STAGES: ApplicationStatus[] = [
  ApplicationStatus.SAVED,
  ApplicationStatus.APPLIED,
  ApplicationStatus.PHONE_SCREEN,
  ApplicationStatus.INTERVIEWING,
  ApplicationStatus.FINAL_ROUND,
  ApplicationStatus.OFFER_RECEIVED,
];

export const APPLICATION_TERMINAL_STAGES: ApplicationStatus[] = [
  ApplicationStatus.ACCEPTED,
  ApplicationStatus.REJECTED,
  ApplicationStatus.WITHDRAWN,
  ApplicationStatus.NO_RESPONSE,
];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  [ApplicationStatus.SAVED]: 'Saved',
  [ApplicationStatus.APPLIED]: 'Applied',
  [ApplicationStatus.PHONE_SCREEN]: 'Phone Screen',
  [ApplicationStatus.INTERVIEWING]: 'Interviewing',
  [ApplicationStatus.FINAL_ROUND]: 'Final Round',
  [ApplicationStatus.OFFER_RECEIVED]: 'Offer Received',
  [ApplicationStatus.ACCEPTED]: 'Accepted',
  [ApplicationStatus.REJECTED]: 'Rejected',
  [ApplicationStatus.WITHDRAWN]: 'Withdrawn',
  [ApplicationStatus.NO_RESPONSE]: 'No Response',
};

export const APPLICATION_STATUS_COLORS: Record<ApplicationStatus, string> = {
  [ApplicationStatus.SAVED]: 'default',
  [ApplicationStatus.APPLIED]: 'info',
  [ApplicationStatus.PHONE_SCREEN]: 'primary',
  [ApplicationStatus.INTERVIEWING]: 'warning',
  [ApplicationStatus.FINAL_ROUND]: 'warning',
  [ApplicationStatus.OFFER_RECEIVED]: 'success',
  [ApplicationStatus.ACCEPTED]: 'success',
  [ApplicationStatus.REJECTED]: 'error',
  [ApplicationStatus.WITHDRAWN]: 'default',
  [ApplicationStatus.NO_RESPONSE]: 'default',
};

export const APPLICATION_SOURCE_LABELS: Record<ApplicationSource, string> = {
  [ApplicationSource.LINKEDIN]: 'LinkedIn',
  [ApplicationSource.INDEED]: 'Indeed',
  [ApplicationSource.REFERRAL]: 'Referral',
  [ApplicationSource.COMPANY_SITE]: 'Company Site',
  [ApplicationSource.GLASSDOOR]: 'Glassdoor',
  [ApplicationSource.RECRUITER]: 'Recruiter',
  [ApplicationSource.OTHER]: 'Other',
};

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  [LocationType.REMOTE]: 'Remote',
  [LocationType.HYBRID]: 'Hybrid',
  [LocationType.ONSITE]: 'Onsite',
};

export const LOCATION_TYPE_COLORS: Record<LocationType, string> = {
  [LocationType.REMOTE]: 'success',
  [LocationType.HYBRID]: 'warning',
  [LocationType.ONSITE]: 'default',
};

export interface ApplicationNote {
  id: string;
  content: string;
  createdAt: Timestamp;
  createdBy: string;
  createdByName: string;
}

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  location?: string;
  locationType: LocationType;
  status: ApplicationStatus;
  source: ApplicationSource;
  appliedAt?: Timestamp;
  jobPostingUrl?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryOffered?: number;
  contactName?: string;
  contactEmail?: string;
  notes: ApplicationNote[];
  nextFollowUpAt?: Timestamp;
  resumeVersion?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface CreateJobApplicationData {
  company: string;
  role: string;
  location?: string;
  locationType: LocationType;
  status: ApplicationStatus;
  source: ApplicationSource;
  appliedAt?: Timestamp;
  jobPostingUrl?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryOffered?: number;
  contactName?: string;
  contactEmail?: string;
  nextFollowUpAt?: Timestamp;
  resumeVersion?: string;
}
