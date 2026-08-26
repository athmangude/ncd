import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"

// ---------------------------------------------------------------------------
// Mocks — declared before importing the hook under test
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn()
let mockPathname = "/patients/home"

vi.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname: mockPathname }),
  useNavigate: () => mockNavigate,
}))

import { usePatientDashboardTabNavigation } from "./usePatientDashboardTabNavigation"

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("usePatientDashboardTabNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPathname = "/patients/home"
  })

  describe("currentTab derivation", () => {
    it("resolves 'home' from /patients/home", () => {
      mockPathname = "/patients/home"
      const { result } = renderHook(() => usePatientDashboardTabNavigation())
      expect(result.current.currentTab).toBe("home")
    })

    it("resolves 'circle' from /patients/circle", () => {
      mockPathname = "/patients/circle"
      const { result } = renderHook(() => usePatientDashboardTabNavigation())
      expect(result.current.currentTab).toBe("circle")
    })

    it("resolves 'companion' from /patients/companion", () => {
      mockPathname = "/patients/companion"
      const { result } = renderHook(() => usePatientDashboardTabNavigation())
      expect(result.current.currentTab).toBe("companion")
    })

    it("resolves 'explore' from /patients/explore", () => {
      mockPathname = "/patients/explore"
      const { result } = renderHook(() => usePatientDashboardTabNavigation())
      expect(result.current.currentTab).toBe("explore")
    })

    it("resolves 'profile' from /patients/profile", () => {
      mockPathname = "/patients/profile"
      const { result } = renderHook(() => usePatientDashboardTabNavigation())
      expect(result.current.currentTab).toBe("profile")
    })

    it("defaults to 'home' for an unrecognized path segment", () => {
      mockPathname = "/patients/nonexistent"
      const { result } = renderHook(() => usePatientDashboardTabNavigation())
      expect(result.current.currentTab).toBe("home")
    })

    it("defaults to 'home' for the bare /patients/ path", () => {
      mockPathname = "/patients/"
      const { result } = renderHook(() => usePatientDashboardTabNavigation())
      expect(result.current.currentTab).toBe("home")
    })
  })

  describe("tab ordering — companion sits between circle and explore", () => {
    it("moving from circle to companion yields direction = 1 (forward)", () => {
      mockPathname = "/patients/circle"
      const { result, rerender } = renderHook(() =>
        usePatientDashboardTabNavigation()
      )
      expect(result.current.currentTab).toBe("circle")

      mockPathname = "/patients/companion"
      rerender()
      expect(result.current.currentTab).toBe("companion")
      expect(result.current.direction).toBe(1)
    })

    it("moving from companion to circle yields direction = -1 (backward)", () => {
      mockPathname = "/patients/companion"
      const { result, rerender } = renderHook(() =>
        usePatientDashboardTabNavigation()
      )
      expect(result.current.currentTab).toBe("companion")

      mockPathname = "/patients/circle"
      rerender()
      expect(result.current.currentTab).toBe("circle")
      expect(result.current.direction).toBe(-1)
    })

    it("moving from companion to explore yields direction = 1 (forward)", () => {
      mockPathname = "/patients/companion"
      const { result, rerender } = renderHook(() =>
        usePatientDashboardTabNavigation()
      )

      mockPathname = "/patients/explore"
      rerender()
      expect(result.current.direction).toBe(1)
    })

    it("moving from home to companion yields direction = 1 (forward)", () => {
      mockPathname = "/patients/home"
      const { result, rerender } = renderHook(() =>
        usePatientDashboardTabNavigation()
      )

      mockPathname = "/patients/companion"
      rerender()
      expect(result.current.direction).toBe(1)
    })

    it("moving from profile to companion yields direction = -1 (backward)", () => {
      mockPathname = "/patients/profile"
      const { result, rerender } = renderHook(() =>
        usePatientDashboardTabNavigation()
      )

      mockPathname = "/patients/companion"
      rerender()
      expect(result.current.direction).toBe(-1)
    })
  })

  describe("handleTabChange", () => {
    it("calls navigate with the tab value", () => {
      mockPathname = "/patients/home"
      const { result } = renderHook(() => usePatientDashboardTabNavigation())

      act(() => {
        result.current.handleTabChange("companion")
      })

      expect(mockNavigate).toHaveBeenCalledWith("companion")
    })

    it("calls navigate with any string passed to it", () => {
      mockPathname = "/patients/home"
      const { result } = renderHook(() => usePatientDashboardTabNavigation())

      act(() => {
        result.current.handleTabChange("explore")
      })

      expect(mockNavigate).toHaveBeenCalledWith("explore")
    })
  })

  describe("pathname passthrough", () => {
    it("exposes the current pathname from location", () => {
      mockPathname = "/patients/companion"
      const { result } = renderHook(() => usePatientDashboardTabNavigation())
      expect(result.current.pathname).toBe("/patients/companion")
    })
  })
})
