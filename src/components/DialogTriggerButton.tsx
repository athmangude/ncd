import { DialogTrigger } from "@radix-ui/react-dialog"

/**
 * @deprecated Zero call sites anywhere in this repo, and it imports
 * `DialogTrigger` directly from `@radix-ui/react-dialog` rather than the
 * shared `@/components/Dialog` wrapper. Use `DialogTrigger` from
 * `@/components/Dialog` plus the shared `Button` component instead. Scheduled
 * for deletion (see
 * `~/.claude/plans/modal-drawer-sheet-audit-and-standardization.md`,
 * §3.1 / §4 Phase 8).
 */
export default function DialogTriggerButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled: boolean
}) {
  return (
    <DialogTrigger
      className="w-full bg-primary text-white rounded-md px-4 py-2 font-medium disabled:pointer-events-none disabled:opacity-50 flex justify-center items-center max-w-64"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </DialogTrigger>
  )
}
