import { useNavigate } from "react-router-dom"
import { Button } from "@/components/Button"
import PatientPageWrapper from "../PatientPageWrapper"

export default function PatientSelfieGuide() {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <PatientPageWrapper title="Taking a good selfie" showHelp={false}>
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <div className="mb-6">
            <p className="text-neutral-500 mt-1">
              Follow these tips to ensure your photo is clear.
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex gap-4">
              <span className="text-neutral-400 font-mono text-lg">01</span>
              <div>
                <h3 className="font-medium text-neutral-900 mb-1">Ensure good lighting</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">
                  Make sure you are well-lit and in focus. Natural light works best.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="text-neutral-400 font-mono text-lg">02</span>
              <div>
                <h3 className="font-medium text-neutral-900 mb-1">Include your whole face</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">
                  Capture your entire face to ensure you are clearly visible.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="text-neutral-400 font-mono text-lg">03</span>
              <div>
                <h3 className="font-medium text-neutral-900 mb-1">Avoid crowds and busy backgrounds</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">
                  Find a plain background and ensure no other people are in the frame.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="text-neutral-400 font-mono text-lg">04</span>
              <div>
                <h3 className="font-medium text-neutral-900 mb-1">Hold camera steady</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">
                  Keep your device steady for a clear, non-blurry image.
                </p>
              </div>
            </div>
          </div>
        </div>


        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white  z-50">
        <div className="max-w-md mx-auto w-full flex gap-4">
          <Button
            onClick={handleBack}
            className="w-full "
          >
            Back
          </Button>
        </div>
        </div>
      </div>
    </PatientPageWrapper>
  )
}

