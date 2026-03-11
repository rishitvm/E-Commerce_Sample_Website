import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Cart } from "../types";
import { getCart, addToCart as apiAddToCart, updateCartItem as apiUpdateCartItem, removeFromCart as apiRemoveFromCart } from "../api/cart";
import { useAuth } from "./AuthContext";

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  itemCount: number;
}

const CartContext = createContext<CartContextType>({
  cart: null,
  loading: false,
  refreshCart: async () => {},
  addToCart: async () => {},
  updateQuantity: async () => {},
  removeItem: async () => {},
  itemCount: 0,
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const refreshCart = useCallback(async () => {
    if (!token) {
      setCart(null);
      return;
    }
    try {
      setLoading(true);
      const data = await getCart();
      setCart(data);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (productId: number, quantity: number = 1) => {
    const data = await apiAddToCart(productId, quantity);
    setCart(data);
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    const data = await apiUpdateCartItem(itemId, quantity);
    setCart(data);
  };

  const removeItem = async (itemId: number) => {
    const data = await apiRemoveFromCart(itemId);
    setCart(data);
  };

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{ cart, loading, refreshCart, addToCart, updateQuantity, removeItem, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
