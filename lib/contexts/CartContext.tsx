'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Cart, CartItem, calculateCartTotals, createCartItemFromProduct } from '@/types/cart';
import { saveCart, getSavedCart, clearCart as clearSavedCart } from '@/services/cart-service';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart;
  addToCart: (product: {
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
  }, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getUniqueItemCount: () => number;
  isLoading: boolean;
  isCartDrawerOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  toggleCartDrawer: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'local-market-cart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart>({ items: [], subtotal: 0, itemCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  // Load cart on mount and when user changes
  useEffect(() => {
    const loadCart = async () => {
      setIsLoading(true);
      try {
        if (isAuthenticated && user?.uid) {
          // Load from Firestore for logged-in users
          const savedCart = await getSavedCart(user.uid);
          if (savedCart) {
            setCart({
              items: savedCart.items,
              subtotal: savedCart.subtotal,
              itemCount: savedCart.itemCount,
            });
          } else {
            // Check if there's a local cart to merge
            const localCart = loadLocalCart();
            if (localCart.items.length > 0) {
              setCart(localCart);
              // Save to Firestore
              await saveCart(user.uid, localCart.items);
              // Clear local storage
              localStorage.removeItem(CART_STORAGE_KEY);
            }
          }
        } else {
          // Load from local storage for guests
          const localCart = loadLocalCart();
          setCart(localCart);
        }
      } catch (error) {
        console.error('Error loading cart:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, [isAuthenticated, user?.uid]);

  // Save cart whenever it changes
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user?.uid) {
        // Save to Firestore
        saveCart(user.uid, cart.items).catch(error => {
          console.error('Error saving cart to Firestore:', error);
        });
      } else {
        // Save to local storage
        saveLocalCart(cart);
      }
    }
  }, [cart, isAuthenticated, user?.uid, isLoading]);

  const loadLocalCart = (): Cart => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading local cart:', error);
    }
    return { items: [], subtotal: 0, itemCount: 0 };
  };

  const saveLocalCart = (cart: Cart) => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving local cart:', error);
    }
  };

  const addToCart = useCallback((product: {
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
  }, quantity: number = 1) => {
    setCart(prevCart => {
      const existingItemIndex = prevCart.items.findIndex(item => item.productId === product.id);

      let updatedItems: CartItem[];

      if (existingItemIndex >= 0) {
        // Update existing item
        updatedItems = prevCart.items.map((item, index) => {
          if (index === existingItemIndex) {
            const newQuantity = item.quantity + quantity;
            const price = item.salePrice ?? item.price;
            return {
              ...item,
              quantity: newQuantity,
              subtotal: Math.round(price * newQuantity * 100) / 100,
            };
          }
          return item;
        });
      } else {
        // Add new item
        const newItem = {
          id: `${product.id}-${Date.now()}`, // Unique cart item ID
          ...createCartItemFromProduct(product, quantity),
        };
        updatedItems = [...prevCart.items, newItem];
      }

      const totals = calculateCartTotals(updatedItems);
      return {
        items: updatedItems,
        ...totals,
      };
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prevCart => {
      const updatedItems = prevCart.items.filter(item => item.productId !== productId);
      const totals = calculateCartTotals(updatedItems);
      return {
        items: updatedItems,
        ...totals,
      };
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart => {
      const updatedItems = prevCart.items.map(item => {
        if (item.productId === productId) {
          const price = item.salePrice ?? item.price;
          return {
            ...item,
            quantity,
            subtotal: Math.round(price * quantity * 100) / 100,
          };
        }
        return item;
      });

      const totals = calculateCartTotals(updatedItems);
      return {
        items: updatedItems,
        ...totals,
      };
    });
  }, [removeFromCart]);

  const clearCart = useCallback(async () => {
    setCart({ items: [], subtotal: 0, itemCount: 0 });

    // Clear from storage
    if (isAuthenticated && user?.uid) {
      await clearSavedCart(user?.uid);
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, [isAuthenticated, user?.uid]);

  const getUniqueItemCount = useCallback(() => {
    return cart.items.length;
  }, [cart.items]);

  const openCartDrawer = useCallback(() => {
    setIsCartDrawerOpen(true);
  }, []);

  const closeCartDrawer = useCallback(() => {
    setIsCartDrawerOpen(false);
  }, []);

  const toggleCartDrawer = useCallback(() => {
    setIsCartDrawerOpen(prev => !prev);
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getUniqueItemCount,
        isLoading,
        isCartDrawerOpen,
        openCartDrawer,
        closeCartDrawer,
        toggleCartDrawer,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
