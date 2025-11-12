import { cookies } from 'next/headers';
import { verifyIdToken, getUserRole as getAdminUserRole } from './firebase/admin';

/**
 * Get the auth token from cookies
 */
async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');
  return token?.value || null;
}

/**
 * Get the authenticated user's UID from the token
 */
async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return null;
    }

    const decodedToken = await verifyIdToken(token);
    return decodedToken?.uid || null;
  } catch (error) {
    console.error('Error getting authenticated user ID:', error);
    return null;
  }
}

/**
 * Check if user is authenticated (server-side)
 */
export async function isAuthenticated(): Promise<boolean> {
  const userId = await getAuthenticatedUserId();
  return userId !== null;
}

/**
 * Get user role from Firestore (server-side)
 */
export async function getUserRole(): Promise<string | null> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return null;
    }

    const role = await getAdminUserRole(userId);
    return role;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Check if user has admin role (server-side)
 */
export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === 'admin' || role === 'super_admin';
}

/**
 * Redirect helper for server components
 */
export function redirectTo(path: string) {
  return {
    redirect: {
      destination: path,
      permanent: false,
    },
  };
}
