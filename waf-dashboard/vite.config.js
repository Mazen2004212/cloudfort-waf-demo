import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Optional: proxy API calls to avoid CORS during dev
      // "/attacks": "http://localhost:8000",
      // "/stats": "http://localhost:8000",
      // "/blacklist": "http://localhost:8000",
      // "/top-attackers": "http://localhost:8000",
    },
  },
});
