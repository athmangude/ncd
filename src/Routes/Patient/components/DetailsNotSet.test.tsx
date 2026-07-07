import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { DetailsNotSet } from "./DetailsNotSet"

const mockNavigate = vi.fn()

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderScreen = (
  title = "It looks like you have not set some details yet"
) =>
  render(
    <MemoryRouter>
      <DetailsNotSet title={title} />
    </MemoryRouter>
  )

describe("DetailsNotSet", () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it("renders inside the canonical shell frame (pinned header + footer)", () => {
    renderScreen()
    // Header back control + footer Back CTA are both present.
    expect(screen.getByRole("button", { name: "Go back" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument()
    // The <main> body element proves it is no longer a bare fragment.
    expect(document.querySelector("main")).not.toBeNull()
  })

  it("shows the guard headline", () => {
    renderScreen("It looks like you have not selected a patient")
    expect(
      screen.getByRole("heading", {
        name: "It looks like you have not selected a patient",
      })
    ).toBeInTheDocument()
  })

  it("navigates back from the footer CTA", () => {
    renderScreen()
    fireEvent.click(screen.getByRole("button", { name: "Back" }))
    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  it("navigates back from the header control", () => {
    renderScreen()
    fireEvent.click(screen.getByRole("button", { name: "Go back" }))
    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })
})
