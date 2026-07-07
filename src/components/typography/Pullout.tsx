import { cn } from "@/lib/utils"

interface PulloutProps {
  children: React.ReactNode
  className?: string
}

/**
 * Rare emotionally-weighted moment copy (e.g. a milestone message). Brand
 * restricts Libre Baskerville to italic use — this is the only sanctioned
 * entry point, deliberately narrow (no size prop) so `font-serif italic`
 * elsewhere reads as a smell in review rather than a valid alternative.
 */
export function Pullout({ children, className }: PulloutProps) {
  return (
    <p className={cn("font-serif italic text-lg leading-snug", className)}>
      {children}
    </p>
  )
}
