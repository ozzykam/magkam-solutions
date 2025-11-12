'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';

import { useRouter } from 'next/navigation';
import { useWishlist } from '@/lib/contexts/WishlistContext';
import { useCart } from '@/lib/contexts/CartContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useToast } from '@/components/ui';
import { Button, Card } from '@/components/ui';
import { WishlistItem } from '@/types/wishlist';
import { Product } from '@/types/product';
import { getProductById } from '@/services/product-service';
import Footer from '../../../components/layout/Footer';

export default function WishlistPage() {
  const router = useRouter();
  const { wishlist, loading, removeItem, toggleNotification } = useWishlist();
  const { addToCart: addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [processingItem, setProcessingItem] = useState<string | null>(null);
  const [productData, setProductData] = useState<Map<string, Product>>(new Map());
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/wishlist');
    }
  }, [isAuthenticated, loading, router]);

  // Fetch current product data for all wishlist items
  useEffect(() => {
    const fetchProductData = async () => {
      if (wishlist.length === 0) {
        setLoadingProducts(false);
        return;
      }

      setLoadingProducts(true);
      const dataMap = new Map<string, Product>();

      for (const item of wishlist) {
        try {
          const product = await getProductById(item.productId);
          if (product) {
            dataMap.set(item.productId, product);
          }
        } catch (error) {
          console.error(`Error fetching product ${item.productId}:`, error);
        }
      }

      setProductData(dataMap);
      setLoadingProducts(false);
    };

    fetchProductData();
  }, [wishlist]);

  const handleRemove = async (productId: string) => {
    try {
      setProcessingItem(productId);
      await removeItem(productId);
      toast?.success('Removed from wishlist');
    } catch (error) {
      console.error('Error removing item from wishlist:', error);
      toast?.error('Failed to remove item');
    } finally {
      setProcessingItem(null);
    }
  };

  const handleToggleNotification = async (productId: string, enabled: boolean) => {
    try {
      await toggleNotification(productId, enabled);
      toast?.success(enabled ? 'Notifications enabled' : 'Notifications disabled');
    } catch (error) {
      console.error('Error updating notification setting:', error);
      toast?.error('Failed to update notification setting');
    }
  };

  const handleMoveToCart = async (item: WishlistItem) => {
    try {
      setProcessingItem(item.productId);

      // Get current product data
      const product = productData.get(item.productId);

      if (!product) {
        toast?.error('Product not found');
        return;
      }

      if (product.stock <= 0) {
        toast?.error('This item is currently out of stock');
        return;
      }

      // Add to cart
      await addToCart(product, 1);
      toast?.success('Added to cart');
    } catch (error) {
      console.error('Error adding item to cart:', error);
      toast?.error('Failed to add to cart');
    } finally {
      setProcessingItem(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading your wishlist...</p>
          </div>
        </div>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">My Wishlist</h1>

          {/* Empty State */}
          <Card className="text-center py-16">
            <div className="text-6xl mb-4">💝</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-gray-600 mb-6">
              Start adding products you love to your wishlist!
            </p>
            <Link href="/shop">
              <Button variant="primary" size="lg">
                Browse Products
              </Button>
            </Link>
          </Card>
        </div>
      </div>
      <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
          <p className="mt-2 text-gray-600">
            {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>

        {loadingProducts && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-sm text-gray-600">Loading product details...</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {wishlist.map((item) => {
            const product = productData.get(item.productId);
            const isInStock = product ? product.stock > 0 : item.wasInStockWhenAdded;
            const currentPrice = product ? (product.onSale && product.salePrice ? product.salePrice : product.price) : item.productPrice;

            return (
              <Card key={item.id} className="p-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Product Image */}
                  <Link
                    href={`/products/${item.productSlug}`}
                    className="flex-shrink-0"
                  >
                    <div className="relative w-full sm:w-32 h-48 sm:h-32 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={item.productImage || '/images/placeholder-product.png'}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                      {!isInStock && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Product Info */}
                  <div className="flex-grow">
                    <Link
                      href={`/products/${item.productSlug}`}
                      className="block mb-2"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors">
                        {item.productName}
                      </h3>
                    </Link>

                    <p className="text-sm text-gray-600 mb-2">
                      By {item.vendorName}
                    </p>

                    <div className="mb-3">
                      {product?.onSale && product?.salePrice ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-red-600">
                            ${product.salePrice.toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            ${product.price.toFixed(2)}
                          </span>
                          <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded">
                            {product.salePercent}% OFF
                          </span>
                        </div>
                      ) : (
                        <span className="text-xl font-bold text-primary-600">
                          ${currentPrice.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Stock Status */}
                    {!isInStock && (
                      <div className="mb-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          Out of Stock
                        </span>
                      </div>
                    )}

                    {/* Restock Notification Toggle (for out-of-stock items) */}
                    {!isInStock && (
                      <div className="mb-4 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`notify-${item.productId}`}
                          checked={item.notifyWhenRestocked}
                          onChange={(e) =>
                            handleToggleNotification(
                              item.productId,
                              e.target.checked
                            )
                          }
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                        />
                        <label
                          htmlFor={`notify-${item.productId}`}
                          className="text-sm text-gray-700 cursor-pointer"
                        >
                          Notify me when back in stock
                          {item.notificationSent && (
                            <span className="ml-2 text-primary-600">
                              ✓ Notified
                            </span>
                          )}
                        </label>
                      </div>
                    )}

                    {/* Stock quantity (for in-stock items) */}
                    {isInStock && product && (
                      <p className="text-sm text-gray-600 mb-2">
                        {product.stock > 10
                          ? '✓ In Stock'
                          : `⚠️ Only ${product.stock} left`}
                      </p>
                    )}

                    {/* Added Date */}
                    <p className="text-xs text-gray-500">
                      Added on {item.addedAt.toDate().toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col gap-2 sm:items-end">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleMoveToCart(item)}
                      disabled={!isInStock || processingItem === item.productId || !product}
                      className="flex-1 sm:flex-none"
                    >
                      {processingItem === item.productId ? (
                        'Adding...'
                      ) : !isInStock ? (
                        'Out of Stock'
                      ) : (
                        'Add to Cart'
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemove(item.productId)}
                      disabled={processingItem === item.productId}
                      className="flex-1 sm:flex-none"
                    >
                      {processingItem === item.productId
                        ? 'Removing...'
                        : 'Remove'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Continue Shopping */}
        <div className="mt-8 text-center">
          <Link href="/shop">
            <Button variant="outline" size="lg">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
    <Footer />
    </div>
  );
}
