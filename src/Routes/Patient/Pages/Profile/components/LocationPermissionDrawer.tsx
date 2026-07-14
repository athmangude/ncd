import { Button } from "@/components/Button"
import {
  Drawer,
  DrawerClose,
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
  isLoading,
}: LocationPermissionDrawerProps) {
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Find care near you</DrawerTitle>
          <DrawerDescription>
            Enable location to instantly see verified hospitals and pharmacies
            in your area.
          </DrawerDescription>
        </DrawerHeader>

        <div className="py-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-foreground text-sm ">
                  Find hospitals near you
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-foreground text-sm ">
                  Get notified of nearby offers
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-foreground text-sm ">
                  Save your care provider preferences for your next visit
                </p>
              </div>
            </div>
          </div>
        </div>

        <DrawerFooter className="gap-3">
          <Button className="w-full " onClick={onEnable} disabled={isLoading}>
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
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              Not now
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
