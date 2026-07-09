import { useRef, useState, useEffect } from "react"
import { version } from "../../../../../package.json"
import { useNavigate } from "react-router-dom"
import { usePatientAuthStore } from "@/Routes/Patient/stores/patientAuthStore"
import { usePatientLoginDetails } from "@/hooks/usePatientLoginDetails"
import { trackEvent, EVENTS } from "@/analytics"
import { ProfileAvatar } from "@/components/ProfileAvatar"
import { Button } from "@/components/Button"
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "@/components/Item"
import LoadingPage from "@/Routes/LoadingPage"
import Loader from "@/components/Loader"
import ErrorBlock from "@/components/ErrorBlock"
import {
  ShieldCheck,
  HelpCircle,
  ChevronRight,
  Camera,
  History,
  Share2,
  Upload,
  Wrench,
} from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { useToast } from "@/hooks/useToast"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/Drawer"

import { Skeleton } from "@/components/Skeleton"

export default function PatientProfile() {
  const { data: user, isLoading, error, refetch } = usePatientLoginDetails()
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isSignOutOpen, setIsSignOutOpen] = useState(false)
  const signOut = usePatientAuthStore((state: any) => state.signOut)
  const setUser = usePatientAuthStore((state: any) => state.setUser)
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Track page view on mount
  useEffect(() => {
    try {
      trackEvent(EVENTS.PROFILE.VIEW)
    } catch {
      // Silent fail
    }
  }, [])

  const maskPhoneNumber = (phone: string) => {
    if (!phone) return ""
    if (phone.length < 8) return phone

    // Show first 4, mask middle, show last 3
    const visibleStart = 4
    const visibleEnd = 3
    const start = phone.slice(0, visibleStart)
    const end = phone.slice(-visibleEnd)
    // Dynamic mask length based on actual phone length
    // e.g. +254 710 617 776 (13 chars) -> +254 ****** 776
    return `${start}******${end}`
  }

  // Sign out is the only path back to a fresh, unseeded participant: it wipes all
  // of this participant's data (see patientAuthStore.signOut) and returns to the
  // phone-number entry. Confirmed first so a session is never lost by accident.
  const handleSignOut = () => {
    try {
      trackEvent(EVENTS.PROFILE.LOGOUT)
    } catch {
      // Silent fail
    }
    setIsSignOutOpen(false)
    signOut()
    navigate("/patients/auth")
  }

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)

      const response = await axios.post(
        import.meta.env.VITE_API_BASE_URL + "/patients/upload-profile-photo",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      )
      return response.data
    },
    onSuccess: (data) => {
      const photoUrl = data.url || data.profilePhoto
      if (photoUrl) {
        // Update local store
        setUser({ ...user, profilePhoto: photoUrl })

        // Update local state for immediate display
        setUploadedPhoto(photoUrl)

        // Close drawer
        setIsDrawerOpen(false)

        // Invalidate query to refetch (optional if not using react-query for this data)
        queryClient.invalidateQueries({ queryKey: ["patientLoginDetails"] })

        // Manually refetch to update data
        refetch()

        toast({
          title: "Success",
          description: "Profile photo updated successfully",
        })
      }
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
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
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

      uploadPhotoMutation.mutate(file)
    }
  }

  const menuOptions = [
    {
      title: "Payment History",
      description: "View your treatments/invoices",
      icon: <History className="h-5 w-5 text-muted-foreground" />,
      onClick: () => navigate("/patients/payments"),
    },
    {
      title: "Security & Permissions",
      description: "Change PIN and allow permissions",
      icon: <ShieldCheck className="h-5 w-5 text-muted-foreground" />,
      onClick: () => navigate("/patients/security-and-permissions"),
    },
    {
      title: "Help & Support",
      description: "Reach out to us for any queries or read FAQs",
      icon: <HelpCircle className="h-5 w-5 text-muted-foreground" />,
      onClick: () => navigate("/patients/help-and-support"),
    },
    {
      title: "Refer & Earn",
      description: "Share Jireh with friends and get rewarded",
      icon: <Share2 className="h-5 w-5 text-muted-foreground" />,
      onClick: () => navigate("/patients/referral-and-earn"),
    },
    {
      title: "Facilitator Tools",
      description: "Edit balances, approvals and circle (researcher only)",
      icon: <Wrench className="h-5 w-5 text-muted-foreground" />,
      onClick: () => navigate("/facilitator"),
    },
  ]

  if (isLoading && !user) {
    return (
      <div className="flex flex-col gap-5">
        {/* User Info Skeleton */}
        <div className="flex flex-row items-center gap-4 py-2">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        {/* Menu Options Skeleton */}
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>

        {/* Sign Out Skeleton */}
        <Skeleton className="h-12 w-full rounded-xl mt-2" />
      </div>
    )
  }
  if (error) return <ErrorBlock message="Failed to load profile" />
  // If no user but not loading/error, theoretically shouldn't happen if auth is required, but handle it
  if (!user) return <LoadingPage />
  return (
    <div className="flex flex-col gap-5">
      {/* User Info */}
      <div className="flex flex-row items-center gap-4 py-2">
        <div
          className="relative cursor-pointer group"
          onClick={() => setIsDrawerOpen(true)}
        >
          {uploadPhotoMutation.isPending && (
            <div className="absolute inset-0 z-50 flex items-center justify-center">
              <Loader className="w-8 h-8" />
            </div>
          )}

          <ProfileAvatar
            src={uploadedPhoto || user.profilePhoto}
            firstName={user.firstName}
            lastName={user.lastName}
            className={`h-20 w-20 text-xl border-4 border-white shadow-sm transition-opacity duration-200 ${uploadPhotoMutation.isPending ? "opacity-75" : ""}`}
            priority={true}
          />

          {!uploadPhotoMutation.isPending && (
            <>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/20 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-6 w-6" />
              </div>
              <div className="absolute bottom-0 right-0 bg-foreground text-white p-1.5 rounded-full border-2 border-white">
                <Camera className="h-3 w-3" />
              </div>
            </>
          )}
        </div>

        <div className="text-left">
          <h2 className="capitalize text-foreground">
            {user.firstName} {user.lastName}
          </h2>
          <p className="text-muted-foreground text-sm">
            {maskPhoneNumber(user.phoneNumber)}
          </p>
        </div>
      </div>

      {/* Drawer for Profile Photo Upload */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Update Profile Photo</DrawerTitle>
            <DrawerDescription>
              Choose a new photo to update your profile picture.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 flex flex-col gap-4">
            <div className="flex justify-center py-4">
              <div className="relative">
                {uploadPhotoMutation.isPending && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center">
                    <Loader className="w-10 h-10" />
                  </div>
                )}
                <ProfileAvatar
                  src={uploadedPhoto || user.profilePhoto}
                  firstName={user.firstName}
                  lastName={user.lastName}
                  className={`h-32 w-32 text-4xl border-4 border-white shadow-md ${uploadPhotoMutation.isPending ? "opacity-75" : ""}`}
                />
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/png, image/jpeg, image/jpg"
              onChange={handleFileChange}
              disabled={uploadPhotoMutation.isPending}
            />

            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full gap-2"
              disabled={uploadPhotoMutation.isPending}
              isLoading={uploadPhotoMutation.isPending}
            >
              <Upload className="h-4 w-4" />
              {uploadPhotoMutation.isPending
                ? "Uploading..."
                : "Select Photo from Gallery"}
            </Button>

            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Cancel
              </Button>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Account Status */}
      {/* <div className="grid grid-cols-2 gap-4">
            <div className="bg-neutral-100/50 rounded-2xl p-3 flex flex-col items-center justify-center border border-neutral-100 shadow-sm">
                <span className="text-neutral-900 font-bold text-sm mb-0.5">Silver</span>
                <span className="text-xs text-neutral-500 uppercase tracking-wide">TIER</span>
            </div>
            <div className="bg-neutral-100/50 rounded-2xl p-3 flex flex-col items-center justify-center border border-neutral-100 shadow-sm">
                <span className="text-neutral-900 font-bold text-sm mb-0.5">376</span>
                <span className="text-xs text-neutral-500 uppercase tracking-wide">XP</span>
            </div>
        </div> */}

      {/* Menu Options */}
      <div className="flex flex-col gap-3">
        {menuOptions.map((option, index) => (
          <Item key={index} asChild variant="outline">
            <button type="button" onClick={option.onClick}>
              <ItemMedia className="text-muted-foreground">
                {option.icon}
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{option.title}</ItemTitle>
                <ItemDescription>{option.description}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </ItemActions>
            </button>
          </Item>
        ))}
      </div>

      {/* Sign Out — confirms first, then wipes this participant's data. */}
      <Button
        variant="outline"
        className="w-full mt-2"
        onClick={() => setIsSignOutOpen(true)}
      >
        Sign Out
      </Button>

      {/* Sign-out confirmation */}
      <Drawer open={isSignOutOpen} onOpenChange={setIsSignOutOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Sign out & clear this session?</DrawerTitle>
            <DrawerDescription>
              Signing out erases all data from this session and returns to the
              phone-number entry. This is how you start fresh for the next
              participant. To keep your progress, just close this and reload —
              nothing is lost on reload.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 flex flex-col gap-3">
            <Button variant="destructive" onClick={handleSignOut}>
              Sign out & clear data
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Cancel
              </Button>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>

      <p className="text-center text-xs text-muted-foreground">v{version}</p>
    </div>
  )
}
