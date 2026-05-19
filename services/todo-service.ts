import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Todo, CreateTodoData } from '@/types/todo';

const COLLECTION = 'todos';

export const getTodos = async (userId: string): Promise<Todo[]> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Todo[];
  } catch (error) {
    console.error('Error fetching todos:', error);
    throw error;
  }
};

export const createTodo = async (
  userId: string,
  data: CreateTodoData
): Promise<string> => {
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, COLLECTION), {
      userId,
      text: data.text,
      isCompleted: false,
      ...(data.priority && { priority: data.priority }),
      ...(data.dueDate && { dueDate: data.dueDate }),
      createdAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating todo:', error);
    throw error;
  }
};

export const toggleTodo = async (id: string, isCompleted: boolean): Promise<void> => {
  try {
    await updateDoc(doc(db, COLLECTION, id), {
      isCompleted,
      completedAt: isCompleted ? Timestamp.now() : null,
    });
  } catch (error) {
    console.error('Error toggling todo:', error);
    throw error;
  }
};

export const deleteTodo = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (error) {
    console.error('Error deleting todo:', error);
    throw error;
  }
};

export const updateTodoText = async (id: string, text: string): Promise<void> => {
  try {
    await updateDoc(doc(db, COLLECTION, id), { text });
  } catch (error) {
    console.error('Error updating todo:', error);
    throw error;
  }
};
