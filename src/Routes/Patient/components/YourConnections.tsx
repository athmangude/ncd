import { usePatientAuthStore } from "../stores/patientAuthStore"
import ReferralCTA from "./ReferralCTA"
import PatientDashboardSection from "./PatientDashboardSection"

export default function YourConnections() {
  const { network } = usePatientAuthStore((state: any) => state.user) || {}

  return (
    <PatientDashboardSection
      title="Your Circle"
      link={{ href: "/patients/network", text: "See all" }}
      className="mt-5"
    >
      <div className="flex flex-col gap-5 pb-5">
        {network.length > 0 ? (
          <Connections network={network} />
        ) : (
          <ReferralCTA />
        )}
      </div>
    </PatientDashboardSection>
  )
}

function Connections({ network }: { network: any[] }) {
  return (
    <div className="flex flex-col gap-5">
      <ul className="overflow-x-auto flex gap-3">
        {network.map((n: any) => (
          <Connection
            key={n.id}
            firstName={n.firstName}
            lastName={n.lastName}
            photo={n.photo}
          />
        ))}
      </ul>
    </div>
  )
}

function Connection({
  firstName,
  lastName,
  photo,
}: {
  firstName: string
  lastName: string
  photo: string
}) {
  return (
    <li className="flex flex-col justify-center items-center text-center p-2 w-28 border rounded-xl shadow-sm text-sm font-medium capitalize text-neutral-500">
      {photo ? (
        <img
          src={`data:image/jpeg;base64,${photo}`}
          alt={`${firstName} ${lastName}`}
          className="h-14 w-14 rounded-full object-cover mb-3 border"
        />
      ) : (
        <div
          className="h-14 w-14 rounded-full bg-neutral-200 grid mb-3 place-content-center text-xl"
          aria-hidden="true"
        >
          {firstName[0]}
        </div>
      )}

      <p>{firstName?.toLocaleLowerCase()}</p>
      <p>{lastName?.toLocaleLowerCase()}</p>
    </li>
  )
}
