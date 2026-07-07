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
    <li className="flex gap-2 bg-muted rounded-lg p-4">
      <span className="text-sm text-muted-foreground">{`${number < 10 ? "0" : ""}${number}`}</span>
      <div>
        <p>{title}</p>
        <p className="mt-1 text-muted-foreground">{description}</p>
      </div>
    </li>
  )
}
