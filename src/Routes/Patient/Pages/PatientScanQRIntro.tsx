import { usePatientAuthStore } from "../stores/patientAuthStore"
import qrPlaceHolder from "@/assets/icons/qrPlaceHolder.png"
import qrIllustration from "@/assets/icons/invite-qr-code.png"
import { useEffect, useState } from "react"
import axios from "axios"
import { useToast } from "@/hooks/useToast"
import LoadingPage from "@/Routes/LoadingPage"
import PatientPageWrapper from "./PatientPageWrapper"
import { useNavigate } from "react-router-dom"
import { HeartHandshake, Dumbbell, FileCheck2 } from "lucide-react"
import {
  Item,
  ItemGroup,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
} from "@/components/Item"

const QR_ILLUSTRATION_CLASS = "object-contain w-[124px] h-[84px]"

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
    <PatientPageWrapper
      variant="content"
      barTitle="Invite by QR code"
      onBack={() => navigate(-1)}
      footer={null}
      showStepper={false}
      headerIcon={
        <img src={qrIllustration} alt="" className={QR_ILLUSTRATION_CLASS} />
      }
      pageTitle={`Scan this QR code\nto join ${firstName}'s Circle`}
      className="flex flex-col items-center"
    >
      <div className="flex flex-col items-center gap-6 w-full">
        {/* QR code frame */}
        <div className="relative size-[200px] rounded-2xl bg-muted overflow-hidden">
          <img
            src={qrCodeUrl || qrPlaceHolder}
            alt="QR Code"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[180px] object-cover mix-blend-multiply"
          />
        </div>

        {/* Benefits */}
        <div className="flex flex-col gap-2 w-full">
          <p className="px-2 text-xs font-medium text-muted-foreground">
            Benefits:
          </p>
          <ItemGroup className="gap-1">
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
          </ItemGroup>
        </div>
      </div>
    </PatientPageWrapper>
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
    <Item size="sm">
      <ItemMedia>{icon}</ItemMedia>
      <ItemContent>
        <ItemTitle>{title}</ItemTitle>
        <ItemDescription>{body}</ItemDescription>
      </ItemContent>
    </Item>
  )
}
