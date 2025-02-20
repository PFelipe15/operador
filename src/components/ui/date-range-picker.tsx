"use client"

import * as React from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
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

interface DateRangePickerProps {
  className?: string
  date?: DateRange
  onChange?: (date: DateRange | undefined) => void
  placeholder?: string
}

export function DateRangePicker({
  className,
  date,
  onChange,
  placeholder = "Selecione um período"
}: DateRangePickerProps) {
  const [selectedRange, setSelectedRange] = React.useState<DateRange | undefined>(date)

  React.useEffect(() => {
    setSelectedRange(date)
  }, [date])

  const handleSelect = (range: DateRange | undefined) => {
    setSelectedRange(range)
    onChange?.(range)
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedRange?.from ? (
              selectedRange.to ? (
                <>
                  {format(selectedRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                  {format(selectedRange.to, "dd/MM/yyyy", { locale: ptBR })}
                </>
              ) : (
                format(selectedRange.from, "dd/MM/yyyy", { locale: ptBR })
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={selectedRange?.from}
            selected={selectedRange}
            onSelect={handleSelect}
            numberOfMonths={2}
            locale={ptBR}
            className="rounded-md border"
          />
          <div className="p-3 border-t border-border">
            <div className="flex justify-between">
              <Button
                variant="ghost"
                onClick={() => handleSelect(undefined)}
                size="sm"
              >
                Limpar
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    const today = new Date()
                    const sevenDaysAgo = new Date(today)
                    sevenDaysAgo.setDate(today.getDate() - 7)
                    handleSelect({
                      from: sevenDaysAgo,
                      to: today,
                    })
                  }}
                  size="sm"
                >
                  7 dias
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    const today = new Date()
                    const thirtyDaysAgo = new Date(today)
                    thirtyDaysAgo.setDate(today.getDate() - 30)
                    handleSelect({
                      from: thirtyDaysAgo,
                      to: today,
                    })
                  }}
                  size="sm"
                >
                  30 dias
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Tipos de entrada e saída para melhor tipagem
export type DateRangePickerInput = DateRange | undefined
export type DateRangePickerOutput = DateRange | undefined

interface DatePickerWithRangeProps {
  date: DateRange | undefined
  setDate: (date: DateRange | undefined) => void
}

export function DatePickerWithRange({
  date,
  setDate,
}: DatePickerWithRangeProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                {format(date.to, "dd/MM/yyyy", { locale: ptBR })}
              </>
            ) : (
              format(date.from, "dd/MM/yyyy", { locale: ptBR })
            )
          ) : (
            <span>Selecione um período</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={date?.from}
          selected={date}
          onSelect={setDate}
          numberOfMonths={2}
          locale={ptBR}
        />
      </PopoverContent>
    </Popover>
  )
} 