import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Share2, Copy, Check } from "lucide-react"
import { Button } from "@/components/Button"
import MobileWrapper, {
  BackTitleHeader,
  PrimaryCTAFooter,
} from "@/Routes/MobileWrapper"
import { usePatientAuthStore } from "../../stores/patientAuthStore"
import { useToast } from "@/hooks/useToast"

export default function PatientReferralAndEarn() {
  const navigate = useNavigate()
  const user = usePatientAuthStore((state: any) => state.user)
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const referralCode = user?.accountReference || "Loading..."

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode)
    setCopied(true)
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    const shareData = {
      title: "Join Jireh",
      text: `Use my referral code ${referralCode} to join Jireh!`,
      url: window.location.origin, // Or a specific sign-up URL
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        console.log("Error sharing:", error)
      }
    } else {
      handleCopy()
    }
  }

  return (
    <MobileWrapper
      header={
        <BackTitleHeader
          title="Refer & Earn"
          onBack={() => navigate("/patients", { state: { tab: "profile" } })}
        />
      }
      footer={
        <PrimaryCTAFooter
          label={
            <span className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share Code
            </span>
          }
          onClick={handleShare}
        />
      }
    >
      <div className="flex flex-col gap-8 items-center text-center pt-6">
        {/* Header Image/Icon */}
        <div className="bg-purple-50 p-6 rounded-full">
          <Share2 className="h-12 w-12 text-purple-600" />
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <h1>Invite friends, get rewarded</h1>
          <p className="text-muted-foreground text-base leading-relaxed max-w-xs mx-auto">
            Share your unique code with friends. When they sign up and use your
            code, you both earn rewards!
          </p>
        </div>

        {/* Code Display */}
        <div className="w-full max-w-sm bg-muted border border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-3 relative">
          <span className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
            Your Referral Code
          </span>
          <div className="text-3xl font-bold text-foreground tracking-widest">
            {referralCode}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="absolute right-4 top-1/2 -translate-y-1/2"
            aria-label="Copy code"
          >
            {copied ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground max-w-xs">
          Terms and conditions apply. Rewards are credited after the referred
          user completes their first transaction.
        </p>
      </div>
    </MobileWrapper>
  )
}
