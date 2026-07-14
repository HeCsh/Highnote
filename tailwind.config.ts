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
        "gold-deep": "#b9791a", // readable amber for text/accents on cream
        sage: "#7fa98b",
        "sage-deep": "#4f7a5e", // readable sage for text on cream
        brick: "#c4452e",
        // warm paper canvas (light pages)
        paper: "#efe7d6",
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
      transitionTimingFunction: {
        // gentle "ease-out-expo" — the app's signature motion curve
        smooth: "cubic-bezier(0.16, 1, 0.3, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        "slide-in": {
          "0%": { opacity: "0", transform: "translateY(-10px) scale(0.98)" },
          "60%": { opacity: "1" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "star-pop": {
          "0%": { transform: "scale(1)" },
          "45%": { transform: "scale(1.28)" },
          "100%": { transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(242,180,65,0.5)" },
          "70%": { boxShadow: "0 0 0 10px rgba(242,180,65,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(242,180,65,0)" },
        },
        sheen: {
          "0%": { transform: "translateX(-120%)" },
          "60%,100%": { transform: "translateX(240%)" },
        },
      },
      animation: {
        "slide-in": "slide-in 0.45s cubic-bezier(0.16,1,0.3,1) both",
        "fade-up": "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fade-in 0.5s ease-out both",
        float: "float 6s ease-in-out infinite",
        "star-pop": "star-pop 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        shimmer: "shimmer 1.2s linear infinite",
        "pulse-ring": "pulse-ring 1.6s ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
