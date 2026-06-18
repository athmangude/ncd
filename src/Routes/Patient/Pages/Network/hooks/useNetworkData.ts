import { useQuery } from "@tanstack/react-query"
import { myNetworkQueryKey } from "../PatientMyNetwork"
import type {
  NetworkData,
  NetworkMember,
  SentInvite,
  ReceivedInvite,
} from "@/hooks/usePatientNetwork"

export interface ProcessedNetworkData {
  network: NetworkMember[]
  invites: SentInvite[]
  receivedInvites: ReceivedInvite[]
  slots?: NetworkData["slots"]
  adults: NetworkMember[]
  children: NetworkMember[]
  isAccountableFull: boolean
  isAuxiliaryFull: boolean
  isAllFull: boolean
  accountableSlotsAvailable: number
  accountableSlotsMax: number
}

export function useNetworkData() {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: [myNetworkQueryKey],
    queryFn: async () => {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/patient-network/network`,
        {
          credentials: "include",
        }
      );
      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(text || `Request failed with status ${resp.status}`);
      }
      return resp.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnMount: "always",
  })

  const { network = [], invites = [], receivedInvites = [], slots } = (data as NetworkData) || {}
  
  const adults = network.filter(
    (n: NetworkMember) => n.relationship !== "CHILD",
  )
  const children = network.filter(
    (n: NetworkMember) => n.relationship === "CHILD",
  )
  
  const isAccountableFull = slots?.accountable 
    ? (slots.accountable.used + slots.accountable.reserved) >= slots.accountable.max 
    : false
  const isAuxiliaryFull = slots?.auxiliary 
    ? (slots.auxiliary.used + slots.auxiliary.reserved) >= slots.auxiliary.max 
    : false
  const isAllFull = isAccountableFull && isAuxiliaryFull
  
  const accountableSlotsAvailable = slots?.accountable 
    ? Math.max(0, slots.accountable.max - (slots.accountable.used + slots.accountable.reserved)) 
    : 0
  const accountableSlotsMax = slots?.accountable?.max || 0

  const processedData: ProcessedNetworkData = {
    network,
    invites,
    receivedInvites,
    slots,
    adults,
    children,
    isAccountableFull,
    isAuxiliaryFull,
    isAllFull,
    accountableSlotsAvailable,
    accountableSlotsMax,
  }

  return {
    data: processedData,
    isLoading,
    isError,
    error,
    refetch,
  }
}
