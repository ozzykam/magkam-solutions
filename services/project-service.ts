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
  Timestamp,
  arrayUnion,
  deleteField,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  Project,
  ProjectStatus,
  ProjectType,
  ProjectPriority,
  ProjectPayment,
  CreateProjectData,
} from '@/types/project';

const COLLECTION = 'projects';

export const createProject = async (
  data: CreateProjectData,
  createdBy: string
): Promise<string> => {
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...data,
      ...(data.startDate && { startDate: data.startDate }),
      ...(data.linkedProspectId && { linkedProspectId: data.linkedProspectId }),
      ...(data.linkedProspectName && { linkedProspectName: data.linkedProspectName }),
      ...(data.linkedClientId && { linkedClientId: data.linkedClientId }),
      ...(data.linkedClientName && { linkedClientName: data.linkedClientName }),
      ...(data.scopeAmount !== undefined && { scopeAmount: data.scopeAmount }),
      payments: [],
      createdBy,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

export const getProjects = async (filters?: {
  status?: ProjectStatus;
  type?: ProjectType;
  priority?: ProjectPriority;
  linkedClientId?: string;
}): Promise<Project[]> => {
  try {
    const q = query(collection(db, COLLECTION), orderBy('deadline', 'asc'));
    const snapshot = await getDocs(q);
    let projects = snapshot.docs.map(d => ({ payments: [] as ProjectPayment[], ...d.data(), id: d.id })) as Project[];

    if (filters?.status) projects = projects.filter(p => p.status === filters.status);
    if (filters?.type) projects = projects.filter(p => p.type === filters.type);
    if (filters?.priority) projects = projects.filter(p => p.priority === filters.priority);
    if (filters?.linkedClientId) projects = projects.filter(p => p.linkedClientId === filters.linkedClientId);

    return projects;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

export const getProjectById = async (id: string): Promise<Project | null> => {
  try {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) return null;
    return { payments: [] as ProjectPayment[], ...snap.data(), id: snap.id } as Project;
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
};

export const updateProject = async (
  id: string,
  updates: Partial<Omit<Project, 'id' | 'createdAt' | 'createdBy'>>
): Promise<void> => {
  try {
    // Firestore's updateDoc() rejects explicit `undefined` values — convert those to
    // deleteField() instead.
    const sanitized = Object.fromEntries(
      Object.entries(updates).map(([key, value]) => [key, value === undefined ? deleteField() : value])
    );
    await updateDoc(doc(db, COLLECTION, id), {
      ...sanitized,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

export const deleteProject = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

export const addProjectPayment = async (
  projectId: string,
  payment: Omit<ProjectPayment, 'id' | 'createdAt'>
): Promise<void> => {
  try {
    const newPayment: ProjectPayment = {
      ...payment,
      id: doc(collection(db, 'temp')).id,
      createdAt: Timestamp.now(),
    };
    await updateDoc(doc(db, COLLECTION, projectId), {
      payments: arrayUnion(newPayment),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error adding project payment:', error);
    throw error;
  }
};
