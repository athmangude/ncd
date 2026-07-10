import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { trackEvent, EVENTS } from "@/analytics"
import LoadingPage from "@/Routes/LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/Button"
import { SectionTitle } from "@/components/SectionTitle"
import axios, { HttpStatusCode } from "axios"
import { useToast } from "@/hooks/useToast"
import { invalidateCircleQueries } from "@/Routes/Patient/hooks/useCircleSync"
import fullLogo from "@/assets/icons/full-logo.svg"
import { Check, User, Play, Pause } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/Accordion"
import { Checkbox } from "@/components/Checkbox"
import { cn } from "@/lib/utils"
import { PrimaryCTAFooter } from "@/Routes/shell/footers"
import PatientPageWrapper from "../PatientPageWrapper"
import {
  SessionAuth,
  useSessionContext,
} from "supertokens-auth-react/recipe/session"
import { useForm, Controller } from "react-hook-form"
import FormGroupSelect from "@/components/form/FormGroupSelect"
import { relationshipOptions } from "./PatientAddConnection"
import avatarPlaceholder from "@/assets/icons/avatar.png"
import { usePatientLoginDetails } from "@/hooks/usePatientLoginDetails"

export const getIviteIdQueryKey = "getInviteId"

export default function PatientAcceptInvite() {
  const [searchParams] = useSearchParams()

  const query = useQuery({
    queryKey: [getIviteIdQueryKey],
    queryFn: async () => {
      let inviteId = searchParams.get("inviteId")
      let token = searchParams.get("token")
      let signature = searchParams.get("signature")

      if (!token || !signature) {
        token = localStorage.getItem("qrToken")
        signature = localStorage.getItem("qrSignature")
      }

      if (token && signature) {
        return {
          token,
          signature,
          isQr: true,
        }
      }

      if (!inviteId) {
        //get inviteId from local storage
        inviteId = localStorage.getItem("inviteId")
      }

      return {
        inviteId,
        isQr: false,
      }
    },
  })

  if (query.isLoading) {
    return <LoadingPage />
  }
  if (query.isError) {
    const error: any = query.error
    return <ErrorBlock message={error.response?.data.message} />
  }

  const data = query.data

  return (
    <SessionAuth requireAuth={false}>
      {data?.isQr ? (
        <QRInviteDetails token={data.token!} signature={data.signature!} />
      ) : data?.inviteId ? (
        <InviteDetails inviteId={data.inviteId} />
      ) : (
        <NoInviteFound />
      )}
    </SessionAuth>
  )
}

function NoInviteFound() {
  return (
    <PatientPageWrapper
      hideHeader
      footer={null}
      className="grid place-items-center min-h-full"
    >
      <div className="flex flex-col items-center text-center">
        <h2 className="mb-2">No invite found</h2>
        <p className="text-muted-foreground mb-6">
          We could not find the invite you are looking for.
        </p>

        <Link to="/patients" className="w-full max-w-sm">
          <Button className="w-full">Return to Dashboard</Button>
        </Link>
      </div>
    </PatientPageWrapper>
  )
}

export const patientAcceptInviteQueryKey = "patientAcceptInvite"

function InviteDetails({ inviteId }: { inviteId: string }) {
  const [showTerms, setShowTerms] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackTime, setPlaybackTime] = useState(0)

  const session = useSessionContext()
  const { data: currentUser } = usePatientLoginDetails()

  const query = useQuery({
    queryKey: [patientAcceptInviteQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/patient-network/invite/${inviteId}`
      )

      return response.data
    },
  })

  const { toast } = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Check if invite is for current user or if status is already ACCEPTED/REJECTED/CANCELLED
  useEffect(() => {
    // Only check if query is successful and user is authenticated
    if (query.isLoading || query.isError || !query.data) return
    if (session.loading) return
    if (!("doesSessionExist" in session) || !session.doesSessionExist) return
    if (!currentUser) return

    const { status, inviteePhoneNumber } = query.data
    const currentUserPhoneNumber = currentUser.phoneNumber

    // Check if invite status is ACCEPTED, REJECTED, or CANCELLED
    if (
      status === "ACCEPTED" ||
      status === "REJECTED" ||
      status === "CANCELLED"
    ) {
      toast({
        title: "Invite Already Processed",
        description: `This invite has already been ${status.toLowerCase()}.`,
        variant: "destructive",
      })
      navigate("/patients/circle")
      return
    }

    // Check if invite is not for this user
    if (inviteePhoneNumber && currentUserPhoneNumber) {
      // Normalize phone numbers for comparison (remove spaces, dashes, etc.)
      const normalizePhone = (phone: string) => phone.replace(/[\s\-\(\)]/g, "")
      const normalizedInviteePhone = normalizePhone(inviteePhoneNumber)
      const normalizedCurrentUserPhone = normalizePhone(currentUserPhoneNumber)

      if (normalizedInviteePhone !== normalizedCurrentUserPhone) {
        toast({
          title: "Invalid Invite",
          description: "This invite is not for your account.",
          variant: "destructive",
        })
        navigate("/patients/circle")
        return
      }
    }

    // All redirect guards passed — the invite will be shown to the user
    trackEvent(EVENTS.CIRCLE.INVITATION_VIEW)
  }, [
    query.data,
    query.isLoading,
    query.isError,
    currentUser,
    session,
    toast,
    navigate,
  ])

  const mutation = useMutation({
    mutationFn: async (data: { inviteId: string; status: string }) => {
      const response = await axios.post(
        `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/patient-network/accept-invite`,
        {
          ...data,
          type: "REFERRAL",
        }
      )

      return response.data
    },
    onSuccess: (data: any) => {
      const { meta } = data
      if (meta?.inviteStatus === "REJECTED") {
        trackEvent(EVENTS.CIRCLE.INVITATION_REJECT)
      } else {
        trackEvent(EVENTS.CIRCLE.INVITATION_ACCEPT)
      }
      toast({
        title: "Success",
        description: data.message,
      })
      invalidateCircleQueries(queryClient)
      localStorage.removeItem("inviteId")

      let redirectLink = "/patients"

      if (meta?.inviteStatus === "REJECTED") {
        redirectLink = "/patient/network/invite-rejected"
      }

      navigate(redirectLink, {
        state: {
          firstName: query?.data?.referrerFirstName,
          lastName: query?.data?.referrerLastName,
          tab: "circle",
        },
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const response = await axios.post(
        `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/circles/invites/${inviteId}/reject`
      )
      return response.data
    },
    onSuccess: () => {
      trackEvent(EVENTS.CIRCLE.INVITATION_REJECT)
      toast({
        title: "Invite Declined",
        description: "You have declined the invitation.",
      })
      invalidateCircleQueries(queryClient)
      localStorage.removeItem("inviteId")
      navigate("/patients")
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to decline invite",
        variant: "destructive",
      })
    },
  })

  if (query.isLoading) {
    return <LoadingPage />
  }

  if (query.isError) {
    const error: any = query.error

    if (error.response?.status === HttpStatusCode.Gone) {
      navigate("/patients/network/invite-expired", {
        state: {
          message: error.response?.data.message,
        },
      })
    }

    return <ErrorBlock message={error.response?.data.message} />
  }

  const {
    referrerFirstName,
    referrerLastName,
    inviteId: id,
    referrerProfilePhoto,
    customMessage,
    voiceNoteUrl,
    voiceNoteDuration,
  } = query.data

  const togglePlayback = () => {
    if (!audioPlayerRef.current) return

    if (isPlaying) {
      audioPlayerRef.current.pause()
      setIsPlaying(false)
      trackEvent(EVENTS.CIRCLE.INVITATION_AUDIO_PAUSE)
    } else {
      const playPromise = audioPlayerRef.current.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true)
            trackEvent(EVENTS.CIRCLE.INVITATION_AUDIO_PLAY)
          })
          .catch((error) => {
            console.error("Playback failed:", error)
            setIsPlaying(false)
            toast({
              title: "Playback Error",
              description:
                "Could not play audio. Please check your volume settings.",
              variant: "destructive",
            })
          })
      } else {
        setIsPlaying(true)
      }
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

  const renderVisualizer = () => {
    const bars = 30
    const duration = voiceNoteDuration || 1
    return (
      <div className="flex items-center gap-1 h-8 w-full">
        {Array.from({ length: bars }).map((_, i) => (
          <div
            key={i}
            className={`w-1 rounded-full ${
              i / bars < playbackTime / duration
                ? "bg-purple-500"
                : "bg-purple-200"
            }`}
            style={{
              height: `${Math.max(20, Math.random() * 100)}%`,
            }}
          />
        ))}
      </div>
    )
  }

  if (showTerms) {
    return (
      <PatientPageWrapper
        title="Read and Accept Shared Terms"
        footer={
          <div className="p-4 bg-card border-t border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="max-w-md mx-auto w-full flex flex-col gap-3">
              <Button
                className={cn(
                  "w-full",
                  !termsAccepted
                    ? "bg-muted text-muted-foreground hover:bg-muted"
                    : ""
                )}
                type="button"
                disabled={
                  !termsAccepted || mutation.isPending || mutation.isSuccess
                }
                isLoading={mutation.isPending}
                onClick={(e) => {
                  e.preventDefault()
                  if (session.loading) return

                  if (!session.doesSessionExist) {
                    localStorage.setItem("inviteId", inviteId)
                    navigate("/patients/auth")
                    return
                  }
                  mutation.mutate({
                    inviteId: id,
                    status: "ACCEPTED",
                  })
                }}
              >
                Accept & Join Circle
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="shrink-0"
                disabled={rejectMutation.isPending}
                isLoading={rejectMutation.isPending}
                onClick={() => {
                  if (session.loading) return

                  if (!session.doesSessionExist) {
                    localStorage.setItem("inviteId", inviteId)
                    navigate("/patients/auth")
                    return
                  }
                  rejectMutation.mutate(id)
                }}
              >
                Decline Invite
              </Button>
            </div>
          </div>
        }
      >
        <div className="flex-1 p-4 max-w-md mx-auto w-full">
          <h2 className="mb-2">Accept invitation?</h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Before you join the Circle, please review and accept the terms of
            the Jireh mutual support system.
          </p>

          <Accordion
            type="single"
            collapsible
            defaultValue="rewards"
            className="space-y-4"
          >
            <AccordionItem value="rewards" className="border rounded-xl px-0">
              <AccordionTrigger className="px-4 hover:no-underline">
                <span className="text-left">Key Rewards (What you GAIN)</span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <ul className="space-y-4 pt-2">
                  <TermRewardItem
                    text="Higher loan limits"
                    subtext="Unlock higher limits together."
                  />
                  <TermRewardItem
                    text="Shared discounts & rewards"
                    subtext=" Earn and enjoy rewards together"
                  />
                  <TermRewardItem
                    text="Support when needed"
                    subtext="Get help when it matters most."
                  />
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="risks" className="border rounded-xl px-0">
              <AccordionTrigger className="px-4 hover:no-underline">
                <span className=" text-left">Shared Risk (What you RISK)</span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <ul className="space-y-4 pt-2">
                  <TermRewardItem
                    text="Group access can pause"
                    subtext="If one person delays repayment, some Circle benefits and rewards may pause."
                  />
                  <TermRewardItem
                    text="Circle limits may reduce"
                    subtext=" Late payments can affect limits for the whole Circle."
                  />
                  <TermRewardItem
                    text="Cashbacks may be used to resolve unpaid bills"
                    subtext="If a loan stays unpaid for long, cashbacks may help cover it."
                  />
                  <TermRewardItem
                    text="Circle updates keep everyone informed"
                    subtext="You’ll get updates when the Circle needs attention."
                  />
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mt-8 p-4 border rounded-xl flex items-start gap-3 bg-card">
            <Checkbox
              id="accept-terms"
              className="mt-1"
              checked={termsAccepted}
              onCheckedChange={(checked) =>
                setTermsAccepted(checked as boolean)
              }
            />
            <label
              htmlFor="accept-terms"
              className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
            >
              I have read and understood the shared rewards and
              responsibilities, and I agree to continue.
            </label>
          </div>
        </div>
      </PatientPageWrapper>
    )
  }

  return (
    <PatientPageWrapper
      hideHeader
      footer={
        <PrimaryCTAFooter
          label="Read Terms & Accept invite"
          onClick={() => setShowTerms(true)}
        />
      }
    >
      <div className="flex flex-col items-center w-full">
        <div className="mb-6 mt-4 flex justify-center">
          <img
            src={fullLogo}
            alt="Jireh Logo"
            className="w-32 object-contain"
          />
        </div>

        <div className="mb-6 mt-4">
          <StarburstAvatar
            src={referrerProfilePhoto || avatarPlaceholder}
            alt={`${referrerFirstName} ${referrerLastName}`}
          />
        </div>

        <h1 className="text-center leading-tight block">
          <span className="text-purple-600 font-semibold block mb-1 ">
            {referrerFirstName} {referrerLastName}
          </span>
          <span className="">has invited you to their</span>
          <br />
          <span className="">Jireh Circle</span>
        </h1>

        {voiceNoteUrl && (
          <>
            <p className="text-muted-foreground text-sm font-medium mb-4 pl-1">
              {referrerFirstName} {referrerLastName} sent you a personalized
              voice message
            </p>
          </>
        )}
        {customMessage && (
          <div className="flex items-center gap-3 w-full max-w-[90%] mx-auto mb-auto mt-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0 border border-border">
              {referrerProfilePhoto ? (
                <img
                  src={referrerProfilePhoto || avatarPlaceholder}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 m-auto text-muted-foreground mt-2.5" />
              )}
            </div>
            <div className="bg-card border border-border rounded-tr-2xl rounded-tl-2xl rounded-br-2xl px-4 py-3  flex-1">
              <p className="text-muted-foreground text-[15px]">
                {customMessage}
              </p>
            </div>
          </div>
        )}

        {voiceNoteUrl && (
          <div className="w-full max-w-md bg-card rounded-full p-2 px-4 flex items-center gap-3 border shadow-sm mt-4 mb-6">
            <Button
              size="icon"
              className="flex-shrink-0"
              onClick={togglePlayback}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </Button>

            <div className="flex-1 flex items-center h-8 overflow-hidden">
              {renderVisualizer()}
            </div>

            <span className="text-xs font-mono text-muted-foreground w-10 text-right">
              {formatTime(voiceNoteDuration || 0)}
            </span>

            <audio
              ref={audioPlayerRef}
              src={voiceNoteUrl}
              onEnded={handleAudioEnded}
              onTimeUpdate={handleTimeUpdate}
              className="absolute w-0 h-0 opacity-0 pointer-events-none"
            />
          </div>
        )}

        <div className="w-full">
          <SectionTitle level={3} className="mb-4 pl-1">
            Benefits
          </SectionTitle>
          <ul className="space-y-4">
            <BenefitItem text="Get help paying medical bills" />
            <BenefitItem text="Access Lipa Baadaye " />
            <BenefitItem text="Share medical costs" />
          </ul>
        </div>
      </div>
    </PatientPageWrapper>
  )
}

function QRInviteDetails({
  token,
  signature,
}: {
  token: string
  signature: string
}) {
  const [termsAccepted, setTermsAccepted] = useState(false)
  const session = useSessionContext()
  const { toast } = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { control, watch } = useForm<{ relationship: string }>()
  const relationship = watch("relationship")

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/circles/invites/qr/accept`,
        {
          token,
          signature,
          relationship,
        }
      )

      return response.data
    },
    onSuccess: (data: any) => {
      trackEvent(EVENTS.CIRCLE.INVITATION_ACCEPT, { type: "qr" })
      toast({
        title: "Success",
        description: data.message,
      })
      invalidateCircleQueries(queryClient)

      localStorage.removeItem("qrToken")
      localStorage.removeItem("qrSignature")

      navigate("/patients", {
        state: {
          tab: "circle",
        },
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      })
    },
  })

  useEffect(() => {
    trackEvent(EVENTS.CIRCLE.INVITATION_VIEW, { type: "qr" })
  }, [])

  // Filter out CHILD options as QR invites are targeted at ACCOUNTABLE members (Adults)
  const adultRelationshipOptions = relationshipOptions.filter(
    (r) => r.value !== "CHILD" && r.value !== "CHILD_OVER_18"
  )

  return (
    <PatientPageWrapper
      title="Join Circle via QR"
      footer={
        <div className="p-4 bg-card border-t border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="max-w-md mx-auto w-full">
            <Button
              className={cn(
                "w-full",
                !termsAccepted
                  ? "bg-muted text-muted-foreground hover:bg-muted"
                  : ""
              )}
              type="button"
              disabled={
                !termsAccepted ||
                !relationship ||
                mutation.isPending ||
                mutation.isSuccess
              }
              isLoading={mutation.isPending}
              onClick={(e) => {
                e.preventDefault()
                if (session.loading) return

                if (!session.doesSessionExist) {
                  localStorage.setItem("qrToken", token)
                  localStorage.setItem("qrSignature", signature)
                  navigate("/patients/auth")
                  return
                }
                mutation.mutate()
              }}
            >
              Accept & Join Circle
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex-1 p-4 max-w-md mx-auto w-full">
        <div className="mb-6 flex justify-center">
          <img
            src={fullLogo}
            alt="Jireh Logo"
            className="w-32 object-contain"
          />
        </div>

        <h2 className="mb-2 text-center">Accept invitation?</h2>
        <p className="text-muted-foreground mb-6 leading-relaxed text-center">
          You have been invited to join a Jireh Circle. Please confirm your
          relationship to the inviter and accept the terms.
        </p>

        <div className="mb-6">
          <Controller
            name="relationship"
            control={control}
            rules={{ required: "Relationship is required" }}
            render={({ field }) => (
              <FormGroupSelect
                id="relationship"
                label="Relationship to Inviter"
                placeholder="Select relationship"
                field={field}
                error={undefined} // handled by form state if needed, but button disabled logic covers it
                options={adultRelationshipOptions}
              />
            )}
          />
        </div>

        <Accordion
          type="single"
          collapsible
          defaultValue="rewards"
          className="space-y-4"
        >
          <AccordionItem value="rewards" className="border rounded-xl px-0">
            <AccordionTrigger className="px-4 hover:no-underline">
              <span className="text-left">Key Rewards (What you GAIN)</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <ul className="space-y-4 pt-2">
                <TermRewardItem
                  text="Unlock Higher Loan Limits"
                  subtext="Access to loans and financial utility."
                />
                <TermRewardItem
                  text="Lower Loan Interest Rates"
                  subtext="Unlock better loan terms up to 5%"
                />
                <TermRewardItem
                  text="Shared Circle discounts"
                  subtext="Access to Circle grace periods and higher limits."
                />
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="risks" className="border rounded-xl px-0">
            <AccordionTrigger className="px-4 hover:no-underline">
              <span className=" text-left">Shared Risk (What you RISK)</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <ul className="space-y-4 pt-2">
                <li className="flex items-start gap-3">
                  <span className="text-sm text-muted-foreground leading-relaxed">
                    If a member of your circle defaults, your cashback or
                    savings may be used to cover their debt. This is the core of
                    our mutual support system.
                  </span>
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-8 p-4 border rounded-xl flex items-start gap-3 bg-card">
          <Checkbox
            id="accept-terms"
            className="mt-1"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
          />
          <label
            htmlFor="accept-terms"
            className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
          >
            I understand and accept the shared rewards and the progressive
            penalties, including the risk of cashback offset.
          </label>
        </div>
      </div>
    </PatientPageWrapper>
  )
}

function TermRewardItem({ text, subtext }: { text: string; subtext?: string }) {
  return (
    <li className="flex items-start gap-3 bg-card">
      <div className="mt-0.5 min-w-[20px]">
        <Check className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm text-foreground font-medium leading-snug">
          {text}
        </span>
        {subtext && (
          <span className="text-xs text-muted-foreground leading-snug mt-0.5">
            {subtext}
          </span>
        )}
      </div>
    </li>
  )
}

function BenefitItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3 bg-card p-2 rounded-xl border border-border shadow-sm">
      <div className="mt-0.5 min-w-[20px]">
        <Check className="w-5 h-5 text-muted-foreground" />
      </div>
      <span className="text-sm text-muted-foreground font-medium leading-snug">
        {text}
      </span>
    </li>
  )
}

function StarburstAvatar({ src }: { src: string; alt: string }) {
  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      {/* Background Cross Decoration */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Vertical Bar */}
        <div className="absolute w-28 h-64 bg-purple-50 rounded-2xl -z-10" />
        {/* Horizontal Bar */}
        <div className="absolute w-64 h-28 bg-purple-50 rounded-2xl -z-10" />
      </div>

      {/* SVG Masked Avatar */}
      <div className="w-48 h-48 drop-shadow-sm">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <mask id="starburstMask">
              <rect width="100" height="100" fill="black" />
              <g transform="translate(50, 50)">
                {/* 3 Rotated Squares creating 12-point star */}
                <rect
                  x="-35"
                  y="-35"
                  width="70"
                  height="70"
                  rx="4"
                  fill="white"
                  transform="rotate(0)"
                />
                <rect
                  x="-35"
                  y="-35"
                  width="70"
                  height="70"
                  rx="4"
                  fill="white"
                  transform="rotate(30)"
                />
                <rect
                  x="-35"
                  y="-35"
                  width="70"
                  height="70"
                  rx="4"
                  fill="white"
                  transform="rotate(60)"
                />
              </g>
            </mask>
          </defs>
          <image
            href={src}
            x="0"
            y="0"
            width="100"
            height="100"
            preserveAspectRatio="xMidYMid slice"
            mask="url(#starburstMask)"
          />
        </svg>
      </div>
    </div>
  )
}
