import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "var(--brand-50, #eff6ff)",
          100: "var(--brand-100, #dbeafe)",
          200: "var(--brand-200, #bfdbfe)",
          500: "var(--brand-primary, #2563eb)",
          600: "var(--brand-primary-hover, #1d4ed8)",
          700: "var(--brand-700, #1e40af)",
          accent: "var(--brand-accent, #0ea5e9)",
        }
      }
    },
  },
  plugins: [],
};
export default config;
