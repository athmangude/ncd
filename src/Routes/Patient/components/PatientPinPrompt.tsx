import { Button } from "@/components/Button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/Dialog"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/InputOtp"
import { useToast } from "@/hooks/useToast"
import { useMutation } from "@tanstack/react-query"
import axios, { HttpStatusCode } from "axios"
import { useRef, useState } from "react"
import { UseFormHandleSubmit } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import pinProtectIcon from "@/assets/icons/pin-protect.svg"

type PatientPinPromptProps = {
  drawer: {
    triggerLabel: string | React.ReactNode
    triggerClassName?: string
    title: string
    description: string
    beforeSubmit: UseFormHandleSubmit<any, undefined> //Use for react-hook-form validation
  }
  form: {
    url: string
    method: "POST" | "PUT" | "PATCH" | "DELETE"
    onSuccess?: (data: any) => void //Any post request action such as redirecting to another page or invalidating queries
    onError?: (error: any) => void //Same as onSuccess but for error
    submitButtonText: string
  }
  children: React.ReactNode
}

export default function PatientPinPrompt({
  drawer,
  children,
  form,
}: PatientPinPromptProps) {
  const [pin, setPin] = useState("")
  const [data, setData] = useState<any>()

  const [open, setOpen] = useState(false)

  const [error, setError] = useState("")

  const pinInputRef = useRef<React.ComponentRef<typeof InputOTP>>(null)

  const { toast } = useToast()

  const navigate = useNavigate()

  const { mutateAsync, isSuccess, isPending, reset } = useMutation({
    mutationFn: async (pinValue: string) => {
      const result = await axios.post(
        import.meta.env.VITE_SUPERTOKENS_API_DOMAIN + form.url,
        data,
        {
          headers: {
            "AUTH-PIN": pinValue,
          },
          timeout: 60_000, // 60s — avoid indefinite hang if API never responds
        }
      )

      return result.data
    },
    onSuccess: (data: any) => {
      if (!form.onSuccess) {
        toast({
          title: "Success",
          description: data.message,
        })
      }

      if (form.onSuccess) {
        form.onSuccess(data)
      }
    },
    onError: (error: any) => {
      if (error.response?.status === HttpStatusCode.Locked) {
        navigate("/patients/account-locked")
        return
      }

      setError(error.response?.data?.message || error.message)
      setPin("")
      setTimeout(() => pinInputRef.current?.focus(), 0)

      if (form.onError) {
        form.onError(error)
      }
    },
  })

  function handleSubmit() {
    if (pin.length < 4) {
      setError("PIN must be at least 4 digits")
      return
    }
    mutateAsync(pin)
  }

  function handlePinChange(value: string) {
    setPin(value)
    if (error) setError("")
    if (value.length === 4 && !isPending && !isSuccess) {
      mutateAsync(value)
    }
  }

  function handleOpenChange(open: boolean) {
    setData(null)
    setError("")
    setOpen(open)
    setPin("")
    if (!open) reset() // So Confirm & Pay is clickable again when dialog is reopened
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button
        className={`w-full ${drawer.triggerClassName || ""}`}
        type="submit"
        onClick={(e) => {
          e.preventDefault()

          drawer.beforeSubmit((data) => {
            setOpen(true)
            setData(data)
          })()
        }}
      >
        {drawer.triggerLabel}
      </Button>

      <DialogContent
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          setTimeout(() => pinInputRef.current?.focus(), 0)
        }}
        className="flex flex-col gap-0 overflow-hidden p-0 max-h-[min(90dvh,calc(100dvh-var(--safe-t)-var(--safe-b)-1rem))] sm:rounded-lg"
      >
        <div className="mx-auto flex min-h-0 w-full flex-1 flex-col pl-[max(1rem,var(--safe-l))] pr-[max(1rem,var(--safe-r))]">
          <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain py-3 sm:gap-3 sm:py-5">
            <img
              src={pinProtectIcon}
              alt="Pin protect icon"
              className="mx-auto h-24 w-24 shrink-0 sm:h-32 sm:w-32"
            />
            <DialogTitle className="shrink-0 px-1">{drawer.title}</DialogTitle>
            <DialogDescription className="shrink-0 px-2 text-center text-sm text-muted-foreground sm:px-1 sm:text-base">
              {drawer.description}
            </DialogDescription>

            <div className="flex shrink-0 flex-col items-center gap-2">
              <InputOTP
                ref={pinInputRef}
                maxLength={4}
                value={pin}
                onChange={handlePinChange}
                id="pin"
                type="password"
                disabled={isPending || isSuccess}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <div className="shrink-0 px-1 py-2 sm:p-5">{children}</div>
          </div>

          <DialogFooter className="flex shrink-0 flex-col-reverse gap-2 border-t border-border/40 pt-3 pb-[max(1rem,var(--safe-b))] sm:flex-row sm:space-x-0 sm:pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="w-full">
                Cancel
              </Button>
            </DialogClose>
            <Button
              isLoading={isPending}
              disabled={isPending || isSuccess}
              onClick={handleSubmit}
              className="w-full"
            >
              {form.submitButtonText}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
