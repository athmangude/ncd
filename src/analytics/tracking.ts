/**
 * Analytics Tracking Core — standalone prototype stub.
 *
 * The real implementation forwarded events to Amplitude. The prototype has no
 * analytics backend, so these are no-ops that preserve the public API (and the
 * many `trackEvent(...)` call sites across the app keep compiling and running).
 */

import type { TrackEventProperties } from "./types"

export function trackEvent(
  _eventName: string,
  _properties?: TrackEventProperties
): void {
  // no-op
}

export function trackPageView(
  _pageName: string,
  _properties?: TrackEventProperties
): void {
  // no-op
}

export function flushEvents(): void {
  // no-op
}
