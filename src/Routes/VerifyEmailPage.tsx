import Session from "supertokens-web-js/recipe/session"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { sendVerificationEmail } from "supertokens-auth-react/recipe/emailverification"
import { toast } from "@/hooks/useToast"
import LoadingPage from "./LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"
import { Button } from "@/components/Button"
import CheckEmail from "@/components/auth/CheckEmail"
import AppShell from "@/Routes/AppShell"
import axios from "axios"

const tenantIdRoutes: Record<string, { auth: string; home: string }> = {
  healthcare: {
    auth: "/organizations/auth",
    home: "/organizations",
  },
  organizations: {
    auth: "/organizations/auth",
    home: "/organizations",
  },
}

const queryKey = "getHealthcareUser"
export default function VerifyEmailPage() {
  const navigate = useNavigate()

  const [tenantId, setTenantId] = useState<string | null>(null)

  const query = useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      const doesSessionExist = await Session.doesSessionExist()

      const result = await axios.get(
        import.meta.env.VITE_API_BASE_URL + "/users/tenant-id"
      )

      const tId = result.data.tenantId

      setTenantId(tId)

      if (!doesSessionExist) {
        navigate(tenantIdRoutes[tId]?.auth || "/auth")
      }

      return true
    },
  })

  const [showCheckEmail, setShowCheckEmail] = useState(false)
  const mutation = useMutation({
    mutationFn: async () => {
      const verificationResponse = await sendVerificationEmail()
      if (verificationResponse.status === "EMAIL_ALREADY_VERIFIED_ERROR") {
        // This can happen if the info about email verification in the session was outdated.
        // Redirect the user to the home page
        navigate(tenantIdRoutes[tenantId!]?.home || "/")
      } else {
        // email was sent successfully.
        setShowCheckEmail(true)
      }
    },
    onSuccess: () => {
      setShowCheckEmail(true)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      })
    },
  })

  if (query.isLoading) {
    return <LoadingPage />
  }

  if (query.isError) {
    return <ErrorBlock message={query.error.message} />
  }

  return (
    <AppShell header={null} footer={null}>
      <div className="flex flex-col gap-5 text-center items-center">
        {showCheckEmail ? (
          <CheckEmail />
        ) : (
          <>
            <h1 className="text-3xl text-black font-medium">
              Email Verification
            </h1>

            <p className="max-w-[55ch] text-sm">
              It seems your email has not been verified yet. Click on the button
              below to send a new verification email.
            </p>

            <Button
              onClick={async () => {
                await mutation.mutate()
              }}
              isLoading={mutation.isPending}
              disabled={mutation.isPending}
            >
              Send new Link
            </Button>
          </>
        )}
      </div>
    </AppShell>
  )
}
