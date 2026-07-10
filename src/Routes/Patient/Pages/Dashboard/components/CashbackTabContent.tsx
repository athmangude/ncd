import { PatientCareFund } from "../../PatientCareFund/PatientCareFund"
import { DashboardSection } from "./DashboardStagger"
import type { DashboardAnimationMode } from "./DashboardStagger"

export function CashbackTabContent({
  animationMode,
}: {
  animationMode: DashboardAnimationMode
}) {
  return (
    <DashboardSection mode={animationMode}>
      <PatientCareFund />
    </DashboardSection>
  )
}
