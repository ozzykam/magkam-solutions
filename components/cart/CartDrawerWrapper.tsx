'use client';

import React from 'react';
import { useCart } from '@/lib/contexts/CartContext';
import CartDrawer from './CartDrawer';

/**
 * Wrapper component to connect CartDrawer to CartContext
 * This needs to be a separate client component since we're using it in the root layout
 */
export default function CartDrawerWrapper() {
  const { isCartDrawerOpen, closeCartDrawer } = useCart();

  return <CartDrawer isOpen={isCartDrawerOpen} onClose={closeCartDrawer} />;
}
