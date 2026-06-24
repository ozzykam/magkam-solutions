import { Timestamp } from 'firebase/firestore';

export enum DocumentCategory {
  RESUME = 'resume',
  FLYER = 'flyer',
  BUSINESS_CARD = 'business_card',
  PORTFOLIO = 'portfolio',
  PRESENTATION = 'presentation',
  CASE_STUDY = 'case_study',
  PROPOSAL_TEMPLATE = 'proposal_template',
  OTHER = 'other',
}

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  [DocumentCategory.RESUME]: 'Resume',
  [DocumentCategory.FLYER]: 'Flyer',
  [DocumentCategory.BUSINESS_CARD]: 'Business Card',
  [DocumentCategory.PORTFOLIO]: 'Portfolio',
  [DocumentCategory.PRESENTATION]: 'Presentation',
  [DocumentCategory.CASE_STUDY]: 'Case Study',
  [DocumentCategory.PROPOSAL_TEMPLATE]: 'Proposal Template',
  [DocumentCategory.OTHER]: 'Other',
};

export const DOCUMENT_CATEGORY_COLORS: Record<DocumentCategory, string> = {
  [DocumentCategory.RESUME]: 'info',
  [DocumentCategory.FLYER]: 'success',
  [DocumentCategory.BUSINESS_CARD]: 'warning',
  [DocumentCategory.PORTFOLIO]: 'primary',
  [DocumentCategory.PRESENTATION]: 'error',
  [DocumentCategory.CASE_STUDY]: 'default',
  [DocumentCategory.PROPOSAL_TEMPLATE]: 'info',
  [DocumentCategory.OTHER]: 'default',
};

export interface SalesDocument {
  id: string;
  name: string;
  description?: string;
  category: DocumentCategory;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  tags: string[];
  version?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface CreateSalesDocumentData {
  name: string;
  description?: string;
  category: DocumentCategory;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  tags: string[];
  version?: string;
}
