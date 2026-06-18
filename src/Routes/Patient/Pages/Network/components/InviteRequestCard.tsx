import { Button } from "@/components/Button"
import { CircleMemberCard } from "@/components/CircleMemberCard"
import { Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { useToast } from "@/hooks/useToast"
import { myNetworkQueryKey } from "../PatientMyNetwork"

interface InviteRequestCardProps {
  id: string
  inviterFirstName: string
  inviterLastName: string
  phoneNumber: string
  profilePhoto?: string | null
}

export function InviteRequestCard({
  id,
  inviterFirstName,
  inviterLastName,
  phoneNumber,
  profilePhoto
}: InviteRequestCardProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const rejectMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const response = await axios.post(
        `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/circles/invites/${inviteId}/reject`
      )
      return response.data
    },
    onSuccess: () => {
      toast({
        title: "Invite Declined",
        description: "You have declined the invitation.",
      })
      queryClient.invalidateQueries({
        queryKey: [myNetworkQueryKey],
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to decline invite",
        variant: "destructive",
      })
    },
  })

  return (
    <CircleMemberCard
      firstName={inviterFirstName}
      lastName={inviterLastName}
      phoneNumber={phoneNumber}
      profilePhoto={profilePhoto}
      variant="pending"
      layout="card"
    >
      <Button
        className="flex-1 bg-purple-100 text-purple-700 hover:bg-purple-200 border-none shadow-none"
        onClick={() => navigate(`/patients/network/accept-invite?inviteId=${id}`)}
      >
        Accept
      </Button>
      <Button
        variant="ghost"
        className="bg-red-50 text-red-500 w-12 shrink-0 hover:bg-red-100 p-0"
        onClick={() => rejectMutation.mutate(id)}
        isLoading={rejectMutation.isPending}
      >
        <Trash2 className="w-5 h-5" />
      </Button>
    </CircleMemberCard>
  )
}
