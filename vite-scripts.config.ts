import { defineConfig } from "vite";

// https://vitejs.dev/config
export default defineConfig({
  root: "./www",
  build: {
    outDir: "../public",
    lib: {
      entry: ["../frame-agent"],
      formats: ["es"],
      fileName: "frame-agent",
    },
  },
  resolve: {
    alias: {
      "~/": "/",
    },
  },
});
