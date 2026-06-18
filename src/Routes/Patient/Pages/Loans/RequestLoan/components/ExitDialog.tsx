import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/Dialog"
import { Button } from "@/components/Button"

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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exit Verification?</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white">
            Exit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
