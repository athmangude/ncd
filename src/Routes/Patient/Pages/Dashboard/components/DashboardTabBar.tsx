import { TabsList } from "@/components/Tabs"
import { CircleDotDashed, Search, House, CircleUserRound } from "lucide-react"
import { motion } from "framer-motion"
import type { MotionValue } from "framer-motion"
import { PatientTabTrigger } from "./PatientTabTrigger"

interface DashboardTabBarProps {
  listRef: React.Ref<HTMLDivElement>
  tabRefs: React.MutableRefObject<Record<string, HTMLButtonElement | null>>
  cx: MotionValue<number>
  pathD: MotionValue<string>
}

export function DashboardTabBar({
  listRef,
  tabRefs,
  cx,
  pathD,
}: DashboardTabBarProps) {
  return (
    <section className="w-full flex justify-center fixed bottom-0 left-0 z-50 safe-pb">
      <div className="relative max-w-md w-full mt-5 h-20">
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-sm"
          style={{ filter: "drop-shadow(0px -1px 2px rgba(0,0,0,0.05))" }}
        >
          <motion.path
            d={pathD}
            className="fill-background"
            strokeWidth="1"
            stroke="hsl(var(--border))"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <motion.div
          className="absolute top-0 w-8 h-8 rounded-full bg-bubblegum-200 flex items-center justify-center pointer-events-none z-20"
          style={{
            x: cx,
            translateX: "-50%",
            y: 4,
          }}
        />

        <TabsList
          ref={listRef}
          className="relative w-full h-full justify-between rounded-none px-2 sm:px-5 bg-transparent !bg-transparent border-0"
        >
          <PatientTabTrigger
            value="home"
            icon={<House className="w-5 h-5" />}
            setRef={(el) => (tabRefs.current["home"] = el)}
          />
          <PatientTabTrigger
            value="circle"
            icon={<CircleDotDashed className="w-5 h-5" />}
            setRef={(el) => (tabRefs.current["circle"] = el)}
          />
          <PatientTabTrigger
            value="explore"
            icon={<Search className="w-5 h-5" />}
            setRef={(el) => (tabRefs.current["explore"] = el)}
          />
          <PatientTabTrigger
            value="profile"
            icon={<CircleUserRound className="w-5 h-5" />}
            setRef={(el) => (tabRefs.current["profile"] = el)}
          />
        </TabsList>
      </div>
    </section>
  )
}
