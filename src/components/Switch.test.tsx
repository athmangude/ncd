import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { Switch } from "./Switch"

describe("Switch", () => {
  it("defaults to the original h-6 w-11 track size", () => {
    render(<Switch checked={false} onCheckedChange={vi.fn()} />)
    const track = screen.getByRole("switch")
    expect(track.className).toContain("h-6")
    expect(track.className).toContain("w-11")
  })

  it("size=xs matches the JirehPartnersToggle dimensions (22px track, 18px thumb)", () => {
    render(<Switch size="xs" checked={false} onCheckedChange={vi.fn()} />)
    const track = screen.getByRole("switch")
    expect(track.className).toContain("h-[22px]")
    expect(track.className).toContain("w-10")
  })

  it("size=sm matches the Discovery/Search verified-toggle dimensions (18px track)", () => {
    render(<Switch size="sm" checked={false} onCheckedChange={vi.fn()} />)
    const track = screen.getByRole("switch")
    expect(track.className).toContain("h-[18px]")
    expect(track.className).toContain("w-[33px]")
  })

  it("calls onCheckedChange when toggled", () => {
    const onCheckedChange = vi.fn()
    render(<Switch checked={false} onCheckedChange={onCheckedChange} />)
    fireEvent.click(screen.getByRole("switch"))
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })
})
