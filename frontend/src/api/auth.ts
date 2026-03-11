import api from "./client";
import { AuthResponse, User } from "../types";

export const signup = async (email: string, username: string, password: string): Promise<AuthResponse> => {
  const response = await api.post("/api/auth/signup", { email, username, password });
  return response.data;
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post("/api/auth/login", { email, password });
  return response.data;
};

export const getMe = async (): Promise<User> => {
  const response = await api.get("/api/auth/me");
  return response.data;
};
