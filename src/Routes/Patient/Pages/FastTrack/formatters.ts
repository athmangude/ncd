export function formatPaymentNumber(num: string): string {
  const clean = num.replace(/\D/g, "")
  if (clean.length === 6) return `JH-${clean.slice(0, 3)}-${clean.slice(3)}`
  if (clean.length === 8) return `JH-${clean.slice(0, 4)}-${clean.slice(4)}`
  return `JH-${clean}`
}
