/**
 * Maps ServiceOffering.category slugs to human-readable labels rendered on
 * the Facility Details page. Categories that haven't been mapped fall back
 * to a Title Case rendering of the slug so we never show raw enum values.
 */
const LABELS: Record<string, string> = {
  outpatient_primary_care: "Outpatient Care",
  inpatient_services: "Inpatient Services",
  critical_care: "Emergency",
  neonatal_services: "Neonatal Services",
  preventive_public_health: "Preventive & Public Health",
  conditional_services: "Conditional Services",
  general: "General",
}

export function serviceCategoryLabel(slug: string): string {
  if (LABELS[slug]) return LABELS[slug]
  return slug
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
}

/** Display order for grouped categories on the About tab. */
export const CATEGORY_ORDER = [
  "outpatient_primary_care",
  "inpatient_services",
  "critical_care",
  "neonatal_services",
  "preventive_public_health",
  "conditional_services",
  "general",
]

export function compareCategorySlugs(a: string, b: string): number {
  const ia = CATEGORY_ORDER.indexOf(a)
  const ib = CATEGORY_ORDER.indexOf(b)
  if (ia === -1 && ib === -1) return a.localeCompare(b)
  if (ia === -1) return 1
  if (ib === -1) return -1
  return ia - ib
}
