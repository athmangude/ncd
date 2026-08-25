import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import IntakeOption from "./IntakeOption"

describe("IntakeOption", () => {
  describe("checkbox mode", () => {
    it("renders the label and a checkbox indicator", () => {
      render(
        <IntakeOption
          label="Diabetes"
          selected={false}
          onToggle={vi.fn()}
          mode="checkbox"
        />
      )
      expect(screen.getByText("Diabetes")).toBeInTheDocument()
      expect(
        screen.getByRole("checkbox", { name: "Diabetes" })
      ).toBeInTheDocument()
    })

    it("fires onToggle when the card is clicked", async () => {
      const user = userEvent.setup()
      const onToggle = vi.fn()
      render(
        <IntakeOption
          label="Diabetes"
          selected={false}
          onToggle={onToggle}
          mode="checkbox"
        />
      )
      await user.click(screen.getByText("Diabetes"))
      expect(onToggle).toHaveBeenCalled()
    })

    it("sets aria-checked=true and selected styles when selected", () => {
      render(
        <IntakeOption
          label="Diabetes"
          selected={true}
          onToggle={vi.fn()}
          mode="checkbox"
        />
      )
      const button = screen.getByRole("button")
      expect(button).toHaveAttribute("aria-checked", "true")
      expect(button.className).toContain("border-primary")
      expect(button.className).toContain("bg-secondary")
    })

    it("sets aria-checked=false and unselected styles when not selected", () => {
      render(
        <IntakeOption
          label="Diabetes"
          selected={false}
          onToggle={vi.fn()}
          mode="checkbox"
        />
      )
      const button = screen.getByRole("button")
      expect(button).toHaveAttribute("aria-checked", "false")
      expect(button.className).toContain("border-border")
      expect(button.className).not.toContain("bg-secondary")
    })

    it("renders description text when provided", () => {
      render(
        <IntakeOption
          label="Diabetes"
          description="Type 2 diabetes mellitus"
          selected={false}
          onToggle={vi.fn()}
          mode="checkbox"
        />
      )
      expect(screen.getByText("Type 2 diabetes mellitus")).toBeInTheDocument()
    })

    it("does not render description when omitted", () => {
      render(
        <IntakeOption
          label="Diabetes"
          selected={false}
          onToggle={vi.fn()}
          mode="checkbox"
        />
      )
      expect(screen.queryByText("Type 2 diabetes mellitus")).toBeNull()
    })

    it("toggles correctly across re-renders (unselected -> selected)", () => {
      const { rerender } = render(
        <IntakeOption
          label="Diabetes"
          selected={false}
          onToggle={vi.fn()}
          mode="checkbox"
        />
      )
      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-checked",
        "false"
      )

      rerender(
        <IntakeOption
          label="Diabetes"
          selected={true}
          onToggle={vi.fn()}
          mode="checkbox"
        />
      )
      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-checked",
        "true"
      )
    })
  })

  describe("radio mode", () => {
    it("renders a RadioGroupItem indicator when mode is radio", () => {
      render(
        <IntakeOption
          label="Yes"
          selected={false}
          onToggle={vi.fn()}
          mode="radio"
          value="yes"
        />
      )
      // The outer button gets role="radio" in radio mode
      expect(screen.getByRole("radio", { name: "Yes" })).toBeInTheDocument()
    })

    it("provides its own RadioGroup context so it renders standalone", () => {
      expect(() =>
        render(
          <IntakeOption
            label="Yes"
            selected={false}
            onToggle={vi.fn()}
            mode="radio"
            value="yes"
          />
        )
      ).not.toThrow()
    })

    it("fires onToggle when the outer card is clicked", async () => {
      const user = userEvent.setup()
      const onToggle = vi.fn()
      render(
        <IntakeOption
          label="Yes"
          selected={false}
          onToggle={onToggle}
          mode="radio"
          value="yes"
        />
      )
      await user.click(screen.getByText("Yes"))
      expect(onToggle).toHaveBeenCalled()
    })

    it("uses label as fallback value when value prop is omitted", () => {
      expect(() =>
        render(
          <IntakeOption
            label="No"
            selected={true}
            onToggle={vi.fn()}
            mode="radio"
          />
        )
      ).not.toThrow()
    })

    it("reflects aria-checked on the outer radio button", () => {
      const { rerender } = render(
        <IntakeOption
          label="Option A"
          selected={false}
          onToggle={vi.fn()}
          mode="radio"
          value="a"
        />
      )

      const outerBtn = screen.getByRole("radio", { name: "Option A" })
      expect(outerBtn).toHaveAttribute("aria-checked", "false")

      rerender(
        <IntakeOption
          label="Option A"
          selected={true}
          onToggle={vi.fn()}
          mode="radio"
          value="a"
        />
      )
      expect(outerBtn).toHaveAttribute("aria-checked", "true")
    })
  })

  it("passes custom className to the outer button", () => {
    render(
      <IntakeOption
        label="Test"
        selected={false}
        onToggle={vi.fn()}
        mode="checkbox"
        className="mt-4"
      />
    )
    const button = screen.getByRole("button")
    expect(button.className).toContain("mt-4")
  })
})
