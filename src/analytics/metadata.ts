/**
 * Analytics Metadata Utilities
 * Privacy-safe masking functions for sensitive data
 */

/**
 * Masks a phone number showing only first 3 and last 3 digits
 * Example: +254712345678 -> +25***678
 */
export function maskPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';

  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.length < 6) return '***';

  const prefix = cleaned.slice(0, 3);
  const suffix = cleaned.slice(-3);
  return `${prefix}***${suffix}`;
}

/**
 * Masks an ID number showing only last 4 digits
 * Example: 12345678 -> ****5678
 */
export function maskIdNumber(idNumber: string | null | undefined): string {
  if (!idNumber) return '';

  const cleaned = idNumber.replace(/\s/g, '');
  if (cleaned.length < 4) return '****';

  const suffix = cleaned.slice(-4);
  return `****${suffix}`;
}

/**
 * Masks an email address showing only first 2 characters and domain
 * Example: john.doe@example.com -> jo***@example.com
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '';

  const atIndex = email.indexOf('@');
  if (atIndex < 2) return '***@***';

  const prefix = email.slice(0, 2);
  const domain = email.slice(atIndex);
  return `${prefix}***${domain}`;
}

/**
 * Safely extracts a numeric amount from various input types
 */
export function safeAmount(amount: number | string | null | undefined): number | null {
  if (amount === null || amount === undefined) return null;
  const parsed = typeof amount === 'string' ? parseFloat(amount) : amount;
  return isNaN(parsed) ? null : parsed;
}
