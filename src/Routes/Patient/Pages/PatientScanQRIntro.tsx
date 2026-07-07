import { usePatientAuthStore } from "../stores/patientAuthStore"
import qrPlaceHolder from "@/assets/icons/qrPlaceHolder.png"
import qrIllustration from "@/assets/icons/invite-qr-code.png"
import { useEffect, useState } from "react"
import axios from "axios"
import { useToast } from "@/hooks/useToast"
import LoadingPage from "@/Routes/LoadingPage"
import MobileWrapper, { BackTitleHeader } from "@/Routes/MobileWrapper"
import { useNavigate } from "react-router-dom"
import { HeartHandshake, Dumbbell, FileCheck2 } from "lucide-react"

export default function PatientScanQRIntro() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const user = usePatientAuthStore((state: any) => state.user) || {}
  const firstName = user.firstName || "John"

  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const generateQR = async () => {
      try {
        setLoading(true)
        const response = await axios.post(
          `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/circles/invites/qr/generate`
        )
        setQrCodeUrl(response.data.qrCodeUrl)
      } catch (error: any) {
        toast({
          title: "Error",
          description:
            error.response?.data?.message || "Failed to generate QR code",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    generateQR()
    // Mount-only QR generation; toast is captured via closure for any one-shot error.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return <LoadingPage />
  }

  return (
    <MobileWrapper
      header={
        <BackTitleHeader title="Invite by QR code" onBack={() => navigate(-1)} />
      }
      footer={null}
      className="flex flex-col items-center"
    >
      <div className="flex flex-col items-center gap-6 w-full">
        {/* Header: illustration + title */}
        <div className="flex flex-col items-center gap-2 w-full">
          <img
            src={qrIllustration}
            alt=""
            className="object-contain"
            style={{ width: 124, height: 84 }}
          />
          <h1 className="leading-[1.25] text-center">
            Scan this QR code
            <br />
            to join {firstName}&apos;s Circle
          </h1>
        </div>

        {/* QR code frame */}
        <div className="relative size-[200px] rounded-2xl bg-muted overflow-hidden">
          <img
            src={qrCodeUrl || qrPlaceHolder}
            alt="QR Code"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[180px] object-cover mix-blend-multiply"
          />
        </div>

        {/* Benefits */}
        <div className="flex flex-col w-full">
          <div className="px-2 py-1.5">
            <p className="text-xs font-medium text-muted-foreground">Benefits:</p>
          </div>
          <div className="flex flex-col gap-1">
            <BenefitItem
              icon={<HeartHandshake className="w-4 h-4 text-foreground" />}
              title="Share your cashback"
              body="If someone in your Circle needs help, send your cashback balance directly to them."
            />
            <BenefitItem
              icon={<Dumbbell className="w-4 h-4 text-foreground" />}
              title="Ready before an emergency hits"
              body="With a Circle ready, you can borrow in minutes, not days."
            />
            <BenefitItem
              icon={<FileCheck2 className="w-4 h-4 text-foreground" />}
              title="Borrow when you need it"
              body="A confirmed Circle unlocks your loan."
            />
          </div>
        </div>
      </div>
    </MobileWrapper>
  )
}

function BenefitItem({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <div className="flex items-start gap-2 px-2 py-1.5 rounded-md">
      <div className="flex items-center justify-center shrink-0 size-5">
        {icon}
      </div>
      <div className="flex flex-col flex-1 min-w-0 leading-5">
        <p className="text-sm text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  )
}
