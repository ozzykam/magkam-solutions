import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { User, UserRole, isSuperAdmin } from '@/types';
import { sendWelcomeEmail } from '../email/email-service';

/**
 * Register a new user with email and password
 */
export const registerUser = async (
  email: string,
  password: string,
  name: string
): Promise<User> => {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Update display name
    await updateProfile(firebaseUser, { displayName: name });

    // Send verification email
    await sendEmailVerification(firebaseUser);

    // Determine role (check if super admin)
    const role = isSuperAdmin(email) ? UserRole.SUPER_ADMIN : UserRole.CUSTOMER;

    // Create user document in Firestore
    const user: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      name,
      role,
      addresses: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), user);

    // Send welcome email
    try {
      console.log('💌 [Auth] Attempting to send welcome email to:', email);
      const emailSent = await sendWelcomeEmail(email, { name });
      if (emailSent) {
        console.log('✅ [Auth] Welcome email sent successfully to:', email);
      } else {
        console.error('❌ [Auth] Failed to send welcome email to:', email);
      }
    } catch (emailError) {
      console.error('❌ [Auth] Error sending welcome email:', emailError);
      // Don't fail registration if email fails
    }

    return user;
  } catch (error) {
    console.error('Registration error:', error);
    throw new Error('Failed to register user');
  }
};

/**
 * Sign in user with email and password
 * @param rememberMe - If true, uses local persistence (stays signed in). If false, uses session persistence (signs out when browser closes)
 */
export const signIn = async (email: string, password: string, rememberMe: boolean = true): Promise<User> => {
  try {
    // Set persistence based on rememberMe checkbox
    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

    if (!userDoc.exists()) {
      throw new Error('User data not found');
    }

    return userDoc.data() as User;
  } catch (error) {
    console.error('Sign-in error:', error);
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const err = error as { code?: string; message?: string };
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password');
      } else if (err.code === 'auth/too-many-requests') {
        throw new Error('Too many failed login attempts. Please try again later.');
      }
      throw new Error(err.message || 'Failed to sign in');
    }
    throw new Error('Failed to sign in');
  }
};

/**
 * Sign out current user
 */
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign-out error:', error);
    throw new Error('Failed to sign out');
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Password reset error:', error);
    throw new Error('Failed to send password reset email');
  }
};

/**
 * Get current user from Firestore
 */
export const getCurrentUser = async (firebaseUser: FirebaseUser): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

    if (!userDoc.exists()) {
      return null;
    }

    return userDoc.data() as User;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Change user password (requires current password for reauthentication)
 */
export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  try {
    const user = auth.currentUser;

    if (!user || !user.email) {
      throw new Error('No user is currently signed in');
    }

    // Reauthenticate user with current password
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update password
    await updatePassword(user, newPassword);
  } catch (error) {
    console.error('Change password error:', error);
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const err = error as { code?: string; message?: string };
      if (err.code === 'auth/wrong-password') {
        throw new Error('Current password is incorrect');
      } else if (err.code === 'auth/weak-password') {
        throw new Error('New password is too weak. Must be at least 6 characters');
      }
      throw new Error(err.message || 'Failed to change password');
    }
    throw new Error('Failed to change password');
  }
};
