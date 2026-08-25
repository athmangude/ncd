import { http, HttpResponse } from "msw"
import { readCollection, writeCollection } from "../db"
import { patchLoginDetails } from "./profile"
import {
  getCareCompanionNotifications,
  markCareCompanionNotificationRead,
  createCareCompanionNotification,
} from "../domain/careCompanion"
import notificationsSeed from "../fixtures/notifications.json"

import type { NotificationType } from "@/types/care-companion"

const NOTIFICATIONS_KEY = "notifications"

interface MockNotification {
  id: number
  patientId: string
  phoneNumber: string
  message: string
  type: "LOANS" | "SAVINGS" | "CIRCLE" | "OTHER"
  status: string
  readStatus: "READ" | "UNREAD"
  sentAt: string
  notificationSubType?: string | null
  relatedEntityId?: string | null
  metadata?: { inviteeFirstName?: string } | null
}

function getNotifications(): MockNotification[] {
  return readCollection<MockNotification>(
    NOTIFICATIONS_KEY,
    notificationsSeed as MockNotification[]
  )
}

export const notificationsHandlers = [
  // List notifications. The page reads `response.data.notifications`.
  http.get("/notifications", () =>
    HttpResponse.json({ notifications: getNotifications() })
  ),

  // Mark every notification as read and persist the change.
  http.put("/notifications/read-all", () => {
    const updated = getNotifications().map((n) => ({
      ...n,
      readStatus: "READ" as const,
    }))
    writeCollection(NOTIFICATIONS_KEY, updated)
    return HttpResponse.json({ message: "All notifications marked as read" })
  }),

  // Send a test push notification (called via fetch in useSendTestNotification).
  http.post("/notifications/push/send", () =>
    HttpResponse.json({
      message: "Notification sent successfully",
      success: true,
    })
  ),

  // -------------------------------------------------------------------------
  // Care Companion Notifications
  // -------------------------------------------------------------------------

  // GET: List all care companion notifications, sorted by scheduledAt desc.
  // Supports ?unreadOnly=true query param to filter to unread only.
  http.get("/api/care-companion/notifications", ({ request }) => {
    const url = new URL(request.url)
    const unreadOnly = url.searchParams.get("unreadOnly") === "true"
    const notifications = getCareCompanionNotifications(unreadOnly)
    return HttpResponse.json(notifications)
  }),

  // PATCH: Mark a single care companion notification as read.
  http.patch("/api/care-companion/notifications/:id/read", ({ params }) => {
    const { id } = params as { id: string }
    const updated = markCareCompanionNotificationRead(id)
    if (!updated) {
      return HttpResponse.json(
        { error: "Notification not found" },
        { status: 404 },
      )
    }
    return HttpResponse.json(updated)
  }),

  // POST: Simulate creating a notification (dev-only).
  http.post(
    "/api/care-companion/notifications/simulate",
    async ({ request }) => {
      const body = (await request.json()) as { type: NotificationType }
      const notification = createCareCompanionNotification(body.type)
      return HttpResponse.json(notification, { status: 201 })
    },
  ),

  // Profile photo upload (multipart). Returns `{ url }` and stores the data URL
  // as the patient's profilePhoto so the avatar updates on refetch.
  http.post("/patients/upload-profile-photo", async ({ request }) => {
    const formData = await request.formData()
    const file = formData.get("file")

    let url = "https://i.pravatar.cc/300"
    if (file instanceof File) {
      const buffer = await file.arrayBuffer()
      const bytes = new Uint8Array(buffer)
      let binary = ""
      for (let i = 0; i < bytes.length; i += 1) {
        binary += String.fromCharCode(bytes[i])
      }
      const base64 = btoa(binary)
      url = `data:${file.type};base64,${base64}`
    }

    // The seeded fixture types profilePhoto as null; widen to string here.
    patchLoginDetails({ profilePhoto: url } as { profilePhoto: string | null })
    return HttpResponse.json({ url })
  }),
]
