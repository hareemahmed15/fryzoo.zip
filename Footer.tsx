import Link from "next/link";
import { BRAND } from "@/lib/config";

export default function Footer() {
  return (
    <footer className="bg-ink-900 text-white">
      <div className="container-x grid gap-8 py-12 sm:grid-cols-3">
        <div>
          <p className="font-display text-3xl font-extrabold">{BRAND.name}</p>
          <p className="mt-2 max-w-xs text-sm text-white/70">
            {BRAND.tagline} Fast food made fresh in {BRAND.city}.
          </p>
        </div>
        <div className="text-sm text-white/80">
          <p className="font-bold text-white">Visit and call</p>
          <p className="mt-2">{BRAND.address}</p>
          <p>{BRAND.hours}</p>
          <a href={BRAND.phoneHref} className="mt-1 inline-block font-bold text-sun-400">{BRAND.phone}</a>
        </div>
        <div className="text-sm text-white/80">
          <p className="font-bold text-white">Quick links</p>
          <ul className="mt-2 space-y-1">
            <li><Link href="/menu" className="hover:text-sun-400">Menu</Link></li>
            <li><Link href="/cart" className="hover:text-sun-400">Your cart</Link></li>
            <li><Link href="/admin/login" className="hover:text-sun-400">Staff login</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} {BRAND.name}, {BRAND.city}. Cash on delivery only.
      </div>
    </footer>
  );
}
