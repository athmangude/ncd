import PatientPageWrapper from "../../PatientPageWrapper"
import { X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import {
  getFromLocalStorage,
  setToLocalStorage,
  removeFromLocalStorage,
} from "@/utilities/localStorage"
import { patientReviewInvoiceStorageKey } from "./PatientUploadInvoice"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useEffect, useMemo } from "react"
import { useToast } from "@/hooks/useToast"
import { PatientIdVerificationStatus } from "../../../enums/PatientIdVerificationStatus"
import { useState } from "react"
import PaidStatusView from "./components/PaidStatusView"
import ApprovedStatusView from "./components/ApprovedStatusView"
import RejectedStatusView from "./components/RejectedStatusView"
import PendingStatusView from "./components/PendingStatusView"

export default function PatientVerificationPending() {
  const navigate = useNavigate()
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)

  // Handle back navigation - show confirmation dialog
  useEffect(() => {
    // Push current state to history to trap back button
    window.history.pushState(null, "", window.location.href)

    const handlePopState = () => {
      // Prevent default back navigation and show dialog
      window.history.pushState(null, "", window.location.href)
      setIsExitDialogOpen(true)
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  const handleExit = () => {
    setIsExitDialogOpen(true)
  }

  const confirmExit = () => {
    navigate("/patients")
  }

  const manualRequestId = useMemo(
    () => getFromLocalStorage("manualPaymentRequestId"),
    []
  )
  const localData = useMemo(
    () => getFromLocalStorage(patientReviewInvoiceStorageKey),
    []
  )

  const { data: verificationData } = useQuery({
    queryKey: ["manual-request", manualRequestId],
    queryFn: async () => {
      if (!manualRequestId) return null
      const { data, error } = await supabase
        .from("manual_requests")
        .select("*")
        .eq("id", manualRequestId)
        .single()
      if (error) throw error

      return {
        id: data.id,
        status: data.status,
        careProviderName: data.care_provider_name,
        billAmount: data.bill_amount,
        totalBillAmount: data.bill_amount,
        currency: "KES",
        reason: (data.payment_info as Record<string, unknown> | null)?.reason as string | undefined,
        rejectionReason: (data.payment_info as Record<string, unknown> | null)?.rejectionReason as string | undefined,
        patient: data.patient,
        dependent: data.dependent,
        kmpdcFacility: data.kmpdc_facility,
        invoiceFile: data.invoice_file,
        payment: data.payment_info,
      }
    },
    enabled: !!manualRequestId,
    refetchInterval: (query) => {
      const latestStatus = query.state.data?.status

      if (
        latestStatus === PatientIdVerificationStatus.APPROVED ||
        latestStatus === PatientIdVerificationStatus.REJECTED
      ) {
        return false
      }

      return 5000
    },
    refetchOnMount: true,
    retry: 2,
  })

  // Persist verification data to localStorage whenever it updates
  useEffect(() => {
    if (verificationData) {
      setToLocalStorage(patientReviewInvoiceStorageKey, verificationData)
    }
  }, [verificationData])

  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Extract payment request details for breakdown
  const paymentDetails = useMemo(() => {
    const data = verificationData || localData
    if (!data) return null

    const facilityName =
      data.kmpdcFacility?.name || data.careProviderName || "Unknown Facility"
    const patient = data.dependent || data.patient
    const patientName =
      patient?.name ||
      (patient?.firstName && patient?.lastName
        ? `${patient.firstName} ${patient.lastName}`
        : patient?.firstName || patient?.lastName || "Unknown Patient")
    const billAmount = data.billAmount || data.totalBillAmount || 0
    const currency = data.currency || "KES"

    return {
      facilityName,
      patientName,
      billAmount: Number(billAmount),
      currency:
        typeof currency === "string" ? currency : currency?.code || "KES",
    }
  }, [verificationData, localData])

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!manualRequestId) return
      const { error } = await supabase
        .from("manual_requests")
        .update({ status: "CANCELLED" })
        .eq("id", manualRequestId)
      if (error) throw error
    },
    onMutate: async () => {
      if (!manualRequestId) return

      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ["paymentRequests"] })

      // Snapshot the previous value
      const previousRequests = queryClient.getQueryData<any[]>([
        "paymentRequests",
      ])

      // Optimistically update the cache by removing the cancelled request
      queryClient.setQueryData<any[]>(["paymentRequests"], (old = []) => {
        return old.filter((request: any) => request.id !== manualRequestId)
      })

      // Return a context object with the snapshotted value
      return { previousRequests }
    },
    onError: (error: Error, _variables, context: { previousRequests?: unknown[] } | undefined) => {
      if (context?.previousRequests) {
        queryClient.setQueryData(["paymentRequests"], context.previousRequests)
      }
      toast({
        title: "Error",
        description: error.message || "Failed to cancel request",
        variant: "destructive",
      })
    },
    onSuccess: () => {
      toast({
        title: "Request Cancelled",
        description: "Your payment request has been cancelled successfully.",
      })
      setIsCancelDialogOpen(false)
      removeFromLocalStorage("manualPaymentRequestId")
      removeFromLocalStorage(patientReviewInvoiceStorageKey)
      navigate("/patients")
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency with server
      queryClient.invalidateQueries({ queryKey: ["paymentRequests"] })
    },
  })

  const status = useMemo(() => {
    // If we have fresh API data, use it (highest priority)
    if (verificationData?.status) {
      return verificationData.status
    }

    // Safety check: If we are in "manual request" mode (manualRequestId exists),
    // ensure we don't use stale localData from a different flow (e.g. previous approved invoice).
    // If localData.id doesn't match manualRequestId, ignore localData.
    if (
      manualRequestId &&
      localData?.id &&
      String(localData.id) !== String(manualRequestId)
    ) {
      return PatientIdVerificationStatus.PENDING
    }

    // If API query hasn't completed yet, fall back to localStorage
    if (localData?.status) {
      return localData.status
    }
    // Default to PENDING
    return PatientIdVerificationStatus.PENDING
  }, [
    verificationData?.status,
    localData?.status,
    manualRequestId,
    localData?.id,
  ])

  const isPaid = useMemo(() => {
    if (verificationData?.payment?.paymentSplits?.length > 0) return true
    if (localData?.payment?.paymentSplits?.length > 0) return true
    return false
  }, [verificationData, localData])

  const handleContinue = () => {
    navigate("/patients/payment/request-payment/wallet-selection")
  }

  const rejectionReason =
    verificationData?.reason ||
    verificationData?.rejectionReason ||
    localData?.reason ||
    localData?.rejectionReason ||
    "invoice verification failure"

  const handleCancelClick = () => {
    setIsCancelDialogOpen(true)
  }

  const handleConfirmCancel = () => {
    cancelMutation.mutate()
  }

  if (isPaid) {
    return (
      <PatientPageWrapper
        title="Payment Status"
        backIcon={<X className="w-6 h-6 text-muted-foreground" />}
        onBack={handleExit}
      >
        <PaidStatusView
          isExitDialogOpen={isExitDialogOpen}
          onExitDialogChange={setIsExitDialogOpen}
          onExit={confirmExit}
        />
      </PatientPageWrapper>
    )
  }

  if (status === PatientIdVerificationStatus.APPROVED) {
    return (
      <PatientPageWrapper
        title="Verification Complete"
        showHelp
        backIcon={<X className="w-6 h-6 text-muted-foreground" />}
        onBack={handleExit}
      >
        <ApprovedStatusView
          isExitDialogOpen={isExitDialogOpen}
          onExitDialogChange={setIsExitDialogOpen}
          onExit={confirmExit}
          isCancelDialogOpen={isCancelDialogOpen}
          onCancelDialogChange={setIsCancelDialogOpen}
          onCancelClick={handleCancelClick}
          onConfirmCancel={handleConfirmCancel}
          onContinue={handleContinue}
          paymentDetails={paymentDetails}
          isCancelling={cancelMutation.isPending}
        />
      </PatientPageWrapper>
    )
  }

  if (status === PatientIdVerificationStatus.REJECTED) {
    return (
      <PatientPageWrapper
        title="Invoice Review Failed"
        showHelp
        backIcon={<X className="w-6 h-6 text-muted-foreground" />}
        onBack={handleExit}
      >
        <RejectedStatusView
          isExitDialogOpen={isExitDialogOpen}
          onExitDialogChange={setIsExitDialogOpen}
          onExit={confirmExit}
          rejectionReason={rejectionReason}
        />
      </PatientPageWrapper>
    )
  }

  return (
    <PatientPageWrapper
      title="Verification Pending"
      showHelp
      backIcon={<X className="w-6 h-6 text-muted-foreground" />}
      onBack={handleExit}
    >
      <PendingStatusView
        isExitDialogOpen={isExitDialogOpen}
        onExitDialogChange={setIsExitDialogOpen}
        onExit={confirmExit}
        isCancelDialogOpen={isCancelDialogOpen}
        onCancelDialogChange={setIsCancelDialogOpen}
        onCancelClick={handleCancelClick}
        onConfirmCancel={handleConfirmCancel}
        paymentDetails={paymentDetails}
        isCancelling={cancelMutation.isPending}
      />
    </PatientPageWrapper>
  )
}
