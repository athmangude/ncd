import { ConfirmDialog } from "@/components/ConfirmDialog"

interface ExitDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  description?: string
}

export default function ExitDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  description = "Are you sure you want to leave? You can find this payment request in your dashboard to complete or close it later.",
}: ExitDialogProps) {
  return (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title="Exit Verification?"
      description={description}
      confirmLabel="Exit"
      cancelLabel="Cancel"
      variant="destructive"
    />
  )
}
