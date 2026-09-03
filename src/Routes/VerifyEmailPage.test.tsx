import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { startMockSession, endMockSession } from "@/stubs/auth/session"

vi.mock("@/hooks/useToast", () => ({ toast: vi.fn() }))

const getMock = vi.fn().mockResolvedValue({ data: { tenantId: "healthcare" } })
vi.mock("axios", () => ({
  default: { get: (...a: unknown[]) => getMock(...a) },
}))

import VerifyEmailPage from "./VerifyEmailPage"

const wrap = (ui: ReactNode) =>
  createElement(
    QueryClientProvider,
    {
      client: new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
    },
    createElement(MemoryRouter, null, ui)
  )

describe("VerifyEmailPage (AppShell migration)", () => {
  beforeEach(() => {
    endMockSession()
    startMockSession()
    getMock.mockClear()
  })

  it("renders the verification prompt and resend CTA inside the shell", async () => {
    render(wrap(<VerifyEmailPage />))
    expect(await screen.findByText("Email Verification")).toBeInTheDocument()
    expect(screen.getByRole("main")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Send new Link" })
    ).toBeInTheDocument()
  })
})
