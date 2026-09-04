import { Button } from "@/components/Button"
import { CircleMemberCard } from "@/components/CircleMemberCard"
import { Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/useToast"
import { invalidateCircleQueries } from "@/Routes/Patient/hooks/useCircleSync"

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
  profilePhoto,
}: InviteRequestCardProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const rejectMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from("network_invites")
        .update({ status: "REJECTED" })
        .eq("id", inviteId)
      if (error) throw error
      return { success: true }
    },
    onSuccess: () => {
      toast({
        title: "Invite Declined",
        description: "You have declined the invitation.",
      })
      // Keep the circle list, payee pickers, and loan gate consistent.
      invalidateCircleQueries(queryClient)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to decline invite",
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
        variant="secondary"
        className="flex-1"
        onClick={() =>
          navigate(`/patients/network/accept-invite?inviteId=${id}`)
        }
      >
        Accept
      </Button>
      <Button
        variant="destructive"
        size="icon"
        className="shrink-0"
        onClick={() => rejectMutation.mutate(id)}
        isLoading={rejectMutation.isPending}
      >
        <Trash2 className="w-5 h-5" />
      </Button>
    </CircleMemberCard>
  )
}
