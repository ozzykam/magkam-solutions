import React from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

const EmptyCart: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Empty Cart Icon */}
      <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <svg
          className="w-16 h-16 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </div>

      {/* Message */}
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
      <p className="text-gray-600 text-center mb-8 max-w-md">
        Looks like you haven&apos;t added anything to your cart yet. Start shopping to fill it up!
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/shop">
          <Button variant="primary" size="lg">
            Browse Products
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" size="lg">
            Go to Homepage
          </Button>
        </Link>
      </div>

      {/* Featured Categories (Optional) */}
      <div className="mt-12 w-full max-w-2xl">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 text-center">
          Popular Categories
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { name: 'Produce', href: '/categories/produce', emoji: '🥬' },
            { name: 'Dairy', href: '/categories/dairy', emoji: '🧀' },
            { name: 'Bakery', href: '/categories/bakery', emoji: '🥖' },
            { name: 'Meat', href: '/categories/meat', emoji: '🥩' },
          ].map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-3xl mb-2">{category.emoji}</span>
              <span className="text-sm font-medium text-gray-900">{category.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmptyCart;
