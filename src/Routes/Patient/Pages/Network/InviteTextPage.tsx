import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/Button"
import { Textarea } from "@/components/Textarea"
import PatientPageWrapper from "../PatientPageWrapper"
import {
  getFromLocalStorage,
  setToLocalStorage,
} from "@/utilities/localStorage"
import { PENDING_INVITE_KEY } from "./InviteMethodPage"
import { useToast } from "@/hooks/useToast"
import { usePatientAuthStore } from "../../stores/patientAuthStore"
import { resolveReturnPath } from "./PreviewInvitePage"

export default function InviteTextPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const user = usePatientAuthStore((state: any) => state.user)
  const location = useLocation()

  const [message, setMessage] = useState(() => {
    const existingData = getFromLocalStorage(PENDING_INVITE_KEY)
    return existingData?.inviteMessage || ""
  })

  const MAX_CHARS = 140

  const handleContinue = () => {
    if (message.length === 0) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      })
      return
    }

    if (message.length > MAX_CHARS) {
      toast({
        title: "Error",
        description: `Message is too long. Please limit to ${MAX_CHARS} characters.`,
        variant: "destructive",
      })
      return
    }

    const existingData = getFromLocalStorage(PENDING_INVITE_KEY) || {}
    setToLocalStorage(PENDING_INVITE_KEY, {
      ...existingData,
      inviteMessage: message,
    })

    if (user?.profilePhoto) {
      navigate("/patients/network/preview-invite", {
        state: { ...location.state },
      })
    } else {
      navigate("/patients/network/check-profile-photo", {
        state: { ...location.state },
      })
    }
  }

  const handleBack = () => {
    if (location.state?.returnPath) {
      navigate(resolveReturnPath(location.state))
      return
    }
    navigate(-1)
  }

  return (
    <PatientPageWrapper
      title="Invite by SMS"
      onBack={handleBack}
      footer={
        <div className="p-4 bg-card border-t border-border">
          <Button
            className="w-full"
            onClick={handleContinue}
            disabled={message.length === 0 || message.length > MAX_CHARS}
          >
            Preview your invite
          </Button>
        </div>
      }
    >
      <div className="flex flex-col">
        <div className="flex flex-col mb-8">
          <h2 className="text-foreground mb-1">Write up to 140 characters</h2>
          <p className="text-muted-foreground text-sm">
            e.g. &ldquo;This is for managing Mom&apos;s care&rdquo;.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">
            Text Message
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder=""
            className="min-h-[80px] p-3 text-base rounded-sm border-border focus:border-purple-500 focus:ring-purple-500"
          />
          <div className="text-left text-xs text-muted-foreground">
            {message.length}/{MAX_CHARS} characters
          </div>
        </div>
      </div>
    </PatientPageWrapper>
  )
}
