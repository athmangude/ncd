export function formatDate(dateString: string | Date | number) {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${day}/${month}/${year}`
}

export function formatDateLong(dateString: string | Date | number) {
  const date = new Date(dateString)

  const day = String(date.getDate()).padStart(2, "0")
  const month = date.toLocaleString("en-GB", { month: "short" }) // e.g., "Nov"
  const year = date.getFullYear()

  return `${day} ${month} ${year}`
}

export function formatTime(dateString: string | Date | number) {
  const date = new Date(dateString)
  let hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const ampm = hours >= 12 ? "pm" : "am"
  
  // Convert to 12-hour format
  hours = hours % 12
  hours = hours ? hours : 12 // the hour '0' should be '12'
  
  return `${hours}:${minutes} ${ampm}`
}

export function formatDateTime(dateString: string | Date | number) {
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, "0")
  const month = date.toLocaleString("en-GB", { month: "short" })
  const year = date.getFullYear()
  let hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const ampm = hours >= 12 ? "pm" : "am"
  
  // Convert to 12-hour format
  hours = hours % 12
  hours = hours ? hours : 12 // the hour '0' should be '12'
  const formattedHours = String(hours).padStart(2, "0")

  return `${day} ${month} ${year} ${formattedHours}:${minutes} ${ampm}`
}

export function calculateRepaymentDueDate({
  loanDisbursementDate,
  loanCreatedAt,
  repaymentWeeks,
}: {
  loanDisbursementDate?: Date
  loanCreatedAt?: Date
  repaymentWeeks?: number
}): Date {
  if (!loanDisbursementDate && !loanCreatedAt) {
    return new Date()
  }

  const disbursementDate = loanDisbursementDate || loanCreatedAt || new Date()
  const disbursementDateInMilliseconds = new Date(disbursementDate).getTime()

  const repaymentPeriodInMilliseconds =
    (repaymentWeeks ?? 0) * 7 * 24 * 60 * 60 * 1000

  return new Date(
    disbursementDateInMilliseconds + repaymentPeriodInMilliseconds
  )
}
