import { CheckCircle } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/Button"
import ExitDialog from "./ExitDialog"

interface PaidStatusViewProps {
  isExitDialogOpen: boolean
  onExitDialogChange: (open: boolean) => void
  onExit: () => void
}

export default function PaidStatusView({
  isExitDialogOpen,
  onExitDialogChange,
  onExit,
}: PaidStatusViewProps) {
  const navigate = useNavigate()

  return (
    <>
      <ExitDialog
        isOpen={isExitDialogOpen}
        onOpenChange={onExitDialogChange}
        onConfirm={onExit}
        description="Are you sure you want to leave? You can find this payment request on your dashboard to finish the process ."
      />
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-success-foreground" />
        </div>
        <h1 className="text-foreground mb-2">Payment Already Made</h1>
        <p className="text-muted-foreground">
          This payment request has already been paid.
        </p>
        <Button onClick={() => navigate("/patients")} className="mt-8">
          Go Home
        </Button>
      </div>
    </>
  )
}
