/**
 * Analytics Module
 * Centralized analytics layer for Amplitude event tracking
 */

// Core tracking
export { trackEvent, trackPageView, flushEvents } from './tracking';

// Event constants
export { EVENTS } from './events';

// Masking utilities
export {
  maskPhoneNumber,
  maskIdNumber,
  maskEmail,
  safeAmount,
} from './metadata';

// User properties
export {
  updateUserProperties,
  incrementUserProperty,
  setOnceUserProperty,
} from './userProperties';

// Types
export type {
  TrackEventProperties,
  UserProperties,
  MaskedIdentifiers,
  JourneyName,
} from './types';
