import { useEffect, useState } from "react"

export function useWebOTP() {
  const [code, setCode] = useState<string | null>(null)

  useEffect(() => {
    if (!("OTPCredential" in window)) {
      return
    }

    const ac = new AbortController()

    const handler = async () => {
      try {
        const content = (await navigator.credentials.get({
          otp: { transport: ["sms"] },
          signal: ac.signal,
        } as CredentialRequestOptions & { otp: { transport: string[] } })) as any

        if (content && content.code) {
          setCode(content.code)
        }
      } catch (e) {
        // AbortError is expected if the component unmounts or user cancels
        if ((e as Error).name !== "AbortError") {
          console.error(e)
        }
      }
    }

    handler()

    return () => {
      ac.abort()
    }
  }, [])

  return { code }
}

