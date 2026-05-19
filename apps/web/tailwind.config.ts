import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101418",
        muted: "#5f6872",
        line: "#d9dee5",
        field: "#f3f6f8",
        surface: "#f8f9fa",
        brand: "#1f8aa8",
        danger: "#c9342c",
        warning: "#d88916",
        success: "#15845f"
      }
    }
  },
  plugins: []
};

export default config;
