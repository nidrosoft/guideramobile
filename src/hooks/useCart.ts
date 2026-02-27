/**
 * USE CART HOOK
 * 
 * React hook for managing shopping cart state and operations.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  CartWithItems,
  CartItem,
  CartTotals,
  CartItemDisplay,
  AddToCartRequest,
  getOrCreateCart,
  getCart,
  addToCart,
  removeFromCart,
  updateCartItem,
  clearCart,
  calculateCartTotals,
  formatCartItemForDisplay,
  applyPromoCode,
  removePromoCode,
} from '@/services/cart';

interface UseCartState {
  cart: CartWithItems | null;
  items: CartItemDisplay[];
  totals: CartTotals | null;
  isLoading: boolean;
  error: string | null;
  itemCount: number;
}

interface UseCartActions {
  loadCart: () => Promise<void>;
  addItem: (request: AddToCartRequest) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  updateItem: (itemId: string, updates: { quantity?: number }) => Promise<boolean>;
  clear: () => Promise<boolean>;
  applyPromo: (code: string) => Promise<boolean>;
  removePromo: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useCart(): UseCartState & UseCartActions {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived state
  const items: CartItemDisplay[] = cart?.items.map(formatCartItemForDisplay) || [];
  const itemCount = cart?.items.length || 0;
  const totals: CartTotals | null = cart
    ? {
        subtotal: cart.subtotal,
        taxes: cart.taxes,
        fees: cart.fees,
        discount: cart.discount,
        total: cart.total,
        currency: cart.currency,
        itemCount,
      }
    : null;

  // Load cart
  const loadCart = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getOrCreateCart(user.id);
      if (result.success && result.cart) {
        setCart(result.cart);
      } else {
        setError(result.error?.message || 'Failed to load cart');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Add item to cart
  const addItem = useCallback(
    async (request: AddToCartRequest): Promise<boolean> => {
      if (!cart) {
        setError('Cart not loaded');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await addToCart(cart.id, request);
        if (result.success && result.cart) {
          setCart(result.cart);
          return true;
        } else {
          setError(result.error?.message || 'Failed to add item');
          return false;
        }
      } catch (err: any) {
        setError(err.message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [cart]
  );

  // Remove item from cart
  const removeItem = useCallback(
    async (itemId: string): Promise<boolean> => {
      if (!cart) return false;

      setIsLoading(true);
      setError(null);

      try {
        const result = await removeFromCart(cart.id, itemId);
        if (result.success && result.cart) {
          setCart(result.cart);
          return true;
        } else {
          setError(result.error?.message || 'Failed to remove item');
          return false;
        }
      } catch (err: any) {
        setError(err.message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [cart]
  );

  // Update item
  const updateItem = useCallback(
    async (itemId: string, updates: { quantity?: number }): Promise<boolean> => {
      if (!cart) return false;

      setIsLoading(true);
      setError(null);

      try {
        const result = await updateCartItem(cart.id, itemId, updates);
        if (result.success && result.cart) {
          setCart(result.cart);
          return true;
        } else {
          setError(result.error?.message || 'Failed to update item');
          return false;
        }
      } catch (err: any) {
        setError(err.message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [cart]
  );

  // Clear cart
  const clear = useCallback(async (): Promise<boolean> => {
    if (!cart) return false;

    setIsLoading(true);
    setError(null);

    try {
      const result = await clearCart(cart.id);
      if (result.success && result.cart) {
        setCart(result.cart);
        return true;
      } else {
        setError(result.error?.message || 'Failed to clear cart');
        return false;
      }
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [cart]);

  // Apply promo code
  const applyPromo = useCallback(
    async (code: string): Promise<boolean> => {
      if (!cart) return false;

      setIsLoading(true);
      setError(null);

      try {
        const result = await applyPromoCode(cart.id, code);
        if (result.success && result.cart) {
          setCart(result.cart);
          return true;
        } else {
          setError(result.error?.message || 'Invalid promo code');
          return false;
        }
      } catch (err: any) {
        setError(err.message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [cart]
  );

  // Remove promo code
  const removePromo = useCallback(async (): Promise<boolean> => {
    if (!cart) return false;

    setIsLoading(true);
    setError(null);

    try {
      const result = await removePromoCode(cart.id);
      if (result.success && result.cart) {
        setCart(result.cart);
        return true;
      } else {
        setError(result.error?.message || 'Failed to remove promo');
        return false;
      }
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [cart]);

  // Refresh cart
  const refresh = useCallback(async () => {
    if (!cart) return;

    try {
      const updatedCart = await getCart(cart.id);
      if (updatedCart) {
        setCart(updatedCart);
      }
    } catch (err: any) {
      console.error('Failed to refresh cart:', err);
    }
  }, [cart]);

  // Load cart on mount
  useEffect(() => {
    if (user?.id) {
      loadCart();
    }
  }, [user?.id, loadCart]);

  return {
    cart,
    items,
    totals,
    isLoading,
    error,
    itemCount,
    loadCart,
    addItem,
    removeItem,
    updateItem,
    clear,
    applyPromo,
    removePromo,
    refresh,
  };
}
