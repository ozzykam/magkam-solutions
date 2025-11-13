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
import { createContactMessage } from './contact-message-service';

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
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Calculator[];
  } catch (error) {
    console.error('Error fetching calculators:', error);
    return [];
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

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Calculator;
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

    const docSnap = snapshot.docs[0];
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Calculator;
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
    const docRef = doc(collection(db, CALCULATORS_COLLECTION));
    const now = Timestamp.now();

    const newCalculator: Calculator = {
      ...calculator,
      id: docRef.id,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(docRef, newCalculator);
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
    await updateDoc(docRef, {
      ...updates,
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
    await updateCalculator(id, { isActive });
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
  submission: Omit<CalculatorSubmission, 'id' | 'submittedAt'>
): Promise<string> => {
  try {
    const docRef = doc(collection(db, SUBMISSIONS_COLLECTION));

    const newSubmission: CalculatorSubmission = {
      ...submission,
      id: docRef.id,
      submittedAt: Timestamp.now(),
    };

    // Save the calculator submission
    await setDoc(docRef, newSubmission);

    // Create a contact message so this appears in the admin messages panel
    if (submission.contactInfo?.email) {
      // Format the selections as a readable message
      const selectionsText = Object.entries(submission.selections)
        .filter(([_, value]) => value !== false && value !== 0) // Only show selected features
        .map(([key, value]) => {
          if (typeof value === 'boolean') {
            return `• ${key.replace(/_/g, ' ')}`;
          }
          return `• ${key.replace(/_/g, ' ')}: ${value}`;
        })
        .join('\n');

      const message = `
Calculator: ${submission.calculatorName}

Selected Features:
${selectionsText}

Estimated Cost: $${submission.totalPrice.toLocaleString()}
Total Hours: ${submission.totalHours}
Hourly Rate: $${submission.hourlyRate}

The customer has requested a consultation for their project.
      `.trim();

      await createContactMessage({
        name: submission.contactInfo.name || 'Anonymous',
        email: submission.contactInfo.email,
        message,
        subject: `Calculator Estimate Request - ${submission.calculatorName}`,
        source: 'calculator',
        metadata: {
          calculatorId: submission.calculatorId,
          submissionId: docRef.id,
          totalPrice: submission.totalPrice,
          totalHours: submission.totalHours,
        },
      });
    }

    return docRef.id;
  } catch (error) {
    console.error('Error saving calculator submission:', error);
    throw error;
  }
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
    return [];
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
    return [];
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
