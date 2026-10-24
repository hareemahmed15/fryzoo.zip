"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_DELIVERY_FEE, MAX_QTY_PER_ITEM } from "@/lib/config";
import type { CartItem, MenuItem } from "@/lib/types";

const STORAGE_KEY = "fryzoo-cart-v1";

interface CartContextValue {
  items: CartItem[];
  hydrated: boolean;
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  addItem: (item: MenuItem, qty?: number) => void;
  setQuantity: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  getQuantity: (id: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

function isCartItem(x: unknown): x is CartItem {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    typeof o.price === "number" &&
    typeof o.quantity === "number" &&
    o.quantity > 0
  );
}

interface MenuRow {
  id: string;
  name: string;
  price: number | string;
  available: boolean;
  image_url: string | null;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [feeSetting, setFeeSetting] = useState<number>(DEFAULT_DELIVERY_FEE);
  const synced = useRef(false);

  // 1. Load the saved cart from the browser (localStorage) once
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed.filter(isCartItem));
      }
    } catch {
      // Corrupted or blocked storage: start with an empty cart
    }
    setHydrated(true);
  }, []);

  // 2. Save the cart whenever it changes
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full or blocked: cart still works until the tab closes
    }
  }, [items, hydrated]);

  // 3. Read the delivery fee from the database (table app_settings)
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "delivery_fee")
      .maybeSingle()
      .then(({ data }) => {
        const fee = Number(data?.value);
        if (data && Number.isFinite(fee) && fee >= 0) setFeeSetting(fee);
      });
  }, []);

  // 4. Once per visit, refresh saved items with today's prices and remove sold-out items
  useEffect(() => {
    if (!hydrated || synced.current) return;
    synced.current = true;
    if (items.length === 0) return;

    const supabase = createClient();
    supabase
      .from("menu_items")
      .select("id, name, price, available, image_url")
      .in("id", items.map((i) => i.id))
      .then(({ data }) => {
        if (!data) return;
        const byId = new Map<string, MenuRow>((data as MenuRow[]).map((r) => [r.id, r]));
        setItems((prev) =>
          prev.flatMap((i) => {
            const row = byId.get(i.id);
            if (!row || !row.available) return [];
            return [{ ...i, name: row.name, price: Number(row.price), image_url: row.image_url }];
          })
        );
      });
  }, [hydrated, items]);

  const addItem = useCallback((item: MenuItem, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: Math.min(MAX_QTY_PER_ITEM, i.quantity + qty) } : i
        );
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          price: Number(item.price),
          image_url: item.image_url,
          category: item.category,
          quantity: Math.min(MAX_QTY_PER_ITEM, qty),
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((id: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...i, quantity: Math.min(MAX_QTY_PER_ITEM, qty) } : i))
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const getQuantity = useCallback(
    (id: string) => items.find((i) => i.id === id)?.quantity ?? 0,
    [items]
  );

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    const deliveryFee = items.length > 0 ? feeSetting : 0;
    return {
      items, hydrated, itemCount, subtotal, deliveryFee,
      total: subtotal + deliveryFee,
      addItem, setQuantity, removeItem, clear, getQuantity,
    };
  }, [items, hydrated, feeSetting, addItem, setQuantity, removeItem, clear, getQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
