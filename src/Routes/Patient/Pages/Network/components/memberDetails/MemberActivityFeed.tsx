import { Gift, UserPlus } from "lucide-react"
import { formatMoney } from "@/utilities/currencyUtilities"
import { ProfileAvatar } from "@/components/ProfileAvatar"
import { Skeleton } from "@/components/Skeleton"
import { Button } from "@/components/Button"
import { useMemberActivity } from "../../hooks/useMemberActivity"

interface MemberActivityFeedProps {
  memberId: string
  firstName: string
  joinedAt: string | null
}

function relativeTimeShort(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(ms) || ms < 0) return ""
  const sec = Math.round(ms / 1000)
  if (sec < 60) return `${sec}s`
  const min = Math.round(sec / 60)
  if (min < 60) return `${min}m`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h`
  const day = Math.round(hr / 24)
  return `${day}d`
}

export function MemberActivityFeed({
  memberId,
  firstName,
  joinedAt,
}: MemberActivityFeedProps) {
  const { items, isLoading, isError, refetch } = useMemberActivity(memberId, {
    joinedAt,
    firstName,
  })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
        <p>Couldn&apos;t load activity.</p>
        <Button
          variant="link"
          size="sm"
          className="px-0"
          onClick={() => refetch()}
        >
          Retry
        </Button>
      </div>
    )
  }

  if (items.length === 0) return null

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-3">
          <div className="shrink-0">
            {item.kind === "transaction" ? (
              <ProfileAvatar
                src={null}
                name={`${item.counterpartFirstName} ${item.counterpartLastName}`}
                firstName={item.counterpartFirstName}
                lastName={item.counterpartLastName}
                className="h-10 w-10"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
                <UserPlus className="h-5 w-5" />
              </div>
            )}
          </div>
          <div className="flex-1 text-sm text-neutral-700">
            {item.kind === "transaction" ? (
              <>
                {item.direction === "sent" ? (
                  <>
                    You have sent{" "}
                    {formatMoney(item.amount, item.currencyCode)} to{" "}
                    {item.counterpartFirstName} {item.counterpartLastName}.
                  </>
                ) : (
                  <>
                    {item.counterpartFirstName} {item.counterpartLastName} has
                    sent you {formatMoney(item.amount, item.currencyCode)}.
                  </>
                )}
              </>
            ) : (
              <>{item.firstName} just joined your circle!</>
            )}
            <Gift className="ml-1 inline h-3 w-3 text-neutral-400" aria-hidden />
          </div>
          <span className="shrink-0 text-xs text-neutral-400">
            <time dateTime={item.createdAt}>
              {relativeTimeShort(item.createdAt)}
            </time>
          </span>
        </li>
      ))}
    </ul>
  )
}
