import { Button } from "@/components/Button"
import { Alert, AlertTitle, AlertDescription } from "@/components/Alert"
import { Loader2, MapPin, Check, CircleAlert } from "lucide-react"
import locationMapIllustration from "@/assets/images/location-map-illustration.svg"
import { TabsContent } from "@/components/Tabs"
import { useEffect } from "react"
import { trackEvent, EVENTS } from "@/analytics"

interface LocationPermissionPromptProps {
  onRequestLocation: () => void
  loading: boolean
  permissionStatus?: string
}

export function LocationPermissionPrompt({
  onRequestLocation,
  loading,
  permissionStatus,
}: LocationPermissionPromptProps) {
  const isDenied = permissionStatus === "denied"

  useEffect(() => {
    trackEvent(EVENTS.DISCOVERY.LOCATION_PROMPT_VIEW, {
      permissionStatus: permissionStatus ?? "prompt",
    })
  }, [permissionStatus])

  const handleRequestTap = () => {
    trackEvent(EVENTS.DISCOVERY.LOCATION_REQUEST_TAP)
    onRequestLocation()
  }

  const illustration = (
    <img
      src={locationMapIllustration}
      alt="Location map illustration"
      className="max-w-[84px] w-full h-auto"
    />
  )

  if (loading) {
    return (
      <TabsContent
        value="explore"
        className="flex flex-col w-full h-[calc(100vh-100px)] h-[calc(100dvh-100px)] overflow-y-auto"
      >
        <div className="flex flex-col items-center gap-2 text-center w-full p-4">
          {illustration}
          <h1>Finding facilities near you...</h1>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Loader2 className="h-4 w-4 text-foreground animate-spin" />
            <span className="text-sm text-foreground">Loading...</span>
          </div>
        </div>
      </TabsContent>
    )
  }

  if (isDenied) {
    return (
      <TabsContent
        value="explore"
        className="flex flex-col w-full h-[calc(100vh-100px)] h-[calc(100dvh-100px)] overflow-y-auto"
      >
        <div className="flex flex-col items-center gap-2 text-center w-full p-4">
          {illustration}
          <h1>Finding facilities near you...</h1>
          <Alert
            variant="warning"
            className="flex items-start justify-between gap-3 w-full px-3.5 py-3 mt-2"
          >
            <div className="flex gap-3 items-start flex-1 min-w-0">
              <div className="pt-0.5 shrink-0">
                <CircleAlert className="h-4 w-4" />
              </div>
              <div className="flex flex-col flex-1 min-w-0 text-sm leading-5">
                <AlertTitle>Sharing location access was dismissed</AlertTitle>
                <AlertDescription>
                  To use your current location, allow access in your browser
                  settings and refresh.
                </AlertDescription>
              </div>
            </div>
            <Button size="sm" onClick={handleRequestTap} className="shrink-0">
              Retry
            </Button>
          </Alert>
        </div>
      </TabsContent>
    )
  }

  return (
    <TabsContent
      value="explore"
      className="flex flex-col w-full h-[calc(100vh-100px)] h-[calc(100dvh-100px)] items-center overflow-y-auto"
    >
      <div className="flex flex-col items-center justify-center gap-6 w-full max-w-md p-4 flex-1">
        <div className="flex flex-col items-center gap-2 w-full text-center">
          {illustration}
          <div className="flex flex-col gap-1 text-center w-full">
            <h1>Find care near you</h1>
            <p className="text-sm text-muted-foreground">
              Search by name, area, or service...
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1 w-full">
          {[
            "Find hospitals near you",
            "Get notified of nearby offers",
            "Save your care provider preferences for your next visit",
          ].map((item) => (
            <div
              key={item}
              className="flex items-start gap-2 bg-white rounded-md p-1.5 min-h-8"
            >
              <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                <Check className="h-4 w-4 text-foreground" />
              </div>
              <span className="text-sm text-foreground leading-5">{item}</span>
            </div>
          ))}
        </div>

        <Button className="w-full" onClick={handleRequestTap}>
          <MapPin className="mr-2 h-4 w-4" />
          Use my location
        </Button>
      </div>
    </TabsContent>
  )
}
