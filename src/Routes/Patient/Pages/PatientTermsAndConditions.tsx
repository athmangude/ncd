import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useNavigate } from "react-router-dom"
import LoadingPage from "@/Routes/LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"
import PatientPageWrapper from "./PatientPageWrapper"

export const getPatientTermsAndConditionsQueryKey =
  "getPatientTermsAndConditions"
export default function PatientTermsAndConditions() {
  const navigate = useNavigate()

  const query = useQuery({
    queryKey: [getPatientTermsAndConditionsQueryKey],
    queryFn: async () => {
      const { data: pd, error } = await supabase
        .from("patient_details")
        .select("data")
        .single()

      if (error) throw error

      const blob = (pd?.data ?? {}) as Record<string, unknown>
      if (blob.hasAcceptedLatestTermsAndConditions) {
        navigate("/patients")
      }

      return {
        content:
          "<h2>Terms and Conditions</h2><p>By using Jireh Health, you agree to our terms of service.</p>",
      }
    },
  })

  if (query.isLoading) {
    return <LoadingPage />
  }

  if (query.isError) {
    return <ErrorBlock />
  }

  const { content } = query.data!
  return (
    <PatientPageWrapper title="Terms and Conditions">
      <div
        className="shadow-sm flex flex-col gap-7  w-full  h-[70vh] mx-auto  overflow-y-scroll text-left p-2"
        dangerouslySetInnerHTML={{ __html: content }}
      ></div>
    </PatientPageWrapper>
  )
}
