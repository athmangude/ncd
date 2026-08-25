import { SectionErrorBoundary } from "./components/SectionErrorBoundary"
import { EmergencyCardStaticFallback } from "./components/EmergencyCardStaticFallback"

export default function CareCompanionHome() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <SectionErrorBoundary sectionName="Refill Schedule">
        <section aria-label="Refill Schedule">
          <RefillScheduleSection />
        </section>
      </SectionErrorBoundary>

      <SectionErrorBoundary sectionName="Cost Tracker">
        <section aria-label="Cost Tracker">
          <CostTrackerSection />
        </section>
      </SectionErrorBoundary>

      <SectionErrorBoundary
        sectionName="Emergency Card"
        fallbackContent={<EmergencyCardStaticFallback />}
      >
        <section aria-label="Emergency Card">
          <EmergencyCardSection />
        </section>
      </SectionErrorBoundary>

      <SectionErrorBoundary sectionName="Education Feed">
        <section aria-label="Education Feed">
          <EducationFeedSection />
        </section>
      </SectionErrorBoundary>
    </div>
  )
}

function RefillScheduleSection() {
  return (
    <div className="rounded-md border bg-card p-4">
      <h2 className="text-sm font-semibold text-foreground">
        Refill Schedule
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Your upcoming medication refills will appear here.
      </p>
    </div>
  )
}

function CostTrackerSection() {
  return (
    <div className="rounded-md border bg-card p-4">
      <h2 className="text-sm font-semibold text-foreground">
        Cost Tracker
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Track your healthcare spending over time.
      </p>
    </div>
  )
}

function EmergencyCardSection() {
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
      <h2 className="text-sm font-semibold text-foreground">
        Emergency Card
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Your emergency contacts and medical information.
      </p>
    </div>
  )
}

function EducationFeedSection() {
  return (
    <div className="rounded-md border bg-card p-4">
      <h2 className="text-sm font-semibold text-foreground">
        Education Feed
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Health education articles and resources.
      </p>
    </div>
  )
}
