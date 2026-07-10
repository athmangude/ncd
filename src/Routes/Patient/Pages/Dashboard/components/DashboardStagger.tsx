import { ReactNode } from "react"
import { motion, useReducedMotion } from "framer-motion"
import {
  sectionVariants,
  tabSwitchVariants,
  staggerContainerVariants,
} from "../animation"

/**
 * The shared dashboard entrance-animation system. Wrap a tab's top-level
 * sections in `DashboardStagger > DashboardSection` and they inherit BOTH
 * motions for free:
 *  - first load → sections stagger in from the bottom
 *  - tab switch / later renders → a quick fade, no stagger
 *
 * `mode` picks which motion plays; drive it from `useDashboardFirstLoad`.
 * Do not hand-roll a transition for new dashboard content — wrap it here so
 * it stays in lockstep with every other section.
 */

export type DashboardAnimationMode = "intro" | "switch"

export function DashboardStagger({
  mode,
  children,
  className,
}: {
  mode: DashboardAnimationMode
  children: ReactNode
  className?: string
}) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={mode === "intro" ? staggerContainerVariants : undefined}
    >
      {children}
    </motion.div>
  )
}

export function DashboardSection({
  mode,
  children,
  className,
}: {
  mode: DashboardAnimationMode
  children: ReactNode
  className?: string
}) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      variants={mode === "intro" ? sectionVariants : tabSwitchVariants}
    >
      {children}
    </motion.div>
  )
}
