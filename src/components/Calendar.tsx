import * as React from "react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/style.css"
import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, ...props }: CalendarProps) {
  return (
    <DayPicker
      className={cn("[&_.rdp-day_button:hover]:bg-purple-50 [&_.rdp-selected_.rdp-day_button]:bg-[#A855F7] [&_.rdp-selected_.rdp-day_button]:text-white [&_.rdp-today_.rdp-day_button]:font-bold", className)}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }