/**
 * User Property Management — standalone prototype stub.
 *
 * Previously forwarded user properties to Amplitude. No analytics backend in
 * the prototype, so these are no-ops that preserve the public API.
 */

import type { UserProperties } from "./types"

export function updateUserProperties(_properties: UserProperties): void {
  // no-op
}

export function incrementUserProperty(_property: string, _value = 1): void {
  // no-op
}

export function setOnceUserProperty(
  _property: string,
  _value: string | number | boolean
): void {
  // no-op
}
