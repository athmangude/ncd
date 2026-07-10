import { AnimatePresence, motion } from "framer-motion"
import {
  tabContentSwitchVariants,
  tabContentSwitchTransition,
} from "../animation"

interface DashboardTabContentProps {
  pathname: string
  direction: number
  children: React.ReactNode
}

export function DashboardTabContent({
  pathname,
  direction,
  children,
}: DashboardTabContentProps) {
  return (
    <div className="flex-1 relative overflow-hidden">
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={pathname}
          custom={direction}
          variants={tabContentSwitchVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={tabContentSwitchTransition}
          className="h-full w-full overflow-y-auto overflow-x-hidden pb-tabbar"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
