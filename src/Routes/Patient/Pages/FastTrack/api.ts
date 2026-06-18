import axios from "axios"
import type {
  FastTrackPaymentPoint,
  FastTrackTransaction,
  InitiateFastTrackPaymentDto,
  VerifyInvoiceResponse,
} from "./types"

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ""

export async function resolveProvider(
  paymentNumber: string
): Promise<FastTrackPaymentPoint> {
  const response = await axios.get<FastTrackPaymentPoint>(
    `${BASE_URL}/fast-track/resolve-provider/${paymentNumber}`
  )
  return response.data
}

export async function verifyInvoice(
  invoiceNumber: string,
  facilityId: number
): Promise<VerifyInvoiceResponse> {
  const response = await axios.get<VerifyInvoiceResponse>(
    `${BASE_URL}/fast-track/verify-invoice`,
    { params: { invoiceNumber, facilityId } }
  )
  return response.data
}

export async function initiateFastTrackPayment(
  dto: InitiateFastTrackPaymentDto
): Promise<FastTrackTransaction> {
  const response = await axios.post<FastTrackTransaction>(
    `${BASE_URL}/fast-track/initiate`,
    dto
  )
  return response.data
}
