export interface User {
  id: number;
  email: string;
  username: string;
  is_admin: boolean;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  average_rating?: number;
  rating_count: number;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CartItem {
  id: number;
  product_id: number;
  product_name: string;
  product_price: number;
  product_image?: string;
  quantity: number;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  price_at_purchase: number;
}

export interface Order {
  id: number;
  user_id: number;
  total_amount: number;
  status: string;
  shipping_address?: string;
  created_at?: string;
  items: OrderItem[];
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
}

export interface Rating {
  id: number;
  user_id: number;
  rating: number;
  review?: string;
  created_at?: string;
}
