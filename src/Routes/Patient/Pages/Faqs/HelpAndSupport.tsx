import { FC } from "react"
import { 
  ChevronRight, 
  Phone, 
  MessageSquare, 
  MessageCircle, 
  HelpCircle 
} from "lucide-react"
import PatientPageWrapper from "../PatientPageWrapper"
import { Card } from "@/components/Card"
import { useNavigate } from "react-router-dom"

type HelpItem = {
  label: string
  icon?: React.ReactNode
  onClick?: () => void
  href?: string
}

const HelpItemCard: FC<HelpItem> = ({ label, icon, onClick, href }) => {
  const navigate = useNavigate()
  
  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (href) {
      if (href.startsWith("http") || href.startsWith("tel") || href.startsWith("sms")) {
        window.location.href = href
      } else {
        navigate(href)
      }
    }
  }

  return (
    <div
      className="flex justify-between bg-white p-4 items-center cursor-pointer hover:bg-muted rounded-lg transition border border-border"
      onClick={handleClick}
    >
      <div className="flex gap-3 items-center">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <p className="text-sm sm:text-base font-medium text-foreground">{label}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 self-center" />
    </div>
  )
}

export default function HelpAndSupport() {
//   const navigate = useNavigate()

  const invoiceProblems: HelpItem[] = [
    {
      label: "The details don't match the invoice uploaded",
      icon: <HelpCircle className="h-5 w-5" />,
      href: "/patients/payment/request-payment/help/invoice-details-mismatch",
    },
    {
      label: "How to find downloaded files on your phone",
      icon: <HelpCircle className="h-5 w-5" />,
      href: "/patients/faqs/downloaded-files",
    },
    {
      label: "Invoice is not valid?",
      icon: <HelpCircle className="h-5 w-5" />,
      href: "/patients/payment/request-payment/help/invoice-validity",
    },
  ]

  const contactOptions: HelpItem[] = [
    {
      label: "Call Jireh Support",
      icon: <Phone className="h-5 w-5" />,
      href: "tel:+254117118511",
    },
    {
      label: "Send an SMS",
      icon: <MessageSquare className="h-5 w-5" />,
      href: "sms:+254117118511",
    },
    {
      label: "Send a WhatsApp message",
      icon: <MessageCircle className="h-5 w-5" />,
      href: "https://wa.me/254117118511",
    },
  ]

  return (
    <PatientPageWrapper title="Help & Support">
      <div className="flex flex-col gap-6 p-1">
        <div className="flex flex-col gap-2">
          <h1 className="text-foreground">We're here to help.</h1>
          <p className="text-muted-foreground text-sm">
            Here are some quick suggestions for any problems you might face.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-muted-foreground">
            Have a problem with your invoice?
          </h2>
          <div className="flex flex-col gap-3">
            {invoiceProblems.map((item, idx) => (
              <HelpItemCard key={idx} {...item} />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-muted-foreground">
            Need more help?
          </h2>
          <Card className="bg-white p-2 rounded-xl border-border">
            <div className="flex flex-col gap-1">
              {contactOptions.map((item, idx) => (
                <HelpItemCard key={idx} {...item} />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PatientPageWrapper>
  )
}

