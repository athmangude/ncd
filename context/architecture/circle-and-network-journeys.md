---
context_version: 1.1
last_updated_commit: 1bd28205
last_updated_date: 2026-07-15
covers: Patient Circle and Network — adding members, invite methods (text/voice), circle status, KYC circle requirement, loan eligibility gate, derived slot counts
---

# Circle and Network Journeys

## What is a Circle?

A Jireh Circle is a social accountability group of trusted people a patient adds to their Jireh account. The Circle serves two purposes:

1. **Credit risk mitigation**: Circle members are notified of a patient's loan obligations. An active, healthy circle is required to access Jireh Medical Loans.
2. **Emotional support**: Members can receive Care Fund gifts and are part of the patient's healthcare support network.

A Circle has two slot types:
- **Accountable slots**: Adult (non-CHILD) members who count toward loan eligibility
- **Auxiliary slots**: Additional members (may include children)

The patient's `patientCircle` object on the user object tracks slot counts and circle health.

---

## Network Route Namespace

```
/patients/network/
```

Defined in `PatientNetworkWrapper.tsx`:
```
src/Routes/Patient/Pages/Network/
  PatientNetworkWrapper.tsx        — route definitions
  PatientMyNetwork.tsx             — circle member list + invite CTA
  PatientAddConnection.tsx         — add member form
  PatientAcceptInvite.tsx          — accept an incoming invite
  PatientAcceptShareLink.tsx       — accept a referral/share link
  InviteTextPage.tsx               — compose a personalized text invite
  InviteVoicePage.tsx              — record a personalized voice invite
  PreviewInvitePage.tsx            — preview invite before sending
  CheckProfilePhotoPage.tsx        — check if user has a profile photo (for voice invite)
  PatientInvitationsReceived.tsx   — received invitations list
  PatientInvitationsSent.tsx       — sent invitations list
  PatientInviteAccepted.tsx        — success screen after invite accepted
  PatientInviteExpired.tsx         — invite link expired screen
  PatientInviteRejected.tsx        — invite rejected screen
  PatientInviteInfo.tsx            — info about how invites work
  PatientNetworkFAQ.tsx            — FAQ
  components/                      — AddConnectionDrawer, InviteMethodDrawer, etc.
  hooks/
    useNetworkData.ts              — fetches network, invites, receivedInvites
```

---

## My Network Page — `PatientMyNetwork`

`PatientMyNetwork` is the main Circle management page. It is also embedded in the Dashboard's `PatientDashboardCircleTab` (with `hasBottomNav={true}`).

### Data

`useNetworkData` fetches from `GET /patient-network/network` and returns:
```typescript
{
  network: NetworkMember[]          // accepted connections
  invites: Invite[]                 // pending sent invites
  receivedInvites: ReceivedInvite[] // pending incoming invites
  slots: CircleSlots                // max + filled counts for accountable and auxiliary
  adults: NetworkMember[]           // network members with non-CHILD relationship
  children: NetworkMember[]         // CHILD members
  isAccountableFull: boolean
  isAuxiliaryFull: boolean
  isAllFull: boolean
  accountableSlotsAvailable: number
  accountableSlotsMax: number
}
```

**Slot counts are derived, not manually counted.** `useNetworkData` computes `isAccountableFull`/`isAuxiliaryFull`/`accountableSlotsAvailable` directly from `slots.accountable`/`slots.auxiliary` (`{ used, reserved, max }`) on every render — e.g. `isAccountableFull = (slots.accountable.used + slots.accountable.reserved) >= slots.accountable.max`. There is no separate manually-incremented counter anywhere in the circle UI; if you need a slot-related number, derive it from the live `slots`/`network`/`invites` arrays here rather than reintroducing manual counter math.

### UI Sections

1. `InviteCard` — hero CTA to invite someone
2. `InvitationsReceivedSection` — pending invites waiting for user action
3. `InvitationsSentSection` — outgoing pending invites
4. `ActiveMembersSection` — accepted circle members, with remove option
5. `AddMemberButton` — floating add button (hidden if circle is full)

---

## Adding a Connection

### Entry Flow

```
[User taps "Invite" on InviteCard]
       ↓
AddConnectionDrawer (collect: first name, last name, relationship, phone, DOB for children)
       ↓ (on success)
InviteMethodDrawer (choose: text invite / voice invite / standard invite)
       ├─ Standard API invite:
       │    POST /patient-network/send-invite
       │    → navigate back to network page
       │
       ├─ Text invite:
       │    navigate to /patients/network/add-connection
       │    (with state: { flow: "invite-text", inviteMethod: "text", source })
       │    → PatientAddConnection (fill/confirm details)
       │    → InviteTextPage (compose 140-char message)
       │    → [check profile photo] CheckProfilePhotoPage OR PreviewInvitePage
       │    → PreviewInvitePage (preview card)
       │    → POST /patient-network/send-invite with personalized message
       │
       └─ Voice invite:
            navigate to /patients/network/add-connection
            (with state: { flow: "invite-voice", inviteMethod: "voice", source })
            → PatientAddConnection
            → InviteVoicePage (record audio)
            → [check profile photo] CheckProfilePhotoPage OR PreviewInvitePage
            → PreviewInvitePage
            → POST /patient-network/send-invite with audio
```

### `PENDING_INVITE_KEY` localStorage

During text/voice invite flows, the partially-built invite data is stored in `localStorage["patient-network-pending-invite"]` (`PENDING_INVITE_KEY`). This persists the connection details (name, relationship, phone) while the user navigates through invite personalization pages.

```typescript
type PendingInviteData = {
  firstName: string
  lastName: string
  relationship: string
  phoneNumber?: string
  inviteMethod?: "voice" | "text"
  inviteMessage?: string    // for text invites
}
```

### `PatientAddConnection` Form

`src/Routes/Patient/Pages/Network/PatientAddConnection.tsx`

Uses `usePersistentForm(addNewConnectionStorageKey)` where `addNewConnectionStorageKey = "add-new-connection"`.

**Relationship options**: SPOUSE, SIBLING, CHILD (under 18), CHILD_OVER_18, PARENT, FRIEND, COLLEAGUE, OTHER

Rules:
- CHILD relationship: no phone number collected, date of birth required (validates under 18)
- All others: phone number required (Kenya format), date of birth optional

After submission, `PatientAddConnection` uses a `callbackMap` to return to the calling context:

```typescript
const callbackMap: Record<string, string> = {
  "treatment-details": "/patients/payment/request-payment/treatment-details",
  "select-patient": "/patients/payment/request-payment/select-patient",
  "upload-invoice": "/patients/payment/request-payment/upload-invoice",
  "gift-recipient": "/patients/care-fund/gift-recipient",
  "fast-track-payment-details": "/patients/fast-track/payment-details",
  "network": "/patients/network",
}
```

This means adding a connection can be triggered mid-payment (e.g., user is trying to select a patient to pay for, but they haven't added that person yet).

---

## Accepting an Invite

`PatientAcceptInvite.tsx` handles the flow when a user opens an invite link (typically from SMS). The invite ID is read from localStorage (`inviteId`) which was set by the link handler (deep link or browser URL parameter).

During onboarding, if `inviteId` is present in localStorage when OTP verification completes, `useNextOnboardingStep` redirects to `/patients/network/accept-invite` instead of the normal next step.

---

## Circle Relationship to Loan Eligibility

The circle health is checked in `PatientWalletSelection` before allowing the Jireh Medical Loan wallet:

```typescript
const isCircleEligibleForLoan = 
  patientCircle &&
  (patientCircle.filledAccountableSlots ?? 0) >= 2 &&
  patientCircle.status !== "INACTIVE" &&
  patientCircle.isFrozen !== true
```

### `PatientCircle` Object Shape (from `types.ts`)

```typescript
interface PatientCircle {
  id?: string
  status?: string                    // "ACTIVE" | "INACTIVE" | etc.
  maxAccountableSlots?: number       // total accountable slots
  maxAuxiliarySlots?: number         // total auxiliary slots
  filledAccountableSlots?: number    // current adult members
  filledAuxiliarySlots?: number      // current child/other members
  isFrozen?: boolean                 // if true, loan blocked
  hasCompletedSetup?: boolean
  activatedAt?: string | null
  frozenAt?: string | null
  freezeReason?: string | null
}
```

### Circle Freeze

If `patientCircle.isFrozen === true`, the Jireh Medical Loan option in wallet selection is disabled. Freeze reason is available in `freezeReason` but not prominently displayed in the UI (as of current code).

---

## KYC Circle Requirement

During KYC (step 3), the user must add at least 2 adult members. This is checked by `useNextKYCStep`:

```typescript
checkCompletion: (u) => {
  const allMembers = [...(u?.network || []), ...(u?.invites || [])]
  const adults = allMembers.filter(m => m.relationship !== "CHILD")
  return adults.length >= 2
}
```

**Note**: Pending invites (sent but not yet accepted) count toward this threshold. The user does not need to wait for acceptance.

During KYC, members are added via `PatientKYCAddCircleMembers` which uses `localStorage["kyc_circle_members"]` as a staging area, then batch-submits to the API. See `kyc-verification.md` for details.

---

## Circle Setup Intro / Optional Circle Setup

Separate from the KYC flow, there is an optional post-membership circle setup flow:

```
/patients/circle-setup-intro    PatientCircleSetupIntro
/patients/add-to-circle         PatientAddToCircle
```

`useNextCircleSetupStep` (`src/Routes/Patient/hooks/useNextCircleSetupStep.ts`) manages this optional journey. This is available for users who skipped or rushed through KYC circle members.

---

## `JoinCircleRedirect`

`src/Routes/JoinCircleRedirect.tsx` is a special route that handles incoming circle invite deep links. It extracts the invite token from the URL, stores it, and redirects to the auth flow.

---

## Network Data Caching

Network data is fetched by `useNetworkData` (custom hook) using React Query. The query key is `myNetworkQueryKey = "myConnectionsKey"`.

During payment flows, `PatientSelectPatient` and `PatientTreatmentDetails` also fetch connections for patient selection, using query key `patientConnectionsQueryKey = "patientConnections"`. These are separate queries from the network page queries.

After adding a connection mid-payment, the relevant query is invalidated:
```typescript
queryClient.invalidateQueries({ queryKey: [patientConnectionsQueryKey] })
```

---

## Gotchas

1. **Invites count toward KYC circle**: The KYC check counts `network + invites` together. So a user who has sent 2 invites (but neither accepted) passes step 3. This is intentional design — don't change the check without consulting product.

2. **CHILD members do not count for loan eligibility**: Both the KYC step-3 check AND the loan wallet gate filter out `CHILD` relationship. Two children added to a circle do not unlock loans.

3. **Pending invite data in localStorage persists**: `PENDING_INVITE_KEY` is not cleared by the standard `signOut` flow (as of current code). If a user logs out mid-invite, the data will still be present when a different user logs in on the same device. This is a potential data leak for shared devices.

4. **`addNewConnectionStorageKey` persists across sessions**: `usePersistentForm("add-new-connection")` stores form values in localStorage. It is not in the signOut cleanup list.

5. **Circle tab on Dashboard**: `PatientDashboardCircleTab` renders `PatientMyNetwork` with `hasBottomNav={true}`. The component uses this prop to adjust the floating add button position so it doesn't overlap the navigation bar.
