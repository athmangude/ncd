import { useNavigate } from "react-router-dom";
import pwaSetup from "@/assets/icons/pwa-setup.png"
import MobileWrapper, {
  LogoHeader,
  PrimaryCTAFooter,
} from "@/Routes/MobileWrapper"
import { useEffect } from "react"
import { trackEvent, EVENTS } from "@/analytics"

export default function PWASuccessPage() {
  const navigate = useNavigate();

  useEffect(() => {
    trackEvent(EVENTS.PWA_INSTALL.SUCCESS_PAGE_VIEW)
  }, [])


return (
    <MobileWrapper
      header={<LogoHeader showIcons={false} className="flex justify-center" />}
      footer={
        <PrimaryCTAFooter
          label="Take me to my dashboard"
          onClick={() => navigate("/patients")}
        />
      }
      className="flex flex-col items-center justify-center"
    >
      <section className="text-center flex flex-col gap-5 items-center ">
        <img
          src={pwaSetup}
          alt="PWA Setup"
          className="w-full max-w-[150px] mx-auto"
          aria-hidden="true"
        />

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">You're all set!</h1>
          <p className="text-muted-foreground max-w-[300px] mx-auto">
            You've successfully set up the app. You're ready to get the full
            experience.
          </p>
        </div>
      </section>
    </MobileWrapper>
  )
}

