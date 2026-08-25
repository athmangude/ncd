import { describe, it, expect, vi } from "vitest"
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

    it("resolves 'care' from /patients/care", () => {
      mockPathname = "/patients/care"
      const { result } = renderHook(() => usePatientDashboardTabNavigation())
      expect(result.current.currentTab).toBe("care")
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

  describe("tab ordering — care sits between circle and explore", () => {
    it("moving from circle to care yields direction = 1 (forward)", () => {
      mockPathname = "/patients/circle"
      const { result, rerender } = renderHook(() =>
        usePatientDashboardTabNavigation()
      )
      expect(result.current.currentTab).toBe("circle")

      mockPathname = "/patients/care"
      rerender()
      expect(result.current.currentTab).toBe("care")
      expect(result.current.direction).toBe(1)
    })

    it("moving from care to circle yields direction = -1 (backward)", () => {
      mockPathname = "/patients/care"
      const { result, rerender } = renderHook(() =>
        usePatientDashboardTabNavigation()
      )
      expect(result.current.currentTab).toBe("care")

      mockPathname = "/patients/circle"
      rerender()
      expect(result.current.currentTab).toBe("circle")
      expect(result.current.direction).toBe(-1)
    })

    it("moving from care to explore yields direction = 1 (forward)", () => {
      mockPathname = "/patients/care"
      const { result, rerender } = renderHook(() =>
        usePatientDashboardTabNavigation()
      )

      mockPathname = "/patients/explore"
      rerender()
      expect(result.current.direction).toBe(1)
    })

    it("moving from home to care yields direction = 1 (forward)", () => {
      mockPathname = "/patients/home"
      const { result, rerender } = renderHook(() =>
        usePatientDashboardTabNavigation()
      )

      mockPathname = "/patients/care"
      rerender()
      expect(result.current.direction).toBe(1)
    })

    it("moving from profile to care yields direction = -1 (backward)", () => {
      mockPathname = "/patients/profile"
      const { result, rerender } = renderHook(() =>
        usePatientDashboardTabNavigation()
      )

      mockPathname = "/patients/care"
      rerender()
      expect(result.current.direction).toBe(-1)
    })
  })

  describe("handleTabChange", () => {
    it("calls navigate with the tab value", () => {
      mockPathname = "/patients/home"
      const { result } = renderHook(() => usePatientDashboardTabNavigation())

      act(() => {
        result.current.handleTabChange("care")
      })

      expect(mockNavigate).toHaveBeenCalledWith("care")
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
      mockPathname = "/patients/care"
      const { result } = renderHook(() => usePatientDashboardTabNavigation())
      expect(result.current.pathname).toBe("/patients/care")
    })
  })
})
