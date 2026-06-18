import { useEffect } from "react"
import carefundCardBackground from "@/assets/images/carefund-card-background.png"
import cardBackground from "@/assets/images/card-background.png"
import loansCardBackground from "@/assets/images/loans-card-background.png"
import lockedCardBackground from "@/assets/images/locked-card-background.png"

const CARD_IMAGES = [
  carefundCardBackground,
  cardBackground,
  loansCardBackground,
  lockedCardBackground,
]

export function usePreloadCardImages() {
  useEffect(() => {
    CARD_IMAGES.forEach((src) => {
      const img = new Image()
      img.src = src
    })
  }, [])
}
