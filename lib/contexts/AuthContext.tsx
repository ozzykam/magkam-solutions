'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getCurrentUser } from '@/lib/firebase/auth';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Function to update auth token cookie
    const updateAuthTokenCookie = async (firebaseUser: FirebaseUser) => {
      try {
        // Force refresh to get a new token
        const idToken = await firebaseUser.getIdToken(true);
        // Set cookie with 1 hour expiration
        // Add Secure flag in production or when using HTTPS
        const isSecure = window.location.protocol === 'https:' || process.env.NODE_ENV === 'production';
        const secureFlag = isSecure ? '; Secure' : '';
        document.cookie = `auth-token=${idToken}; path=/; max-age=3600; SameSite=Strict${secureFlag}`;
        console.log('[AuthContext] Auth token refreshed and stored in cookie');
      } catch (error) {
        console.error('Error updating auth token:', error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        // Get user data from Firestore
        const userData = await getCurrentUser(firebaseUser);
        setUser(userData);

        // Store initial auth token
        await updateAuthTokenCookie(firebaseUser);
      } else {
        setUser(null);
        // Clear auth token cookie on logout
        document.cookie = 'auth-token=; path=/; max-age=0';
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Auto-refresh token every 50 minutes (before 1 hour expiration)
  useEffect(() => {
    if (!firebaseUser) return;

    const refreshInterval = setInterval(async () => {
      console.log('[AuthContext] Auto-refreshing auth token...');
      try {
        const idToken = await firebaseUser.getIdToken(true);
        const isSecure = window.location.protocol === 'https:' || process.env.NODE_ENV === 'production';
        const secureFlag = isSecure ? '; Secure' : '';
        document.cookie = `auth-token=${idToken}; path=/; max-age=3600; SameSite=Strict${secureFlag}`;
        console.log('[AuthContext] Auth token refreshed successfully');
      } catch (error) {
        console.error('[AuthContext] Error refreshing auth token:', error);
      }
    }, 50 * 60 * 1000); // 50 minutes

    return () => clearInterval(refreshInterval);
  }, [firebaseUser]);

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
