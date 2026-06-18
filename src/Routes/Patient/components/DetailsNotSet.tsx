import { useNavigate } from "react-router-dom"
import PatientAuthHeadline from "./PatientAuthHeadline"
import { Button } from "@/components/Button"

export function DetailsNotSet({ title }: { title: string }) {
  const navigate = useNavigate()

  return (
    <>
      <PatientAuthHeadline text={title} />

      <Button
        role="link"
        className="w-full"
        onClick={() => {
          navigate(-1)
        }}
      >
        Back
      </Button>
    </>
  )
}
