import { useState, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/Button"
import { ProfileAvatar } from "@/components/ProfileAvatar"
import PatientPageWrapper from "../PatientPageWrapper"
import { usePatientAuthStore } from "../../stores/patientAuthStore"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { useToast } from "@/hooks/useToast"
import { ArrowRight, ChevronRight, Phone, UserRoundPlus } from "lucide-react"
import referEarnIcon from "@/assets/icons/refer-earn-center-icon.png"
import {
  getFromLocalStorage,
  removeFromLocalStorage,
} from "@/utilities/localStorage"
import { PENDING_INVITE_KEY } from "./InviteMethodPage"
import { patientTreatmentDetailsStorageKey } from "@/Routes/Patient/Pages/Loans/RequestLoan/PatientTreatmentDetails"
import { invalidateCircleQueries } from "@/Routes/Patient/hooks/useCircleSync"
import { InvitePreviewCard } from "./components/InvitePreviewCard"

// eslint-disable-next-line react-refresh/only-export-components
export function resolveReturnPath(state: unknown): string {
  const s = (state ?? {}) as { returnPath?: string }
  return s.returnPath || "/patients"
}

export default function PreviewInvitePage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const location = useLocation()
  const user = usePatientAuthStore((state: any) => state.user)
  const queryClient = useQueryClient()

  const [inviteSent, setInviteSent] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null)

  const tempProfilePhoto = location.state?.tempProfilePhoto
  const displayPhoto = tempProfilePhoto || user?.profilePhoto

  const [pendingInvite] = useState(() =>
    getFromLocalStorage(PENDING_INVITE_KEY)
  )
  const inviteMessage = pendingInvite?.inviteMessage || "Join my Jireh Circle!"
  const isVoice = pendingInvite?.inviteMethod === "voice"
  const storedAudioUrl = pendingInvite?.audioUrl as string | undefined
  const recordingDuration = (pendingInvite?.recordingDuration as number) ?? 0
  const inviteeName = pendingInvite?.firstName || "them"
  const senderName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim()

  const togglePlayback = () => {
    if (!audioPlayerRef.current) return
    if (isPlaying) {
      audioPlayerRef.current.pause()
      setIsPlaying(false)
    } else {
      audioPlayerRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleShare = async (inviteLink: string) => {
    const shareData = {
      title: "Join my Jireh Circle",
      text: inviteMessage,
      url: inviteLink,
    }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // user cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(inviteLink)
        toast({
          title: "Link Copied",
          description: "Invite link copied to clipboard",
        })
      } catch {
        toast({
          title: "Error",
          description: "Failed to copy link",
          variant: "destructive",
        })
      }
    }
  }

  const afterSendSuccess = (data: any) => {
    toast({
      title: "Success",
      description: data.message || "Invite sent successfully",
    })
    removeFromLocalStorage(PENDING_INVITE_KEY)
    queryClient.invalidateQueries({
      queryKey: [patientTreatmentDetailsStorageKey],
    })
    invalidateCircleQueries(queryClient)
    const link =
      data.inviteLink ||
      import.meta.env.VITE_APP_DOMAIN +
        "/patients/network/invite/" +
        data.inviteId ||
      data.link
    setInviteSent(true)
    if (link) handleShare(link)
  }

  const textInviteMutation = useMutation({
    mutationFn: async () => {
      if (!pendingInvite) throw new Error("No invite details found")
      const {
        inviteMessage: customMessage,
        audioUrl: _au,
        recordingDuration: _rd,
        inviteMethod: _im,
        ...rest
      } = pendingInvite
      const response = await axios.post(
        import.meta.env.VITE_SUPERTOKENS_API_DOMAIN +
          "/patient-network/send-invite",
        { ...rest, customMessage }
      )
      return response.data
    },
    onSuccess: afterSendSuccess,
    onError: (error: any) => {
      toast({
        title: "Invite Failed",
        description: error.response?.data?.message || "Failed to send invite",
        variant: "destructive",
      })
    },
  })

  const voiceInviteMutation = useMutation({
    mutationFn: async () => {
      if (!pendingInvite || !storedAudioUrl)
        throw new Error("No invite details found")
      const blobResponse = await fetch(storedAudioUrl)
      const audioBlob = await blobResponse.blob()
      URL.revokeObjectURL(storedAudioUrl)
      const formData = new FormData()
      formData.append("voiceNote", audioBlob, "voice-invite.webm")
      formData.append("firstName", pendingInvite.firstName || "")
      formData.append("lastName", pendingInvite.lastName || "")
      formData.append("phoneNumber", pendingInvite.phoneNumber || "")
      formData.append("relationship", pendingInvite.relationship || "")
      formData.append("durationSeconds", String(recordingDuration))
      const response = await axios.post(
        import.meta.env.VITE_SUPERTOKENS_API_DOMAIN + "/circles/invites/voice",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      )
      return response.data
    },
    onSuccess: afterSendSuccess,
    onError: (error: any) => {
      toast({
        title: "Invite Failed",
        description: error.response?.data?.message || "Failed to send invite",
        variant: "destructive",
      })
    },
  })

  const handleSendInvite = () => {
    if (isVoice) {
      voiceInviteMutation.mutate()
    } else {
      textInviteMutation.mutate()
    }
  }

  const isLoading =
    textInviteMutation.isPending || voiceInviteMutation.isPending

  const handleBackToDashboard = () => {
    navigate(resolveReturnPath(location.state))
  }

  if (inviteSent) {
    const inviteeFirstName = pendingInvite?.firstName || ""
    const inviteeLastName = pendingInvite?.lastName || ""
    const inviteeInitials =
      (
        (inviteeFirstName[0] || "") + (inviteeLastName[0] || "")
      ).toUpperCase() || "?"
    const phoneNumber = pendingInvite?.phoneNumber || ""

    return (
      <PatientPageWrapper
        title="Invite sent!"
        showHelp={false}
        className="min-h-full items-center justify-center"
        footer={
          <div className="p-4 bg-white border-t border-border">
            <Button
              variant="outline"
              className="w-full border-border text-foreground"
              onClick={handleBackToDashboard}
            >
              Back to dashboard
            </Button>
          </div>
        }
      >
        <div className="flex flex-col items-center gap-6 w-full">
          <div className="flex items-center gap-[17px]">
            <ProfileAvatar
              src={displayPhoto}
              name={senderName}
              className="w-[90px] h-[90px] border-[3px] border-[#dfacff]"
              fallbackClassName="text-2xl"
            />
            <img
              src={referEarnIcon}
              alt=""
              aria-hidden
              className="w-[47px] h-[26px] object-contain shrink-0"
            />
            <div className="w-[90px] h-[90px] rounded-full border-[3px] border-[#dfacff] bg-white flex items-center justify-center shrink-0">
              <span className="text-[31.5px] font-normal text-[#404040]">
                {inviteeInitials}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 text-center">
            <h2 className="text-foreground">
              Invite sent to{" "}
              <span className="text-primary">{inviteeName}</span>.
            </h2>
            <p className="text-sm text-muted-foreground">
              You will get a notification when they accept.
            </p>
          </div>

          {phoneNumber && (
            <div className="w-full border border-border rounded-lg">
              <div className="flex items-start gap-2 px-2.5 py-2">
                <UserRoundPlus className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    People accept faster when they hear from you directly.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Send {inviteeName} a quick message to say it&apos;s coming.
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              </div>
              <div className="flex items-center px-2 py-2 pl-9 gap-1">
                <a
                  href={`sms:${phoneNumber}`}
                  className="px-2 h-6 flex items-center text-sm font-medium text-foreground rounded hover:bg-muted"
                >
                  Send SMS
                </a>
                <div className="w-px h-4 bg-border" />
                <a
                  href={`tel:${phoneNumber}`}
                  className="flex items-center gap-1 px-2 h-6 text-sm font-medium text-secondary-foreground bg-secondary rounded"
                >
                  Call now
                  <Phone className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </PatientPageWrapper>
    )
  }

  return (
    <PatientPageWrapper
      title="Preview invite"
      showHelp={false}
      footer={
        <div className="p-4 bg-white border-t border-border">
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full border-border text-foreground"
              onClick={() =>
                navigate("/patients/network/check-profile-photo", {
                  state: { ...location.state, fromPreview: true },
                })
              }
            >
              Change photo
            </Button>
            <Button
              className="w-full"
              onClick={handleSendInvite}
              disabled={isLoading}
              isLoading={isLoading}
            >
              Send invite
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-foreground leading-snug">
            This is what {inviteeName} will see
          </h2>
          <p className="text-sm text-muted-foreground">
            Check it looks right before you send.
          </p>
        </div>

        <div className="flex justify-center">
          <InvitePreviewCard
            senderName={senderName}
            senderPhoto={displayPhoto}
            inviteMethod={isVoice ? "voice" : "text"}
            inviteMessage={inviteMessage}
            recordingDuration={recordingDuration}
            isPlaying={isPlaying}
            onTogglePlay={togglePlayback}
          />
        </div>

        {storedAudioUrl && (
          <audio
            ref={audioPlayerRef}
            src={storedAudioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        )}
      </div>
    </PatientPageWrapper>
  )
}
