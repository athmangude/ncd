import { Clipboard } from "lucide-react"
import { useState } from "react"

export default function CopyButton({ text }: { text: string }) {
  const [isClicked, setIsClicked] = useState(false)

  const handleClick = () => {
    navigator.clipboard.writeText(text)
    setIsClicked(true)
    setTimeout(() => setIsClicked(false), 200)
  }

  return (
    <button
      className={`flex items-center gap-1 text-neutral-800 rounded-lg px-3 py-2 bg-neutral-100 font-medium transition-all duration-200 hover:bg-neutral-200 active:scale-95 ${
        isClicked ? "scale-105 bg-green-100 text-primary" : ""
      }`}
      onClick={handleClick}
    >
      <Clipboard className="h-5 w-5 " />
      <span>Copy</span>
    </button>
  )
}
