import { useEffect, useState } from "react"
import { Button } from "@/components/Button"
import PatientAuthWrapper from "../../components/PatientAuthWrapper"
import useNextOnboardingStep from "../../hooks/useNextOnboardingStep"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import LoadingPage from "@/Routes/LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"
import { checkPwaIsIntalled } from "../../hooks/useOnboardingChecklist"
import PatientAuthHeadline from "../../components/PatientAuthHeadline"

export const promptPwaInstallQueryKey = "promptPwaInstall"

type Platform = "ios" | "android" | "desktop"

export default function PatientRequestAppInstall() {
  const nextStep = useNextOnboardingStep()
  const navigate = useNavigate()
  const [platform, setPlatform] = useState<Platform>("desktop")

  const detectPlatform = (): Platform => {
    const userAgent = navigator.userAgent.toLowerCase()
    if (/iphone|ipad|ipod/.test(userAgent)) return "ios"
    if (/android/.test(userAgent)) return "android"
    return "desktop"
  }

  useEffect(() => {
    setPlatform(detectPlatform())
  }, [])

  const query = useQuery({
    queryKey: [promptPwaInstallQueryKey],
    queryFn: async () => {
      const pwaIsInstalled = await checkPwaIsIntalled()
      if (pwaIsInstalled) navigate(nextStep)
      return true
    },
  })

  if (query.isLoading) return <LoadingPage />
  if (query.isError) return <ErrorBlock />

  const getInstructions = () => {
    if (platform === "ios") {
      return (
        <div className="space-y-4 text-left">
          <p>To install Jireh on your iOS device:</p>
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>
              Tap the <strong>Share</strong> button{" "}
              <span aria-label="Share icon">(⎗)</span>
            </li>
            <li>
              Select <strong>"Add to Home Screen"</strong>
            </li>
            <li>
              Confirm by tapping <strong>"Add"</strong>
            </li>
          </ol>
        </div>
      )
    }

    if (platform === "android") {
      return (
        <div className="space-y-4 text-left">
          <p>To install Jireh on your Android device:</p>
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>
              Tap the <strong>Menu</strong> button{" "}
              <span aria-label="Menu icon">(⋮)</span>
            </li>
            <li>
              Select <strong>"Add to Home Screen"</strong>
            </li>
            <li>Confirm the installation</li>
          </ol>
        </div>
      )
    }

    return (
      <div className="space-y-4 text-left">
        <p>To install Jireh on your desktop:</p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            Chrome: Click <strong>Install</strong> below or look for the ⚙️ icon
            in the address bar
          </li>
          <li>
            Firefox: Click the <strong>Menu</strong> button and select "Install"
          </li>
          <li>
            Safari: Use the <strong>File</strong> menu and select "Add to Dock"
          </li>
        </ul>
      </div>
    )
  }

  return (
    <PatientAuthWrapper>
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => e.preventDefault()}
      >
        <PatientAuthHeadline text="Install Jireh" />
        {getInstructions()}

        <Button
          role="link"
          size="lg"
          onClick={() => {
            localStorage.setItem("pwaInstallSkipped", "true")
            navigate(nextStep)
          }}
        >
          Proceed
        </Button>
      </form>
    </PatientAuthWrapper>
  )
}
