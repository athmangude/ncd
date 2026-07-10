import StatusPageWrapper from "@/Routes/shell/StatusPageWrapper"

export default function UnauthorizedPage() {
  return (
    <StatusPageWrapper className="grid place-items-center">
      <div className="flex flex-col gap-2 text-center">
        <h1>Unauthorized</h1>

        <p>You are not authorized to access this page</p>
      </div>
    </StatusPageWrapper>
  )
}
