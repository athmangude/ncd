import { ArrowRight } from "lucide-react"
import { Button } from "@/components/Button"
import { useNavigate } from "react-router-dom"
import ExitDialog from "./ExitDialog"
import RejectionHelpAccordion from "./RejectionHelpAccordion"
import invoiceInvalid from "@/assets/icons/invoice-invalid.png"

interface RejectedStatusViewProps {
  isExitDialogOpen: boolean
  onExitDialogChange: (open: boolean) => void
  onExit: () => void
  rejectionReason: string
}

export default function RejectedStatusView({
  isExitDialogOpen,
  onExitDialogChange,
  onExit,
  rejectionReason,
}: RejectedStatusViewProps) {
  const navigate = useNavigate()

  return (
    <>
      <ExitDialog
        isOpen={isExitDialogOpen}
        onOpenChange={onExitDialogChange}
        onConfirm={onExit}
      />
      <div className="flex flex-col items-center gap-6 pt-8">
        <div className="relative">
          <img
            src={invoiceInvalid}
            alt="Invoice error"
            className="w-24 h-24 object-contain"
          />
        </div>

        <div className="text-center space-y-2 px-4">
          <h2 className="text-xl font-semibold text-neutral-900">
            We could not accept this invoice.
          </h2>
          <p className="text-neutral-500 text-sm">
            This action was taken because your account activities violated our
            Terms of Service, specifically relating to {rejectionReason}.
          </p>
        </div>

        <RejectionHelpAccordion />

        <p className="text-sm text-neutral-500 mb-3">
          If you believe the invoice is incorrect, please try again.
        </p>
        <div className="w-full max-w-sm mt-8">
          <Button
            className="w-full"
            onClick={() => navigate("/patients/payment/request-payment/upload-invoice")}
          >
            Upload a New Invoice <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </>
  )
}
