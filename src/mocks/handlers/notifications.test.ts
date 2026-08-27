// @vitest-environment jsdom
import { setupServer } from "msw/node"
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest"
import { notificationsHandlers } from "./notifications"
import careCompanionNotificationsSeed from "../fixtures/care-companion-notifications.json"

const server = setupServer(...notificationsHandlers)
const ORIGIN = window.location.origin

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }))
afterAll(() => server.close())
beforeEach(() => localStorage.clear())

// Helpers

const getNotifications = async (query = "") =>
  fetch(
    `${ORIGIN}/api/companion/notifications${query ? "?" + query : ""}`,
  )

const patchRead = async (id: string) =>
  fetch(`${ORIGIN}/api/companion/notifications/${id}/read`, {
    method: "PATCH",
  })

const simulate = async (type: string) =>
  fetch(`${ORIGIN}/api/companion/notifications/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type }),
  })

// ---------------------------------------------------------------------------
// GET /api/companion/notifications
// ---------------------------------------------------------------------------

describe("GET /api/companion/notifications", () => {
  it("returns all seeded notifications sorted by scheduledAt descending", async () => {
    const res = await getNotifications()
    expect(res.status).toBe(200)
    const data = await res.json()

    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBe(careCompanionNotificationsSeed.length)

    for (let i = 1; i < data.length; i++) {
      const prev = new Date(data[i - 1].scheduledAt).getTime()
      const curr = new Date(data[i].scheduledAt).getTime()
      expect(prev).toBeGreaterThanOrEqual(curr)
    }

    // The most recently scheduled fixture entry should be first.
    expect(data[0].id).toBe("notif-education-weekly-001")
  })

  it("filters to unread-only notifications when unreadOnly=true", async () => {
    const data = await (await getNotifications("unreadOnly=true")).json()

    expect(data.length).toBeGreaterThan(0)
    for (const notification of data) {
      expect(notification.readAt).toBeNull()
    }

    const unreadCount = (
      careCompanionNotificationsSeed as { readAt: string | null }[]
    ).filter((n) => n.readAt === null).length
    expect(data.length).toBe(unreadCount)
  })

  it("returns both read and unread notifications when unreadOnly is omitted", async () => {
    const data = await (await getNotifications()).json()
    const hasRead = data.some(
      (n: { readAt: string | null }) => n.readAt !== null,
    )
    const hasUnread = data.some(
      (n: { readAt: string | null }) => n.readAt === null,
    )
    expect(hasRead).toBe(true)
    expect(hasUnread).toBe(true)
  })

  it("treats unreadOnly=false the same as omitting the param", async () => {
    const withFalse = await (await getNotifications("unreadOnly=false")).json()
    const omitted = await (await getNotifications()).json()
    expect(withFalse.length).toBe(omitted.length)
  })

  it("reflects a notification marked as read (no longer unread-only listed)", async () => {
    await patchRead("notif-refill-reminder-001")
    const data = await (await getNotifications("unreadOnly=true")).json()
    expect(
      data.find((n: { id: string }) => n.id === "notif-refill-reminder-001"),
    ).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// PATCH /api/companion/notifications/:id/read
// ---------------------------------------------------------------------------

describe("PATCH /api/companion/notifications/:id/read", () => {
  it("marks the notification as read with a current ISO timestamp", async () => {
    const before = Date.now()
    const res = await patchRead("notif-refill-reminder-001")
    const after = Date.now()

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.id).toBe("notif-refill-reminder-001")
    expect(data.readAt).not.toBeNull()

    const readAtTime = new Date(data.readAt).getTime()
    expect(readAtTime).toBeGreaterThanOrEqual(before)
    expect(readAtTime).toBeLessThanOrEqual(after)
  })

  it("persists the read state across subsequent GET requests", async () => {
    await patchRead("notif-refill-loan-001")
    const data = await (await getNotifications()).json()
    const updated = data.find(
      (n: { id: string }) => n.id === "notif-refill-loan-001",
    )
    expect(updated.readAt).not.toBeNull()
  })

  it("does not modify other notifications", async () => {
    await patchRead("notif-refill-reminder-001")
    const data = await (await getNotifications()).json()
    const other = data.find(
      (n: { id: string }) => n.id === "notif-lab-reminder-001",
    )
    // Untouched fixture entry keeps its original unread state.
    expect(other.readAt).toBeNull()
  })

  it("returns 404 when the notification id does not exist", async () => {
    const res = await patchRead("notif-does-not-exist")
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe("Notification not found")
  })

  it("marking an already-read notification updates readAt to a newer timestamp", async () => {
    // notif-refill-overdue-001 is already read in the fixture.
    const original = (
      careCompanionNotificationsSeed as { id: string; readAt: string | null }[]
    ).find((n) => n.id === "notif-refill-overdue-001")?.readAt

    const res = await patchRead("notif-refill-overdue-001")
    const data = await res.json()

    expect(data.readAt).not.toBe(original)
    expect(new Date(data.readAt).getTime()).toBeGreaterThan(
      new Date(original as string).getTime(),
    )
  })
})

// ---------------------------------------------------------------------------
// POST /api/companion/notifications/simulate
// ---------------------------------------------------------------------------

describe("POST /api/companion/notifications/simulate", () => {
  it("creates a notification of the requested type and returns 201", async () => {
    const res = await simulate("REFILL_OVERDUE")
    expect(res.status).toBe(201)

    const data = await res.json()
    expect(data.type).toBe("REFILL_OVERDUE")
    expect(data.id).toBeTruthy()
    expect(data.readAt).toBeNull()
    expect(data.title.toLowerCase()).toContain("refill overdue")
    expect(data.body).toContain("REFILL_OVERDUE")
  })

  it("persists the simulated notification so it appears in the list", async () => {
    const created = await (await simulate("LAB_REMINDER")).json()
    const data = await (await getNotifications()).json()
    expect(
      data.some((n: { id: string }) => n.id === created.id),
    ).toBe(true)
  })

  it("generates a unique id for each simulated notification", async () => {
    const first = await (await simulate("EDUCATION_WEEKLY")).json()
    const second = await (await simulate("EDUCATION_WEEKLY")).json()
    expect(first.id).not.toBe(second.id)
  })

  it("does not affect notifications created in a previous, cleared session", async () => {
    await simulate("PREDICTIVE_CREDIT_OFFER")
    localStorage.clear()
    const data = await (await getNotifications()).json()
    expect(data.length).toBe(careCompanionNotificationsSeed.length)
  })
})
