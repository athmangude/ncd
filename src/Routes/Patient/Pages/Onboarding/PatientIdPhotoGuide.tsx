import { useNavigate } from "react-router-dom"
import PatientPageWrapper from "../PatientPageWrapper"
import { PrimaryCTAFooter } from "@/Routes/shell/footers"

export default function PatientIdPhotoGuide() {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <PatientPageWrapper
      title="Taking a good ID photo"
      showHelp={false}
      footer={<PrimaryCTAFooter label="Back" onClick={handleBack} />}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <div className="mb-6">
            <p className="text-muted-foreground mt-1">
              Follow these tips to ensure your ID photo is clear and readable.
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex gap-4">
              <span className="text-muted-foreground font-mono text-lg">01</span>
              <div>
                <h3 className="font-medium text-foreground mb-1">
                  Ensure good lighting
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Make sure the ID is well-lit and in focus. Natural light works
                  best.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="text-muted-foreground font-mono text-lg">02</span>
              <div>
                <h3 className="font-medium text-foreground mb-1">
                  Include all corners
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Capture the entire card including all four corners to ensure
                  all information is visible.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="text-muted-foreground font-mono text-lg">03</span>
              <div>
                <h3 className="font-medium text-foreground mb-1">
                  Avoid shadows and glare
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Position the camera to minimize shadows and avoid reflective
                  glare on the card.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="text-muted-foreground font-mono text-lg">04</span>
              <div>
                <h3 className="font-medium text-foreground mb-1">
                  Hold camera steady
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Keep your device steady or place the ID card on a flat surface
                  for a clear, non-blurry image.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PatientPageWrapper>
  )
}
