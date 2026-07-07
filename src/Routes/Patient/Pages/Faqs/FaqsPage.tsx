import { useEffect } from "react"
import PatientPageWrapper from "../PatientPageWrapper"
import { SectionTitle } from "@/components/SectionTitle"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/Accordion"
import { memberFaqs } from "@/data/memberFaqs"
import { trackEvent, EVENTS } from "@/analytics"

// In-app FAQ list, sourced from jireh-health.com/faqs so members read answers in
// the app's styling instead of being sent to the marketing site.
export default function FaqsPage() {
  useEffect(() => {
    try {
      trackEvent(EVENTS.SUPPORT.FAQ_VIEW)
    } catch {
      // Silent fail
    }
  }, [])

  return (
    <PatientPageWrapper title="FAQs">
      <div className="flex flex-col gap-8 p-1">
        <p className="text-sm text-muted-foreground">
          Got questions? Here are answers to the things members ask us most.
        </p>

        {memberFaqs.map((category) => (
          <section key={category.id} className="flex flex-col gap-3">
            <SectionTitle>{category.title}</SectionTitle>
            <Accordion
              type="single"
              collapsible
              className="flex flex-col gap-2"
            >
              {category.items.map((item, index) => (
                <AccordionItem key={index} value={`${category.id}-${index}`}>
                  <AccordionTrigger className="text-left text-sm text-foreground">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}
      </div>
    </PatientPageWrapper>
  )
}
