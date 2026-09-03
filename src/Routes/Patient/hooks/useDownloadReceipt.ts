import { useState, useCallback } from "react"
import { saveAs } from "file-saver"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/useToast"

type ReceiptStatus = "idle" | "loading" | "success" | "error"

export function useDownloadReceipt(transactionId: string | undefined) {
  const [status, setStatus] = useState<ReceiptStatus>("idle")

  const download = useCallback(async () => {
    if (!transactionId) return

    setStatus("loading")

    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-receipt",
        { body: { transactionId } }
      )

      if (error) throw error

      const blob = new Blob([data], { type: "application/pdf" })
      saveAs(blob, `jireh-receipt-${transactionId}.pdf`)

      setStatus("success")
      toast({
        title: "Receipt downloaded",
        description: "Your PDF receipt has been saved.",
      })
    } catch (err) {
      setStatus("error")

      let description = "Unable to generate receipt. Please try again."
      if (err instanceof Error) {
        if (err.message?.includes("401") || err.message?.includes("auth")) {
          description = "Your session has expired. Please log in again."
        } else if (err.message?.includes("404") || err.message?.includes("not found")) {
          description = "Receipt not found for this transaction."
        }
      }

      toast({ variant: "destructive", title: "Download failed", description })
    }
  }, [transactionId])

  return { status, download }
}
