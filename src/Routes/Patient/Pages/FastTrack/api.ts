import { supabase } from "@/lib/supabase"
import type {
  FastTrackPaymentPoint,
  FastTrackTransaction,
  InitiateFastTrackPaymentDto,
  VerifyInvoiceResponse,
} from "./types"

export async function resolveProvider(
  paymentNumber: string
): Promise<FastTrackPaymentPoint> {
  const { data, error } = await supabase
    .from("fast_track_providers")
    .select("*")
    .eq("payment_number", paymentNumber)
    .single()

  if (error) throw error

  return {
    ...data,
    paymentNumber: data.payment_number,
    paymentCode: data.payment_code,
    smsPhoneNumbers: data.sms_phone_numbers,
    isActive: data.is_active,
  } as FastTrackPaymentPoint
}

export async function verifyInvoice(
  invoiceNumber: string,
  facilityId: number
): Promise<VerifyInvoiceResponse> {
  void invoiceNumber
  void facilityId
  return { exists: false } as VerifyInvoiceResponse
}

export async function initiateFastTrackPayment(
  dto: InitiateFastTrackPaymentDto
): Promise<FastTrackTransaction> {
  const { data, error } = await supabase.rpc("rpc_fast_track_initiate", {
    p_amount: dto.amount,
    p_payment_number: dto.paymentNumber,
    p_splits: dto.splits,
  })

  if (error) throw error

  return data as FastTrackTransaction
}
