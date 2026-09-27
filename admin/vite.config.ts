import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Runs on a DIFFERENT port from the main frontend (5173) so you can run
// both apps side by side locally.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
