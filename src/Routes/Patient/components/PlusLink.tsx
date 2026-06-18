import { Plus } from "lucide-react"
import { Link } from "react-router-dom"

export default function PlusLink({
  link,
  text,
}: {
  link: string
  text: string
}) {
  return (
    <Link className="flex items-center  gap-1 mt-2 mb-1 text-center " to={link}>
      <Plus className="w-4 h-4 font-medium" />
      {text}
    </Link>
  )
}
