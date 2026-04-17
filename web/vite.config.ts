import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Must match where the TS API listens (default PORT=5000). Override: API_PROXY=http://localhost:5001 npm run dev */
const apiTarget = process.env.API_PROXY ?? "http://localhost:5000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": apiTarget,
      "/health": apiTarget,
    },
  },
});
