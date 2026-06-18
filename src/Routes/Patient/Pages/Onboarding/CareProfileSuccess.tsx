import { useNavigate } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import careProfileSetup from "@/assets/icons/care-profile-setup.png"
import MobileWrapper, {
  LogoHeader,
  PrimaryCTAFooter,
} from "@/Routes/MobileWrapper"

export default function CareProfileSuccess() {
  const navigate = useNavigate()

  return (
    <MobileWrapper
      header={<LogoHeader showIcons={false} className="flex justify-center" />}
      footer={
        <PrimaryCTAFooter
          label={
            <span className="flex items-center justify-center gap-2">
              Go to my dashboard
              <ChevronRight className="w-5 h-5" />
            </span>
          }
          onClick={() => navigate("/patients/")}
        />
      }
      className="flex flex-col items-center justify-center"
    >
      <div className="flex flex-col items-center justify-center text-center max-w-xs">
        <div className="mb-6 relative">
          <img
            src={careProfileSetup}
            alt="Jireh profile complete"
            className="w-24 h-24 object-contain"
          />
        </div>

        <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
          Jireh profile complete!
        </h1>

        <p className="text-neutral-500 text-sm leading-relaxed">
          We will connect you with the right providers for tailored offers.
        </p>
      </div>
    </MobileWrapper>
  )
}

