import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
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
