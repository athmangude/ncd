import { http, HttpResponse } from "msw"
import { readObject, writeObject } from "../db"
import {
  getNetwork,
  acceptInvite,
  removeInvite,
  removeMember,
  getConnectionList,
} from "../domain/network"
import circleActivitySeed from "../fixtures/circle-activity.json"

const CIRCLE_ACTIVITY_KEY = "circle-activity"

type CircleActivityEventType =
  | "MEMBER_JOINED"
  | "MEMBER_REMOVED"
  | "INVITE_REJECTED"

interface CircleActivityEvent {
  id: string
  eventType: CircleActivityEventType
  occurredAt: string
  acknowledgedAt: string | null
  member: {
    id: string
    firstName: string
    lastName: string
    avatarUrl: string | null
  }
  stillQualifiesForBorrowing: boolean
  inviteId?: string
}

interface CircleActivityData {
  events: CircleActivityEvent[]
}

function getCircleActivity(): CircleActivityData {
  return readObject<CircleActivityData>(
    CIRCLE_ACTIVITY_KEY,
    circleActivitySeed as CircleActivityData
  )
}

// Canonical invite payload for the accept-invite landing (both the standard
// InviteDetails view and the "read terms" step). Served for any :inviteId so
// the screen is reachable in the mock harness for QA; carries a custom message
// so the message bubble renders (voiceNoteUrl is omitted — no audio asset to
// stream in the mock).
function buildInvite(inviteId: string) {
  return {
    inviteId,
    status: "PENDING",
    referrerFirstName: "Amina",
    referrerLastName: "Otieno",
    referrerProfilePhoto: null,
    inviteePhoneNumber: null,
    customMessage:
      "Karibu! Join my Jireh Circle so we can support each other with medical bills.",
    voiceNoteUrl: null,
    voiceNoteDuration: 0,
  }
}

export const networkHandlers = [
  http.get("/patient-network/network", () => HttpResponse.json(getNetwork())),

  // Fetch a single invite by id (accept-invite landing). No stored state — the
  // invite is synthesised so the branch renders for QA and tests. The
  // accept/reject/QR-accept POSTs are already served (with real slot mutation)
  // by the misc handlers, so this only fills the missing GET.
  http.get("/patient-network/invite/:inviteId", ({ params }) =>
    HttpResponse.json(buildInvite(String(params.inviteId)))
  ),

  // Simulate the participant's pending circle invites all being accepted. The
  // KYC "Upgrade to Jireh Plus" flow polls this on a 20s timer so a participant
  // who has invited at least 2 people can proceed without a real recipient.
  http.post("/patient-network/auto-accept-invites", () => {
    const pending = getNetwork().invites.filter(
      (invite) => invite.status === "PENDING"
    )
    pending.forEach((invite) => acceptInvite(invite.id))
    return HttpResponse.json({ accepted: pending.length })
  }),

  http.get("/patient-network/circle-activity", () =>
    HttpResponse.json(getCircleActivity())
  ),

  http.post(
    "/patient-network/circle-activity/:eventId/acknowledge",
    ({ params }) => {
      const { eventId } = params
      const data = getCircleActivity()
      const next: CircleActivityData = {
        ...data,
        events: data.events.map((event) =>
          event.id === eventId
            ? { ...event, acknowledgedAt: new Date().toISOString() }
            : event
        ),
      }
      writeObject(CIRCLE_ACTIVITY_KEY, next)
      return new HttpResponse(null, { status: 200 })
    }
  ),

  http.post("/patient-network/remove-invite", async ({ request }) => {
    const { inviteId } = (await request.json()) as { inviteId: string }
    // Route through the domain helper so the freed reserved slot re-derives.
    removeInvite(inviteId)
    return HttpResponse.json({ message: "Invite removed" })
  }),

  http.post("/patient-network/remove-connection", async ({ request }) => {
    const { connectionId } = (await request.json()) as {
      connectionId: string
      type: "NETWORK" | "CHILD"
    }
    // Route through the domain helper so the freed used slot re-derives.
    removeMember(connectionId)
    return HttpResponse.json({ message: "Connection removed" })
  }),

  http.post("/patient-network/invites/send-reminder", async ({ request }) => {
    await request.json().catch(() => ({}))
    return HttpResponse.json({ sent: 1, throttled: false })
  }),

  http.post("/patient-network/invites/send-reminders", () => {
    const data = getNetwork()
    const sent = data.invites.filter(
      (invite) => invite.status === "PENDING"
    ).length
    return HttpResponse.json({ sent, throttled: false })
  }),

  http.post(
    "/patient-network/invite/:inviteId/acknowledge-rejection",
    ({ params }) => {
      const { inviteId } = params
      const data = getCircleActivity()
      const next: CircleActivityData = {
        ...data,
        events: data.events.map((event) =>
          event.eventType === "INVITE_REJECTED" && event.inviteId === inviteId
            ? { ...event, acknowledgedAt: new Date().toISOString() }
            : event
        ),
      }
      writeObject(CIRCLE_ACTIVITY_KEY, next)
      return new HttpResponse(null, { status: 200 })
    }
  ),

  // Selectable payees derive from the same circle network the upgrade + add
  // flows write to, so newly added members/invites appear immediately.
  http.get("/patient-network/connections", () =>
    HttpResponse.json({ patients: getConnectionList() })
  ),
]
