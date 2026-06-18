import type { ReactNode } from "react"

export default function HealthcareAuthTitle({
  children,
}: {
  children: ReactNode
}) {
  return (
    <h1 className="text-3xl text-black font-medium max-w-[30ch] mx-auto">
      {children}
    </h1>
  )
}
