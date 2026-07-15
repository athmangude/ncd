---
context_version: 1.1
last_updated_commit: 1bd28205
last_updated_date: 2026-07-15
covers: React Hook Form patterns, usePersistentForm, FormGroup* components, validation, multi-step forms, FormGroupInput's controlled (non-RHF) mode
---

# Forms

## Framework

**React Hook Form v7** is the only form library used. Do not add Formik or other form libraries.

---

## Basic Form Pattern

```typescript
import { useForm } from "react-hook-form"
import { FormGroupInput } from "@/components/form/FormGroupInput"

interface LoginInputs {
  email: string
  password: string
}

function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInputs>()

  const mutation = useMutation({
    mutationFn: (data: LoginInputs) => signIn(data),
    onSuccess: () => navigate("/dashboard"),
  })

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
      <FormGroupInput
        id="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        register={register("email", { required: "Email is required" })}
        error={errors.email?.message}
      />
      <FormGroupInput
        id="password"
        label="Password"
        type="password"
        register={register("password", { required: "Password is required" })}
        error={errors.password?.message}
      />
      <Button type="submit" isLoading={mutation.isPending}>
        Log in
      </Button>
    </form>
  )
}
```

---

## `FormGroup*` Components (`src/components/form/`)

These wrap React Hook Form's `register` API with the shared UI. Always use these instead of raw `<input>` elements.

| Component | Location | Integration | Use |
|-----------|----------|-------------|-----|
| `FormGroupInput` | `src/components/form/FormGroupInput.tsx` | `register` prop | Text, email, tel, password, number, file inputs. Supports country code picker, helperText popover |
| `FormGroupSelect` | `src/components/form/FormGroupSelect.tsx` | `field` (Controller) | Dropdown select with optional inline search and action button |
| `FormGroupSelectOnClick` | `src/components/form/FormGroupSelectOnClick.tsx` | `onOptionClick` callback | Callback-driven select — NOT react-hook-form Controller; uses `useState` internally |
| `FormGroupCombo` | `src/components/form/FormGroupCombo.tsx` | `field` (Controller) | Searchable combobox (Popover + Command pattern) |
| `FormGroupTextarea` | `src/components/form/FormGroupTextarea.tsx` | `register` prop | Multi-line text |
| `FormGroupRadio` | `src/components/FormGroupRadio.tsx` | `value` + `onChange`/`onBlur` callbacks | Radio group — callback-driven; does not accept `register` or `field` props directly, but can be wired via `Controller` callbacks |
| `FormGroupWrapper` | `src/components/form/FormGroupWrapper.tsx` | — | Base flex container used internally by all FormGroup* components |

**Important**: `FormGroupSelectOnClick` and `FormGroupRadio` do not accept react-hook-form `register` or `field` props directly. They use callback-style APIs instead. `FormGroupRadio` can still be integrated with react-hook-form via `Controller` by passing through `value`, `onChange`, and `onBlur` when needed; `FormGroupSelectOnClick` is intended for event-driven selection without direct form-field binding.

Key `FormGroupInput` props (beyond the standard `id`, `label`, `type`, `placeholder`, `error`):
- `countryCode` / `onCountryCodeChange` — phone country code picker
- `helperText` — popover help icon
- `description` — subtext below label
- `readonly` / `defaultValue` — for display-only scenarios
- `isDevMode` — enables dev-cycle through country codes
- `onKeyDown` — passthrough for callers that need to block specific keystrokes (e.g. `-`/`e` on a non-negative number field)

### `FormGroupInput`'s Two Mutually-Exclusive Modes

`FormGroupInput` accepts **either** the standard RHF `register` prop **or** a controlled triple — never both, enforced by a discriminated union on the prop type:

```typescript
// Mode 1 (default, documented pattern above): React Hook Form
<FormGroupInput id="email" label="Email" type="email" register={register("email")} error={errors.email?.message} />

// Mode 2: controlled, for state living outside an RHF instance (e.g. a
// Zustand-backed multi-step flow like Fast Track, or a field derived from
// a store rather than a form)
<FormGroupInput
  id="amount"
  label="Amount"
  type="number"
  value={amount}
  onChange={(e) => setAmount(e.target.value)}
  onBlur={handleBlur}
  error={amountError}
/>
```

Passing `register` together with `value`/`onChange` is a type error — pick one mode per field. Reach for Mode 2 specifically when the field's source of truth is a Zustand store (e.g. `useFastTrackStore`) rather than a form instance; don't introduce a parallel one-off controlled input component for that case.

---

## `usePersistentForm` (`src/hooks/usePersistentForm.tsx`)

For multi-step flows where form state must survive page navigation or accidental closes:

```typescript
const {
  register,
  handleSubmit,
  formState: { errors },
  clearPersistentState,
} = usePersistentForm<TreatmentDetailsInputs>("treatmentDetails", {
  defaultValues: { provider: "", amount: "" },
})
```

How it works:
- Reads initial values from `localStorage[storageKey]` on mount
- Subscribes to `watch()` and writes every change to `localStorage`
- `clearPersistentState()` removes the localStorage key (call on successful submit)
- Returns everything `useForm()` returns plus `clearPersistentState`

**Use for:** Loan request flow, payment flow, onboarding — any multi-step wizard where losing in-progress data would frustrate users.

**Do not use for:** Simple single-page forms (login, settings) — localStorage persistence is unnecessary overhead.

---

## Validation

React Hook Form validation rules are passed inline to `register`:

```typescript
register("phoneNumber", {
  required: "Phone number is required",
  pattern: {
    value: /^\+?[0-9]{10,15}$/,
    message: "Enter a valid phone number",
  },
  minLength: { value: 10, message: "Too short" },
})
```

For complex validation, use the `validate` option:
```typescript
register("confirmPin", {
  validate: (value) =>
    value === getValues("pin") || "PINs do not match",
})
```

Validation utilities are in `src/utilities/validators.tsx`.

---

## File Upload Forms

For file uploads, use `FormData` with Axios and track progress via `onUploadProgress`:

```typescript
const mutation = useMutation({
  mutationFn: async ({ file }: { file: File }) => {
    const formData = new FormData()
    formData.append("file", file)
    return axios.post(`${BASE_URL}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        const progress = Math.round((event.loaded / event.total!) * 100)
        setUploadProgress(progress)
      },
    })
  },
})
```

---

## OTP / PIN Inputs

Use the `InputOTP` component (from `input-otp` package, integrated via `@/components/InputOtp.tsx`) for PIN entry and OTP screens. Do not build custom digit-by-digit inputs.
