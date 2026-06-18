export default function PasswordRequirements() {
  return (
    <ul className="list-disc text-xs text-neutral-500 list-inside mt-2 flex flex-col gap-1 text-left">
      <li>Minimum of 8 characters</li>
      <li>Contains at least one lowercase character</li>
      <li>Contains at least one number</li>
    </ul>
  )
}
