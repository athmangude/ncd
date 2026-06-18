import { useQuery } from "@tanstack/react-query"
import LoadingPage from "@/Routes/LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { MEMBER_LOAN_ROLES } from "../../constants/userTypes"

export const patientResolveTypeQueryKey = "patientResolveType"
export default function PatientResolveType() {
  const navigate = useNavigate()

  const query = useQuery({
    queryKey: [patientResolveTypeQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/patients/resolve-type`
      )
      return response.data
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
  } else if (MEMBER_LOAN_ROLES.includes(type)) {
    navigate("/patients/onboarding-success")
  }

  return <></>
}
