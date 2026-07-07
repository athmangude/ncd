import { Button } from "./Button"

export function TableTabs({
  statuses,
  activeStatus,
  setActiveStatus,
}: {
  statuses: string[]
  activeStatus: string
  setActiveStatus: (status: any) => void
}) {
  return (
    <div className="flex gap-3 rounded-lg bg-muted p-1 w-fit">
      {statuses.map((status) => (
        <TableTab
          key={status}
          status={status}
          activeStatus={activeStatus}
          setActiveStatus={setActiveStatus}
        />
      ))}
    </div>
  )
}

function TableTab({
  status,
  activeStatus,
  setActiveStatus,
}: {
  status: string
  activeStatus: string
  setActiveStatus: (status: string) => void
}) {
  const isActive = status === activeStatus
  return (
    <Button
      variant="ghost"
      className={`capitalize hover:bg-primary/5 ${isActive ? "bg-card" : ""}`}
      onClick={() => {
        setActiveStatus(status)
      }}
    >
      {status.toLowerCase()}
    </Button>
  )
}
