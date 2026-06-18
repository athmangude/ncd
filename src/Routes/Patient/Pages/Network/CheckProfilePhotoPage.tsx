import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/Button"
import PatientPageWrapper from "../PatientPageWrapper"
import { usePatientAuthStore } from "../../stores/patientAuthStore"
import { useMutation } from "@tanstack/react-query"
import axios from "axios"
import { useToast } from "@/hooks/useToast"
import { Trash2 } from "lucide-react"
import { Input } from "@/components/Input"
import { ProfileAvatar } from "@/components/ProfileAvatar"
import { getFromLocalStorage } from "@/utilities/localStorage"
import { PENDING_INVITE_KEY } from "./InviteMethodPage"
import { InvitePreviewCard } from "./components/InvitePreviewCard"
import { resolveReturnPath } from "./PreviewInvitePage"

type PendingInvite = {
  firstName?: string
  lastName?: string
  inviteMethod?: "text" | "voice"
  inviteMessage?: string
  recordingDuration?: number
}

export default function CheckProfilePhotoPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const fromPreview = !!location.state?.fromPreview
  const { toast } = useToast()
  const user = usePatientAuthStore((state: any) => state.user)
  const setUser = usePatientAuthStore((state: any) => state.setUser)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const hasProfilePhoto = !!user?.profilePhoto

  const pendingData = getFromLocalStorage(PENDING_INVITE_KEY) as PendingInvite | null
  const inviteeName = pendingData?.firstName || "them"
  const inviteMethod = pendingData?.inviteMethod === "voice" ? "voice" : "text"
  const recordingDuration = pendingData?.recordingDuration ?? 0
  const inviteMessage = pendingData?.inviteMessage || ""

  const displayPhoto = previewUrl || user?.profilePhoto
  const senderName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim()

  useEffect(() => {
    if (hasProfilePhoto && !fromPreview) {
      navigate("/patients/network/preview-invite", { replace: true })
    }
  }, [hasProfilePhoto, fromPreview, navigate])

  const handleBack = () => {
    if (location.state?.returnPath) {
      navigate(resolveReturnPath(location.state))
      return
    }
    navigate(-1)
  }

  const handleSkip = () => {
    navigate("/patients/network/preview-invite", {
      state: { ...location.state },
    })
  }

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)
      const response = await axios.post(
        import.meta.env.VITE_API_BASE_URL + "/patients/upload-profile-photo",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      )
      return response.data
    },
    onSuccess: (data) => {
      if (data.profilePhoto) {
        // Append a cache-busting param so ProfileAvatar detects a new src and
        // re-fetches immediately, bypassing the browser's cached old image.
        const freshUrl = `${data.profilePhoto}?cb=${Date.now()}`
        setUser({ ...user, profilePhoto: freshUrl })
        // Pre-warm the image so it's ready before PreviewInvitePage renders.
        const img = new Image()
        img.src = freshUrl
      }
      navigate("/patients/network/preview-invite", {
        state: { ...location.state, tempProfilePhoto: previewUrl },
      })
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.response?.data?.message || "Failed to upload photo",
        variant: "destructive",
      })
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: "destructive",
      })
      return
    }
    const validTypes = ["image/jpeg", "image/png", "image/jpg"]
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Only JPG, JPEG and PNG files are allowed",
        variant: "destructive",
      })
      return
    }
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setPreviewUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  const handleAddPhoto = () => {
    if (selectedFile) {
      uploadPhotoMutation.mutate(selectedFile)
    }
  }

  const isLoading = uploadPhotoMutation.isPending

  return (
    <PatientPageWrapper title="Preview invite" onBack={handleBack}>
      <div className="flex flex-col h-full max-w-md mx-auto w-full">
        <div className="flex flex-col gap-6 px-4 flex-1 overflow-y-auto pb-32">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-medium text-neutral-900 tracking-tight leading-snug">
              Let {inviteeName} know it&apos;s you
            </h2>
            <p className="text-sm text-neutral-600">
              Add a photo so they recognise your invite straight away.
            </p>
          </div>

          <div className="flex justify-center">
            <InvitePreviewCard
              senderName={senderName}
              senderPhoto={displayPhoto}
              inviteMethod={inviteMethod}
              inviteMessage={inviteMessage}
              recordingDuration={recordingDuration}
            />
          </div>

          {selectedFile && previewUrl && (
            <div className="bg-white rounded-xl border border-neutral-200 p-2 pr-4 flex items-center gap-3">
              <ProfileAvatar
                src={previewUrl}
                name={selectedFile.name}
                className="w-12 h-12 rounded-lg bg-neutral-100"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-neutral-900 truncate text-sm">
                  {selectedFile.name}
                </div>
                <div className="text-sm text-neutral-500">Ready to upload</div>
              </div>
              <button
                onClick={handleRemoveFile}
                className="p-2 hover:bg-red-50 rounded-full transition-colors group"
              >
                <Trash2 className="w-5 h-5 text-red-500 group-hover:text-red-600" />
              </button>
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-neutral-100 z-50">
          <div className="max-w-md mx-auto flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full border-neutral-200 text-neutral-800"
              onClick={handleSkip}
            >
              Skip for now
            </Button>
            {selectedFile ? (
              <Button
                className="w-full"
                onClick={handleAddPhoto}
                disabled={isLoading}
                isLoading={isLoading}
              >
                Add profile photo
              </Button>
            ) : (
              <div className="relative">
                <Button className="w-full pointer-events-none">
                  Add profile photo
                </Button>
                <Input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full font-sans"
                  onChange={handleFileChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </PatientPageWrapper>
  )
}
