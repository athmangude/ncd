import type { ReactNode } from "react"

export default function HealthcareAuthTitle({
  children,
}: {
  children: ReactNode
}) {
  return <h1 className="max-w-[30ch] mx-auto">{children}</h1>
}
