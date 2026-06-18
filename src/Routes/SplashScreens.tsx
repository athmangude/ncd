import { Button } from "@/components/Button"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import cashbackImage from "@/assets/images/splashscreens/cashback.png"
import networkImage from "@/assets/images/splashscreens/network.png"
import { ArrowLeftIcon, ArrowRightIcon } from "@radix-ui/react-icons"
import SplashScreenProgressBar from "./SplashScreenProgressBar"
import MobileWrapper, { LogoHeader } from "./MobileWrapper"

const screens: {
  title: React.ReactNode
  img: {
    src: string
    alt: string
  }
}[] = [
  {
    title: (
      <>
        Earn <TitleEmphasis>5% cashback</TitleEmphasis><br></br> at partner hospitals.
      </>
    ),
    img: {
      src: cashbackImage,
      alt: "Earn cashback on payments",
    },
  },
  {
    title: (
      <>
        <TitleEmphasis>Share your benefits</TitleEmphasis><br></br> with family and friends.
      </>
    ),
    img: {
      src: networkImage,
      alt: "Connect with your network of care providers",
    },
  },
]

export default function SplashScreens() {
  const [currentScreen, setCurrentScreen] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const activeScreen = screens[currentScreen]
  const navigate = useNavigate()

  useEffect(() => {
    screens.forEach((screen) => {
      const img = new Image()
      img.src = screen.img.src
    })
  }, [])

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null) // otherwise the swipe is fired even with usual touch events
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) =>
    setTouchEnd(e.targetTouches[0].clientX)

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    
    if (isLeftSwipe && currentScreen < screens.length - 1) {
      handleNext()
    }
    if (isRightSwipe && currentScreen > 0) {
      handlePrev()
    }
  }

  const handleNext = () => {
    if (currentScreen < screens.length - 1) {
      setCurrentScreen((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentScreen > 0) {
      setCurrentScreen((prev) => prev - 1)
    }
  }


  return (
    <MobileWrapper
      header={<
        LogoHeader showIcons={false} 
        className="flex justify-center"
          />}
      footer={
        <div className="border-t bg-white dark:bg-neutral-950 flex flex-col gap-4 p-4 pb-6">
          <SplashScreenProgressBar
            currentStep={currentScreen}
            totalSteps={screens.length}
            activeColor="bg-primary"
            inactiveColor="bg-primary/20"
          />
          <div className="flex items-center gap-3 w-full">
            <Button
              onClick={handlePrev}
              variant="secondary"
              size="icon"
              className={`shrink-0 ${
                currentScreen === 0 ? "invisible" : ""
              }`}
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </Button>

            <Button
              onClick={() => navigate("/patients/auth/")}
              role="link"
              className="flex-1"
            >
              Get Started
            </Button>

            <Button
              onClick={handleNext}
              variant="secondary"
              size="icon"
              className={` shrink-0 ${
                currentScreen === screens.length - 1 ? "invisible" : ""
              }`}
            >
              <ArrowRightIcon className="w-6 h-6" />
            </Button>
          </div>
        </div>
      }
    >
      <div
        className="flex flex-col h-full gap-4"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <h1
          key={`title-${currentScreen}`}
          className="text-2xl font-medium text-center mx-auto shrink-0"
        >
          {activeScreen.title}
        </h1>


          <img
            key={currentScreen}
            src={activeScreen.img.src}
            alt={activeScreen.img.alt}
            loading="eager"
            draggable={false}
            className="h-full mx-auto transition-all duration-500 ease-in-out opacity-100 animate-in fade-in zoom-in-95 slide-in-from-bottom-8 px-2 select-none object-contain"
          />

      </div>
    </MobileWrapper>
  )
}



function TitleEmphasis({ children }: { children: React.ReactNode }) {
  return <span className="text-primary">{children}</span>
}
