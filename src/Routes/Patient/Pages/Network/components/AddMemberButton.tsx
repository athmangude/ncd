import { Button } from "@/components/Button"

interface AddMemberButtonProps {
  hasBottomNav: boolean
  isAllFull: boolean
  onAddClick: () => void
}

export function AddMemberButton({ hasBottomNav, isAllFull, onAddClick }: AddMemberButtonProps) {
  return (
    <>
      {/* Spacer to prevent fixed button from hiding content */}
      <div className={hasBottomNav ? "h-44" : "h-24"} />

      <div className={`fixed left-0 right-0 p-4 z-50 bg-white ${hasBottomNav ? "bottom-20" : "bottom-0"}`}>
        <div className="max-w-md mx-auto w-full">
          <Button
            className="w-full"
            onClick={onAddClick}
            disabled={isAllFull}
          >
            {isAllFull ? "Max circle size reached" : "Add New member"}
          </Button>
        </div>
      </div>
    </>
  )
}
