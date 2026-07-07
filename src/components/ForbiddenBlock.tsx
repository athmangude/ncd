import { CircleAlert } from "lucide-react"

export default function ForbiddenBlock() {
  return (
    <div className="flex flex-col gap-3 h-full text-center items-center">
      <CircleAlert className="h-16 w-16 text-red-500" />
      <h1>You have insufficient privileges to access this resource</h1>
      <p>Please contact your administrator to request access.</p>
    </div>
  )
}
