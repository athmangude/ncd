import {
  CountryCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
} from "libphonenumber-js"

export function validatePhoneNumber({
  countryCode,
  phoneNumber,
}: {
  countryCode: CountryCode
  phoneNumber: string
}) {
  return isValidPhoneNumber(phoneNumber, countryCode)
}

export function validateCountryCode({
  countryCode,
  phoneNumber,
}: {
  countryCode: CountryCode
  phoneNumber: string
}) {
  const parsed = parsePhoneNumberFromString(phoneNumber, countryCode)
  return parsed?.isValid() && parsed.country === countryCode
}
