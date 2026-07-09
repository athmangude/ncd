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
      // AppShell is the private page-shell primitive. Screens must go through an
      // archetype wrapper (PatientPageWrapper / PatientAuthWrapper /
      // StatusPageWrapper) so page chrome lives in one place. The wrappers
      // themselves and a small documented-bespoke set are allowlisted below.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/Routes/AppShell",
              message:
                "Don't import AppShell directly — use PatientPageWrapper, PatientAuthWrapper, or StatusPageWrapper so page chrome stays in one place. (Genuinely bespoke shells are allowlisted in eslint.config.js.)",
            },
          ],
          patterns: [
            {
              group: ["**/Routes/AppShell", "**/AppShell"],
              message:
                "Don't import AppShell directly — use an archetype wrapper (PatientPageWrapper / PatientAuthWrapper / StatusPageWrapper).",
            },
          ],
        },
      ],
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
  },
  {
    // Files allowed to import AppShell directly: the shell primitives + archetype
    // wrappers (which compose it), and a small documented-bespoke set whose layout
    // the wrappers can't express — the fixed-tab-bar dashboard, the pre-portal
    // splash, the facilitator portal, and the brand-gradient subscription result.
    files: [
      "src/Routes/shell/**/*.{ts,tsx}",
      "src/Routes/AppShell.tsx",
      "src/Routes/Patient/Pages/PatientPageWrapper.tsx",
      "src/Routes/Patient/components/PatientAuthWrapper.tsx",
      "src/Routes/Patient/Pages/PatientDashboard.tsx",
      "src/Routes/SplashScreens.tsx",
      "src/Routes/Facilitator/FacilitatorPanel.tsx",
      "src/Routes/Patient/Pages/Subscriptions/PatientSubscriptionsTransactionResult.tsx",
      // Tests may import AppShell directly to exercise it.
      "**/*.test.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  }
)
