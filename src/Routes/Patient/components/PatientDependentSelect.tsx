import { Button } from "@/components/Button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/Command"
import ErrorMessage from "@/components/ErrorMessage"
import FormGroupWrapper from "@/components/form/FormGroupWrapper"
import { Label } from "@/components/Label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/Popover"
import { ArrowRight, ChevronsUpDown, UserPlus } from "lucide-react"
import { useState } from "react"

export default function PatientDependentSelect({
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
  items: {
    value: string
    name: string
    status: string
    phoneNumber: string
    photo: string
  }[]
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
                    className="text-lg capitalize flex items-center jus gap-3 bg-white"
                  >
                    {item.photo ? (
                      <img
                        src={`data:image/jpeg;base64,${item.photo}`}
                        alt={`${item.name}`}
                        className="h-10 w-10 aspect-square my rounded-full object-cover border"
                      />
                    ) : (
                      <span className="rounded-full p-3 bg-muted aspect-square h-10 grid place-content-center text-foreground font-bold">
                        {item.name[0]}
                      </span>
                    )}
                    <div className="flex flex-col text-sm">
                      {item.name?.toLowerCase()}
                      <div className="text-xs text-muted-foreground">
                        {item.phoneNumber}
                      </div>
                    </div>
                    <span className="border border-border rounded-2xl px-3 ml-auto text-sm font-medium">
                      {item.status === "ACCEPTED" ? "ACTIVE" : item.status}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>

          {action && (
            <Button
              className="mt-1 w-full bg-primary/10 hover:bg-primary/5 absolute bottom-0 left-0 font-medium hover:text-primary/70 flex justify-start gap-2 text-lg "
              variant="ghost"
              onClick={(e) => {
                e.preventDefault()
                action.fn()
              }}
            >
              <UserPlus className="w-4 mr-2" />
              {action.label}
              <ArrowRight className="w-4 ml-auto" />
            </Button>
          )}
        </PopoverContent>
      </Popover>
      {error && <ErrorMessage message={error} />}
    </FormGroupWrapper>
  )
}
