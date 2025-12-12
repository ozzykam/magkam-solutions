import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin';
import { isAdmin } from '@/lib/auth-helpers';

/**
 * Delete a user completely (Admin only)
 * Deletes from both Firestore and Firebase Auth
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check if user is admin
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }

    // Delete from Firestore
    const firestore = getAdminFirestore();
    await firestore.collection('users').doc(userId).delete();
    console.log(`Deleted user ${userId} from Firestore`);

    // Delete from Firebase Auth
    try {
      const auth = getAdminAuth();
      await auth.deleteUser(userId);
      console.log(`Deleted user ${userId} from Firebase Auth`);
    } catch (authError: any) {
      // If user doesn't exist in Auth, that's okay (already deleted or never existed)
      if (authError.code === 'auth/user-not-found') {
        console.log(`User ${userId} not found in Firebase Auth (may have been already deleted)`);
      } else {
        throw authError;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully from both Firestore and Auth',
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}
