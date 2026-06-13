import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { apiRequest, getTokens } from '../utils/api';

export interface CartItem {
  id?: string;
  productId: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
  image: string;
  slug: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  syncing: boolean;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = 'kalasatra_cart';

function getLocalCart(): CartItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function setLocalCart(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function mapBackendItem(i: any): CartItem {
  return {
    id: i.id,
    productId: i.product_id,
    name: i.name,
    price: i.price,
    size: i.size,
    color: i.color,
    quantity: i.quantity,
    image: i.image || '',
    slug: i.slug || '',
  };
}

async function fetchBackendCart(): Promise<CartItem[]> {
  const res = await apiRequest<CartItem[]>('/cart');
  if (res.success && res.data) return res.data.map(mapBackendItem);
  return [];
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(getLocalCart);
  const [syncing, setSyncing] = useState(false);

  // Track whether the initial sync for the current login session has already
  // run. This prevents the merge from re-firing on every tab focus / component
  // re-mount while the user is already logged in.
  const hasSyncedRef = useRef(false);

  const isAuthenticated = !!getTokens().accessToken;

  // ── Initial cart sync: run once per login session ──────────────────────────
  // Strategy:
  //   1. Fetch what the backend already has.
  //   2. If local storage has items that DON'T already exist in the backend,
  //      POST them once (with their stored quantity, not auto-increment).
  //   3. Wipe local storage immediately before posting so a crash / re-mount
  //      can never re-post the same items a second time.
  //   4. Re-fetch the final merged state and use that as the source of truth.
  useEffect(() => {
    if (!isAuthenticated || hasSyncedRef.current) return;
    hasSyncedRef.current = true; // mark done IMMEDIATELY to block concurrent runs

    const syncCart = async () => {
      setSyncing(true);
      try {
        const backendItems = await fetchBackendCart();

        const localItems = getLocalCart();

        if (localItems.length > 0) {
          // ── Clear local storage FIRST so a re-mount can never re-merge ────
          localStorage.removeItem(STORAGE_KEY);

          // Only POST items that don't already exist on the backend
          // Use setQuantity (not addToCart increment) via a dedicated body flag
          for (const local of localItems) {
            const alreadyOnBackend = backendItems.some(
              (b) =>
                b.productId === local.productId &&
                b.size === local.size &&
                b.color === local.color
            );
            if (!alreadyOnBackend) {
              // POST with quantity so the backend knows not to blindly increment
              await apiRequest('/cart', {
                method: 'POST',
                body: JSON.stringify({
                  productId: local.productId,
                  name: local.name,
                  price: local.price,
                  size: local.size,
                  color: local.color,
                  image: local.image,
                  slug: local.slug,
                  quantity: local.quantity, // explicit quantity
                }),
              });
            }
          }

          // Re-fetch the authoritative merged state
          const merged = await fetchBackendCart();
          setItems(merged);
          setLocalCart(merged);
        } else {
          // No local items — just use backend state directly
          setItems(backendItems);
          setLocalCart(backendItems);
        }
      } finally {
        setSyncing(false);
      }
    };

    syncCart();
  }, [isAuthenticated]);

  // Reset sync flag when user logs out (token disappears)
  useEffect(() => {
    if (!isAuthenticated) {
      hasSyncedRef.current = false;
    }
  }, [isAuthenticated]);

  // ── addItem: accepts optional explicit quantity (e.g. from product page) ───
  const syncAddItem = useCallback(
    async (item: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
      const qty = Math.max(1, quantity);

      if (isAuthenticated) {
        await apiRequest('/cart', {
          method: 'POST',
          body: JSON.stringify({
            productId: item.productId,
            name: item.name,
            price: item.price,
            size: item.size,
            color: item.color,
            image: item.image,
            slug: item.slug,
            quantity: qty, // pass explicit quantity to backend
          }),
        });
        const fresh = await fetchBackendCart();
        setItems(fresh);
        setLocalCart(fresh);
        return;
      }

      // Fallback: local-only (unauthenticated)
      setItems((prev) => {
        const key = `${item.productId}-${item.size}-${item.color}`;
        const existing = prev.find((i) => `${i.productId}-${i.size}-${i.color}` === key);
        const updated = existing
          ? prev.map((i) =>
              `${i.productId}-${i.size}-${i.color}` === key
                ? { ...i, quantity: i.quantity + qty }
                : i
            )
          : [...prev, { ...item, quantity: qty }];
        setLocalCart(updated);
        return updated;
      });
    },
    [isAuthenticated]
  );

  const syncRemoveItem = useCallback(
    async (productId: string, size: string, color: string) => {
      if (isAuthenticated) {
        const target = items.find(
          (i) => i.productId === productId && i.size === size && i.color === color
        );
        if (target?.id) {
          await apiRequest(`/cart/${target.id}`, { method: 'DELETE' });
        }
        const fresh = await fetchBackendCart();
        setItems(fresh);
        setLocalCart(fresh);
        return;
      }

      setItems((prev) => {
        const updated = prev.filter(
          (i) => !(i.productId === productId && i.size === size && i.color === color)
        );
        setLocalCart(updated);
        return updated;
      });
    },
    [isAuthenticated, items]
  );

  const syncUpdateQuantity = useCallback(
    async (productId: string, size: string, color: string, delta: number) => {
      if (isAuthenticated) {
        const target = items.find(
          (i) => i.productId === productId && i.size === size && i.color === color
        );
        if (target?.id) {
          const newQty = target.quantity + delta;
          if (newQty <= 0) {
            await apiRequest(`/cart/${target.id}`, { method: 'DELETE' });
          } else {
            await apiRequest(`/cart/${target.id}`, {
              method: 'PUT',
              body: JSON.stringify({ delta }),
            });
          }
        }
        const fresh = await fetchBackendCart();
        setItems(fresh);
        setLocalCart(fresh);
        return;
      }

      setItems((prev) => {
        const updated = prev
          .map((i) =>
            i.productId === productId && i.size === size && i.color === color
              ? { ...i, quantity: Math.max(1, i.quantity + delta) }
              : i
          )
          .filter((i) => i.quantity > 0);
        setLocalCart(updated);
        return updated;
      });
    },
    [isAuthenticated, items]
  );

  const syncClearCart = useCallback(async () => {
    if (isAuthenticated) {
      await apiRequest('/cart', { method: 'DELETE' });
    }
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
  }, [isAuthenticated]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem: syncAddItem,
        removeItem: syncRemoveItem,
        updateQuantity: syncUpdateQuantity,
        clearCart: syncClearCart,
        totalItems,
        totalPrice,
        syncing,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
