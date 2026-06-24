import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"

// ErrorPage reads the router error via useRouteError; stub it so the page can
// render outside a data router.
vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom")
  return {
    ...actual,
    useRouteError: () => new Error("boom"),
    isRouteErrorResponse: () => false,
  }
})

import ErrorPage from "./ErrorPage"

describe("ErrorPage", () => {
  it("renders the error message and a reload action inside the shell", () => {
    render(<ErrorPage />)
    expect(screen.getByText("Something went wrong")).toBeInTheDocument()
    expect(screen.getByText("boom")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Reload Page" })
    ).toBeInTheDocument()
    expect(screen.getByRole("main")).toBeInTheDocument()
  })
})
