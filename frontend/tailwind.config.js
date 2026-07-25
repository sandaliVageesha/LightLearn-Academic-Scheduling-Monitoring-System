/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        // paper/ink/surface are CSS-variable-driven (see src/index.css) so
        // every existing bg-paper/text-ink/bg-surface usage across the app
        // automatically flips between light and dark values when the
        // `.dark` class is toggled — no per-component dark: variants needed
        // for these three tokens.
        paper: {
          DEFAULT: "rgb(var(--color-paper) / <alpha-value>)",
          soft: "rgb(var(--color-paper-soft) / <alpha-value>)",
          line: "rgb(var(--color-paper-line) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--color-ink) / <alpha-value>)",
          soft: "rgb(var(--color-ink-soft) / <alpha-value>)",
          faint: "rgb(var(--color-ink-faint) / <alpha-value>)",
        },
        surface: {
          DEFAULT: "rgb(var(--color-surface) / <alpha-value>)",
        },
        brand: {
          50:  "#EEF2F8",
          100: "#DCE4F1",
          200: "#B6C6E1",
          300: "#8FA7D0",
          400: "#5F7FAE",
          500: "#43648F",
          600: "#395886",
          700: "#2D4570",
          800: "#233757",
          900: "#1A283F",
        },
        accent: {
          50:  "#FDF1EA",
          100: "#FBE1CE",
          200: "#F5BE95",
          300: "#EF9C61",
          400: "#EA8149",
          500: "#E8703A",
          600: "#D25E2A",
          700: "#AC4A21",
          800: "#82381A",
          900: "#5A2712",
        },
        success: "#1F9D6C",
        warning: "#D97706",
        danger: "#DC2626",
        ocean: {
          50:  "#E9FFFC",
          100: "#C7FFF6",
          200: "#7FFFEA",
          300: "#2CFCE0",
          400: "#00E4E0",
          500: "#00C6ED",
          600: "#00A0F5",
          700: "#1E6EF5",
          800: "#1A47E0",
          900: "#152FAD",
        },
        event: {
          class: "#3B82F6",
          assignment: "#F59E0B",
          exam: "#EF4444",
          holiday: "#22C55E",
          meeting: "#A78BFA",
          personal: "#64748B",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(18,20,28,0.04), 0 8px 24px -12px rgba(18,20,28,0.10)",
        lift: "0 4px 10px rgba(18,20,28,0.06), 0 16px 32px -16px rgba(18,20,28,0.18)",
        glass: "0 1px 1px rgba(18,20,28,0.03), 0 24px 48px -24px rgba(26,40,63,0.22)",
        glow: "0 0 0 1px rgba(232,112,58,0.16), 0 8px 24px -8px rgba(232,112,58,0.35)",
        "ocean-glow": "0 0 0 1px rgba(0,160,245,0.18), 0 8px 24px -8px rgba(0,160,245,0.45)",
      },
      backgroundImage: {
        "ocean-gradient": "linear-gradient(180deg, #2CFCE0 0%, #00C6ED 34%, #00A0F5 64%, #1A47E0 100%)",
        "ocean-gradient-r": "linear-gradient(115deg, #2CFCE0 0%, #00C6ED 30%, #00A0F5 62%, #1A47E0 100%)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "float": "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}
