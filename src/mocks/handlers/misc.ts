import { http, HttpResponse } from "msw"
import { makeId, readCollection, writeCollection } from "../db"
import { getLoginDetails, patchLoginDetails } from "./profile"
import { activateMembership } from "../domain/membership"
import { addSentInvite, type SentInvite } from "../domain/network"
import { getTransactionResult } from "./loans"
import discountCodesSeed from "../fixtures/discount-codes.json"

/**
 * Append a PENDING invite to the participant's circle so invites they send are
 * persisted and visible (and count toward their circle). Tolerant of camelCase
 * or snake_case body fields.
 */
function persistSentInvite(
  body: Record<string, unknown>,
  inviteId: string,
  inviteLink: string
): SentInvite {
  const str = (...keys: string[]): string => {
    for (const key of keys) {
      const value = body[key]
      if (typeof value === "string" && value.trim()) return value.trim()
    }
    return ""
  }
  const invite: SentInvite = {
    id: inviteId,
    firstName: str("firstName", "first_name"),
    lastName: str("lastName", "last_name"),
    phoneNumber: str("phoneNumber", "phone_number", "phone"),
    status: "PENDING",
    profilePhoto: null,
    inviteLink,
    nickname: str("nickname") || undefined,
    createdAt: new Date().toISOString(),
    relationship: str("relationship") || "FRIEND",
  }
  // Appends the invite and reserves a circle slot (so slot counts update).
  addSentInvite(invite)
  return invite
}

/**
 * Catch-all handlers for endpoints not owned by a dedicated feature module:
 * dashboard alerts, KYC/identity, discount codes, circle/referral invites,
 * profile + payment misc, and onboarding odds and ends. The goal is that no
 * patient journey hits an unhandled request.
 *
 * Conventions mirror the other handler modules: read editable JSON fixtures,
 * persist user-driven mutations to localStorage via db.ts, return the raw
 * object/array (axios consumers read `response.data` directly) unless the
 * consumer explicitly reads a nested `{ data }` wrapper.
 */

// ---------------------------------------------------------------------------
// localStorage keys owned by this module
// ---------------------------------------------------------------------------

const MPESA_STATEMENTS_KEY = "mpesa-statements"
const CANCELLED_MANUAL_REQUESTS_KEY = "cancelled-manual-requests"

// Uploading an M-Pesa statement raises the interest-free limit up to this amount.
const RAISED_CREDIT_LIMIT = 6000

// The loans module already owns the manual-requests collection. We read the
// same key here (read-only / mark-cancelled) so a detail fetch stays coherent
// with the list, without importing from that module (kept private there).
const MANUAL_REQUESTS_KEY = "manual-requests"

type DiscountCode = (typeof discountCodesSeed)[number]

interface MpesaStatement {
  id: number
  fileName: string
  passcode: string
}

interface ManualRequest {
  id: string
  careProviderName: string
  billAmount: string
  status: string
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const miscHandlers = [
  // === Dashboard alerts ====================================================
  // usePatientDashboardData does `response.data?.alert_id ? response.data : null`,
  // so returning `{}` means "no active alert" (the common case). To exercise the
  // alert card instead, return an object shaped like the DashboardAlert in
  // CallToActions.tsx: { alert_id, priority, title, message, blocking, cta }.
  http.get("/alerts/dashboard", () => HttpResponse.json({})),

  // Consumers (InstallAppPage, CallToActions) fire-and-forget and only inspect
  // errors, so a simple success body is enough.
  http.post("/alerts/INSTALL_APP/dismiss", () =>
    HttpResponse.json({ message: "Alert dismissed" })
  ),
  http.post("/alerts/INSTALL_APP/resolve", () =>
    HttpResponse.json({ message: "Alert resolved" })
  ),

  // === KYC / identity ======================================================
  // PatientVerifyId reads result.data.message and branches on the HTTP status
  // (202 => keep showing the processing page). We return 200 + a message so it
  // proceeds straight to the next onboarding step, and approve the ID locally.
  http.post("/patients/verify-id", async ({ request }) => {
    await request.json().catch(() => ({}))
    patchLoginDetails({
      idVerificationStatus: "APPROVED",
      hasVerifiedId: "APPROVED",
    })
    return HttpResponse.json({ message: "ID verified successfully" })
  }),

  // PatientIdVerification / PatientIdVerificationOnboarding only branch on a
  // 423 error status; success just invalidates login-details and navigates.
  http.post("/patients/verify-id-number", async ({ request }) => {
    await request.json().catch(() => ({}))
    patchLoginDetails({
      idVerificationStatus: "APPROVED",
      hasVerifiedId: "APPROVED",
    })
    return HttpResponse.json({ message: "ID number verified successfully" })
  }),

  // Selfie + ID document match (PatientDocumentVerification, PatientIdSelfie).
  // Multipart; consumers only read success and navigate. Mark KYC approved.
  http.post("/patients/verify-id-photo-selfie-match", async ({ request }) => {
    await request.formData().catch(() => null)
    patchLoginDetails({
      idVerificationStatus: "APPROVED",
      hasVerifiedId: "APPROVED",
      documentVerificationStatus: "PASSED",
    })
    return HttpResponse.json({
      message: "Verification submitted successfully",
      idVerificationStatus: "APPROVED",
      documentVerificationStatus: "PASSED",
    })
  }),

  // === Discount codes ======================================================
  // PatientDiscountDetails reads `response.data?.data` (note the wrapper) and
  // expects extra fields (`status`, `facility`) beyond the eligible-list shape.
  http.get("/discount-codes/:id", ({ params }) => {
    const found = (discountCodesSeed as DiscountCode[]).find(
      (code) => String(code.id) === String(params.id)
    )

    const base = found ?? (discountCodesSeed as DiscountCode[])[0]

    return HttpResponse.json({
      data: {
        ...base,
        status: base.isActive ? "ACTIVE" : "INACTIVE",
        facility: null,
      },
    })
  }),

  // PatientWalletSelection / FastTrackWalletSelection read isValid, discountAmount
  // and message. We compute a discount from the order amount + matched code.
  http.post("/discount-codes/validate", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      code?: string
      orderAmount?: number
    }

    const code = (discountCodesSeed as DiscountCode[]).find(
      (item) =>
        item.code.toUpperCase() === String(body.code || "").toUpperCase()
    )

    if (!code || !code.isValid || !code.isActive) {
      return HttpResponse.json({
        isValid: false,
        discountAmount: "0",
        message: "This discount code is not valid",
      })
    }

    const orderAmount = Number(body.orderAmount) || 0
    let discount =
      code.discountType === "PERCENTAGE"
        ? (orderAmount * Number(code.discountValue)) / 100
        : Number(code.discountValue)

    const max = Number(code.maximumDiscountAmount)
    if (!Number.isNaN(max) && max > 0) {
      discount = Math.min(discount, max)
    }

    return HttpResponse.json({
      isValid: true,
      discountAmount: String(Math.round(discount)),
      message: "Discount code applied",
    })
  }),

  // PatientPaymentConfirmation awaits this but does not read the body.
  http.post("/discount-codes/apply", async ({ request }) => {
    await request.json().catch(() => ({}))
    return HttpResponse.json({ message: "Discount code applied" })
  }),

  // === Circle / referral invites ===========================================
  // PatientAcceptInvite renders referrer name/photo, status, custom message and
  // optional voice note from this single-invite fetch.
  http.get("/patient-network/invite/:inviteId", ({ params }) => {
    return HttpResponse.json({
      inviteId: String(params.inviteId),
      referrerFirstName: "Amina",
      referrerLastName: "Otieno",
      referrerProfilePhoto: null,
      status: "PENDING",
      inviteePhoneNumber: getLoginDetails().phoneNumber,
      customMessage:
        "Join my Jireh circle so we can support each other's medical bills.",
    })
  }),

  // Consumer reads message + meta.inviteStatus (checked for "REJECTED").
  http.post("/patient-network/accept-invite", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      status?: string
    }
    const inviteStatus = body.status === "REJECTED" ? "REJECTED" : "ACCEPTED"
    return HttpResponse.json({
      message:
        inviteStatus === "REJECTED" ? "Invite declined" : "Invite accepted",
      meta: { inviteStatus },
    })
  }),

  // PatientAcceptShareLink renders referrer name + isAlreadyConnected flag.
  http.get("/patient-network/referrer-details/:id", ({ params }) => {
    return HttpResponse.json({
      referrerId: String(params.id),
      referrerFirstName: "Amina",
      referrerLastName: "Otieno",
      isAlreadyConnected: false,
    })
  }),

  // PreviewInvitePage / AddCircleMemberPage read message + inviteLink/inviteId/link.
  http.post("/patient-network/send-invite", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >
    const inviteId = makeId("invite")
    const inviteLink = `/patients/network/accept-invite/${inviteId}`
    const invite = persistSentInvite(body, inviteId, inviteLink)
    return HttpResponse.json({
      message: "Invite sent",
      inviteId,
      inviteLink,
      link: inviteLink,
      // Echo the invitee so the payment flow can preselect the new patient.
      patientId: invite.id,
      firstName: invite.firstName,
      lastName: invite.lastName,
      status: invite.status,
      relationship: invite.relationship,
    })
  }),

  // Voice invite (multipart). Same success shape as send-invite.
  http.post("/circles/invites/voice", async ({ request }) => {
    const form = await request.formData().catch(() => null)
    const body: Record<string, unknown> = {}
    if (form) {
      for (const [key, value] of form.entries()) {
        if (typeof value === "string") body[key] = value
      }
    }
    const inviteId = makeId("invite")
    const inviteLink = `/patients/network/accept-invite/${inviteId}`
    persistSentInvite(body, inviteId, inviteLink)
    return HttpResponse.json({
      message: "Voice invite sent",
      inviteId,
      inviteLink,
      link: inviteLink,
    })
  }),

  // AddCircleMemberPage reads isValid + message before sending the invite.
  http.post("/circles/invites/validate", async ({ request }) => {
    await request.json().catch(() => ({}))
    return HttpResponse.json({ isValid: true, message: "" })
  }),

  // PatientScanQRIntro reads qrCodeUrl. Use a tiny inline SVG data URL so the
  // <img> renders without a binary asset.
  http.post("/circles/invites/qr/generate", () => {
    const svg =
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
          '<rect width="200" height="200" fill="#fff"/>' +
          '<rect x="20" y="20" width="60" height="60" fill="#000"/>' +
          '<rect x="120" y="20" width="60" height="60" fill="#000"/>' +
          '<rect x="20" y="120" width="60" height="60" fill="#000"/>' +
          '<rect x="120" y="120" width="40" height="40" fill="#000"/>' +
          "</svg>"
      )
    return HttpResponse.json({ qrCodeUrl: svg })
  }),

  // QR invite acceptance (PatientAcceptInvite QRInviteDetails) reads message.
  http.post("/circles/invites/qr/accept", async ({ request }) => {
    await request.json().catch(() => ({}))
    return HttpResponse.json({ message: "You have joined the circle" })
  }),

  // Reject an invite (PatientAcceptInvite / InviteRequestCard) — optional message.
  http.post("/circles/invites/:id/reject", () =>
    HttpResponse.json({ message: "Invite declined" })
  ),

  // === Profile / payment misc ==============================================
  // PatientChangePin: the test mocks `{ data: { success: true } }`; success
  // path only relies on the resolved promise.
  http.post("/patients/change-pin", async ({ request }) => {
    await request.json().catch(() => ({}))
    patchLoginDetails({ hasSetPin: true })
    return HttpResponse.json({ success: true, message: "PIN updated" })
  }),

  // PatientMembershipSuccess reads `data.creditLimit` — return the nested shape
  // (mirrors the creditLimit object in patient-login-details.json).
  http.get("/patients/credit-limit", () => {
    const { creditLimit } = getLoginDetails()
    return HttpResponse.json({ creditLimit })
  }),

  // WaitlistDialog awaits but does not read the body.
  http.post("/patients/join-waitlist", async ({ request }) => {
    await request.json().catch(() => ({}))
    return HttpResponse.json({ message: "You have been added to the waitlist" })
  }),

  // PatientHelpAndSupport awaits but does not read the body.
  http.post("/patients/request-callback", async ({ request }) => {
    await request.json().catch(() => ({}))
    return HttpResponse.json({ message: "Callback requested" })
  }),

  // PatientResolveType destructures `type` and routes on it. PATIENT keeps the
  // user in the standard onboarding-success flow.
  http.get("/patients/resolve-type", () =>
    HttpResponse.json({ type: "PATIENT" })
  ),

  // Note: POST /patients/upload-profile-photo is already handled in
  // notifications.ts (it stores the uploaded file as a base64 data URL).

  // === Manual payment request detail / cancel ==============================
  // The loans module seeds + owns the manual-requests collection under this
  // same key; we read it (no re-seed: pass [] so we never clobber it) and fall
  // back to a minimal shape if the list has not been initialised yet.
  http.get("/patients/payments/manual-requests/:id", ({ params }) => {
    const requests = readCollection<ManualRequest>(MANUAL_REQUESTS_KEY, [])
    const found = requests.find((item) => String(item.id) === String(params.id))

    if (found) {
      return HttpResponse.json(found)
    }

    // Minimal safe shape (consumer reads id/careProviderName/billAmount/status).
    return HttpResponse.json({
      id: String(params.id),
      careProviderName: "Healthcare Provider",
      billAmount: "0",
      status: "PENDING",
      paymentInfo: {
        type: "MPTILL",
        tillNumber: "",
        paybillNumber: "",
        accountNumber: "",
      },
      reason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dependent: null,
    })
  }),

  // PatientVerificationPending cancels a pending manual request. Mark it
  // cancelled in the shared collection (if present) so the list stays coherent.
  http.post("/patients/payments/manual-requests/:id/cancel", ({ params }) => {
    const requests = readCollection<ManualRequest>(MANUAL_REQUESTS_KEY, [])
    if (requests.length > 0) {
      const next = requests.map((item) =>
        String(item.id) === String(params.id)
          ? { ...item, status: "CANCELLED" }
          : item
      )
      writeCollection(MANUAL_REQUESTS_KEY, next)
    } else {
      // No shared list yet — at least record the cancellation locally.
      const cancelled = readCollection<string>(
        CANCELLED_MANUAL_REQUESTS_KEY,
        []
      )
      writeCollection(CANCELLED_MANUAL_REQUESTS_KEY, [
        ...cancelled,
        String(params.id),
      ])
    }
    return HttpResponse.json({ message: "Payment request cancelled" })
  }),

  // PatientTransactionResult reads status + amount/date/description fields off
  // the result. Return the real result persisted by the repayment handler when
  // present, else a generic COMPLETED payment so the success screen renders.
  http.get("/patients/payments/transaction-result/:reference", ({ params }) => {
    const reference = String(params.reference)
    const stored = getTransactionResult(reference)
    if (stored) {
      return HttpResponse.json({
        ...stored,
        disbursementTransaction: {
          id: makeId("disb"),
          description: stored.description,
        },
      })
    }

    return HttpResponse.json({
      id: reference,
      status: "COMPLETED",
      totalBillAmount: "5000",
      transactionAmount: "5000",
      updatedAt: new Date().toISOString(),
      transactionDateTime: new Date().toISOString(),
      description: "payment",
      disbursementTransaction: {
        id: makeId("disb"),
        description: "payment",
      },
      paymentSplits: [],
      careFundPotentialAmount: null,
      isLoanRepayment: false,
    })
  }),

  // Patient may have no org. The consumer tolerates {} via `data || {}`.
  http.get("/organizations/patients/get-org-details", () =>
    HttpResponse.json({})
  ),

  // === Financial statements (MPESA) ========================================
  // PatientFinancialStatements(.WithCreditUpdate) read `data.mpesaStatements`.
  http.get("/underwriting/financial-statements", () => {
    const statements = readCollection<MpesaStatement>(MPESA_STATEMENTS_KEY, [])
    return HttpResponse.json({ mpesaStatements: statements })
  }),

  // StatementUploadForm posts multipart; success invalidates the list query.
  // Persist a statement record and flag the profile so onboarding sees it.
  http.post("/underwriting/upload-mpesa-statement", async ({ request }) => {
    const form = await request.formData().catch(() => null)
    const file = form?.get("financialStatementFile")
    const passcode = String(form?.get("passcode") || "")
    const statements = readCollection<MpesaStatement>(MPESA_STATEMENTS_KEY, [])
    const fileName =
      file instanceof File
        ? file.name
        : `mpesa-statement-${statements.length + 1}.pdf`
    const record: MpesaStatement = {
      id: statements.length + 1,
      fileName,
      passcode,
    }
    writeCollection(MPESA_STATEMENTS_KEY, [...statements, record])

    // Uploading a statement raises the interest-free limit up to KES 6,000
    // (matches the "Increase your limit up to KES 6,000" in-app copy). Grant the
    // newly unlocked headroom to the spendable balance too.
    const { creditLimit } = getLoginDetails()
    const currentTotal = Number(creditLimit?.totalCreditLimitAmount || 0)
    const currentRemaining = Number(creditLimit?.remainingAmount || 0)
    const newTotal = Math.max(currentTotal, RAISED_CREDIT_LIMIT)
    const delta = Math.max(0, newTotal - currentTotal)

    patchLoginDetails({
      hasUploadedMpesaStatement: true,
      creditLimit: {
        ...creditLimit,
        totalCreditLimitAmount: String(newTotal),
        remainingAmount: String(currentRemaining + delta),
      },
    })
    return HttpResponse.json({ message: "File uploaded successfully" })
  }),

  // === Referral onboarding =================================================
  // PatientReferralCode (link + skip). Success invalidates login-details.
  http.post("/patients/link-referral", async ({ request }) => {
    await request.json().catch(() => ({}))
    patchLoginDetails({ hasBeenReferred: true })
    return HttpResponse.json({ message: "Referral code applied" })
  }),

  http.post("/patients/skip-referral", async ({ request }) => {
    await request.json().catch(() => ({}))
    return HttpResponse.json({ message: "Referral skipped" })
  }),

  // === Healthcare plan selection ===========================================
  // PatientPayMembership / PatientReviewMembershipDetails redirect only when
  // `authorizationUrl` is truthy; omit it to keep the flow in-app. Paying for
  // Jireh Plus activates membership, which unlocks medical loans + credit.
  http.post("/patients/submit-plan-details", async ({ request }) => {
    await request.json().catch(() => ({}))
    activateMembership()
    return HttpResponse.json({
      message: "Plan details submitted",
      authorizationUrl: "",
    })
  }),
]
