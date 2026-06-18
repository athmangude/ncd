import { http, HttpResponse } from "msw"
import { getLoginDetails } from "./profile"
import {
  addCareFundTransaction,
  adjustCareFundBalance,
  getCareFundTransactions,
} from "../domain/careFund"
import { getConnectionList } from "../domain/network"

async function handleTransfer(request: Request): Promise<Response> {
  const { patientId, transferAmount } = (await request.json()) as {
    patientId: string
    transferAmount: number | string
  }

  const amount = Number(transferAmount) || 0
  const profile = getLoginDetails()
  const recipient = getConnectionList().find(
    (patient) => patient.value === patientId || patient.id === patientId
  )

  const [recipientFirstName = "", recipientLastName = ""] = (
    recipient?.name ?? ""
  ).split(" ")

  // Single source of truth: decrement the profile balance and log the transfer
  // through the care-fund domain helpers.
  adjustCareFundBalance(-amount)

  const txn = addCareFundTransaction({
    transactionAmount: amount,
    type: "TRANSFER",
    sender: {
      accountOwner: {
        id: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
      },
    },
    receiver: {
      accountOwner: {
        id: patientId,
        firstName: recipientFirstName,
        lastName: recipientLastName,
      },
    },
    description: recipient?.name
      ? `Gift to ${recipient.name}`
      : "Care fund gift",
  })

  return HttpResponse.json({ message: "Transfer successful", id: txn.id })
}

export const careFundHandlers = [
  http.get("/care-fund/transactions", ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get("page")) || 1
    const limit = Number(url.searchParams.get("limit")) || 10
    const all = getCareFundTransactions()
    const total = all.length
    const start = (page - 1) * limit
    const data = all.slice(start, start + limit)

    return HttpResponse.json({
      message: "Transactions retrieved",
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    })
  }),

  http.post("/care-fund/transfer", ({ request }) => handleTransfer(request)),

  // The Gift Recipient screen posts here; alias to the same transfer logic.
  http.post("/patient-network/transfer-care-funds", ({ request }) =>
    handleTransfer(request)
  ),
]
