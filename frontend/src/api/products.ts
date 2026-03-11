import api from "./client";
import { Product, ProductListResponse, Rating } from "../types";

export const getProducts = async (
  page: number = 1,
  pageSize: number = 12,
  search?: string,
  category?: string
): Promise<ProductListResponse> => {
  const params: Record<string, string | number> = { page, page_size: pageSize };
  if (search) params.search = search;
  if (category) params.category = category;
  const response = await api.get("/api/products", { params });
  return response.data;
};

export const getProduct = async (id: number): Promise<Product> => {
  const response = await api.get(`/api/products/${id}`);
  return response.data;
};

export const createProduct = async (data: {
  name: string;
  description?: string;
  price: number;
  stock: number;
  category?: string;
}): Promise<Product> => {
  const response = await api.post("/api/products", data);
  return response.data;
};

export const updateProduct = async (
  id: number,
  data: {
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    category?: string;
  }
): Promise<Product> => {
  const response = await api.put(`/api/products/${id}`, data);
  return response.data;
};

export const deleteProduct = async (id: number): Promise<void> => {
  await api.delete(`/api/products/${id}`);
};

export const uploadProductImage = async (id: number, file: File): Promise<Product> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post(`/api/products/${id}/image`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const rateProduct = async (id: number, rating: number, review?: string): Promise<Rating> => {
  const response = await api.post(`/api/products/${id}/ratings`, { rating, review });
  return response.data;
};

export const getProductRatings = async (id: number): Promise<Rating[]> => {
  const response = await api.get(`/api/products/${id}/ratings`);
  return response.data;
};

export const getCategories = async (): Promise<string[]> => {
  const response = await api.get("/api/products/categories");
  return response.data;
};
