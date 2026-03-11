import api from "./client";
import { Order, OrderListResponse } from "../types";

export const checkout = async (shippingAddress: string): Promise<Order> => {
  const response = await api.post("/api/orders/checkout", { shipping_address: shippingAddress });
  return response.data;
};

export const getMyOrders = async (): Promise<OrderListResponse> => {
  const response = await api.get("/api/orders");
  return response.data;
};

export const getAllOrders = async (): Promise<OrderListResponse> => {
  const response = await api.get("/api/orders/all");
  return response.data;
};

export const getOrder = async (id: number): Promise<Order> => {
  const response = await api.get(`/api/orders/${id}`);
  return response.data;
};
