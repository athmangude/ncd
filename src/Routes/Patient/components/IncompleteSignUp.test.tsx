import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { MemoryRouter } from "react-router-dom"
import IncompleteSignUp from "./IncompleteSignUp"

const wrap = (ui: ReactNode) => createElement(MemoryRouter, null, ui)

// IncompleteSignUp is decoupled from PatientAuthWrapper (it renders inside the
// not-yet-migrated dashboard / complete-profile legacy container, so it keeps
// its plain logo-header layout until Phase 4). These tests guard that layout.
describe("IncompleteSignUp", () => {
  it("renders the sign-up steps and a Continue CTA", () => {
    render(
      wrap(
        <IncompleteSignUp onboardingRedirectLink="/patients/personal-details" />
      )
    )
    expect(screen.getByText("Phone number")).toBeInTheDocument()
    expect(screen.getByText("ID Verification")).toBeInTheDocument()
    expect(screen.getByText("Continue")).toBeInTheDocument()
    expect(screen.getByRole("main")).toBeInTheDocument()
  })

  it("keeps the screen tint on the pay-medical-bill variant", () => {
    render(
      wrap(<IncompleteSignUp onboardingRedirectLink="/x" fromPayMedicalBill />)
    )
    // The bespoke #FDF4FF tint is preserved verbatim (relocate, not restyle).
    expect(document.querySelector(".bg-\\[\\#FDF4FF\\]")).toBeTruthy()
  })
})
