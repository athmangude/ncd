import { Phone } from "lucide-react"
import { cn } from "@/lib/utils"

const EMERGENCY_NUMBERS = [
  { label: "Emergency (Kenya)", number: "999" },
  { label: "Emergency (International)", number: "112" },
  { label: "Kenya Red Cross", number: "0800 723 253" },
] as const

/**
 * Static emergency card fallback rendered when the dynamic
 * EmergencyCard section fails to load. Displays hardcoded Kenyan
 * emergency numbers so the user always has access to critical
 * contacts, even without API data.
 */
export function EmergencyCardStaticFallback() {
  return (
    <div
      role="alert"
      aria-label="Emergency contacts"
      className={cn(
        "rounded-md border border-destructive/30 bg-destructive/5 p-4",
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <Phone className="size-5 text-destructive" />
        <h3 className="text-sm font-semibold text-foreground">
          Emergency Contacts
        </h3>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        GENERAL — Call these numbers in an emergency
      </p>

      <ul className="flex flex-col gap-2">
        {EMERGENCY_NUMBERS.map(({ label, number }) => (
          <li key={number} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{label}</span>
            <a
              href={`tel:${number.replace(/\s/g, "")}`}
              className={cn(
                "font-mono text-sm font-medium text-destructive",
                "underline underline-offset-2",
              )}
            >
              {number}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
