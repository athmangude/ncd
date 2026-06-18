import { useQuery } from "@tanstack/react-query"
import axios, { HttpStatusCode } from "axios"
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
      const response = await axios.get(
        `${
          import.meta.env.VITE_SUPERTOKENS_API_DOMAIN
        }/patients/terms-and-conditions`
      )

      if (response.status === HttpStatusCode.Accepted) {
        navigate("/patients")
      }

      return response.data
    },
  })

  if (query.isLoading) {
    return <LoadingPage />
  }

  if (query.isError) {
    return <ErrorBlock />
  }

  const { content } = query.data
  return (
    <PatientPageWrapper title="Terms and Conditions">
      <div
        className="shadow-sm flex flex-col gap-7  w-full  h-[70vh] mx-auto  overflow-y-scroll text-left p-2"
        dangerouslySetInnerHTML={{ __html: content }}
      ></div>
    </PatientPageWrapper>
  )
}
