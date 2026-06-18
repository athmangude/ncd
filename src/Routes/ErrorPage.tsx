import { useRouteError, isRouteErrorResponse } from "react-router-dom"
import { Button } from "@/components/Button"
import { PageMessageWrapper } from "@/components/PageMessageWrapper"

export default function ErrorPage() {
  const error = useRouteError() as any

  // Replace this with a logging endpoint to backend
  console.error(error)

  let errorMessage = "Unknown error"
  if (isRouteErrorResponse(error)) {
    errorMessage = `${error.status} ${error.statusText || error.data?.message || "Error"}`
  } else if (error instanceof Error) {
    errorMessage = error.message
  } else if (typeof error === "string") {
    errorMessage = error
  } else if (error?.message) {
    errorMessage = error.message
  }

  return (
    <PageMessageWrapper
      variant="error"
      title="Something went wrong"
      message="We apologize for the inconvenience. Please try refreshing the page."
      fullScreen
    >
      <i className="text-sm text-neutral-500">{errorMessage}</i>
      <Button onClick={() => window.location.reload()} variant="default" size="lg">
        Reload Page
      </Button>
    </PageMessageWrapper>
  )
}
