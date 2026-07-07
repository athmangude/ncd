import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import MobileWrapper, {
  BackTitleHeader,
  DualActionFooter,
  PrimaryCTAFooter,
} from "@/Routes/MobileWrapper"
import LoadingPage from "@/Routes/LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"
import { useNavigate, useSearchParams } from "react-router-dom"
import axios from "axios"
import { useToast } from "@/hooks/useToast"
import { invalidateCircleQueries } from "@/Routes/Patient/hooks/useCircleSync"
import { PatientInviteInfo } from "./PatientInviteInfo"
import { Controller } from "react-hook-form"
import FormGroupSelect from "@/components/form/FormGroupSelect"
import { usePersistentForm } from "@/hooks/usePersistentForm"
import { relationshipOptions } from "./PatientAddConnection"
import networkIcon from "@/assets/icons/network.png"

export const getReferrerIdQueryKey = "getReferrerId"
export default function PatientAcceptShareLink() {
  const [searchParams] = useSearchParams()

  const query = useQuery({
    queryKey: [getReferrerIdQueryKey],
    queryFn: async () => {
      let referrerId = searchParams.get("referrerId")

      if (!referrerId) {
        //get referrerId from local storage
        referrerId = localStorage.getItem("referrerId")
      }

      return {
        referrerId,
      }
    },
  })

  if (query.isLoading) {
    return <LoadingPage />
  }
  if (query.isError) {
    const error: any = query.error
    return <ErrorBlock message={error.response?.data.message} />
  }

  const referrerId = query.data?.referrerId || ""

  return referrerId ? (
    <InviteDetails referrerId={referrerId} />
  ) : (
    <NoInviteFound />
  )
}

function NoInviteFound() {
  const navigate = useNavigate()
  return (
    <MobileWrapper
      header={
        <BackTitleHeader title="Accept Invite" onBack={() => navigate(-1)} />
      }
      footer={
        <PrimaryCTAFooter
          label="Return to Dashboard"
          onClick={() => navigate("/patients")}
        />
      }
    >
      <h2 className="text-center">No invite found</h2>
      <p>We could not find the invite you are looking for.</p>
    </MobileWrapper>
  )
}

export const patientAcceptInviteQueryKey = "patientAcceptInvite"
export const acceptShareLinkStorageKey = "acceptShareLinkStorageKey"
type Inputs = {
  referrerId: string
  relationship: string
}

function InviteDetails({ referrerId }: { referrerId: string }) {
  const query = useQuery({
    queryKey: [patientAcceptInviteQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/patient-network/referrer-details/${referrerId}`
      )

      return response.data
    },
  })

  const { toast } = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = usePersistentForm<Inputs>(acceptShareLinkStorageKey)

  const mutation = useMutation({
    mutationFn: async (data: Inputs) => {
      const response = await axios.post(
        `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/patient-network/accept-invite`,
        {
          ...data,
          type: "COPY_LINK",
        }
      )

      return response.data
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success",
        description: data.message,
      })
      // Accepting a share-link invite joins a circle — refresh the loan gate +
      // payee pickers alongside the circle list, not just this page's query.
      invalidateCircleQueries(queryClient)
      localStorage.removeItem("referrerId")
      navigate("/patients/network/invite-accepted", {
        state: {
          firstName: query?.data?.referrerFirstName,
          lastName: query?.data?.referrerLastName,
          from: "SHARE_LINK",
        },
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      })
    },
  })

  if (query.isLoading) {
    return <LoadingPage />
  }

  if (query.isError) {
    const error: any = query.error
    return <ErrorBlock message={error.response?.data.message} />
  }

  const {
    referrerFirstName,
    referrerLastName,
    referrerId: id,
    isAlreadyConnected,
  } = query.data

  if (isAlreadyConnected) {
    return (
      <IsAlreadyConnected
        firstName={referrerFirstName}
        lastName={referrerLastName}
      />
    )
  }

  const handleReject = () => {
    localStorage.removeItem("referrerId")
    navigate("/patients/network/invite-rejected", {
      state: {
        firstName: referrerFirstName,
        lastName: referrerLastName,
      },
    })
  }

  return (
    <MobileWrapper
      header={
        <BackTitleHeader title="Accept Invite" onBack={() => navigate(-1)} />
      }
      footer={
        <DualActionFooter
          primary={{
            label: "Accept Invite",
            onClick: handleSubmit((data) => mutation.mutate(data)),
            isLoading: mutation.isPending,
            disabled: mutation.isPending || mutation.isSuccess,
          }}
          secondary={{ label: "Reject Invite", onClick: handleReject }}
        />
      }
    >
      <form
        id="accept-share-link-form"
        className="flex flex-col gap-5 text-center items-center mt-5"
        onSubmit={handleSubmit((data) => {
          mutation.mutate(data)
        })}
      >
        <PatientInviteInfo
          firstName={referrerFirstName}
          lastName={referrerLastName}
        />

        <input
          type="hidden"
          value={id}
          {...control.register("referrerId", {
            required: "Referred ID is required",
          })}
        />

        <div className="flex flex-col gap-5 pt-7 border-t w-full">
          <Controller
            name="relationship"
            control={control}
            rules={{ required: "Relationship is required" }}
            render={({ field }) => (
              <FormGroupSelect
                id="relationship"
                label={`Your relation to ${referrerFirstName} ${referrerLastName}`}
                placeholder="Select relationship"
                field={field}
                error={errors.relationship?.message}
                options={relationshipOptions}
                defaultValue={control._defaultValues[
                  "relationship"
                ]?.toString()}
              />
            )}
          />
        </div>
      </form>
    </MobileWrapper>
  )
}

function IsAlreadyConnected({
  firstName,
  lastName,
}: {
  firstName: string
  lastName: string
}) {
  const navigate = useNavigate()
  return (
    <MobileWrapper
      header={
        <BackTitleHeader title="Accept Invite" onBack={() => navigate(-1)} />
      }
      footer={
        <DualActionFooter
          primary={{
            label: "View Connections",
            onClick: () => {
              localStorage.removeItem("referrerId")
              navigate("/patients/network/")
            },
          }}
          secondary={{
            label: "Back to Dashboard",
            onClick: () => {
              localStorage.removeItem("referrerId")
              navigate("/patients/")
            },
          }}
        />
      }
      className="flex flex-col gap-5 text-center items-center"
    >
      <img
        src={networkIcon}
        alt="Network Icon"
        className=" object-contain max-w-[170px]"
        aria-hidden="true"
      />

      <h1>
        You are already connected with{" "}
        <span className="capitalize">{firstName.toLocaleLowerCase()}</span>{" "}
        <span className="capitalize">{lastName.toLocaleLowerCase()}</span>
      </h1>
    </MobileWrapper>
  )
}
