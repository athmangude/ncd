// MPESA App Images
import mpesaappstep1 from "@/assets/images/mpesafaq/mpesaapp/step1.svg"
import mpesaappstep2 from "@/assets/images/mpesafaq/mpesaapp/step2.svg"
import mpesaappstep3 from "@/assets/images/mpesafaq/mpesaapp/step3.svg"

// USSD Images
import ussdstep1 from "@/assets/images/mpesafaq/ussd/step1.svg"
import ussdstep2 from "@/assets/images/mpesafaq/ussd/step2.svg"
import ussdstep3 from "@/assets/images/mpesafaq/ussd/step3.svg"
import ussdstep4 from "@/assets/images/mpesafaq/ussd/step4.svg"
import ussdstep5 from "@/assets/images/mpesafaq/ussd/step5.svg"

// Safaricom App Images
import safaricomstep1 from "@/assets/images/mpesafaq/safaricomapp/step1.svg"
import safaricomstep2 from "@/assets/images/mpesafaq/safaricomapp/step2.svg"
import safaricomstep3 from "@/assets/images/mpesafaq/safaricomapp/step3.svg"
import safaricomstep4 from "@/assets/images/mpesafaq/safaricomapp/step4.svg"
import safaricomstep5 from "@/assets/images/mpesafaq/safaricomapp/step5.svg"

export interface StepConfig {
  id: string
  title: string
  method: string
  subSteps: Array<{
    description: string
    image: string
  }>
}

export const mpesaStatementGuide: StepConfig[] = [
  {
    id: "ussd",
    title: "USSD Method",
    method: "*334#",
    subSteps: [
      {
        description: "Dial *334# and Choose (My Account)",
        image: ussdstep1
      },
      {
        description: "Choose (M-PESA Statement) then 'Request statement'",
        image: ussdstep2
      },
      {
        description: "Choose 'Full Statement' then specify for the (Last 6 Months)",
        image: ussdstep3
      },
      {
        description: "Confirm your (email), then enter your PIN when prompted",
        image: ussdstep4
      },
      {
        description: "(Download) your statement from your email, then (upload) it and the (passcode) to Jireh Health.",
        image: ussdstep5
      }
    ]
  },
  {
    id: "mpesa",
    title: "M-PESA App Method",
    method: "MPESA App",
    subSteps: [
      {
        description: "Open the MPESA App and click (View Statements)",
        image: mpesaappstep1
      },
      {
        description: "Click 'Export statement' and choose all transactions for the (last 6 months)",
        image: mpesaappstep2
      },
      {
        description: "(Download) & save the statement onto your phone, then (upload) it to Jireh Health",
        image: mpesaappstep3
      }
    ]
  },
  {
    id: "safaricom",
    title: "My Safaricom App Method",
    method: "My Safaricom App",
    subSteps: [
      {
        description: "Open the My Safaricom App and click (MPESA) at the bottom",
        image: safaricomstep1
      },
      {
        description: "Click 'MPESA statement' then (Get Full Statement)",
        image: safaricomstep2
      },
      {
        description: "Click 'Last 6 months' then (Get Statement)",
        image: safaricomstep3
      },
      {
        description: "Confirm your (email address) and enter your PIN",
        image: safaricomstep4
      },
      {
        description: "(Download) your statement from your email, then (upload) it and the 'passcode' to Jireh Health",
        image: safaricomstep5
      }
    ]
  }
]
