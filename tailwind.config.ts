import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#172b4d",
        brand: "#176b57",
        canvas: "#f5f7f8",
      },
      boxShadow: {
        card: "0 2px 12px rgba(16, 35, 55, 0.045)",
      },
    },
  },
  plugins: [],
};

export default config;
