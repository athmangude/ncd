import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

export interface NetworkMember {
  id: string
  firstName: string
  lastName: string
  phoneNumber: string | null
  profilePhoto: string | null
  relationship: string
  type?: string
  status: string
  nickname?: string
  joinedAt: string | null
  hasDefaultedLoan: boolean
}

export interface SentInvite {
  id: string
  firstName: string
  lastName: string
  phoneNumber: string
  status: string
  profilePhoto?: string | null
  inviteLink?: string
  nickname?: string
  createdAt?: string
  relationship?: string
}

export interface ReceivedInvite {
  id: string
  inviterFirstName: string
  inviterLastName: string
  phoneNumber: string
  status: string
  profilePhoto?: string | null
}

export interface NetworkData {
  network: NetworkMember[]
  invites: SentInvite[]
  receivedInvites: ReceivedInvite[]
  slots?: {
    auxiliary: { used: number; max: number; reserved: number }
    accountable: { used: number; max: number; reserved: number }
  }
}

export function usePatientNetwork() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const query = useQuery({
    queryKey: ['myConnectionsKey'],
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    enabled: !isOffline,
  });

  return {
    data: query.data as NetworkData | undefined,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isOffline,
    refetch: query.refetch,
    isFetching: query.isFetching, 
  };
}
