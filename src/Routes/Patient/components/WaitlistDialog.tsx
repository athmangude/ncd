import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/Dialog"
import { Button } from "@/components/Button"
import confettiIcon from "@/assets/icons/confetti.png"
import { DialogClose } from "@radix-ui/react-dialog"
import { useToast } from "@/hooks/useToast"
import { useState } from "react"
import axios from "axios"
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"

export function WaitlistDialog({
  title,
  description,
  dialog,
  submitButtonLabel,
  navigateOnSuccessLink,
  waitlistType,
  metadata,
}: {
  title: string
  description: string
  dialog: {
    title: string
    description: string
    triggerLabel: string
  }
  submitButtonLabel: string
  navigateOnSuccessLink?: string
  waitlistType: string
  metadata?: any
}) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await axios.post(
        `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/patients/join-waitlist`,
        {
          waitlistType,
          metadata,
        }
      )

      return result.data
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "You will be notified when this feature is ready",
      })

      if (navigateOnSuccessLink) {
        navigate(navigateOnSuccessLink)
      }

      setOpen(false)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      })
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{dialog.triggerLabel}</Button>
      </DialogTrigger>

      <DialogContent className="max-w-md py-10">
        <DialogHeader className="sr-only">
          <DialogTitle>{dialog.title}</DialogTitle>
          <DialogDescription>{dialog.description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 items-center">
          <img
            src={confettiIcon}
            alt="Confetti Icon"
            className="w-full max-w-[70px] object-contain"
            aria-hidden="true"
          />

          <h1>{title}</h1>

          <p className="text-lg text-muted-foreground text-center">
            {description}
          </p>

          <div className="flex flex-col gap-3 w-full mt-5">
            <Button
              className="w-full"
              type="button"
              onClick={() => mutation.mutate()}
              isLoading={mutation.isPending}
              disabled={mutation.isPending}
            >
              {submitButtonLabel}
            </Button>

            <DialogClose asChild>
              <Button variant="outline" className="w-full">
                Cancel
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
