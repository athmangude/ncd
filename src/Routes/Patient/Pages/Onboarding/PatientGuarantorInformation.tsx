import AccordionMenu from "@/components/AccordionMenu"
import PatientAuthHeadline from "../../components/PatientAuthHeadline"
import PatientAuthWrapper from "../../components/PatientAuthWrapper"
import { HeartHandshake } from "lucide-react"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import LoadingPage from "@/Routes/LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/Dialog"
import { Button } from "@/components/Button"
import { useToast } from "@/hooks/useToast"
import { Controller, useForm } from "react-hook-form"
import FormGroupInput from "@/components/form/FormGroupInput"
import { validatePhoneNumber } from "@/utilities/validators"
import { CountryCode, parsePhoneNumber } from "libphonenumber-js"
import FormGroupSelect from "@/components/form/FormGroupSelect"
import { Globe } from "lucide-react"
import ReactCountryFlag from "react-country-flag"
import { X } from "lucide-react"
import { Link } from "react-router-dom"

export const getGuarantorInformationQueryKey = "getGuarantorInformation"
export default function PatientGuarantorInformation() {
  const query = useQuery({
    queryKey: [getGuarantorInformationQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        `${
          import.meta.env.VITE_SUPERTOKENS_API_DOMAIN
        }/patients/guarantor-invites`
      )

      return response.data
    },
  })

  if (query.isLoading) {
    return <LoadingPage />
  }

  if (query.isError) {
    return <ErrorBlock />
  }

  const {
    localGuarantorInvites,
    internationalGuarantorInvites,
    countryOptions,
    patientCountryCode,
  } = query.data

  const canProceed =
    localGuarantorInvites.length > 0 || internationalGuarantorInvites.length > 0

  return (
    <PatientAuthWrapper>
      <PatientAuthHeadline text="Guarantor Information" />
      <p>Select and invite Guarantor's into your application process</p>

      <PatientGuarantorInfoForm
        title="International Guarantor"
        description="A person living abroad"
        countryOptions={countryOptions}
        guarantors={internationalGuarantorInvites}
        guarantorType="INTERNATIONAL"
        patientCountryCode={patientCountryCode}
      />
      <PatientGuarantorInfoForm
        title="Local Guarantor"
        description="A person living in your country"
        countryOptions={countryOptions}
        guarantors={localGuarantorInvites}
        guarantorType="LOCAL"
        patientCountryCode={patientCountryCode}
      />

      <Button disabled={!canProceed} className="w-full" role="link">
        <Link
          to="/patients/terms-and-conditions"
          className="w-full no-underline text-white"
        >
          Next
        </Link>
      </Button>
    </PatientAuthWrapper>
  )
}

type Inputs = {
  firstName: string
  lastName: string
  phoneNumber: string
  countryCode?: string
  email: string
}
type Guarantor = {
  id: string
  firstName: string
  lastName: string
  phoneNumber: string
  countryCode: string
  email: string
}
function PatientGuarantorInfoForm({
  title,
  description,
  countryOptions,
  guarantors,
  guarantorType,
  patientCountryCode,
}: {
  title: string
  description: string
  guarantorType: "LOCAL" | "INTERNATIONAL"
  patientCountryCode: string
  countryOptions: {
    name: string
    value: string
    callingCode: string
  }[]
  guarantors: Guarantor[]
}) {
  const { toast } = useToast()

  const queryClient = useQueryClient()

  const [active, setActive] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm<Inputs>()

  const mutation = useMutation({
    mutationFn: async (data: Inputs) => {
      const countryCode =
        (data.countryCode as CountryCode) || (patientCountryCode as CountryCode)
      const phoneNumber = parsePhoneNumber(data.phoneNumber, countryCode)

      const response = await axios.post(
        `${
          import.meta.env.VITE_SUPERTOKENS_API_DOMAIN
        }/patients/guarantor-invite`,
        {
          ...data,
          countryCode: data.countryCode || patientCountryCode,
          guarantorType,
          phoneNumber: phoneNumber.number,
        }
      )

      return response.data
    },
    onSuccess: (result: any) => {
      toast({
        title: "Success",
        description: result.message,
      })
      queryClient.invalidateQueries({
        queryKey: [getGuarantorInformationQueryKey],
      })
      setDialogOpen(false)
      reset()
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      })
    },
  })

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={() => {
        setDialogOpen((state) => !state)
      }}
    >
      <AccordionMenu
        title={title}
        description={description}
        onClick={() => setActive(!active)}
        buttonLabel="show guarantor info form"
        icon={
          guarantorType === "INTERNATIONAL" ? (
            <Globe className="w-7 h-7 text-primary" />
          ) : (
            <HeartHandshake className="w-7 h-7 text-primary" />
          )
        }
        active={active}
        buttonDisabled={false}
      >
        <p className="text-neutral-500 text-xs my-2 font-medium">
          Guarantors added ({guarantors?.length})
        </p>
        <GuarantorList guarantors={guarantors} />
        {active && (
          <div className="mt-5 flex flex-col gap-5">
            <DialogTrigger className="border px-2 py-1 rounded-md border-black">
              Add Guarantor
            </DialogTrigger>
          </div>
        )}
      </AccordionMenu>

      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add {title}</DialogTitle>
          <DialogDescription>
            Fill in your guarantor's details
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-5 py-7"
          onSubmit={handleSubmit(async (data) => {
            await mutation.mutateAsync(data)
          })}
        >
          {guarantorType === "INTERNATIONAL" && (
            <Controller
              name="countryCode"
              control={control}
              rules={{
                required: {
                  value: true,
                  message: "Please select your country",
                },
              }}
              render={({ field }) => (
                <FormGroupSelect
                  id="countryCode"
                  label="Country Code"
                  placeholder="Select Country Code"
                  field={field}
                  error={errors.countryCode?.message}
                  options={countryOptions}
                />
              )}
            />
          )}

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
          />

          <FormGroupInput
            id="email"
            label="Email"
            type="email"
            placeholder="Enter your email address"
            register={register("email", {
              required: {
                value: true,
                message: "Please enter your email address",
              },
              pattern: {
                value: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
                message: "Please enter a valid email address",
              },
            })}
            error={errors.email?.message}
          />

          <FormGroupInput
            id="phoneNumber"
            label="Phone Number"
            type="phone"
            placeholder="0712345678"
            register={register("phoneNumber", {
              required: {
                value: true,
                message: "Please enter your phone number",
              },
              validate: (value) => {
                if (
                  !validatePhoneNumber({
                    countryCode:
                      (watch("countryCode") as CountryCode) ||
                      patientCountryCode,
                    phoneNumber: value,
                  })
                ) {
                  return "Please enter a valid phone number"
                }

                return true
              },
            })}
            error={errors.phoneNumber?.message}
          />

          <DialogFooter>
            <Button
              className="w-full"
              size="lg"
              role="link"
              type="submit"
              disabled={mutation.isPending}
              isLoading={mutation.isPending}
            >
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function GuarantorList({ guarantors }: { guarantors: Guarantor[] }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeGuarantorId, setActiveGuarantorId] = useState<string>("")

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const result = await axios.post(
        `${
          import.meta.env.VITE_SUPERTOKENS_API_DOMAIN
        }/patients/rescind-guarantor-invitation`,
        data
      )

      return result.data
    },
    onSuccess: (result) => {
      toast({
        title: "Success",
        description: result.message,
      })
      queryClient.invalidateQueries({
        queryKey: [getGuarantorInformationQueryKey],
      })
      setDialogOpen(false)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      })
    },
  })

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={() => {
        setDialogOpen((state) => !state)
        setActiveGuarantorId("")
      }}
    >
      {guarantors.length > 0 && (
        <ul className="flex flex-col gap-1 mt-3">
          {guarantors.map((g) => (
            <li
              key={g.id}
              className="text-sm flex gap-3 items-center bg-neutral-50 py-1 px-3 border rounded-lg w-full"
            >
              <ReactCountryFlag
                countryCode={g.countryCode}
                svg
                style={{
                  width: "20px",
                  height: "20px",
                }}
              />

              <div>
                <p className="font-bold">
                  {g.firstName} {g.lastName}
                </p>

                <p className="text-xs">{g.email}</p>
              </div>

              <button
                aria-label="Remove guarantor"
                className="ml-auto"
                onClick={() => {
                  setActiveGuarantorId(g.id)
                  setDialogOpen(true)
                }}
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Are you sure you want to remove this guarantor?
          </DialogTitle>
          <DialogDescription>
            Removing a guarantor will rescind their invitation
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <div className="flex flex-col gap-3 mt-5">
            <Button
              className="w-full"
              size="lg"
              role="link"
              type="button"
              disabled={mutation.isPending}
              isLoading={mutation.isPending}
              variant="destructive"
              onClick={async (e) => {
                e.preventDefault()
                await mutation.mutate({
                  inviteId: activeGuarantorId,
                })
              }}
            >
              Remove
            </Button>
            <Button
              className="w-full"
              size="lg"
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => {
                setDialogOpen(false)
                setActiveGuarantorId("")
              }}
            >
              Cancel
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
