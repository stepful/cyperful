import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

// https://vitejs.dev/config
export default defineConfig({
  plugins: [svgr(), react()],
  root: "./www",
  build: {
    outDir: "../public",
  },
  resolve: {
    alias: {
      "~/": "/",
    },
  },
  server: {
    hmr: {
      // our reverse proxy doesn't support websockets
      // https://vitejs.dev/config/server-options.html#server-hmr
      port: 3006,
    },
  },
});
