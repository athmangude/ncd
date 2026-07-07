import { useNavigate } from "react-router-dom"
import { Building2, Gift } from "lucide-react"
import { format } from "date-fns"
import type { NetworkMember } from "@/hooks/usePatientNetwork"
import { trackEvent, EVENTS } from "@/analytics"
import { LinkedAvatarPair } from "../LinkedAvatarPair"
import { MemberBalanceCard } from "../MemberBalanceCard"
import { MemberActionTile } from "../MemberActionTile"
import { MemberActivityFeed } from "../MemberActivityFeed"
import { RemoveMemberButton } from "../RemoveMemberButton"

interface ConnectedEstablishedBodyProps {
  member: NetworkMember
  you: { firstName: string; lastName: string; profilePhoto: string | null }
}

export function ConnectedEstablishedBody({
  member,
  you,
}: ConnectedEstablishedBodyProps) {
  const navigate = useNavigate()
  const variant = member.hasDefaultedLoan ? "defaulted" : "active"

  const goPayBill = () => {
    trackEvent(EVENTS.CIRCLE.MEMBER_DETAILS_PAY_BILL_TAPPED)
    navigate("/patients/fast-track/resolve-provider", {
      state: { preselectedPatientId: member.id },
    })
  }

  const goSendCashback = () => {
    trackEvent(EVENTS.CIRCLE.MEMBER_DETAILS_GIFT_TAPPED)
    navigate("/patients/care-fund/gift-recipient", {
      state: { preselectedPatientId: member.id },
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <LinkedAvatarPair
        you={you}
        them={{
          firstName: member.firstName,
          lastName: member.lastName,
          profilePhoto: member.profilePhoto,
        }}
        variant={variant}
      />
      <p className="text-center text-xl font-medium">
        You &amp;{" "}
        <span className="text-primary">{member.firstName}</span>
        <br /> are connected.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <MemberBalanceCard />
        <div className="flex flex-col gap-2">
          <MemberActionTile
            icon={Building2}
            label="Pay their medical bill"
            onClick={goPayBill}
          />
          <MemberActionTile
            icon={Gift}
            label="Send them cashback"
            onClick={goSendCashback}
          />
        </div>
      </div>
      <MemberActivityFeed
        memberId={member.id}
        firstName={member.firstName}
        joinedAt={member.joinedAt}
      />
      {member.joinedAt && (
        <p className="text-center text-sm text-muted-foreground">
          Connected since {format(new Date(member.joinedAt), "EEE yyyy")}
        </p>
      )}
      <RemoveMemberButton
        kind="member"
        targetId={member.id}
        name={member.firstName}
        memberType={member.type === "CHILD" ? "CHILD" : "NETWORK"}
      />
    </div>
  )
}
