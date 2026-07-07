import networkIcon from "@/assets/icons/network.png"
import { PatientNetworkFAQ, PatientCareFundFAQ } from "./PatientNetworkFAQ"
import careFundInviteIcon from "@/assets/icons/care-fund-invite.png"
import { formatMoney } from "@/utilities/currencyUtilities"

export function PatientInviteInfo({
  firstName,
  lastName,
}: {
  firstName: string
  lastName: string
}) {
  return (
    <section className="flex flex-col gap-5 text-center items-center">
      <img
        src={networkIcon}
        alt="Network Icon"
        className=" object-contain max-w-[170px]"
        aria-hidden="true"
      />

      <h1>
        <span className="capitalize">{firstName.toLocaleLowerCase()}</span>{" "}
        <span className="capitalize">{lastName.toLocaleLowerCase()}</span> has
        invited you to join their network
      </h1>

      <p className="text-lg text-muted-foreground">You can accept the invite below</p>

      <PatientNetworkFAQ />
    </section>
  )
}

export function PatientCareFundInviteInfo({
  firstName,
  lastName,
  amount,
  currency,
}: {
  firstName: string
  lastName: string
  amount: number
  currency: string
}) {
  return (
    <section className="flex flex-col gap-5 text-center items-center">
      <img
        src={careFundInviteIcon}
        alt="Network Icon"
        className=" object-contain max-w-[250px] mx-auto"
        aria-hidden="true"
      />

      <h1 className="max-w-[17ch]">
        <span className="font-medium">
          {firstName} {lastName}
        </span>{" "}
        has gifted you{" "}
        <span className="font-medium">{formatMoney(amount, currency)}</span>
        discount on your next medical bill.
      </h1>

      <PatientCareFundFAQ />
    </section>
  )
}
