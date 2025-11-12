'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Badge from '@/components/ui/Badge';
import { Product, getEffectivePrice, calculateSalePercent, getSaleEndText, isCurrentlyOnSale } from '@/types/product';
import { useCart } from '@/lib/contexts/CartContext';
import { Tag } from '@/types/tag';
import { getAllTags } from '@/services/tag-service';
import WishlistButton from '@/components/wishlist/WishlistButton';

type ProductWithDates = Omit<Product, 'createdAt' | 'updatedAt' | 'saleStart' | 'saleEnd'> & {
  createdAt: Date;
  updatedAt: Date;
  saleStart?: Date;
  saleEnd?: Date;
};

interface ProductCardProps {
  product: Product | ProductWithDates;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const {
    id,
    name,
    slug,
    price,
    salePrice,
    onSale,
    images,
    stock,
    unit = 'each',
    tags,
    lowStockThreshold = 5,
  } = product;

  const displayPrice = getEffectivePrice(product as Product);
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock <= lowStockThreshold;
  const salePercent = calculateSalePercent(price, salePrice);
  const { addToCart, updateQuantity, cart } = useCart();
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);

  // Get current quantity in cart
  const cartItem = cart.items.find(item => item.productId === id);
  const currentQuantity = cartItem?.quantity || 0;

  // Load tags on mount
  useEffect(() => {
    const loadTags = async () => {
      try {
        const allTags = await getAllTags(true);
        setAvailableTags(allTags);
      } catch (error) {
        console.error('Error loading tags:', error);
      }
    };
    loadTags();
  }, []);

  // Get tag objects for this product
  const productTags = availableTags.filter(tag => tags.includes(tag.slug));

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentQuantity === 0) {
      addToCart(product, 1);
    } else {
      updateQuantity(id, currentQuantity + 1);
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    updateQuantity(id, currentQuantity - 1);
  };

  const isNewArrival = (() => {
    // Handle both Firestore Timestamps and plain Date objects
    const createdAt = product.createdAt instanceof Date
      ? product.createdAt
      : product.createdAt.toDate();
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 1; // Consider new if added within last 30 days
  });

  return (
    <div className="relative h-full">
      <Link href={`/products/${slug}`}>
        <div className="relative bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
          {/* Image Container */}
          <div className="relative aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
            <Image
              src={images[0] || '/placeholder-product.jpg'}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />

            {/* Wishlist Button */}
            <div className="absolute top-2 left-2 z-10">
              <WishlistButton product={product as Product} size="sm" />
            </div>
            {/* Badges */}
            <div className="absolute bottom-2 left-2 right-2 flex gap-2 flex-wrap items-center">
              {productTags.map(tag => (
                <div key={tag.id} className="relative w-6 h-6 rounded overflow-hidden bg-white shadow-sm">
                  <Image
                    src={tag.imageUrl}
                    alt={tag.name}
                    fill
                    className="object-cover"
                    title={tag.name}
                  />
                </div>
              ))}
            </div>

            {/* Stock Status */}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center">
                <Badge variant="default">Out of Stock</Badge>
              </div>
            )}

            {/* Sale Badge */}
            {!isOutOfStock && (onSale || isCurrentlyOnSale(product)) && salePercent > 0 && (
              <div
                className="absolute bottom-4 right-0 bg-red-600 text-white text-xs font-bold px-14 py-2 transform rotate-[-45deg] translate-x-[25%] shadow-md text-center cursor-default select-none"
                onClick={(e) => e.preventDefault()}
              >
                {getSaleEndText(product) ? (
                  <>
                    SALE!<br />
                    {getSaleEndText(product)}<br /> 
                    {salePercent}% OFF
                  </>
                  ) : (
                  <>
                    SALE!<br />
                    {salePercent}% OFF
                  </>
              )}
              </div>
            )}
          </div>


        {/* Product Info */}
        <div className="p-4 flex flex-col flex-grow">
          {/* Price */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-gray-900">
              <span className="text-xl">${Math.floor(displayPrice)}</span>
              <span className="text-xs align-top">{(displayPrice % 1).toFixed(2).substring(2)}</span>
              {unit !== 'each' && <span className="text-sm text-gray-500">/{unit}</span>}
            </span>
            {onSale && salePrice && (
              <>
                <span className="text-sm text-red-500 line-through">
                  ${price.toFixed(2)}
                </span>
              </>
            )}
          </div>

          {/* Low Stock Warning */}
          {isLowStock && !isOutOfStock && (
            <p className="text-sm text-orange-600 mb-1">
              Only {stock} left in stock
            </p>
          )}
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
            {name}
          </h3>
        </div>
      </div>
      </Link>

      {/* Quantity Controls - Outside Link to allow overflow */}
      {!isOutOfStock && (
        <div className="absolute -top-4 -right-4 flex items-center gap-2 max-w-[50%] bg-white p-0.5 rounded-full outline outline-1 outline-gray-300 shadow-lg z-10">
          {currentQuantity > 0 && (
            <>
              <button
                onClick={handleDecrement}
                className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold hover:bg-red-200 transition-colors"
              >
                −
              </button>
              <span className="text-black font-semibold px-2 py-0.5">
                {currentQuantity}
              </span>
            </>
          )}
          <button
            onClick={handleIncrement}
            className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold hover:bg-green-700 transition-colors"
          >
            +
          </button>
        </div>
      )}
      {/* New Arrival Badge */}
            {!isOutOfStock && isNewArrival() && (
              <div className="absolute bottom-[-15px] left-0 right-0 flex justify-center z-10">
                <Badge variant="new">New Item!</Badge>
              </div>
            )}
    </div>
  );
};

export default ProductCard;
