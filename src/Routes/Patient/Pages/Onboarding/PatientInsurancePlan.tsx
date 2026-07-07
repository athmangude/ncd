import houseShieldImage from "@/assets/images/house-shield.png"
import { InfoCard } from "../../components/PatientInfoCard"
import { Button } from "@/components/Button"
import { useNavigate } from "react-router-dom"

export function InsurancePlan() {
  const navigate = useNavigate()
  return (
    <>
      <section className="flex gap-2 flex-col  items-center text-center">
        <img
          src={houseShieldImage}
          alt="house shield"
          className="w-full max-w-[60px] scale-x-[-1]"
          aria-hidden="true"
        />
        <h1>Affordable health insurance</h1>
        <p className="text-muted-foreground ">
          Don't let unexpected medical bills worry you again
        </p>
      </section>

      <ul className="flex flex-col gap-3 w-full my-4">
        <InfoCard number={1} title="Choose a budget-friendly plan" />
        <InfoCard number={2} title="Make your payment" />
        <InfoCard
          number={3}
          title="Visit a partner hospital and get treatment"
        />
        <InfoCard number={4} title="We cover your bill up to your limit" />
      </ul>

      <Button
        className="w-full"
        size="lg"
        role="link"
        onClick={() => navigate("/patients/insurance/choose-plan")}
      >
        Choose your cover
      </Button>
    </>
  )
}
