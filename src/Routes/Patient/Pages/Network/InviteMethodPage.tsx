import { useNavigate, useLocation } from "react-router-dom"
import MobileWrapper, { BackTitleHeader } from "@/Routes/MobileWrapper"
import { ChevronRight, Plus } from "lucide-react"
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "@/components/Item"
import { Badge } from "@/components/Badge"
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
          <Plus
            className="text-primary"
            style={{ width: 42, height: 42 }}
            strokeWidth={1.5}
          />
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
        <Item asChild variant="muted">
          <button type="button" onClick={handleSMS}>
            <ItemMedia>
              <img
                src={textMessageIllustration}
                alt=""
                className="object-contain flex-shrink-0"
                style={{ width: 96, height: 84 }}
              />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Text message</ItemTitle>
              <ItemDescription>Works on any phone</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Badge variant="secondary">
                Send SMS
                <ChevronRight className="w-4 h-4" />
              </Badge>
            </ItemActions>
          </button>
        </Item>

        {/* Voice note */}
        <Item asChild variant="muted">
          <button type="button" onClick={handleVoice}>
            <ItemMedia>
              <img
                src={voiceNoteIllustration}
                alt=""
                className="flex-shrink-0 object-contain"
                style={{ width: 84, height: 84 }}
              />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Voice note</ItemTitle>
              <ItemDescription>
                Good if they&apos;re not on data bundles
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <Badge variant="secondary">
                Record
                <ChevronRight className="w-4 h-4" />
              </Badge>
            </ItemActions>
          </button>
        </Item>

        {/* QR code */}
        <Item asChild variant="muted">
          <button type="button" onClick={handleQR}>
            <ItemMedia>
              <img
                src={qrIllustration}
                alt=""
                className="object-contain flex-shrink-0"
                style={{ width: 124, height: 84 }}
              />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Show your QR code</ItemTitle>
              <ItemDescription>
                Let them scan your screen to join instantly
              </ItemDescription>
            </ItemContent>
          </button>
        </Item>
      </div>
    </MobileWrapper>
  )
}
