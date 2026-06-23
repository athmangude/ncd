import { Button } from "@/components/Button"
import { useMutation, useQuery } from "@tanstack/react-query"
import Session from "supertokens-web-js/recipe/session"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/useToast"
import LoadingPage from "./LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"
import AppShell from "@/Routes/AppShell"

export const getTenantIdQueryKey = "getTenantIdQueryKey"

export default function InvalidTenantPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const query = useQuery({
    queryKey: [getTenantIdQueryKey],
    queryFn: async () => {
      if (await Session.doesSessionExist()) {
        const accessTokenPayload = await Session.getAccessTokenPayloadSecurely()
        const userTenantId = accessTokenPayload.tId

        return userTenantId
      } else {
        const homeRoute = resolveHomeRoute(null)
        navigate(homeRoute)
        return null
      }
    },
  })

  const mutation = useMutation({
    mutationFn: async () => {
      await Session.signOut()
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      })
    },
    onSuccess: () => {
      const homeRoute = resolveHomeRoute(query.data as any)
      navigate(homeRoute)
    },
  })

  if (query.isLoading) {
    return <LoadingPage />
  }

  if (query.isError) {
    return <ErrorBlock />
  }

  return (
    <AppShell header={null} footer={null}>
      <div className="flex flex-col max-w-[400px] mx-auto text-center gap-10">
        <h1 className="text-2xl font-bold">Invalid Tenant</h1>

        <p>
          It seems you are trying to access a restricted page while already
          logged into another account. Please log out of your other account and
          try again.
        </p>

        <Button
          onClick={async () => {
            await mutation.mutate()
          }}
          className="w-full"
          isLoading={mutation.isPending}
          disabled={mutation.isPending}
        >
          Log Out
        </Button>
      </div>
    </AppShell>
  )
}

function resolveHomeRoute(tenantId: string | null) {
  switch (tenantId) {
    case "patients":
      return "/patients/"
    case "healthcare":
      return "/organizations/"
    case "guarantors":
      return "/guarantors/"
    case "admin":
      return "/admin/"
    default:
      return "/"
  }
}
