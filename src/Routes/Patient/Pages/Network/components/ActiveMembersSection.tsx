import { NetworkItem } from "./NetworkItem"
import type { NetworkMember } from "@/hooks/usePatientNetwork"

interface ActiveMembersSectionProps {
  network: NetworkMember[]
  adults: NetworkMember[]
  children: NetworkMember[]
  slots?: {
    accountable?: { used: number; max: number; reserved: number }
    auxiliary?: { used: number; max: number; reserved: number }
  }
  accountableSlotsAvailable: number
  accountableSlotsMax: number
}

export function ActiveMembersSection({
  network,
  adults,
  children,
  slots,
  accountableSlotsAvailable,
  accountableSlotsMax,
}: ActiveMembersSectionProps) {
  if (network.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground bg-muted rounded-xl border border-dashed">
        Invite someone to join your circle!
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Adults Section */}
      {adults.length > 0 && (
        <div>
          <div className="text-muted-foreground text-sm items-center justify-between mb-2">
            <h4 className="font-medium">Circle ({adults.length})</h4>
            {slots?.accountable && (
              <span>
                {accountableSlotsAvailable}/{accountableSlotsMax} slots
                available
              </span>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {adults.map((n: NetworkMember) => (
              <NetworkItem
                key={n.id}
                {...n}
                firstName={n.firstName}
                lastName={n.lastName}
                profilePhoto={n.profilePhoto}
              />
            ))}
          </div>
        </div>
      )}

      {/* Children Section */}
      {children.length > 0 && (
        <div>
          <h4 className="text-muted-foreground mb-2 font-medium text-sm">
            Juniors ({children.length})
          </h4>
          <div className="flex flex-col gap-3">
            {children.map((n: NetworkMember) => (
              <NetworkItem
                key={n.id}
                {...n}
                firstName={n.firstName}
                lastName={n.lastName}
                profilePhoto={n.profilePhoto}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
