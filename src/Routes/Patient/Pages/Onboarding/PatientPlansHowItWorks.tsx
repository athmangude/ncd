import { useLocation, useNavigate } from "react-router-dom"
import PatientPageWrapper from "../PatientPageWrapper"
import laurelImage from "@/assets/images/laurel.png"
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/Tabs"
import { Button } from "@/components/Button"
import useNextMembershipSetupStep from "../../hooks/useNextMembershipSetupStep"
import { InfoCard } from "../../components/PatientInfoCard"

export default function PatientPlansHowItWorks() {
  const location = useLocation()
  const state = location.state

  return (
    <PatientPageWrapper title="How it works">
      {/* Direct visits/refreshes arrive without router state — show the FREE
          plan rather than crashing on state.plan. */}
      {resolveComponent(state?.plan ?? "FREE")}
    </PatientPageWrapper>
  )
}

function resolveComponent(plan: "FREE" | "JIREH_PLUS") {
  switch (plan) {
    case "FREE":
      return (
        <PlanTemplate
          tabs={freePlanTabs}
          price={{
            currency: "KES",
            amount: "0",
          }}
        />
      )
    case "JIREH_PLUS":
      return (
        <PlanTemplate
          tabs={basicPlanTabs}
          price={{
            currency: "KES",
            amount: "499",
          }}
        />
      )
    default:
      return <div>Free</div>
  }
}

type PlanTab = {
  title: string
  subtitle: string
  tabName: string
  content: {
    title: string
    description?: string
  }[]
}

const freePlanTabs: PlanTab[] = [
  {
    title: "Build your dedicated health savings fund",
    subtitle:
      "Be prepared for future health needs, with no debts or surprises.",
    tabName: "savings",
    content: [
      {
        title: "Deposit any amount, anytime to grow your health fund",
      },
      {
        title: "Pay at any licensed hospital",
      },
      {
        title: "Pay securely & seamlessly",
      },
    ],
  },
  {
    title: "Turn your medical expenses into savings",
    subtitle: "Pay a medical bill and we give you real money back.",
    tabName: "cashbacks",
    content: [
      {
        title:
          "Pay at our partner hospitals and earn 5% cashback on each bill.",
      },
      {
        title:
          "Share your cashback with your loved ones for them to pay their bills.",
      },
    ],
  },
]

const basicPlanTabs: PlanTab[] = [
  {
    title: "Get care now, pay later",
    subtitle: "Immediate access to funds to cover your hospital bills.",
    tabName: "loans",
    content: [
      {
        title: "Complete your profile",
      },
      {
        title: "Pay a one-time fee of KES 499",
      },
      {
        title: "Visit a licensed hospital and take a loan to pay your bills",
      },
      {
        title: "Repay with 0% interest",
        description:
          "Repay the amount on time and we'll reward you with 5% cashback at partner hospitals.",
      },
    ],
  },
  {
    title: "Build your dedicated health savings fund",
    subtitle:
      "Be prepared for future health needs, with no debts or surprises.",
    tabName: "savings",
    content: [
      {
        title: "Deposit any amount, anytime to grow your health fund",
      },
      {
        title: "Pay at any licensed hospital",
      },
      {
        title: "Pay securely & seamlessly",
      },
      {
        title: "Earn 10% interest yearly on your savings.",
      },
    ],
  },
  {
    title: "Turn your medical expenses into savings",
    subtitle: "Pay a medical bill and we give you real money back.",
    tabName: "cashbacks",
    content: [
      {
        title:
          "Pay at our partner hospitals and earn 5% cashback on each bill.",
      },
      {
        title:
          "Share your cashback with your loved ones for them to pay their bills.",
      },
    ],
  },
]

function PlanTemplate({
  tabs,
  price,
}: {
  tabs: PlanTab[]
  price: {
    currency: string
    amount: string
  }
}) {
  const navigate = useNavigate()
  const next = useNextMembershipSetupStep()

  const location = useLocation()
  const state = location.state

  return (
    <>
      <PlanHeader price={price} />

      <Tabs defaultValue={tabs[0].tabName}>
        <TabsList className="flex justify-center w-fit mx-auto mb-5">
          {tabs.map((tab) => (
            <TabsTrigger
              value={tab.tabName}
              key={tab.tabName}
              className="capitalize"
            >
              {tab.tabName}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent
            value={tab.tabName}
            key={tab.tabName}
            className="flex flex-col gap-5"
          >
            <p className="text-3xl font-medium text-center">{tab.title}</p>

            <p className="text-muted-foreground text-center">{tab.subtitle}</p>

            <ul className="flex flex-col gap-2">
              {tab.content.map((content, index) => (
                <InfoCard
                  number={index + 1}
                  description={content.description}
                  title={content.title}
                />
              ))}
            </ul>
          </TabsContent>
        ))}
      </Tabs>

      <Button
        role="link"
        className="w-full"
        size="lg"
        onClick={() => {
          navigate(next, {
            state,
          })
        }}
      >
        Complete your profile
      </Button>
    </>
  )
}

function PlanHeader({
  price,
  subtitle,
}: {
  price: {
    currency: string
    amount: string
  }
  subtitle?: string
}) {
  return (
    <div className="flex gap-1 w-fit mx-auto items-center ">
      <img
        src={laurelImage}
        alt="laurel"
        className="w-full max-w-[60px]"
        aria-hidden="true"
      />
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-1">
          <span className="text-muted-foreground font-normal">
            {price.currency}
          </span>
          {price.amount}
        </h1>
        {subtitle && <h2>{subtitle}</h2>}
      </div>
      <img
        src={laurelImage}
        alt="laurel"
        className="w-full max-w-[60px] scale-x-[-1]"
        aria-hidden="true"
      />
    </div>
  )
}
