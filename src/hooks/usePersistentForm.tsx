import { useEffect } from "react"
import {
  useForm,
  UseFormReturn,
  UseFormProps,
  FieldValues,
  UseFormHandleSubmit,
} from "react-hook-form"

export function usePersistentForm<T extends FieldValues>(
  storageKey: string,
  options?: UseFormProps<T>
): UseFormReturn<T> & {
  clearPersistentState: () => void
} {
  // Retrieve persisted values if available
  const stored = localStorage.getItem(storageKey)
  const persistedValues = stored ? JSON.parse(stored) : undefined

  // Merge persisted values with provided defaultValues
  const defaultValues = persistedValues || options?.defaultValues

  const methods = useForm<T>({
    ...options,
    defaultValues,
  })

  // Persist form state on changes
  useEffect(() => {
    const subscription = methods.watch((value) => {
      localStorage.setItem(storageKey, JSON.stringify(value))
    })
    return () => subscription.unsubscribe()
  }, [methods, storageKey])

  // Clear persistent storage
  const clearPersistentState = () => {
    localStorage.removeItem(storageKey)
  }

  // Pass-through wrapper around handleSubmit. NOTE: this does NOT clear the
  // persisted draft on success — callers that want the draft cleared after a
  // successful submit must call `clearPersistentState()` (or `reset()`)
  // themselves, typically in their mutation's onSuccess.
  const handlePersistentSubmit: UseFormHandleSubmit<T> = (onValid, onInvalid) =>
    methods.handleSubmit(async (data, event) => {
      await onValid(data, event)
    }, onInvalid)

  // Clear the form and persistent state
  const clearForm = () => {
    methods.reset()
    clearPersistentState()
  }

  return {
    ...methods,
    handleSubmit: handlePersistentSubmit,
    reset: clearForm,
    clearPersistentState,
  }
}

export function clearPeristentForm(storageKeys: string[]) {
  storageKeys.forEach((key) => {
    localStorage.removeItem(key)
  })
}
