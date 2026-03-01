import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  target: "esnext",
  external: ["@anthropic-ai/sdk"],
  outExtension({ format }) {
    return { js: format === "cjs" ? ".cjs" : ".mjs" }
  },
})
