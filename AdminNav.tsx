"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "./SignOutButton";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/menu", label: "Menu" },
];

export default function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink-900/10 bg-white">
      <div className="container-x flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 -rotate-6 place-items-center rounded-xl bg-brand-600 font-display text-xl font-extrabold text-white">F</span>
          <span className="font-display text-xl font-extrabold">Fryzoo Admin</span>
        </div>
        <nav className="order-3 flex w-full gap-2 sm:order-none sm:w-auto" aria-label="Admin">
          {LINKS.map((l) => {
            const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-4 py-2 text-sm font-bold ${active ? "bg-ink-900 text-white" : "hover:bg-sun-100"}`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden max-w-[180px] truncate text-xs text-ink-900/60 md:block">{email}</span>
          <SignOutButton className="btn-outline px-4 py-2" />
        </div>
      </div>
    </header>
  );
}
