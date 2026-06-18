import Tag from "@/components/Tag"

export default function DueInTag({ dueDate }: { dueDate: string }) {
  const date = new Date(dueDate)
  const dueInDays = Math.ceil(
    (date.getTime() - new Date().getTime()) / (1000 * 3600 * 24)
  )
  const dueInMonths = Math.ceil(dueInDays / 30)

  return (
    <Tag className="">
      {dueInDays < 30 ? dueInDays : dueInMonths}{" "}
      {dueInDays < 30
        ? `day${dueInDays > 1 ? "s" : ""}`
        : `month${dueInMonths > 1 ? "s" : ""}`}{" "}
      left
    </Tag>
  )
}
