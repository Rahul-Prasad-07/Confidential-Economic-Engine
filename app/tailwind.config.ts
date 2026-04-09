import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#131826",
        sand: "#f7f1e7",
        dune: "#ece1d1",
        mist: "#fbf9f4",
      },
      boxShadow: {
        soft: "0 20px 80px -52px rgba(17, 24, 39, 0.4)",
      },
      borderRadius: {
        panel: "28px",
      },
      letterSpacing: {
        calm: "0.14em",
      },
    },
  },
  plugins: [],
};

export default config;
