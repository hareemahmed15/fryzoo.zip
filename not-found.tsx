import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <p className="text-6xl">🍟</p>
        <h1 className="mt-4 text-4xl font-extrabold">Page not found</h1>
        <p className="mt-2 text-ink-900/70">We could not find what you were looking for.</p>
        <Link href="/menu" className="btn-primary mt-6">Browse the menu</Link>
      </div>
    </div>
  );
}
