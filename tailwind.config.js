/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    // Replaces (not extends) Tailwind's default fontSize scale so off-scale
    // arbitrary values stop compiling — see context/architecture or the
    // Phase 2 design-token plan for the brand letter-spacing/line-height
    // rules baked into each step.
    fontSize: {
      xs: ["0.75rem", { lineHeight: "1.5", letterSpacing: "0em" }],
      sm: ["0.875rem", { lineHeight: "1.43", letterSpacing: "0em" }],
      base: ["1rem", { lineHeight: "1.5", letterSpacing: "0em" }],
      lg: ["1.125rem", { lineHeight: "1.4", letterSpacing: "0em" }],
      xl: ["1.25rem", { lineHeight: "1.2", letterSpacing: "0em" }],
      "2xl": ["1.5rem", { lineHeight: "1.15", letterSpacing: "0em" }],
      "3xl": ["1.875rem", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
      "4xl": ["2.25rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
      "5xl": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
      "6xl": ["3.75rem", { lineHeight: "1", letterSpacing: "-0.02em" }],
      "7xl": ["4.5rem", { lineHeight: "1", letterSpacing: "-0.02em" }],
    },
    extend: {
      spacing: {
        "safe-t": "env(safe-area-inset-top, 0px)",
        "safe-b": "env(safe-area-inset-bottom, 0px)",
      },
      backgroundImage: {
        "gradient-card":
          "radial-gradient(ellipse at top right, var(--tw-gradient-stops))",
      },
      zIndex: {
        max: "9999",
        // Above Dialog/Drawer/Popover's z-50 (so a Select opened inside any
        // of them isn't hidden behind it), below Toast's z-max.
        overlay: "60",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        "brand-gradient": {
          "100": "hsl(var(--brand-gradient-light))",
          "200": "hsl(var(--brand-gradient))",
        },
        "discount-gradient": {
          "100": "hsl(var(--discount-gradient-light))",
          "200": "hsl(var(--discount-gradient))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          solid: "hsl(var(--success-solid))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          solid: "hsl(var(--warning-solid))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
          solid: "hsl(var(--info-solid))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
      },

      keyframes: {
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "spin-slow": "spin 2s ease infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
