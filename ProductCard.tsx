"use client";

import { useCart } from "@/components/cart/CartProvider";
import { formatPKR } from "@/lib/format";
import type { MenuItem } from "@/lib/types";
import FoodImage from "./FoodImage";
import QuantityControl from "./QuantityControl";
import { PlusIcon } from "@/components/ui/Icons";

export default function ProductCard({ item }: { item: MenuItem }) {
  const { addItem, setQuantity, getQuantity } = useCart();
  const qty = getQuantity(item.id);

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border-2 border-ink-900/10 bg-white transition hover:border-ink-900">
      <div className="relative">
        <FoodImage src={item.image_url} alt={item.name} category={item.category} className="aspect-[4/3] w-full" />
        <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-bold">{item.category}</span>
        {!item.available && (
          <div className="absolute inset-0 grid place-items-center bg-ink-900/70">
            <span className="rounded-full bg-white px-4 py-1.5 text-sm font-extrabold">Sold out</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-extrabold leading-tight">{item.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-ink-900/70">{item.description}</p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <p className="text-lg font-extrabold">{formatPKR(item.price)}</p>
          {!item.available ? (
            <span className="text-sm font-bold text-ink-900/50">Unavailable</span>
          ) : qty > 0 ? (
            <QuantityControl quantity={qty} name={item.name} size="sm" onChange={(n) => setQuantity(item.id, n)} />
          ) : (
            <button type="button" onClick={() => addItem(item)} className="btn-primary px-4 py-2.5">
              <PlusIcon /> Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
