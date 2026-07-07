import { Button, ButtonProps } from "@/components/Button"
import { MoveRight } from "lucide-react"
import React from "react"

const ArrowButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, ...props }, ref) => {
    return (
      <Button ref={ref} className="mx-auto" {...props}>
        <div className="flex items-center gap-2">
          {children} <MoveRight className="w-5 h-5" />
        </div>
      </Button>
    )
  }
)

// Set a display name for debugging purposes
ArrowButton.displayName = "ArrowButton"

export default ArrowButton
