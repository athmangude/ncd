import { create } from "zustand"

export interface CareCompanionState {
  intakeCompleted: boolean
  activeAiSessionId: string | null
  dismissedOverlayIds: string[]
  activeMedicationFilter: string | null
  aiPipelineRunning: boolean
  setIntakeCompleted: (completed: boolean) => void
  setActiveAiSessionId: (sessionId: string | null) => void
  dismissOverlay: (overlayId: string) => void
  clearDismissedOverlays: () => void
  setActiveMedicationFilter: (filter: string | null) => void
  setAiPipelineRunning: (running: boolean) => void
}

export const useCareCompanionStore = create<CareCompanionState>((set) => ({
  intakeCompleted: false,
  activeAiSessionId: null,
  dismissedOverlayIds: [],
  activeMedicationFilter: null,
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
  setAiPipelineRunning: (running: boolean) =>
    set(() => ({ aiPipelineRunning: running })),
}))
