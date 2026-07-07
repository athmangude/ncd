import { useRouteError, isRouteErrorResponse } from "react-router-dom"
import { Button } from "@/components/Button"
import { PageMessageWrapper } from "@/components/PageMessageWrapper"
import AppShell from "@/Routes/AppShell"

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
    <AppShell header={null} footer={null} bodyPadding="none">
      <PageMessageWrapper
        variant="error"
        title="Something went wrong"
        message="We apologize for the inconvenience. Please try refreshing the page."
        className="min-h-full"
      >
        <i className="text-sm text-muted-foreground">{errorMessage}</i>
        <Button
          onClick={() => window.location.reload()}
          variant="default"
          size="lg"
        >
          Reload Page
        </Button>
      </PageMessageWrapper>
    </AppShell>
  )
}
