import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC",
        foreground: "#1E293B",

        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#1E293B",
        },
        popover: {
          DEFAULT: "#F9FAFB",
          foreground: "#1E293B",
        },
        primary: {
          DEFAULT: "#276388",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#2E7F7F",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F1F5F9",
          foreground: "#6B7280",
        },
        accent: {
          DEFAULT: "#FDC901",
          foreground: "#1E293B",
        },
        destructive: {
          DEFAULT: "#E33913",
          foreground: "#FFFFFF",
        },
        border: "#E2E8F0",
        input: "#E2E8F0",
        ring: "#276388",
        chart: {
          "1": "#276388",
          "2": "#FDC901",
          "3": "#E33913",
          "4": "#2E7F7F",
          "5": "#94A3B8",
        },
        sidebar: {
          DEFAULT: "#1E293B",
          foreground: "#F8FAFC",
          primary: "#276388",
          "primary-foreground": "#FFFFFF",
          accent: "#FDC901",
          "accent-foreground": "#1E293B",
          border: "#334155",
          ring: "#FDC901",
        },
      },
      borderRadius: {
        lg: "12px",
        md: "10px",
        sm: "8px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
  ],
};

export default config;
