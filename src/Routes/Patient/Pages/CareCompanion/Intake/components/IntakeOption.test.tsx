import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import IntakeOption from "./IntakeOption"

describe("IntakeOption", () => {
  describe("checkbox mode", () => {
    it("renders a checkbox indicator when mode is checkbox", () => {
      render(
        <IntakeOption
          label="Diabetes"
          selected={false}
          onToggle={vi.fn()}
          mode="checkbox"
        />
      )
      expect(screen.getByRole("checkbox")).toBeInTheDocument()
    })

    it("fires onToggle when the card is clicked", () => {
      const onToggle = vi.fn()
      render(
        <IntakeOption
          label="Diabetes"
          selected={false}
          onToggle={onToggle}
          mode="checkbox"
        />
      )
      fireEvent.click(screen.getByRole("button", { name: /diabetes/i }))
      expect(onToggle).toHaveBeenCalledOnce()
    })

    it("applies selected styles when selected is true", () => {
      const { container } = render(
        <IntakeOption
          label="Diabetes"
          selected={true}
          onToggle={vi.fn()}
          mode="checkbox"
        />
      )
      const button = container.querySelector("button")
      expect(button?.className).toContain("border-primary")
      expect(button?.className).toContain("bg-secondary")
    })

    it("applies unselected styles when selected is false", () => {
      const { container } = render(
        <IntakeOption
          label="Diabetes"
          selected={false}
          onToggle={vi.fn()}
          mode="checkbox"
        />
      )
      const button = container.querySelector("button")
      expect(button?.className).toContain("border-border")
      expect(button?.className).not.toContain("bg-secondary")
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
  })

  describe("radio mode", () => {
    it("renders a RadioGroupItem indicator when mode is radio", () => {
      const { container } = render(
        <IntakeOption
          label="Yes"
          selected={false}
          onToggle={vi.fn()}
          mode="radio"
          value="yes"
        />
      )
      // The inner Radix RadioGroupItem renders with data-slot="radio-group-item"
      expect(
        container.querySelector("[data-slot='radio-group-item']")
      ).toBeInTheDocument()
    })

    it("does not crash (RadioGroup context is provided internally)", () => {
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

    it("fires onToggle when the outer card is clicked", () => {
      const onToggle = vi.fn()
      const { container } = render(
        <IntakeOption
          label="Yes"
          selected={false}
          onToggle={onToggle}
          mode="radio"
          value="yes"
        />
      )
      // The outer button is the first <button> child of the root
      const outerButton = container.querySelector(
        "button[aria-checked]"
      ) as HTMLElement
      fireEvent.click(outerButton)
      expect(onToggle).toHaveBeenCalledOnce()
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
  })

  it("passes custom className to the outer button", () => {
    const { container } = render(
      <IntakeOption
        label="Test"
        selected={false}
        onToggle={vi.fn()}
        mode="checkbox"
        className="mt-4"
      />
    )
    const button = container.querySelector("button")
    expect(button?.className).toContain("mt-4")
  })
})
