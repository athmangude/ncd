import { describe, it, expect, vi, beforeAll, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { createElement, type ReactNode } from "react"
import PatientAddConnection from "./PatientAddConnection"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()
let mockState: Record<string, unknown> = { from: "select-patient" }
vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: mockState, pathname: "/x", search: "" }),
  }
})

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

const mockPost = vi.fn()
vi.mock("axios", () => ({
  default: { post: (...args: unknown[]) => mockPost(...args) },
}))

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

afterEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  mockState = { from: "select-patient" }
})

function wrap(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return createElement(
    QueryClientProvider,
    { client },
    createElement(MemoryRouter, null, ui)
  )
}

async function fillRequiredFields() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/First Name/i), "John")
  await user.type(screen.getByLabelText(/Last Name/i), "Doe")
  return user
}

describe("PatientAddConnection — draft persistence", () => {
  it("persists the draft under an intent-scoped key (payment)", async () => {
    render(wrap(<PatientAddConnection />))
    await fillRequiredFields()

    await waitFor(() => {
      const draft = JSON.parse(
        localStorage.getItem("add-new-connection:payment") || "{}"
      )
      expect(draft.firstName).toBe("John")
      expect(draft.lastName).toBe("Doe")
    })
    // The legacy unscoped key is no longer written.
    expect(localStorage.getItem("add-new-connection")).toBeNull()
  })

  it("clears the persisted draft after a successful add", async () => {
    mockPost.mockResolvedValue({
      data: {
        message: "Invite sent",
        patientId: "p-1",
        firstName: "John",
        lastName: "Doe",
        status: "PENDING",
      },
    })

    // Seed a complete draft so the form rehydrates valid (the relationship
    // Select is awkward to drive in jsdom; this also exercises the rehydrate
    // path the user hits when returning to a half-filled form).
    localStorage.setItem(
      "add-new-connection:payment",
      JSON.stringify({
        firstName: "John",
        lastName: "Doe",
        relationship: "SPOUSE",
        phoneNumber: "0712345678",
        nickname: "",
      })
    )

    render(wrap(<PatientAddConnection />))
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: /Add Connection/i }))

    await waitFor(() => expect(mockPost).toHaveBeenCalled())
    // Draft cleared so the next "Add patient" starts blank.
    await waitFor(() =>
      expect(localStorage.getItem("add-new-connection:payment")).toBeNull()
    )
  })

  it("keeps payment and gift drafts isolated from each other", async () => {
    // Type a payment draft.
    const { unmount } = render(wrap(<PatientAddConnection />))
    await fillRequiredFields()
    await waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem("add-new-connection:payment") || "{}")
          .firstName
      ).toBe("John")
    )
    unmount()

    // Switch to the gift intent — it must not inherit the payment draft.
    mockState = { from: "gift-recipient" }
    render(wrap(<PatientAddConnection />))
    expect(
      (screen.getByLabelText(/First Name/i) as HTMLInputElement).value
    ).toBe("")
  })
})
