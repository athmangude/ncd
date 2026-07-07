import ErrorBlock from "@/components/ErrorBlock"
import { usePatientAuthStore } from "../stores/patientAuthStore"
import PatientPageWrapper from "./PatientPageWrapper"

export default function PatientMedicalConsentForm() {
  const user = usePatientAuthStore((state: any) => state.user)

  if (!user) {
    return <ErrorBlock message="Failed to load user details" />
  }

  return (
    <PatientPageWrapper title="Medical Consent Form">
      <section className="flex flex-col gap-5 max-h-[80vh] overflow-scroll">
        <h2>Patient Data Consent Form</h2>

        <p>
          I, <strong>{user.firstName + " " + user.lastName}</strong>,
          acknowledge that I have been provided with and have read Jireh
          Innovations Limited's (“Jireh”) Privacy Policy.
        </p>

        <p>I understand that:</p>

        <ul>
          <li>
            <strong>Data Collection and Use:</strong> Jireh may collect, use,
            store, and share my personal data, including sensitive medical
            information, for the purpose of providing healthcare financing
            solutions. This data may be collected directly from me or from my
            healthcare provider, with my consent, which I hereby provide.
          </li>

          <li>
            <strong>Types of Data Collected:</strong> This may include the
            following information:
          </li>

          <ul>
            <li>
              <strong>Personal Identification Data:</strong>
              <ul>
                <li>Full name</li>
                <li>Date of birth</li>
                <li>Gender</li>
                <li>National ID / Passport number</li>
                <li>
                  Contact information (Phone number, email address, physical
                  address)
                </li>
              </ul>
            </li>

            <li>
              <strong>Medical Information:</strong> Clinical data tied to
              diagnoses, treatments, and outcomes
              <ul>
                <li>
                  Historical, current, and ongoing diagnosis or medical
                  conditions
                </li>
                <li>
                  Historical, current, and planned treatments and medications
                </li>
                <li>
                  Medical procedures conducted (historical, current, and
                  future/planned)
                </li>
                <li>
                  Doctor's notes / clinical summaries (historical, current, and
                  future updates)
                </li>
                <li>Referral notes (if applicable)</li>
                <li>Test results (e.g., lab, radiology, pathology)</li>
              </ul>
            </li>

            <li>
              <strong>Treatment and Financial Data:</strong>
              <ul>
                <li>
                  Historical, current, and planned treatment plans (dates,
                  duration, expected outcomes, costs)
                </li>
                <li>Itemized invoices of medical services provided</li>
                <li>
                  Payment/cost breakdown (insurance coverage, out-of-pocket
                  costs)
                </li>
                <li>Follow-up or ongoing care requirements and schedules</li>
                <li>Discharge summaries (if applicable)</li>
              </ul>
            </li>

            <li>
              <strong>Healthcare Utilization History:</strong>
              <ul>
                <li>
                  Complete medical history summary (previous conditions,
                  surgeries, treatments, and outcomes)
                </li>
                <li>Historical and current hospital visits or consultations</li>
                <li>Planned future consultations or treatments</li>
                <li>
                  Prescribed medications history and ongoing/planned
                  prescriptions
                </li>
              </ul>
            </li>

            <li>
              <strong>Care Provider Information:</strong>
              <ul>
                <li>Name of treating physician or medical practitioner</li>
                <li>Facility name and accreditation details</li>
                <li>Facility contact details</li>
                <li>
                  Care provider notes or observations (historical, current, and
                  future updates)
                </li>
              </ul>
            </li>
          </ul>

          <li>
            <strong>Legal Rights:</strong> I have the right to access, correct,
            or delete my data, object to its processing, and request data
            portability, as provided under the Kenya Data Protection Act, 2019.
          </li>

          <li>
            <strong>Withdrawal of Consent:</strong> I may withdraw my consent at
            any time by contacting Jireh at{" "}
            <a href="mailto:dataprotection@jireh-health.com">
              dataprotection@jireh-health.com
            </a>
            . Withdrawal will not affect data processing carried out before
            consent was withdrawn.
          </li>

          <li>
            <strong>Updates to Privacy Policy:</strong> Jireh may update its
            Privacy Policy and will notify me before collecting or processing
            any additional data.
          </li>
        </ul>
      </section>
    </PatientPageWrapper>
  )
}
