import { CircleCheck } from "lucide-react"
import { Button } from "./Button"

export default function SuccessBlock({
  title,
  message,
  action,
}: {
  title: string
  message: string
  action?: {
    onClick: () => void
    label: string
  }
}) {
  return (
    <div className="flex flex-col gap-3 h-full text-center items-center">
      <CircleCheck className="h-16 w-16 text-green-500" />
      <h1>{title}</h1>
      <p>{message}</p>

      {action && (
        <Button onClick={action.onClick} className="w-full mt-5">
          {action.label}
        </Button>
      )}
    </div>
  )
}
