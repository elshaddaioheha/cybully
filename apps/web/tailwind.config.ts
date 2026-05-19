import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        line: "#d8dee8",
        surface: "#f7f9fc",
        brand: "#0f766e"
      }
    }
  },
  plugins: []
};

export default config;

