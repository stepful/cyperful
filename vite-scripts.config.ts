import { defineConfig } from "vite";

// https://vitejs.dev/config
export default defineConfig({
  root: "./www",
  build: {
    outDir: "../public",
    lib: {
      entry: ["../frame-agent.ts"],
      formats: ["es"],
    },
  },
  resolve: {
    alias: {
      "~/": "/",
    },
  },
});
