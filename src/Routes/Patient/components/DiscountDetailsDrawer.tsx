import { useState } from "react"
import { format } from "date-fns"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/Drawer"
import { Button } from "@/components/Button"
import { Share, Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/useToast"
import type { DiscountCode } from "../Pages/Dashboard/components/DiscountsSection"

interface DiscountDetailsDrawerProps {
  discount: DiscountCode | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DiscountDetailsDrawer({
  discount,
  open,
  onOpenChange,
}: DiscountDetailsDrawerProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
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

  const share = async (d: DiscountCode) => {
    const shareText = d.description
      ? `${d.description} — use code ${d.code}`
      : `Use code ${d.code} for a discount on Jireh Health`
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Jireh Health discount",
          text: shareText,
        })
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

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setCopied(false)
      }}
    >
      <DrawerContent>
        {discount && (
          <>
            <DrawerHeader>
              <DrawerTitle className="font-mono">{discount.code}</DrawerTitle>
              <DrawerDescription>{discount.description}</DrawerDescription>
            </DrawerHeader>

            <div className="flex items-center justify-center gap-1 py-2">
              <p
                className="bg-gradient-to-b from-discount-gradient-200 to-discount-gradient-100 bg-clip-text text-6xl font-bold leading-none text-transparent"
                style={{
                  WebkitTextStroke: "0.5px hsl(var(--discount-gradient))",
                }}
              >
                {parseFloat(discount.discountValue).toLocaleString()}
              </p>
              <span
                className="flex flex-col items-start bg-gradient-to-b from-discount-gradient-200 to-discount-gradient-100 bg-clip-text text-2xl font-semibold uppercase leading-[1.1] tracking-wide text-transparent"
                style={{
                  WebkitTextStroke: "0.5px hsl(var(--discount-gradient))",
                }}
              >
                <span>
                  {discount.discountType === "PERCENTAGE"
                    ? "%"
                    : discount.currency.symbol}
                </span>
                <span>OFF</span>
              </span>
            </div>

            {discount.facility?.name && (
              <p className="text-center text-sm text-muted-foreground">
                Valid at {discount.facility.name}
              </p>
            )}

            <div className="grid grid-cols-3 gap-2 rounded-xl border border-border p-3 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Min. bill</p>
                <p className="text-sm font-medium text-foreground">
                  {discount.minimumOrderAmount
                    ? `${discount.currency.symbol} ${parseFloat(discount.minimumOrderAmount).toLocaleString()}`
                    : "—"}
                </p>
              </div>
              <div className="border-x border-border">
                <p className="text-xs text-muted-foreground">Max. discount</p>
                <p className="text-sm font-medium text-foreground">
                  {discount.maximumDiscountAmount
                    ? `${discount.currency.symbol} ${parseFloat(discount.maximumDiscountAmount).toLocaleString()}`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valid until</p>
                <p className="text-sm font-medium text-foreground">
                  {discount.validUntil
                    ? format(new Date(discount.validUntil), "d MMM")
                    : "—"}
                </p>
              </div>
            </div>
          </>
        )}

        <DrawerFooter>
          <Button
            onClick={() => discount && copyToClipboard(discount.code)}
            disabled={copied}
            className="w-full disabled:opacity-100"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy code &apos;{discount?.code}&apos;
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => discount && share(discount)}
            className="w-full"
          >
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
