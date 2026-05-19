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
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  Project,
  ProjectStatus,
  ProjectType,
  ProjectPriority,
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
}): Promise<Project[]> => {
  try {
    const q = query(collection(db, COLLECTION), orderBy('deadline', 'asc'));
    const snapshot = await getDocs(q);
    let projects = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Project[];

    if (filters?.status) projects = projects.filter(p => p.status === filters.status);
    if (filters?.type) projects = projects.filter(p => p.type === filters.type);
    if (filters?.priority) projects = projects.filter(p => p.priority === filters.priority);

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
    return { id: snap.id, ...snap.data() } as Project;
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
    await updateDoc(doc(db, COLLECTION, id), {
      ...updates,
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
