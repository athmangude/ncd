"use client"

import * as React from "react"
import * as MenuPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

/**
 * @deprecated Near-duplicate of `Popover` (same Radix Popover underneath,
 * differs only in default width). Its one remaining caller (`PushSettings.tsx`)
 * is scheduled to migrate to `Popover` directly. Do not adopt this in new
 * code — use `Popover`/`PopoverContent`/`PopoverTrigger` from
 * `@/components/Popover`. Scheduled for deletion once that migration lands
 * (see `~/.claude/plans/modal-drawer-sheet-audit-and-standardization.md`,
 * §3.1 / §4 Phase 8).
 */
const Menu = MenuPrimitive.Root

const MenuTrigger = MenuPrimitive.Trigger

const MenuClose = MenuPrimitive.Close

const MenuContent = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <MenuPrimitive.Portal>
    <MenuPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </MenuPrimitive.Portal>
))
MenuContent.displayName = MenuPrimitive.Content.displayName

export { Menu, MenuTrigger, MenuContent, MenuClose }
