import { ProfileAvatar } from "@/components/ProfileAvatar"

interface DashboardHeaderProps {
  firstName: string
  lastName: string
  profilePhoto?: string
}

export function DashboardHeader({ firstName, lastName, profilePhoto }: DashboardHeaderProps) {
  const formattedFirstName = firstName 
    ? firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase() 
    : ""

  return (
    <div className="mt-8 sm:mt-0 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <ProfileAvatar
          src={profilePhoto}
          firstName={firstName}
          lastName={lastName}
          className="w-12 h-12 border border-neutral-200"
          priority={true}
        />
        <div className="flex flex-col">
          <h1 className="text-base font-bold text-neutral-900">Hello, {formattedFirstName} 👋</h1>
          <p className="text-neutral-500 text-sm">How are you feeling today?</p>
        </div>
      </div>
    </div>
  )
}
