'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWishlist } from '@/lib/contexts/WishlistContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useToast } from '@/components/ui';
import { Product } from '@/types/product';

interface WishlistButtonProps {
  product: Product;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function WishlistButton({
  product,
  className = '',
  showLabel = false,
  size = 'md',
}: WishlistButtonProps) {
  const router = useRouter();
  const { isInWishlist, addItem, removeItem } = useWishlist();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const inWishlist = isInWishlist(product.id);

  const sizeClasses = {
    sm: 'w-8 h-8 text-base',
    md: 'w-10 h-10 text-lg',
    lg: 'w-12 h-12 text-xl',
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation if button is inside a link
    e.stopPropagation(); // Prevent event bubbling

    if (!isAuthenticated) {
      toast?.error('Please log in to save items to your wishlist');
      router.push(`/login?redirect=/shop/${product.slug}`);
      return;
    }

    try {
      setIsProcessing(true);

      if (inWishlist) {
        await removeItem(product.id);
        toast?.success('Removed from wishlist');
      } else {
        await addItem(product);
        toast?.success(
          product.stock === 0
            ? 'Added to wishlist. We\'ll notify you when it\'s back in stock!'
            : 'Added to wishlist'
        );
      }
    } catch (error) {
      console.error('Wishlist error:', error);
      toast?.error('Failed to update wishlist');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isProcessing}
      className={`
        ${sizeClasses[size]}
        ${inWishlist
          ? 'text-red-500 hover:text-red-600'
          : 'text-gray-400 hover:text-red-500'
        }
        ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        flex items-center justify-center
        transition-all duration-200
        bg-white rounded-full shadow-sm hover:shadow-md
        border-2 border-gray-200
        ${className}
      `}
      title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      {isProcessing ? (
        <svg
          className="animate-spin"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <>
          {inWishlist ? (
            // Filled heart
            <svg
              fill="currentColor"
              viewBox="0 0 24 24"
              className="w-5 h-5"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          ) : (
            // Outline heart
            <svg
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          )}
        </>
      )}
      {showLabel && (
        <span className="ml-2 text-sm font-medium">
          {inWishlist ? 'Saved' : 'Save'}
        </span>
      )}
    </button>
  );
}
