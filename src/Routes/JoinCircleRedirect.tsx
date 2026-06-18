import { useSearchParams, useNavigate } from "react-router-dom"
import { useEffect } from "react"
import LoadingPage from "./LoadingPage"

export default function JoinCircleRedirect() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const inviteId = searchParams.get("inviteId")
  const token = searchParams.get("token")
  const signature = searchParams.get("signature")

  useEffect(() => {
    try {
      if (inviteId) {
        localStorage.setItem("inviteId", inviteId)
        navigate(`/patients/network/accept-invite?inviteId=${inviteId}`, { replace: true })
        return
      }

      if (token && signature) {
        navigate(
          `/patients/network/accept-invite?token=${encodeURIComponent(token)}&signature=${encodeURIComponent(signature)}`,
          { replace: true }
        )
        return
      }

      navigate("/", { replace: true })
    } catch (error) {
      console.error("Error in JoinCircleRedirect:", error)
      navigate("/", { replace: true })
    }
  }, [inviteId, token, signature, navigate])

  return <LoadingPage />
}
