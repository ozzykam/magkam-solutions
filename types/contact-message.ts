import { Timestamp } from 'firebase/firestore';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  isArchived: boolean;
  createdAt: Timestamp;
  readAt?: Timestamp;
  readBy?: string; // User ID of admin who read it
}

export interface CreateContactMessageData {
  name: string;
  email: string;
  subject: string;
  message: string;
  source?: string;
  metadata?: Record<string, number | string | boolean>;
}
