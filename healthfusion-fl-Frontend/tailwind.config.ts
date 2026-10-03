import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--color-ink)",
        navy: "var(--color-navy)",
        "navy-2": "var(--color-navy-2)",
        slate: "var(--color-slate)",
        mist: "var(--color-mist)",
        paper: "var(--color-paper)",
        line: "var(--color-line)",
        surface: "var(--color-surface)",
        teal: "var(--color-teal)",
        "teal-soft": "var(--color-teal-soft)",
        green: "var(--color-green)",
        "green-soft": "var(--color-green-soft)",
        amber: "var(--color-amber)",
        "amber-soft": "var(--color-amber-soft)",
        red: "var(--color-red)",
        "red-soft": "var(--color-red-soft)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "3px",
        DEFAULT: "5px",
        md: "6px",
        lg: "8px",
      },
      boxShadow: {
        panel: "0 1px 2px rgba(16, 21, 27, 0.06)",
      },
      maxWidth: {
        prose: "68ch",
      },
      keyframes: {
        pulseFlow: {
          "0%": { strokeDashoffset: "40" },
          "100%": { strokeDashoffset: "0" },
        },
        nodePing: {
          "0%": { opacity: "0.55", r: "5" },
          "70%": { opacity: "0", r: "16" },
          "100%": { opacity: "0", r: "16" },
        },
      },
      animation: {
        "pulse-flow": "pulseFlow 1.4s linear infinite",
        "node-ping": "nodePing 2.4s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
