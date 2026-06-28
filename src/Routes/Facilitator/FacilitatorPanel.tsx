import { useReducer, useState } from "react"
import { useNavigate } from "react-router-dom"
import { queryClient } from "@/queryClient"
import { Button } from "@/components/Button"
import { Input } from "@/components/Input"
import { Label } from "@/components/Label"
import { formatMoney } from "@/utilities/currencyUtilities"
import { readCollection, writeCollection } from "@/mocks/db"
import { getLoginDetails, patchLoginDetails } from "@/mocks/handlers/profile"
import { LOANS_KEY, MANUAL_REQUESTS_KEY } from "@/mocks/handlers/loans"
import { getCareFundBalance, setCareFundBalance } from "@/mocks/domain/careFund"
import {
  activateMembership,
  deactivateMembership,
} from "@/mocks/domain/membership"
import { acceptInvite, getNetwork } from "@/mocks/domain/network"
import { clearAllParticipantState, resetCollection } from "@/mocks/domain/reset"
import {
  seedFreshAccount,
  seedDemoAccount,
  resetToOnboardingOnly,
} from "@/mocks/domain/seed"
import loansSeed from "@/mocks/fixtures/loans.json"
import manualRequestsSeed from "@/mocks/fixtures/manual-requests.json"
import { reloadApp } from "./reloadApp"
import AppShell from "@/Routes/AppShell"
import { BackTitleHeader } from "@/Routes/shell/headers"

interface PanelLoan {
  id: string
  status: string
  amount: number
  outstandingAmount: number
  patientMedicalInfoRequest?: { facility?: { name?: string } }
}

interface PanelManualRequest {
  id: string
  careProviderName: string
  billAmount: string
  status: string
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

/**
 * Facilitator-only control panel for usability testing. Reachable at
 * #/facilitator (linked from Profile). It reads and writes the mock state
 * directly through the domain helpers. Individual tweaks soft-refresh (the
 * participant-facing app refetches without a disruptive restart); only the full
 * resets hard-reload. Not part of any participant journey, so it is
 * intentionally unstyled-for-polish and untracked by analytics.
 */
export default function FacilitatorPanel() {
  const navigate = useNavigate()
  const profile = getLoginDetails()
  const network = getNetwork()
  const loans = getPanelLoans()
  const manualRequests = getPanelManualRequests()

  const [balance, setBalance] = useState(String(getCareFundBalance()))
  const [creditTotal, setCreditTotal] = useState(
    String(profile.creditLimit?.totalCreditLimitAmount ?? "0")
  )
  const [creditRemaining, setCreditRemaining] = useState(
    String(profile.creditLimit?.remainingAmount ?? "0")
  )
  const [confirmingFresh, setConfirmingFresh] = useState(false)
  const [, rerenderPanel] = useReducer((n: number) => n + 1, 0)

  // Individual tweaks (membership, credit, balance, invites, requests, loans)
  // refresh in place: invalidate the patient app's queries so it refetches the
  // mutated mock state, and re-render this panel so its own readouts update.
  // No full page reload — that would restart the participant's session, making
  // the app "start afresh" when they return. Full resets below still reload.
  function softRefresh() {
    queryClient.invalidateQueries()
    rerenderPanel()
  }

  const pendingInvites = network.invites.filter(
    (invite) => invite.status === "PENDING"
  )
  const pendingRequests = manualRequests.filter(
    (request) => request.status === "PENDING"
  )

  function applyBalance() {
    setCareFundBalance(Number(balance) || 0)
    softRefresh()
  }

  function saveCreditLimit() {
    const current = getLoginDetails()
    patchLoginDetails({
      creditLimit: {
        ...current.creditLimit,
        totalCreditLimitAmount: String(Number(creditTotal) || 0),
        remainingAmount: String(Number(creditRemaining) || 0),
      },
    })
    softRefresh()
  }

  function onActivateMembership() {
    activateMembership()
    softRefresh()
  }

  function onDeactivateMembership() {
    deactivateMembership()
    softRefresh()
  }

  function onAcceptInvite(inviteId: string) {
    acceptInvite(inviteId)
    softRefresh()
  }

  function setRequestStatus(id: string, status: "APPROVED" | "REJECTED") {
    const next = getPanelManualRequests().map((request) =>
      request.id === id ? { ...request, status } : request
    )
    writeCollection(MANUAL_REQUESTS_KEY, next)
    softRefresh()
  }

  function removeLoan(id: string) {
    const next = getPanelLoans().filter((loan) => loan.id !== id)
    writeCollection(LOANS_KEY, next)
    softRefresh()
  }

  function clearLoans() {
    writeCollection<PanelLoan>(LOANS_KEY, [])
    softRefresh()
  }

  function onResetCollection(key: string) {
    resetCollection(key)
    softRefresh()
  }

  function onResetToOnboarding() {
    resetToOnboardingOnly()
    reloadApp()
  }

  function onLoadDemoData() {
    seedDemoAccount()
    reloadApp()
  }

  function onEmptyOnboarded() {
    seedFreshAccount()
    reloadApp()
  }

  // Full wipe back to the fresh, unseeded phone-number entry — the same state
  // the participant reaches by signing out, but reachable from the tools.
  function onStartFresh() {
    clearAllParticipantState()
    reloadApp()
  }

  const header = (
    <BackTitleHeader
      title="Facilitator Tools"
      onBack={() => navigate("/patients", { state: { tab: "profile" } })}
    />
  )

  return (
    <AppShell header={header} footer={null}>
      <div className="flex flex-col gap-6">
        <p className="text-sm text-muted-foreground">
          Researcher-only controls for this participant's account. Changes apply
          right away — individual edits refresh in place; the scenarios below
          reload the app.
        </p>

        <Section title="Quick scenarios">
          <p className="text-sm text-neutral-700">
            {profile.firstName || profile.lastName
              ? `${profile.firstName} ${profile.lastName}`.trim()
              : "New participant (unonboarded)"}{" "}
            · {profile.phoneNumber}
          </p>

          <div className="flex flex-col gap-2">
            <Button onClick={onLoadDemoData}>
              Load full demo data (Amina)
            </Button>
            <p className="text-xs text-muted-foreground">
              Loads the rich seeded account: onboarded, Jireh Plus, loans,
              circle and cashback.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={onEmptyOnboarded}>
              Empty onboarded (skip phone)
            </Button>
            <p className="text-xs text-muted-foreground">
              Logs in with a blank profile at the start of onboarding — skips
              the phone / OTP entry.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={onResetToOnboarding}>
              Reset activity (keep onboarding info)
            </Button>
            <p className="text-xs text-muted-foreground">
              Keeps name, PIN and verified ID. Clears loans, payments, cashback,
              circle &amp; invites, membership and credit.
            </p>
          </div>

          {confirmingFresh ? (
            <div className="flex flex-col gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
              <p className="text-sm font-medium text-neutral-900">
                Start fresh? This wipes everything and returns to the
                phone-number entry — the same as the participant signing out.
              </p>
              <div className="flex gap-2">
                <Button variant="destructive" onClick={onStartFresh}>
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
            <Button
              variant="destructive"
              onClick={() => setConfirmingFresh(true)}
            >
              Start fresh — new participant (phone input)
            </Button>
          )}
        </Section>

        <Section title="Cashback balance">
          <p className="text-sm text-muted-foreground">
            Current: {formatMoney(getCareFundBalance(), "KES")}
          </p>
          <Field label="Set cashback balance (KES)">
            <Input
              id="cashback-balance"
              type="number"
              inputMode="numeric"
              value={balance}
              onChange={(event) => setBalance(event.target.value)}
            />
          </Field>
          <Button onClick={applyBalance}>Set balance</Button>
          <ResetLink
            label="Restore seeded cashback"
            onClick={() => onResetCollection("care-fund-transactions")}
          />
        </Section>

        <Section title="Membership (Jireh Plus)">
          <p className="text-sm text-muted-foreground">
            Status:{" "}
            <span className="font-medium text-neutral-900">
              {profile.hasActiveMembership ? "Active" : "Inactive"}
            </span>
          </p>
          <div className="flex gap-2">
            <Button onClick={onActivateMembership}>Activate</Button>
            <Button variant="outline" onClick={onDeactivateMembership}>
              Deactivate
            </Button>
          </div>
        </Section>

        <Section title="Credit limit">
          <Field label="Total credit limit (KES)">
            <Input
              id="credit-total"
              type="number"
              inputMode="numeric"
              value={creditTotal}
              onChange={(event) => setCreditTotal(event.target.value)}
            />
          </Field>
          <Field label="Remaining credit (KES)">
            <Input
              id="credit-remaining"
              type="number"
              inputMode="numeric"
              value={creditRemaining}
              onChange={(event) => setCreditRemaining(event.target.value)}
            />
          </Field>
          <Button onClick={saveCreditLimit}>Save credit limit</Button>
        </Section>

        <Section title="Loans">
          {loans.length === 0 ? (
            <p className="text-sm text-muted-foreground">No loans.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {loans.map((loan) => (
                <li
                  key={loan.id}
                  className="flex items-center justify-between rounded-lg border border-neutral-200 p-2"
                >
                  <span className="text-sm text-neutral-700">
                    {loan.patientMedicalInfoRequest?.facility?.name ?? "Loan"} ·{" "}
                    {loan.status} ·{" "}
                    {formatMoney(Number(loan.outstandingAmount), "KES")} due
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeLoan(loan.id)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={clearLoans}>
              Clear all loans
            </Button>
            <ResetLink
              label="Restore seeded loans"
              onClick={() => onResetCollection("loans")}
            />
          </div>
        </Section>

        <Section title="Circle invites">
          {pendingInvites.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending invites.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {pendingInvites.map((invite) => (
                <li
                  key={invite.id}
                  className="flex items-center justify-between rounded-lg border border-neutral-200 p-2"
                >
                  <span className="text-sm text-neutral-700">
                    {invite.firstName} {invite.lastName}
                  </span>
                  <Button size="sm" onClick={() => onAcceptInvite(invite.id)}>
                    Mark accepted
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <ResetLink
            label="Restore seeded circle"
            onClick={() => onResetCollection("patient-network")}
          />
        </Section>

        <Section title="Pending payment requests">
          {pendingRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No pending requests.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {pendingRequests.map((request) => (
                <li
                  key={request.id}
                  className="flex items-center justify-between rounded-lg border border-neutral-200 p-2"
                >
                  <span className="text-sm text-neutral-700">
                    {request.careProviderName} ·{" "}
                    {formatMoney(Number(request.billAmount), "KES")}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setRequestStatus(request.id, "APPROVED")}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRequestStatus(request.id, "REJECTED")}
                    >
                      Reject
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <ResetLink
            label="Restore seeded requests"
            onClick={() => onResetCollection("manual-requests")}
          />
        </Section>

        <Section title="Reset individual areas">
          <div className="flex flex-wrap gap-2">
            <ResetLink
              label="Payment history"
              onClick={() => onResetCollection("payment-history")}
            />
            <ResetLink
              label="Profile"
              onClick={() => onResetCollection("login-details")}
            />
          </div>
        </Section>
      </div>
    </AppShell>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
      {children}
    </section>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function ResetLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left text-sm font-medium text-primary underline-offset-4 hover:underline"
    >
      {label}
    </button>
  )
}
