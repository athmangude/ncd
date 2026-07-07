import FormGroupInput from "@/components/form/FormGroupInput"
import PatientPageWrapper from "../PatientPageWrapper"
import PatientCareFundExplainer from "./PatientCareFundExplainer"
import rewardIcon from "@/assets/icons/reward.png"
import { useForm } from "react-hook-form"
import { usePatientAuthStore } from "../../stores/patientAuthStore"
import { formatMoney } from "@/utilities/currencyUtilities"

import { WaitlistDialog } from "../../components/WaitlistDialog"

type Inputs = {
  depositAmount: number
}

export default function PatientCareFundSavings() {
  const {
    register,
    formState: { errors },
  } = useForm<Inputs>()

  const { careFundAccount } =
    usePatientAuthStore((state: any) => state.user) || {}

  const { careFundBalance, currency } = careFundAccount || {}

  return (
    <PatientPageWrapper title="Savings">
      <div className="flex gap-5 justify-between my-5 ">
        <img
          src={rewardIcon}
          alt="Reward Icon"
          className="w-full max-w-[70px] object-contain"
          aria-hidden="true"
        />
        <div className="w-full flex flex-col gap-1">
          <h1>Take charge of your health</h1>
          <p className="text-muted-foreground">
            Top up your balance to pay or share with your loved ones.
          </p>
        </div>
      </div>

      <FormGroupInput
        id="depositAmount"
        label="Deposit Amount"
        type="number"
        placeholder="Enter the deposit amount"
        register={register("depositAmount", {
          required: {
            value: true,
            message: "Please enter the deposit amount",
          },
        })}
        error={errors.depositAmount?.message}
        description={`Care fund balance: ${formatMoney(careFundBalance, currency?.code || "KES")}`}
      />
      <WaitlistDialog
        title="Coming soon"
        description="Thanks for being a saver! We are working on making savings a
            reality."
        dialog={{
          title: "Deposit",
          description:
            "Save money by depositing your funds into your care fund",
          triggerLabel: "Deposit",
        }}
        waitlistType="SAVINGS"
        submitButtonLabel="I'm Interested!"
      />

      <PatientCareFundExplainer />
    </PatientPageWrapper>
  )
}
