import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { format } from "date-fns"
import { useNavigate, useParams } from "react-router-dom"
import LoadingPage from "@/Routes/LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"
import { Button } from "@/components/Button"
import { useToast } from "@/hooks/useToast"
import PatientPageWrapper from "./PatientPageWrapper"

interface Currency {
  id: number
  code: string
  name: string
  symbol: string
}

interface DiscountDetails {
  id: number
  code: string
  description: string | null
  discountType: "PERCENTAGE" | "FIXED_AMOUNT"
  discountValue: string
  currency: Currency | null
  validFrom: string | null
  validUntil: string | null
  minimumOrderAmount: string | null
  maximumDiscountAmount: string | null
  isActive: boolean
  status: string
  facility: { id: number; name: string } | null
}

export default function PatientDiscountDetails() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const query = useQuery({
    queryKey: ["discountCode", id],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/discount-codes/${id}`
      )
      return response.data?.data as DiscountDetails
    },
    enabled: !!id,
  })

  if (query.isLoading) return <LoadingPage />
  if (query.isError || !query.data) return <ErrorBlock />

  const d = query.data
  const isPercentage = d.discountType === "PERCENTAGE"
  const valueNumber = parseFloat(d.discountValue)
  const currencySymbol = d.currency?.symbol || d.currency?.code || "KES"

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(d.code)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Discount code copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({
        title: "Copy failed",
        description: "Unable to copy discount code",
      })
    }
  }

  const share = async () => {
    const shareTitle = "Jireh Health discount"
    const shareText = d.description
      ? `${d.description} — use code ${d.code}`
      : `Use code ${d.code} for a discount on Jireh Health`
    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, text: shareText })
        return
      }
      await navigator.clipboard.writeText(shareText)
      toast({
        title: "Copied to clipboard",
        description: "Share message copied",
      })
    } catch {
      // user cancelled or share failed; nothing to do
    }
  }

  const showMax =
    d.maximumDiscountAmount != null &&
    !isNaN(parseFloat(d.maximumDiscountAmount))
  const showExpiry = !!d.validUntil
  const showFooterBox = showMax || showExpiry

  return (
    <PatientPageWrapper
      title="Discount details"
      onBack={() => navigate(-1)}
      className="bg-white min-h-screen pb-32"
    >
      <div className="flex flex-col items-center gap-6 px-6 pt-10">
        <div className="flex items-end justify-center">
          <span className="text-7xl font-extrabold tracking-tight bg-gradient-to-b from-primary/60 to-primary bg-clip-text text-transparent leading-none">
            {isPercentage
              ? `${valueNumber}%`
              : `${currencySymbol} ${valueNumber.toLocaleString()}`}
          </span>
          <span className="ml-1 mb-2 text-2xl font-extrabold text-primary tracking-tight">
            OFF
          </span>
        </div>

        {d.description && (
          <p className="text-center text-xl font-medium text-gray-900 leading-snug">
            {d.description}
          </p>
        )}

        {d.facility?.name && (
          <p className="text-center text-sm text-gray-500 -mt-3">
            {d.facility.name}
          </p>
        )}

        {showFooterBox && (
          <div className="w-full mt-2 rounded-2xl border border-gray-200 overflow-hidden">
            <div className="flex divide-x divide-gray-200">
              {showMax && (
                <div className="flex-1 px-4 py-4 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500">Max discount</span>
                  <span className="text-base font-semibold text-gray-900">
                    {currencySymbol}{" "}
                    {parseFloat(d.maximumDiscountAmount!).toLocaleString()}
                  </span>
                </div>
              )}
              {showExpiry && (
                <div className="flex-1 px-4 py-4 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500">Expires</span>
                  <span className="text-base font-semibold text-gray-900">
                    {format(new Date(d.validUntil!), "d MMM")}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 p-4 pb-8 z-50">
        <div className="mx-auto flex max-w-[450px] gap-3">
          <Button
            onClick={share}
            className="flex-1 bg-primary/10 text-primary hover:bg-primary/20 border-none shadow-none"
          >
            Share
          </Button>
          <Button
            onClick={copyCode}
            disabled={copied}
            className="flex-[2] disabled:opacity-100"
          >
            {copied ? "Copied!" : "Copy discount code"}
          </Button>
        </div>
      </div>
    </PatientPageWrapper>
  )
}
