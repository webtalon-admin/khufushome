import { khufusEnvPlugin } from "@khufushome/config/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [khufusEnvPlugin(), react(), tailwindcss()],
  server: { port: 5173 },
  build: { outDir: "dist" },
});
