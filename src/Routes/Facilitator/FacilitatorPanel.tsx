import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/Button"
import { Input } from "@/components/Input"
import { Label } from "@/components/Label"
import { formatMoney } from "@/utilities/currencyUtilities"
import { readCollection, writeCollection } from "@/mocks/db"
import { getLoginDetails, patchLoginDetails } from "@/mocks/handlers/profile"
import {
  LOANS_KEY,
  MANUAL_REQUESTS_KEY,
} from "@/mocks/handlers/loans"
import {
  getCareFundBalance,
  setCareFundBalance,
} from "@/mocks/domain/careFund"
import {
  activateMembership,
  deactivateMembership,
} from "@/mocks/domain/membership"
import { acceptInvite, getNetwork } from "@/mocks/domain/network"
import { resetCollection } from "@/mocks/domain/reset"
import {
  seedFreshAccount,
  seedDemoAccount,
  resetToOnboardingOnly,
} from "@/mocks/domain/seed"
import loansSeed from "@/mocks/fixtures/loans.json"
import manualRequestsSeed from "@/mocks/fixtures/manual-requests.json"
import { reloadApp } from "./reloadApp"

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
 * directly through the domain helpers, then reloads so the participant-facing
 * app refetches and reflects the change. Not part of any participant journey,
 * so it is intentionally unstyled-for-polish and untracked by analytics.
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
  const [confirmingReset, setConfirmingReset] = useState(false)

  const pendingInvites = network.invites.filter(
    (invite) => invite.status === "PENDING"
  )
  const pendingRequests = manualRequests.filter(
    (request) => request.status === "PENDING"
  )

  function applyBalance() {
    setCareFundBalance(Number(balance) || 0)
    reloadApp()
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
    reloadApp()
  }

  function onActivateMembership() {
    activateMembership()
    reloadApp()
  }

  function onDeactivateMembership() {
    deactivateMembership()
    reloadApp()
  }

  function onAcceptInvite(inviteId: string) {
    acceptInvite(inviteId)
    reloadApp()
  }

  function setRequestStatus(id: string, status: "APPROVED" | "REJECTED") {
    const next = getPanelManualRequests().map((request) =>
      request.id === id ? { ...request, status } : request
    )
    writeCollection(MANUAL_REQUESTS_KEY, next)
    reloadApp()
  }

  function removeLoan(id: string) {
    const next = getPanelLoans().filter((loan) => loan.id !== id)
    writeCollection(LOANS_KEY, next)
    reloadApp()
  }

  function clearLoans() {
    writeCollection<PanelLoan>(LOANS_KEY, [])
    reloadApp()
  }

  function onResetCollection(key: string) {
    resetCollection(key)
    reloadApp()
  }

  function onResetToOnboarding() {
    resetToOnboardingOnly()
    reloadApp()
  }

  function onLoadDemoData() {
    seedDemoAccount()
    reloadApp()
  }

  function onResetToBase() {
    seedFreshAccount()
    reloadApp()
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 p-4 pb-16">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">
            Facilitator Tools
          </h1>
          <p className="text-sm text-muted-foreground">
            Edit this participant's account. Changes reload the app.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/patients")}>
          Back to app
        </Button>
      </header>

      <Section title="Account state">
        <p className="text-sm text-neutral-700">
          {profile.firstName || profile.lastName
            ? `${profile.firstName} ${profile.lastName}`.trim()
            : "New participant (unonboarded)"}{" "}
          · {profile.phoneNumber}
        </p>

        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={onResetToOnboarding}>
            Reset to fresh (keep my onboarding info)
          </Button>
          <p className="text-xs text-muted-foreground">
            Keeps name, PIN and verified ID. Clears loans, payments, cashback,
            circle &amp; invites, membership and credit.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={onLoadDemoData}>Load full demo data (Amina)</Button>
          <p className="text-xs text-muted-foreground">
            Loads the rich seeded account: onboarded, Jireh Plus, loans, circle
            and cashback.
          </p>
        </div>

        {confirmingReset ? (
          <div className="flex flex-col gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
            <p className="text-sm font-medium text-neutral-900">
              Reset to base? This empties everything so you build a new profile
              from scratch through onboarding.
            </p>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={onResetToBase}>
                Yes, reset to base
              </Button>
              <Button
                variant="outline"
                onClick={() => setConfirmingReset(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="destructive" onClick={() => setConfirmingReset(true)}>
            Reset to base (empty — build from scratch)
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
          <p className="text-sm text-muted-foreground">No pending requests.</p>
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

function ResetLink({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
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
