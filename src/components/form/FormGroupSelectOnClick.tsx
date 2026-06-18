"use client"

import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../Select"
import FormGroupWrapper from "./FormGroupWrapper"
import { Label } from "../Label"

interface FormGroupSelectOnClickProps {
  label: string
  options: { value: string; name: string }[]
  defaultOption?: Option
  onOptionClick?: (value: Option) => void
  placeholder?: string
  id: string
  description?: string
}
export type Option = {
  name: string
  value: string
}

export default function FormGroupSelectOnClick({
  label,
  options,
  defaultOption = { name: "", value: "" },
  onOptionClick,
  placeholder = "Select an option",
  id,
  description,
}: FormGroupSelectOnClickProps) {
  const [value, setValue] = useState<Option>(defaultOption)

  const handleValueChange = (newValue: Option) => {
    setValue(newValue)
    if (onOptionClick) {
      onOptionClick(newValue)
    }
  }

  return (
    <FormGroupWrapper>
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value.value}
        onValueChange={(v) => {
          const selectedOption = options.find((option) => option.value === v)
          if (selectedOption) {
            handleValueChange(selectedOption)
          }
        }}
      >
        <SelectTrigger className="w-full" id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </FormGroupWrapper>
  )
}
