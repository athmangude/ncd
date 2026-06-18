export function formatMoney(
  amount: number,
  currency: string,
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

  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  })
}
