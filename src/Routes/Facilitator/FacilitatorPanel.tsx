import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Button } from "@/components/Button"
import { Input } from "@/components/Input"
import { Switch } from "@/components/Switch"
import { useToast } from "@/hooks/useToast"
import { formatMoney } from "@/utilities/currencyUtilities"
import AppShell from "@/Routes/AppShell"
import { BackTitleHeader } from "@/Routes/shell/headers"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/Accordion"

// ── Types ────────────────────────────────────────────────────────────

type WalletType = "MPESA" | "LOAN" | "CASHBACK" | "CARD"
type IdStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED"
type DocStatus = "NONE" | "PENDING" | "PASSED" | "FAILED"

type OnboardingStage =
  | "onboarding"
  | "id_verified"
  | "circle_built"
  | "membership_active"
  | "post_first_payment"

interface PanelLoan {
  id: string
  status: string
  outstandingAmount: number
  patientMedicalInfoRequest?: { facility?: { name?: string } }
}

interface PanelManualRequest {
  id: string
  careProviderName: string
  billAmount: string
  status: string
}

interface WalletEntry {
  type: string
  remainingBalance?: string
  [key: string]: unknown
}

interface PatientCircleInfo {
  filledAccountableSlots?: number
  isFrozen?: boolean
  [key: string]: unknown
}

interface NetworkMemberRow {
  id: string
  first_name: string
  last_name: string
  phone_number: string | null
  relationship: string
  status: string | null
  type: string
}

interface NetworkInviteRow {
  id: string
  first_name: string
  last_name: string
  phone_number: string | null
  status: string | null
  relationship: string | null
}

/**
 * Draft of every field-style setting. Edits accumulate here and only touch the
 * mock state when the facilitator taps Save — so the Save / Cancel footer is the
 * one place changes are confirmed. Discrete actions (approve a request, remove a
 * member, restore a collection) apply immediately, since they are atomic
 * commands rather than buffered field edits.
 */
interface Draft {
  firstName: string
  lastName: string
  phoneNumber: string
  email: string
  accountReference: string
  profilePhoto: string | null
  isVerified: boolean
  hasSetPin: boolean
  hasUploadedMpesaStatement: boolean
  hasVerifiedCrbScore: boolean
  hasAcceptedMedicalConsentForm: boolean
  hasAcceptedLatestTermsAndConditions: boolean
  hasBeenReferred: boolean
  idStatus: IdStatus
  docStatus: DocStatus
  membership: boolean
  creditTotal: string
  creditRemaining: string
  cashback: string
  walletMpesa: string
  walletLoan: string
  walletCashback: string
  walletCard: string
  frozen: boolean
}

/** Everything the panel needs, fetched from Supabase in one batch. */
interface PanelData {
  userId: string
  blob: Record<string, unknown>
  cashbackBalance: number
  loans: PanelLoan[]
  manualRequests: PanelManualRequest[]
  networkMembers: NetworkMemberRow[]
  networkInvites: NetworkInviteRow[]
  collectionCounts: Record<string, number>
}

// ── Constants ────────────────────────────────────────────────────────

const WALLET_FIELDS: [WalletType, keyof Draft][] = [
  ["MPESA", "walletMpesa"],
  ["LOAN", "walletLoan"],
  ["CASHBACK", "walletCashback"],
  ["CARD", "walletCard"],
]

// A 1×1 transparent PNG, enough to exercise the "has a photo" profile state.
const SAMPLE_PHOTO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

const STAGE_ROUTES: Record<OnboardingStage, string> = {
  onboarding: "/patients",
  id_verified: "/patients",
  circle_built: "/patients",
  membership_active: "/patients",
  post_first_payment: "/patients",
}

/** Maps collection keys used in the COLLECTIONS UI to Supabase table names. */
const COLLECTION_TABLE: Record<string, string | null> = {
  "payment-history": "payments",
  "fast-track-transactions": null,
  "care-fund-transactions": "care_fund_transactions",
  "circle-activity": "circle_activity",
  notifications: "notifications",
}

// ── Helpers ──────────────────────────────────────────────────────────

function toIdStatus(value?: string | null): IdStatus {
  if (value === "APPROVED" || value === "PENDING" || value === "REJECTED")
    return value
  return "NONE"
}

function toDocStatus(value?: string | null): DocStatus {
  if (value === "PASSED" || value === "PENDING" || value === "FAILED")
    return value
  return "NONE"
}

/** Fetch every piece of data the facilitator panel needs in parallel. */
async function fetchAllPanelData(): Promise<PanelData> {
  const [
    pdResult,
    walletResult,
    loansResult,
    requestsResult,
    membersResult,
    invitesResult,
    paymentCount,
    cfCount,
    caCount,
    notifCount,
  ] = await Promise.all([
    supabase.from("patient_details").select("data, user_id").maybeSingle(),
    supabase.from("wallets").select("cashback_balance, user_id").maybeSingle(),
    supabase
      .from("loans")
      .select(
        "id, status, outstanding_amount, patient_medical_info_request",
      ),
    supabase
      .from("manual_requests")
      .select("id, care_provider_name, bill_amount, status"),
    supabase
      .from("network_members")
      .select(
        "id, first_name, last_name, phone_number, relationship, status, type",
      ),
    supabase
      .from("network_invites")
      .select(
        "id, first_name, last_name, phone_number, status, relationship",
      ),
    supabase
      .from("payments")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("care_fund_transactions")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("circle_activity")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true }),
  ])

  const blob = (pdResult.data?.data ?? {}) as Record<string, unknown>
  const userId =
    pdResult.data?.user_id ?? walletResult.data?.user_id ?? ""

  return {
    userId,
    blob,
    cashbackBalance: walletResult.data?.cashback_balance ?? 0,
    loans: (loansResult.data ?? []).map((row) => ({
      id: row.id,
      status: row.status ?? "",
      outstandingAmount: row.outstanding_amount ?? 0,
      patientMedicalInfoRequest:
        row.patient_medical_info_request as PanelLoan["patientMedicalInfoRequest"],
    })),
    manualRequests: (requestsResult.data ?? []).map((row) => ({
      id: row.id,
      careProviderName: row.care_provider_name,
      billAmount: row.bill_amount,
      status: row.status ?? "",
    })),
    networkMembers: (membersResult.data ?? []) as NetworkMemberRow[],
    networkInvites: (invitesResult.data ?? []) as NetworkInviteRow[],
    collectionCounts: {
      "payment-history": paymentCount.count ?? 0,
      "fast-track-transactions": 0,
      "care-fund-transactions": cfCount.count ?? 0,
      "circle-activity": caCount.count ?? 0,
      notifications: notifCount.count ?? 0,
    },
  }
}

/** Derive a Draft from fetched panel data (the "last saved" baseline). */
function buildSnapshot(pd: PanelData): Draft {
  const { blob, cashbackBalance } = pd
  const wallets = (
    Array.isArray(blob.wallets) ? blob.wallets : []
  ) as WalletEntry[]
  const getWallet = (type: string) => {
    const w = wallets.find((item) => item.type === type)
    return String(w?.remainingBalance ?? "0")
  }
  const credit = blob.creditLimit as
    | Record<string, unknown>
    | undefined
  const circle = blob.patientCircle as PatientCircleInfo | undefined

  return {
    firstName: String(blob.firstName ?? ""),
    lastName: String(blob.lastName ?? ""),
    phoneNumber: String(blob.phoneNumber ?? ""),
    email: String(blob.email ?? ""),
    accountReference: String(blob.accountReference ?? ""),
    profilePhoto: (blob.profilePhoto as string | null) ?? null,
    isVerified: !!blob.isVerified,
    hasSetPin: !!blob.hasSetPin,
    hasUploadedMpesaStatement: !!blob.hasUploadedMpesaStatement,
    hasVerifiedCrbScore: !!blob.hasVerifiedCrbScore,
    hasAcceptedMedicalConsentForm: !!blob.hasAcceptedMedicalConsentForm,
    hasAcceptedLatestTermsAndConditions:
      !!blob.hasAcceptedLatestTermsAndConditions,
    hasBeenReferred: !!blob.hasBeenReferred,
    idStatus: toIdStatus(blob.idVerificationStatus as string),
    docStatus: toDocStatus(blob.documentVerificationStatus as string),
    membership: !!blob.hasActiveMembership,
    creditTotal: String(credit?.totalCreditLimitAmount ?? "0"),
    creditRemaining: String(credit?.remainingAmount ?? "0"),
    cashback: String(cashbackBalance),
    walletMpesa: getWallet("MPESA"),
    walletLoan: getWallet("LOAN"),
    walletCashback: getWallet("CASHBACK"),
    walletCard: getWallet("CARD"),
    frozen: !!circle?.isFrozen,
  }
}

/** Clear client-side flow state (localStorage / sessionStorage / IDB). */
function clearClientState() {
  const flowKeys = [
    "approved_patient_phone_number",
    "patientReviewInvoice",
    "manualPaymentRequestId",
    "paymentId",
    "paymentResponse",
    "patientSelectPatient",
    "patientTreatmentDetails",
    "kyc_circle_members",
    "fast-track-storage",
    "qrToken",
    "qrSignature",
    "inviteId",
  ]
  flowKeys.forEach((key) => localStorage.removeItem(key))
  try {
    sessionStorage.removeItem("discovery_tab_state")
    sessionStorage.removeItem("sw-purged")
  } catch {
    // ignore — sessionStorage may be unavailable
  }
  try {
    indexedDB?.deleteDatabase("JirehHealthDB")
  } catch {
    // ignore — offline cache is best-effort
  }
}

// ── Component ────────────────────────────────────────────────────────

/**
 * Facilitator-only control panel for usability testing, on the canonical
 * AppShell. The sticky status strip and Quick scenarios stay visible; every
 * other area collapses so you can scan the whole account and open just the one
 * you need. Field edits buffer into a draft and commit on Save (footer);
 * discrete actions and scenario presets apply right away. Not part of any
 * participant journey, so it is intentionally untracked by analytics.
 */
export default function FacilitatorPanel() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const qc = useQueryClient()

  const [panelData, setPanelData] = useState<PanelData | null>(null)
  const snapshotRef = useRef<Draft | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmingFresh, setConfirmingFresh] = useState(false)

  // Initial load
  useEffect(() => {
    fetchAllPanelData().then((data) => {
      setPanelData(data)
      const s = buildSnapshot(data)
      snapshotRef.current = s
      setDraft(s)
      setLoading(false)
    })
  }, [])

  /**
   * Re-fetch panel data from Supabase, reset the snapshot and draft, and
   * invalidate app-wide React Query caches so participant screens pick up
   * the new state.
   */
  async function refreshAll() {
    const freshData = await fetchAllPanelData()
    setPanelData(freshData)
    const s = buildSnapshot(freshData)
    snapshotRef.current = s
    setDraft(s)
    qc.invalidateQueries()
  }

  /**
   * Re-fetch panel data without resetting the draft (preserves unsaved edits
   * while updating the "live" display for discrete actions).
   */
  async function refreshData() {
    const freshData = await fetchAllPanelData()
    setPanelData(freshData)
    qc.invalidateQueries()
  }

  const header = (
    <BackTitleHeader
      title="Facilitator Tools"
      onBack={() => navigate("/patients", { state: { tab: "profile" } })}
    />
  )

  if (loading || !panelData || !draft || !snapshotRef.current) {
    return (
      <AppShell header={header}>
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-muted-foreground">
            Loading panel data...
          </p>
        </div>
      </AppShell>
    )
  }

  // ── Narrowed references for closures ────────────────────────────────
  const data = panelData
  const snapshot = snapshotRef.current

  const changedKeys = (Object.keys(draft) as (keyof Draft)[]).filter(
    (key) => draft[key] !== snapshot[key],
  )
  const dirty = changedKeys.length > 0

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d))
  }

  // ── Discrete commands ─────────────────────────────────────────────

  function afterAction(message: string) {
    toast({ title: message })
    refreshData()
  }

  async function saveDraft() {
    if (!draft) return
    const s = snapshot

    // 1. Handle membership activation via RPC (modifies blob server-side)
    if (draft.membership !== s.membership && draft.membership) {
      await supabase.rpc("rpc_activate_membership")
    }

    // 2. Re-read the blob so RPC-set fields are included
    const { data: currentPd } = await supabase
      .from("patient_details")
      .select("data")
      .maybeSingle()
    const updatedBlob: Record<string, unknown> = {
      ...((currentPd?.data ?? {}) as Record<string, unknown>),
    }

    // 3. Direct profile fields
    const directFields: (keyof Draft)[] = [
      "firstName",
      "lastName",
      "phoneNumber",
      "email",
      "accountReference",
      "profilePhoto",
      "isVerified",
      "hasSetPin",
      "hasUploadedMpesaStatement",
      "hasVerifiedCrbScore",
      "hasAcceptedMedicalConsentForm",
      "hasAcceptedLatestTermsAndConditions",
      "hasBeenReferred",
    ]
    for (const key of directFields) {
      if (draft[key] !== s[key]) updatedBlob[key] = draft[key]
    }

    // 4. ID verification status
    if (draft.idStatus !== s.idStatus) {
      updatedBlob.idVerificationStatus =
        draft.idStatus === "NONE" ? "" : draft.idStatus
      updatedBlob.hasVerifiedId =
        draft.idStatus === "APPROVED" ? "APPROVED" : ""
    }

    // 5. Document verification status
    if (draft.docStatus !== s.docStatus) {
      updatedBlob.documentVerificationStatus =
        draft.docStatus === "NONE" ? "" : draft.docStatus
    }

    // 6. Credit limit
    if (
      draft.creditTotal !== s.creditTotal ||
      draft.creditRemaining !== s.creditRemaining
    ) {
      const existingCredit = updatedBlob.creditLimit as
        | Record<string, unknown>
        | undefined
      updatedBlob.creditLimit = {
        ...existingCredit,
        totalCreditLimitAmount: String(
          Number(draft.creditTotal) || 0,
        ),
        remainingAmount: String(Number(draft.creditRemaining) || 0),
      }
    }

    // 7. Wallet balances inside the blob
    const wallets = Array.isArray(updatedBlob.wallets)
      ? ([...updatedBlob.wallets] as Array<Record<string, unknown>>)
      : []
    for (const [type, key] of WALLET_FIELDS) {
      if (draft[key] !== s[key]) {
        const idx = wallets.findIndex(
          (w) => w.type === type,
        )
        if (idx !== -1) {
          wallets[idx] = {
            ...wallets[idx],
            remainingBalance: String(
              Number(draft[key]) || 0,
            ),
            updatedAt: new Date().toISOString(),
          }
        }
      }
    }
    updatedBlob.wallets = wallets

    // 8. Cashback in the blob's careFundAccount
    if (draft.cashback !== s.cashback) {
      const cfAccount = (updatedBlob.careFundAccount ?? {}) as Record<
        string,
        unknown
      >
      updatedBlob.careFundAccount = {
        ...cfAccount,
        careFundBalance: String(Number(draft.cashback) || 0),
        updatedAt: new Date().toISOString(),
      }
    }

    // 9. Circle frozen state
    if (draft.frozen !== s.frozen) {
      const circleBlob = (updatedBlob.patientCircle ?? {}) as Record<
        string,
        unknown
      >
      updatedBlob.patientCircle = {
        ...circleBlob,
        isFrozen: draft.frozen,
      }
    }

    // 10. Membership deactivation (no RPC; direct blob update)
    if (draft.membership !== s.membership && !draft.membership) {
      updatedBlob.hasActiveMembership = false
      updatedBlob.membershipStatus = "INACTIVE"
      updatedBlob.isBasicMember = true
      updatedBlob.type = "PUBLIC"
    }

    // 11. Write the updated blob to patient_details
    await supabase
      .from("patient_details")
      .update({
        data: updatedBlob,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", data.userId)

    // 12. Sync cashback to the wallets table
    if (draft.cashback !== s.cashback) {
      await supabase
        .from("wallets")
        .update({
          cashback_balance: Number(draft.cashback) || 0,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", data.userId)
    }

    // 13. Refresh panel + app queries
    await refreshAll()
    toast({ title: "Changes saved" })
  }

  function cancelDraft() {
    setDraft(snapshotRef.current)
  }

  // ── Discrete actions ──────────────────────────────────────────────

  async function onApproveRequest(
    id: string,
    status: "APPROVED" | "REJECTED",
  ) {
    await supabase
      .from("manual_requests")
      .update({ status })
      .eq("id", id)
    afterAction(
      status === "APPROVED" ? "Request approved" : "Request rejected",
    )
  }

  async function onRemoveLoan(id: string) {
    await supabase.from("loans").delete().eq("id", id)
    afterAction("Loan removed")
  }

  async function onAddMember() {
    await supabase.from("network_invites").insert({
      id: crypto.randomUUID(),
      user_id: data.userId,
      first_name: "New",
      last_name: "Member",
      phone_number: "+254700000000",
      status: "PENDING",
      relationship: "FRIEND",
    })
    afterAction("Sample invite added")
  }

  // ── Scenarios ─────────────────────────────────────────────────────

  function goScenario(route: string, message: string) {
    qc.invalidateQueries()
    toast({ title: message })
    navigate(route)
  }

  async function onStage(stage: OnboardingStage, label: string) {
    if (stage === "onboarding") {
      await supabase.rpc("rpc_reset_to_onboarding")
    } else {
      await supabase.rpc("rpc_seed_at_stage", { p_stage: stage })
    }
    goScenario(STAGE_ROUTES[stage], `Set to: ${label}`)
  }

  // ── Network actions ───────────────────────────────────────────────

  async function removeMemberAction(id: string) {
    await supabase.from("network_members").delete().eq("id", id)
    afterAction("Member removed")
  }

  async function acceptInviteAction(id: string) {
    const invite = data.networkInvites.find((i) => i.id === id)
    if (invite) {
      await supabase.from("network_members").insert({
        id: crypto.randomUUID(),
        user_id: data.userId,
        first_name: invite.first_name,
        last_name: invite.last_name,
        phone_number: invite.phone_number,
        relationship: invite.relationship ?? "FRIEND",
        type: "ACCOUNTABLE",
        status: "ACTIVE",
        joined_at: new Date().toISOString(),
      })
      await supabase
        .from("network_invites")
        .update({ status: "ACCEPTED" })
        .eq("id", id)
    }
    afterAction("Invite accepted")
  }

  async function removeInviteAction(id: string) {
    await supabase.from("network_invites").delete().eq("id", id)
    afterAction("Invite dropped")
  }

  // Received invites are not yet modelled as a Supabase table. The handlers
  // below exist so the UI section keeps its shape; in practice the array is
  // always empty and these never fire.
  async function acceptReceivedAction(_id: string) {
    afterAction("Invite accepted")
  }
  async function declineReceivedAction(_id: string) {
    afterAction("Invite declined")
  }

  // ── Derived display values (from live panelData, not the draft) ───

  const accountReference = String(data.blob.accountReference ?? "")
  const patientCircle = data.blob.patientCircle as
    | PatientCircleInfo
    | undefined
  const circleFilledAccountable =
    patientCircle?.filledAccountableSlots ?? data.networkMembers.length

  const pendingRequests = data.manualRequests.filter(
    (r) => r.status === "PENDING",
  )
  const pendingInvites = data.networkInvites.filter(
    (i) => i.status === "PENDING",
  )

  // Received invites have no Supabase table yet — empty for now.
  const receivedInvites: Array<{
    id: string
    inviterFirstName: string
    inviterLastName: string
  }> = []

  // ── Render ────────────────────────────────────────────────────────

  const footer = dirty ? (
    <div className="flex items-center gap-2 border-t bg-white p-3">
      <span className="mr-auto pl-1 text-xs text-muted-foreground">
        {changedKeys.length} unsaved{" "}
        {changedKeys.length === 1 ? "change" : "changes"}
      </span>
      <Button variant="outline" size="sm" onClick={cancelDraft}>
        Cancel
      </Button>
      <Button size="sm" onClick={saveDraft}>
        Save changes
      </Button>
    </div>
  ) : null

  return (
    <AppShell header={header} footer={footer}>
      <div className="flex flex-col gap-5">
        {/* Sticky participant status */}
        <div className="sticky top-0 z-10 -mx-4 -mt-4 flex items-center gap-3 border-b bg-white/90 px-4 py-3 backdrop-blur">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {draft.profilePhoto ? (
              <img
                src={draft.profilePhoto}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              initials(draft.firstName, draft.lastName)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {`${draft.firstName} ${draft.lastName}`.trim() ||
                "New participant"}
            </p>
            <p className="truncate font-mono text-xs text-muted-foreground">
              {draft.phoneNumber || "no phone"}
              {accountReference ? ` · ${accountReference}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <StateChip
              tone={draft.membership ? "accent" : "neutral"}
              label={draft.membership ? "Jireh Plus" : "Basic"}
            />
            <StateChip
              tone={draft.hasSetPin && draft.firstName ? "good" : "warn"}
              label={onboardingLabel(draft)}
            />
          </div>
        </div>

        {/* Quick scenarios — always visible */}
        <section className="flex flex-col gap-3">
          <SectionTitle index="1" title="Jump to a scenario" tag="Reloads" />
          <p className="-mt-1 text-xs text-muted-foreground">
            Set the whole account in one tap and land on that screen.
          </p>
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
            Drop at onboarding stage
          </p>
          <div className="flex flex-wrap gap-2">
            {STAGES.map((stage) => (
              <button
                key={stage.id}
                type="button"
                onClick={() => onStage(stage.id, stage.label)}
                className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5"
              >
                {stage.label}
              </button>
            ))}
          </div>
          <div className="mt-1 flex flex-col gap-2">
            <Button
              onClick={async () => {
                await supabase.rpc("rpc_seed_demo_account")
                goScenario("/patients", "Loaded demo (Amina)")
              }}
            >
              Load full demo data (Amina)
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                await supabase.rpc("rpc_reset_to_onboarding")
                goScenario(
                  "/patients",
                  "Activity reset (kept onboarding)",
                )
              }}
            >
              Reset activity (keep onboarding info)
            </Button>
          </div>
        </section>

        {/* Collapsible detail sections */}
        <Accordion type="multiple" className="flex flex-col gap-3">
          {/* Identity */}
          <Panel value="identity" index="2" title="Identity" tag="Draft">
            <TextRow
              label="First name"
              field="login-details · firstName"
              value={draft.firstName}
              onChange={(v) => set("firstName", v)}
            />
            <TextRow
              label="Last name"
              field="login-details · lastName"
              value={draft.lastName}
              onChange={(v) => set("lastName", v)}
            />
            <TextRow
              label="Phone number"
              field="login-details · phoneNumber"
              value={draft.phoneNumber}
              onChange={(v) => set("phoneNumber", v)}
            />
            <TextRow
              label="Email"
              field="login-details · email"
              value={draft.email}
              onChange={(v) => set("email", v)}
            />
            <TextRow
              label="Account reference"
              field="login-details · accountReference"
              value={draft.accountReference}
              onChange={(v) => set("accountReference", v)}
            />
            <Row label="Profile photo" field="login-details · profilePhoto">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  set("profilePhoto", draft.profilePhoto ? null : SAMPLE_PHOTO)
                }
              >
                {draft.profilePhoto ? "Clear" : "Use sample"}
              </Button>
            </Row>
          </Panel>

          {/* Onboarding & verification */}
          <Panel
            value="onboarding"
            index="3"
            title="Onboarding & verification"
            tag="Draft"
          >
            <ToggleRow
              label="Phone verified"
              field="isVerified"
              checked={draft.isVerified}
              onChange={(v) => set("isVerified", v)}
            />
            <ToggleRow
              label="PIN set"
              field="hasSetPin · gates /set-pin"
              checked={draft.hasSetPin}
              onChange={(v) => set("hasSetPin", v)}
            />
            <Row label="ID verification" field="idVerificationStatus">
              <Segmented
                value={draft.idStatus}
                onChange={(v) => set("idStatus", v as IdStatus)}
                options={ID_OPTIONS}
              />
            </Row>
            <Row label="Document check" field="documentVerificationStatus">
              <Segmented
                value={draft.docStatus}
                onChange={(v) => set("docStatus", v as DocStatus)}
                options={DOC_OPTIONS}
              />
            </Row>
            <ToggleRow
              label="M-Pesa statement uploaded"
              field="hasUploadedMpesaStatement"
              checked={draft.hasUploadedMpesaStatement}
              onChange={(v) => set("hasUploadedMpesaStatement", v)}
            />
            <ToggleRow
              label="CRB score checked"
              field="hasVerifiedCrbScore"
              checked={draft.hasVerifiedCrbScore}
              onChange={(v) => set("hasVerifiedCrbScore", v)}
            />
            <ToggleRow
              label="Medical consent signed"
              field="hasAcceptedMedicalConsentForm"
              checked={draft.hasAcceptedMedicalConsentForm}
              onChange={(v) => set("hasAcceptedMedicalConsentForm", v)}
            />
            <ToggleRow
              label="Latest T&Cs accepted"
              field="hasAcceptedLatestTermsAndConditions"
              checked={draft.hasAcceptedLatestTermsAndConditions}
              onChange={(v) => set("hasAcceptedLatestTermsAndConditions", v)}
            />
            <ToggleRow
              label="Came via referral"
              field="hasBeenReferred"
              checked={draft.hasBeenReferred}
              onChange={(v) => set("hasBeenReferred", v)}
            />
          </Panel>

          {/* Membership & credit */}
          <Panel
            value="membership"
            index="4"
            title="Membership & credit"
            tag="Draft"
          >
            <ToggleRow
              label="Jireh Plus"
              field="hasActiveMembership · type"
              checked={draft.membership}
              onChange={(v) => set("membership", v)}
            />
            <MoneyRow
              label="Total credit limit"
              field="creditLimit · total"
              value={draft.creditTotal}
              onChange={(v) => set("creditTotal", v)}
            />
            <MoneyRow
              label="Available to borrow"
              field="creditLimit · remaining"
              value={draft.creditRemaining}
              onChange={(v) => set("creditRemaining", v)}
            />
          </Panel>

          {/* Money */}
          <Panel value="money" index="5" title="Money" tag="Draft">
            <MoneyRow
              label="Cashback balance"
              field="careFundAccount · careFundBalance"
              value={draft.cashback}
              onChange={(v) => set("cashback", v)}
            />
            <MoneyRow
              label="M-Pesa wallet"
              field="wallets · MPESA"
              value={draft.walletMpesa}
              onChange={(v) => set("walletMpesa", v)}
            />
            <MoneyRow
              label="Loan wallet"
              field="wallets · LOAN"
              value={draft.walletLoan}
              onChange={(v) => set("walletLoan", v)}
            />
            <MoneyRow
              label="Cashback wallet"
              field="wallets · CASHBACK"
              value={draft.walletCashback}
              onChange={(v) => set("walletCashback", v)}
            />
            <MoneyRow
              label="Card wallet"
              field="wallets · CARD"
              value={draft.walletCard}
              onChange={(v) => set("walletCard", v)}
            />
          </Panel>

          {/* Circle & network */}
          <Panel value="circle" index="6" title="Circle & network">
            <p className="-mt-1 mb-1 text-xs text-muted-foreground">
              Accountable {circleFilledAccountable}/2 ·{" "}
              {data.networkMembers.length} active ·{" "}
              {pendingInvites.length} invite
              {pendingInvites.length === 1 ? "" : "s"} pending
            </p>
            <ToggleRow
              label="Freeze circle"
              field="patientCircle · isFrozen"
              checked={draft.frozen}
              onChange={(v) => set("frozen", v)}
            />
            {data.networkMembers.map((member) => (
              <ListItem
                key={member.id}
                title={`${member.first_name} ${member.last_name}`}
                subtitle={`${member.relationship ?? "Member"} · active`}
              >
                <MiniButton
                  tone="danger"
                  onClick={() => removeMemberAction(member.id)}
                >
                  Remove
                </MiniButton>
              </ListItem>
            ))}
            {pendingInvites.map((invite) => (
              <ListItem
                key={invite.id}
                title={`${invite.first_name} ${invite.last_name}`}
                subtitle="Sent invite · pending"
              >
                <MiniButton
                  tone="good"
                  onClick={() => acceptInviteAction(invite.id)}
                >
                  Accept
                </MiniButton>
                <MiniButton
                  tone="danger"
                  onClick={() => removeInviteAction(invite.id)}
                >
                  Drop
                </MiniButton>
              </ListItem>
            ))}
            {receivedInvites.map((invite) => (
              <ListItem
                key={invite.id}
                title={`${invite.inviterFirstName} ${invite.inviterLastName}`}
                subtitle="Received invite · pending"
              >
                <MiniButton
                  tone="good"
                  onClick={() => acceptReceivedAction(invite.id)}
                >
                  Accept
                </MiniButton>
                <MiniButton
                  tone="danger"
                  onClick={() => declineReceivedAction(invite.id)}
                >
                  Decline
                </MiniButton>
              </ListItem>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="self-start"
              onClick={onAddMember}
            >
              + Add circle member
            </Button>
          </Panel>

          {/* History & activity */}
          <Panel value="history" index="7" title="History & activity">
            <p className="-mt-1 mb-1 text-xs text-muted-foreground">
              Approve requests, or restore the seed / clear an area.
            </p>

            {pendingRequests.length > 0 && (
              <div className="mb-1 flex flex-col gap-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Pending payment requests
                </p>
                {pendingRequests.map((request) => (
                  <ListItem
                    key={request.id}
                    title={request.careProviderName}
                    subtitle={formatMoney(
                      Number(request.billAmount),
                      "KES",
                    )}
                  >
                    <MiniButton
                      tone="good"
                      onClick={() =>
                        onApproveRequest(request.id, "APPROVED")
                      }
                    >
                      Approve
                    </MiniButton>
                    <MiniButton
                      tone="danger"
                      onClick={() =>
                        onApproveRequest(request.id, "REJECTED")
                      }
                    >
                      Reject
                    </MiniButton>
                  </ListItem>
                ))}
              </div>
            )}

            {data.loans.length > 0 && (
              <div className="mb-1 flex flex-col gap-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Loans
                </p>
                {data.loans.map((loan) => (
                  <ListItem
                    key={loan.id}
                    title={
                      loan.patientMedicalInfoRequest?.facility?.name ??
                      "Loan"
                    }
                    subtitle={`${loan.status} · ${formatMoney(
                      Number(loan.outstandingAmount),
                      "KES",
                    )} due`}
                  >
                    <MiniButton
                      tone="danger"
                      onClick={() => onRemoveLoan(loan.id)}
                    >
                      Remove
                    </MiniButton>
                  </ListItem>
                ))}
              </div>
            )}

            {COLLECTIONS.map((collection) => (
              <CollectionRow
                key={collection.key}
                label={collection.label}
                count={data.collectionCounts[collection.key] ?? 0}
                onRestore={async () => {
                  await supabase.rpc("rpc_seed_demo_account")
                  afterAction(
                    `Restored ${collection.label.toLowerCase()}`,
                  )
                }}
                onClear={async () => {
                  const table = COLLECTION_TABLE[collection.key]
                  if (table) {
                    await supabase
                      .from(table)
                      .delete()
                      .not("id", "is", null)
                  }
                  afterAction(
                    `Cleared ${collection.label.toLowerCase()}`,
                  )
                }}
              />
            ))}
          </Panel>
        </Accordion>

        {/* Danger zone */}
        <section className="flex flex-col gap-2">
          <SectionTitle
            index="8"
            title="Reset"
            tag="Reloads"
            tagTone="danger"
          />
          {confirmingFresh ? (
            <div className="flex flex-col gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
              <p className="text-sm font-medium text-foreground">
                Start fresh? This wipes everything and returns to the
                phone-number entry — the same as the participant signing out.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={async () => {
                    clearClientState()
                    await supabase.rpc("rpc_reset_to_onboarding")
                    goScenario("/patients", "Started fresh")
                  }}
                >
                  Yes, start fresh
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setConfirmingFresh(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingFresh(true)}
              className="rounded-lg border border-destructive/40 bg-white p-3 text-left"
            >
              <span className="block text-sm font-semibold text-destructive">
                Start fresh — new participant
              </span>
              <span className="block text-xs text-destructive/80">
                Wipes everything → phone-number entry. Confirms first.
              </span>
            </button>
          )}
        </section>
      </div>
    </AppShell>
  )
}

// ── Static config ───────────────────────────────────────────────────
const STAGES: { id: OnboardingStage; label: string }[] = [
  { id: "onboarding", label: "Onboarding" },
  { id: "id_verified", label: "ID verified" },
  { id: "circle_built", label: "Circle built" },
  { id: "membership_active", label: "Membership active" },
  { id: "post_first_payment", label: "Post first payment" },
]

const ID_OPTIONS = [
  { v: "NONE", label: "None" },
  { v: "PENDING", label: "Pending" },
  { v: "APPROVED", label: "Approved" },
  { v: "REJECTED", label: "Rejected" },
]
const DOC_OPTIONS = [
  { v: "NONE", label: "None" },
  { v: "PENDING", label: "Pending" },
  { v: "PASSED", label: "Passed" },
  { v: "FAILED", label: "Failed" },
]

const COLLECTIONS = [
  { key: "payment-history", label: "Payment history" },
  { key: "fast-track-transactions", label: "Fast-track payments" },
  { key: "care-fund-transactions", label: "Cashback ledger" },
  { key: "circle-activity", label: "Circle activity" },
  { key: "notifications", label: "Notifications" },
]

// ── Presentational helpers ──────────────────────────────────────────
function initials(first: string, last: string): string {
  const a = first?.[0] ?? ""
  const b = last?.[0] ?? ""
  return (a + b).toUpperCase() || "?"
}

function onboardingLabel(d: Draft): string {
  if (!d.firstName) return "Needs name"
  if (!d.hasSetPin) return "Needs PIN"
  if (d.idStatus !== "APPROVED") return "Needs ID"
  return "Onboarded"
}

function SectionTitle({
  index,
  title,
  tag,
  tagTone = "reload",
}: {
  index: string
  title: string
  tag?: string
  tagTone?: "reload" | "danger" | "live"
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-4 font-mono text-xs text-primary">{index}</span>
      <h2 className="text-foreground">{title}</h2>
      {tag && (
        <span
          className={cn(
            "ml-auto rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase",
            tagTone === "danger" && "bg-destructive/10 text-destructive",
            tagTone === "reload" && "bg-blue-50 text-blue-700",
            tagTone === "live" && "bg-green-50 text-green-700",
          )}
        >
          {tag}
        </span>
      )}
    </div>
  )
}

function Panel({
  value,
  index,
  title,
  tag,
  children,
}: {
  value: string
  index: string
  title: string
  tag?: string
  children: React.ReactNode
}) {
  return (
    <AccordionItem
      value={value}
      className="rounded-xl border border-border bg-white px-4"
    >
      <AccordionTrigger className="no-underline hover:no-underline">
        <span className="flex items-center gap-2">
          <span className="w-4 font-mono text-xs text-primary">{index}</span>
          <span className="text-sm font-bold text-foreground">{title}</span>
          {tag && (
            <span className="rounded bg-green-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-green-700">
              {tag}
            </span>
          )}
        </span>
      </AccordionTrigger>
      <AccordionContent className="flex flex-col gap-2 text-foreground">
        {children}
      </AccordionContent>
    </AccordionItem>
  )
}

function Row({
  label,
  field,
  children,
}: {
  label: string
  field: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 border-b border-dashed border-border py-2 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="truncate font-mono text-[10px] text-muted-foreground">
          {field}
        </p>
      </div>
      {children}
    </div>
  )
}

function TextRow({
  label,
  field,
  value,
  onChange,
}: {
  label: string
  field: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Row label={label} field={field}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-36"
        aria-label={label}
      />
    </Row>
  )
}

function MoneyRow({
  label,
  field,
  value,
  onChange,
}: {
  label: string
  field: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Row label={label} field={field}>
      <div className="flex items-center">
        <span className="rounded-l-md border border-r-0 border-border bg-muted px-2 py-2 font-mono text-[11px] text-muted-foreground">
          KES
        </span>
        <Input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-24 rounded-l-none text-right tabular-nums"
          aria-label={label}
        />
      </div>
    </Row>
  )
}

function ToggleRow({
  label,
  field,
  checked,
  onChange,
}: {
  label: string
  field: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <Row label={label} field={field}>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </Row>
  )
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string
  options: { v: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <div className="inline-flex gap-0.5 rounded-lg bg-muted p-0.5">
      {options.map((option) => (
        <button
          key={option.v}
          type="button"
          onClick={() => onChange(option.v)}
          className={cn(
            "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
            value === option.v
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function ListItem({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted p-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

function MiniButton({
  tone,
  onClick,
  children,
}: {
  tone?: "good" | "danger"
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border border-border bg-white px-2.5 py-1 text-xs font-medium",
        tone === "good" && "text-green-700",
        tone === "danger" && "text-destructive",
        !tone && "text-muted-foreground",
      )}
    >
      {children}
    </button>
  )
}

function CollectionRow({
  label,
  count,
  onRestore,
  onClear,
}: {
  label: string
  count: number
  onRestore: () => void
  onClear: () => void
}) {
  return (
    <ListItem title={label} subtitle={`${count} item${count === 1 ? "" : "s"}`}>
      <MiniButton onClick={onRestore}>Restore</MiniButton>
      <MiniButton tone="danger" onClick={onClear}>
        Clear
      </MiniButton>
    </ListItem>
  )
}

function StateChip({
  tone,
  label,
}: {
  tone: "good" | "warn" | "neutral" | "accent"
  label: string
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
        tone === "good" && "bg-green-100 text-green-700",
        tone === "warn" && "bg-amber-100 text-amber-700",
        tone === "neutral" && "bg-muted text-muted-foreground",
        tone === "accent" && "bg-primary/10 text-primary",
      )}
    >
      {label}
    </span>
  )
}
