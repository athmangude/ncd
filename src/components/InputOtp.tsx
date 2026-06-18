"use client"

import * as React from "react"
import { DashIcon } from "@radix-ui/react-icons"
import { OTPInput, OTPInputContext } from "input-otp"

import { cn } from "@/lib/utils"

// Create a context to pass the type prop to InputOTPSlot
const InputOTPTypeContext = React.createContext<"text" | "password">("text")

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput> & {
    type?: "text" | "password"
  }
>(({ className, containerClassName, type = "text", ...props }, ref) => (
  <InputOTPTypeContext.Provider value={type}>
    <OTPInput
      ref={ref}
      containerClassName={cn(
        "flex items-center  gap-2 has-[:disabled]:opacity-50",
        containerClassName
      )}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  </InputOTPTypeContext.Provider>
))
InputOTP.displayName = "InputOTP"

const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
))
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext)
  const type = React.useContext(InputOTPTypeContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]

  const [showChar, setShowChar] = React.useState(false)
  const prevCharRef = React.useRef(char)

  React.useEffect(() => {
    // Only for password type: show the character when it changes (new input)
    if (type === "password" && char && char !== prevCharRef.current) {
      setShowChar(true)

      // Hide the character after 500ms
      const timer = setTimeout(() => {
        setShowChar(false)
      }, 500)

      prevCharRef.current = char
      return () => clearTimeout(timer)
    } else if (!char) {
      // Reset when character is cleared
      prevCharRef.current = char
      setShowChar(false)
    }
  }, [char, type])

  // Display dot/bullet for password type (unless showing the character temporarily)
  const displayChar =
    type === "password" && char ? (showChar ? char : "•") : char

  return (
    <div
      ref={ref}
      className={cn(
        "font-mono relative flex h-12 w-12 items-center justify-center border-y border-r border-input text-2xl shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 ring-1 ring-ring",
        className
      )}
      {...props}
    >
      {displayChar}
      {hasFakeCaret && (
        <div className="font-mono pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <DashIcon />
  </div>
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
