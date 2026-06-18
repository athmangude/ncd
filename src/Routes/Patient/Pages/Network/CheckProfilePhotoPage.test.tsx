import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { createElement, type ReactNode } from "react"
import CheckProfilePhotoPage from "./CheckProfilePhotoPage"
import * as localStorageUtils from "@/utilities/localStorage"
import { PENDING_INVITE_KEY } from "./InviteMethodPage"

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

vi.mock("@/Routes/Patient/stores/patientAuthStore", () => ({
  usePatientAuthStore: (sel: (s: { user: null }) => unknown) =>
    sel({ user: null }),
}))

const wrap = (ui: ReactNode) =>
  createElement(
    QueryClientProvider,
    {
      client: new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
    },
    createElement(
      MemoryRouter,
      { initialEntries: ["/patients/network/check-profile-photo"] },
      ui
    )
  )

describe("CheckProfilePhotoPage", () => {
  beforeEach(() => {
    vi.spyOn(localStorageUtils, "getFromLocalStorage").mockImplementation(
      (key) => {
        if (key === PENDING_INVITE_KEY)
          return {
            firstName: "Karimi",
            inviteMethod: "text",
            inviteMessage: "Hello!",
          }
        return null
      }
    )
  })

  it("shows the invitee name in the heading", () => {
    render(wrap(<CheckProfilePhotoPage />))
    expect(screen.getByText(/Let Karimi know it's you/i)).toBeInTheDocument()
  })

  it("shows the Add profile photo button", () => {
    render(wrap(<CheckProfilePhotoPage />))
    expect(
      screen.getByRole("button", { name: /Add profile photo/i })
    ).toBeInTheDocument()
  })

  it("shows Skip for now button", () => {
    render(wrap(<CheckProfilePhotoPage />))
    expect(
      screen.getByRole("button", { name: /Skip for now/i })
    ).toBeInTheDocument()
  })

  it("shows invite message in the preview card for text invites", () => {
    render(wrap(<CheckProfilePhotoPage />))
    expect(screen.getByText("Hello!")).toBeInTheDocument()
  })

  it("shows voice waveform for voice invites", () => {
    vi.spyOn(localStorageUtils, "getFromLocalStorage").mockImplementation(
      (key) => {
        if (key === PENDING_INVITE_KEY)
          return {
            firstName: "Karimi",
            inviteMethod: "voice",
            recordingDuration: 15,
          }
        return null
      }
    )
    render(wrap(<CheckProfilePhotoPage />))
    // Voice flow shows the 0:15 timer
    expect(screen.getByText("0:15")).toBeInTheDocument()
  })
})
