/**
 * Analytics Types
 * TypeScript interfaces for analytics tracking
 */

export interface TrackEventProperties {
  [key: string]: string | number | boolean | null | undefined;
}

export interface UserProperties {
  userType?: string;
  membershipStatus?: string;
  isVerified?: boolean;
  creditLimitTotal?: string | number;
  creditLimitRemaining?: string | number;
  networkSize?: number;
  loanCount?: number;
  kycStatus?: string;
  hasInsurance?: boolean;
  insuranceProvider?: string;
  preferredProvider?: string;
  accountCreatedAt?: string;
  lastLoginAt?: string;
}

export interface MaskedIdentifiers {
  maskedPhone?: string;
  maskedIdNumber?: string;
}

export type JourneyName =
  | 'SIGNUP'
  | 'SIGNIN'
  | 'PAYMENT'
  | 'FAST_TRACK'
  | 'KYC'
  | 'CARE_PROFILE'
  | 'CIRCLE'
  | 'LOAN_REPAYMENT'
  | 'SUPPORT'
  | 'PROFILE'
  | 'DISCOVERY'
  | 'PWA_INSTALL'
  | 'NOTIFICATIONS';
