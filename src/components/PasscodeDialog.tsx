import { useState } from "react"
import { useForm } from "react-hook-form"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./Dialog"
import { Button } from "./Button"
import FormGroupInput from "./form/FormGroupInput"
import { Checkbox } from "./Checkbox"

type PasscodeFormData = {
  requiresPasscode: boolean
  passcode: string
}

type PasscodeDialogProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: PasscodeFormData) => void
  selectedFileName?: string
}

export default function PasscodeDialog({
  isOpen,
  onClose,
  onSubmit,
  // selectedFileName,
}: PasscodeDialogProps) {
  const [requiresPasscode, setRequiresPasscode] = useState(true)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasscodeFormData>()

  const handleFormSubmit = (data: PasscodeFormData) => {
    onSubmit({
      ...data,
      requiresPasscode,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter the passcode for this statement</DialogTitle>
          <DialogDescription>
            You should have received it by SMS or email from Safaricom.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requiresPasscode"
                defaultChecked={requiresPasscode}
                checked={requiresPasscode}
                onCheckedChange={(checked: boolean) => setRequiresPasscode(checked)}

                className="h-4 w-4 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-white dark:data-[state=checked]:border-primary dark:data-[state=checked]:bg-primary"
              />
              <label htmlFor="requiresPasscode" className="text-sm">
                Statement requires a passcode to open
              </label>
            </div>

            {requiresPasscode && (
              <FormGroupInput
                id="passcode"
                label="Passcode"
                type="text"
                placeholder="Enter your passcode"
                register={register("passcode", {
                  required: requiresPasscode ? "Passcode is required" : false,
                })}
                error={errors.passcode?.message}
              />
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
