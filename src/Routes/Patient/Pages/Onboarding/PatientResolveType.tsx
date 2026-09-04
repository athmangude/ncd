import { useQuery } from "@tanstack/react-query"
import LoadingPage from "@/Routes/LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { MEMBER_LOAN_ROLES } from "../../constants/userTypes"

export const patientResolveTypeQueryKey = "patientResolveType"
export default function PatientResolveType() {
  const navigate = useNavigate()

  const query = useQuery({
    queryKey: [patientResolveTypeQueryKey],
    queryFn: async () => {
      const { data: pd, error } = await supabase
        .from("patient_details")
        .select("data")
        .single()

      if (error) throw error

      const blob = (pd?.data ?? {}) as Record<string, unknown>
      return { type: (blob.type as string) ?? "PUBLIC" }
    },
  })

  if (query.isLoading) {
    return <LoadingPage />
  }

  if (query.isError) {
    const error: any = query.error
    return <ErrorBlock message={error.response?.data.message} />
  }

  const { type } = query.data!

  if (type === "ORG") {
    navigate("/patients/org-onboarding-success")
  } else if (MEMBER_LOAN_ROLES.includes(type as any)) {
    navigate("/patients/onboarding-success")
  }

  return <></>
}
