import { FC } from "react"
import { ChevronRight } from "lucide-react"
import { Card } from "./Card"

type FAQItem = {
  label: string
  icon?: React.ReactNode
  onClick?: () => void
}

interface FAQSectionProps {
  title?: string
  faqs: FAQItem[]
  supportText?: string
  supportSubtext?: string
  supportAction?: FAQItem
}

const FAQCard: FC<FAQItem> = ({ label, icon, onClick }) => (
  <div
    className="flex justify-between bg-white p-4 items-center cursor-pointer hover:bg-neutral-100 rounded-lg transition"
    onClick={onClick}
  >
    <div className="flex gap-2 items-center">
      <span className="text-sm text-neutral-500">{icon}</span>
      <p>{label}</p>
    </div>
    <ChevronRight className="h-6 w-6 flex-shrink-0 self-center" />
  </div>
)

const FAQSection: FC<FAQSectionProps> = ({
  title = "Don't Have a Statement?",
  faqs,
  supportText = "Need more help?",
  supportSubtext = "Contact our support team",
  supportAction,
}) => {
  return (
    <Card className="p-4 bg-neutral-50">
      <p className="flex items-center gap-2">{title}</p>

      <div className="flex flex-col gap-3 w-full my-4">
        {faqs.map((faq, idx) => (
          <FAQCard key={idx} {...faq} />
        ))}

        <div className="flex gap-2 bg-neutral-50 rounded-lg p-4">
          <div>
            <p>{supportText}</p>
            <p className="mt-1 text-neutral-500">{supportSubtext}</p>
          </div>
        </div>

        {supportAction && <FAQCard {...supportAction} />}
      </div>
    </Card>
  )
}

export default FAQSection
