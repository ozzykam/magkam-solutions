'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import WishlistButton from '@/components/wishlist/WishlistButton';
import { Product } from '@/types/product';
import { useCart } from '@/lib/contexts/CartContext';
import { useToast } from '@/components/ui/ToastContainer';

type ProductWithDates = Omit<Product, 'createdAt' | 'updatedAt' | 'saleStart' | 'saleEnd'> & {
  createdAt: Date;
  updatedAt: Date;
  saleStart?: Date;
  saleEnd?: Date;
};

interface ProductActionsProps {
  product: Product | ProductWithDates;
  isOutOfStock: boolean;
}

export default function ProductActions({ product, isOutOfStock }: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const toast = useToast();

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      salePrice: product.salePrice,
      images: product.images,
      stock: product.stock,
      unit: product.unit,
      vendorId: product.vendorId,
      vendorName: product.vendorName,
    }, quantity);
    toast?.success(`Added ${quantity} ${product.name} to cart`);
    setQuantity(1); // Reset quantity after adding
  };

  return (
    <>
      {/* Quantity Selector */}
      {!isOutOfStock && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity
          </label>
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-gray-300 rounded-md">
              <button
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                −
              </button>
              <span className="px-6 py-2 border-x border-gray-300 font-semibold">
                {quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= product.stock}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
            <span className="text-gray-600">{product.stock} available</span>
          </div>
        </div>
      )}

      {/* Add to Cart and Wishlist Buttons */}
      <div className="flex gap-3">
        <Button
          variant={isOutOfStock ? 'outline' : 'primary'}
          size="lg"
          fullWidth
          disabled={isOutOfStock}
          onClick={handleAddToCart}
        >
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </Button>
        <WishlistButton product={product as Product} size="lg" />
      </div>
    </>
  );
}
