import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/G-play/",
  plugins: [react()],
  server: {
    host: true,
  },
});
