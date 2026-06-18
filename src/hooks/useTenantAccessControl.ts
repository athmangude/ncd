import { setToLocalStorage } from "@/utilities/localStorage"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Session from "supertokens-web-js/recipe/session"

export default function useTenantAccessControl({
  setTenantIdValue,
}: {
  setTenantIdValue: string
}) {
  const navigate = useNavigate()

  useEffect(() => {
    setToLocalStorage("tenantId", setTenantIdValue)

    async function validateTenantId() {
      try {
        const sessionExists = await Session.doesSessionExist()
        if (!sessionExists) {
          return
        }
        const accessTokenPayload = await Session.getAccessTokenPayloadSecurely()

        if (
          !accessTokenPayload ||
          typeof accessTokenPayload.tId === "undefined"
        ) {
          navigate("/invalid-tenant")
          return
        }

        const userTenantId = accessTokenPayload.tId

        if (userTenantId !== setTenantIdValue) {
          navigate("/invalid-tenant")
        }
      } catch {
        navigate("/invalid-tenant")
      }
    }

    validateTenantId()
  }, [navigate, setTenantIdValue])
}
