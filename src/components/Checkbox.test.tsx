import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CheckboxItem } from "./Checkbox"

describe("CheckboxItem label association", () => {
  it("associates the label with its checkbox so tapping the label toggles it", async () => {
    const onChange = vi.fn()
    render(
      <CheckboxItem label="Accept terms" onChange={onChange} checked={false} />
    )

    // Previously htmlFor="terms" matched no id → label click was inert.
    await userEvent.click(screen.getByText("Accept terms"))
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it("gives each instance a unique id so multiple items don't collide", () => {
    render(
      <>
        <CheckboxItem label="First" onChange={() => {}} />
        <CheckboxItem label="Second" onChange={() => {}} />
      </>
    )

    const first = screen.getByText("First").getAttribute("for")
    const second = screen.getByText("Second").getAttribute("for")
    expect(first).toBeTruthy()
    expect(second).toBeTruthy()
    expect(first).not.toBe(second)
  })
})
