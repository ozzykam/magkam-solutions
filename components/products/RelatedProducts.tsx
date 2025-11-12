import React from 'react';
import ProductGrid from './ProductGrid';
import { Product } from '@/types/product';

type ProductWithDates = Omit<Product, 'createdAt' | 'updatedAt' | 'saleStart' | 'saleEnd'> & {
  createdAt: Date;
  updatedAt: Date;
  saleStart?: Date;
  saleEnd?: Date;
};

interface RelatedProductsProps {
  currentProduct: Product | ProductWithDates;
  allProducts: (Product | ProductWithDates)[];
  maxProducts?: number;
}

const RelatedProducts: React.FC<RelatedProductsProps> = ({
  currentProduct,
  allProducts,
  maxProducts = 4,
}) => {
  // Algorithm to find related products:
  // 1. Same category
  // 2. Similar tags
  // 3. Similar price range
  // 4. Exclude current product
  const getRelatedProducts = (): (Product | ProductWithDates)[] => {
    const relatedProducts = allProducts
      .filter(product => product.id !== currentProduct.id && product.isActive)
      .map(product => {
        let score = 0;

        // Same category = +10 points
        if (product.categoryId === currentProduct.categoryId) {
          score += 10;
        }

        // Shared tags = +5 points per tag
        const sharedTags = product.tags.filter(tag =>
          currentProduct.tags.includes(tag)
        );
        score += sharedTags.length * 5;

        // Similar price range (±30%) = +5 points
        const currentPrice = currentProduct.onSale && currentProduct.salePrice
          ? currentProduct.salePrice
          : currentProduct.price;
        const productPrice = product.onSale && product.salePrice
          ? product.salePrice
          : product.price;
        const priceDiff = Math.abs(currentPrice - productPrice) / currentPrice;
        if (priceDiff <= 0.3) {
          score += 5;
        }

        // Same vendor = +3 points
        if (product.vendorId === currentProduct.vendorId) {
          score += 3;
        }

        return { product, score };
      })
      .filter(item => item.score > 0) // Only keep products with some relation
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .slice(0, maxProducts) // Limit results
      .map(item => item.product);

    return relatedProducts;
  };

  const relatedProducts = getRelatedProducts();

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        You May Also Like
      </h2>
      <ProductGrid
        products={relatedProducts}
        columns={4}
        emptyMessage="No related products found"
      />
    </div>
  );
};

export default RelatedProducts;
