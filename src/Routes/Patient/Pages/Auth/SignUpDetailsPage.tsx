import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { useToast } from "@/hooks/useToast"
import { supabase } from "@/lib/supabase"
import FormGroupInput from "@/components/form/FormGroupInput"
import PatientAuthWrapper from "../../components/PatientAuthWrapper"
import PatientAuthHeadline from "../../components/PatientAuthHeadline"
import { PrimaryCTAFooter } from "@/Routes/shell/footers"

type Inputs = {
  firstName: string
  lastName: string
  idNumber: string
}

export default function SignUpDetailsPage() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>()

  const mutation = useMutation({
    mutationFn: async (data: Inputs) => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) throw new Error("Not authenticated")

      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          phone: user.phone ?? "",
          first_name: data.firstName,
          last_name: data.lastName,
          id_number: data.idNumber,
          id_verified: true,
        })

      if (upsertError) throw upsertError

      await supabase.auth.updateUser({
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
        },
      })
    },
    onSuccess: () => {
      toast({ title: "Welcome to Jireh!", description: "Your account has been created." })
      navigate("/patients/companion/intake", { replace: true })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  return (
    <PatientAuthWrapper
      footer={
        <PrimaryCTAFooter
          label="Complete Setup"
          form="sign-up-details-form"
          type="submit"
          disabled={mutation.isPending}
          isLoading={mutation.isPending}
        />
      }
    >
      <form
        id="sign-up-details-form"
        className="flex flex-col gap-7"
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
      >
        <PatientAuthHeadline text="Tell us about yourself" />
        <p className="text-muted-foreground text-center -mt-4">
          This should match your National ID.
        </p>

        <div className="flex flex-col gap-5">
          <FormGroupInput
            id="firstName"
            label="First Name"
            type="text"
            placeholder="Enter your first name"
            register={register("firstName", {
              required: {
                value: true,
                message: "Please enter your first name",
              },
            })}
            error={errors.firstName?.message}
            sensitive
          />

          <FormGroupInput
            id="lastName"
            label="Last Name"
            type="text"
            placeholder="Enter your last name"
            register={register("lastName", {
              required: {
                value: true,
                message: "Please enter your last name",
              },
            })}
            error={errors.lastName?.message}
            sensitive
          />

          <FormGroupInput
            id="idNumber"
            label="National ID Number"
            type="text"
            placeholder="12345678"
            register={register("idNumber", {
              required: {
                value: true,
                message: "Please enter your ID number",
              },
              maxLength: {
                value: 25,
                message: "ID number must be less than 25 characters",
              },
            })}
            error={errors.idNumber?.message}
            sensitive
          />
        </div>
      </form>
    </PatientAuthWrapper>
  )
}
