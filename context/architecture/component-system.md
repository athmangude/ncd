---
context_version: 1.2
last_updated_commit: 1bd28205
last_updated_date: 2026-07-15
covers: Radix UI + shadcn/ui patterns, CVA for variants, cn() utility, design tokens (semantic shadcn-style palette — no bubblegum/jh-green), AppShell + archetype wrappers (now wired in), Dialog/Drawer overlay primitives, list/history primitives, dashboard entrance animation, component structure
---

# Component System

## Stack

| Tool | Role |
|------|------|
| **Radix UI** | Headless, accessible primitive components (no styles) |
| **shadcn/ui patterns** | Convention for composing Radix + Tailwind (not a library — it's a pattern) |
| **Tailwind CSS 3.4** | Utility-first styling |
| **class-variance-authority (CVA)** | Type-safe variant definitions for components |
| **`cn()` utility** | Merges Tailwind classes, resolving conflicts |
| **Framer Motion** | Animations (page transitions, micro-interactions) |

---

## `cn()` Utility (`src/lib/utils.ts`)

Every component that accepts a `className` prop uses `cn()`:

```typescript
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

`twMerge` resolves Tailwind class conflicts (e.g., `p-4` and `p-2` → keeps `p-2`). Always use `cn()` — never manually concatenate class strings.

---

## CVA Variant Pattern

Components with multiple visual variants use `class-variance-authority`:

```typescript
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  // Base styles (always applied)
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        ghost:   "hover:bg-accent hover:text-accent-foreground",
        outline: "border border-input bg-background hover:bg-accent",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm:      "h-8 rounded-md px-3 text-xs",
        lg:      "h-10 rounded-md px-8",
        icon:    "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Component accepts VariantProps for type-safe variant props
interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
}
```

---

## Design Tokens

### Tailwind CSS Variables

Colours are defined as CSS custom properties in `src/index.css` and referenced in `tailwind.config.js`:

```css
/* src/index.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: ...;
  --secondary: ...;
  --muted: ...;
  --accent: ...;
  --destructive: ...;
  --border: ...;
  --ring: ...;
}
```

Use `hsl(var(--primary))` syntax in custom CSS; use Tailwind tokens (`bg-primary`, `text-primary-foreground`) in components.

### Semantic Token Palette

**`bubblegum` and `jh-green` do not exist anywhere in the codebase.** They were removed during a design-token overhaul (a multi-part sweep of hex literals, ad-hoc Tailwind colors, and hardcoded brand colors onto semantic tokens — see the `refactor(design-system):`/`style(design-system):` commits in `git log`) and `tailwind.config.js` now defines a clean shadcn-style semantic palette instead. Every color is a CSS custom property in `src/index.css`, consumed via `hsl(var(--x))`:

| Token | Backing CSS vars | Use |
|-------|------------------|-----|
| `background` / `foreground` | `--background` / `--foreground` | Page backdrop / default text |
| `card` / `card-foreground` | `--card` / `--card-foreground` | Card surfaces (the canonical replacement for old `bg-white` surfaces) |
| `popover` / `popover-foreground` | `--popover` / `--popover-foreground` | Popover/dropdown surfaces |
| `primary` / `primary-foreground` | `--primary` / `--primary-foreground` | Interactive elements, brand accent (purple, `hsl(285.8 100% 49%)` in light mode) |
| `secondary` / `secondary-foreground` | `--secondary` / `--secondary-foreground` | Secondary actions |
| `muted` / `muted-foreground` | `--muted` / `--muted-foreground` | Subdued text, backgrounds |
| `accent` / `accent-foreground` | `--accent` / `--accent-foreground` | Accent surfaces (teal-ish in light mode) |
| `destructive` / `destructive-foreground` | `--destructive` / `--destructive-foreground` | Error states, destructive actions |
| `success` / `warning` / `info` | see "Status Colors" below | Status tints |
| `border` / `input` / `ring` | `--border` / `--input` / `--ring` | Borders, form field borders, focus rings |
| `brand-gradient-100`/`-200` | `--brand-gradient-light` / `--brand-gradient` | Purple gradient (hero surfaces, brand moments) |
| `discount-gradient-100`/`-200` | `--discount-gradient-light` / `--discount-gradient` | Teal gradient (discount/coupon UI, e.g. `DiscountDetailsDrawer`) |

All of the above are HSL triplets defined once in `:root` (light) and again in `.dark` in `src/index.css` — components never hardcode a color, they reach for the Tailwind token (`bg-primary`, `text-muted-foreground`, `from-discount-gradient-200`).

### Status Colors

`success`, `warning`, `info` each have a `DEFAULT` (light background tint), `-foreground` (text on that tint), and `-solid` (a saturated fill, e.g. for status dots) variant — same three-part shape in light and dark mode:

```tsx
<Badge variant="success">Active</Badge>
<div className="bg-warning-solid" />  {/* status dot */}
```

`destructive` does **not** have a `-solid` variant yet — only `DEFAULT`/`-foreground`. If a component needs a light/solid destructive pair (mirroring success/warning/info), that token doesn't exist; don't invent one ad hoc, and don't assume `bg-destructive` alone gives you the "solid dot" look those other three have.

### Fluid Sizing Tokens

`src/index.css` defines a set of `clamp()`-based CSS custom properties for hero-card sizing that scale smoothly with viewport width instead of jumping at breakpoints — `--fluid-card-radius`, `--fluid-card-padding`, `--fluid-card-gap`, `--fluid-badge-py`/`-px`/`-text`, `--fluid-icon-size`, `--fluid-label-text`, `--fluid-logo-size`/`-height`, `--fluid-amount-text`, `--fluid-corner-offset`/`-icon`. Use via `style={{ padding: "var(--fluid-card-padding)" }}` or an arbitrary Tailwind value (`p-[var(--fluid-card-padding)]`). These exist for the balance/loan/care-fund hero cards specifically — don't reach for them on ordinary cards where a fixed Tailwind spacing scale is fine.

### Safe-Area Utilities

For iOS / installed-PWA safe-area insets (notch, home indicator): `.safe-pt`/`.safe-pb`/`.safe-pl`/`.safe-pr` (raw inset), `.safe-pt-min-4`/`.safe-pb-min-4`/`.safe-px-min-4` (inset with a minimum floor), `.safe-pb-min-3` (footer variant). `--safe-t`/`--safe-b`/`--safe-l`/`--safe-r` are the underlying CSS vars if you need them in a `calc()`. `--tabbar-h` is the fixed dashboard tab bar's total height including its safe-area inset — content that scrolls under the tab bar clears it with `.pb-tabbar` (adds a breathing gap on top) or `.pb-tabbar-cta` (the extra clearance when `DashboardStickyFooter` is also showing). **Never hand-roll `env(safe-area-inset-*)` or a magic `pb-[80px]` — use these.**

### Heading Ramp

`h1`/`h2`/`h3` get their size/weight from global base rules in `src/index.css` (`h1`: `text-xl font-medium`, `h2`: `text-lg font-medium`, `h3`: `text-base font-medium`) — this is the single source of truth for heading typography. A lint rule (`no-restricted-syntax` in `eslint.config.js`) flags `text-*`/`font-*` utilities placed directly on an `h1`/`h2`/`h3` as a **warning** (not yet an error — there's a large pre-existing backlog of headings with their own inline sizing that predates this rule).

- **New headings:** don't add your own size/weight — let the ramp supply it. If the ramp's size is wrong for your case, that's a signal to reconsider using a heading tag, not to override it locally.
- **Existing headings with a deliberate, pre-existing size/weight deviation** (e.g. a profile name styled bolder than the `h2` default): leave them, and if you touch the surrounding code for an unrelated reason, add a one-line comment + `{/* eslint-disable-next-line no-restricted-syntax */}` explaining *why* it deviates, rather than silently "fixing" someone else's visual decision or leaving a bare warning.
- The pinned app-bar title (`BackTitleHeader`/`StepperHeader` in `Routes/shell/headers.tsx` / `Routes/shell/StepperHeader.tsx`) is intentionally **not** a heading — it's a `<p className="text-base font-normal">` UI label, not a document heading, so it's outside this ramp on purpose.

---

## Component File Structure

All shared components live in `src/components/`. Keep the structure flat — no deep nesting.

```
src/components/
├── form/
│   ├── FormGroupInput.tsx      # Text input with label, error, register, sensitive (PII masking)
│   ├── FormGroupSelect.tsx
│   ├── FormGroupCombo.tsx
│   └── FormGroupTextarea.tsx
├── auth/
│   └── [auth-specific shared components]
├── typography/
│   ├── DashboardTitle.tsx
│   ├── Title.tsx
│   └── Pullout.tsx             # Narrow, brand-restricted "moment copy" (font-serif italic, no size prop)
├── ProtectedResource.tsx       # Role-based rendering wrapper
├── Button.tsx
├── Dialog.tsx
├── ConfirmDialog.tsx           # AlertDialog-based confirm modal — use for destructive/abandon-flow actions
├── Sheet.tsx                   # Radix Dialog as a side sheet
├── Tabs.tsx
├── ToggleGroup.tsx             # Segmented control / single-select pill row
├── Select.tsx
├── Checkbox.tsx
├── Switch.tsx
├── Progress.tsx
├── Toaster.tsx                 # Toast notification system
├── Badge.tsx                   # default/secondary/destructive/outline/ghost/link/success/warning/info/neutral
├── Chip.tsx                    # Tappable/removable pill, built on Badge — filter chips, inline action pills
├── Item.tsx                    # Item + ItemMedia/ItemContent/ItemTitle/ItemDescription/ItemActions/ItemGroup/ItemSeparator/ItemHeader/ItemFooter — generic list-row primitive
├── SectionTitle.tsx            # Canonical in-page <h2>/<h3>, tied to the heading ramp
├── Amount.tsx                  # Canonical monetary-value formatter (Geist Mono, tabular-nums)
├── HistoryCard.tsx             # History-row atoms — see "List & History Primitives" below
├── TransactionHistoryList.tsx  # Shared grouped-by-date list scaffold — see below
├── CashbackCard.tsx            # Cashback/care-fund transaction card, built on HistoryCard
└── [~60 more components]
```

---

## Page Shell: `AppShell` + Archetype Wrappers

`MobileWrapper` is **gone** — it was collapsed into the canonical wrappers and deleted during the AppShell layout migration (Phases 0–8 + closeout). Every screen now renders through **`src/Routes/AppShell.tsx`**, a private primitive: a neutral backdrop with a centered full-height `max-w-md` card, a pinned header slot, an internally-scrolling body, and a pinned footer slot. Safe-area insets (notch, home indicator) are handled inside `AppShell` itself.

`AppShell` is intentionally **not imported directly** by screens — `no-restricted-imports` in `eslint.config.js` blocks it everywhere except an explicit allowlist. Screens go through one of three archetype wrappers so page chrome lives in one place:

| Wrapper | File | Use for |
|---------|------|---------|
| `PatientPageWrapper` | `src/Routes/Patient/Pages/PatientPageWrapper.tsx` | Standard/journey screens. `variant="legacy"` (default) puts the title + progress stepper in the pinned app bar. `variant="content"` renders a slim borderless `StepperHeader` (back/help/rightAction + terse `barTitle` only) plus a content-level `PageHeader` (icon/title/description/stepper) as the first child of the scrolling body. |
| `PatientAuthWrapper` | `src/Routes/Patient/components/PatientAuthWrapper.tsx` | Auth/onboarding screens — canonical `LogoHeader` bar. |
| `StatusPageWrapper` | `src/Routes/shell/StatusPageWrapper.tsx` | Chrome-less status pages (loading, error, unauthorized, invalid-tenant, verify-email) — both header and footer slots suppressed. |

A small, explicitly documented set is allowlisted to import `AppShell` directly because their layout genuinely doesn't fit an archetype: `PatientDashboard.tsx` (fixed tab-bar shell), `SplashScreens.tsx` (pre-portal), `Facilitator/FacilitatorPanel.tsx` (facilitator portal), and `PatientSubscriptionsTransactionResult.tsx` (brand-gradient tint). Tests (`**/*.test.{ts,tsx}`) may also import it directly to exercise it. Check `eslint.config.js`'s `no-restricted-imports`/allowlist blocks before adding a new bespoke shell — the bar is high.

### `PatientPageWrapper`'s `content` variant

Content-variant screens declare `pageTitle`, `description`, `headerIcon`, `headerAction`, `headerAlign`, and `barTitle` props; `PatientPageWrapper` resolves the app-bar's terse title and the in-body `PageHeader`'s descriptive title from a shared `useJourneyStepMeta()` fallback when a screen doesn't pass explicit copy, so the two headers never collide. `showStepper` (default `true`) renders the `Stepper` inside the `PageHeader` using `useJourneyStepper()` — the same hook that centralizes multi-journey progress detection (loan → care profile → KYC → onboarding → PWA → fast track → circle invite) that used to live inline per-screen.

A `logoHeader` boolean prop (content variant only) swaps in the canonical `LogoHeader` (no back/help/rightAction, no title) for terminal screens — success, locked, or otherwise back-action-less status screens — that would otherwise carry a bar with nothing useful in it.

### `useJourneyStepper` / `useJourneyStepMeta`

`src/Routes/shell/useJourneyStepper.ts` centralizes the "what step of what journey is this screen" detection so it isn't duplicated per-screen. Both `PatientPageWrapper` variants call it (directly or via the content-header path) to drive the in-bar or in-body `Stepper`.

## Overlay Primitives: `Dialog` and `Drawer`

`src/components/Dialog.tsx` (Radix `Dialog`, centered modal) and `src/components/Drawer.tsx` (`vaul`-based bottom sheet) are the two standardized overlay primitives — every modal/sheet in the app is built from one of these, not a bespoke `fixed inset-0` div.

- **`DialogContent`** — fixed, centered, `max-w-md` by default (pass a wider `max-w-*` explicitly for dialogs with real form content), width computed as `calc(100% - 2*max(1rem, --safe-l/r))` so it keeps consistent breathing room from both screen edges on narrow phones.
- **`DrawerContent`** — fixed to the bottom, `max-w-md` + `mx-auto`, height capped to the viewport (`max-h-[calc(100dvh-var(--safe-t)-1rem)]`) so content scrolls internally instead of pushing footer buttons off-screen; horizontal padding composes `--safe-l`/`--safe-r` directly on the content element — **call sites must not wrap children in their own `max-w-*` div**, that's the primitive's job. Takes an `overlay?: boolean` prop (default `true`) to suppress the scrim for drawers stacked over another overlay.
- Both share the `z-50` stacking layer; `tailwind.config.js` defines a `z-overlay` (60) token for a `Select`/`Popover` opened *inside* a Dialog/Drawer so it isn't hidden behind it.
- `ConfirmDialog` (`src/components/ConfirmDialog.tsx`) is Radix `AlertDialog`-based, not `Dialog` — use it specifically for destructive/abandon-flow confirmations.

`DiscountDetailsDrawer` (`src/Routes/Patient/components/DiscountDetailsDrawer.tsx`) is the consolidated discount-code UI — code reveal (using the `discount-gradient` tokens), copy-to-clipboard, native share (`navigator.share` with clipboard fallback), and an optional `onApply` prop that swaps the primary CTA from "copy code" to "apply code" for flows (e.g. Fast Track payment details) that apply a code directly instead of surfacing it to paste elsewhere. Built entirely on `DrawerContent`/`DrawerHeader`/`DrawerFooter` — if you need discount-code UI elsewhere, reuse this component rather than re-building the reveal/copy/share logic.

## List & History Primitives

Every "list of transactions grouped by date" surface (payment history, loan history, cashback/care-fund transactions, the dashboard payment + treatment feeds) is built from the same two-layer primitive — **don't hand-roll date-grouping or a bespoke transaction card again**:

- **`TransactionHistoryList<T>`** (`src/components/TransactionHistoryList.tsx`) — owns sorting newest-first, grouping consecutive same-day rows under a date header, and the shared empty/loading (skeleton) states. Takes `items`, `getKey`, `getDate`, `renderItem`, optional `isLoading`/`emptyState`.
- **`HistoryCard`** + sub-entry atoms (`src/components/HistoryCard.tsx`): `HistoryEntry` (header row: icon/title/subtitle/trailing), `AmountTime`, `HistoryChevron`, `CashbackEntry`, `CashbackEarnedEntry`, `LoanEntry` (the "due by X / Pay now" or "repaid" sub-row). A history card is a composition of these atoms stacked inside one `HistoryCard` shell — e.g. a payment-with-loan card is a `HistoryEntry` header + a `LoanEntry`, and that's the exact same `LoanEntry` a standalone loan card uses.
- **`CashbackCard`** (`src/components/CashbackCard.tsx`) — the canonical cashback/care-fund row, a thin composition of `HistoryCard` + `CashbackEntry`.

If you're building a new list of dated transaction-like items, reach for `TransactionHistoryList` + the `HistoryCard` atoms first; only build a new atom if none of `HistoryEntry`/`AmountTime`/`CashbackEntry`/`LoanEntry` fits.

## Dashboard Entrance Animation

The four dashboard tabs (home/explore/circle/profile) share a staggered fade/slide-in on first load, backed by a skeleton while data loads: `DashboardStagger`/`DashboardSection` (`src/Routes/Patient/Pages/Dashboard/components/DashboardStagger.tsx`), `DashboardSkeleton.tsx`, `DashboardTabFallback.tsx` (the `Suspense` fallback for the lazy-loaded tab routes), and the `useDashboardFirstLoad` hook (tracks first-mount vs. background-refetch so the animation only plays once). If you add a new top-level dashboard tab, wire it into this system rather than building a one-off loading state.

---

## Rules for Shared Components (`src/components/`)

These are the most sensitive files in the codebase. Multiple portals (Patient, Org) depend on them.

1. **Never change a component's existing props API** without a migration plan — it will break every caller silently (TypeScript won't always catch this if types are loose)
2. **Add new props as optional with defaults** — preserve backward compatibility
3. **Do not add portal-specific logic** to shared components — create a portal-specific wrapper instead
4. **Always use `cn()` when merging className** — never string concatenate
5. **Run `npm run build` after any change** to `src/components/` — type errors in shared components cascade widely
6. **Prefer Radix primitives** for interactive elements (Dialog, Select, Tabs) — they handle accessibility out of the box

---

## Form Components

`FormGroup*` components in `src/components/form/` are wrappers that integrate React Hook Form's `register` API with the shared UI:

```typescript
<FormGroupInput
  id="email"
  label="Email address"
  type="email"
  placeholder="you@example.com"
  register={register("email", { required: "Email is required" })}
  error={errors.email?.message}
/>
```

These abstract away the `{...register(...)}` spread and error display, so page-level forms stay clean. See [`forms.md`](./forms.md) for the full form pattern.

---

## Typography Components

- `DashboardTitle` — Page-level headings within a portal dashboard
- `Title` — General-purpose heading
- `SectionTitle` — Canonical in-page `<h2>`/`<h3>` (via a `level` prop), tied to the heading ramp above. Prefer this over a raw `<h2>` for new in-page section headings.
- `Pullout` — Narrow, brand-restricted component for a single emotionally-weighted line of copy (`font-serif italic`, deliberately no size prop). Not a general-purpose text component — don't reach for it outside that specific "moment" use case.

These enforce consistent heading styles rather than using raw `<h1>`/`<h2>` with Tailwind.

---

## Before Building a New Component

Per this repo's "audit before adding" convention: search `src/components/` (and `src/Routes/shell/` for shell/layout pieces) before writing a new one. Recently-added primitives worth checking specifically, since they're easy to miss if you're used to the older component list: `Item`/`ItemGroup` (generic list row), `Chip` (tappable/removable pill), `Amount` (money formatting), `ConfirmDialog` (destructive-action confirm), `ToggleGroup` (segmented control), `SectionTitle`/`Pullout` (typography), and the List & History and Dashboard Entrance Animation primitives described above. A new component is justified when none of these fit — not when one almost fits but needs a prop you don't want to add.

---

## Path Aliases

Always import using aliases — never relative paths that traverse `../../../`:

```typescript
import { Button } from "@/components/Button"
import { cn } from "@/lib/utils"
import { EVENTS } from "@/analytics/events"
```

Defined in both `tsconfig.app.json` and `vite.config.ts`.
