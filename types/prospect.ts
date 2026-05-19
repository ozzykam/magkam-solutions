import { Timestamp } from 'firebase/firestore';

export enum ProspectStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  PROPOSAL_SENT = 'proposal_sent',
  NEGOTIATING = 'negotiating',
  WON = 'won',
  LOST = 'lost',
}

export enum ProspectSource {
  MANUAL = 'manual',
  CONTACT_FORM = 'contact_form',
  REFERRAL = 'referral',
  WEBSITE = 'website',
  SOCIAL_MEDIA = 'social_media',
  OTHER = 'other',
}

export const PROSPECT_STATUS_LABELS: Record<ProspectStatus, string> = {
  [ProspectStatus.NEW]: 'New',
  [ProspectStatus.CONTACTED]: 'Contacted',
  [ProspectStatus.QUALIFIED]: 'Qualified',
  [ProspectStatus.PROPOSAL_SENT]: 'Proposal Sent',
  [ProspectStatus.NEGOTIATING]: 'Negotiating',
  [ProspectStatus.WON]: 'Won',
  [ProspectStatus.LOST]: 'Lost',
};

export const PROSPECT_SOURCE_LABELS: Record<ProspectSource, string> = {
  [ProspectSource.MANUAL]: 'Manual Entry',
  [ProspectSource.CONTACT_FORM]: 'Contact Form',
  [ProspectSource.REFERRAL]: 'Referral',
  [ProspectSource.WEBSITE]: 'Website',
  [ProspectSource.SOCIAL_MEDIA]: 'Social Media',
  [ProspectSource.OTHER]: 'Other',
};

export const PROSPECT_STATUS_COLORS: Record<ProspectStatus, string> = {
  [ProspectStatus.NEW]: 'info',
  [ProspectStatus.CONTACTED]: 'primary',
  [ProspectStatus.QUALIFIED]: 'warning',
  [ProspectStatus.PROPOSAL_SENT]: 'manager',
  [ProspectStatus.NEGOTIATING]: 'sale',
  [ProspectStatus.WON]: 'success',
  [ProspectStatus.LOST]: 'error',
};

// Ordered pipeline stages (excludes WON/LOST which are terminal)
export const PROSPECT_PIPELINE_STAGES: ProspectStatus[] = [
  ProspectStatus.NEW,
  ProspectStatus.CONTACTED,
  ProspectStatus.QUALIFIED,
  ProspectStatus.PROPOSAL_SENT,
  ProspectStatus.NEGOTIATING,
];

export interface ProspectNote {
  id: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp;
}

export interface Prospect {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  source: ProspectSource;
  status: ProspectStatus;
  notes: ProspectNote[];
  estimatedValue?: number;
  tags: string[];
  linkedContactMessageId?: string;
  lastContactedAt?: Timestamp;
  nextFollowUpAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface CreateProspectData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  source: ProspectSource;
  status?: ProspectStatus;
  estimatedValue?: number;
  tags?: string[];
  linkedContactMessageId?: string;
  nextFollowUpAt?: Timestamp;
}
