import PatientPageWrapper from "../PatientPageWrapper"

// Placeholder FAQ guide reached from the invoice-help list
// (Faqs/HelpAndSupport). The question itself is the page <h1>, matching the
// other guide screens (MpesaStatementGuide / PasscodeGuide / DownloadedFilesGuide).
export default function InvoiceDetailsMismatchGuide() {
  return (
    <PatientPageWrapper title="Invoice help">
      <div className="flex flex-col gap-6 p-1">
        <h1>The details don't match the invoice uploaded</h1>
        <ol className="flex flex-col gap-4 list-decimal pl-5 text-muted-foreground">
          <li>
            Check that the amount, facility name, and date on screen match the
            invoice you uploaded.
          </li>
          <li>
            If anything is different, go back and re-enter the details or upload
            a clearer photo of the invoice.
          </li>
          <li>
            Make sure the whole invoice is visible in the photo, with no cut-off
            edges or glare.
          </li>
          <li>
            If the details still don't match, contact Jireh Support and we'll
            help sort it out.
          </li>
        </ol>
      </div>
    </PatientPageWrapper>
  )
}
