/** Stub for `supertokens-auth-react/recipe/emailverification`. */

export async function sendVerificationEmail(): Promise<{ status: string }> {
  return { status: "OK" }
}

export async function isEmailVerified(): Promise<{
  status: string
  isVerified: boolean
}> {
  return { status: "OK", isVerified: true }
}

const EmailVerification = { init: (_config?: unknown) => ({}) }
export default EmailVerification
