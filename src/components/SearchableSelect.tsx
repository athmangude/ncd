"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "./Button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./Command"
import { Popover, PopoverContent, PopoverTrigger } from "./Popover"
import { Label } from "./Label"

export type Option = {
  value: string
  label: string
}

type SearchableSelectProps = {
  options: Option[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  emptyMessage?: string
  label?: string
  disabled?: boolean
  className?: string
  clearable?: boolean
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select an option",
  emptyMessage = "No results found.",
  label,
  disabled = false,
  className,
  clearable = false,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  const selectedOption = React.useMemo(() => {
    return options.find((option) => option.value === value)
  }, [options, value])

  const handleSelect = React.useCallback(
    (currentValue: string) => {
      onValueChange?.(currentValue === value && clearable ? "" : currentValue)
      setOpen(false)
      setSearchValue("")
    },
    [value, onValueChange, clearable]
  )

  const handleClear = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onValueChange?.("")
      setSearchValue("")
    },
    [onValueChange]
  )

  const id = React.useId()
  const labelId = label ? `${id}-label` : undefined

  return (
    <div className={cn("grid w-full gap-1.5", className)}>
      {label && (
        <Label htmlFor={id} id={labelId}>
          {label}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-labelledby={labelId}
            aria-autocomplete="list"
            className={cn(
              "w-full justify-between",
              !selectedOption?.label && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            {selectedOption?.label || placeholder}
            <div className="flex items-center gap-1 ml-2">
              {selectedOption && clearable && (
                <X
                  className="h-4 w-4 opacity-50 hover:opacity-100"
                  onClick={handleClear}
                  aria-label="Clear selection"
                />
              )}
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                placeholder="Search..."
                className="h-9 border-0 outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                value={searchValue}
                onValueChange={setSearchValue}
              />
            </div>
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup className="max-h-60 overflow-auto">
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={handleSelect}
                    className="flex items-center justify-between"
                    aria-selected={value === option.value}
                  >
                    {option.label}
                    {value === option.value && (
                      <Check
                        className="h-4 w-4 opacity-100"
                        aria-hidden="true"
                      />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
