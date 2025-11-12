import { Timestamp } from 'firebase/firestore';

export interface CartItem {
  id: string;                 // Unique cart item ID
  productId: string;
  productName: string;
  productSlug: string;
  productSku?: string;
  price: number;             // Current price
  salePrice?: number;        // Sale price if applicable
  quantity: number;
  image: string;
  stock: number;
  unit?: string;             // 'lb', 'oz', 'each', etc.
  subtotal: number;          // price * quantity (or salePrice * quantity)
  vendorId: string;
  vendorName: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;          // Sum of all item subtotals
  itemCount: number;         // Total number of items
}

// Saved cart in Firestore (for logged-in users)
export interface SavedCart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt?: Timestamp;     // Optional expiration for abandoned carts
}

// Helper to calculate cart totals
export const calculateCartTotals = (items: CartItem[]): { subtotal: number; itemCount: number } => {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    itemCount,
  };
};

// Helper to calculate item subtotal
export const calculateItemSubtotal = (item: Omit<CartItem, 'subtotal'>): number => {
  const price = item.salePrice ?? item.price;
  return Math.round(price * item.quantity * 100) / 100;
};

// Helper to create cart item from product
export const createCartItemFromProduct = (
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    salePrice?: number;
    images: string[];
    stock: number;
    unit?: string;
    vendorId: string;
    vendorName: string;
  },
  quantity: number
): Omit<CartItem, 'id'> => {
  const itemPrice = product.salePrice ?? product.price;
  const subtotal = Math.round(itemPrice * quantity * 100) / 100;

  return {
    productId: product.id,
    productName: product.name,
    productSlug: product.slug,
    price: product.price,
    salePrice: product.salePrice,
    quantity,
    image: product.images[0] || '',
    stock: product.stock,
    unit: product.unit,
    subtotal,
    vendorId: product.vendorId,
    vendorName: product.vendorName,
  };
};
