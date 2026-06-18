const prefix = "/patients/network"

export const CIRCLE_INVITE_SMS_STEPS = [
  `${prefix}/add-circle-member`,
  `${prefix}/invite-text`,
  `${prefix}/check-profile-photo`,
  `${prefix}/preview-invite`,
]

export const CIRCLE_INVITE_VOICE_STEPS = [
  `${prefix}/add-circle-member`,
  `${prefix}/invite-voice`,
  `${prefix}/check-profile-photo`,
  `${prefix}/preview-invite`,
]
