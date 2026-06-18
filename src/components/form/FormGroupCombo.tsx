import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { Button } from "../Button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../Command"
import { Label } from "../Label"
import { Popover, PopoverContent, PopoverTrigger } from "../Popover"
import FormGroupWrapper from "./FormGroupWrapper"
import { useState } from "react"
import { cn } from "@/lib/utils"
import ErrorMessage from "../ErrorMessage"

export default function FormGroupCombo({
  id,
  label,
  placeholder,
  items,
  field,
  error,
  action,
  defaultValue,
}: {
  id: string
  label: string
  items: { value: string; name: string }[]
  placeholder: string
  field: any
  error: string | undefined
  action?: {
    fn: () => void
    label: string
  }
  defaultValue?: string
}) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(defaultValue || "")
  const [search, setSearch] = useState("")

  const filteredItems = search
    ? items.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
      )
    : items

  return (
    <FormGroupWrapper className="w-full">
      <Label htmlFor={id}>{label}</Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {value
              ? items.find((item) => item.value === value)?.name
              : "Select an option..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={`w-full p-0 ${action && "relative pb-10"}`}>
          <Command className="w-full" shouldFilter={false}>
            <CommandInput
              placeholder={placeholder}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="w-full" defaultValue={defaultValue}>
              <CommandEmpty>No option found.</CommandEmpty>
              <CommandGroup>
                {filteredItems.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.value}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? "" : currentValue)
                      field.onChange(currentValue === value ? "" : currentValue)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === item.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {item.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>

          {action && (
            <Button
              className="mt-1 w-full bg-primary/10 hover:bg-primary/5 absolute bottom-0 left-0 text-primary font-bold hover:text-primary/70"
              variant="ghost"
              onClick={(e) => {
                e.preventDefault()
                action.fn()
              }}
            >
              <Plus className="w-4 mr-2" />
              {action.label}
            </Button>
          )}
        </PopoverContent>
      </Popover>
      {error && <ErrorMessage message={error} />}
    </FormGroupWrapper>
  )
}
