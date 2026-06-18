import { create } from "zustand"

export const usePatientLoanStore = create((set) => ({
  loan: null, // initial state
  setLoan: (newLoan: any) => set(() => ({ loan: newLoan })),
}))
