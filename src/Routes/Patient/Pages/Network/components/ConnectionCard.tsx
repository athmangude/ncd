export function ConnectionCard({ name, phoneNumber, status, children }: any) {
  return (
    <div className="text-lg capitalize flex items-center gap-3 bg-white p-3 rounded-lg border mt-2">
      <span className="rounded-full p-3 bg-muted aspect-square h-10 grid place-content-center text-foreground font-bold">
        {name[0]}
      </span>
      <div className="flex flex-col text-sm">
        {name?.toLowerCase()}
        <div className="text-xs text-muted-foreground">{phoneNumber}</div>
      </div>
      <span className="border border-border rounded-2xl px-3 ml-auto text-sm font-medium">
        {status === "ACCEPTED" ? "ACTIVE" : status}
      </span>
      {children}
    </div>
  )
}
