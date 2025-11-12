'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartItem from '@/components/cart/CartItem';
import CartSummary from '@/components/cart/CartSummary';
import EmptyCart from '@/components/cart/EmptyCart';
import { useCart } from '@/lib/contexts/CartContext';
import { useToast } from '@/components/ui/ToastContainer';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, isLoading } = useCart();
  const toast = useToast();

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    updateQuantity(productId, quantity);
  };

  const handleRemoveItem = (productId: string) => {
    const item = cart.items.find(item => item.productId === productId);
    removeFromCart(productId);
    if (item) {
      toast?.success(`${item.productName} removed from cart`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading cart...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            {cart.itemCount > 0 && (
              <p className="text-gray-600 mt-2">
                {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'} in your cart
              </p>
            )}
          </div>

          {/* Empty Cart State */}
          {cart.itemCount === 0 ? (
            <EmptyCart />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                  {cart.items.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      onUpdateQuantity={handleUpdateQuantity}
                      onRemove={handleRemoveItem}
                    />
                  ))}
                </div>

                {/* Additional Actions */}
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to clear your cart?')) {
                        cart.items.forEach(item => removeFromCart(item.productId));
                        toast?.success('Cart cleared');
                      }
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>

              {/* Cart Summary */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <CartSummary
                    subtotal={cart.subtotal}
                    itemCount={cart.itemCount}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
