import type { Transition, Variants } from "framer-motion"

/**
 * Single source of motion timing for the dashboard. Every tab's content,
 * the shared skeleton, and the tab-bar indicator read these tokens so a
 * future dashboard edit inherits the same feel by construction — wrap new
 * content in `DashboardSection` (see DashboardStagger.tsx) rather than
 * hand-rolling a transition.
 *
 * Two motions:
 *  - "intro" — first load (no cached data yet): sections stagger in from
 *    the bottom, one after another.
 *  - "switch" — content already available (tab revisit, or any later
 *    render): a quick, non-staggered reveal.
 */

export const SECTION_DURATION = 0.3
export const SECTION_STAGGER = 0.06
export const TAB_SWITCH_DURATION = 0.2
export const TABBAR_DURATION = 0.3

export const TABBAR_TRANSITION: Transition = {
  duration: TABBAR_DURATION,
  ease: [0.25, 0.1, 0.25, 1.0],
}

/** `DashboardSection` variants for the staggered first-load intro. */
export const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: SECTION_DURATION, ease: "easeOut" },
  },
}

/** `DashboardSection` variants for the snappy tab-switch reveal (no rise). */
export const tabSwitchVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: TAB_SWITCH_DURATION, ease: "easeOut" },
  },
}

/** `DashboardStagger` container variants — drives SECTION_STAGGER between children. */
export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: SECTION_STAGGER },
  },
}

/** The AnimatePresence transition for switching between dashboard tabs. */
export const tabContentSwitchVariants: Variants = {
  enter: { opacity: 0, x: 4 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -4 },
}

export const tabContentSwitchTransition: Transition = {
  duration: TAB_SWITCH_DURATION,
  ease: "easeOut",
}
