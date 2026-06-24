/// <reference types="vitest" />
import path from "path"
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react-swc"

// Local stub modules that replace external services for the standalone
// prototype. These are aliased so we don't have to edit dozens of call sites.
const stub = (p: string) => path.resolve(__dirname, p)

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  // Local dev serves from root; production builds for a GitHub Pages project
  // subpath. The deploy workflow sets VITE_BASE to `/<repo-name>/`.
  base: command === "build" ? process.env.VITE_BASE || "/ux-prototype/" : "/",
  // No backend: point every API base URL at the same origin ("") so requests
  // become same-origin paths (e.g. "/loans/...") that MSW intercepts. The other
  // service env vars are stubbed to harmless empty values.
  define: {
    "import.meta.env.VITE_API_BASE_URL": JSON.stringify(""),
    "import.meta.env.VITE_SUPERTOKENS_API_DOMAIN": JSON.stringify(""),
    "import.meta.env.VITE_SUPERTOKENS_WEBSITE_DOMAIN": JSON.stringify(""),
    "import.meta.env.VITE_APP_DOMAIN": JSON.stringify(""),
    "import.meta.env.VITE_NODE_ENV": JSON.stringify("production"),
  },
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      // SuperTokens → local fake auth
      {
        find: /^supertokens-auth-react\/recipe\/session$/,
        replacement: stub("src/mocks/auth/recipe-session-react.tsx"),
      },
      {
        find: /^supertokens-auth-react\/recipe\/passwordless$/,
        replacement: stub("src/mocks/auth/recipe-passwordless.ts"),
      },
      {
        find: /^supertokens-auth-react\/recipe\/emailverification$/,
        replacement: stub("src/mocks/auth/recipe-emailverification.ts"),
      },
      {
        find: /^supertokens-web-js\/recipe\/session$/,
        replacement: stub("src/mocks/auth/web-session.ts"),
      },
      {
        find: /^supertokens-web-js\/recipe\/thirdparty$/,
        replacement: stub("src/mocks/auth/web-thirdparty.ts"),
      },
      {
        find: /^supertokens-web-js\/types$/,
        replacement: stub("src/mocks/auth/web-types.ts"),
      },
      // Amplitude → no-op stub
      {
        find: /^@amplitude\/analytics-browser$/,
        replacement: stub("src/mocks/vendor/amplitude.ts"),
      },
    ],
  },
  build: {
    sourcemap: false,
    // esbuild is Vite's built-in minifier (no extra dependency).
    minify: "esbuild",
  },
  esbuild: {
    drop: ["console", "debugger"],
  },
  plugins: [react()],
  // Single source of truth for the Vitest config too (this file imports from
  // "vitest/config"). Tests share the resolve aliases + define above, so the
  // SuperTokens / Amplitude stubs resolve in tests exactly as they do in builds.
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
}))
