import { useEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"

const VALID_TABS = ["home", "circle", "explore", "profile"] as const

export function usePatientDashboardTabNavigation() {
  const location = useLocation()
  const navigate = useNavigate()

  const pathSegment = location.pathname.split("/").pop()
  const currentTab = VALID_TABS.find((tab) => tab === pathSegment) ?? "home"

  const prevTabIndex = useRef(VALID_TABS.indexOf(currentTab))
  const currentTabIndex = VALID_TABS.indexOf(currentTab)
  const direction = currentTabIndex > prevTabIndex.current ? 1 : -1

  useEffect(() => {
    prevTabIndex.current = currentTabIndex
  }, [currentTabIndex])

  const handleTabChange = (value: string) => {
    navigate(value)
  }

  return { currentTab, direction, handleTabChange, pathname: location.pathname }
}
