import { Timestamp } from 'firebase/firestore';

export type TodoPriority = 'low' | 'medium' | 'high';

export interface Todo {
  id: string;
  userId: string;
  text: string;
  isCompleted: boolean;
  priority?: TodoPriority;
  dueDate?: Timestamp;
  completedAt?: Timestamp;
  createdAt: Timestamp;
}

export interface CreateTodoData {
  text: string;
  priority?: TodoPriority;
  dueDate?: Timestamp;
}
