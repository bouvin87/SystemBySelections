import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 60% — neutral bakgrund
        background: "#FFFFFF",
        foreground: "#0F172A",

        // 30% — kort och ytor (pasteller)
        surface: {
          DEFAULT: "#F9FAFB",
          subtle: "#F3F4F6",
        },
        popover: {
          DEFAULT: "#F9FAFB",
          foreground: "#1E293B",
          background: "#ffffff", 
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#0F172A",
        },
        menu: {
          DEFAULT: "#ffffff", // fallback
          foreground: "#1E293B",
        },
        dropdown: {
          DEFAULT: "#ffffff",
          foreground: "#1E293B",
        },

        pastel: {
          purple: "#EEF2FF", // Ex: "Pay someone"
          green: "#DCFCE7", // Ex: "Request money"
          yellow: "#FEF9C3", // Ex: "Buy airtime"
          gray: "#F3F4F6", // Ex: "Pay bill"
        },

        // 10% — actions och accenter
        primary: {
          DEFAULT: "#276388", // Accentfärg för knappar, ikoner
          foreground: "#FFFFFF",
        },

        accent: {
          DEFAULT: "#FACC15", // Alternativ accentfärg (gul)
          foreground: "#1E293B",
        },

        success: {
          DEFAULT: "#16A34A",
          foreground: "#FFFFFF",
        },

        muted: {
          DEFAULT: "#E5E7EB",
          foreground: "#6B7280",
        },

        border: "#E5E7EB",
        input: "#E5E7EB",
        ring: "#276388",
      },

      borderRadius: {
        lg: "16px",
        md: "12px",
        sm: "8px",
        full: "9999px", // för avatars eller cirkulära knappar
      },

      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
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
        underlineSlide: {
          "0%": { width: "0%" },
          "100%": { width: "100%" },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        underlineSlide: "underlineSlide 0.3s ease-out forwards",
      },
      transitionProperty: {
        width: "width",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};

export default config;
