import inviteRejectedIcon from "@/assets/icons/invite-rejected.png"
import { PatientNetworkFAQ } from "./PatientNetworkFAQ"
import { useLocation, useNavigate } from "react-router-dom"
import MobileWrapper, {
  LogoHeader,
  PrimaryCTAFooter,
} from "@/Routes/MobileWrapper"
import useNextOnboardingStep from "../../hooks/useNextOnboardingStep"
import { usePatientAuthStore } from "../../stores/patientAuthStore"
export function PatientInviteExpired() {
  const location = useLocation()
  const state = location.state
  const navigate = useNavigate()

  const user = usePatientAuthStore((state) => state.user)

  const isNewUser =
    !user.membershipStatus || user.membershipStatus === "PENDING"

  const nextOnboardingStep = useNextOnboardingStep()

  return (
    <MobileWrapper
      header={<LogoHeader showIcons={false} className="flex justify-center" />}
      footer={
        <PrimaryCTAFooter
          label={isNewUser ? "Sign Up" : "Back to Dashboard"}
          onClick={() =>
            navigate(isNewUser ? nextOnboardingStep : "/patients/")
          }
        />
      }
      className="flex flex-col gap-7 text-center items-center"
    >
      <img
        src={inviteRejectedIcon}
        alt="Network Icon"
        className=" object-contain max-w-[170px]"
        aria-hidden="true"
      />

      <h1>{state?.message || "Invite expired"}</h1>

      <p className="text-lg text-muted-foreground">
        Please ask the person who invited you to send you a new invite.
      </p>

      <PatientNetworkFAQ />
    </MobileWrapper>
  )
}
