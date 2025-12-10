'use client'

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium text-foreground",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
        ),
        nav_button_previous: cn(
          "absolute left-1",
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-primary/10"
        ),
        nav_button_next: cn(
          "absolute right-1",
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-primary/10"
        ),
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] aria-label=[`Day of week ${children}`]",
        row: "flex w-full mt-2",
        cell: cn(
          "relative h-9 w-9 text-center text-sm p-0",
          "[&:has([aria-selected])]:bg-primary/10 dark:[&:has([aria-selected])]:bg-primary/20",
          "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
          "focus-within:relative focus-within:z-20"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
          "hover:bg-primary/10 hover:text-primary focus:bg-primary/20 focus:text-primary dark:hover:bg-primary/20",
          "focus:ring-2 focus:ring-primary/20 focus:outline-none transition-colors duration-200",
          "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground dark:bg-primary dark:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground dark:bg-accent dark:text-accent-foreground",
        day_outside:
          "text-muted-foreground opacity-50 aria-selected:bg-primary/5 aria-selected:text-primary aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-primary/10 aria-selected:text-foreground dark:aria-selected:bg-primary/20",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        NextMonthButton: () => <ChevronRight className="h-4 w-4" />,
        PreviousMonthButton: () => <ChevronLeft className="h-4 w-4" />
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
