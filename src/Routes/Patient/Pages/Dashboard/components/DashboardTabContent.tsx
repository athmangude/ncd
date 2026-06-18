import { AnimatePresence, motion } from "framer-motion"

const variants = {
  enter: {
    opacity: 0,
    x: 4,
  },
  center: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
    x: -4,
  },
}

interface DashboardTabContentProps {
  pathname: string
  direction: number
  children: React.ReactNode
}

export function DashboardTabContent({ pathname, direction, children }: DashboardTabContentProps) {
  return (
    <div className="flex-1 relative overflow-hidden">
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={pathname}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            duration: 0.15,
            ease: "easeOut",
          }}
          className="h-full w-full overflow-y-auto pb-28"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
