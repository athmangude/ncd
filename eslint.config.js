import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tseslint from "typescript-eslint"

export default tseslint.config(
  { ignores: ["dist", "dev-dist", "dist-ssr", "src/hooks/useToast.tsx"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-useless-escape": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "max-params": ["error", 4],
      "no-restricted-syntax": [
        "warn",
        {
          selector:
            "CallExpression[callee.object.name='amplitude'][callee.property.name='track']",
          message:
            "Use trackEvent() from '@/analytics' instead of calling amplitude.track() directly. See CLAUDE.md analytics section.",
        },
        {
          selector:
            "CallExpression[callee.object.name='amplitude'][callee.property.name='logEvent']",
          message:
            "Use trackEvent() from '@/analytics' instead of calling amplitude.logEvent() directly. See CLAUDE.md analytics section.",
        },
      ],
    },
  },
  {
    files: ["src/analytics/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": "off",
    },
  }
)
