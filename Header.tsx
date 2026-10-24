"use client";

import Link from "next/link";
import { useState } from "react";
import { BRAND } from "@/lib/config";
import { useCart } from "@/components/cart/CartProvider";
import { CartIcon, CloseIcon, MenuIcon } from "@/components/ui/Icons";

const NAV = [
  { href: "/menu", label: "Menu" },
  { href: "/#popular", label: "Popular" },
  { href: "/#about", label: "About" },
  { href: "/#contact", label: "Contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink-900/10 bg-white/95 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="grid h-9 w-9 -rotate-6 place-items-center rounded-xl bg-brand-600 font-display text-xl font-extrabold text-white">
            F
          </span>
          <span className="font-display text-2xl font-extrabold tracking-tight">{BRAND.name}</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-sm font-bold hover:text-brand-600">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/menu" className="btn-primary hidden md:inline-flex">Order now</Link>
          <Link
            href="/cart"
            className="relative grid h-11 w-11 place-items-center rounded-full bg-ink-900 text-white"
            aria-label={`Cart with ${itemCount} items`}
          >
            <CartIcon className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-sun-400 px-1 text-[11px] font-extrabold text-ink-900">
                {itemCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full border-2 border-ink-900/15 md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t-2 border-ink-900/10 bg-white md:hidden" aria-label="Mobile">
          <div className="container-x flex flex-col py-2">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="border-b border-ink-900/10 py-3 text-base font-bold last:border-0"
              >
                {n.label}
              </Link>
            ))}
            <Link href="/menu" onClick={() => setOpen(false)} className="btn-primary my-3">Order now</Link>
          </div>
        </nav>
      )}
    </header>
  );
}
