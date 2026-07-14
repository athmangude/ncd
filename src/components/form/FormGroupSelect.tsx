import { useState } from "react"
import ErrorMessage from "../ErrorMessage"
import FormGroupWrapper from "./FormGroupWrapper"
import { Label } from "../Label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../Select"
import { Plus } from "lucide-react"
import { Button } from "../Button"

type FormGroupProps = {
  label: string
  id: string
  placeholder?: string
  field: any
  error: string | undefined
  options: {
    name: string
    value: string
  }[]
  showSearch?: boolean
  action?: {
    fn: () => void
    label: string
  }
  defaultValue?: string
  description?: string
}

export default function FormGroupSelect({
  id,
  label,
  placeholder,
  field,
  error,
  options,
  showSearch,
  action,
  description,
}: FormGroupProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const filteredOptions = options.filter((option) =>
    option.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <FormGroupWrapper>
      <Label htmlFor={id}>{label}</Label>
      <Select
        onValueChange={field.onChange}
        name={id}
        onOpenChange={() => setSearchQuery("")}
        value={field.value || ""}
      >
        <SelectTrigger className="w-full" id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup className="text-center">
            {showSearch && (
              <div className="sticky top-0 bg-background z-10">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-2 border-b focus:outline-none"
                  autoFocus
                  aria-label="Search options"
                />
              </div>
            )}
            {filteredOptions.length === 0 ? (
              <div className="p-2 text-muted-foreground text-sm">
                No results found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <SelectItem
                  key={option.name}
                  value={option.value}
                  className="capitalize"
                >
                  {option.name}
                </SelectItem>
              ))
            )}
          </SelectGroup>

          {action && (
            <Button
              className="mt-1 w-full"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                action.fn()
              }}
            >
              <Plus className="w-4 mr-2" />
              {action.label}
            </Button>
          )}
        </SelectContent>
      </Select>
      {error && <ErrorMessage message={error} />}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </FormGroupWrapper>
  )
}
