import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import FormGroupInput from "./FormGroupInput"
import type { UseFormRegisterReturn } from "react-hook-form"

// Minimal register stub — FormGroupInput only spreads it onto the input.
const register = {
  name: "field",
  onChange: vi.fn(),
  onBlur: vi.fn(),
  ref: vi.fn(),
} as unknown as UseFormRegisterReturn

describe("FormGroupInput PII masking", () => {
  it("adds the .sensitive-data mask class when sensitive is set", () => {
    render(
      <FormGroupInput
        id="idNumber"
        label="National ID number"
        type="text"
        register={register}
        error={undefined}
        sensitive
      />
    )
    expect(screen.getByLabelText("National ID number").className).toContain(
      "sensitive-data"
    )
  })

  it("does not mask by default", () => {
    render(
      <FormGroupInput
        id="nickname"
        label="Nickname"
        type="text"
        register={register}
        error={undefined}
      />
    )
    expect(screen.getByLabelText("Nickname").className).not.toContain(
      "sensitive-data"
    )
  })
})

describe("FormGroupInput controlled (non-RHF) usage", () => {
  it("renders the passed value and fires onChange, without a prefix", () => {
    const onChange = vi.fn()
    render(
      <FormGroupInput
        id="invoiceNumber"
        label="Invoice Number"
        type="text"
        value="INV-001"
        onChange={onChange}
        error={undefined}
      />
    )
    const input = screen.getByLabelText("Invoice Number") as HTMLInputElement
    expect(input.value).toBe("INV-001")
    fireEvent.change(input, { target: { value: "INV-002" } })
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it("renders the passed value and fires onChange, with a prefix (InputGroup path)", () => {
    const onChange = vi.fn()
    render(
      <FormGroupInput
        id="invoiceAmount"
        label="Total Bill Amount"
        type="number"
        prefix="KES"
        value={5000}
        onChange={onChange}
        error={undefined}
      />
    )
    const input = screen.getByLabelText("Total Bill Amount") as HTMLInputElement
    expect(input.value).toBe("5000")
    fireEvent.change(input, { target: { value: "6000" } })
    expect(onChange).toHaveBeenCalledTimes(1)
  })
})
