import { useEffect, useState, useRef } from "react"
import { useMotionValue, useTransform, animate } from "framer-motion"
import { TABBAR_TRANSITION } from "../animation"

const BAR_HEIGHT = 80
const CURVE_RADIUS = 38
const DIP_DEPTH = 28

export function useTabBarAnimation(currentTab: string) {
  const [width, setWidth] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const cx = useMotionValue(0)

  const pathD = useTransform(cx, (x) => {
    const w = width
    const h = BAR_HEIGHT
    const r = CURVE_RADIUS
    const depth = DIP_DEPTH

    if (x < 0) x = 0

    return `
      M 0 0
      L ${x - r - 15} 0
      C ${x - r} 0, ${x - r + 10} ${depth}, ${x} ${depth}
      C ${x + r - 10} ${depth}, ${x + r} 0, ${x + r + 15} 0
      L ${w} 0
      L ${w} ${h}
      L 0 ${h}
      Z
    `
  })

  const measurePositions = () => {
    if (!listRef.current) return
    const listRect = listRef.current.getBoundingClientRect()
    setWidth(listRect.width)

    const activeEl = tabRefs.current[currentTab]
    if (activeEl) {
      const rect = activeEl.getBoundingClientRect()
      const targetX = rect.left - listRect.left + rect.width / 2
      cx.set(targetX)
    }
  }

  useEffect(() => {
    measurePositions()
    window.addEventListener("resize", measurePositions)
    return () => window.removeEventListener("resize", measurePositions)
    // Mount-only setup; measurePositions reads refs which are stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!listRef.current) return
    const listRect = listRef.current.getBoundingClientRect()
    const activeEl = tabRefs.current[currentTab]

    if (activeEl) {
      const rect = activeEl.getBoundingClientRect()
      const targetX = rect.left - listRect.left + rect.width / 2

      const controls = animate(cx, targetX, TABBAR_TRANSITION)

      return () => controls.stop()
    }
  }, [currentTab, width, cx])

  return { listRef, tabRefs, cx, pathD }
}
