/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // "Ink" — deep navy-indigo, the institutional/authority color
        primary: {
          50: "#eef1f7",
          100: "#dbe2ee",
          200: "#b3c0da",
          300: "#8394bd",
          400: "#5a6d9d",
          500: "#3d4f7d",
          600: "#2b3b60",
          700: "#22304e",
          800: "#1b2640",
          900: "#141c30",
          950: "#0c1220",
        },
        secondary: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        // "Ledger gold" — the single reserved accent: active nav, key highlights only
        gold: {
          50: "#faf5e9",
          100: "#f3e6c4",
          200: "#e6cc8c",
          300: "#d3ab53",
          400: "#c0912f",
          500: "#a67a24",
          600: "#8a651e",
          700: "#6d4f18",
        },
        paper: {
          DEFAULT: "#f7f5ef",
          dark: "#0f1420",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        serif: ["\"Source Serif 4\"", "Georgia", "serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-in": "slideIn 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
