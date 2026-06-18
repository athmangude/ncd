import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/Accordion"
import { HelpCircle, Phone } from "lucide-react"

export default function RejectionHelpAccordion() {
  return (
    <div className="w-full max-w-md px-4 mt-4">
      <div className="border rounded-lg bg-white overflow-hidden">
        <div className="p-4 border-b bg-neutral-50">
          <h3 className="font-medium text-neutral-900">
            Have a problem with your invoice?
          </h3>
        </div>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-b px-4">
            <AccordionTrigger className="py-3 text-sm text-neutral-700 hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <HelpCircle className="w-4 h-4 text-neutral-400 shrink-0" />
                <span>Why this happened?</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-neutral-500 px-7">
              Please ensure that the invoice details entered match exactly what is
              shown on the uploaded document.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2" className="border-b px-4">
            <AccordionTrigger className="py-3 text-sm text-neutral-700 hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <HelpCircle className="w-4 h-4 text-neutral-400 shrink-0" />
                <span>What you need to do?</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-neutral-500 px-7">
              Check your phone's "Downloads" or "Files" app. Most devices sort
              files by date, so your most recent download should be at the top.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3" className="px-4 border-none">
            <AccordionTrigger className="py-3 text-sm text-neutral-700 hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <Phone className="w-4 h-4 text-neutral-400 shrink-0" />
                <a href="tel:+254117118511">
                  <span className="text-sm font-medium text-neutral-900">
                    Call Jireh Support
                  </span>
                </a>
              </div>
            </AccordionTrigger>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
