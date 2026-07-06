export function formatMoney(
  amount: number,
  currency?: string,
  includeDecimals: boolean = false
): string {
  if (amount == null) {
    return "-"
  }
  if (typeof amount === "string") {
    amount = parseFloat(amount)
  }

  if (isNaN(amount)) {
    amount = 0
  }

  const fractionDigits = {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }

  // A missing or malformed currency (undefined mid-fetch, or a whole currency
  // object passed instead of its code) must never crash a screen — fall back
  // to a plain formatted number instead of throwing from toLocaleString.
  if (typeof currency === "string" && currency.length > 0) {
    try {
      return amount.toLocaleString("en-US", {
        style: "currency",
        currency: currency,
        ...fractionDigits,
      })
    } catch {
      // not a valid ISO 4217 code — fall through to the plain format
    }
  }

  return amount.toLocaleString("en-US", fractionDigits)
}
