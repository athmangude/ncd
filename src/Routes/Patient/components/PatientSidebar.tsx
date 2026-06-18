import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/Sheet"
import { Mail, Menu, Share2, ShieldCheck } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { usePatientAuthStore } from "../stores/patientAuthStore"
import { Button } from "@/components/Button"
import whatsApp from "@/assets/icons/whatsapp.svg"

export function PatientSidebar() {
  const user = usePatientAuthStore((state: any) => state.user)
  const signOut = usePatientAuthStore((state: any) => state.signOut)
  const navigate = useNavigate()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="" variant="ghost" aria-label="menu">
          <Menu className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col gap-7">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-4">
          <SidebarItem
            to="/patients/network"
            icon={<Share2 className="h-5 w-5" />}
            title="Share & Refer"
            isNew={true}
          />
          <SidebarItem
            to="mailto:support@jireh-health.com"
            icon={<Mail className="h-5 w-5" />}
            title="Email Support"
          />
          {/* Fix (nullable check) */}
          {user?.hasSetPin && (
            <SidebarItem
              to="/patients/change-pin"
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Change PIN"
            />
          )}
          <SidebarItem
            to="https://wa.me/254117118511"
            icon={whatsApp}
            iconIsImage={true}
            title="WhatsApp Support"
            target="_blank"
          />
        </nav>

        <SheetFooter>
          <SheetClose asChild>
            <Button
              variant="outline"
              onClick={() => {
                signOut()
                navigate("/patients/auth")
              }}
            >
              Sign Out
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function SidebarItem({
  to,
  icon,
  iconIsImage = false,
  isNew,
  title,
  target,
}: {
  to: string
  icon: any
  iconIsImage?: boolean
  title: string
  isNew?: boolean
  target?: React.HTMLAttributeAnchorTarget
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 py-2 text-sm text-foreground transition-colors rounded-md hover:bg-accent hover:text-accent-foreground"
      target={target}
    >
      {iconIsImage ? (
        <img src={icon} alt="icon" className="h-5 w-5" aria-hidden="true" />
      ) : (
        icon
      )}
      {title}

      {isNew && (
        <span className="bg-primary text-white rounded-2xl text-sm px-2 py-0.5 ml-2">
          New!
        </span>
      )}
    </Link>
  )
}
