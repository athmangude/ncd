import { Button } from "@/components/Button"
import { Mic, Square, Play, Pause } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import {
  getFromLocalStorage,
  setToLocalStorage,
} from "@/utilities/localStorage"
import { PENDING_INVITE_KEY } from "./InviteMethodPage"
import PatientPageWrapper from "../PatientPageWrapper"
import { useNavigate, useLocation } from "react-router-dom"
import { useToast } from "@/hooks/useToast"
import { resolveReturnPath } from "./PreviewInvitePage"

type RecordingState = "idle" | "recording" | "review"
type MicPermission = "prompt" | "granted" | "denied"

export default function InviteVoicePage() {
  const { toast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()

  const [recordingState, setRecordingState] = useState<RecordingState>("idle")
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackTime, setPlaybackTime] = useState(0)
  const [micPermission, setMicPermission] = useState<MicPermission>("prompt")
  const [micRequesting, setMicRequesting] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null)
  const startTimeRef = useRef<number>(0)
  // Prevents the cleanup from revoking a URL we've handed to the next step
  const pendingHandoff = useRef(false)

  const MAX_DURATION = 15

  useEffect(() => {
    if (micPermission === "prompt" && !micRequesting) {
      requestMicPermission()
    }
    // requestMicPermission is a hook-returned function; including it would re-trigger on identity churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [micPermission, micRequesting])

  useEffect(() => {
    return () => {
      if (audioUrl && !pendingHandoff.current) {
        URL.revokeObjectURL(audioUrl)
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [audioUrl])

  const resetState = () => {
    setRecordingState("idle")
    setRecordingTime(0)
    if (audioUrl && !pendingHandoff.current) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioUrl(null)
    setIsPlaying(false)
    setPlaybackTime(0)
    audioChunksRef.current = []
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  const requestMicPermission = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast({
        title: "Error",
        description: "Microphone access is not supported in this browser.",
        variant: "destructive",
      })
      setMicPermission("denied")
      return
    }
    setMicRequesting(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
      setMicPermission("granted")
    } catch {
      setMicPermission("denied")
      toast({
        title: "Error",
        description:
          "Could not access microphone. Please ensure you have granted permission.",
        variant: "destructive",
      })
    } finally {
      setMicRequesting(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        setRecordingState("review")
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setRecordingState("recording")
      startTimeRef.current = Date.now()

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setRecordingTime(elapsed)
        if (elapsed >= MAX_DURATION) {
          stopRecording()
        }
      }, 100)
    } catch {
      toast({
        title: "Error",
        description:
          "Could not access microphone. Please ensure you have granted permission.",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop()
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

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

  const handleAudioEnded = () => {
    setIsPlaying(false)
    setPlaybackTime(0)
  }

  const handleTimeUpdate = () => {
    if (audioPlayerRef.current) {
      setPlaybackTime(audioPlayerRef.current.currentTime)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handlePreview = () => {
    if (!audioUrl) return
    // Store the blob URL and duration in localStorage for use by CheckProfilePhotoPage
    // and PreviewInvitePage. Mark handoff so cleanup does NOT revoke this URL.
    pendingHandoff.current = true
    const existingData = getFromLocalStorage(PENDING_INVITE_KEY) || {}
    setToLocalStorage(PENDING_INVITE_KEY, {
      ...existingData,
      audioUrl,
      recordingDuration: recordingTime,
    })
    navigate("/patients/network/check-profile-photo", {
      state: { ...location.state },
    })
  }

  const renderVisualizer = (isReview = false) => {
    const bars = isReview ? 30 : 20
    return (
      <div
        className={`flex items-center gap-0.5 ${isReview ? "h-8" : "h-10"} w-full`}
      >
        {Array.from({ length: bars }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 rounded-full ${
              isReview
                ? i / bars < playbackTime / (recordingTime || 1)
                  ? "bg-purple-500"
                  : "bg-purple-200"
                : "bg-purple-300 animate-pulse"
            }`}
            style={{
              height: `${Math.max(20, Math.sin(i * 0.6) * 50 + 50)}%`,
              animationDelay: isReview ? "0s" : `${i * 0.05}s`,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <PatientPageWrapper
      title="Invite by voice note"
      onBack={() => {
        if (location.state?.returnPath) {
          navigate(resolveReturnPath(location.state))
          return
        }
        navigate(-1)
      }}
    >
      <div className="flex flex-col h-full">
        {/* Step heading */}
        <div className="flex flex-col px-4 pt-2 mb-6">
          <h2 className="text-foreground mb-1">
            Tap to start recording up to {MAX_DURATION} seconds.
          </h2>
          <p className="text-muted-foreground text-sm">
            e.g. &ldquo;This is for managing Mom&apos;s care&rdquo;.
          </p>
        </div>

        {/* Controls */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-6">
          {recordingState === "idle" && (
            <Button
              type="button"
              size="icon-lg"
              onClick={startRecording}
              disabled={micRequesting}
              aria-label="Start recording"
            >
              <Mic className="w-7 h-7" />
            </Button>
          )}

          {recordingState === "recording" && (
            <div className="w-full max-w-md flex flex-col items-center gap-3">
              <div className="w-full bg-card rounded-full px-4 py-2 flex items-center gap-3 border border-border shadow-sm">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="flex-shrink-0"
                  onClick={stopRecording}
                  aria-label="Stop recording"
                >
                  <Square className="w-5 h-5 fill-current" />
                </Button>
                <div className="flex-1 flex items-center h-8 overflow-hidden">
                  {renderVisualizer()}
                </div>
                <span className="text-xs font-mono text-muted-foreground w-10 text-right flex-shrink-0">
                  {formatTime(recordingTime)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                You are recording...
              </p>
            </div>
          )}

          {recordingState === "review" && (
            <div className="w-full max-w-md flex flex-col items-center gap-4">
              <div className="w-full bg-card rounded-full px-4 py-2 flex items-center gap-3 border border-border shadow-sm">
                <Button
                  type="button"
                  size="icon"
                  className="flex-shrink-0"
                  onClick={togglePlayback}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </Button>
                <div className="flex-1 flex items-center h-8 overflow-hidden">
                  {renderVisualizer(true)}
                </div>
                <span className="text-xs font-mono text-muted-foreground w-10 text-right flex-shrink-0">
                  {formatTime(recordingTime)}
                </span>
              </div>
              <audio
                ref={audioPlayerRef}
                src={audioUrl || ""}
                onEnded={handleAudioEnded}
                onTimeUpdate={handleTimeUpdate}
                className="hidden"
              />
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={resetState}
              >
                Re-record
              </Button>
            </div>
          )}
        </div>

        {/* Fixed bottom button */}
        <div className="p-4">
          <Button
            className="w-full"
            disabled={recordingState !== "review"}
            onClick={handlePreview}
          >
            Preview your invite
          </Button>
        </div>
      </div>
    </PatientPageWrapper>
  )
}
