import { useState, useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"
import { User } from "lucide-react"

interface ProfileAvatarProps {
  src?: string | null
  name?: string
  firstName?: string
  lastName?: string
  className?: string
  alt?: string
  fallbackClassName?: string
  iconClassName?: string
  priority?: boolean // If true, eager loads
}

const getInitials = (name?: string, firstName?: string, lastName?: string) => {
  if (firstName && lastName) {
    return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`
  }
  if (name) {
    const parts = name.trim().split(" ")
    if (parts.length >= 2) {
        return `${parts[0].charAt(0).toUpperCase()}${parts[1].charAt(0).toUpperCase()}`
    }
    return name.substring(0, 2).toUpperCase()
  }
  return null
}

export function ProfileAvatar({
  src,
  name,
  firstName,
  lastName,
  className,
  alt,
  fallbackClassName,
  iconClassName,
  priority = false
}: ProfileAvatarProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(() => {
    if (!src) return "error"
    if (src.startsWith("data:")) return "loaded"
    return "loading"
  })
  const [currentSrc, setCurrentSrc] = useState<string | null>(() => {
    if (src && src.startsWith("data:")) return src
    return null
  })

  useEffect(() => {
    if (!src) {
      setStatus("error")
      setCurrentSrc(null)
      return
    }

    if (src.startsWith("data:")) {
      setCurrentSrc(src)
      setStatus("loaded")
      return
    }

    // Reset status if src changes
    setStatus("loading")
    
    const img = new Image()
    img.src = src
    
    if (priority) {
       img.fetchPriority = "high"
    }

    const handleLoad = () => {
      setCurrentSrc(src)
      setStatus("loaded")
    }

    const handleError = () => {
      setStatus("error")
    }

    if (img.complete) {
        handleLoad()
    } else {
        img.onload = handleLoad
        img.onerror = handleError
    }
    
    return () => {
        img.onload = null
        img.onerror = null
    }
  }, [src, priority])

  const initials = useMemo(() => getInitials(name, firstName, lastName), [name, firstName, lastName])

  return (
    <div className={cn("relative aspect-square overflow-hidden rounded-full bg-neutral-100 shrink-0", className)}>
      {/* Show skeleton while loading if we have a source */}
      {status === "loading" && src && (
         <div className="absolute inset-0 h-full w-full rounded-full animate-shimmer" />
      )}
      
      {/* Show image only when loaded */}
      {status === "loaded" && currentSrc && (
        <img
          src={currentSrc}
          alt={alt || name || "Profile"}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300", 
            // Fade in effect
            "opacity-100"
          )}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
        />
      )}

      {/* Show fallback if error or no source */}
      {(status === "error" || !src) && (
        <div className={cn("flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-500 font-medium", fallbackClassName)}>
            {initials ? (
                <span>
                    {initials}
                </span>
            ) : (
                <User className={cn("h-1/2 w-1/2", iconClassName)} />
            )}
        </div>
      )}
    </div>
  )
}

