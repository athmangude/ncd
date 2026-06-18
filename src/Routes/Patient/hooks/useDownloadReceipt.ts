import { useState, useCallback } from "react"
import axios, { AxiosError } from "axios"
import { saveAs } from "file-saver"
import { toast } from "@/hooks/useToast"

type ReceiptStatus = "idle" | "loading" | "success" | "error"

export function useDownloadReceipt(transactionId: string | undefined) {
  const [status, setStatus] = useState<ReceiptStatus>("idle")

  const download = useCallback(async () => {
    if (!transactionId) return

    setStatus("loading")

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/transactions/${transactionId}/receipt`,
        { responseType: "blob" }
      )

      const blob = new Blob([response.data], { type: "application/pdf" })
      saveAs(blob, `jireh-receipt-${transactionId}.pdf`)

      setStatus("success")
      toast({
        title: "Receipt downloaded",
        description: "Your PDF receipt has been saved.",
      })
    } catch (err) {
      setStatus("error")

      let description = "Unable to generate receipt. Please try again."
      if (err instanceof AxiosError) {
        if (err.response?.status === 401) {
          description = "Your session has expired. Please log in again."
        } else if (err.response?.status === 404) {
          description = "Receipt not found for this transaction."
        }
      }

      toast({ variant: "destructive", title: "Download failed", description })
    }
  }, [transactionId])

  return { status, download }
}
