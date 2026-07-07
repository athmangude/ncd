import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/Accordion"
import { BadgeCheck, Building, Coins, UsersRound } from "lucide-react"
export function PatientNetworkFAQ() {
  return (
    <Accordion type="multiple" className="w-full flex flex-col gap-3">
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <UsersRound className="w-5 h-5 text-muted-foreground" />
          What are Jireh Networks?
        </AccordionTrigger>
        <AccordionContent>
          <p>
            Jireh networks connect you to a caring community, offering support
            for unexpected medical costs.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>
          <BadgeCheck className="w-5 h-5 text-muted-foreground" />
          Why join Jireh?
        </AccordionTrigger>
        <AccordionContent>
          <ul className="list-disc list-inside">
            <li>No monthly membership fees</li>
            <li>Use at any care facility</li>
            <li>Funds for unexpected needs</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export function PatientCareFundFAQ() {
  return (
    <Accordion type="multiple" className="w-full flex flex-col gap-3">
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <UsersRound className="w-5 h-5 text-muted-foreground" />
          What is Jireh?
        </AccordionTrigger>
        <AccordionContent>
          <p>
            Jireh is a medical loan platform that pays your medical bill
            instantly so you can get treated immediately and repay later at a
            very low interest rate.
          </p>

          <p>
            You can also use your Jireh limit to pay for your family and
            friends, helping them get treatment fast while you repay flexibly.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>
          <Building className="w-5 h-5 text-muted-foreground" />
          Which hospitals can you use Jireh?
        </AccordionTrigger>
        <AccordionContent>
          <p>
            Use Jireh to cover your medical expenses at any licensed health
            facility in Kenya.
          </p>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-3">
        <AccordionTrigger>
          <Coins className="w-5 h-5 text-muted-foreground" />
          What is the cost of using Jireh for medical bills?
        </AccordionTrigger>
        <AccordionContent>
          <ul className="list-disc list-inside">
            <li>Free to sign up & no monthly fees</li>
            <li>
              0% interest in the first 2 weeks, and 2.5% interest per month
              thereafter
            </li>
            <li>2.9% transactions fee on the loan amount, payable upfront</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
