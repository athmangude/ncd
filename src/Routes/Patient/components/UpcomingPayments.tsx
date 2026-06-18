import AccordionMenu from "@/components/AccordionMenu"
import { WalletCards } from "lucide-react"
import { useState } from "react"
import ArrowButton from "./ArrowButton"
import notes from "@/assets/images/notes.png"
import { ScrollArea } from "@radix-ui/react-scroll-area"
import { usePatientAuthStore } from "../stores/patientAuthStore"
import { Link } from "react-router-dom"
import { usePaymentHistory } from "../hooks/usePaymentHistory"

export default function UpcomingPayments() {
  const [showPayments, setShowPayments] = useState(true)
  const { data: paymentHistory } = usePaymentHistory()
  const loans = paymentHistory?.loans || []

  const { membershipStatus } =
    usePatientAuthStore((state: any) => state.user) || {}

  return (
    <AccordionMenu
      title="Upcoming Payments"
      description="Keep your payments on track"
      buttonLabel="view payments"
      icon={<WalletCards className="w-5 h-5 text-neutral-500" />}
      active={showPayments}
      buttonDisabled={false}
      onClick={() => setShowPayments(!showPayments)}
    >
      {showPayments && (
        <>
          {loans?.length > 0 ? (
            <PaymentItems loans={loans} />
          ) : (
            <div className="mt-7">
              <div className="flex gap-10 items-center">
                <img
                  src={notes}
                  alt="gift box"
                  className="w-16 h-16"
                  aria-hidden={true}
                />

                <div className="flex flex-col gap-5 ">
                  <p className=" text-neutral-500 text-sm">
                    All upcoming loan repayments will appear here
                  </p>

                  <Link to="payment/request-payment/select-patient">
                    <ArrowButton disabled={membershipStatus !== "APPROVED"}>
                      Fund New Treatment
                    </ArrowButton>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </AccordionMenu>
  )
}

function PaymentItems({ loans }: { loans: any[] }) {
  return (
    <ScrollArea className="max-h-[450px] overflow-y-auto mt-3">
      <ul className="flex flex-col gap-2 mt-5">
        {loans.map((loan: any) => (
          <PaymentItem key={loan.id} loan={loan} />
        ))}
      </ul>
    </ScrollArea>
  )
}

function PaymentItem({ loan }: { loan: any }) {
  //console log required here to prevent linting errors
  console.log(loan)

  //Removed due to bug in new repayment schedule. DO_NOT_DELETE

  // const { currency, id, totalPaid, amount, status, transactionFeeIsPaid } =
  //   loan || {}

  // const { treatmentType } = loan.patientMedicalInfoRequest || {}

  // const nextPayment = resolveNextPayment(repaymentSchedule.schedule)

  // const canBePaid = status === "DISBURSED" && transactionFeeIsPaid

  return (
    <li className="rounded-lg p-4 flex justify-between border text-sm">
      {/* <div className="flex flex-col gap-2 ">
        <p className="font-medium">{treatmentType}</p>
        <p className="text-red-500 font-medium">
          Due {formatDate(nextPayment.dueDate)}
        </p>

        <p className="text-base font-medium">
          {formatMoney(+nextPayment.amount, currency.code)}
        </p>

        <PlusLink
          link={`/patients/loans/loan-details/${id}`}
          text="View Details"
        />
        <PaymentPortal
          loanId={id}
          initialPaymentAmount={+nextPayment.amount}
          maxPayableAmount={+amount - totalPaid}
          title="Loan Repayment"
          description={`Loan repayment for ${treatmentType}. Due on ${formatDate(
            nextPayment.dueDate
          )}`}
        >
          {canBePaid && (
            <DialogTrigger disabled={status !== "DISBURSED"}>
              <ArrowButton asChild disabled={status !== "DISBURSED"}>
                Pay Now
              </ArrowButton>
            </DialogTrigger>
          )}
        </PaymentPortal>
      </div>

      <DueInTag dueDate={nextPayment.dueDate} /> */}
    </li>
  )
}
