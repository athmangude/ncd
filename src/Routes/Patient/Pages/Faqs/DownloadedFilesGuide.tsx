import { useState, useRef } from "react"
import PatientPageWrapper from "../PatientPageWrapper"
import { Alert, AlertDescription } from "@/components/Alert"
import { InfoIcon, XIcon } from "lucide-react"
import { Button } from "@/components/Button"

// Loan-role access is enforced once at the route level (MemberLoanRouteGuard in
// PatientsHome); this page no longer self-guards.
export default function DownloadedFilesGuide() {
  return (
    <PatientPageWrapper title="Financial Statements">
      <InstructionsSection />
    </PatientPageWrapper>
  )
}

function InstructionsSection() {
  const [isLoading, setIsLoading] = useState<"files" | null>(null)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = () => {
    setIsLoading(null)
  }

  const openFileManager = () => {
    setIsLoading("files")

    try {
      // Trigger the hidden file input
      fileInputRef.current?.click()
    } catch {
      const userAgent = navigator.userAgent
      let instructions = ""

      if (userAgent.includes("Android")) {
        instructions =
          'Please open your "Files" or "My Files" app manually to find downloaded files.'
      } else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
        instructions =
          'Please open your "Files" app manually to find downloaded files.'
      } else {
        instructions =
          "Please use your system file manager to locate downloaded files."
      }

      setAlertMessage(instructions)
      setIsLoading(null)
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,image/*"
        multiple
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <div className="flex flex-col p-4 gap-6">
        <h1 className="text-2xl font-semibold">
          How to find downloaded files on your phone
        </h1>

        {alertMessage && (
          <div className="p-4">
            <Alert className="border-blue-200 bg-blue-50">
              <InfoIcon className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 pr-8">
                {alertMessage}
              </AlertDescription>
              <button
                onClick={() => setAlertMessage(null)}
                className="absolute right-2 top-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </Alert>
          </div>
        )}
        <ol className="flex flex-col gap-4 list-decimal pl-5">
          <li>Open your phone's 'Files' app or 'Downloads' folder</li>
          <li>Look for files named 'MPESA_Statement_[Month]'</li>
          <li>Files are usually in PDF format</li>
          <li>
            If you can't find them, check your email if you chose email delivery
          </li>
        </ol>

        <Button onClick={openFileManager} disabled={isLoading === "files"}>
          {isLoading === "files" ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Opening...
            </>
          ) : (
            <>Open your file manager</>
          )}
        </Button>
      </div>
    </>
  )
}
