import { Trash2 } from "lucide-react"

export default function DeletableItem({
  title,
  description,
  onDelete,
  tag,
}: {
  title: string
  description?: string
  tag?: string
  onDelete: () => void
}) {
  return (
    <div className="p-3 flex gap-5 items-center justify-between font-medium rounded-xl border text-neutral-500">
      <div className="grid gap-1">
        <p className="text-neutral-600">{title}</p>
        {description && <p className="text-xs text-neutral-400">{description}</p>}
      </div>

      {tag && (
        <div className="text-sm bg-neutral-100 px-2 py-1 rounded-lg">{tag}</div>
      )}
      <button onClick={onDelete}>
        <Trash2 className="w-5 h-5 text-red-500" />
      </button>
    </div>
  )
}
