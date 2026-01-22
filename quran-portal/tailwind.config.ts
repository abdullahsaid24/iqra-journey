
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        md: "2rem",
      },
      screens: {
        xs: "100%",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1400px",
      },
    },
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        quran: {
          primary: "#0C8A7D",
          secondary: "#C3A343",
          error: "#DC2626",
          success: "#059669",
          warning: "#D97706",
          bg: "#1C4E46",
          border: "#2A665E",
          text: "#FFFFFF",
          light: "#2A665E",
          accent: "#3B7C74",
          neutral: "#8E9196",
        },
        mushaf: {
          cream: "#F5F1E8",
          parchment: "#FAF8F3",
          brown: "#2C1810",
          darkBrown: "#1A0F08",
          gold: "#D4AF37",
          teal: "#4A7C7E",
          border: "#C9B896",
        },
      },
      fontFamily: {
        arabic: ["KFGQPC Uthmanic Script HAFS", "Noto Sans Arabic", "sans-serif"],
        quran: ["Amiri Quran", "KFGQPC Uthmanic Script HAFS", "serif"],
      },
      spacing: {
        '0.5': '0.125rem', // 2px
        '1.5': '0.375rem', // 6px
        '2.5': '0.625rem', // 10px
        '3.5': '0.875rem', // 14px
      },
      fontSize: {
        'xxs': '0.65rem', // For very small screens
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
