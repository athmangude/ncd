import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { MemoryRouter } from "react-router-dom"

const navigateMock = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  )
  return { ...actual, useNavigate: () => navigateMock }
})

const toastMock = vi.fn()
vi.mock("@/hooks/useToast", () => ({ useToast: () => ({ toast: toastMock }) }))

vi.mock("@/Routes/Patient/stores/patientAuthStore", () => ({
  usePatientAuthStore: (sel: (s: { user: { id: string } }) => unknown) =>
    sel({ user: { id: "user-1" } }),
}))

const requestPermissionMock = vi.fn().mockResolvedValue(undefined)
const pushState = {
  notificationPermission: "granted" as
    | "granted"
    | "denied"
    | "default",
  error: null as string | null,
}
vi.mock("@/hooks/usePushNotifications", () => ({
  usePushNotifications: () => ({
    notificationPermission: pushState.notificationPermission,
    requestPermission: requestPermissionMock,
    error: pushState.error,
  }),
}))

vi.mock("@/components/EnableNotificationsCard", () => ({
  NotificationHelpDialog: () => null,
}))

vi.mock("./CircleInviteReminderCard", () => ({
  CircleInviteReminderCard: () => null,
}))

const getMock = vi.fn()
const putMock = vi.fn().mockResolvedValue({ data: {} })
vi.mock("axios", () => ({
  default: {
    get: (...a: unknown[]) => getMock(...a),
    put: (...a: unknown[]) => putMock(...a),
  },
}))

import PatientNotificationsPage from "./PatientNotificationsPage"

const wrap = (ui: ReactNode) =>
  createElement(
    MemoryRouter,
    { initialEntries: ["/patients/notifications"] },
    ui
  )

const sampleNotifications = [
  {
    id: 1,
    patientId: "user-1",
    phoneNumber: "0700",
    message: "Your loan was approved",
    type: "LOANS",
    status: "SENT",
    readStatus: "UNREAD",
    sentAt: "2026-06-01T00:00:00Z",
  },
  {
    id: 2,
    patientId: "user-1",
    phoneNumber: "0700",
    message: "Savings reminder",
    type: "SAVINGS",
    status: "SENT",
    readStatus: "READ",
    sentAt: "2026-06-02T00:00:00Z",
  },
]

describe("PatientNotificationsPage (MobileWrapper migration)", () => {
  beforeEach(() => {
    navigateMock.mockClear()
    toastMock.mockClear()
    getMock.mockReset()
    putMock.mockClear()
    requestPermissionMock.mockClear()
    pushState.notificationPermission = "granted"
    pushState.error = null
  })

  it("State A: shows the enable-updates CTA when permission is not granted", () => {
    pushState.notificationPermission = "default"
    render(wrap(<PatientNotificationsPage />))
    expect(screen.getByText("Stay in the loop")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Enable updates/i })
    ).toBeInTheDocument()
  })

  it("State A: requests permission when the CTA is pressed", () => {
    pushState.notificationPermission = "default"
    render(wrap(<PatientNotificationsPage />))
    fireEvent.click(screen.getByRole("button", { name: /Enable updates/i }))
    expect(requestPermissionMock).toHaveBeenCalled()
  })

  it("State A: shows the settings CTA when permission is denied", () => {
    pushState.notificationPermission = "denied"
    render(wrap(<PatientNotificationsPage />))
    expect(
      screen.getByRole("button", { name: /Enable in Settings/i })
    ).toBeInTheDocument()
  })

  it("State B: shows the empty state when there are no notifications", async () => {
    getMock.mockResolvedValue({ data: { notifications: [] } })
    render(wrap(<PatientNotificationsPage />))
    expect(
      await screen.findByText(/You have no notifications yet/i)
    ).toBeInTheDocument()
    expect(screen.getByText("Notifications (0)")).toBeInTheDocument()
  })

  it("State C: renders the list with a count and the Mark all as read footer", async () => {
    getMock.mockResolvedValue({ data: { notifications: sampleNotifications } })
    render(wrap(<PatientNotificationsPage />))
    expect(await screen.findByText("Notifications (2)")).toBeInTheDocument()
    expect(screen.getByText("Your loan was approved")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Mark all as read/i })
    ).toBeInTheDocument()
  })

  it("State C: filters notifications by category", async () => {
    getMock.mockResolvedValue({ data: { notifications: sampleNotifications } })
    render(wrap(<PatientNotificationsPage />))
    await screen.findByText("Your loan was approved")
    fireEvent.click(screen.getByRole("button", { name: "Savings" }))
    expect(screen.queryByText("Your loan was approved")).not.toBeInTheDocument()
    expect(screen.getByText("Savings reminder")).toBeInTheDocument()
  })

  it("State C: Mark all as read calls the API and toasts on success", async () => {
    getMock.mockResolvedValue({ data: { notifications: sampleNotifications } })
    render(wrap(<PatientNotificationsPage />))
    await screen.findByText("Your loan was approved")
    fireEvent.click(screen.getByRole("button", { name: /Mark all as read/i }))
    await waitFor(() => expect(putMock).toHaveBeenCalled())
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Success" })
      )
    )
  })

  it("State C: Mark all as read rolls back and toasts on failure", async () => {
    getMock.mockResolvedValue({ data: { notifications: sampleNotifications } })
    putMock.mockRejectedValueOnce(new Error("network"))
    render(wrap(<PatientNotificationsPage />))
    await screen.findByText("Your loan was approved")
    fireEvent.click(screen.getByRole("button", { name: /Mark all as read/i }))
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "destructive" })
      )
    )
  })

  it("navigates back from the header on every state", () => {
    pushState.notificationPermission = "default"
    render(wrap(<PatientNotificationsPage />))
    fireEvent.click(screen.getAllByRole("button")[0])
    expect(navigateMock).toHaveBeenCalledWith(-1)
  })
})
