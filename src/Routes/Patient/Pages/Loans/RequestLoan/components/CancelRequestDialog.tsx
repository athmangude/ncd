import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/Dialog"
import { Button } from "@/components/Button"
import PaymentDetailsCard from "./PaymentDetailsCard"

interface PaymentDetails {
  facilityName: string
  patientName: string
  billAmount: number
  currency: string
}

interface CancelRequestDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  paymentDetails: PaymentDetails | null
  isLoading?: boolean
}

export default function CancelRequestDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  paymentDetails,
  isLoading = false,
}: CancelRequestDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cancel Payment Request?</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this payment request? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {paymentDetails && (
          <div className="mt-4">
            <PaymentDetailsCard paymentDetails={paymentDetails} compact showTitle />
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Keep Request
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
            isLoading={isLoading}
            disabled={isLoading}
          >
            Cancel Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
