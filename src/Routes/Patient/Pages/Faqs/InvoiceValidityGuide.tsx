import PatientPageWrapper from "../PatientPageWrapper"

// Placeholder FAQ guide reached from the invoice-help list
// (Faqs/HelpAndSupport). The question itself is the page <h1>, matching the
// other guide screens (MpesaStatementGuide / PasscodeGuide / DownloadedFilesGuide).
export default function InvoiceValidityGuide() {
  return (
    <PatientPageWrapper title="Invoice help">
      <div className="flex flex-col gap-6 p-1">
        <h1>Invoice is not valid?</h1>
        <ol className="flex flex-col gap-4 list-decimal pl-5 text-muted-foreground">
          <li>
            A valid invoice shows the facility name, the date, an itemised list
            of charges, and the total amount due.
          </li>
          <li>
            Make sure the invoice is recent and issued by a licensed healthcare
            facility.
          </li>
          <li>
            Re-upload a clear, full photo or PDF of the original invoice — not a
            receipt or a handwritten note.
          </li>
          <li>
            If your invoice keeps being marked invalid, contact Jireh Support so
            we can review it with you.
          </li>
        </ol>
      </div>
    </PatientPageWrapper>
  )
}
