import { Button } from "@/components/Button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/Drawer"
import { MapPin, Check, Loader2 } from "lucide-react"

interface LocationPermissionDrawerProps {
  isOpen: boolean
  onClose: () => void
  onEnable: () => void
  isLoading: boolean
}

export function LocationPermissionDrawer({
  isOpen,
  onClose,
  onEnable,
  isLoading
}: LocationPermissionDrawerProps) {
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <div className="w-full max-w-lg mx-auto">
          <DrawerHeader>
            <DrawerTitle className="text-left  text-lg">
              Find care near you
            </DrawerTitle>
            <DrawerDescription className="text-left text-neutral-500">
              Enable location to instantly see verified hospitals and pharmacies in your area.
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-neutral-500" />
                <div>
                  <p className="text-neutral-900 text-sm ">Find hospitals near you</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-neutral-500" />
                <div>
                  <p className="text-neutral-900 text-sm ">Get notified of nearby offers</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-neutral-500" />
                <div>
                <p className="text-neutral-900 text-sm ">Save your care provider preferences for your next visit</p>
                </div>
              </div>
            </div>
          </div>

          <DrawerFooter className="gap-3 pb-8">
            <Button
              className="w-full "
              onClick={onEnable}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  Use my location
                </>
              )}
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
