import { Button } from "@/components/Button"
import { Mic, QrCode } from "lucide-react"
import { useNavigate } from "react-router-dom"
import supportIcon from "@/assets/icons/support.png"

interface InviteCardProps {
  onInviteClick: () => void
}

export function InviteCard({ onInviteClick }: InviteCardProps) {
  const navigate = useNavigate()

  return (
    <div className="bg-purple-50 rounded-xl p-5 border border-purple-200 mt-10 sm:mt-0 ">
      <div className="flex gap-4 items-start mb-4">
        <img
          src={supportIcon}
          alt="Network Circle Icon"
          className="w-12 h-12 object-contain"
        />
        <div>
          <h3 className="text-foreground">Invite in a special way</h3>
          <p className="text-muted-foreground text-sm">For those that you care about</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <Button 
          className="bg-purple-100 text-purple-700 hover:bg-purple-200 flex items-center justify-center gap-2 h-12"
          onClick={onInviteClick}
        >
          <Mic className="w-4 h-4 shrink-0" /> Text/Voice
        </Button>
        <Button 
          className="bg-purple-100 text-purple-700 hover:bg-purple-200 flex items-center justify-center gap-2 h-12"
          onClick={() => navigate("/patients/scan-qr-intro")}
        >
          <QrCode className="w-4 h-4" /> Qr code
        </Button>
      </div>
    </div>
  )
}
