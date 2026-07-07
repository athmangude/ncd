import idVerficationFailed from "@/assets/icons/id-verification-failed.png"
import { Button } from "@/components/Button"
import PatientAuthWrapper from "../../components/PatientAuthWrapper"

export default function PatientIdVerificationFailure() {
  return (
    <PatientAuthWrapper>
      <div className="flex flex-col items-center gap-5 text-center">
        <img
          src={idVerficationFailed}
          alt="id verification failed"
          aria-hidden
          className="w-20 h-20"
        />
        <h1>
          We could not verify your National ID details.
        </h1>

        <p className="text-lg text-muted-foreground">
          Unfortunately, you have been blocked from our services because your
          details did not match your ID.
        </p>

        <p>If there was a mistake, please contact customer support for help.</p>

        <a
          href={`https://wa.me/254117118511`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full"
        >
          <Button className="w-full" size="lg">
            Contact Customer Support
          </Button>
        </a>
      </div>
    </PatientAuthWrapper>
  )
}
