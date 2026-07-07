import { ChevronRight, type LucideIcon } from "lucide-react"
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemActions,
} from "@/components/Item"

interface MemberActionTileProps {
  icon: LucideIcon
  label: string
  onClick: () => void
}

export function MemberActionTile({
  icon: Icon,
  label,
  onClick,
}: MemberActionTileProps) {
  return (
    <Item asChild variant="muted">
      <button type="button" onClick={onClick}>
        <ItemMedia className="text-muted-foreground">
          <Icon className="h-5 w-5" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{label}</ItemTitle>
        </ItemContent>
        <ItemActions>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </ItemActions>
      </button>
    </Item>
  )
}
