import { cn } from "@/lib/utils"
import fullLogo from "@/assets/icons/full-logo.svg"
export default function PatientAuthWrapper({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <>
      <header className="w-full max-w-[400px] mx-auto py-5 flex justify-center">
        <img src={fullLogo } alt="Jireh Logo" className="w-1/2" />
      </header>
      <main className="flex justify-center py-5 px-5">
        <section
          className={cn(
            " max-w-[400px] rounded-sm w-full flex flex-col gap-7",
            className
          )}
        >
          {children}
        </section>
      </main>
    </>
  )
}
