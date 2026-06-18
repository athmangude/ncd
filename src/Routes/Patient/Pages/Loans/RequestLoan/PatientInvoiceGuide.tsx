import { useNavigate } from "react-router-dom"
import { Button } from "@/components/Button"
import PatientPageWrapper from "../../PatientPageWrapper"

export default function PatientInvoiceGuide() {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <PatientPageWrapper title="Taking a good invoice photo" showHelp={false}>
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <div className="mb-6">
            <p className="text-neutral-500 mt-1">
              Follow these tips to ensure your invoice photo is clear and readable.
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex gap-4">
              <span className="text-neutral-400 font-mono text-lg">01</span>
              <div>
                <h3 className="font-medium text-neutral-900 mb-1">Ensure good lighting</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">
                  Make sure the invoice is well-lit and in focus. Natural light works best.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="text-neutral-400 font-mono text-lg">02</span>
              <div>
                <h3 className="font-medium text-neutral-900 mb-1">Include all corners</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">
                  Capture the entire document including all four corners to ensure all information is visible.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="text-neutral-400 font-mono text-lg">03</span>
              <div>
                <h3 className="font-medium text-neutral-900 mb-1">Avoid shadows and glare</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">
                  Position the camera to minimize shadows and avoid reflective glare on the document.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="text-neutral-400 font-mono text-lg">04</span>
              <div>
                <h3 className="font-medium text-neutral-900 mb-1">Hold camera steady</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">
                  Keep your device steady or place the invoice on a flat surface for a clear, non-blurry image.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4">
          <Button
            onClick={handleBack}
            className="w-full "
          >
            Back
          </Button>
        </div>
      </div>
    </PatientPageWrapper>
  )
}

