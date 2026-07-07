import inviteAcceptedIcon from "@/assets/icons/invite-accepted.png"
import { useLocation, useNavigate } from "react-router-dom"
import { usePatientAuthStore } from "../../stores/patientAuthStore"
import useNextOnboardingStep from "../../hooks/useNextOnboardingStep"
import MobileWrapper, {
  LogoHeader,
  PrimaryCTAFooter,
} from "@/Routes/MobileWrapper"
import { useEffect } from "react"

export default function PatientInviteAccepted() {
  const location = useLocation()
  const state = location.state

  const user = usePatientAuthStore((state) => state.user)

  const isNewUser = user?.membershipStatus === "PENDING"

  const nextOnboardingStep = useNextOnboardingStep()
  const navigate = useNavigate()

  useEffect(() => {
    if (isNewUser) {
      setTimeout(() => {
        navigate(nextOnboardingStep)
      }, 5000)
    }
    // Mount-only auto-navigation; subsequent prop changes should not retrigger the timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <MobileWrapper
      header={<LogoHeader showIcons={false} className="flex justify-center" />}
      footer={
        isNewUser ? null : (
          <PrimaryCTAFooter
            label="Back to Dashboard"
            onClick={() => navigate("/patients/")}
          />
        )
      }
      className="flex flex-col gap-7 text-center items-center"
    >
      <img
        src={inviteAcceptedIcon}
        alt="Network Icon"
        className=" object-contain max-w-[170px]"
        aria-hidden="true"
      />

      <h1>Invite Accepted!</h1>

      <p className="text-lg text-muted-foreground ">
        You have been added to{" "}
        <span className="font-medium text-black capitalize">
          {state?.firstName?.toLowerCase()}{" "}
          {state?.lastName?.toLowerCase() + "'s"}
        </span>{" "}
        network
      </p>
    </MobileWrapper>
  )
}
