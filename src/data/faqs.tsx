import { CircleHelp } from "lucide-react"
import { useNavigate } from "react-router-dom"

export const useFAQs = () => {
  const navigate = useNavigate()

  return [
    {
      label: "How to get your MPESA statement",
      icon: <CircleHelp className="h-4 w-4" />,
      onClick: () => navigate("/patients/faqs/mpesa-statement"),
    },
    {
      label: "How to find downloaded files on your phone",
      icon: <CircleHelp className="h-4 w-4" />,
      onClick: () => navigate("/patients/faqs/downloaded-files"),
    },
    {
      label: "What is a passcode?",
      icon: <CircleHelp className="h-4 w-4" />,
      onClick: () => navigate("/patients/faqs/passcode"),
    },
  ]
}
