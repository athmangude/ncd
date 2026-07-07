import { useReducer, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { queryClient } from "@/queryClient"
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
import { makeId, readCollection, readObject, writeCollection } from "@/mocks/db"
import { getLoginDetails, patchLoginDetails } from "@/mocks/handlers/profile"
import { LOANS_KEY, MANUAL_REQUESTS_KEY } from "@/mocks/handlers/loans"
import { getCareFundBalance, setCareFundBalance } from "@/mocks/domain/careFund"
import {
  getWalletBalance,
  setWalletBalance,
  type WalletType,
} from "@/mocks/domain/wallets"
import {
  activateMembership,
  deactivateMembership,
} from "@/mocks/domain/membership"
import {
  acceptInvite,
  acceptReceivedInvite,
  addSentInvite,
  declineReceivedInvite,
  getNetwork,
  getPatientCircleSummary,
  removeInvite,
  removeMember,
  setCircleFrozen,
} from "@/mocks/domain/network"
import {
  clearAllParticipantState,
  clearCollection,
  resetCollection,
} from "@/mocks/domain/reset"
import { resetToOnboardingOnly, seedDemoAccount } from "@/mocks/domain/seed"
import { seedAtStage, type OnboardingStage } from "@/mocks/domain/scenarios"
import loansSeed from "@/mocks/fixtures/loans.json"
import manualRequestsSeed from "@/mocks/fixtures/manual-requests.json"

type LoginDetails = ReturnType<typeof getLoginDetails>
type IdStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED"
type DocStatus = "NONE" | "PENDING" | "PASSED" | "FAILED"

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

const WALLET_FIELDS: [WalletType, keyof Draft][] = [
  ["MPESA", "walletMpesa"],
  ["LOAN", "walletLoan"],
  ["CASHBACK", "walletCashback"],
  ["CARD", "walletCard"],
]

// A 1×1 transparent PNG, enough to exercise the "has a photo" profile state.
const SAMPLE_PHOTO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

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

function readSnapshot(): Draft {
  const p = getLoginDetails()
  return {
    firstName: p.firstName ?? "",
    lastName: p.lastName ?? "",
    phoneNumber: p.phoneNumber ?? "",
    email: p.email ?? "",
    accountReference: p.accountReference ?? "",
    profilePhoto: p.profilePhoto ?? null,
    isVerified: !!p.isVerified,
    hasSetPin: !!p.hasSetPin,
    hasUploadedMpesaStatement: !!p.hasUploadedMpesaStatement,
    hasVerifiedCrbScore: !!p.hasVerifiedCrbScore,
    hasAcceptedMedicalConsentForm: !!p.hasAcceptedMedicalConsentForm,
    hasAcceptedLatestTermsAndConditions:
      !!p.hasAcceptedLatestTermsAndConditions,
    hasBeenReferred: !!p.hasBeenReferred,
    idStatus: toIdStatus(p.idVerificationStatus),
    docStatus: toDocStatus(p.documentVerificationStatus),
    membership: !!p.hasActiveMembership,
    creditTotal: String(p.creditLimit?.totalCreditLimitAmount ?? "0"),
    creditRemaining: String(p.creditLimit?.remainingAmount ?? "0"),
    cashback: String(getCareFundBalance()),
    walletMpesa: String(getWalletBalance("MPESA")),
    walletLoan: String(getWalletBalance("LOAN")),
    walletCashback: String(getWalletBalance("CASHBACK")),
    walletCard: String(getWalletBalance("CARD")),
    frozen: getPatientCircleSummary().isFrozen,
  }
}

function getPanelLoans(): PanelLoan[] {
  return readCollection<PanelLoan>(
    LOANS_KEY,
    loansSeed as unknown as PanelLoan[]
  )
}

function getPanelManualRequests(): PanelManualRequest[] {
  return readCollection<PanelManualRequest>(
    MANUAL_REQUESTS_KEY,
    manualRequestsSeed as unknown as PanelManualRequest[]
  )
}

function collectionCount(key: string): number {
  if (key === "payment-history") {
    const o = readObject(key, { payments: [], medicalRequests: [] })
    return o.payments.length + o.medicalRequests.length
  }
  if (key === "care-fund-transactions") {
    return readObject(key, { transactions: [] }).transactions.length
  }
  if (key === "circle-activity") {
    return readObject(key, { events: [] }).events.length
  }
  return readCollection(key, []).length
}

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
  const [, rerender] = useReducer((n: number) => n + 1, 0)
  const snapshotRef = useRef<Draft>(readSnapshot())
  const [draft, setDraft] = useState<Draft>(snapshotRef.current)
  const [confirmingFresh, setConfirmingFresh] = useState(false)

  const profile = getLoginDetails()
  const network = getNetwork()
  const loans = getPanelLoans()
  const pendingRequests = getPanelManualRequests().filter(
    (request) => request.status === "PENDING"
  )
  const pendingInvites = network.invites.filter(
    (invite) => invite.status === "PENDING"
  )

  const snapshot = snapshotRef.current
  const changedKeys = (Object.keys(draft) as (keyof Draft)[]).filter(
    (key) => draft[key] !== snapshot[key]
  )
  const dirty = changedKeys.length > 0

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  // Discrete commands: persist immediately, refetch participant screens, redraw
  // the panel's own readouts — without disturbing any in-progress draft edits.
  function afterAction(message: string) {
    queryClient.invalidateQueries()
    rerender()
    toast({ title: message })
  }

  function saveDraft() {
    const s = snapshotRef.current
    if (draft.membership !== s.membership) {
      if (draft.membership) activateMembership()
      else deactivateMembership()
    }

    const patch: Record<string, unknown> = {}
    const direct: (keyof Draft)[] = [
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
    for (const key of direct) {
      if (draft[key] !== s[key]) patch[key] = draft[key]
    }
    if (draft.idStatus !== s.idStatus) {
      patch.idVerificationStatus =
        draft.idStatus === "NONE" ? "" : draft.idStatus
      patch.hasVerifiedId = draft.idStatus === "APPROVED" ? "APPROVED" : ""
    }
    if (draft.docStatus !== s.docStatus) {
      patch.documentVerificationStatus =
        draft.docStatus === "NONE" ? "" : draft.docStatus
    }
    if (
      draft.creditTotal !== s.creditTotal ||
      draft.creditRemaining !== s.creditRemaining
    ) {
      patch.creditLimit = {
        ...getLoginDetails().creditLimit,
        totalCreditLimitAmount: String(Number(draft.creditTotal) || 0),
        remainingAmount: String(Number(draft.creditRemaining) || 0),
      }
    }
    if (Object.keys(patch).length > 0) {
      patchLoginDetails(patch as Partial<LoginDetails>)
    }

    if (draft.cashback !== s.cashback) {
      setCareFundBalance(Number(draft.cashback) || 0)
    }
    for (const [type, key] of WALLET_FIELDS) {
      if (draft[key] !== s[key]) {
        setWalletBalance(type, Number(draft[key]) || 0)
      }
    }
    if (draft.frozen !== s.frozen) setCircleFrozen(draft.frozen)

    queryClient.invalidateQueries()
    const next = readSnapshot()
    snapshotRef.current = next
    setDraft(next)
    rerender()
    toast({ title: "Changes saved" })
  }

  function cancelDraft() {
    setDraft(snapshotRef.current)
  }

  // ── Discrete actions ──────────────────────────────────────────────
  function onApproveRequest(id: string, status: "APPROVED" | "REJECTED") {
    const next = getPanelManualRequests().map((request) =>
      request.id === id ? { ...request, status } : request
    )
    writeCollection(MANUAL_REQUESTS_KEY, next)
    afterAction(status === "APPROVED" ? "Request approved" : "Request rejected")
  }

  function onRemoveLoan(id: string) {
    writeCollection(
      LOANS_KEY,
      getPanelLoans().filter((loan) => loan.id !== id)
    )
    afterAction("Loan removed")
  }

  function onAddMember() {
    addSentInvite({
      id: makeId("invite"),
      firstName: "New",
      lastName: "Member",
      phoneNumber: "+254700000000",
      status: "PENDING",
      relationship: "FRIEND",
    })
    afterAction("Sample invite added")
  }

  // ── Scenarios: seed a known state, then go view that screen ──────────
  function goScenario(route: string, message: string) {
    queryClient.invalidateQueries()
    toast({ title: message })
    navigate(route)
  }

  function onStage(stage: OnboardingStage, label: string) {
    goScenario(seedAtStage(stage), `Set to: ${label}`)
  }

  function removeMemberAction(id: string) {
    removeMember(id)
    afterAction("Member removed")
  }
  function acceptInviteAction(id: string) {
    acceptInvite(id)
    afterAction("Invite accepted")
  }
  function removeInviteAction(id: string) {
    removeInvite(id)
    afterAction("Invite dropped")
  }
  function acceptReceivedAction(id: string) {
    acceptReceivedInvite(id)
    afterAction("Invite accepted")
  }
  function declineReceivedAction(id: string) {
    declineReceivedInvite(id)
    afterAction("Invite declined")
  }

  const circle = getPatientCircleSummary()

  const header = (
    <BackTitleHeader
      title="Facilitator Tools"
      onBack={() => navigate("/patients", { state: { tab: "profile" } })}
    />
  )

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
              {profile.accountReference ? ` · ${profile.accountReference}` : ""}
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
              onClick={() => {
                seedDemoAccount()
                goScenario("/patients", "Loaded demo (Amina)")
              }}
            >
              Load full demo data (Amina)
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                resetToOnboardingOnly()
                goScenario("/patients", "Activity reset (kept onboarding)")
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
              Accountable {circle.filledAccountableSlots}/2 ·{" "}
              {network.network.length} active · {pendingInvites.length} invite
              {pendingInvites.length === 1 ? "" : "s"} pending
            </p>
            <ToggleRow
              label="Freeze circle"
              field="patientCircle · isFrozen"
              checked={draft.frozen}
              onChange={(v) => set("frozen", v)}
            />
            {network.network.map((member) => (
              <ListItem
                key={member.id}
                title={`${member.firstName} ${member.lastName}`}
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
                title={`${invite.firstName} ${invite.lastName}`}
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
            {network.receivedInvites.map((invite) => (
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
                    subtitle={formatMoney(Number(request.billAmount), "KES")}
                  >
                    <MiniButton
                      tone="good"
                      onClick={() => onApproveRequest(request.id, "APPROVED")}
                    >
                      Approve
                    </MiniButton>
                    <MiniButton
                      tone="danger"
                      onClick={() => onApproveRequest(request.id, "REJECTED")}
                    >
                      Reject
                    </MiniButton>
                  </ListItem>
                ))}
              </div>
            )}

            {loans.length > 0 && (
              <div className="mb-1 flex flex-col gap-2">
                <p className="text-xs font-medium text-muted-foreground">Loans</p>
                {loans.map((loan) => (
                  <ListItem
                    key={loan.id}
                    title={
                      loan.patientMedicalInfoRequest?.facility?.name ?? "Loan"
                    }
                    subtitle={`${loan.status} · ${formatMoney(
                      Number(loan.outstandingAmount),
                      "KES"
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
                count={collectionCount(collection.key)}
                onRestore={() => {
                  resetCollection(collection.key)
                  afterAction(`Restored ${collection.label.toLowerCase()}`)
                }}
                onClear={() => {
                  clearCollection(collection.key)
                  afterAction(`Cleared ${collection.label.toLowerCase()}`)
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
                  onClick={() => {
                    clearAllParticipantState()
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
  { id: "phone-entry", label: "Phone entry" },
  { id: "needs-name", label: "Needs name" },
  { id: "needs-pin", label: "Needs PIN" },
  { id: "needs-id", label: "Needs ID" },
  { id: "needs-circle", label: "Needs circle" },
  { id: "onboarded", label: "Onboarded" },
  { id: "onboarded-plus", label: "Onboarded + Plus" },
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
            tagTone === "live" && "bg-green-50 text-green-700"
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
              : "text-muted-foreground"
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
        !tone && "text-muted-foreground"
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
        tone === "accent" && "bg-primary/10 text-primary"
      )}
    >
      {label}
    </span>
  )
}
