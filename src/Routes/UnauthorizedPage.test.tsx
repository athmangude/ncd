import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import UnauthorizedPage from "./UnauthorizedPage"

describe("UnauthorizedPage", () => {
  it("renders the unauthorized message inside the shell", () => {
    render(<UnauthorizedPage />)
    expect(
      screen.getByRole("heading", { name: "Unauthorized" })
    ).toBeInTheDocument()
    expect(
      screen.getByText(/not authorized to access this page/i)
    ).toBeVisible()
    expect(screen.getByRole("main")).toBeInTheDocument()
  })
})
