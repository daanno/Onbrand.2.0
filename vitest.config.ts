import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "build/",
        ".next/",
        "**/*.config.*",
        "**/__tests__/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@act/auth": path.resolve(__dirname, "./packages/auth/src"),
      "@act/tenant-config": path.resolve(__dirname, "./packages/tenant-config/src"),
      "@act/ui": path.resolve(__dirname, "./packages/ui/src"),
    },
  },
});

