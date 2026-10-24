"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <p className="text-6xl">😵</p>
        <h1 className="mt-4 text-4xl font-extrabold">Something went wrong</h1>
        <p className="mt-2 text-ink-900/70">Please try again. If it keeps happening, check your internet connection.</p>
        <button onClick={reset} className="btn-primary mt-6">Try again</button>
      </div>
    </div>
  );
}
