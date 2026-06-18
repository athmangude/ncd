import { useState } from "react"
import { Button } from "@/components/Button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/Drawer"
import { Check, Download, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/useToast"

interface InstallAppDrawerProps {
  isOpen: boolean
  onClose: () => void
  onInstall: () => Promise<any> | void
  isIOS: boolean
}

export function InstallAppDrawer({
  isOpen,
  onClose,
  onInstall,
  isIOS
}: InstallAppDrawerProps) {
  const [isInstalling, setIsInstalling] = useState(false)
  const { toast } = useToast()

  const handleInstall = async () => {
    if (isIOS) {
       onClose()
       return
    }

    setIsInstalling(true)
    try {
      const result = await onInstall()
      
      if (result && typeof result === 'object' && 'outcome' in result) {
         if (result.outcome === 'accepted') {
             toast({
                 title: "App installed successfully!",
                 description: "Thanks for installing the app",
             })
             onClose()
         } else if (result.outcome === 'dismissed') {
             // User dismissed, maybe show a toast or just stay open?
             // Usually keeping it open or just resetting state is fine.
         }
      } else {
         // Fallback logic
         onClose()
      }
    } catch (error) {
      console.error("Install failed", error)
      toast({
        title: "Installation failed",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsInstalling(false)
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <div className="w-full max-w-lg mx-auto">
          <DrawerHeader>
            <DrawerTitle className="text-left text-lg">
              Install the app
            </DrawerTitle>
            <DrawerDescription className="text-left text-neutral-500">
              Add Jireh to your home screen for faster access and offline reliability—no download required.
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-6">
            <div className="space-y-4">
               <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-neutral-500" />
                  <div>
                     <p className="text-sm text-neutral-900">Use Jireh offline</p>
                  </div>
               </div>
               <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-neutral-500" />
                  <div>
                     <p className="text-sm text-neutral-900">Use less data when online</p>
                  </div>
               </div>
               <div className="flex items-start gap-3">
                 <Check className="h-5 w-5 text-neutral-500" />
                  <div>
                     <p className="text-sm text-neutral-900">Access your account 24/7</p>
                  </div>
               </div>
            </div>
          </div>

          <DrawerFooter className="gap-3 pb-8">
            {isIOS && (
               <p className="text-xs text-center text-neutral-500 mb-2">
                 Tap the share button <span className="font-bold">Share</span> then "Add to Home Screen"
               </p>
            )}
            <Button
              className="w-full"
              onClick={handleInstall}
              disabled={isInstalling}
            >
              {isInstalling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Installing...
                </>
              ) : (
                <>
                  {isIOS ? <Download className="mr-2 h-4 w-4" /> : " "}
                  {isIOS ? "I understand" : "Install"}
                </>
              )}
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
