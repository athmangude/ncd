import { useNavigate } from "react-router-dom"
import pwaSetup from "@/assets/icons/pwa-setup.png"
import PatientPageWrapper from "../PatientPageWrapper"
import { HERO_ILLUSTRATION } from "@/Routes/shell/PageHeader"
import { PrimaryCTAFooter } from "@/Routes/shell/footers"
import { useEffect } from "react"
import { trackEvent, EVENTS } from "@/analytics"

export default function PWASuccessPage() {
  const navigate = useNavigate()

  useEffect(() => {
    trackEvent(EVENTS.PWA_INSTALL.SUCCESS_PAGE_VIEW)
  }, [])

  return (
    <PatientPageWrapper
      variant="content"
      barTitle="All set"
      isRoot={true}
      headerIcon={<img src={pwaSetup} alt="" className={HERO_ILLUSTRATION} />}
      pageTitle="You're all set!"
      description="You've successfully set up the app. You're ready to get the full experience."
      footer={
        <PrimaryCTAFooter
          label="Take me to my dashboard"
          onClick={() => navigate("/patients")}
        />
      }
    />
  )
}
