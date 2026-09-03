import {
  HelpCircle,
  MessageCircle,
  Mail,
  Instagram,
  Facebook,
  ChevronRight,
} from "lucide-react"
import PatientPageWrapper from "../PatientPageWrapper"
import { PrimaryCTAFooter } from "@/Routes/shell/footers"
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "@/components/Item"
import { useToast } from "@/hooks/useToast"
import { useMutation } from "@tanstack/react-query"
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
      return { success: true }
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
    <PatientPageWrapper
      title="Help & Support"
      onBack={() => navigate("/patients", { state: { tab: "profile" } })}
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
    </PatientPageWrapper>
  )
}
