import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { transform as svgrTransform } from "@svgr/core";
import react from "@vitejs/plugin-react";
import { transform as esbuildTransform } from "esbuild";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

/**
 * Minimal Vite plugin that transforms .svg imports into React components
 * using @svgr/core (already installed as a dependency of @svgr/webpack).
 * esbuild (bundled with Vite) compiles the resulting JSX to plain JS.
 */
function svgr(): Plugin {
  return {
    name: "vite-svgr",
    enforce: "pre",
    async transform(_code, id) {
      if (!id.endsWith(".svg")) return null;
      const svg = readFileSync(id, "utf-8");
      const jsx = await svgrTransform(
        svg,
        { jsxRuntime: "automatic", plugins: ["@svgr/plugin-jsx"] },
        { filePath: id },
      );
      const { code } = await esbuildTransform(jsx, {
        loader: "jsx",
        jsx: "automatic",
      });
      return { code, map: null };
    },
  };
}

export default defineConfig({
  plugins: [svgr(), react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.tsx"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
