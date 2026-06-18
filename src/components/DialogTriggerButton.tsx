import { DialogTrigger } from "@radix-ui/react-dialog"

export default function DialogTriggerButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled: boolean
}) {
  return (
    <DialogTrigger
      className="w-full bg-primary text-white rounded-md px-4 py-2 font-medium disabled:pointer-events-none disabled:opacity-50 flex justify-center items-center max-w-64"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </DialogTrigger>
  )
}
