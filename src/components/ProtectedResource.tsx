import { useNavigate } from "react-router-dom"
import ErrorBlock from "./ErrorBlock"
import { Button } from "./Button"

type ProtectedResourceProps = {
  children: React.ReactNode
  userRole: string
  allowedRoles: string[]
}

export function ProtectedResource({
  children,
  userRole,
  allowedRoles,
}: ProtectedResourceProps) {
  if (!allowedRoles.includes(userRole)) {
    return null
  }

  return children
}

export function ProtectedRoute({
  children,
  userRole,
  allowedRoles,
}: ProtectedResourceProps) {
  const navigate = useNavigate()
  if (!allowedRoles.includes(userRole)) {
    return (
      <div className="w-full max-w-md mx-auto flex flex-col gap-5">
        <ErrorBlock message="You are not authorized to view this page. " />
        <Button className="w-full" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    )
  }

  return children
}
