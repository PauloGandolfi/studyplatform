import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/auth": {
        target: "http://localhost:8081",
        changeOrigin: true
      },
      "/notes": {
        target: "http://localhost:8081",
        changeOrigin: true
      },
      "/subjects": {
        target: "http://localhost:8081",
        changeOrigin: true
      },
      "/flashcards": {
        target: "http://localhost:8081",
        changeOrigin: true
      }
    }
  }
});
