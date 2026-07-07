import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface CashbackBannerProps {
  title?: string
  description: React.ReactNode
  className?: string
  visible?: boolean
}

export function CashbackBanner({ 
  title = "Pay via Jireh and earn cashback!", 
  description, 
  className,
  visible = true 
}: CashbackBannerProps) {
  if (!visible) return null
  
  return (
    <div className={cn("bg-green-50 rounded-xl p-4 flex items-start gap-3", className)}>
        <div className="mt-1">
          <Sparkles className="w-5 h-5 text-green-600 fill-green-600 shrink-0" />
        </div>
        <div>
          {title && (
            <p className="text-sm font-bold text-foreground mb-1">
              {title}
            </p>
          )}
          <div className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </div>
        </div>
    </div>
  )
}

