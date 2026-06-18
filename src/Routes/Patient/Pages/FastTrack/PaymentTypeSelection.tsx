import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import PatientPageWrapper from "../PatientPageWrapper"
import { Building2, Globe, ChevronRight, Zap } from "lucide-react"
import { trackEvent, EVENTS } from "@/analytics"

export default function PaymentTypeSelection() {
  const navigate = useNavigate()

  useEffect(() => {
    trackEvent(EVENTS.FAST_TRACK_PAYMENT.TYPE_SELECTION_VIEW)
  }, [])

  return (
    <PatientPageWrapper title="Pay Medical Bill">
      <div className="flex flex-col gap-6 px-1">
        <div className="flex flex-col items-center text-center gap-2 mt-2">
          <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-purple-600" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900">
            Where are you paying?
          </h2>
          <p className="text-sm text-neutral-500 max-w-xs">
            Choose the type of facility you are making a payment to
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate("/patients/fast-track/resolve-provider")}
            className="w-full flex items-center gap-4 p-4 bg-white border border-neutral-200 rounded-xl shadow-sm hover:border-purple-300 hover:shadow-md transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-100 transition-colors">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-neutral-900">In-Network Facility</h3>
              <p className="text-sm text-neutral-500 mt-0.5">
                Fast-track payment to a Jireh partner facility
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-400 flex-shrink-0 group-hover:text-purple-500 transition-colors" />
          </button>

          <button
            onClick={() =>
              navigate("/patients/payment/request-payment/how-to-pay")
            }
            className="w-full flex items-center gap-4 p-4 bg-white border border-neutral-200 rounded-xl shadow-sm hover:border-neutral-300 hover:shadow-md transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-neutral-50 flex items-center justify-center flex-shrink-0 group-hover:bg-neutral-100 transition-colors">
              <Globe className="w-6 h-6 text-neutral-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-neutral-900">
                Out-of-Network Facility
              </h3>
              <p className="text-sm text-neutral-500 mt-0.5">
                Pay any healthcare provider not in the Jireh network
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-400 flex-shrink-0 group-hover:text-neutral-500 transition-colors" />
          </button>
        </div>
      </div>
    </PatientPageWrapper>
  )
}
