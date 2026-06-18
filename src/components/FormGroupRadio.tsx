import { Label } from "@radix-ui/react-label"
import { RadioGroup, RadioGroupItem } from "./Radio"

export default function FormGroupRadio({
  label,
  options,
  name,
  error,
  value, // Accept current value
  onChange, // Accept onChange handler
  onBlur, // Optionally accept onBlur
}: {
  name: string
  label: string
  error?: string
  value?: string
  onChange?: (value: string) => void
  onBlur?: () => void
  options: {
    label: string
    value: number | string | boolean
  }[]
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <RadioGroup
        className="flex gap-5 items-center"
        name={name}
        value={value} // Pass the value down
        onValueChange={onChange} // Wire up the onChange event
        onBlur={onBlur} // Wire up onBlur if you need it
      >
        {options.map((option, index) => (
          <div key={index} className="flex items-center space-x-2">
            <RadioGroupItem
              value={option.value.toString()}
              id={`option-${index}`}
              className="w-4 h-4"
            />
            <Label htmlFor={`option-${index}`}>{option.label}</Label>
          </div>
        ))}
      </RadioGroup>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
