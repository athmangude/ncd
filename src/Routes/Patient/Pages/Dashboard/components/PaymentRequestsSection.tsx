import { formatMoney } from "@/utilities/currencyUtilities"
import { formatDateTime } from "@/utilities/dateUtilities"
import { useNavigate } from "react-router-dom"
import {
  setToLocalStorage,
  removeFromLocalStorage,
} from "@/utilities/localStorage"
import { patientReviewInvoiceStorageKey } from "../../Loans/RequestLoan/PatientUploadInvoice"
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { useToast } from "@/hooks/useToast"
import { Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/Dialog"
import { Button } from "@/components/Button"
import { Badge } from "@/components/Badge"
import { SectionTitle } from "@/components/SectionTitle"
import { resolveStatusVariant } from "@/utilities/statusUtilities"

export interface PaymentRequest {
  id: string
  careProviderName: string
  billAmount: string
  paymentInfo: {
    type: string
    tillNumber: string
    paybillNumber: string
    accountNumber: string
  }
  reason: string | null
  status: string
  createdAt: string
  updatedAt: string
  patient: {
    id: string
    firstName: string
    lastName: string
    phoneNumber: string
    email: string
  }
  dependent: any | null
  kmpdcFacility: {
    id: string
    name: string
  }
  invoiceFile: {
    id: string
    filePath: string
    originalFileName: string
    url: string
  }
}

import { Skeleton } from "@/components/Skeleton"

interface PaymentRequestsSectionProps {
  requests: PaymentRequest[]
  isLoading?: boolean
}

export function PaymentRequestsSection({
  requests,
  isLoading,
}: PaymentRequestsSectionProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-40 mt-2" />
        <div className="flex overflow-x-auto gap-3 pb-4 -mx-4 px-4">
          {[1, 2].map((i) => (
            <Skeleton
              key={i}
              className="h-32 w-[85%] sm:w-[300px] rounded-xl shrink-0"
            />
          ))}
        </div>
      </div>
    )
  }

  if (requests.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center mt-2">
        <SectionTitle>Payment Requests</SectionTitle>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="flex overflow-x-auto gap-3 pb-4 -mx-4 px-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {requests.map((request) => (
          <div
            key={request.id}
            className="snap-center shrink-0 w-[85%] sm:w-[300px]"
          >
            <PaymentRequestCard request={request} />
          </div>
        ))}
      </div>
    </div>
  )
}

function PaymentRequestCard({ request }: { request: PaymentRequest }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { id, careProviderName, billAmount, createdAt, status } = request

  const handleClick = () => {
    removeFromLocalStorage(patientReviewInvoiceStorageKey)
    setToLocalStorage("manualPaymentRequestId", id)
    navigate("/patients/payment/request-payment/verification-pending")
  }

  const deleteMutation = useMutation({
    mutationFn: async (requestId: string) => {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/patients/payments/manual-requests/${requestId}`,
        {
          withCredentials: true,
        }
      )
    },
    onMutate: async (requestId: string) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ["paymentRequests"] })

      // Snapshot the previous value
      const previousRequests = queryClient.getQueryData<PaymentRequest[]>([
        "paymentRequests",
      ])

      // Optimistically update the cache by removing the deleted request
      queryClient.setQueryData<PaymentRequest[]>(
        ["paymentRequests"],
        (old = []) => {
          return old.filter((request) => request.id !== requestId)
        }
      )

      // Return a context object with the snapshotted value
      return { previousRequests }
    },
    onError: (error: any, _requestId: string, context: any) => {
      // If the mutation fails, roll back to the previous value
      if (context?.previousRequests) {
        queryClient.setQueryData(["paymentRequests"], context.previousRequests)
      }
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to delete payment request",
        variant: "destructive",
      })
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment request deleted successfully",
      })
      setIsDeleteDialogOpen(false)
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency with server
      queryClient.invalidateQueries({ queryKey: ["paymentRequests"] })
    },
  })

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDeleteDialogOpen(true)
  }

  const handleSendPaymentClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    handleClick()
  }

  const handleConfirmDelete = () => {
    deleteMutation.mutate(id)
  }

  return (
    <>
      <div
        className="p-4 flex flex-col gap-3 bg-card hover:bg-muted transition-colors cursor-pointer border rounded-xl h-full shadow-sm"
        onClick={handleClick}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1 mr-2">
            <p className="text-base text-foreground line-clamp-1 capitalize font-medium">
              {careProviderName}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {formatMoney(Number(billAmount), "KES")} •{" "}
              {formatDateTime(createdAt)}
            </p>
          </div>
          <Badge variant={resolveStatusVariant(status)}>{status}</Badge>
        </div>

        <div className="flex gap-2 mt-1">
          <button
            className="flex-1 py-2 bg-purple-100 text-purple-700 text-sm font-semibold rounded-lg hover:bg-purple-200 transition-colors"
            onClick={handleSendPaymentClick}
          >
            Send Payment
          </button>
          <button
            className="px-3 py-2 bg-red-100 text-red-700 text-sm font-semibold rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center"
            onClick={handleDeleteClick}
            aria-label="Delete payment request"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Payment Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment request for{" "}
              {careProviderName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              isLoading={deleteMutation.isPending}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
