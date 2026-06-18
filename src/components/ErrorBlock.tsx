import { type ReactNode } from "react"
import { PageMessageWrapper } from "./PageMessageWrapper"

/**
 * Block-level error state for caught errors within a component.
 * Uses the same wrapper as ErrorPage for consistent layout.
 */
export default function ErrorBlock({
  message,
  action,
}: {
  message?: string
  action?: ReactNode
}) {
  return (
    <PageMessageWrapper
      variant="error"
      title="Something went wrong"
      message={
        message ||
        "Please try again later or contact support if the problem persists."
      }
      fullScreen={false}
    >
      {action}
    </PageMessageWrapper>
  )
}
