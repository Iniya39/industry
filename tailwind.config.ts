import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
    "./src/data/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        border: "#E5E7EB",
        input: "#E5E7EB",
        ring: "#2563EB",
        background: "#F8FAFC",
        foreground: "#111827",
        muted: {
          DEFAULT: "#F3F4F6",
          foreground: "#64748B"
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#111827"
        },
        primary: {
          DEFAULT: "#2563EB",
          foreground: "#FFFFFF"
        },
        success: "#16A34A",
        warning: "#F59E0B",
        danger: "#E11D48"
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15, 23, 42, 0.06)",
        card: "0 12px 35px rgba(15, 23, 42, 0.05)",
        glow: "0 18px 40px rgba(37, 99, 235, 0.28)"
      },
      fontFamily: {
        sans: ["Inter", "SF Pro Display", "SF Pro Text", "Segoe UI", "Arial", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
