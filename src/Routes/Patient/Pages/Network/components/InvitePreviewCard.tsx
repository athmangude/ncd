import { Check, ChevronRight, Info, Pause, Play } from "lucide-react"
import { ProfileAvatar } from "@/components/ProfileAvatar"
import { cn } from "@/lib/utils"

// Static waveform bar heights (px) from Figma design node 92:22541
const WAVEFORM_BAR_HEIGHTS = [
  6.875, 23.125, 8.125, 6.875, 23.125, 19.375, 19.375, 20, 8.125, 6.875,
  15, 6.875, 19.375, 10.625, 6.875, 23.125, 8.125, 6.875, 23.125, 19.375,
  23.125, 19.375, 8.125, 6.875, 15, 6.875, 18.75,
]

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

type InvitePreviewCardProps = {
  senderName: string
  senderPhoto?: string
  inviteMethod: "text" | "voice"
  inviteMessage?: string
  recordingDuration?: number
  isPlaying?: boolean
  onTogglePlay?: () => void
}

export function InvitePreviewCard({
  senderName,
  senderPhoto,
  inviteMethod,
  inviteMessage,
  recordingDuration = 0,
  isPlaying = false,
  onTogglePlay,
}: InvitePreviewCardProps) {
  const [firstName, ...rest] = senderName.split(" ")
  const lastName = rest.join(" ")

  return (
    <div className="bg-card border border-border rounded-3xl px-4 py-4 flex flex-col items-center gap-3 w-[232px]">
      <ProfileAvatar
        src={senderPhoto}
        name={firstName}
        lastName={lastName}
        className="w-[84px] h-[84px]"
        fallbackClassName="text-2xl"
      />

      <div className="text-center">
        <p className="text-sm font-medium text-primary leading-snug tracking-tight">
          {senderName}
        </p>
        <p className="text-sm font-medium text-foreground leading-snug tracking-tight">
          has invited you to their circle
        </p>
      </div>

      <div className="flex items-center gap-1.5 bg-accent rounded-md px-2 py-1 shrink-0">
        <Info className="w-3 h-3 text-muted-foreground shrink-0" />
        <span className="text-[11.25px] text-foreground whitespace-nowrap">
          What is a Jireh Circle?
        </span>
        <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
      </div>

      {inviteMethod === "text" ? (
        <div className="w-full bg-muted border border-border rounded-bl-2xl rounded-br-2xl rounded-tr-2xl rounded-tl-sm px-2 py-1.5">
          <p className="text-[11.25px] text-foreground leading-relaxed">
            {inviteMessage}
          </p>
        </div>
      ) : (
        <div className="w-full flex items-center gap-1.5 border border-border rounded-full pl-1.5 pr-2.5 py-1.5">
          <button
            type="button"
            onClick={onTogglePlay}
            className="w-[30px] h-[30px] rounded-full bg-primary flex items-center justify-center shrink-0"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-[11px] h-[11px] text-white fill-current" />
            ) : (
              <Play className="w-[11px] h-[11px] text-white fill-current ml-0.5" />
            )}
          </button>
          <div className="flex-1 flex items-center justify-between">
            {WAVEFORM_BAR_HEIGHTS.map((height, i) => (
              <div
                key={i}
                className="w-[1.875px] rounded-full bg-purple-300 shrink-0"
                style={{ height: `${height}px` }}
              />
            ))}
          </div>
          <span className="text-[8.75px] font-medium text-muted-foreground whitespace-nowrap shrink-0">
            {formatTime(recordingDuration)}
          </span>
        </div>
      )}

      <div className="flex gap-1.5 w-full">
        <div className="flex-1 py-1.5 rounded-md bg-primary text-white text-[11.25px] font-semibold text-center">
          Accept
        </div>
        <div className="shrink-0 px-2.5 py-1.5 rounded-md bg-red-100 text-red-600 text-[11.25px] font-medium text-center">
          Decline
        </div>
      </div>
    </div>
  )
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

type StepState = "complete" | "active" | "inactive"

function StepBadge({ state, number }: { state: StepState; number: number }) {
  if (state === "complete") {
    return (
      <div className="w-6 h-6 rounded-full bg-purple-100 border border-primary flex items-center justify-center shrink-0">
        <Check className="w-3 h-3 text-primary stroke-[2.5]" />
      </div>
    )
  }
  if (state === "active") {
    return (
      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
        <span className="text-xs font-medium text-white leading-none">{number}</span>
      </div>
    )
  }
  return (
    <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
      <span className="text-xs font-medium text-foreground leading-none">{number}</span>
    </div>
  )
}

function Connector({ completed }: { completed: boolean }) {
  return (
    <div
      className={cn(
        "w-3 h-px shrink-0",
        completed ? "bg-primary" : "bg-border"
      )}
    />
  )
}

export function StepIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: number
  totalSteps: number
}) {
  return (
    <div className="flex items-center justify-center">
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNumber = i + 1
        const state: StepState =
          stepNumber < currentStep
            ? "complete"
            : stepNumber === currentStep
            ? "active"
            : "inactive"
        return (
          <div key={i} className="flex items-center">
            <StepBadge state={state} number={stepNumber} />
            {i < totalSteps - 1 && (
              <Connector completed={stepNumber < currentStep} />
            )}
          </div>
        )
      })}
    </div>
  )
}
