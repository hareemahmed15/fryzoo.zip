"use client";

import { useMemo, useState } from "react";
import { CATEGORIES } from "@/lib/config";
import type { MenuItem } from "@/lib/types";
import ProductCard from "./ProductCard";

export default function MenuBrowser({ items, initialCategory }: { items: MenuItem[]; initialCategory: string }) {
  const [category, setCategory] = useState<string>(
    (CATEGORIES as readonly string[]).includes(initialCategory) ? initialCategory : "All"
  );
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) =>
        (category === "All" || i.category === category) &&
        (q === "" || i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q))
    );
  }, [items, category, query]);

  const tabs = ["All", ...CATEGORIES];

  return (
    <div>
      <div className="sticky top-16 z-30 -mx-4 border-b-2 border-ink-900/10 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:mx-0 lg:rounded-2xl lg:border-2">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Menu categories">
            {tabs.map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={category === t}
                onClick={() => setCategory(t)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                  category === t ? "bg-brand-600 text-white" : "bg-sun-50 text-ink-900 hover:bg-sun-100"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the menu"
            aria-label="Search the menu"
            className="input lg:max-w-xs"
          />
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState title="The menu is being updated" text="Please check back in a few minutes." />
      ) : visible.length === 0 ? (
        <EmptyState title="Nothing matches your search" text="Try a different word or pick another category." />
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="mt-10 rounded-3xl border-2 border-dashed border-ink-900/20 p-10 text-center">
      <p className="text-5xl">🍽️</p>
      <h2 className="mt-3 text-xl font-extrabold">{title}</h2>
      <p className="mt-1 text-ink-900/70">{text}</p>
    </div>
  );
}
