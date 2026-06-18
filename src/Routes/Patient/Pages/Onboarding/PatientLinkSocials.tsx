import { Button } from "@/components/Button"
import PatientAuthHeadline from "../../components/PatientAuthHeadline"
import PatientAuthWrapper from "../../components/PatientAuthWrapper"
import { getAuthorisationURLWithQueryParamsAndSetState } from "supertokens-web-js/recipe/thirdparty"
import { Link, Route, Routes, useNavigate } from "react-router-dom"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useToast } from "@/hooks/useToast"
import { signInAndUp } from "supertokens-web-js/recipe/thirdparty"
import LoadingPage from "@/Routes/LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"
import { useState } from "react"
import axios from "axios"
import { User } from "supertokens-web-js/types"
import { CircleCheck } from "lucide-react"
import RouteMetadata from "@/components/RouteMetadata"

export const primaryUserInfoQuery = "linkSocialDetailsInfo"
export default function PatientLinkSocials() {
  //fetch the primary user id so we can use it to link the social account
  const query = useQuery({
    queryKey: [primaryUserInfoQuery],
    queryFn: async () => {
      const response = await axios.get(
        `${
          import.meta.env.VITE_SUPERTOKENS_API_DOMAIN
        }/patients/social-linking-details`
      )

      return response.data
    },
  })

  const [facebookIsVerified, setFacebookIsVerified] = useState(false)

  if (query.isLoading) {
    return <LoadingPage />
  }

  if (query.isError) {
    return <ErrorBlock />
  }

  const { userId } = query.data

  return (
    <PatientAuthWrapper>
      <Routes>
        <Route
          path="/"
          element={
            <RouteMetadata title="Verify Socials">
              <SocialButtons facebookIsVerified={facebookIsVerified} />
            </RouteMetadata>
          }
        />
        <Route
          path="/facebook"
          element={
            <RouteMetadata title="Verify Facebook">
              <FacebookLogin
                setFacebookIsVerified={setFacebookIsVerified}
                userId={userId}
              />
            </RouteMetadata>
          }
        />
      </Routes>
    </PatientAuthWrapper>
  )
}

function SocialButtons({
  facebookIsVerified,
}: {
  facebookIsVerified: boolean
}) {
  const { toast } = useToast()

  const mutation = useMutation({
    mutationFn: async () => {
      const authUrl = await getAuthorisationURLWithQueryParamsAndSetState({
        thirdPartyId: "facebook",

        // This is where Facebook should redirect the user back after login or error.
        // This URL goes on the Facebook's dashboard as well.
        frontendRedirectURI: `${
          import.meta.env.VITE_SUPERTOKENS_WEBSITE_DOMAIN
        }/patients/link-socials/facebook`,
      })

      // we redirect the user to facebook for auth.
      window.location.assign(authUrl)
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to authorize Facebook",
        variant: "destructive",
      })
    },
  })

  //Add LinkedIn and other accounts later on
  const canProceed = facebookIsVerified
  return (
    <>
      <div className="mb-5">
        <PatientAuthHeadline text="Social Media Connection" />
        <p className="text-center">Connect your Facebook Account</p>
      </div>

      {!canProceed ? (
        <div className="flex flex-col gap-1 text-center">
          <p className="text-lg font-medium">
            Authorize Jireh to access your Facebook account?
          </p>
          <p className="text-sm">
            Increase your approval success by signing in with Facebook
          </p>
          <Button
            isLoading={mutation.isPending}
            disabled={mutation.isPending}
            onClick={async () => {
              await mutation.mutate()
            }}
            className="mt-12"
          >
            Authorize Facebook
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-5 text-center items-center">
          <CircleCheck className="h-20 w-20 text-green-500 mx-au" />
          <h2 className="font-medium">Facebook Account Linked</h2>

          <Link to="/patients/terms-and-conditions" className="w-full mt-7">
            <Button role="link" className="w-full">
              Next
            </Button>
          </Link>
        </div>
      )}
    </>
  )
}

export const facebookSignUpQueryKey = "facebookSignUpQuery"

function FacebookLogin({
  userId,
  setFacebookIsVerified,
}: {
  userId: string
  setFacebookIsVerified: (state: boolean) => void
}) {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [user, setUser] = useState<User | null>(null)
  const query = useQuery({
    queryKey: [facebookSignUpQueryKey],
    queryFn: async () => {
      const response = await signInAndUp()

      if (response.status === "OK") {
        setUser(response.user)
      } else if (response.status === "SIGN_IN_UP_NOT_ALLOWED") {
        // the reason string is a user friendly message
        // about what went wrong. It can also contain a support code which users
        // can tell you so you know why their sign in / up was not allowed.
        throw new Error(response.reason)
      } else {
        // SuperTokens requires that the third party provider
        // gives an email for the user. If that's not the case, sign up / in
        // will fail.

        // As a hack to solve this, you can override the backend functions to create a fake email for the user.
        throw new Error("No email provided by social login")
      }
      return true
    },
  })

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `${
          import.meta.env.VITE_SUPERTOKENS_API_DOMAIN
        }/patients/link-social-account`,
        {
          socialAccountType: "FACEBOOK",
          socialAccountId: user!.id,
          primaryUserId: userId,
        }
      )

      setFacebookIsVerified(true)
      navigate("/patients/link-socials")
      return response.data
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
    navigate("/patients/link-socials")
  }
  return (
    <>
      <PatientAuthHeadline text="Complete link" />

      <Button
        className="w-full"
        isLoading={mutation.isPending}
        disabled={mutation.isPending}
        onClick={async () => {
          await mutation.mutate()
        }}
      >
        Complete Link
      </Button>
    </>
  )
}
