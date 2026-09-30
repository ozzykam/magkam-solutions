import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Calculator, CalculatorSubmission } from '@/types/calculator';
import type { CalculatorEstimate, CalculatorSubmissionRequest } from '@/types/calculator';
import { prepareCalculator, validateCalculator } from '@/lib/calculator';

const CALCULATORS_COLLECTION = 'calculators';
const SUBMISSIONS_COLLECTION = 'calculatorSubmissions';

/**
 * Get all calculators
 */
export const getCalculators = async (activeOnly = false): Promise<Calculator[]> => {
  try {
    let q = query(
      collection(db, CALCULATORS_COLLECTION),
      orderBy('createdAt', 'desc')
    );

    if (activeOnly) {
      q = query(
        collection(db, CALCULATORS_COLLECTION),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => prepareCalculator({
      id: doc.id,
      ...doc.data(),
    } as Calculator));
  } catch (error) {
    console.error('Error fetching calculators:', error);
    throw error;
  }
};

/**
 * Get calculator by ID
 */
export const getCalculatorById = async (id: string): Promise<Calculator | null> => {
  try {
    const docRef = doc(db, CALCULATORS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return prepareCalculator({
      id: docSnap.id,
      ...docSnap.data(),
    } as Calculator);
  } catch (error) {
    console.error('Error fetching calculator:', error);
    return null;
  }
};

/**
 * Get calculator by slug
 */
export const getCalculatorBySlug = async (slug: string): Promise<Calculator | null> => {
  try {
    const q = query(
      collection(db, CALCULATORS_COLLECTION),
      where('slug', '==', slug),
      where('isActive', '==', true)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }
    if (snapshot.size !== 1) throw new Error('Multiple active calculators use this slug. Update their slugs in the editor.');

    const docSnap = snapshot.docs[0];
    return prepareCalculator({
      id: docSnap.id,
      ...docSnap.data(),
    } as Calculator);
  } catch (error) {
    console.error('Error fetching calculator by slug:', error);
    return null;
  }
};

/**
 * Create a new calculator
 */
export const createCalculator = async (
  calculator: Omit<Calculator, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
): Promise<string> => {
  try {
    validateCalculator(calculator);
    await assertUniqueSlug(calculator.slug);
    const docRef = doc(collection(db, CALCULATORS_COLLECTION));
    const now = Timestamp.now();

    const newCalculator: Calculator = {
      ...calculator,
      id: docRef.id,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(docRef, { ...newCalculator, steps: JSON.parse(JSON.stringify(newCalculator.steps)) });
    return docRef.id;
  } catch (error) {
    console.error('Error creating calculator:', error);
    throw error;
  }
};

/**
 * Update an existing calculator
 */
export const updateCalculator = async (
  id: string,
  updates: Partial<Omit<Calculator, 'id' | 'createdAt' | 'createdBy'>>
): Promise<void> => {
  try {
    const docRef = doc(db, CALCULATORS_COLLECTION, id);
    const existing = await getCalculatorById(id);
    if (!existing) throw new Error('Calculator not found.');
    validateCalculator({ ...existing, ...updates });
    await assertUniqueSlug(updates.slug ?? existing.slug, id);
    await updateDoc(docRef, {
      ...JSON.parse(JSON.stringify(updates)),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating calculator:', error);
    throw error;
  }
};

/**
 * Delete a calculator
 */
export const deleteCalculator = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, CALCULATORS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting calculator:', error);
    throw error;
  }
};

/**
 * Toggle calculator active status
 */
export const toggleCalculatorStatus = async (id: string, isActive: boolean): Promise<void> => {
  try {
    if (isActive) await updateCalculator(id, { isActive });
    else await updateDoc(doc(db, CALCULATORS_COLLECTION, id), { isActive: false, updatedAt: Timestamp.now() });
  } catch (error) {
    console.error('Error toggling calculator status:', error);
    throw error;
  }
};

// ===== Calculator Submissions =====

/**
 * Save a calculator submission and create a contact message
 * This function does two things:
 * 1. Saves the full calculator submission with all selections for analytics
 * 2. Creates a contact message so admins are notified and can follow up
 */
export const saveCalculatorSubmission = async (
  submission: CalculatorSubmissionRequest
): Promise<{ id: string; estimate: CalculatorEstimate }> => {
  const response = await fetch('/api/calculators/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(submission),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Unable to save your estimate. Please try again.');
  return result;
};

/**
 * Get all submissions for a calculator
 */
export const getCalculatorSubmissions = async (
  calculatorId: string
): Promise<CalculatorSubmission[]> => {
  try {
    const q = query(
      collection(db, SUBMISSIONS_COLLECTION),
      where('calculatorId', '==', calculatorId),
      orderBy('submittedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as CalculatorSubmission[];
  } catch (error) {
    console.error('Error fetching calculator submissions:', error);
    throw error;
  }
};

/**
 * Get all submissions (admin)
 */
export const getAllSubmissions = async (): Promise<CalculatorSubmission[]> => {
  try {
    const q = query(
      collection(db, SUBMISSIONS_COLLECTION),
      orderBy('submittedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as CalculatorSubmission[];
  } catch (error) {
    console.error('Error fetching all submissions:', error);
    throw error;
  }
};

/**
 * Update submission status
 */
export const updateSubmissionStatus = async (
  id: string,
  status: CalculatorSubmission['status']
): Promise<void> => {
  try {
    const docRef = doc(db, SUBMISSIONS_COLLECTION, id);
    await updateDoc(docRef, { status });
  } catch (error) {
    console.error('Error updating submission status:', error);
    throw error;
  }
};

async function assertUniqueSlug(slug: string, currentId?: string): Promise<void> {
  const matches = await getDocs(query(collection(db, CALCULATORS_COLLECTION), where('slug', '==', slug)));
  if (matches.docs.some(match => match.id !== currentId)) throw new Error('This calculator slug is already in use. Choose another slug.');
}

/** Resolve old service links that stored a document ID, as well as slug links. */
export async function getActiveCalculatorForService(reference: string): Promise<Calculator | null> {
  const byId = await getCalculatorById(reference);
  if (byId) return byId.isActive ? byId : null;
  return getCalculatorBySlug(reference);
}
