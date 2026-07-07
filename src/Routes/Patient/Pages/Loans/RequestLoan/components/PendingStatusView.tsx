import { X } from "lucide-react"
import { Button } from "@/components/Button"
import ExitDialog from "./ExitDialog"
import CancelRequestDialog from "./CancelRequestDialog"
import VerificationStatusIcon from "./VerificationStatusIcon"
import PaymentDetailsCard from "./PaymentDetailsCard"

interface PaymentDetails {
  facilityName: string
  patientName: string
  billAmount: number
  currency: string
}

interface PendingStatusViewProps {
  isExitDialogOpen: boolean
  onExitDialogChange: (open: boolean) => void
  onExit: () => void
  isCancelDialogOpen: boolean
  onCancelDialogChange: (open: boolean) => void
  onCancelClick: () => void
  onConfirmCancel: () => void
  paymentDetails: PaymentDetails | null
  isCancelling?: boolean
}

export default function PendingStatusView({
  isExitDialogOpen,
  onExitDialogChange,
  onExit,
  isCancelDialogOpen,
  onCancelDialogChange,
  onCancelClick,
  onConfirmCancel,
  paymentDetails,
  isCancelling = false,
}: PendingStatusViewProps) {
  return (
    <>
      <ExitDialog
        isOpen={isExitDialogOpen}
        onOpenChange={onExitDialogChange}
        onConfirm={onExit}
      />
      <CancelRequestDialog
        isOpen={isCancelDialogOpen}
        onOpenChange={onCancelDialogChange}
        onConfirm={onConfirmCancel}
        paymentDetails={paymentDetails}
        isLoading={isCancelling}
      />
      <div className="flex flex-col items-center justify-center flex-1 min-h-[60vh] gap-6">
        <VerificationStatusIcon />
        <div className="text-center space-y-2">
          <h2 className="text-foreground">Verification in progress...</h2>
          <p className="text-muted-foreground max-w-xs mx-auto text-sm">
            You should receive an SMS in{" "}
            <span className="font-bold text-primary">5</span> minutes for you to
            choose how you want to pay.
          </p>
        </div>
        <div className="bg-muted rounded-lg p-4 w-full max-w-sm mt-8 text-center">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Next step:
          </p>
          <p className="text-sm font-semibold text-foreground">
            Choose how to pay your bill
          </p>
        </div>

        {paymentDetails && (
          <PaymentDetailsCard paymentDetails={paymentDetails} />
        )}

        <div className="w-full max-w-sm">
          <Button
            variant="destructive"
            className="w-full"
            onClick={onCancelClick}
            isLoading={isCancelling}
          >
            <X className="w-4 h-4" />
            Cancel Request
          </Button>
        </div>
      </div>
    </>
  )
}
