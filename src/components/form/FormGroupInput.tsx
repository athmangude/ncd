import { HTMLInputTypeAttribute } from "react"
import { Input } from "../Input"
import { Label } from "../Label"
import { UseFormRegisterReturn } from "react-hook-form"
import ErrorMessage from "../ErrorMessage"
import FormGroupWrapper from "./FormGroupWrapper"
import ReactCountryFlag from "react-country-flag"
import { cn } from "@/lib/utils"
import { HelpCircle } from "lucide-react"
import { Button } from "../Button"
import { Popover, PopoverContent, PopoverTrigger } from "../Popover"
import { CountryCode } from "libphonenumber-js"

type FormGroupProps = {
  className?: string
  label: string
  id: string
  type: HTMLInputTypeAttribute
  placeholder?: string
  register: UseFormRegisterReturn
  readonly?: boolean
  error: string | undefined
  defaultValue?: string | number
  description?: string
  helperText?: string
  value?: string | number
  inputMode?:
    | "text"
    | "numeric"
    | "tel"
    | "url"
    | "email"
    | "decimal"
    | undefined
  countryCode?: CountryCode
  onCountryCodeChange?: (code: CountryCode) => void
  isDevMode?: boolean
  /**
   * Mark this input as rendering PII (name, national ID, phone, PIN, etc.).
   * Adds the `.sensitive-data` class so Amplitude session replay masks the
   * value. Default false. See CLAUDE.md analytics guardrail.
   */
  sensitive?: boolean
} & (
  | { type: "file"; multiple?: boolean }
  | {
      type: Exclude<HTMLInputTypeAttribute | "textarea", "file">
      multiple?: undefined
    }
)

export default function FormGroupInput({
  id,
  label,
  type,
  multiple,
  placeholder,
  register,
  error,
  inputMode,
  className,
  readonly,
  defaultValue,
  description,
  helperText,
  countryCode = "KE",
  onCountryCodeChange,
  isDevMode = false,
  sensitive = false,
}: FormGroupProps) {
  const handleFlagClick = () => {
    if (isDevMode && onCountryCodeChange) {
      // Cycle between KE, GB, and NG in dev mode
      const cycle: CountryCode[] = ["KE", "GB", "NG"]
      const currentIndex = cycle.indexOf(countryCode as CountryCode)
      const nextIndex =
        currentIndex === -1 ? 0 : (currentIndex + 1) % cycle.length
      onCountryCodeChange(cycle[nextIndex])
    }
  }

  return (
    <FormGroupWrapper className={cn("relative", className)}>
      <div className="flex items-center gap-1">
        <Label htmlFor={id}>{label}</Label>
        {helperText && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Field information"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="max-w-sm p-4 text-sm text-foreground bg-white border border-border shadow-lg leading-relaxed"
              side="top"
              align="start"
              sideOffset={5}
              style={{ width: "auto", maxWidth: "24rem" }}
            >
              <div className="whitespace-normal break-words">{helperText}</div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      {id === "phoneNumber" && (
        <button
          type="button"
          onClick={handleFlagClick}
          className={cn(
            "absolute top-[30px] left-2 z-10",
            isDevMode && onCountryCodeChange
              ? "cursor-pointer hover:opacity-70 transition-opacity"
              : "cursor-default"
          )}
          disabled={!isDevMode || !onCountryCodeChange}
          title={
            isDevMode && onCountryCodeChange
              ? "Switch country (Dev Only)"
              : undefined
          }
        >
          <ReactCountryFlag
            countryCode={countryCode}
            svg
            style={{
              width: "1.3em",
              height: "1.3em",
            }}
          />
        </button>
      )}
      <Input
        id={id}
        type={type}
        {...(type === "file" && { multiple })}
        placeholder={placeholder}
        inputMode={inputMode}
        defaultValue={defaultValue}
        {...register}
        aria-invalid={!!error}
        readOnly={readonly}
        className={cn(
          "[&#phoneNumber]:pl-9",
          error
            ? "border-destructive focus-visible:ring-destructive"
            : "focus-visible:ring-ring",
          sensitive && "sensitive-data"
        )}
      />
      {error && <ErrorMessage message={error} />}

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </FormGroupWrapper>
  )
}
