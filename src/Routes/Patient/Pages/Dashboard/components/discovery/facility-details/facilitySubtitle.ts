import { Facility } from "../types"

/**
 * Builds the identity-block subtitle, e.g. "Level 5 Hospital".
 * Gracefully degrades when level or type is missing.
 */
export function facilitySubtitle(
  facility: Pick<Facility, "facilityLevel" | "facilityType">
): string {
  const level = formatLevel(facility.facilityLevel)
  const type = facility.facilityType?.trim()

  return [level, type].filter(Boolean).join(" ").replace(/\s+/g, " ").trim()
}

function formatLevel(level: string | undefined | null): string {
  if (!level) return ""
  const match = /^LEVEL_?(\d+)$/i.exec(level)
  if (match) return `Level ${match[1]}`
  if (/^\d+$/.test(level)) return `Level ${level}`
  return level
}
