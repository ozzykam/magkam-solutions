import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CartItem as CartItemType } from '@/types/cart';
import Button from '@/components/ui/Button';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onUpdateQuantity, onRemove }) => {
  const displayPrice = item.salePrice ?? item.price;
  const hasDiscount = item.salePrice && item.salePrice < item.price;

  const handleDecrease = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.productId, item.quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (item.quantity < item.stock) {
      onUpdateQuantity(item.productId, item.quantity + 1);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0 && value <= item.stock) {
      onUpdateQuantity(item.productId, value);
    }
  };

  return (
    <div className="flex gap-4 py-6 border-b border-gray-200">
      {/* Product Image */}
      <Link href={`/products/${item.productSlug}`} className="flex-shrink-0">
        <div className="relative w-24 h-24 bg-gray-100 rounded-md overflow-hidden">
          <Image
            src={item.image || '/placeholder-product.jpg'}
            alt={item.productName}
            fill
            className="object-cover"
          />
        </div>
      </Link>

      {/* Product Info */}
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex justify-between">
          <div>
            <Link
              href={`/products/${item.productSlug}`}
              className="text-gray-900 font-medium hover:text-primary-600 transition-colors"
            >
              {item.productName}
            </Link>
            <p className="text-sm text-gray-500 mt-1">
              By {item.vendorName}
            </p>
          </div>

          {/* Price (Mobile) */}
          <div className="md:hidden">
            <div className="text-gray-900 font-semibold">
              ${displayPrice.toFixed(2)}
              {item.unit && <span className="text-sm text-gray-500">/{item.unit}</span>}
            </div>
            {hasDiscount && (
              <div className="text-sm text-gray-500 line-through">
                ${item.price.toFixed(2)}
              </div>
            )}
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
            <Button
              onClick={handleDecrease}
              disabled={item.quantity <= 1}
              className="px-3 py-1 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-none !rounded-l-md"
              aria-label="Decrease quantity"
            >
              −
            </Button>
            <input
              type="number"
              value={item.quantity}
              onChange={handleQuantityChange}
              min="1"
              max={item.stock}
              className="w-16 text-center border-x border-gray-300 py-1 focus:outline-none"
              aria-label="Quantity"
            />
            <Button
              onClick={handleIncrease}
              disabled={item.quantity >= item.stock}
              className="px-3 py-1 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-none !rounded-r-md"
              aria-label="Increase quantity"
            >
              +
            </Button>
          </div>

          {/* Stock Warning */}
          {item.quantity >= item.stock && (
            <span className="text-sm text-orange-600">
              Max available: {item.stock}
            </span>
          )}
        </div>

        {/* Remove Button */}
        <div className="mt-2">
          <Button
            onClick={() => onRemove(item.productId)}
              className="text-sm text-white bg-red-600 hover:bg-red-700 transition-colors"          >
            Remove
          </Button>
        </div>
      </div>

      {/* Price (Desktop) */}
      <div className="hidden md:flex flex-col items-end gap-1">
        <div className="text-gray-900 font-semibold">
          ${displayPrice.toFixed(2)}
          {item.unit && <span className="text-sm text-gray-500">/{item.unit}</span>}
        </div>
        {hasDiscount && (
          <div className="text-sm text-gray-500 line-through">
            ${item.price.toFixed(2)}
          </div>
        )}
        <div className="text-sm text-gray-600 mt-2">
          Subtotal: ${item.subtotal.toFixed(2)}
        </div>
      </div>
    </div>
  );
};

export default CartItem;
