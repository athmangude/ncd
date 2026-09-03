import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/Button"
import PatientPageWrapper from "../PatientPageWrapper"
import { usePatientAuthStore } from "../../stores/patientAuthStore"
import { useMutation } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
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

  const pendingData = getFromLocalStorage(
    PENDING_INVITE_KEY
  ) as PendingInvite | null
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
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id
      if (!userId) throw new Error("Not authenticated")

      const ext = file.name.split(".").pop() || "jpg"
      const path = `${userId}/profile.${ext}`
      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(path)

      return { profilePhoto: urlData.publicUrl }
    },
    onSuccess: (data) => {
      if (data.profilePhoto) {
        const freshUrl = `${data.profilePhoto}?cb=${Date.now()}`
        setUser({ ...user, profilePhoto: freshUrl })
        const img = new Image()
        img.src = freshUrl
      }
      navigate("/patients/network/preview-invite", {
        state: { ...location.state, tempProfilePhoto: previewUrl },
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload photo",
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
    <PatientPageWrapper
      variant="content"
      barTitle="Preview invite"
      headerAlign="start"
      pageTitle={`Let ${inviteeName} know it's you`}
      description="Add a photo so they recognise your invite straight away."
      onBack={handleBack}
      footer={
        <div className="p-4 bg-card border-t border-border">
          <div className="flex flex-col gap-2">
            <Button variant="outline" className="w-full" onClick={handleSkip}>
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
      }
    >
      <div className="flex flex-col gap-6">
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
          <div className="bg-card rounded-xl border border-border p-2 pr-4 flex items-center gap-3">
            <ProfileAvatar
              src={previewUrl}
              name={selectedFile.name}
              className="w-12 h-12 rounded-lg bg-muted"
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground truncate text-sm">
                {selectedFile.name}
              </div>
              <div className="text-sm text-muted-foreground">
                Ready to upload
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemoveFile}
              aria-label="Remove file"
            >
              <Trash2 className="w-5 h-5 text-red-500" />
            </Button>
          </div>
        )}
      </div>
    </PatientPageWrapper>
  )
}
