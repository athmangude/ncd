import { cn } from "@/lib/utils"

const LEVEL_TAG = {
  2: "h2",
  3: "h3",
} as const

interface SectionTitleProps {
  /**
   * Heading level. `2` renders an <h2>, `3` an <h3>. Defaults to 2: a section
   * title normally sits one level below the page title, so an <h2> under the
   * page <h1> keeps the document outline gap-free (no h1→h3 skip). Pass
   * `level={3}` only for a subsection nested inside another SectionTitle's
   * section.
   *
   * NOTE: level is decided per call site today. A follow-up (see the restyle
   * plan) will derive it from nesting context so authors can't accidentally
   * skip a level — track that work, don't re-solve it here.
   */
  level?: keyof typeof LEVEL_TAG
  children: React.ReactNode
  /**
   * Layout-only className (spacing, truncation, flex sizing). Do NOT pass type
   * or colour classes here — the size/weight/colour come from the base heading
   * styles in index.css so section titles stay consistent everywhere.
   */
  className?: string
  id?: string
}

/**
 * Canonical in-page section heading. Renders the correct semantic tag for its
 * level and inherits the base h2/h3 type scale (index.css) — no per-call-site
 * font/colour overrides, so peer section titles always match.
 */
export function SectionTitle({
  level = 2,
  children,
  className,
  id,
}: SectionTitleProps) {
  const Tag = LEVEL_TAG[level]
  return (
    <Tag id={id} className={cn(className)}>
      {children}
    </Tag>
  )
}
