import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const checklist = { isLoading: false, isError: false, data: {} }

vi.mock("../hooks/useOnboardingChecklist", () => ({
  useOnboardingChecklist: () => checklist,
}))
vi.mock("../stores/patientAuthStore", () => ({
  usePatientAuthStore: (selector: (s: unknown) => unknown) =>
    selector({ user: { hasSetPin: true }, signOut: vi.fn() }),
}))
vi.mock("@/hooks/usePatientLoginDetails", () => ({
  usePatientLoginDetails: () => ({ data: undefined, isOffline: false }),
}))
vi.mock("@/hooks/useSetAmplitudeUserId", () => ({
  useSetAmplitudeUserProperties: vi.fn(),
}))
vi.mock("./Dashboard/PatientDashboardTabs", () => ({
  default: () => createElement("div", null, "dashboard-tabs"),
}))
vi.mock("axios", () => ({
  default: { get: vi.fn().mockResolvedValue({ data: { notifications: [] } }) },
}))

import PatientDashboard from "./PatientDashboard"

const wrap = (ui: ReactNode) =>
  createElement(
    QueryClientProvider,
    {
      client: new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
    },
    createElement(MemoryRouter, { initialEntries: ["/patients/home"] }, ui)
  )

describe("PatientDashboard (AppShell migration)", () => {
  it("renders its fixed header and tab content inside the shell frame", () => {
    render(wrap(<PatientDashboard />))
    // AppShell provides the <main> frame; the dashboard keeps its own fixed bar.
    expect(screen.getByRole("main")).toBeInTheDocument()
    expect(screen.getByAltText("Jireh Logo")).toBeInTheDocument()
    expect(screen.getByText("dashboard-tabs")).toBeInTheDocument()
  })
})
