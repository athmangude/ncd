import { http, HttpResponse } from "msw"
import { readObject, writeObject, makeId } from "../db"
import { patchLoginDetails } from "./profile"
import countryCodesSeed from "../fixtures/country-codes.json"
import idVerificationDetailsSeed from "../fixtures/id-verification-details.json"
import guarantorInvitesSeed from "../fixtures/guarantor-invites.json"
import linkSocialOptionsSeed from "../fixtures/link-social-options.json"

const GUARANTOR_INVITES_KEY = "guarantor-invites"

type GuarantorInvite = {
  id: string
  firstName: string
  lastName: string
  phoneNumber: string
  countryCode: string
  email: string
  guarantorType: "LOCAL" | "INTERNATIONAL"
}

type GuarantorInvitesData = {
  patientCountryCode: string
  countryOptions: { name: string; value: string; callingCode: string }[]
  localGuarantorInvites: GuarantorInvite[]
  internationalGuarantorInvites: GuarantorInvite[]
}

type GuarantorInviteBody = {
  firstName: string
  lastName: string
  phoneNumber: string
  email: string
  countryCode: string
  guarantorType: "LOCAL" | "INTERNATIONAL"
}

type RescindGuarantorBody = {
  inviteId: string
}

function getGuarantorInvites(): GuarantorInvitesData {
  return readObject<GuarantorInvitesData>(
    GUARANTOR_INVITES_KEY,
    guarantorInvitesSeed as GuarantorInvitesData
  )
}

export const onboardingHandlers = [
  // Country codes for phone number entry. PatientSignUp reads the array directly.
  http.get("/country-codes", () => HttpResponse.json(countryCodesSeed)),

  // Verify the entered name against the (mocked) verified ID. Always matches.
  // Persist the entered name so a fresh participant's profile is built up and the
  // onboarding gate (firstName && lastName) stops redirecting back here.
  http.post("/patients/verify-phone-name-match", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      matchFields?: { first_name?: string; last_name?: string }
    }
    const firstName = body.matchFields?.first_name
    const lastName = body.matchFields?.last_name
    if (firstName || lastName) {
      patchLoginDetails({
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
      })
    }
    return HttpResponse.json({ message: "Name matches the verified ID" })
  }),

  // Prefilled identity details for the employment step.
  http.get("/patients/id-verification-details", () =>
    HttpResponse.json(getIdVerificationDetails())
  ),

  // Employment details submission.
  http.post("/patients/employment-details", async () =>
    HttpResponse.json({ message: "Employment details saved successfully" })
  ),

  // CRB score validation — marks the profile as CRB-verified.
  http.post("/underwriting/validate-crb-score", async () => {
    patchLoginDetails({ hasVerifiedCrbScore: true })
    return HttpResponse.json({ message: "CRB score validated successfully" })
  }),

  // Accept the latest terms and conditions.
  http.post("/patients/accept-terms-and-conditions", async () => {
    patchLoginDetails({ hasAcceptedLatestTermsAndConditions: true })
    return HttpResponse.json({ message: "Terms and conditions accepted" })
  }),

  // Accept the medical consent form.
  http.post("/patients/accept-medical-consent-form", async () => {
    patchLoginDetails({ hasAcceptedMedicalConsentForm: true })
    return HttpResponse.json({ message: "Medical consent form accepted" })
  }),

  // Create the patient (sets PIN). PatientCreatePin reads res.data.data.
  http.post("/patients/", async ({ request }) => {
    const body = (await request.json()) as {
      id: string
      pin: string
      firstName: string
      lastName: string
    }

    const merged = patchLoginDetails({ hasSetPin: true })

    return HttpResponse.json({
      data: {
        id: body.id || merged.id,
        email: merged.email,
        firstName: body.firstName || merged.firstName,
        lastName: body.lastName || merged.lastName,
        phoneNumber: merged.phoneNumber,
        isVerified: merged.isVerified,
      },
    })
  }),

  // Set PIN (standalone step) — marks the profile as PIN-set.
  http.post("/patients/set-pin", async () => {
    patchLoginDetails({ hasSetPin: true })
    return HttpResponse.json({ message: "PIN set successfully" })
  }),

  // Update WhatsApp number.
  http.post("/patients/update-whatsapp-number", async () =>
    HttpResponse.json({ message: "WhatsApp number updated successfully" })
  ),

  // Guarantor invites — list (seed + persisted invites).
  http.get("/patients/guarantor-invites", () =>
    HttpResponse.json(getGuarantorInvites())
  ),

  // Guarantor invite — persist a new invite into the list.
  http.post("/patients/guarantor-invite", async ({ request }) => {
    const body = (await request.json()) as GuarantorInviteBody
    const data = getGuarantorInvites()

    const invite: GuarantorInvite = {
      id: makeId("guarantor"),
      firstName: body.firstName,
      lastName: body.lastName,
      phoneNumber: body.phoneNumber,
      countryCode: body.countryCode,
      email: body.email,
      guarantorType: body.guarantorType,
    }

    if (body.guarantorType === "INTERNATIONAL") {
      data.internationalGuarantorInvites.push(invite)
    } else {
      data.localGuarantorInvites.push(invite)
    }

    writeObject(GUARANTOR_INVITES_KEY, data)

    return HttpResponse.json({ message: "Guarantor invited successfully" })
  }),

  // Rescind a guarantor invitation — remove it from the list.
  http.post("/patients/rescind-guarantor-invitation", async ({ request }) => {
    const body = (await request.json()) as RescindGuarantorBody
    const data = getGuarantorInvites()

    data.localGuarantorInvites = data.localGuarantorInvites.filter(
      (invite) => invite.id !== body.inviteId
    )
    data.internationalGuarantorInvites =
      data.internationalGuarantorInvites.filter(
        (invite) => invite.id !== body.inviteId
      )

    writeObject(GUARANTOR_INVITES_KEY, data)

    return HttpResponse.json({ message: "Guarantor invitation rescinded" })
  }),

  // Social linking — options + the primary user id used to link accounts.
  http.get("/patients/link-social-options", () =>
    HttpResponse.json({ options: linkSocialOptionsSeed.options })
  ),
  http.get("/patients/social-linking-details", () =>
    HttpResponse.json({ userId: linkSocialOptionsSeed.userId })
  ),

  http.post("/patients/link-social", async () =>
    HttpResponse.json({ message: "Social account linked successfully" })
  ),
  http.post("/patients/link-social-account", async () =>
    HttpResponse.json({ message: "Social account linked successfully" })
  ),

  // Care profile steps — each just needs success.
  http.post("/patients/submit-insurance-providers", async () =>
    HttpResponse.json({ message: "Insurance providers saved" })
  ),
  http.post("/patients/submit-favorite-care-providers", async () =>
    HttpResponse.json({ message: "Preferred care providers saved" })
  ),
  http.post("/patients/submit-focus-areas", async () =>
    HttpResponse.json({ message: "Health priorities saved" })
  ),
  http.post("/patients/ncd-status", async () =>
    HttpResponse.json({ message: "Health status saved" })
  ),
]

function getIdVerificationDetails() {
  return readObject("id-verification-details", idVerificationDetailsSeed)
}
