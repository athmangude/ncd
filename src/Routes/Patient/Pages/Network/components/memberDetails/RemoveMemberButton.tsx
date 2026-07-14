import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/Button"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { useToast } from "@/hooks/useToast"
import { trackEvent, EVENTS } from "@/analytics"
import {
  useRemoveConnection,
  type RemoveConnectionType,
} from "../../hooks/useRemoveConnection"
import { useCancelInvite } from "../../hooks/useCancelInvite"

type RemoveKind = "member" | "invite"

interface RemoveMemberButtonProps {
  kind: RemoveKind
  targetId: string
  name: string
  memberType?: RemoveConnectionType
}

export function RemoveMemberButton({
  kind,
  targetId,
  name,
  memberType = "NETWORK",
}: RemoveMemberButtonProps) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()
  const removeConnection = useRemoveConnection()
  const cancelInvite = useCancelInvite()

  const isPending = removeConnection.isPending || cancelInvite.isPending
  const offline = typeof navigator !== "undefined" && navigator.onLine === false

  const onConfirm = async () => {
    try {
      if (kind === "member") {
        await removeConnection.mutateAsync({
          connectionId: targetId,
          type: memberType,
        })
      } else {
        await cancelInvite.mutateAsync(targetId)
      }
      toast({
        title: "Success",
        description:
          kind === "member"
            ? `${name} was removed from your circle.`
            : `Invite to ${name} was removed.`,
      })
      trackEvent(EVENTS.CIRCLE.MEMBER_DETAILS_REMOVE, { kind })
      setOpen(false)
      navigate(-1)
    } catch (err) {
      const error = err as {
        response?: { data?: { message?: string } }
        message?: string
      }
      toast({
        title: "Error",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to remove",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <Button
        variant="destructive"
        className="w-full"
        onClick={() => setOpen(true)}
        disabled={offline}
      >
        Remove from your Circle
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={onConfirm}
        title={
          kind === "invite"
            ? `Delete invite to ${name}?`
            : `Remove ${name} from your circle?`
        }
        description={
          kind === "invite"
            ? "Their slot will reopen so you can invite someone else."
            : "This action cannot be undone."
        }
        confirmLabel={
          kind === "invite" ? "Cancel Invite" : "Remove from my circle"
        }
        variant="destructive"
        isLoading={isPending}
      />
    </>
  )
}
