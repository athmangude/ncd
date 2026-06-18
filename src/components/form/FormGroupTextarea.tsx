import { Label } from "../Label"
import { UseFormRegisterReturn } from "react-hook-form"
import ErrorMessage from "../ErrorMessage"
import FormGroupWrapper from "./FormGroupWrapper"
import { Textarea } from "../Textarea"

type FormGroupProps = {
  label: string
  id: string
  placeholder?: string
  register: UseFormRegisterReturn
  error: string | undefined
  className?: string
}

export default function FormGroupTextarea({
  id,
  label,
  placeholder,
  register,
  error,
  className,
}: FormGroupProps) {
  return (
    <FormGroupWrapper className={className}>
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        placeholder={placeholder}
        {...register}
        aria-invalid={error ? true : false}
      />
      {error && <ErrorMessage message={error} />}
    </FormGroupWrapper>
  )
}
