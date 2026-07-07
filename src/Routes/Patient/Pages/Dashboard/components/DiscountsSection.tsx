import { useState, useRef } from "react"
import { Card } from "@/components/Card"
import cashIcon from "@/assets/icons/cash.png"
import cashIcon2 from "@/assets/icons/cash2.png"
import { format } from "date-fns"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/Drawer"
import { Button } from "@/components/Button"
import { SectionTitle } from "@/components/SectionTitle"
import {
  Tag,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react"
import { toast } from "@/hooks/useToast"

interface Currency {
  id: number
  code: string
  name: string
  symbol: string
}

export interface DiscountCode {
  id: number
  code: string
  description: string
  discountType: "PERCENTAGE" | "FIXED_AMOUNT"
  discountValue: string
  currency: Currency
  context: "ORDER_BASED" | "PROMOTIONAL"
  discountAmount: string
  validFrom: string | null
  validUntil: string | null
  minimumOrderAmount: string | null
  maximumDiscountAmount: string | null
  isActive: boolean
  isValid: boolean
}

interface DiscountsSectionProps {
  discounts?: DiscountCode[]
}

export function DiscountsSection({ discounts = [] }: DiscountsSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountCode | null>(
    null
  )
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const firstCard = container.firstElementChild
      if (firstCard) {
        const cardWidth = firstCard.getBoundingClientRect().width
        const gap = 16 // gap-4 is 16px
        const scrollPosition = container.scrollLeft
        const index = Math.round(scrollPosition / (cardWidth + gap))

        // Clamp index to bounds
        const safeIndex = Math.min(Math.max(0, index), discounts.length - 1)

        if (safeIndex !== activeIndex) {
          setActiveIndex(safeIndex)
        }
      }
    }
  }

  const handleCardClick = (discount: DiscountCode) => {
    setSelectedDiscount(discount)
    setIsDrawerOpen(true)
  }

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

  if (discounts.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-4 mt-2">
      <SectionTitle>Discounts & Offers</SectionTitle>
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {discounts.map((discount, index) => (
          <Card
            key={discount.id}
            className="min-w-[300px] p-4 border-none flex items-center gap-4 rounded-2xl shadow-sm bg-card cursor-pointer hover:bg-muted transition-colors"
            onClick={() => handleCardClick(discount)}
          >
            <div className="w-14 h-14  flex items-center justify-center  shrink-0 overflow-hidden ">
              <img
                src={index % 2 === 0 ? cashIcon : cashIcon2}
                alt="Discount"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm leading-tight mb-1">
                {discount.code}
              </p>
              <p className="text-sm text-muted-foreground font-medium mb-1 line-clamp-2">
                {discount.description}
              </p>
              {discount.validUntil ? (
                <p className="text-xs text-muted-foreground">
                  Valid until{" "}
                  {format(new Date(discount.validUntil), "MMM d, yyyy")}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">No expiry date</p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {discounts.length > 1 && (
        <div className="flex justify-center gap-2">
          {discounts.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? "w-8 bg-primary" : "w-1.5 bg-muted"}`}
            ></div>
          ))}
        </div>
      )}

      <Drawer
        open={isDrawerOpen}
        onOpenChange={(open) => {
          setIsDrawerOpen(open)
          if (!open) setCopied(false)
        }}
      >
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm max-h-[85vh] flex flex-col">
            <DrawerHeader className="text-left flex-shrink-0">
              <DrawerTitle>Discount Details</DrawerTitle>
              <DrawerDescription>
                Review the details of this discount code.
              </DrawerDescription>
            </DrawerHeader>

            <div className="flex-1 overflow-y-auto px-4">
              {selectedDiscount && (
                <div className="py-4 flex flex-col gap-6">
                  {/* Header Section */}
                  <div className="flex flex-col items-center justify-center text-center gap-2 p-6 bg-orange-50 rounded-2xl border border-orange-100">
                    <div className="w-16 h-16 rounded-full bg-card p-3 shadow-sm mb-2">
                      <img
                        src={cashIcon}
                        alt="Discount"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-foreground">
                        {selectedDiscount.code}
                      </h3>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => copyToClipboard(selectedDiscount.code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-muted-foreground font-medium">
                      {selectedDiscount.description}
                    </p>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                      <Tag className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Discount Value
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {selectedDiscount.discountType === "PERCENTAGE"
                            ? `${parseFloat(selectedDiscount.discountValue)}% OFF`
                            : `${selectedDiscount.currency.symbol} ${parseFloat(selectedDiscount.discountValue).toLocaleString()}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                      <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Valid Period
                        </p>
                        <div className="flex flex-col gap-0.5">
                          <p className="text-sm text-muted-foreground">
                            From:{" "}
                            {selectedDiscount.validFrom
                              ? format(
                                  new Date(selectedDiscount.validFrom),
                                  "MMM d, yyyy"
                                )
                              : "Anytime"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            To:{" "}
                            {selectedDiscount.validUntil
                              ? format(
                                  new Date(selectedDiscount.validUntil),
                                  "MMM d, yyyy"
                                )
                              : "No expiry"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {(selectedDiscount.minimumOrderAmount ||
                      selectedDiscount.maximumDiscountAmount) && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                        <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Conditions
                          </p>
                          {selectedDiscount.minimumOrderAmount && (
                            <p className="text-sm text-muted-foreground">
                              Min. Order: {selectedDiscount.currency.symbol}{" "}
                              {parseFloat(
                                selectedDiscount.minimumOrderAmount
                              ).toLocaleString()}
                            </p>
                          )}
                          {selectedDiscount.maximumDiscountAmount && (
                            <p className="text-sm text-muted-foreground">
                              Max. Discount: {selectedDiscount.currency.symbol}{" "}
                              {parseFloat(
                                selectedDiscount.maximumDiscountAmount
                              ).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100/50">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">
                          Status
                        </p>
                        <p className="text-sm font-semibold text-emerald-700">
                          Active & Valid
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DrawerFooter className="pt-2 pb-8 flex-shrink-0">
              <Button
                onClick={() =>
                  selectedDiscount && copyToClipboard(selectedDiscount.code)
                }
                disabled={copied}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-100"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  "Copy Code"
                )}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
