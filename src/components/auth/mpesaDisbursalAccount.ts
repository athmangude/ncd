export const MPESA_BANK_CODES = ["MPESA", "MPPAYBILL", "MPTILL"] as const

export type MpesaBankCode = (typeof MPESA_BANK_CODES)[number]

export const mpesaBankCodeOptions: {
  name: string
  value: MpesaBankCode
}[] = [
  {
    name: "Paybill Number",
    value: "MPPAYBILL",
  },
  {
    name: "Till Number",
    value: "MPTILL",
  },
]

export const accountNumberLabelName = (bankCode: MpesaBankCode) => {
  switch (bankCode) {
    case "MPESA":
      return {
        label: "Phone Number",
        placeholder: "Enter your phone number",
      }
    case "MPPAYBILL":
      return {
        label: "Paybill Number",
        placeholder: "Enter paybill number",
      }
    case "MPTILL":
      return {
        label: "Till Number",
        placeholder: "Enter till number",
      }
    default:
      return {
        label: "Account Number",
        placeholder: "Enter your account number",
      }
  }
}
