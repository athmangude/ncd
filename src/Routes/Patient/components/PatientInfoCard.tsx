export function InfoCard({
  number,
  description,
  title,
}: {
  number: number
  description?: string
  title: string
}) {
  return (
    <li className="flex gap-2 bg-neutral-50 rounded-lg p-4">
      <span className="text-sm text-neutral-500">{`${number < 10 ? "0" : ""}${number}`}</span>
      <div>
        <p>{title}</p>
        <p className="mt-1 text-neutral-500">{description}</p>
      </div>
    </li>
  )
}
