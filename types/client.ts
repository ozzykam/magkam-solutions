import { Timestamp } from 'firebase/firestore';

export enum ClientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  [ClientStatus.ACTIVE]: 'Active',
  [ClientStatus.INACTIVE]: 'Inactive',
  [ClientStatus.ARCHIVED]: 'Archived',
};

export const CLIENT_STATUS_COLORS: Record<ClientStatus, string> = {
  [ClientStatus.ACTIVE]: 'success',
  [ClientStatus.INACTIVE]: 'default',
  [ClientStatus.ARCHIVED]: 'error',
};

export interface ClientNote {
  id: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  status: ClientStatus;
  notes: ClientNote[];
  estimatedValue?: number;
  tags: string[];

  // Provenance / linkage
  sourceProspectId?: string; // back-reference to the Prospect this was converted from, if any
  linkedUserId?: string; // FUTURE optional portal-account link; never required or set by conversion

  // Historical snapshot copied from the source prospect at conversion time (self-contained)
  originalSource?: string; // copy of ProspectSource enum value, stored as a plain string
  prospectCreatedAt?: Timestamp;
  convertedAt?: Timestamp;

  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface CreateClientData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  status?: ClientStatus;
  estimatedValue?: number;
  tags?: string[];
  sourceProspectId?: string;
  linkedUserId?: string;
  originalSource?: string;
  prospectCreatedAt?: Timestamp;
  convertedAt?: Timestamp;
}
