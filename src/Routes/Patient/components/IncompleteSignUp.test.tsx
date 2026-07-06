import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { MemoryRouter } from "react-router-dom"
import IncompleteSignUp from "./IncompleteSignUp"

const wrap = (ui: ReactNode) => createElement(MemoryRouter, null, ui)

// IncompleteSignUp self-shells via AppShell (Phase 4): the routes that render it
// (the "/patients" incomplete state and "/complete-profile") are now passthrough
// in PatientsHome, so the canonical shell draws the frame. These tests guard the
// shell slots and the bespoke tint (which the footer and card must agree on).
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

  it("tints both the footer and the card together (no boolean short-circuit)", () => {
    // Default variant: !fromPayMedicalBill || !isCompletingProfile === true, so
    // BOTH the footer and the card body carry #FDF4FF. The old cardClassName
    // cn() short-circuited to a boolean, tinting only the footer (audit §0).
    render(
      wrap(<IncompleteSignUp onboardingRedirectLink="/patients/set-pin" />)
    )
    const tinted = document.querySelectorAll(".bg-\\[\\#FDF4FF\\]")
    expect(tinted.length).toBeGreaterThanOrEqual(2)
  })

  it("drops the tint from both slots on the completing-a-paid-bill variant", () => {
    // Only when fromPayMedicalBill AND isCompletingProfile is the condition
    // false → both slots fall back to bg-white, still in agreement.
    render(
      wrap(
        <IncompleteSignUp
          onboardingRedirectLink="/x"
          fromPayMedicalBill
          isCompletingProfile
        />
      )
    )
    expect(document.querySelector(".bg-\\[\\#FDF4FF\\]")).toBeFalsy()
  })
})
