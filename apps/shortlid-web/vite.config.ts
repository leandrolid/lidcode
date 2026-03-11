import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  envDir: path.resolve(__dirname, "../../"),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/v1/auth": {
        target: "http://localhost:3340",
        changeOrigin: true,
      },
      "/v1": {
        target: "http://localhost:3333",
        changeOrigin: true,
      },
    },
  },
});
