import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import MemberLoanRouteGuard from "./MemberLoanRouteGuard"

// The store mock is reassigned per-test so we can flip the user's role.
let mockUser: { type?: string } | undefined

vi.mock("../stores/patientAuthStore", () => ({
  usePatientAuthStore: (sel: (s: { user: typeof mockUser }) => unknown) =>
    sel({ user: mockUser }),
}))

function wrap(ui: ReactNode) {
  return createElement(MemoryRouter, { initialEntries: ["/gated"] }, ui)
}

// Renders the guard as a layout route around a single child route, mirroring how
// PatientsHome wraps the loan-only screens.
function renderGuarded() {
  return render(
    wrap(
      <Routes>
        <Route element={<MemberLoanRouteGuard />}>
          <Route path="/gated" element={<div>gated content</div>} />
        </Route>
      </Routes>
    )
  )
}

describe("MemberLoanRouteGuard", () => {
  it("renders the child route for an eligible loan role", () => {
    mockUser = { type: "PLUS" }
    renderGuarded()
    expect(screen.getByText("gated content")).toBeInTheDocument()
  })

  it("blocks an ineligible role with the not-authorized fallback", () => {
    mockUser = { type: "ORG" }
    renderGuarded()
    expect(screen.queryByText("gated content")).not.toBeInTheDocument()
    expect(screen.getByText(/not authorized/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Go Back/i })).toBeInTheDocument()
  })
})
