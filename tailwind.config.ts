import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Chili red: the main Fryzoo brand colour
        brand: {
          50: "#fff1f1", 100: "#ffdede", 200: "#ffbfbf", 300: "#ff9393", 400: "#f95c5c",
          500: "#ee3535", 600: "#d71920", 700: "#b01218", 800: "#8d1217", 900: "#741518",
        },
        // Mango yellow: stickers, highlights, price tags
        sun: {
          50: "#fff8db", 100: "#ffefb0", 300: "#ffd84d", 400: "#ffc800", 500: "#f2b300",
        },
        // Charcoal: text and dark sections
        ink: { 700: "#3a2d28", 800: "#261c19", 900: "#17110f" },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
