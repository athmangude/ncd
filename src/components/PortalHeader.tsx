import logoIcon from "@/assets/icons/logo.svg"

export default function PortalHeader() {
  return (
    <div className=" absolute left-0 top-0 w-full hidden md:block pl-6 py-6 border-b">
      <img src={logoIcon} className="h-8 w-auto" />
    </div>
  )
}
