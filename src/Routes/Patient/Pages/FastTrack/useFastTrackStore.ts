import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { FastTrackPaymentPoint, PaymentSplit } from "./types"
import type { SelectedPatient } from "./PaymentDetails"
import type { Allocations } from "../Loans/RequestLoan/types"
import type { FastTrackTransaction } from "./types"

interface FastTrackState {
  paymentNumber: string
  provider: FastTrackPaymentPoint | null
  invoiceNumber: string
  invoiceAmount: string
  selectedPatientId: string
  discountAmount: string
  discountCode: string
  allocations: Allocations
  splits: PaymentSplit[]
  patient: SelectedPatient | null
  transaction: FastTrackTransaction | null
  paymentSubmitted: boolean

  setPaymentNumber: (v: string) => void
  setProvider: (v: FastTrackPaymentPoint | null) => void
  setInvoiceNumber: (v: string) => void
  setInvoiceAmount: (v: string) => void
  setSelectedPatientId: (v: string) => void
  setDiscountAmount: (v: string) => void
  setDiscountCode: (v: string) => void
  setAllocations: (v: Allocations | ((prev: Allocations) => Allocations)) => void
  setSplits: (v: PaymentSplit[]) => void
  setPatient: (v: SelectedPatient | null) => void
  setTransaction: (v: FastTrackTransaction | null) => void
  setPaymentSubmitted: (v: boolean) => void
  reset: () => void
}

const initialState = {
  paymentNumber: "",
  provider: null,
  invoiceNumber: "",
  invoiceAmount: "",
  selectedPatientId: "",
  discountAmount: "",
  discountCode: "",
  allocations: {} as Allocations,
  splits: [] as PaymentSplit[],
  patient: null,
  transaction: null,
  paymentSubmitted: false,
}

export const useFastTrackStore = create<FastTrackState>()(
  persist(
    (set) => ({
      ...initialState,

      setPaymentNumber: (v) => set({ paymentNumber: v }),
      setProvider: (v) => set({ provider: v }),
      setInvoiceNumber: (v) => set({ invoiceNumber: v }),
      setInvoiceAmount: (v) => set({ invoiceAmount: v }),
      setSelectedPatientId: (v) => set({ selectedPatientId: v }),
      setDiscountAmount: (v) => set({ discountAmount: v }),
      setDiscountCode: (v) => set({ discountCode: v }),
      setAllocations: (v) =>
        set((state) => ({
          allocations: typeof v === "function" ? v(state.allocations) : v,
        })),
      setSplits: (v) => set({ splits: v }),
      setPatient: (v) => set({ patient: v }),
      setTransaction: (v) => set({ transaction: v }),
      setPaymentSubmitted: (v) => set({ paymentSubmitted: v }),
      reset: () => set(initialState),
    }),
    {
      name: "fast-track-storage",
      // Only persist the fields required to survive a page reload mid-flow
      // (e.g. returning from an external Paystack redirect). All transient
      // input fields are intentionally excluded so they never bleed into the
      // next transaction.
      partialize: (state) => ({
        transaction: state.transaction,
        paymentSubmitted: state.paymentSubmitted,
      }),
    }
  )
)
