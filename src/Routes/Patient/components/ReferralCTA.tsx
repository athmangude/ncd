import { InfoLink } from "./InfoLink"
import share from "@/assets/icons/share.png"

export default function ReferralCTA() {
  return (
    <InfoLink
      href="/patients/network"
      icon={share}
      title={`Someone you love might need this`}
      description="Share Jireh now"
      variant="emphasized"
    />
  )
}
