import rewardIcon from "@/assets/icons/reward.png"
import { Button } from "@/components/Button"
import { ChevronRight } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function HowItWorksPreview({
  title,
  description,
  link,
}: {
  title: string
  description: string
  link: string
}) {
  const navigate = useNavigate()

  return (
    <section className="flex flex-col gap-5 text-center items-center ">
      <img
        src={rewardIcon}
        alt="Reward Icon"
        className="w-full max-w-[80px] object-contain"
        aria-hidden="true"
      />
      <h1 className="text-xl font-medium max-w-[20ch]">{title}</h1>
      <p className="text-lg text-neutral-500">{description}</p>

      <Button
        className="flex items-center gap-2 w-full"
        size="lg"
        role="link"
        onClick={() => navigate(link)}
      >
        How It Works <ChevronRight className="h-4 w-4" />
      </Button>
    </section>
  )
}
