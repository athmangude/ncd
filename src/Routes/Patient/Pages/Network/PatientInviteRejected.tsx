import { useLocation, useNavigate } from "react-router-dom"
import inviteRejectedIcon from "@/assets/icons/invite-rejected.png"
import MobileWrapper, {
  LogoHeader,
  PrimaryCTAFooter,
} from "@/Routes/MobileWrapper"
import { PatientNetworkFAQ } from "./PatientNetworkFAQ"
import { usePatientAuthStore } from "../../stores/patientAuthStore"
import useNextOnboardingStep from "../../hooks/useNextOnboardingStep"

export default function PatientInviteRejected() {
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
          onClick={() => navigate(isNewUser ? nextOnboardingStep : "/patients/")}
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

      <h1>Invite Declined</h1>

      <p className="text-lg text-muted-foreground ">
        You have rejected{" "}
        <span className="font-medium text-black capitalizeMin">
          {state?.firstName?.toLowerCase()}{" "}
          {state?.lastName?.toLowerCase() + "'s"}
        </span>{" "}
        invite
      </p>

      <PatientNetworkFAQ />
    </MobileWrapper>
  )
}
