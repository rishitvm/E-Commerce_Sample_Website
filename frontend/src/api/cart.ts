import api from "./client";
import { Cart } from "../types";

export const getCart = async (): Promise<Cart> => {
  const response = await api.get("/api/cart");
  return response.data;
};

export const addToCart = async (productId: number, quantity: number = 1): Promise<Cart> => {
  const response = await api.post("/api/cart", { product_id: productId, quantity });
  return response.data;
};

export const updateCartItem = async (itemId: number, quantity: number): Promise<Cart> => {
  const response = await api.put(`/api/cart/${itemId}`, { quantity });
  return response.data;
};

export const removeFromCart = async (itemId: number): Promise<Cart> => {
  const response = await api.delete(`/api/cart/${itemId}`);
  return response.data;
};
