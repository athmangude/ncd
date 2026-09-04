import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import PatientPageWrapper from "../PatientPageWrapper"
import { DualActionFooter, PrimaryCTAFooter } from "@/Routes/shell/footers"
import LoadingPage from "@/Routes/LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"
import { useNavigate, useSearchParams } from "react-router-dom"
import { supabase } from "@/lib/supabase"
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
    <PatientPageWrapper
      title="Accept Invite"
      onBack={() => navigate(-1)}
      footer={
        <PrimaryCTAFooter
          label="Return to Dashboard"
          onClick={() => navigate("/patients")}
        />
      }
    >
      <h2 className="text-center">No invite found</h2>
      <p>We could not find the invite you are looking for.</p>
    </PatientPageWrapper>
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
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("id", referrerId)
        .single()
      if (error) throw error

      const { data: userData } = await supabase.auth.getUser()
      const currentUserId = userData.user?.id
      let isAlreadyConnected = false
      if (currentUserId) {
        const { data: existing } = await supabase
          .from("network_members")
          .select("id")
          .eq("user_id", currentUserId)
          .limit(1)
        isAlreadyConnected = (existing?.length ?? 0) > 0
      }

      return {
        referrerFirstName: profile.first_name ?? "",
        referrerLastName: profile.last_name ?? "",
        referrerId: profile.id,
        isAlreadyConnected,
      }
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
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id
      if (!userId) throw new Error("Not authenticated")

      const memberId = "member-" + Date.now().toString(36)
      const { error } = await supabase.from("network_members").insert({
        id: memberId,
        user_id: userId,
        first_name: query.data?.referrerFirstName ?? "",
        last_name: query.data?.referrerLastName ?? "",
        relationship: data.relationship,
        type: "NETWORK",
        status: "ACTIVE",
        joined_at: new Date().toISOString(),
      })
      if (error) throw error

      return { message: "Invite accepted successfully" }
    },
    onSuccess: (data) => {
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
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  if (query.isLoading) {
    return <LoadingPage />
  }

  if (query.isError) {
    const error = query.error as Error
    return <ErrorBlock message={error.message} />
  }

  const {
    referrerFirstName,
    referrerLastName,
    referrerId: id,
    isAlreadyConnected,
  } = query.data!!

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
    <PatientPageWrapper
      title="Accept Invite"
      onBack={() => navigate(-1)}
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
    </PatientPageWrapper>
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
    <PatientPageWrapper
      title="Accept Invite"
      onBack={() => navigate(-1)}
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
    </PatientPageWrapper>
  )
}
