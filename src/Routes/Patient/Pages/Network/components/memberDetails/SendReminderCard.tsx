import { ChevronRight } from "lucide-react"
import { Chip } from "@/components/Chip"
import { useToast } from "@/hooks/useToast"
import { trackEvent, EVENTS } from "@/analytics"
import { useSendInviteReminder } from "../../hooks/useSendInviteReminder"
import sendReminderIllustration from "@/assets/images/circle-send-reminder.png"

interface SendReminderCardProps {
  inviteId: string
}

export function SendReminderCard({ inviteId }: SendReminderCardProps) {
  const { toast } = useToast()
  const reminder = useSendInviteReminder()
  const offline = typeof navigator !== "undefined" && navigator.onLine === false

  const onSend = async () => {
    try {
      await reminder.mutateAsync(inviteId)
      toast({
        title: "Reminder sent",
        description: "We just nudged them via SMS.",
      })
      trackEvent(EVENTS.CIRCLE.MEMBER_DETAILS_REMINDER_SENT)
    } catch (err) {
      const error = err as { message?: string }
      toast({
        title: "Couldn't send reminder",
        description: error?.message || "Try again in a moment.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex items-center gap-4 rounded-md bg-purple-50 px-4 py-2.5">
      <div className="flex flex-1 flex-col gap-3">
        <div>
          <p className="text-base font-medium leading-6 text-foreground">
            Send a reminder
          </p>
          <p className="text-sm text-muted-foreground">
            Create or edit your SMS
          </p>
        </div>
        <Chip
          onClick={onSend}
          disabled={reminder.isPending || offline}
          className="self-start"
        >
          Send SMS
          <ChevronRight className="h-4 w-4" />
        </Chip>
      </div>
      <img
        src={sendReminderIllustration}
        alt=""
        aria-hidden
        className="h-[84px] w-[84px] shrink-0 object-contain"
      />
    </div>
  )
}
