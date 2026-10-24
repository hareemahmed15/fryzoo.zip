"use client";

import { useState } from "react";

const EMOJI: Record<string, string> = {
  Burgers: "🍔",
  "Loaded Fries": "🍟",
  Wraps: "🌯",
  Chicken: "🍗",
  Drinks: "🥤",
};

interface Props {
  src: string | null;
  alt: string;
  category: string;
  className?: string;
}

// Shows the photo; if the link is empty or broken, shows a branded placeholder instead.
export default function FoodImage({ src, alt, category, className = "" }: Props) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-gradient-to-br from-sun-100 to-brand-100 text-6xl ${className}`}
      >
        {EMOJI[category] ?? "🍽️"}
      </div>
    );
  }

  // Plain <img> (not next/image) so that ANY image link an admin pastes will work.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} />;
}
