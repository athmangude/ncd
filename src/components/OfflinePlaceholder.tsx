interface OfflinePlaceholderProps {
  message: string
}

export function OfflinePlaceholder({ message }: OfflinePlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 p-8 min-h-[60vh] text-center">
      <div className="relative flex items-center justify-center">
        <img
          src="/offline-placeholder.svg"
          alt="Offline"
          className="w-24 h-24 object-contain"
        />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-foreground">You are offline</h2>
        <p className="text-sm text-muted-foreground max-w-[55ch] mx-auto">
          {message}
        </p>
      </div>
    </div>
  )
}
