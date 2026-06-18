import { useNavigate } from "react-router-dom"
import { useEffect } from "react"
import Session from "supertokens-web-js/recipe/session"
import SplashScreens from "./SplashScreens"

// Patient-only prototype: if a (mock) session exists, go straight to the
// patient app; otherwise show the splash/onboarding entry.
export default function Home() {
  const navigate = useNavigate()

  useEffect(() => {
    Session.doesSessionExist().then((exists) => {
      if (exists) navigate("/patients/")
    })
  }, [navigate])

  return <SplashScreens />
}
