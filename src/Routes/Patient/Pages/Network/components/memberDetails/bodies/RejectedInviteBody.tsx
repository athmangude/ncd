import { Link } from "react-router-dom"
import type { SentInvite } from "@/hooks/usePatientNetwork"
import { LinkedAvatarPair } from "../LinkedAvatarPair"
import { OpenSlotCard } from "../OpenSlotCard"

interface RejectedInviteBodyProps {
  invite: SentInvite
  you: { firstName: string; lastName: string; profilePhoto: string | null }
}

export function RejectedInviteBody({ invite, you }: RejectedInviteBodyProps) {
  return (
    <div className="flex flex-col gap-6">
      <LinkedAvatarPair
        you={you}
        them={{
          firstName: invite.firstName ?? "",
          lastName: invite.lastName ?? "",
          profilePhoto: invite.profilePhoto ?? null,
        }}
        variant="rejected"
      />
      <p className="text-center text-lg font-medium">
        {invite.firstName} chose not to join.
      </p>
      <OpenSlotCard
        firstName={invite.firstName ?? ""}
        prefill={{
          firstName: invite.firstName ?? "",
          lastName: invite.lastName ?? "",
          phoneNumber: invite.phoneNumber ?? "",
          relationship: invite.relationship,
        }}
      />
      <Link
        to="/patients/circle"
        className="mt-2 block rounded-xl border border-neutral-200 py-3 text-center font-medium text-neutral-900"
      >
        See my Circle
      </Link>
    </div>
  )
}
