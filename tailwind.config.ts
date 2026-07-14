import type { Config } from "tailwindcss";

/**
 * Palette + type scale extracted verbatim from Prototype A's compiled stylesheet.
 * See DESIGN_TOKENS.md for provenance.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // dark canvas
        page: "#142819",
        ink: "#1e3a2a",
        // paper
        cream: "#fbf9f4",
        "muted-cream": "#f0ece0",
        // brand
        gold: "#f2b441",
        sage: "#7fa98b",
        brick: "#c4452e",
        // neutral system
        border: "#e4dfd3",
        rule: "#e4dfd3",
        muted: "#e4dfd3",
        "muted-foreground": "#5b6b5f",
        // on-dark helpers (inline hexes from A's SSR markup)
        "on-dark": "#cddccf",
        "on-dark-border": "#3a5643",
        "on-dark-muted": "#8ba392",
      },
      fontFamily: {
        display: ['"Fraunces"', "ui-serif", "Georgia", "serif"],
        sans: ['"Archivo"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"Courier Prime"', "ui-monospace", '"Courier New"', "monospace"],
      },
      borderRadius: {
        DEFAULT: "0.75rem",
        md: "0.75rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 #0000001a, 0 1px 2px -1px #0000001a",
        lift: "0 10px 15px -3px #0000001a, 0 4px 6px -4px #0000001a",
        big: "0 25px 50px -12px #00000040",
      },
      keyframes: {
        "slide-in": {
          "0%": { opacity: "0", transform: "translateY(-8px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(242,180,65,0.5)" },
          "70%": { boxShadow: "0 0 0 8px rgba(242,180,65,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(242,180,65,0)" },
        },
      },
      animation: {
        "slide-in": "slide-in 0.35s cubic-bezier(0.16,1,0.3,1)",
        shimmer: "shimmer 1.2s linear infinite",
        "pulse-ring": "pulse-ring 1.6s ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
