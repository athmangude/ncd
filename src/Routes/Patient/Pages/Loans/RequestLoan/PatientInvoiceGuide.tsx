import { useNavigate } from "react-router-dom"
import { Button } from "@/components/Button"
import PatientPageWrapper from "../../PatientPageWrapper"
import invoiceGoodExample from "@/assets/icons/invoice-good-example.png"
import invoiceBadExample from "@/assets/icons/invoice-bad-example.png"
import { X, Check } from "lucide-react"

export default function PatientInvoiceGuide() {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <PatientPageWrapper title="Taking a good invoice photo" showHelp={false}>
      <div className="flex flex-col gap-4">
        <div>
          <div className="grid grid-cols-2 gap-4">
            {/* Bad Example */}
            <div className="relative">
              <div className="aspect-[3/4] bg-neutral-100 rounded-lg overflow-hidden border-2 border-neutral-300">
                <img
                  src={invoiceBadExample}
                  alt="Blurry or angled invoice example"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <X className="w-6 h-6 text-red-500" />
              </div>
            </div>

            {/* Good Example */}
            <div className="relative">
              <div className="aspect-[3/4] bg-neutral-100 rounded-lg overflow-hidden ">
                <img
                  src={invoiceGoodExample}
                  alt="Clear and straight invoice example"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <Check className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <p>
              Follow these tips to ensure your invoice photo is clear and
              readable.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-4">
              <p className="text-neutral-500 font-mono">01</p>
              <div>
                <p>Good lighting</p>
                <p className="text-neutral-500 text-sm">
                  Make sure the invoice is well-lit and in focus.
                </p>
                <p className="text-neutral-500 text-sm">
                  No shadows and avoid reflective glare on the document.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <p className="text-neutral-500 font-mono">02</p>
              <div>
                <p>Include all 4 corners</p>
                <p className="text-neutral-500 text-sm">
                  Ensure all information is visible.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <p className="text-neutral-500 font-mono">03</p>
              <div>
                <p>Steady camera</p>
                <p className="text-neutral-500 text-sm leading-relaxed">
                  Keep your device steady or place the invoice on a flat surface
                  for a clear, non-blurry image.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <Button onClick={handleBack} className="w-full ">
            Back
          </Button>
        </div>
      </div>
    </PatientPageWrapper>
  )
}
