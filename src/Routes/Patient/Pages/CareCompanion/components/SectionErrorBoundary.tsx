import { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"
import { Button } from "@/components/Button"

interface SectionErrorBoundaryProps {
  sectionName: string
  children: ReactNode
  fallbackContent?: ReactNode
}

interface SectionErrorBoundaryState {
  hasError: boolean
}

/**
 * Section-level error boundary for the Care Companion home screen.
 *
 * Wraps individual sections so a crash in one (e.g. Cost Tracker) does
 * not take down the rest of the page. When a child throws, the boundary
 * renders a recoverable fallback card with a Retry button. An optional
 * `fallbackContent` prop lets callers supply a domain-specific fallback
 * (e.g. EmergencyCardStaticFallback) instead of the generic message.
 */
export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): SectionErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log for debugging; Sentry integration can be added later
    console.error(
      `[SectionErrorBoundary] ${this.props.sectionName} crashed:`,
      error,
      errorInfo,
    )
  }

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    // If the caller provided a custom fallback, render it directly
    if (this.props.fallbackContent) {
      return this.props.fallbackContent
    }

    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-3 rounded-md bg-muted p-6 text-center"
      >
        <AlertTriangle className="size-6 text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">
          Unable to load {this.props.sectionName}
        </p>
        <Button variant="outline" size="sm" onClick={this.handleRetry}>
          <RotateCcw data-icon="inline-start" className="size-3.5" />
          Retry
        </Button>
      </div>
    )
  }
}
