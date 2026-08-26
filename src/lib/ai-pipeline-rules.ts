/**
 * Single source of truth for AI pipeline business rules.
 * Both the LLM system prompt and the deterministic fallback
 * generator read from these constants.
 */

export const CASHBACK_ACTIONABLE_MIN_KES = 200
export const JIREH_PLUS_MONTHLY_THRESHOLD_KES = 8000
export const JIREH_PLUS_PROJECTION_WINDOW_MONTHS = 3
export const JIREH_PLUS_DISCOUNT_RATE = 0.15
export const MIN_CIRCLE_MEMBERS = 2
export const LOAN_REMINDER_WINDOW_DAYS = 2
export const LOAN_OFFER_MIN_REPAYMENT_STREAK = 3
export const LOAN_OFFER_MIN_COMPLETED_LOANS = 1
export const LOAN_OFFER_HIGH_COST_THRESHOLD_KES = 5000
export const RECENT_PAYMENT_WINDOW_DAYS = 7
export const INVOICE_MEDICATION_COST_RATIO = 0.7
export const MAX_EVENTS_FOR_LLM = 50
