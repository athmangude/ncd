import { TabsTrigger } from "@/components/Tabs"

interface PatientTabTriggerProps {
  value: string
  icon: React.ReactNode
  setRef: (el: HTMLButtonElement | null) => void
}

export function PatientTabTrigger({ value, icon, setRef }: PatientTabTriggerProps) {
  return (
    <TabsTrigger
      ref={setRef}
      value={value}
      className="group flex flex-col data-[state=active]:bg-transparent data-[state=active]:text-bubblegum-400 capitalize px-1 sm:px-3 text-xs sm:text-sm z-30 ring-offset-transparent focus-visible:ring-0 
      data-[state=active]:shadow-none 
      data-[state=active]:border-none"
    >
      <div
        className="
              relative
              px-2 sm:px-3 py-1 rounded-full mb-1
              transition-transform duration-1000 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]
              group-data-[state=active]:-translate-y-[10px]
              group-data-[state=active]:text-primary
              text-muted-foreground
              group-data-[state=active]:bg-transparent
        "
      >
        {icon}
      </div>
      <span className="transition-opacity duration-300 group-data-[state=active]:opacity-100 opacity-70">
        {value}
      </span>
    </TabsTrigger>
  )
}
