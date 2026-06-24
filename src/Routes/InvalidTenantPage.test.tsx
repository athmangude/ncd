import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { startMockSession, endMockSession } from "@/mocks/auth/session"

vi.mock("@/hooks/useToast", () => ({ useToast: () => ({ toast: vi.fn() }) }))

import InvalidTenantPage from "./InvalidTenantPage"

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

describe("InvalidTenantPage (AppShell migration)", () => {
  beforeEach(() => {
    endMockSession()
    startMockSession()
  })

  it("renders the invalid-tenant message and Log Out CTA inside the shell", async () => {
    render(wrap(<InvalidTenantPage />))
    expect(await screen.findByText("Invalid Tenant")).toBeInTheDocument()
    expect(screen.getByRole("main")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Log Out" })).toBeInTheDocument()
  })
})
