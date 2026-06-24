import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { MemoryRouter } from "react-router-dom"
import IncompleteSignUp from "./IncompleteSignUp"

const wrap = (ui: ReactNode) => createElement(MemoryRouter, null, ui)

// IncompleteSignUp self-shells via AppShell (Phase 4): the routes that render it
// (the "/patients" incomplete state and "/complete-profile") are now passthrough
// in PatientsHome, so the canonical shell draws the frame. These tests guard the
// shell slots and the (intentionally preserved) bespoke tint.
describe("IncompleteSignUp", () => {
  it("renders the sign-up steps and a Continue CTA inside the shell", () => {
    render(
      wrap(
        <IncompleteSignUp onboardingRedirectLink="/patients/personal-details" />
      )
    )
    expect(screen.getByText("Phone number")).toBeInTheDocument()
    expect(screen.getByText("ID Verification")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Continue" })).toBeInTheDocument()
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
