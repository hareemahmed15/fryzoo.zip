import type { CATEGORIES, ORDER_STATUSES } from "./config";

export type Category = (typeof CATEGORIES)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  available: boolean;
  is_featured: boolean;
  created_at: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string;
  quantity: number;
}

export interface AdminOrderItem {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
}

// Row from the "orders" table as an admin sees it
export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  notes: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  order_items?: AdminOrderItem[];
}

// What the customer sees (from get_order_public)
export interface PublicOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  notes: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  items: { name: string; quantity: number; unit_price: number }[];
}
