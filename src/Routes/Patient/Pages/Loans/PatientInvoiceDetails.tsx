import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import LoadingPage from "@/Routes/LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"
import { Link, useParams } from "react-router-dom"
import { usePatientLoanStore } from "../../stores/patientLoanStore"
import {
  getPatientLoanDetailsQueryKey,
  MedicalRequestDetails,
} from "./PatientViewLoanDetails"
import PatientPageWrapper from "../PatientPageWrapper"
import { Badge } from "@/components/Badge"
import { formatMoney } from "@/utilities/currencyUtilities"
import { Download } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/Button"
import { Checkbox } from "@/components/Checkbox"

export default function InvoiceDetails() {
  const id = useParams().id
  const setLoan = usePatientLoanStore((state: any) => state.setLoan)

  const query = useQuery({
    queryKey: [getPatientLoanDetailsQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/loans/patient/me/medical-invoice-details/${id}`
      )

      setLoan(response.data)
      return response.data
    },
  })

  const [hasAgreedToInvoiceDetails, setHasAgreedToInvoiceDetails] =
    useState(false)

  if (query.isLoading) {
    return <LoadingPage />
  }

  if (query.isError) {
    return <ErrorBlock />
  }

  return (
    <PatientPageWrapper title="Confirm Treatment Details">
      <MedicalRequestDetails />
      <ItemizedInvoice />
      <ViewInvoiceFile />

      <div className="flex space-x-2 sm:col-span-2 mt-5">
        <Checkbox
          id="hasAgreedToInvoiceDetails"
          checked={hasAgreedToInvoiceDetails}
          onCheckedChange={() =>
            setHasAgreedToInvoiceDetails(!hasAgreedToInvoiceDetails)
          }
          className="mt-1"
        />
        <label
          htmlFor="terms"
          className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          By ticking this box, I confirm that I have reviewed and accept the
          invoice
        </label>
      </div>

      <Link to={`/patients/loans/loan-details/${id}`}>
        <Button
          className="w-full"
          disabled={!hasAgreedToInvoiceDetails}
          type="button"
          role="link"
        >
          Accept bill
        </Button>
      </Link>
    </PatientPageWrapper>
  )
}

function ItemizedInvoice() {
  const loan = usePatientLoanStore((state: any) => state.loan)

  const invoiceItems =
    loan?.patientMedicalInfoRequest?.healthcareMedicalInfoRequest
      ?.invoiceItems ?? []

  const totalInvoiceAmount = invoiceItems.reduce(
    (acc: any, item: any) => acc + parseFloat(item.totalPrice),
    0
  )

  return (
    <section className="flex flex-col gap-5 border-b border-black pb-5">
      <div className="flex justify-between gap-5">
        <h2>Invoice Details</h2>

        <Badge variant={loan?.transactionFeeIsPaid ? "success" : "destructive"}>
          {loan?.transactionFeeIsPaid ? "paid" : "unpaid"}
        </Badge>
      </div>

      <div className="p-3 border rounded-lg flex flex-col gap-2">
        <div className="flex justify-between text-lg">
          <span>Item</span>
          <span className=" min-w-[75px]">Price</span>
        </div>
        {invoiceItems.map((item: any) => (
          <InvoiceItem key={item.id} item={item} />
        ))}
      </div>

      <p className="text-primary text-lg font-medium flex justify-between">
        <span>Total Invoice Amount</span>
        <span className="min-w-[75px]">
          {formatMoney(totalInvoiceAmount, loan?.currency?.code)}
        </span>
      </p>
    </section>
  )
}

function InvoiceItem({ item }: { item: any }) {
  const { description, totalPrice, currency } = item
  return (
    <div className="flex justify-between text-muted-foreground ">
      <span>{description}</span>
      <span className="min-w-[75px]">
        {formatMoney(totalPrice, currency?.code)}
      </span>
    </div>
  )
}

function ViewInvoiceFile() {
  const loan = usePatientLoanStore((state: any) => state.loan)
  const invoiceDownloadUrl = loan?.invoiceDownloadUrl ?? ""

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h2>View Care Provider Invoice</h2>
        <p className="text-muted-foreground text-xs mt-1">
          Please review the invoice for additional billing details
        </p>
      </div>

      <div className="p-3 border rounded-lg flex justify-between items-center gap-2 ">
        <span className=" text-muted-foreground">Invoice File</span>

        <a href={invoiceDownloadUrl} className="flex gap-2 items-center">
          {" "}
          <Download className="w-5 h-5" />
          Download
        </a>
      </div>
    </section>
  )
}

// Find a way to display PDFs safely and consistently
// function resolveFileElement(fileType: string, fileUrl: string) {
//   const isImage = imageFileTypes.includes(fileType)
//   const isPdf = fileType === "pdf"

//   if (isImage) {
//     return <img src={fileUrl} alt="Invoice File" />
//   }

//   if (isPdf) {
//     return (
//       <iframe
//         src={`https://docs.google.com/gview?url=${
//           fileUrl.split("?")[0]
//         }&embedded=true`}
//         className="h-[60vh]"
//       ></iframe>
//     )
//   }

//   return <ErrorBlock message="Invoice file cannot be displayed" />
// }
