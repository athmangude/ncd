import { cn } from "@/lib/utils"
import { cva } from "class-variance-authority"
import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import mobileCalendarIcon from "@/assets/icons/mobile-calendar.png"
import careProviderIcon from "@/assets/icons/care-provider.png"
import starPercentIcon from "@/assets/icons/star-percent.png"
import shareIcon from "@/assets/icons/share.png"
import { usePatientAuthStore } from "../stores/patientAuthStore"
import { ProtectedResource } from "@/components/ProtectedResource"
import {
  ALL_PATIENT_ROLES,
  MEMBER_LOAN_ROLES,
  UserType,
} from "../constants/userTypes"

const quickActionVariants = cva("flex flex-col gap-4", {
  variants: {
    variant: {
      default: "bg-white text-foreground",
      disabled: "filter grayscale text-muted-foreground",
    },
    defaultVariants: {
      variant: "default",
    },
  },
})

export default function PatientQuickActions({
  variant = "default",
  className,
}: {
  variant?: "default" | "disabled"
  className?: string
}) {
  const user = usePatientAuthStore((state) => state.user)

  const userType = user?.type

  return (
    <section className={cn(quickActionVariants({ variant, className }))}>
      <h3>Discover How Jireh Works</h3>

      <div className="flex gap-3 overflow-x-auto no-scrollbar">
        {quickActions.map((action) => (
          <QuickActionTile
            key={action.title}
            title={action.title}
            href={action.href}
            icon={action.icon}
            userType={userType}
            allowedAccountTypes={action.allowedAccountTypes}
          />
        ))}
      </div>
    </section>
  )
}

const quickActions: {
  title: string
  href: string
  icon: string
  allowedAccountTypes: UserType[]
}[] = [
  {
    title: "Add to your Circle",
    href: "/patients/network",
    icon: shareIcon,
    allowedAccountTypes: ALL_PATIENT_ROLES,
  },
  {
    title: "Raise your loan limit",
    href: "/patients/financial-statements-with-credit-update",
    icon: mobileCalendarIcon,
    allowedAccountTypes: MEMBER_LOAN_ROLES,
  },
  {
    title: "Save in the Care Fund",
    href: "/patients/care-fund",
    icon: starPercentIcon,
    allowedAccountTypes: ALL_PATIENT_ROLES,
  },
  {
    title: "Find our hospitals",
    href: "/patients/discover-hospitals",
    icon: careProviderIcon,
    allowedAccountTypes: ALL_PATIENT_ROLES,
  },
]

function QuickActionTile({
  title,
  href,
  icon,
  allowedAccountTypes,
  userType,
}: {
  title: string
  href: string
  icon: string
  userType: UserType
  allowedAccountTypes: UserType[]
}) {
  return (
    <ProtectedResource userRole={userType} allowedRoles={allowedAccountTypes}>
      <Link
        className="group first:bg-brand-gradient-200 bg-muted rounded-xl p-3 flex flex-col gap-3 no-underline text-foreground font-normal w-[150px] flex-shrink-0"
        to={href}
      >
        <div className="flex items-center gap-2">
          <img
            src={icon}
            alt={title}
            className="w-12 h-12 object-contain group-first:scale-125"
            aria-hidden="true"
          />
          <span className="bg-primary text-white rounded-2xl text-sm px-2 py-0.5 ml-2 hidden group-first:inline-block">
            New!
          </span>
        </div>
        <div className="flex justify-between items-end group-first:font-medium ">
          <p className="flex-1">{title}</p>

          <ChevronRight className="w-6 h-6 text-foreground flex-shrink-0" />
        </div>
      </Link>
    </ProtectedResource>
  )
}
