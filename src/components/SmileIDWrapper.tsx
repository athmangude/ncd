import React, { useEffect, useRef, useState } from "react"
import "@smile_identity/smart-camera-web"

interface SmileIDWrapperProps {
  onSuccess: (detail: any) => void
  captureMode?: "id" | "selfie" | "both"
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "smart-camera-web": any
    }
  }
}

export const SmileIDWrapper: React.FC<SmileIDWrapperProps> = ({
  onSuccess,
  captureMode = "both",
}) => {
  const ref = useRef<HTMLElement>(null)
  const [hasCaptured, setHasCaptured] = useState(false)
  const [shouldUnmount, setShouldUnmount] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element || shouldUnmount) return

    // For selfie-only mode, try to skip the ID frame and go directly to selfie
    if (captureMode === "selfie") {
      try {
        // Try to programmatically advance to selfie frame if the component supports it
        setTimeout(() => {
          if (element && (element as any).skipToSelfie) {
            ;(element as any).skipToSelfie()
          } else if (element && (element as any).setFrame) {
            ;(element as any).setFrame("selfie")
          }
        }, 100)
      } catch {
        // Component might not support these methods
      }
    }

    const handleImagesComputed = (e: CustomEvent) => {
      const { images } = e.detail

      // For single-mode captures, only process the first matching image
      if (hasCaptured && (captureMode === "id" || captureMode === "selfie")) {
        return
      }

      if (captureMode === "id") {
        // Only return ID image (type 3)
        const idImage = images.find((img: any) => img.image_type_id === 3)
        if (idImage) {
          setHasCaptured(true)
          // Immediately call onSuccess
          onSuccess({ images: [idImage] })
          // Force unmount the component to prevent selfie frame from showing
          setShouldUnmount(true)
          // Try multiple methods to stop the component
          try {
            if (element) {
              // Try various methods to stop the component
              if ((element as any).stop) {
                ;(element as any).stop()
              }
              if ((element as any).complete) {
                ;(element as any).complete()
              }
              if ((element as any).cancel) {
                ;(element as any).cancel()
              }
              // Hide the element immediately
              ;(element as any).style.display = "none"
            }
          } catch (err) {
            // Component might not support these methods
            console.warn("Could not stop SmileID component:", err)
          }
        }
      } else if (captureMode === "selfie") {
        // Only return selfie image (type 2)
        // Ignore ID images if they come first
        const selfieImage = images.find((img: any) => img.image_type_id === 2)
        if (selfieImage) {
          setHasCaptured(true)
          onSuccess({ images: [selfieImage] })
          // Force unmount after capturing selfie
          setShouldUnmount(true)
          // Try to stop the component
          try {
            if (element && (element as any).stop) {
              ;(element as any).stop()
            } else if (element && (element as any).complete) {
              ;(element as any).complete()
            }
          } catch {
            // Component might not support stop method
          }
        }
      } else {
        // Return both (default behavior)
        onSuccess(e.detail)
      }
    }

    // Listen for frame change events to know which frame is being shown
    const handleFrameChange = (e: CustomEvent) => {
      // If we're in ID-only mode and the selfie frame appears, immediately unmount
      if (captureMode === "id") {
        const frameType = e.detail?.frameType || e.detail?.type || e.detail
        if (frameType === "selfie" || frameType === "face") {
          // If we've already captured the ID, unmount immediately
          if (hasCaptured) {
            setShouldUnmount(true)
            try {
              if (element) {
                ;(element as any).style.display = "none"
              }
            } catch {
              // Ignore
            }
          }
        }
      }
      // If we're in selfie-only mode and the ID frame appears, try to skip it
      else if (captureMode === "selfie") {
        const frameType = e.detail?.frameType || e.detail?.type || e.detail
        if (frameType === "id" || frameType === "document") {
          try {
            // Try to advance to selfie frame
            if (element && (element as any).nextFrame) {
              ;(element as any).nextFrame()
            } else if (element && (element as any).skipToSelfie) {
              ;(element as any).skipToSelfie()
            }
          } catch {
            // Ignore
          }
        }
      }
    }

    element.addEventListener(
      "imagesComputed",
      handleImagesComputed as EventListener
    )

    // Try to listen for frame change events
    try {
      element.addEventListener(
        "frameChange",
        handleFrameChange as EventListener
      )
      element.addEventListener(
        "frame-changed",
        handleFrameChange as EventListener
      )
    } catch {
      // Events might not be available
    }

    return () => {
      element.removeEventListener(
        "imagesComputed",
        handleImagesComputed as EventListener
      )
      try {
        element.removeEventListener(
          "frameChange",
          handleFrameChange as EventListener
        )
        element.removeEventListener(
          "frame-changed",
          handleFrameChange as EventListener
        )
      } catch {
        // Ignore
      }
    }
  }, [onSuccess, captureMode, hasCaptured, shouldUnmount])

  // smart-camera-web with capture-id shows ID frame first, then selfie frame
  // For ID-only mode: capture ID and unmount to prevent selfie frame
  // For selfie-only mode: try to skip ID frame and show selfie frame directly
  // The component will show the appropriate frame based on its internal flow
  if (shouldUnmount && (captureMode === "id" || captureMode === "selfie")) {
    return null
  }

  // Based on README:
  // - Without capture-id: Only captures selfie/liveness
  // - With capture-id: Captures both ID and selfie sequentially
  // There's no ID-only attribute, so for ID we use capture-id and stop after ID capture
  // For selfie-only, we don't use capture-id attribute
  return (
    <smart-camera-web
      ref={ref}
      {...(captureMode === "selfie" ? {} : { "capture-id": true })}
    ></smart-camera-web>
  )
}
