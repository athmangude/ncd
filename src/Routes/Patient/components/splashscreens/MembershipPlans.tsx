import { Check, ChevronLeft } from "lucide-react"
import InviteModal from "../InviteModal"
import { useNavigate } from "react-router-dom"

export default function MembershipPlans({
  setCurrentScreen,
  currentScreen,
}: {
  currentScreen: number
  setCurrentScreen: (value: number) => void
}) {
  const navigate = useNavigate()
  const plans = [
    {
      title: "Jireh Plus",
      icon: "/jireh-plus.png",
      price: "Ksh 0",
      description: "Free Membership",
      benefits: [
        "<b>No monthly</b> membership fee",
        '<b class="font-bold">Credit limit of up to KSh 65,000</b>',
        "Only usable for <b>your own</b> medical treatments",
        "<b>0% interest</b> in the first month following your treatment",
        "Low monthly interest rate of <b>2.5%</b>",
      ],
      buttonText: "Get Started",
      isHighlighted: true,
    },
    {
      title: "Jireh Community",
      icon: "/jireh-community.png",
      price: "Ksh 500",
      description: "Include Family & Friends",
      benefits: [
        'Membership fee of <b class="font-bold">KSh 500 per month</b>',
        '<b class="font-bold">Credit limit of up to KSh 200,000</b>',
        '<b class="font-bold">Extend your credit to friends and family </b>',
        "0% interest in the first month following your treatment",
        "Low monthly interest rate of 2.5%",
      ],
      buttonText: "Join Waitlist",
      isHighlighted: false,
    },
    {
      title: "Jireh Elite",
      icon: "/jireh-elite.png",
      price: "Ksh 1,500",
      description: "Include Family & Friends",
      benefits: [
        'Membership fee of <b class="font-bold">KSh 1,500 per month</b>',
        '<b class="font-bold">Credit limit of up to KSh 650,000</b>',
        '<b class="font-bold">Extend your credit to friends and family </b>',
        "0% interest in the first month following your treatment",
        "Low monthly interest rate of 2.5%",
      ],
      buttonText: "Join Waitlist",
      isHighlighted: false,
    },
  ]

  return (
    <div className=" h-screen relative bg-white min-h-screen px-4 py-6">
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault()
          setCurrentScreen(currentScreen - 1)
        }}
        className="flex items-center justify-between mb-6 cursor-pointer"
        role="link"
        aria-label="Previous screen"
      >
        <ChevronLeft />
      </a>
      <header className="text-center mb-6">
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">
          Jireh Health Memberships
        </h1>
        <p className="text-xs">
          Please pick a bundle that suits your preferences.
        </p>
        <div className="flex items-center justify-center mt-4">
          <img
            src="/refer.svg"
            alt="Refer a Friend"
            className="h-16 w-16 mr-2"
          />
          <div className="text-left">
            <h2 className="text-xs font-medium">Refer a friend</h2>
            <p className="text-xs text-neutral-600">
              Know someone who would benefit from Jireh? <InviteModal />
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-10">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`p-6 rounded-md shadow-md ${
              plan.isHighlighted
                ? "bg-[url('/membershipgradient.jpeg')] bg-no-repeat bg-cover"
                : "bg-white"
            }`}
          >
            <img
              src={plan.icon}
              alt={plan.title}
              className=" h-12 w-auto mb-4"
            />
            <h2
              className={`text-2xl font-normal ${
                plan.isHighlighted ? "text-white" : "text-purple-700"
              } mb-4`}
            >
              {plan.title}
            </h2>
            {plan.description && (
              <p
                className={`mb-4 text-lg ${
                  plan.isHighlighted ? "text-white/70" : "text-neutral-600"
                }`}
              >
                {plan.description}
              </p>
            )}
            <ul
              className={`list-none space-y-3 ${
                plan.isHighlighted ? "text-white/90" : "text-neutral-700"
              } mb-6`}
            >
              {plan.benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-center gap-2 text-base">
                  <Check
                    className={`
                      ${
                        plan.title !== "Jireh Plus" && idx < 3
                          ? "bg-[#1FC87F] text-white"
                          : "bg-[#B325FF] text-white"
                      } rounded-full h-4 w-4 p-1`}
                  />
                  <span dangerouslySetInnerHTML={{ __html: benefit }} />
                </li>
              ))}
            </ul>
            <p
              className={` ${
                plan.isHighlighted ? "text-white/80" : "text-neutral-800"
              } mb-6`}
            >
              <span className="text-2xl font-bold  ">{plan.price}</span>
              <span className="m-3">/ per month</span>
            </p>
            <button
              onClick={() =>
                plan.buttonText === "Get Started"
                  ? setCurrentScreen(currentScreen + 1)
                  : navigate("/patients/auth")
              }
              className="w-full py-2 rounded-md bg-[#B325FF] text-white font-bold hover:bg-purple-600"
            >
              {plan.buttonText}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
