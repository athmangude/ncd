import { describe, it, expect, beforeEach } from "vitest"
import { useCareCompanionStore } from "./careCompanionStore"

describe("careCompanionStore", () => {
  // Reset the store to initial state before each test
  beforeEach(() => {
    useCareCompanionStore.setState({
      intakeCompleted: false,
      activeAiSessionId: null,
      dismissedOverlayIds: [],
      activeMedicationFilter: null,
      aiPipelineRunning: false,
    })
  })

  describe("initial state", () => {
    it("has correct defaults", () => {
      const state = useCareCompanionStore.getState()
      expect(state.intakeCompleted).toBe(false)
      expect(state.activeAiSessionId).toBeNull()
      expect(state.dismissedOverlayIds).toEqual([])
      expect(state.activeMedicationFilter).toBeNull()
      expect(state.aiPipelineRunning).toBe(false)
    })
  })

  describe("setIntakeCompleted", () => {
    it("sets intake completed to true", () => {
      useCareCompanionStore.getState().setIntakeCompleted(true)
      expect(useCareCompanionStore.getState().intakeCompleted).toBe(true)
    })

    it("sets intake completed to false", () => {
      useCareCompanionStore.getState().setIntakeCompleted(true)
      useCareCompanionStore.getState().setIntakeCompleted(false)
      expect(useCareCompanionStore.getState().intakeCompleted).toBe(false)
    })
  })

  describe("setActiveAiSessionId", () => {
    it("sets session ID", () => {
      useCareCompanionStore.getState().setActiveAiSessionId("session-123")
      expect(useCareCompanionStore.getState().activeAiSessionId).toBe(
        "session-123"
      )
    })

    it("clears session ID with null", () => {
      useCareCompanionStore.getState().setActiveAiSessionId("session-123")
      useCareCompanionStore.getState().setActiveAiSessionId(null)
      expect(useCareCompanionStore.getState().activeAiSessionId).toBeNull()
    })
  })

  describe("dismissOverlay", () => {
    it("adds an overlay ID to dismissed list", () => {
      useCareCompanionStore.getState().dismissOverlay("overlay-1")
      expect(useCareCompanionStore.getState().dismissedOverlayIds).toEqual([
        "overlay-1",
      ])
    })

    it("adds multiple overlay IDs", () => {
      useCareCompanionStore.getState().dismissOverlay("overlay-1")
      useCareCompanionStore.getState().dismissOverlay("overlay-2")
      expect(useCareCompanionStore.getState().dismissedOverlayIds).toEqual([
        "overlay-1",
        "overlay-2",
      ])
    })

    it("is idempotent — dismissing the same overlay twice does not duplicate", () => {
      useCareCompanionStore.getState().dismissOverlay("overlay-1")
      useCareCompanionStore.getState().dismissOverlay("overlay-1")
      expect(useCareCompanionStore.getState().dismissedOverlayIds).toEqual([
        "overlay-1",
      ])
    })
  })

  describe("clearDismissedOverlays", () => {
    it("clears all dismissed overlays", () => {
      useCareCompanionStore.getState().dismissOverlay("overlay-1")
      useCareCompanionStore.getState().dismissOverlay("overlay-2")
      useCareCompanionStore.getState().clearDismissedOverlays()
      expect(useCareCompanionStore.getState().dismissedOverlayIds).toEqual([])
    })

    it("is a no-op when list is already empty", () => {
      useCareCompanionStore.getState().clearDismissedOverlays()
      expect(useCareCompanionStore.getState().dismissedOverlayIds).toEqual([])
    })
  })

  describe("setActiveMedicationFilter", () => {
    it("sets the medication filter", () => {
      useCareCompanionStore.getState().setActiveMedicationFilter("metformin")
      expect(useCareCompanionStore.getState().activeMedicationFilter).toBe(
        "metformin"
      )
    })

    it("clears the filter with null", () => {
      useCareCompanionStore.getState().setActiveMedicationFilter("metformin")
      useCareCompanionStore.getState().setActiveMedicationFilter(null)
      expect(
        useCareCompanionStore.getState().activeMedicationFilter
      ).toBeNull()
    })
  })
})
