import { create } from "zustand"
import type { CareHistoryFilterKey } from "../components/care-history/CareHistoryFilters"

export interface CareCompanionState {
  intakeCompleted: boolean
  activeAiSessionId: string | null
  dismissedOverlayIds: string[]
  activeMedicationFilter: string | null
  activeEventTypeFilter: CareHistoryFilterKey | null
  activeFacilityFilter: string | null
  aiPipelineRunning: boolean
  setIntakeCompleted: (completed: boolean) => void
  setActiveAiSessionId: (sessionId: string | null) => void
  dismissOverlay: (overlayId: string) => void
  clearDismissedOverlays: () => void
  setActiveMedicationFilter: (filter: string | null) => void
  setActiveEventTypeFilter: (filter: CareHistoryFilterKey | null) => void
  setActiveFacilityFilter: (filter: string | null) => void
  setAiPipelineRunning: (running: boolean) => void
}

export const useCareCompanionStore = create<CareCompanionState>((set) => ({
  intakeCompleted: false,
  activeAiSessionId: null,
  dismissedOverlayIds: [],
  activeMedicationFilter: null,
  activeEventTypeFilter: null,
  activeFacilityFilter: null,
  aiPipelineRunning: false,
  setIntakeCompleted: (completed: boolean) =>
    set(() => ({ intakeCompleted: completed })),
  setActiveAiSessionId: (sessionId: string | null) =>
    set(() => ({ activeAiSessionId: sessionId })),
  dismissOverlay: (overlayId: string) =>
    set((state) => ({
      dismissedOverlayIds: state.dismissedOverlayIds.includes(overlayId)
        ? state.dismissedOverlayIds
        : [...state.dismissedOverlayIds, overlayId],
    })),
  clearDismissedOverlays: () => set(() => ({ dismissedOverlayIds: [] })),
  setActiveMedicationFilter: (filter: string | null) =>
    set(() => ({ activeMedicationFilter: filter })),
  setActiveEventTypeFilter: (filter: CareHistoryFilterKey | null) =>
    set(() => ({ activeEventTypeFilter: filter })),
  setActiveFacilityFilter: (filter: string | null) =>
    set(() => ({ activeFacilityFilter: filter })),
  setAiPipelineRunning: (running: boolean) =>
    set(() => ({ aiPipelineRunning: running })),
}))
