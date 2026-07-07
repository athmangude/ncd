import {
  HelpCircle,
  MessageCircle,
  Mail,
  Instagram,
  Facebook,
  ChevronRight,
} from "lucide-react"
import MobileWrapper, {
  BackTitleHeader,
  PrimaryCTAFooter,
} from "@/Routes/MobileWrapper"
import { useToast } from "@/hooks/useToast"
import { useMutation } from "@tanstack/react-query"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { trackEvent, EVENTS } from "@/analytics"

type SupportOption = {
  title: string
  description: string
  icon: React.ReactNode
  onClick: () => void
}

export default function PatientHelpAndSupport() {
  const { toast } = useToast()
  const navigate = useNavigate()

  // Track page view on mount
  useEffect(() => {
    try {
      trackEvent(EVENTS.SUPPORT.VIEW)
    } catch {
      // Silent fail
    }
  }, [])

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/patients/request-callback`
      )
      return response.data
    },
    onSuccess: () => {
      toast({
        title: "Request Sent",
        description:
          "We have received your request and will call you back shortly.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Request Failed",
        description:
          error.response?.data?.message ||
          "Something went wrong. Please try again.",
        variant: "destructive",
      })
    },
  })

  const supportOptions: SupportOption[] = [
    {
      title: "FAQs",
      description: "Got questions? we have answers",
      icon: <HelpCircle className="h-5 w-5 text-muted-foreground" />,
      onClick: () => navigate("/patients/faqs"),
    },
    {
      title: "WhatsApp",
      description: "+254 117 118 511",
      icon: <MessageCircle className="h-5 w-5 text-muted-foreground" />,
      onClick: () => window.open("https://wa.me/254117118511", "_blank"),
    },
    {
      title: "Email",
      description: "support@jireh-health.com",
      icon: <Mail className="h-5 w-5 text-muted-foreground" />,
      onClick: () => window.open("mailto:support@jireh-health.com", "_blank"),
    },
    {
      title: "Instagram",
      description: "@jirehhealth",
      icon: <Instagram className="h-5 w-5 text-muted-foreground" />,
      onClick: () => window.open("https://instagram.com/jirehhealth", "_blank"),
    },
    {
      title: "Facebook",
      description: "Jireh Health",
      icon: <Facebook className="h-5 w-5 text-muted-foreground" />,
      onClick: () => window.open("https://facebook.com/jirehhealth", "_blank"),
    },
  ]

  const handleRequestCallBack = () => {
    try {
      trackEvent(EVENTS.SUPPORT.CONTACT_SUBMIT)
    } catch {
      // Silent fail
    }
    mutation.mutate()
  }

  return (
    <MobileWrapper
      header={
        <BackTitleHeader
          title="Help & Support"
          onBack={() => navigate("/patients", { state: { tab: "profile" } })}
        />
      }
      footer={
        <PrimaryCTAFooter
          label="Request a Call Back"
          onClick={handleRequestCallBack}
          disabled={mutation.isPending}
          isLoading={mutation.isPending}
        />
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-muted-foreground text-sm mb-2">
          Reach out to us for any queries or read FAQs
        </p>

        {supportOptions.map((option, index) => (
          <button
            key={index}
            onClick={option.onClick}
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-border shadow-sm hover:shadow-md hover:border-muted-foreground/30 transition-all text-left group"
          >
            <div className="text-muted-foreground">{option.icon}</div>
            <div className="flex-1">
              <h3 className="text-foreground">{option.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {option.description}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
          </button>
        ))}
      </div>
    </MobileWrapper>
  )
}
