import { ConfirmDialog } from "@/components/ConfirmDialog"
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
    <ConfirmDialog
      open={isOpen}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title="Cancel Payment Request?"
      description="Are you sure you want to cancel this payment request? This action cannot be undone."
      confirmLabel="Cancel Request"
      cancelLabel="Keep Request"
      variant="destructive"
      isLoading={isLoading}
    >
      {paymentDetails && (
        <div className="mt-4">
          <PaymentDetailsCard
            paymentDetails={paymentDetails}
            compact
            showTitle
          />
        </div>
      )}
    </ConfirmDialog>
  )
}
