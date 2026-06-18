import { describe, it, expect, vi, beforeAll } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { InvitePreviewCard, StepIndicator } from "./InvitePreviewCard"

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

const smsProps = {
  senderName: "John Njeru",
  inviteMethod: "text" as const,
  inviteMessage: "Join my Jireh Circle!",
}

const voiceProps = {
  senderName: "John Njeru",
  inviteMethod: "voice" as const,
  recordingDuration: 15,
}

describe("InvitePreviewCard", () => {
  it("renders sender name and subtitle", () => {
    render(<InvitePreviewCard {...smsProps} />)
    expect(screen.getByText("John Njeru")).toBeInTheDocument()
    expect(screen.getByText("has invited you to their circle")).toBeInTheDocument()
  })

  it("renders the info pill", () => {
    render(<InvitePreviewCard {...smsProps} />)
    expect(screen.getByText("What is a Jireh Circle?")).toBeInTheDocument()
  })

  it("renders SMS bubble for text invite method", () => {
    render(<InvitePreviewCard {...smsProps} />)
    expect(screen.getByText("Join my Jireh Circle!")).toBeInTheDocument()
    expect(screen.queryByLabelText(/play/i)).not.toBeInTheDocument()
  })

  it("renders voice player for voice invite method", () => {
    render(<InvitePreviewCard {...voiceProps} />)
    expect(screen.getByLabelText("Play")).toBeInTheDocument()
    expect(screen.getByText("0:15")).toBeInTheDocument()
  })

  it("shows Pause label when isPlaying is true", () => {
    render(<InvitePreviewCard {...voiceProps} isPlaying={true} />)
    expect(screen.getByLabelText("Pause")).toBeInTheDocument()
  })

  it("calls onTogglePlay when play button is clicked", () => {
    const onTogglePlay = vi.fn()
    render(<InvitePreviewCard {...voiceProps} onTogglePlay={onTogglePlay} />)
    fireEvent.click(screen.getByLabelText("Play"))
    expect(onTogglePlay).toHaveBeenCalledTimes(1)
  })

  it("renders decorative Accept and Decline buttons", () => {
    render(<InvitePreviewCard {...smsProps} />)
    expect(screen.getByText("Accept")).toBeInTheDocument()
    expect(screen.getByText("Decline")).toBeInTheDocument()
  })

  it("formats duration as m:ss", () => {
    render(<InvitePreviewCard {...voiceProps} recordingDuration={75} />)
    expect(screen.getByText("1:15")).toBeInTheDocument()
  })
})

describe("StepIndicator", () => {
  it("shows the active step number", () => {
    render(<StepIndicator currentStep={3} totalSteps={4} />)
    expect(screen.getByText("3")).toBeInTheDocument()
  })

  it("shows inactive future step number", () => {
    render(<StepIndicator currentStep={3} totalSteps={4} />)
    expect(screen.getByText("4")).toBeInTheDocument()
  })

  it("does not show numbers for completed steps (shows check icon instead)", () => {
    render(<StepIndicator currentStep={3} totalSteps={4} />)
    expect(screen.queryByText("1")).not.toBeInTheDocument()
    expect(screen.queryByText("2")).not.toBeInTheDocument()
  })

  it("shows only the last step number when all steps are complete/active", () => {
    render(<StepIndicator currentStep={4} totalSteps={4} />)
    expect(screen.getByText("4")).toBeInTheDocument()
  })
})
