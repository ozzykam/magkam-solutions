import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  DocumentSnapshot,
  QueryConstraint,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Product, ProductFilters } from '@/types/product';
import { getAllDescendantCategoryIds } from './category-service';

const PRODUCTS_COLLECTION = 'products';

/**
 * Get all products with optional filters
 */
export const getProducts = async (filters?: ProductFilters): Promise<Product[]> => {
  try {
    const constraints: QueryConstraint[] = [];

    // Only active products
    constraints.push(where('isActive', '==', true));

    // Filter by category
    if (filters?.category) {
      constraints.push(where('categoryId', '==', filters.category));
    }

    // Filter by tags
    if (filters?.tags && filters.tags.length > 0) {
      constraints.push(where('tags', 'array-contains-any', filters.tags));
    }

    // Filter by in stock
    if (filters?.inStock) {
      constraints.push(where('stock', '>', 0));
    }

    // Filter by on sale
    if (filters?.onSale) {
      constraints.push(where('onSale', '==', true));
    }

    // Filter by featured
    if (filters?.isFeatured) {
      constraints.push(where('isFeatured', '==', true));
    }

    // Price filtering will be done client-side due to Firestore limitations
    // (can't do range queries on multiple fields)

    const q = query(collection(db, PRODUCTS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    let products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[];

    // Client-side price filtering
    if (filters?.minPrice !== undefined) {
      products = products.filter(p => {
        const price = p.onSale && p.salePrice ? p.salePrice : p.price;
        return price >= filters.minPrice!;
      });
    }

    if (filters?.maxPrice !== undefined) {
      products = products.filter(p => {
        const price = p.onSale && p.salePrice ? p.salePrice : p.price;
        return price <= filters.maxPrice!;
      });
    }

    // Client-side search filtering
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

/**
 * Get a single product by ID
 */
export const getProductById = async (productId: string): Promise<Product | null> => {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Product;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

/**
 * Get a single product by slug
 */
export const getProductBySlug = async (slug: string): Promise<Product | null> => {
  try {
    const q = query(
      collection(db, PRODUCTS_COLLECTION),
      where('slug', '==', slug),
      where('isActive', '==', true),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as Product;
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    throw error;
  }
};

/**
 * Get products by category (includes products from all subcategories)
 */
export const getProductsByCategory = async (categoryId: string): Promise<Product[]> => {
  try {
    // Get this category and all descendant category IDs
    const categoryIds = await getAllDescendantCategoryIds(categoryId);

    // Firestore 'in' query supports up to 10 values, so we need to batch if there are more
    const products: Product[] = [];

    // Process in batches of 10
    for (let i = 0; i < categoryIds.length; i += 10) {
      const batch = categoryIds.slice(i, i + 10);

      const q = query(
        collection(db, PRODUCTS_COLLECTION),
        where('categoryId', 'in', batch),
        where('isActive', '==', true),
        orderBy('name', 'asc')
      );

      const snapshot = await getDocs(q);

      const batchProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];

      products.push(...batchProducts);
    }

    // Sort all products by name
    products.sort((a, b) => a.name.localeCompare(b.name));

    return products;
  } catch (error) {
    console.error('Error fetching products by category:', error);
    throw error;
  }
};

/**
 * Get products by vendor
 */
export const getProductsByVendor = async (vendorId: string): Promise<Product[]> => {
  try {
    const q = query(
      collection(db, PRODUCTS_COLLECTION),
      where('vendorId', '==', vendorId),
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[];
  } catch (error) {
    console.error('Error fetching products by vendor:', error);
    throw error;
  }
};

/**
 * Get featured products
 */
export const getFeaturedProducts = async (limitCount: number = 8): Promise<Product[]> => {
  try {
    const q = query(
      collection(db, PRODUCTS_COLLECTION),
      where('isFeatured', '==', true),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[];
  } catch (error) {
    console.error('Error fetching featured products:', error);
    throw error;
  }
};

/**
 * Get products on sale
 */
export const getProductsOnSale = async (limitCount?: number): Promise<Product[]> => {
  try {
    const constraints: QueryConstraint[] = [
      where('onSale', '==', true),
      where('isActive', '==', true),
      orderBy('salePercent', 'desc'),
    ];

    if (limitCount) {
      constraints.push(limit(limitCount));
    }

    const q = query(collection(db, PRODUCTS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[];
  } catch (error) {
    console.error('Error fetching products on sale:', error);
    throw error;
  }
};

/**
 * Search products by name or tags
 */
export const searchProducts = async (searchQuery: string): Promise<Product[]> => {
  try {
    // Note: Firestore doesn't support full-text search natively
    // For production, consider using Algolia, Elasticsearch, or Firestore's text search extension
    // This is a basic implementation that fetches all products and filters client-side

    const q = query(
      collection(db, PRODUCTS_COLLECTION),
      where('isActive', '==', true)
    );

    const snapshot = await getDocs(q);
    const searchLower = searchQuery.toLowerCase();

    const products = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];

    // Client-side search
    return products.filter(product =>
      product.name.toLowerCase().includes(searchLower) ||
      product.description.toLowerCase().includes(searchLower) ||
      product.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
      product.categoryName.toLowerCase().includes(searchLower)
    );
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

/**
 * Get related products based on current product
 */
export const getRelatedProducts = async (
  currentProduct: Product,
  limitCount: number = 4
): Promise<Product[]> => {
  try {
    // Get products from same category
    const q = query(
      collection(db, PRODUCTS_COLLECTION),
      where('categoryId', '==', currentProduct.categoryId),
      where('isActive', '==', true),
      limit(limitCount + 1) // +1 to account for current product
    );

    const snapshot = await getDocs(q);

    const products = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];

    // Filter out current product
    const filtered = products.filter(p => p.id !== currentProduct.id);

    // Return limited results
    return filtered.slice(0, limitCount);
  } catch (error) {
    console.error('Error fetching related products:', error);
    throw error;
  }
};

/**
 * Decrement product stock by a given quantity
 */
export const decrementProductStock = async (productId: string, quantity: number): Promise<void> => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);

    // Use Firestore's increment to atomically decrease stock
    await updateDoc(productRef, {
      stock: increment(-quantity),
      updatedAt: Timestamp.now(),
    });

    console.log(`Decremented stock for product ${productId} by ${quantity}`);
  } catch (error) {
    console.error(`Error decrementing stock for product ${productId}:`, error);
    throw error;
  }
};
