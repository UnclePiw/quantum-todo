import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "var(--font-thai)", "sans-serif"],
        body: ["var(--font-body)", "var(--font-thai)", "sans-serif"],
      },
      colors: { void: "#0D0A1F", ink: "#EDE9FE" },
    },
  },
  plugins: [],
};
export default config;
