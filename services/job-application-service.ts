import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  arrayUnion,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  JobApplication,
  ApplicationStatus,
  CreateJobApplicationData,
  ApplicationNote,
} from '@/types/job-application';

const COLLECTION = 'jobApplications';

export const createJobApplication = async (
  data: CreateJobApplicationData,
  createdBy: string
): Promise<string> => {
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, COLLECTION), {
      company: data.company,
      role: data.role,
      locationType: data.locationType,
      status: data.status,
      source: data.source,
      notes: [],
      ...(data.location && { location: data.location }),
      ...(data.appliedAt && { appliedAt: data.appliedAt }),
      ...(data.jobPostingUrl && { jobPostingUrl: data.jobPostingUrl }),
      ...(data.salaryMin !== undefined && { salaryMin: data.salaryMin }),
      ...(data.salaryMax !== undefined && { salaryMax: data.salaryMax }),
      ...(data.salaryOffered !== undefined && { salaryOffered: data.salaryOffered }),
      ...(data.contactName && { contactName: data.contactName }),
      ...(data.contactEmail && { contactEmail: data.contactEmail }),
      ...(data.nextFollowUpAt && { nextFollowUpAt: data.nextFollowUpAt }),
      ...(data.resumeVersion && { resumeVersion: data.resumeVersion }),
      createdBy,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating job application:', error);
    throw error;
  }
};

export const getJobApplications = async (): Promise<JobApplication[]> => {
  try {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as JobApplication[];
  } catch (error) {
    console.error('Error fetching job applications:', error);
    throw error;
  }
};

export const getJobApplicationById = async (id: string): Promise<JobApplication | null> => {
  try {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as JobApplication;
  } catch (error) {
    console.error('Error fetching job application:', error);
    return null;
  }
};

export const updateJobApplication = async (
  id: string,
  updates: Partial<Omit<JobApplication, 'id' | 'createdAt' | 'createdBy' | 'notes'>>
): Promise<void> => {
  try {
    await updateDoc(doc(db, COLLECTION, id), {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating job application:', error);
    throw error;
  }
};

export const updateJobApplicationStatus = async (
  id: string,
  status: ApplicationStatus
): Promise<void> => {
  try {
    await updateDoc(doc(db, COLLECTION, id), {
      status,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    throw error;
  }
};

export const deleteJobApplication = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (error) {
    console.error('Error deleting job application:', error);
    throw error;
  }
};

export const addApplicationNote = async (
  id: string,
  content: string,
  createdBy: string,
  createdByName: string
): Promise<void> => {
  try {
    const note: ApplicationNote = {
      id: crypto.randomUUID(),
      content,
      createdBy,
      createdByName,
      createdAt: Timestamp.now(),
    };
    await updateDoc(doc(db, COLLECTION, id), {
      notes: arrayUnion(note),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error adding application note:', error);
    throw error;
  }
};
