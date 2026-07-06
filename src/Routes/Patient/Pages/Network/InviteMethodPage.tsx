import { useNavigate, useLocation } from "react-router-dom"
import MobileWrapper, { BackTitleHeader } from "@/Routes/MobileWrapper"
import { ChevronRight, Plus } from "lucide-react"
import textMessageIllustration from "@/assets/icons/invite-text-message.png"
import voiceNoteIllustration from "@/assets/icons/invite-voice-note.png"
import qrIllustration from "@/assets/icons/invite-qr-code.png"

export const PENDING_INVITE_KEY = "patient-network-pending-invite"

type LocationState = {
  source?: "onboarding" | "network"
  returnPath?: string
  [key: string]: unknown
}

export default function InviteMethodPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const currentState = (location.state || {}) as LocationState

  const handleSMS = () => {
    navigate("/patients/network/invite-info", {
      state: { ...currentState, inviteMethod: "text" },
    })
  }

  const handleVoice = () => {
    navigate("/patients/network/invite-info", {
      state: { ...currentState, inviteMethod: "voice" },
    })
  }

  const handleQR = () => {
    navigate("/patients/scan-qr-intro", { state: currentState })
  }

  return (
    <MobileWrapper
      header={
        <BackTitleHeader title="Send invite" onBack={() => navigate(-1)} />
      }
      footer={null}
    >
      {/* Drawer-style header */}
      <div className="flex flex-col items-center gap-3 pt-2 pb-6">
        <div
          className="rounded-full border-[3.5px] border-dashed border-[#efd0ff] bg-secondary flex items-center justify-center flex-shrink-0"
          style={{ width: 84, height: 84 }}
        >
          <Plus className="text-primary" style={{ width: 42, height: 42 }} strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <h1>Send a personal message</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choose people who&apos;ll say yes
          </p>
        </div>
      </div>

      {/* Method cards */}
      <div className="flex flex-col gap-2">
        {/* Text message */}
        <button
          type="button"
          onClick={handleSMS}
          className="w-full bg-muted rounded-lg px-4 py-[10px] flex items-center gap-4 text-left hover:bg-secondary transition-colors"
        >
          <img
            src={textMessageIllustration}
            alt=""
            className="object-contain flex-shrink-0"
            style={{ width: 96, height: 84 }}
          />
          <div className="flex flex-col justify-between flex-1 self-stretch min-w-0">
            <div>
              <p className="text-sm font-medium text-foreground">Text message</p>
              <p className="text-sm text-muted-foreground">Works on any phone</p>
            </div>
            <div className="flex items-center gap-1.5 bg-secondary px-2 h-6 rounded self-start">
              <span className="text-sm font-medium text-secondary-foreground">Send SMS</span>
              <ChevronRight className="w-4 h-4 text-secondary-foreground" />
            </div>
          </div>
        </button>

        {/* Voice note */}
        <button
          type="button"
          onClick={handleVoice}
          className="w-full bg-muted rounded-lg px-4 py-[10px] flex items-center gap-[10px] text-left hover:bg-secondary transition-colors"
        >
          <div className="flex flex-col justify-between flex-1 self-stretch min-w-0">
            <div>
              <p className="text-sm font-medium text-foreground">Voice note</p>
              <p className="text-sm text-muted-foreground">
                Good if they&apos;re not on data bundles
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-secondary px-2 h-6 rounded self-start">
              <span className="text-sm font-medium text-secondary-foreground">Record</span>
              <ChevronRight className="w-4 h-4 text-secondary-foreground" />
            </div>
          </div>
          <img
            src={voiceNoteIllustration}
            alt=""
            className="flex-shrink-0 object-contain"
            style={{ width: 84, height: 84 }}
          />
        </button>

        {/* QR code */}
        <button
          type="button"
          onClick={handleQR}
          className="w-full bg-muted rounded-lg px-[10px] py-2 flex items-center gap-3 text-left hover:bg-secondary transition-colors"
        >
          <img
            src={qrIllustration}
            alt=""
            className="object-contain flex-shrink-0"
            style={{ width: 124, height: 84 }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Show your QR code</p>
            <p className="text-sm text-muted-foreground">
              Let them scan your screen to join instantly
            </p>
          </div>
        </button>
      </div>
    </MobileWrapper>
  )
}
