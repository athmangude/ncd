import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import PatientHowCirclesWork from "./PatientHowCirclesWork"

vi.mock("@/Routes/MobileWrapper", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  BackTitleHeader: () => null,
  PrimaryCTAFooter: () => null,
}))

vi.mock("@/analytics", () => ({
  trackEvent: vi.fn(),
  EVENTS: {
    CIRCLE: {
      HOW_IT_WORKS_VIEW: "x",
      HOW_IT_WORKS_CTA_TAP: "x",
      HOW_IT_WORKS_CALL_SUPPORT_TAP: "x",
    },
  },
}))

describe("PatientHowCirclesWork support call", () => {
  const originalLocation = window.location

  beforeEach(() => {
    // Make window.location.href assignable so the tel: dial can be observed.
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: { ...originalLocation, href: "" },
    })
  })

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: originalLocation,
    })
  })

  it("dials the real support number, not the placeholder", () => {
    render(
      <MemoryRouter>
        <PatientHowCirclesWork />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText("Call Jireh Support"))
    expect(window.location.href).toBe("tel:+254117118511")
  })
})
