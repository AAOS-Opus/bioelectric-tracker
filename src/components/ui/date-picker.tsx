'use client'

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  onChange?: (date?: Date) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

interface DateRangePickerProps {
  dateRange?: DateRange
  onChange?: (dateRange?: DateRange) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function DatePicker({ 
  date, 
  onChange, 
  className,
  placeholder = "Pick a date",
  disabled = false
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  // Handle keyboard events for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      triggerRef.current?.focus()
    }
  }

  // Handle click outside
  React.useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[role="dialog"]') && !target.closest('[role="button"]')) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal transition-all",
            !date && "text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          onClick={() => !disabled && setIsOpen(true)}
          disabled={disabled}
          aria-label={date ? `Selected date is ${format(date, "PPP")}` : placeholder}
          aria-expanded={isOpen}
          aria-controls="date-picker-content"
          onKeyDown={handleKeyDown}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-primary" aria-hidden="true" />
          {date ? format(date, "PPP") : <span className="text-muted-foreground">{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        id="date-picker-content"
        className="w-auto p-0" 
        align="start"
        role="dialog"
        aria-label="Date picker calendar"
      >
        <Calendar
          mode="single"
          selected={date}
          onSelect={(date) => {
            onChange?.(date)
            setIsOpen(false)
            triggerRef.current?.focus()
          }}
          initialFocus
          disabled={disabled}
          className="rounded-md border shadow-md"
          aria-label="Choose a date"
        />
      </PopoverContent>
    </Popover>
  )
}

export function DateRangePicker({
  dateRange,
  onChange,
  className,
  placeholder = "Pick a date range",
  disabled = false
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  // Handle keyboard events for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  // Handle click outside
  React.useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[role="dialog"]')) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal transition-all",
              !dateRange && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => !disabled && setIsOpen(true)}
            disabled={disabled}
            aria-label={
              dateRange?.from
                ? dateRange.to
                  ? `Selected date range from ${format(dateRange.from, "PPP")} to ${format(dateRange.to, "PPP")}`
                  : `Selected date ${format(dateRange.from, "PPP")}`
                : placeholder
            }
            aria-expanded={isOpen}
            onKeyDown={handleKeyDown}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-primary" aria-hidden="true" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd, y")} -{" "}
                  {format(dateRange.to, "LLL dd, y")}
                </>
              ) : (
                format(dateRange.from, "LLL dd, y")
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0" 
          align="start"
          role="dialog"
          aria-label="Date range picker"
        >
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={(range) => {
              onChange?.(range)
              if (range?.from && range?.to) {
                setIsOpen(false)
              }
            }}
            numberOfMonths={2}
            disabled={disabled}
            className="rounded-md border shadow-md"
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
