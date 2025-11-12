'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { WishlistItem } from '@/types/wishlist';
import { Product } from '@/types/product';
import {
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,
  toggleRestockNotification,
} from '@/services/wishlist-service';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  wishlist: WishlistItem[];
  loading: boolean;
  isInWishlist: (productId: string) => boolean;
  addItem: (product: Product) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  toggleNotification: (productId: string, enabled: boolean) => Promise<void>;
  getItemCount: () => number;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWishlist = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const items = await getUserWishlist(user.uid);
      setWishlist(items);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load wishlist when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      loadWishlist();
    } else {
      setWishlist([]);
      setLoading(false);
    }
  }, [isAuthenticated, user, loadWishlist]);

  const isInWishlist = (productId: string): boolean => {
    return wishlist.some(item => item.productId === productId);
  };

  const addItem = async (product: Product) => {
    if (!user) {
      throw new Error('Must be logged in to add to wishlist');
    }

    try {
      await addToWishlist(user.uid, product, user.email, user.name);
      await loadWishlist(); // Refresh wishlist
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add to wishlist';
      throw new Error(errorMessage);
    }
  };

  const removeItem = async (productId: string) => {
    if (!user) {
      throw new Error('Must be logged in');
    }

    try {
      await removeFromWishlist(user.uid, productId);
      await loadWishlist(); // Refresh wishlist
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove from wishlist';
      throw new Error(errorMessage);
    }
  };

  const toggleNotification = async (productId: string, enabled: boolean) => {
    if (!user) {
      throw new Error('Must be logged in');
    }

    try {
      await toggleRestockNotification(user.uid, productId, enabled);
      await loadWishlist(); // Refresh wishlist
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update notification preference';
      throw new Error(errorMessage);
    }
  };

  const getItemCount = (): number => {
    return wishlist.length;
  };

  const refreshWishlist = async () => {
    await loadWishlist();
  };

  const value: WishlistContextType = {
    wishlist,
    loading,
    isInWishlist,
    addItem,
    removeItem,
    toggleNotification,
    getItemCount,
    refreshWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
