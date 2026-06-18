import React, { useEffect } from "react"

export type RouteMetadataProps = {
  title: string
  children: React.ReactNode
}
const RouteMetadata = ({ title, children }: RouteMetadataProps) => {
  useEffect(() => {
    document.title = title + " - Jireh"
  }, [title])

  return <>{children}</>
}

export default RouteMetadata
