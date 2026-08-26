/**
 * Analytics Event Constants
 * All event names following the JOURNEY-NAME:StageName:action-name convention
 */

export const EVENTS = {
  // SIGNUP Journey
  SIGNUP: {
    PHONE_ENTRY_VIEW: "SIGNUP:PhoneEntry:view",
    PHONE_ENTRY_SUBMIT: "SIGNUP:PhoneEntry:submit",
    OTP_VIEW: "SIGNUP:Otp:view",
    OTP_SUBMIT: "SIGNUP:Otp:submit",
    OTP_RESEND: "SIGNUP:Otp:resend",
    OTP_SUCCESS: "SIGNUP:Otp:success",
    OTP_ERROR: "SIGNUP:Otp:error",
    PERSONAL_DETAILS_VIEW: "SIGNUP:PersonalDetails:view",
    PERSONAL_DETAILS_SUBMIT: "SIGNUP:PersonalDetails:submit",
    SET_PIN_VIEW: "SIGNUP:SetPin:view",
    SET_PIN_SUBMIT: "SIGNUP:SetPin:submit",
  },

  // SIGNIN Journey
  SIGNIN: {
    PHONE_ENTRY_VIEW: "SIGNIN:PhoneEntry:view",
    PHONE_ENTRY_SUBMIT: "SIGNIN:PhoneEntry:submit",
    OTP_VIEW: "SIGNIN:Otp:view",
    OTP_SUBMIT: "SIGNIN:Otp:submit",
    OTP_RESEND: "SIGNIN:Otp:resend",
    OTP_SUCCESS: "SIGNIN:Otp:success",
    OTP_ERROR: "SIGNIN:Otp:error",
  },

  // PAYMENT Journey
  PAYMENT: {
    TREATMENT_DETAILS_VIEW: "PAYMENT:TreatmentDetails:view",
    TREATMENT_DETAILS_PROVIDER_SELECT:
      "PAYMENT:TreatmentDetails:provider-select",
    UPLOAD_INVOICE_VIEW: "PAYMENT:UploadInvoice:view",
    UPLOAD_INVOICE_START: "PAYMENT:UploadInvoice:upload-start",
    UPLOAD_INVOICE_SUCCESS: "PAYMENT:UploadInvoice:upload-success",
    UPLOAD_INVOICE_ERROR: "PAYMENT:UploadInvoice:upload-error",
    SET_BILL_AMOUNT_VIEW: "PAYMENT:SetBillAmount:view",
    SET_BILL_AMOUNT_SUBMIT: "PAYMENT:SetBillAmount:submit",
    WALLET_SELECTION_VIEW: "PAYMENT:WalletSelection:view",
    WALLET_SELECTION_SUBMIT: "PAYMENT:WalletSelection:submit",
    WALLET_ALLOCATE: "PAYMENT:WalletSelection:allocate",
    PAYMENT_CONFIRMATION_VIEW: "PAYMENT:PaymentConfirmation:view",
    PAYMENT_CONFIRMATION_SUBMIT: "PAYMENT:PaymentConfirmation:submit",
    PAYMENT_CONFIRMATION_SUCCESS: "PAYMENT:PaymentConfirmation:success",
    PAYMENT_CONFIRMATION_ERROR: "PAYMENT:PaymentConfirmation:error",
  },

  // KYC Journey
  KYC: {
    INTRO_VIEW: "KYC:Intro:view",
    ID_VERIFICATION_VIEW: "KYC:IdVerification:view",
    ID_VERIFICATION_SUBMIT: "KYC:IdVerification:submit",
    ID_VERIFICATION_SUCCESS: "KYC:IdVerification:success",
    ID_VERIFICATION_ERROR: "KYC:IdVerification:error",
    DOCUMENT_VERIFICATION_VIEW: "KYC:DocumentVerification:view",
    DOCUMENT_VERIFICATION_SUBMIT: "KYC:DocumentVerification:submit",
    SELFIE_VIEW: "KYC:Selfie:view",
    SELFIE_CAPTURE: "KYC:Selfie:capture",
    SELFIE_SUBMIT: "KYC:Selfie:submit",
    ADD_CIRCLE_MEMBERS_VIEW: "KYC:AddCircleMembers:view",
    ADD_CIRCLE_MEMBERS_ADD: "KYC:AddCircleMembers:add",
    ADD_CIRCLE_MEMBERS_COMPLETE: "KYC:AddCircleMembers:complete",
    CIRCLE_STEP_STATE: "KYC:AddCircleMembers:state-viewed",
    MEMBERSHIP_VIEW: "KYC:Membership:view",
    MEMBERSHIP_SUBMIT: "KYC:Membership:submit",
    MEMBERSHIP_SUCCESS: "KYC:Membership:success",
    MEMBERSHIP_ERROR: "KYC:Membership:error",
  },

  // CARE_PROFILE Journey
  CARE_PROFILE: {
    INSURANCE_VIEW: "CARE_PROFILE:Insurance:view",
    INSURANCE_SUBMIT: "CARE_PROFILE:Insurance:submit",
    PROVIDERS_VIEW: "CARE_PROFILE:Providers:view",
    PROVIDERS_ADD: "CARE_PROFILE:Providers:add",
    PROVIDERS_REMOVE: "CARE_PROFILE:Providers:remove",
    HEALTH_PRIORITIES_VIEW: "CARE_PROFILE:HealthPriorities:view",
    HEALTH_PRIORITIES_SUBMIT: "CARE_PROFILE:HealthPriorities:submit",
    NCD_STATUS_VIEW: "CARE_PROFILE:NcdStatus:view",
    NCD_STATUS_SUBMIT: "CARE_PROFILE:NcdStatus:submit",
  },

  // CIRCLE Journey
  CIRCLE: {
    NETWORK_VIEW: "CIRCLE:Network:view",
    EMPTY_STATE_VIEW: "CIRCLE:EmptyState:view",
    START_BUILDING_TAP: "CIRCLE:EmptyState:start-building-tap",
    ADD_CONNECTION_VIEW: "CIRCLE:AddConnection:view",
    ADD_CONNECTION_SUBMIT: "CIRCLE:AddConnection:submit",
    ADD_CONNECTION_SUCCESS: "CIRCLE:AddConnection:success",
    INVITATION_VIEW: "CIRCLE:Invitation:view",
    INVITATION_ACCEPT: "CIRCLE:Invitation:accept",
    INVITATION_REJECT: "CIRCLE:Invitation:reject",
    INVITATION_AUDIO_PLAY: "CIRCLE:Invitation:audio-play",
    INVITATION_AUDIO_PAUSE: "CIRCLE:Invitation:audio-pause",
    MEMBER_DETAILS_VIEW: "CIRCLE:MemberDetails:view",
    MEMBER_DETAILS_REMOVE: "CIRCLE:MemberDetails:remove",
    MEMBER_DETAILS_REMINDER_SENT: "CIRCLE:MemberDetails:reminder-sent",
    MEMBER_DETAILS_CALL_TAPPED: "CIRCLE:MemberDetails:call-tapped",
    MEMBER_DETAILS_GIFT_TAPPED: "CIRCLE:MemberDetails:gift-tapped",
    MEMBER_DETAILS_PAY_BILL_TAPPED: "CIRCLE:MemberDetails:pay-bill-tapped",
    MEMBER_DETAILS_REINVITE_TAPPED: "CIRCLE:MemberDetails:reinvite-tapped",
    INVITE_REJECTED_BANNER_TAPPED: "CIRCLE:InviteRejected:banner-tapped",
    INVITE_REJECTED_VIEW: "CIRCLE:InviteRejected:view",
    INVITE_REJECTED_REINVITE_TAPPED: "CIRCLE:InviteRejected:reinvite-tapped",
    INVITE_REJECTED_INVITE_NEW_TAPPED:
      "CIRCLE:InviteRejected:invite-new-tapped",
    INVITE_REJECTED_SEE_CIRCLE_TAPPED:
      "CIRCLE:InviteRejected:see-circle-tapped",
    HOW_IT_WORKS_VIEW: "CIRCLE:HowItWorks:view",
    HOW_IT_WORKS_CTA_TAP: "CIRCLE:HowItWorks:cta-tap",
    HOW_IT_WORKS_CALL_SUPPORT_TAP: "CIRCLE:HowItWorks:call-support-tap",
  },

  // LOAN_REPAYMENT Journey
  LOAN_REPAYMENT: {
    // Entry points
    REPAY_CTA_TAP: "LOAN_REPAYMENT:LoansTab:repay-cta-tap",
    ALL_LOANS_VIEW: "LOAN_REPAYMENT:AllLoans:view",
    HISTORY_LOAN_CARD_TAP: "LOAN_REPAYMENT:LoanHistory:loan-card-tap",
    // Loan details
    LOAN_DETAILS_VIEW: "LOAN_REPAYMENT:LoanDetails:view",
    REPAY_BUTTON_TAP: "LOAN_REPAYMENT:LoanDetails:repay-button-tap",
    // Payment drawer
    PORTAL_VIEW: "LOAN_REPAYMENT:Portal:view",
    PAYMENT_VIEW: "LOAN_REPAYMENT:Payment:view",
    PAYMENT_SUBMIT: "LOAN_REPAYMENT:Payment:submit",
    PAYMENT_SUCCESS: "LOAN_REPAYMENT:Payment:success",
    PAYMENT_ERROR: "LOAN_REPAYMENT:Payment:error",
    // Transaction result
    RESULT_VIEW: "LOAN_REPAYMENT:Result:view",
  },

  // SUPPORT Journey
  SUPPORT: {
    VIEW: "SUPPORT:Main:view",
    FAQ_VIEW: "SUPPORT:Faq:view",
    CONTACT_VIEW: "SUPPORT:Contact:view",
    CONTACT_SUBMIT: "SUPPORT:Contact:submit",
  },

  // FAST_TRACK_PAYMENT Journey (Patient Payments via Jireh Payment Numbers)
  // Entirely separate journey at /patients/fast-track/* — all stages tracked
  // independently from the regular PAYMENT journey at /patients/payment/*.
  FAST_TRACK_PAYMENT: {
    TYPE_SELECTION_VIEW: "FAST_TRACK_PAYMENT:TypeSelection:view",
    RESOLVE_PROVIDER_VIEW: "FAST_TRACK_PAYMENT:ResolveProvider:view",
    PAYMENT_POINT_VIEWED: "FAST_TRACK_PAYMENT:PaymentPoint:viewed",
    PAYMENT_DETAILS_VIEW: "FAST_TRACK_PAYMENT:PaymentDetails:view",
    DISCOUNT_CODE_VIEWED:
      "FAST_TRACK_PAYMENT:PaymentDetails:discount-code-viewed",
    DISCOUNT_CODE_APPLIED:
      "FAST_TRACK_PAYMENT:PaymentDetails:discount-code-applied",
    DISCOUNT_CODE_REJECTED:
      "FAST_TRACK_PAYMENT:PaymentDetails:discount-code-rejected",
    DISCOUNT_CODE_REMOVED:
      "FAST_TRACK_PAYMENT:PaymentDetails:discount-code-removed",
    PAYMENT_INITIATED: "FAST_TRACK_PAYMENT:Payment:initiated",
    WALLET_SELECTION_VIEW: "FAST_TRACK_PAYMENT:WalletSelection:view",
    WALLET_ALLOCATE: "FAST_TRACK_PAYMENT:WalletSelection:allocate",
    CONFIRM_VIEW: "FAST_TRACK_PAYMENT:Confirm:view",
    AUTHORIZATION_ATTEMPT: "FAST_TRACK_PAYMENT:Payment:authorization-attempt",
    PAYMENT_COMPLETED: "FAST_TRACK_PAYMENT:Payment:completed",
    PAYMENT_FAILED: "FAST_TRACK_PAYMENT:Payment:failed",
    PAYMENT_REFUNDED: "FAST_TRACK_PAYMENT:Payment:refunded",
    RESULT_VIEW: "FAST_TRACK_PAYMENT:Result:view",
  },

  // PROFILE Journey
  PROFILE: {
    VIEW: "PROFILE:Main:view",
    EDIT_VIEW: "PROFILE:Edit:view",
    EDIT_SUBMIT: "PROFILE:Edit:submit",
    SETTINGS_VIEW: "PROFILE:Settings:view",
    LOGOUT: "PROFILE:Main:logout",
  },

  // DISCOVERY Journey
  DISCOVERY: {
    EXPLORE_TAB_VIEW: "DISCOVERY:ExploreTab:view",
    LOCATION_PROMPT_VIEW: "DISCOVERY:LocationPrompt:view",
    LOCATION_REQUEST_TAP: "DISCOVERY:LocationPrompt:request-tap",
    LOCATION_GRANTED: "DISCOVERY:LocationPermission:granted",
    LOCATION_DENIED: "DISCOVERY:LocationPermission:denied",
    LOCATION_ERROR: "DISCOVERY:LocationPermission:error",
    SEARCH_SUBMIT: "DISCOVERY:Search:submit",
    SEARCH_PAGE_VIEW: "DISCOVERY:SearchPage:view",
    SEARCH_RECENT_TAP: "DISCOVERY:SearchPage:recent-tap",
    SEARCH_PREFERRED_TAP: "DISCOVERY:SearchPage:preferred-tap",
    SEARCH_RESULT_TAP: "DISCOVERY:SearchPage:result-tap",
    FILTERS_OPEN: "DISCOVERY:Filters:open",
    FILTERS_APPLY: "DISCOVERY:Filters:apply",
    FILTER_CHIP_REMOVE: "DISCOVERY:Filters:chip-remove",
    FAVORITE_TOGGLE: "DISCOVERY:Facility:favorite-toggle",
    FACILITY_TAP: "DISCOVERY:Facility:tap",
    DISCOUNTS_LIST_VIEW: "DISCOVERY:DiscountsList:view",
    FACILITY_DETAILS_VIEW: "DISCOVERY:FacilityDetails:view",
    FACILITY_DETAILS_TAB_CHANGE: "DISCOVERY:FacilityDetails:tab-change",
    FACILITY_DETAILS_GET_DIRECTIONS: "DISCOVERY:FacilityDetails:get-directions",
    FACILITY_DETAILS_PAY_HERE: "DISCOVERY:FacilityDetails:pay-here",
    FACILITY_DETAILS_ADD_REVIEW: "DISCOVERY:FacilityDetails:add-review",
    FACILITY_REVIEW_FORM_VIEW: "DISCOVERY:FacilityReview:view",
    FACILITY_REVIEW_SCORE_SELECT: "DISCOVERY:FacilityReview:score-select",
    FACILITY_REVIEW_SUBMIT_TAP: "DISCOVERY:FacilityReview:submit-tap",
    FACILITY_REVIEW_SUBMIT_SUCCESS: "DISCOVERY:FacilityReview:submit-success",
    FACILITY_REVIEW_SUBMIT_ERROR: "DISCOVERY:FacilityReview:submit-error",
    FACILITY_REVIEW_GATE_BLOCKED: "DISCOVERY:FacilityReview:gate-blocked",
    FACILITY_REVIEW_PROMPT_VIEW: "DISCOVERY:FacilityReview:prompt-view",
    FACILITY_REVIEW_PROMPT_TAP: "DISCOVERY:FacilityReview:prompt-tap",
    CATEGORY_TILE_TOGGLE: "DISCOVERY:CategoryTile:toggle",
  },

  // PWA_INSTALL Journey
  PWA_INSTALL: {
    ONBOARDING_INTRO_VIEW: "PWA_INSTALL:OnboardingIntro:view",
    INSTALL_PAGE_VIEW: "PWA_INSTALL:InstallPage:view",
    INSTALL_PROMPT_AVAILABLE: "PWA_INSTALL:InstallPrompt:available",
    INSTALL_TAP: "PWA_INSTALL:Install:tap",
    INSTALL_ACCEPTED: "PWA_INSTALL:Install:accepted",
    INSTALL_DISMISSED: "PWA_INSTALL:Install:dismissed",
    SKIP_TAP: "PWA_INSTALL:Skip:tap",
    SKIP_REMIND_LATER: "PWA_INSTALL:Skip:remind-later",
    SKIP_DONT_ASK_AGAIN: "PWA_INSTALL:Skip:dont-ask-again",
    INSTALL_CONFIRMED: "PWA_INSTALL:Install:confirmed",
    ALREADY_INSTALLED: "PWA_INSTALL:Install:already-installed",
    SUCCESS_PAGE_VIEW: "PWA_INSTALL:SuccessPage:view",
  },

  // NOTIFICATIONS Journey
  NOTIFICATIONS: {
    PAGE_VIEW: "NOTIFICATIONS:EnablePage:view",
    ENABLE_TAP: "NOTIFICATIONS:Enable:tap",
    PERMISSION_GRANTED: "NOTIFICATIONS:Permission:granted",
    PERMISSION_DENIED: "NOTIFICATIONS:Permission:denied",
    SKIP_TAP: "NOTIFICATIONS:Skip:tap",
    HELP_DIALOG_OPEN: "NOTIFICATIONS:HelpDialog:open",
  },

  // CARE_COMPANION Journey
  // Uses nested sub-objects (e.g. CARE_COMPANION.INTAKE.VIEW) instead of flat
  // keys because this journey spans 11 distinct sub-areas. This is intentional
  // for large journeys with many screens; prefer this pattern going forward
  // when a journey exceeds ~10 events.
  CARE_COMPANION: {
    INTAKE: {
      VIEW: "CARE_COMPANION:Intake:view",
      STEP_COMPLETE: "CARE_COMPANION:Intake:step-complete",
      SKIP: "CARE_COMPANION:Intake:skip",
      COMPLETE: "CARE_COMPANION:Intake:complete",
    },
    HOME: {
      VIEW: "CARE_COMPANION:Home:view",
      CARD_TAP: "CARE_COMPANION:Home:card-tap",
      EMERGENCY_CARD_TAP: "CARE_COMPANION:Home:emergency-card-tap",
      REFILL_CARD_TAP: "CARE_COMPANION:Home:refill-card-tap",
      COST_CARD_TAP: "CARE_COMPANION:Home:cost-card-tap",
      EDUCATION_CARD_VIEW: "CARE_COMPANION:Home:education-card-view",
      AI_ASSISTANT_OPEN: "CARE_COMPANION:Home:ai-assistant-open",
    },
    EMERGENCY_CARD: {
      VIEW: "CARE_COMPANION:EmergencyCard:view",
      TRANSPORT_CREDIT_TAP: "CARE_COMPANION:EmergencyCard:transport-credit-tap",
    },
    COST_TRACKER: {
      VIEW: "CARE_COMPANION:CostTracker:view",
      SHARE_TAP: "CARE_COMPANION:CostTracker:share-tap",
      CATEGORY_TAP: "CARE_COMPANION:CostTracker:category-tap",
      TREND_SCROLL: "CARE_COMPANION:CostTracker:trend-scroll",
      PAYMENT_EXPAND: "CARE_COMPANION:CostTracker:payment-expand",
    },
    MEDICATION_TIMELINE: {
      VIEW: "CARE_COMPANION:MedicationTimeline:view",
      FILTER_CHANGE: "CARE_COMPANION:MedicationTimeline:filter-change",
      EXPORT_TAP: "CARE_COMPANION:MedicationTimeline:export-tap",
      FILTER_DATE: "CARE_COMPANION:MedicationTimeline:filter-date",
      EXPORT_SUCCESS: "CARE_COMPANION:MedicationTimeline:export-success",
    },
    MEDICATION_CARDS: {
      VIEW: "CARE_COMPANION:MedicationCards:view",
      CARD_EXPAND: "CARE_COMPANION:MedicationCards:card-expand",
      OVERLAY_DISMISS: "CARE_COMPANION:MedicationCards:overlay-dismiss",
      OVERLAY_VIEW_ALL: "CARE_COMPANION:MedicationCards:overlay-view-all",
      CARD_SWIPE: "CARE_COMPANION:MedicationCards:card-swipe",
      INTERACTION_WARNING_TAP: "CARE_COMPANION:MedicationCards:interaction-warning-tap",
    },
    REFILL_SCHEDULE: {
      VIEW: "CARE_COMPANION:RefillSchedule:view",
      FIND_PHARMACY_TAP: "CARE_COMPANION:RefillSchedule:find-pharmacy-tap",
      APPLY_CREDIT_TAP: "CARE_COMPANION:RefillSchedule:apply-credit-tap",
      ITEM_TAP: "CARE_COMPANION:RefillSchedule:item-tap",
      ITEM_REMOVE: "CARE_COMPANION:RefillSchedule:item-remove",
      TEST_REMOVE: "CARE_COMPANION:RefillSchedule:test-remove",
    },
    AI_PIPELINE: {
      RUN_START: "CARE_COMPANION:AiPipeline:run-start",
      RUN_COMPLETE: "CARE_COMPANION:AiPipeline:run-complete",
      RUN_SKIP_DEDUP: "CARE_COMPANION:AiPipeline:run-skip-dedup",
      RUN_ERROR: "CARE_COMPANION:AiPipeline:run-error",
      ACTION_DISMISS: "CARE_COMPANION:AiPipeline:action-dismiss",
      ACTION_TAP: "CARE_COMPANION:AiPipeline:action-tap",
    },
    EVENTS: {
      PAYMENT_RECORDED: "CARE_COMPANION:Events:payment-recorded",
      CASHBACK_EARNED: "CARE_COMPANION:Events:cashback-earned",
      CIRCLE_INVITE_SENT: "CARE_COMPANION:Events:circle-invite-sent",
      CIRCLE_INVITE_ACCEPTED: "CARE_COMPANION:Events:circle-invite-accepted",
      DRUG_INTERACTION_DETECTED: "CARE_COMPANION:Events:drug-interaction-detected",
      JIREH_PLUS_STATUS_CHANGE: "CARE_COMPANION:Events:jireh-plus-status-change",
    },
    EDUCATION: {
      VIEW: "CARE_COMPANION:Education:view",
      CARD_VIEWED: "CARE_COMPANION:Education:card-viewed",
      PREVIOUS_CARDS_TAP: "CARE_COMPANION:Education:previous-cards-tap",
      CARD_COMPLETE: "CARE_COMPANION:Education:card-complete",
    },
    PHARMACY_STOCK: {
      VIEW: "CARE_COMPANION:PharmacyStock:view",
      SEARCH: "CARE_COMPANION:PharmacyStock:search",
      MAP_TOGGLE: "CARE_COMPANION:PharmacyStock:map-toggle",
      LOCATION_GRANTED: "CARE_COMPANION:PharmacyStock:location-granted",
      LOCATION_DENIED: "CARE_COMPANION:PharmacyStock:location-denied",
      MANUAL_LOCATION: "CARE_COMPANION:PharmacyStock:manual-location",
    },
    MEDICATION_LOAN: {
      VIEW: "CARE_COMPANION:MedicationLoan:view",
      ACCEPT_TAP: "CARE_COMPANION:MedicationLoan:accept-tap",
      DECLINE_TAP: "CARE_COMPANION:MedicationLoan:decline-tap",
      PRE_APPROVAL_VIEW: "CARE_COMPANION:MedicationLoan:pre-approval-view",
    },
    AI_ASSISTANT: {
      VIEW: "CARE_COMPANION:AiAssistant:view",
      MESSAGE_SEND: "CARE_COMPANION:AiAssistant:message-send",
      SUGGESTED_ACTION_TAP: "CARE_COMPANION:AiAssistant:suggested-action-tap",
      INTERACTION_CHECK: "CARE_COMPANION:AiAssistant:interaction-check",
      GUARDRAIL_TRIGGERED: "CARE_COMPANION:AiAssistant:guardrail-triggered",
      REPORT_INACCURATE: "CARE_COMPANION:AiAssistant:report-inaccurate",
    },
    ERROR: {
      BOUNDARY_HIT: "CARE_COMPANION:Error:boundary-hit",
      RETRY_TAP: "CARE_COMPANION:Error:retry-tap",
    },
  },
} as const
