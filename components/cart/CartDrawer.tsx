'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/contexts/CartContext';
import { Button } from '@/components/ui';
import { XMarkIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart, removeFromCart, updateQuantity } = useCart();

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-xs z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Shopping Cart</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close cart"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Cart Items */}
        {cart.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <ShoppingBagIcon className="w-24 h-24 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-600 mb-6">Add some products to get started!</p>
            <Button variant="primary" onClick={onClose}>
              Continue Browsing
            </Button>
          </div>
        ) : (
          <>
            {/* Items List - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-200">
                  {/* Product Image */}
                  <Link
                    href={`/products/${item.productSlug}`}
                    className="flex-shrink-0"
                    onClick={onClose}
                  >
                    <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={item.image || '/images/placeholder-product.png'}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </Link>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.productSlug}`}
                      className="block font-semibold text-gray-900 hover:text-primary-600 truncate"
                      onClick={onClose}
                    >
                      {item.productName}
                    </Link>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatPrice(item.salePrice ?? item.price)}
                      {item.unit && ` / ${item.unit}`}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Vendor: {item.vendorName}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="ml-auto text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer - Sticky */}
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              {/* Subtotal */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold text-gray-900">Subtotal</span>
                <span className="text-2xl font-bold text-gray-900">
                  {formatPrice(cart.subtotal)}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4 text-center">
                Delivery fees and taxes calculated at checkout
              </p>

              {/* Actions */}
              <div className="space-y-3">
                <Link href="/cart" onClick={onClose}>
                  <Button variant="primary" size="lg" fullWidth>
                    View Cart ({cart.items.length})
                  </Button>
                </Link>
                <Link href="/checkout" onClick={onClose}>
                  <Button variant="outline" size="lg" fullWidth>
                    Checkout
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
