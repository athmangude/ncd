import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { MemoryRouter } from "react-router-dom"
import IncompleteSignUp from "./IncompleteSignUp"

const wrap = (ui: ReactNode) => createElement(MemoryRouter, null, ui)

// IncompleteSignUp self-shells via AppShell (Phase 4): the routes that render it
// (the "/patients" incomplete state and "/complete-profile") are now passthrough
// in PatientsHome, so the canonical shell draws the frame. Task 8 (batch 2)
// dropped the bespoke #FDF4FF canvas tint so the screen inherits the shell's
// single surface instead of painting its own — these tests guard that.
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

  it("paints no custom canvas tint — inherits the shell surface (both variants)", () => {
    // Task 8: the #FDF4FF wash is gone from both the footer and the card body,
    // in every variant, so the screen reads as one surface with the shell.
    const { rerender } = render(
      wrap(<IncompleteSignUp onboardingRedirectLink="/patients/set-pin" />)
    )
    expect(document.querySelector(".bg-\\[\\#FDF4FF\\]")).toBeFalsy()

    rerender(
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
