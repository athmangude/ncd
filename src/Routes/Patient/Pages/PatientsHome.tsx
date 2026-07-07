import ErrorBlock from "@/components/ErrorBlock"
import RouteMetadata from "@/components/RouteMetadata"
import LoadingPage from "@/Routes/LoadingPage"
import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useLocation,
} from "react-router-dom"
import { SessionAuth } from "supertokens-auth-react/recipe/session"
import { useOnboardingChecklist } from "../hooks/useOnboardingChecklist"
import PatientDashboard from "./PatientDashboard"
import PatientHelpAndSupport from "./Profile/PatientHelpAndSupport"
import PatientTermsAndConditions from "./PatientTermsAndConditions"
import TransactionResult from "./Payment/PatientTransactionResult"
import PatientPaymentStatus from "./Payment/PatientPaymentStatus"
import LoanWrapper from "./Loans/LoanWrapper"
import PatientMedicalConsentForm from "./PatientMedicalConsentForm"
import PatientFinancialStatements from "./Onboarding/PatientFinancialStatements"
import { usePatientAuthStore } from "../stores/patientAuthStore"
import PatientNetworkWrapper from "./Network/PatientNetworkWrapper"
import { PatientPersonalDetails } from "./Onboarding/PatientPersonalDetails"
import { PatientIdVerification } from "./Onboarding/PatientIdVerification"
import PatientIdVerificationOnboarding from "./Onboarding/PatientIdVerificationOnboarding"
import PatientIdVerificationFailure from "./Onboarding/PatientIdVerificationFailure"
import PatientDocumentVerification from "./Onboarding/PatientDocumentVerification"
import PatientReferralCode from "./Onboarding/PatientReferralCode"
import PatientOnboardingSuccess from "./Onboarding/PatientOnboardingSuccess"
import PatientResolveType from "./Onboarding/PatientResolveType"
import { PatientOrgOnboardingSuccess } from "./Onboarding/PatientOrgOnboardingSuccess"
import PatientOrgHowItWorks from "./Org/PatientOrgHowItWorks"
import PatientSelectInsurance from "./Onboarding/PatientSelectInsurance"
import PatientFavoriteCareProviders from "./Onboarding/PatientFavoriteCareProviders"
import CareProfileSetupIndicator from "./Onboarding/CareProfileSetupIndicator"
import CareProfileSuccess from "./Onboarding/CareProfileSuccess"
import PatientAddToCircle from "./Onboarding/PatientAddToCircle"
import PatientCircleSetupIntro from "./Onboarding/PatientCircleSetupIntro"
import PatientHowCirclesWork from "./Onboarding/PatientHowCirclesWork"
import PatientKYCAddCircleMembers from "./Onboarding/PatientKYCAddCircleMembers"
import PatientReviewMembershipDetails from "./Onboarding/PatientReviewMembershipDetails"
import { PatientMembershipSuccess } from "./Onboarding/PatientMembershipSuccess"
import PatientHealthcareFocus from "./Onboarding/PatientHealthcareFocus"
import PatientNCDStatus from "./Onboarding/PatientNCDStatus"
import PatientFinancialStatementsWithCreditUpdate from "./Onboarding/PatientFinancialStatementsWithCreditUpdate"
import PatientCareFundRoutes from "./PatientCareFund/PatientCareFundWrapper"
import PatientDiscoverHospitals from "./PatientDiscoverHospitals"
import PatientDiscountDetails from "./PatientDiscountDetails"
import PatientDiscountsList from "./PatientDiscountsList"
import PatientAddWhatsAppNumber from "./Onboarding/PatientAddWhatsAppNumber"
import PatientChooseHealthcarePlan from "./Onboarding/PatientChooseHealthcarePlan"
import PatientPlansHowItWorks from "./Onboarding/PatientPlansHowItWorks"
import PatientInsuranceWrapper from "./Insurance/PatientInsuranceWrapper"
import PatientSubscriptionsWrapper from "./Subscriptions/PatientSubscriptionsWrapper"
import DownloadedFilesGuide from "@/Routes/Patient/Pages/Faqs/DownloadedFilesGuide"
import PasscodeGuide from "@/Routes/Patient/Pages/Faqs/PasscodeGuide"
import MpesaStatementGuide from "@/Routes/Patient/Pages/Faqs/MpesaStatementGuide"
import FaqsPage from "@/Routes/Patient/Pages/Faqs/FaqsPage"
import PaymentWrapper from "./Payment/PaymentWrapper"
import PaymentRequestWrapper from "./Payment/PaymentRequestWrapper"
import PatientSetPin from "./Onboarding/PatientSetPin"
import CompleteProfilePage from "./CompleteProfilePage"
import PatientChangePin from "./Dashboard/PatientChangePin"
import PatientAccountLocked from "./PatientAccountLocked"
import PatientManualRequestStatus from "./Loans/RequestLoan/PatientManualRequestStatus"
import PatientIdPhotoFrontUpload from "./Onboarding/PatientIdPhotoFrontUpload"
import PatientIdPhotoGuide from "./Onboarding/PatientIdPhotoGuide"
import PatientSelfieGuide from "./Onboarding/PatientSelfieGuide"
import PatientIdSelfie from "./Onboarding/PatientIdSelfie"
import PatientPayMembership from "./Onboarding/PatientPayMembership"
import PatientKYCSetupIntro from "./Onboarding/PatientKYCSetupIntro"
import PWAOnboardingIntro from "./PWAOnboarding/PWAOnboardingIntro"
import InstallAppPage from "./PWAOnboarding/InstallAppPage"
import EnableNotificationsPage from "./PWAOnboarding/EnableNotificationsPage"
import LocationAccessPage from "./PWAOnboarding/LocationAccessPage"
import PWASuccessPage from "./PWAOnboarding/PWASuccessPage"
import MemberLoanRouteGuard from "../components/MemberLoanRouteGuard"

import PatientScanQRIntro from "./PatientScanQRIntro"
import FastTrackWrapper from "./FastTrack/FastTrackWrapper"

import PatientSecurityAndPermissions from "./Profile/PatientSecurityAndPermissions"
import PatientNotificationsPage from "./Notifications/PatientNotificationsPage"
import PatientReferralAndEarn from "./Profile/PatientReferralAndEarn"

import FacilityDetailsPage from "./Dashboard/components/discovery/FacilityDetailsPage"
import FacilityReviewFormPage from "./Dashboard/components/discovery/facility-details/reviews/FacilityReviewFormPage"
import SearchPage from "./Dashboard/components/discovery/SearchPage"
import FiltersPage from "./Dashboard/components/discovery/FiltersPage"
import { lazy, Suspense } from "react"

const PatientDashboardLoansTab = lazy(
  () => import("./Dashboard/PatientDashboardLoansTab")
)
const PatientDashboardCircleTab = lazy(
  () => import("./Dashboard/PatientDashboardCircleTab")
)
const PatientDashboardExploreTab = lazy(
  () => import("./Dashboard/PatientDashboardExploreTab")
)
const PatientDashboardProfileTab = lazy(
  () => import("./Dashboard/PatientDashboardProfileTab")
)

function PatientDashboardRedirect() {
  const location = useLocation()
  const tab = location.state?.tab || "home"
  const validTabs = ["home", "circle", "explore", "profile"]
  const target = validTabs.includes(tab) ? tab : "home"

  return <Navigate to={target} replace state={location.state} />
}

export const patientLoginDetailsQueryKey = "patientLoginDetails"
export default function PatientsHome() {
  const query = useOnboardingChecklist()
  const signOut = usePatientAuthStore((state: any) => state.signOut)
  const navigate = useNavigate()

  if (query.isLoading) {
    return <LoadingPage />
  }

  if (query.isError) {
    const error: any = query.error

    // This is very hacky but it might solve our user not found issue.
    //TODO: Figure out what is causing the user not found error.
    if (error.response?.data.message === "User not found") {
      signOut()
      navigate("/patients/auth")
    }

    return <ErrorBlock message={error.response?.data.message} />
  }

  // Every patient screen now renders its own canonical shell (via
  // PatientPageWrapper / MobileWrapper / AppShell directly), so this component is
  // a pure router — no layout container, no path allowlist. Adding any wrapper
  // here would double-frame the self-shelled screens on desktop.
  return (
    <SessionAuth requireAuth={true}>
      <Routes>
        <Route
          path="/"
          element={
            <RouteMetadata title="Dashboard">
              <PatientDashboard />
            </RouteMetadata>
          }
        >
          <Route index element={<PatientDashboardRedirect />} />
          <Route
            path="home"
            element={
              <Suspense fallback={<LoadingPage />}>
                <PatientDashboardLoansTab />
              </Suspense>
            }
          />
          <Route
            path="circle"
            element={
              <Suspense fallback={<LoadingPage />}>
                <PatientDashboardCircleTab />
              </Suspense>
            }
          />
          <Route
            path="explore"
            element={
              <Suspense fallback={<LoadingPage />}>
                <PatientDashboardExploreTab isActive={true} />
              </Suspense>
            }
          />
          <Route
            path="profile"
            element={
              <Suspense fallback={<LoadingPage />}>
                <PatientDashboardProfileTab />
              </Suspense>
            }
          />
        </Route>

        <Route
          path="/scan-qr-intro"
          element={
            <RouteMetadata title="Scan QR Code">
              <PatientScanQRIntro />
            </RouteMetadata>
          }
        />

        <Route
          path="/payment-verification-request/:id"
          element={
            <RouteMetadata title="Payment Verification Request">
              <PatientManualRequestStatus />
            </RouteMetadata>
          }
        />

        {/* Onboarding */}
        <Route
          path="/add-whatsapp-number"
          element={
            <RouteMetadata title="Add Whatsapp Number">
              <PatientAddWhatsAppNumber />
            </RouteMetadata>
          }
        />

        <Route
          path="/personal-details"
          element={
            <RouteMetadata title="Personal Details">
              <PatientPersonalDetails />
            </RouteMetadata>
          }
        />
        <Route
          path="/kyc-setup-intro"
          element={
            <RouteMetadata title="KYC Setup Intro">
              <PatientKYCSetupIntro />
            </RouteMetadata>
          }
        />

        <Route
          path="/pwa-setup-intro"
          element={
            <RouteMetadata title="PWA Setup Intro">
              <PWAOnboardingIntro />
            </RouteMetadata>
          }
        />
        <Route
          path="/pwa-install"
          element={
            <RouteMetadata title="Install App">
              <InstallAppPage />
            </RouteMetadata>
          }
        />
        <Route
          path="/pwa-notifications"
          element={
            <RouteMetadata title="Enable Notifications">
              <EnableNotificationsPage />
            </RouteMetadata>
          }
        />
        <Route
          path="/pwa-location"
          element={
            <RouteMetadata title="Location Access">
              <LocationAccessPage />
            </RouteMetadata>
          }
        />
        <Route
          path="/pwa-success"
          element={
            <RouteMetadata title="PWA Setup Success">
              <PWASuccessPage />
            </RouteMetadata>
          }
        />

        <Route
          path="/id-verification"
          element={
            <RouteMetadata title="ID Verification">
              <PatientIdVerification />
            </RouteMetadata>
          }
        />

        <Route
          path="/id-verification-onboarding"
          element={
            <RouteMetadata title="ID Verification">
              <PatientIdVerificationOnboarding />
            </RouteMetadata>
          }
        />

        <Route
          path="/document-verification"
          element={
            <RouteMetadata title="Identity Verification">
              <PatientDocumentVerification />
            </RouteMetadata>
          }
        />

        <Route
          path="/id-photo-front-upload"
          element={
            <RouteMetadata title="ID Photo Front Upload">
              <PatientIdPhotoFrontUpload />
            </RouteMetadata>
          }
        />

        <Route
          path="/id-photo-guide"
          element={
            <RouteMetadata title="Taking a good ID photo">
              <PatientIdPhotoGuide />
            </RouteMetadata>
          }
        />

        <Route
          path="/id-selfie-guide"
          element={
            <RouteMetadata title="Taking a good selfie">
              <PatientSelfieGuide />
            </RouteMetadata>
          }
        />

        <Route
          path="/id-selfie"
          element={
            <RouteMetadata title="ID Selfie">
              <PatientIdSelfie />
            </RouteMetadata>
          }
        />

        <Route
          path="/complete-profile"
          element={
            <RouteMetadata title="Complete Profile">
              <CompleteProfilePage />
            </RouteMetadata>
          }
        />

        <Route
          path="/pay-membership"
          element={
            <RouteMetadata title="Pay Membership">
              <PatientPayMembership />
            </RouteMetadata>
          }
        />

        <Route
          path="/set-pin"
          element={
            <RouteMetadata title="Set PIN">
              <PatientSetPin />
            </RouteMetadata>
          }
        />

        <Route
          path="/security-and-permissions"
          element={
            <RouteMetadata title="Security & Permissions">
              <PatientSecurityAndPermissions />
            </RouteMetadata>
          }
        />
        <Route
          path="/change-pin"
          element={
            <RouteMetadata title="Set PIN">
              <PatientChangePin />
            </RouteMetadata>
          }
        />

        <Route
          path="/account-locked"
          element={
            <RouteMetadata title="Account Locked">
              <PatientAccountLocked />
            </RouteMetadata>
          }
        />

        <Route
          path="/id-verification-failure"
          element={
            <RouteMetadata title="ID Verification Failure">
              <PatientIdVerificationFailure />
            </RouteMetadata>
          }
        />

        <Route
          path="/resolve-type"
          element={
            <RouteMetadata title="Resolve Type">
              <PatientResolveType />
            </RouteMetadata>
          }
        />

        <Route
          path="/onboarding-success"
          element={
            <RouteMetadata title="Onboarding Success">
              <PatientOnboardingSuccess />
            </RouteMetadata>
          }
        />

        <Route
          path="/org-onboarding-success"
          element={
            <RouteMetadata title="Organization Onboarding Success">
              <PatientOrgOnboardingSuccess />
            </RouteMetadata>
          }
        />

        <Route
          path="/referral-code"
          element={
            <RouteMetadata title="Referral Code">
              <PatientReferralCode />
            </RouteMetadata>
          }
        />

        <Route
          path="/choose-healthcare-plan"
          element={
            <RouteMetadata title="Choose Healthcare Plan">
              <PatientChooseHealthcarePlan />
            </RouteMetadata>
          }
        />
        <Route
          path="plans-how-it-works"
          element={
            <RouteMetadata title="How it works">
              <PatientPlansHowItWorks />
            </RouteMetadata>
          }
        />

        <Route
          path="/select-Insurance"
          element={
            <RouteMetadata title="Select Insurance">
              <PatientSelectInsurance />
            </RouteMetadata>
          }
        />
        <Route
          path="/payment-result"
          element={
            <RouteMetadata title="Transaction Result">
              <PatientPaymentStatus />
            </RouteMetadata>
          }
        />

        <Route
          path="/payment-status"
          element={
            <RouteMetadata title="Payment Status">
              <PatientPaymentStatus />
            </RouteMetadata>
          }
        />

        <Route
          path="/select-favorite-care-providers"
          element={
            <RouteMetadata title="Select Favorite Hospitals">
              <PatientFavoriteCareProviders />
            </RouteMetadata>
          }
        />

        <Route
          path="/care-profile-setup"
          element={
            <RouteMetadata title="Jireh Profile Setup">
              <CareProfileSetupIndicator />
            </RouteMetadata>
          }
        />

        <Route
          path="/care-profile-success"
          element={
            <RouteMetadata title="Jireh Profile Complete">
              <CareProfileSuccess />
            </RouteMetadata>
          }
        />

        <Route
          path="/add-to-circle"
          element={
            <RouteMetadata title="Add To Circle">
              <PatientAddToCircle />
            </RouteMetadata>
          }
        />

        <Route
          path="/circle-setup-intro"
          element={
            <RouteMetadata title="Circle Setup Intro">
              <PatientCircleSetupIntro />
            </RouteMetadata>
          }
        />

        <Route
          path="/circle-how-it-works"
          element={
            <RouteMetadata title="How Circles Work">
              <PatientHowCirclesWork />
            </RouteMetadata>
          }
        />

        <Route
          path="/kyc-add-circle-members"
          element={
            <RouteMetadata title="Add Circle Members">
              <PatientKYCAddCircleMembers />
            </RouteMetadata>
          }
        />

        <Route
          path="/healthcare-focus"
          element={
            <RouteMetadata title="Healthcare Focus">
              <PatientHealthcareFocus />
            </RouteMetadata>
          }
        />

        <Route
          path="/ncd-status"
          element={
            <RouteMetadata title="NCD Status">
              <PatientNCDStatus />
            </RouteMetadata>
          }
        />

        <Route
          path="/review-membership-details"
          element={
            <RouteMetadata title="Review Membership Details">
              <PatientReviewMembershipDetails />
            </RouteMetadata>
          }
        />

        <Route
          path="/membership-success"
          element={
            <RouteMetadata title="Membership Success">
              <PatientMembershipSuccess />
            </RouteMetadata>
          }
        />

        {/* Loans */}
        <Route path="/loans/*" element={<LoanWrapper />} />

        {/* Payment request flow (request-payment) */}
        <Route path="/payment/*" element={<PaymentRequestWrapper />} />

        {/* Fast-Track (in-network) payment flow */}
        <Route path="/fast-track/*" element={<FastTrackWrapper />} />

        {/* Loan-only screens — role-gated once at the route level. */}
        <Route element={<MemberLoanRouteGuard />}>
          <Route
            path="/financial-statements"
            element={
              <RouteMetadata title="Financial Statements">
                <PatientFinancialStatements />
              </RouteMetadata>
            }
          />

          <Route
            path="/financial-statements-with-credit-update"
            element={
              <RouteMetadata title="Financial Statements">
                <PatientFinancialStatementsWithCreditUpdate />
              </RouteMetadata>
            }
          />

          {/* FAQs (loan-only) */}
          <Route
            path="/faqs/downloaded-files"
            element={
              <RouteMetadata title="Find Downloaded Files">
                <DownloadedFilesGuide />
              </RouteMetadata>
            }
          />
          <Route
            path="/faqs/passcode"
            element={
              <RouteMetadata title="Passcode Guide">
                <PasscodeGuide />
              </RouteMetadata>
            }
          />
          <Route
            path="/faqs/mpesa-statement"
            element={
              <RouteMetadata title="MPESA Statement Guide">
                <MpesaStatementGuide />
              </RouteMetadata>
            }
          />
        </Route>

        {/* General member FAQs (all members — not loan-gated) */}
        <Route
          path="/faqs"
          element={
            <RouteMetadata title="FAQs">
              <FaqsPage />
            </RouteMetadata>
          }
        />

        {/* Network */}
        <Route
          path="/network/*"
          element={
            <RouteMetadata title="My Network">
              <PatientNetworkWrapper />
            </RouteMetadata>
          }
        />

        {/* Payment */}
        <Route path="/payments/*" element={<PaymentWrapper />} />

        <Route
          path="/transaction-result"
          element={
            <RouteMetadata title="Transaction Result">
              <TransactionResult />
            </RouteMetadata>
          }
        />

        {/* Org Pages */}
        <Route
          path="/organizations/how-it-works"
          element={
            <RouteMetadata title="Your Advance Health Plan">
              <PatientOrgHowItWorks />
            </RouteMetadata>
          }
        />

        {/* Patient Care Fund */}
        <Route
          path="/care-fund/*"
          element={
            <RouteMetadata title="Your Care Fund">
              <PatientCareFundRoutes />
            </RouteMetadata>
          }
        />

        {/* Misc */}
        <Route
          path="/notifications"
          element={
            <RouteMetadata title="Notifications">
              <PatientNotificationsPage />
            </RouteMetadata>
          }
        />

        <Route
          path="/referral-and-earn"
          element={
            <RouteMetadata title="Refer & Earn">
              <PatientReferralAndEarn />
            </RouteMetadata>
          }
        />

        <Route
          path="/help-and-support"
          element={
            <RouteMetadata title="Help & Support">
              <PatientHelpAndSupport />
            </RouteMetadata>
          }
        />
        <Route
          path="/terms-and-conditions"
          element={
            <RouteMetadata title="Terms and COnditions">
              <PatientTermsAndConditions />
            </RouteMetadata>
          }
        />
        <Route
          path="/medical-consent-form"
          element={
            <RouteMetadata title="Medical Consent Form">
              <PatientMedicalConsentForm />
            </RouteMetadata>
          }
        />

        <Route
          path="/discover-hospitals"
          element={
            <RouteMetadata title="Discover Hospitals">
              <PatientDiscoverHospitals />
            </RouteMetadata>
          }
        />

        <Route
          path="/search"
          element={
            <RouteMetadata title="Search">
              <SearchPage />
            </RouteMetadata>
          }
        />

        <Route
          path="/search/filters"
          element={
            <RouteMetadata title="Filters">
              <FiltersPage />
            </RouteMetadata>
          }
        />

        <Route
          path="/facility/:id"
          element={
            <RouteMetadata title="Facility Details">
              <FacilityDetailsPage />
            </RouteMetadata>
          }
        />

        <Route
          path="/facility/:id/review"
          element={
            <RouteMetadata title="Add a review">
              <FacilityReviewFormPage />
            </RouteMetadata>
          }
        />

        <Route
          path="/discounts"
          element={
            <RouteMetadata title="Active discounts">
              <PatientDiscountsList />
            </RouteMetadata>
          }
        />

        <Route
          path="/discounts/:id"
          element={
            <RouteMetadata title="Discount details">
              <PatientDiscountDetails />
            </RouteMetadata>
          }
        />

        {/* Insurance */}
        <Route path="/insurance/*" element={<PatientInsuranceWrapper />} />

        {/* Subscriptions */}
        <Route
          path="/subscriptions/*"
          element={<PatientSubscriptionsWrapper />}
        />
      </Routes>
    </SessionAuth>
  )
}
