import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import LoadingPage from "./LoadingPage"

describe("LoadingPage", () => {
  it("renders the spinner inside a suppressed-slot shell", () => {
    const { container } = render(<LoadingPage />)
    const main = screen.getByRole("main")
    expect(main).toBeInTheDocument()
    // Slots are suppressed (no top bar / bottom bar) and the body centers the spinner.
    expect(container.querySelector("header")).toBeNull()
    expect(main.className).toContain("place-items-center")
    expect(main.querySelector("svg")).toBeTruthy()
  })
})
