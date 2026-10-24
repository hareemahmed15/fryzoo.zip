"use client";

import { MinusIcon, PlusIcon } from "@/components/ui/Icons";
import { MAX_QTY_PER_ITEM } from "@/lib/config";

interface Props {
  quantity: number;
  onChange: (next: number) => void;
  name: string;
  size?: "sm" | "md";
}

export default function QuantityControl({ quantity, onChange, name, size = "md" }: Props) {
  const btn = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-ink-900 p-1 text-white">
      <button
        type="button"
        aria-label={`Decrease ${name}`}
        onClick={() => onChange(quantity - 1)}
        className={`grid ${btn} place-items-center rounded-full hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun-400`}
      >
        <MinusIcon />
      </button>
      <span className="min-w-6 text-center text-sm font-extrabold" aria-live="polite">{quantity}</span>
      <button
        type="button"
        aria-label={`Increase ${name}`}
        disabled={quantity >= MAX_QTY_PER_ITEM}
        onClick={() => onChange(quantity + 1)}
        className={`grid ${btn} place-items-center rounded-full hover:bg-white/15 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun-400`}
      >
        <PlusIcon />
      </button>
    </div>
  );
}
