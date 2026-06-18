import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

// Define the patient login details type based on the API response
export interface PatientLoginDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  isVerified: boolean;
  hasVerifiedId: string;
  membershipStatus: string;
  creditLimit: {
    totalCreditLimitAmount: string;
    remainingAmount: string;
    currency: {
      countryName: string;
      code: string;
      id: number;
    };
  };
  medicalRequests: Array<any>;
  loans: Array<any>;
  hasAcceptedMedicalConsentForm: boolean;
  hasBeenReferred: boolean;
  hasVerifiedCrbScore: boolean;
  idVerificationStatus: string;
  network: Array<any>;
  type: string;
  canPayMedicalBill: boolean;
  orgBorrower: any;
  hasUploadedMpesaStatement: boolean;
  careFundAccount: {
    id: number;
    careFundBalance: string;
    createdAt: string;
    updatedAt: string;
    accountOwner: any;
    currency: {
      countryName: string;
      code: string;
      id: number;
    };
  };
  accountReference: string;
  subscriptions: Array<any>;
  message?: string;
  isBasicMember?: boolean;
  hasSetPin: boolean;
  profilePhoto?: string | null;
}

export function usePatientLoginDetails() {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
  const endpoint = '/patients/login-details';
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
    queryKey: ['patientLoginDetails'],
    queryFn: async () => {
      const response = await axios.get(`${BASE_URL}${endpoint}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 1,
    enabled: !isOffline, // Don't fetch if offline
  });

  return {
    data: query.data as PatientLoginDetails | undefined,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isOffline,
    refetch: query.refetch,
  };
}
