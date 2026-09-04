import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/Dialog"
import { Button } from "@/components/Button"
import confettiIcon from "@/assets/icons/confetti.png"
import { useToast } from "@/hooks/useToast"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
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
      const { data: pd, error: pdError } = await supabase
        .from("patient_details")
        .select("id, data")
        .single()

      if (pdError) throw pdError

      const blob = (pd?.data ?? {}) as Record<string, unknown>
      const existingWaitlists = (blob.waitlists as string[]) ?? []

      const { error: updateError } = await supabase
        .from("patient_details")
        .update({
          data: {
            ...blob,
            waitlists: [...existingWaitlists, waitlistType],
            waitlistMetadata: {
              ...((blob.waitlistMetadata as Record<string, unknown>) ?? {}),
              [waitlistType]: metadata,
            },
          },
        })
        .eq("id", pd.id)

      if (updateError) throw updateError

      return { message: "You have been added to the waitlist" }
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
    onError: (error: unknown) => {
      const err = error as { message?: string }
      toast({
        title: "Error",
        description: err.message || "Something went wrong",
        variant: "destructive",
      })
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{dialog.triggerLabel}</Button>
      </DialogTrigger>

      <DialogContent>
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
