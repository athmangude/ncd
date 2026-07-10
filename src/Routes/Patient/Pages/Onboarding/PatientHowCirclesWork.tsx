import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Info, Phone, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/Button"
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemActions,
} from "@/components/Item"
import { SectionTitle } from "@/components/SectionTitle"
import PatientPageWrapper from "../PatientPageWrapper"
import { trackEvent, EVENTS } from "@/analytics"
import giftBox from "@/assets/icons/gift-box.png"
import cash from "@/assets/icons/cash.png"
import reward from "@/assets/icons/reward.png"
import checkDisc from "@/assets/icons/check-disc.png"
import verifiedTile from "@/assets/icons/verified-tile.png"
import healthUser from "@/assets/icons/health-user.png"

// Illustration assets from Figma design — replace with hosted assets before shipping
const imgIdVerified =
  "https://www.figma.com/api/mcp/asset/5b6e5276-86c0-4c91-a117-130c0a5073d8"
const imgSendText =
  "https://www.figma.com/api/mcp/asset/76e31510-3c7f-476a-9c3d-6288eee0a718"
const imgScanQR =
  "https://www.figma.com/api/mcp/asset/323e0d12-b9d5-4ef0-ab05-5305d0426437"
const imgVoiceNote =
  "https://www.figma.com/api/mcp/asset/b291c8a1-aa9b-4a54-aabd-90b7d9efc1ac"

type LocationState = {
  source?: string
  returnPath?: string
  [key: string]: unknown
}

type FeatureCardProps = {
  icon: string
  iconPosition?: "top" | "bottom"
  title: string
  description?: string
}

function FeatureCard({
  icon,
  iconPosition = "bottom",
  title,
  description,
}: FeatureCardProps) {
  return (
    <div className="flex h-[220px] w-[200px] flex-shrink-0 snap-start flex-col justify-between rounded-lg bg-muted p-4">
      {iconPosition === "top" && (
        <img
          src={icon}
          alt=""
          aria-hidden="true"
          className="h-14 w-14 object-contain"
        />
      )}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium leading-5 text-foreground">{title}</p>
        {description && (
          <p className="text-sm leading-5 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {iconPosition === "bottom" && (
        <img
          src={icon}
          alt=""
          aria-hidden="true"
          className="h-14 w-14 object-contain"
        />
      )}
    </div>
  )
}

type MemberCardProps = {
  icon: string
  title: string
  subtitle?: string
  iconPosition?: "top" | "bottom"
}

function MemberCard({
  icon,
  title,
  subtitle,
  iconPosition = "bottom",
}: MemberCardProps) {
  return (
    <div className="flex h-[160px] w-[160px] flex-shrink-0 snap-start flex-col justify-between rounded-lg bg-muted p-4">
      {iconPosition === "top" && (
        <img
          src={icon}
          alt=""
          aria-hidden="true"
          className="h-14 w-14 object-contain"
        />
      )}
      <div className="flex flex-col">
        <p className="text-sm font-medium leading-5 text-foreground">{title}</p>
        {subtitle && (
          <p className="text-sm leading-5 text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {iconPosition === "bottom" && (
        <img
          src={icon}
          alt=""
          aria-hidden="true"
          className="h-14 w-14 object-contain"
        />
      )}
    </div>
  )
}

type InviteCardProps = {
  illustration: string
  illustrationPosition?: "top" | "bottom"
  title: string
  imgClassName?: string
}

function InviteCard({
  illustration,
  illustrationPosition = "bottom",
  title,
  imgClassName = "h-[84px] w-24 object-contain",
}: InviteCardProps) {
  return (
    <div className="flex h-[160px] w-[160px] flex-shrink-0 snap-start flex-col justify-between rounded-lg bg-muted p-4">
      {illustrationPosition === "top" && (
        <img
          src={illustration}
          alt=""
          aria-hidden="true"
          className={imgClassName}
        />
      )}
      <p className="text-sm font-medium leading-5 text-foreground">{title}</p>
      {illustrationPosition === "bottom" && (
        <img
          src={illustration}
          alt=""
          aria-hidden="true"
          className={imgClassName}
        />
      )}
    </div>
  )
}

export default function PatientHowCirclesWork() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state || {}) as LocationState

  useEffect(() => {
    trackEvent(EVENTS.CIRCLE.HOW_IT_WORKS_VIEW)
  }, [])

  const handleContinue = () => {
    trackEvent(EVENTS.CIRCLE.HOW_IT_WORKS_CTA_TAP)
    navigate("/patients/network/invite-method", { state })
  }

  const handleCallSupport = () => {
    trackEvent(EVENTS.CIRCLE.HOW_IT_WORKS_CALL_SUPPORT_TAP)
    window.location.href = "tel:+254117118511"
  }

  return (
    <PatientPageWrapper
      title="How Circles work"
      onBack={() => navigate(-1)}
      footer={
        <div className="flex w-full flex-col gap-2 border-t border-border bg-card px-4 pb-4 pt-3">
          <Button className="w-full" onClick={handleContinue}>
            I understand — set up my Circle
          </Button>
          <p className="text-center text-sm leading-5 text-muted-foreground">
            Children and dependents can join as junior members. They do not
            count toward your qualifying 2 adults.
          </p>
        </div>
      }
      bodyPadding="none"
      className="p-0"
    >
      <div className="flex flex-col gap-6 px-4 py-4">
        {/* What you get */}
        <section className="flex flex-col gap-2">
          <div className="flex flex-col">
            <SectionTitle>What you get</SectionTitle>
            <p className="text-sm leading-5 text-muted-foreground">
              Your Circle is your financial support group.
            </p>
          </div>
          <div className="flex min-h-8 items-center py-[5.5px]">
            <SectionTitle level={3} className="whitespace-nowrap">
              With a complete Circle, you can:
            </SectionTitle>
          </div>
          <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-2 [&::-webkit-scrollbar]:hidden">
            <FeatureCard
              icon={giftBox}
              iconPosition="bottom"
              title="Share your cashback"
              description="If someone in your Circle needs help, send your cashback balance directly to them."
            />
            <FeatureCard
              icon={imgIdVerified}
              iconPosition="top"
              title="Be ready before an emergency hits"
              description="With a Circle ready, you can take a loan in minutes, not days."
            />
            <FeatureCard
              icon={cash}
              iconPosition="bottom"
              title="Unlock up to KES 6,000 to use Lipa Later"
              description="A confirmed Circle unlocks your medical loans."
            />
            <FeatureCard
              icon={reward}
              iconPosition="top"
              title="Share cashback when members repay on time"
            />
          </div>
        </section>

        {/* Who to add */}
        <section className="flex flex-col gap-2">
          <div className="flex flex-col">
            <SectionTitle>Who to add</SectionTitle>
            <p className="text-sm leading-5 text-muted-foreground">
              Add people you trust and who know your finances.
            </p>
          </div>
          <div className="flex min-h-8 items-center py-[5.5px]">
            <SectionTitle level={3} className="whitespace-nowrap">
              Good Circle members:
            </SectionTitle>
          </div>
          <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-2 [&::-webkit-scrollbar]:hidden">
            <MemberCard
              icon={checkDisc}
              iconPosition="bottom"
              title="Are likely to repay their loans on time"
            />
            <MemberCard
              icon={verifiedTile}
              iconPosition="top"
              title="Have their own Jireh account"
            />
            <MemberCard
              icon={healthUser}
              iconPosition="bottom"
              title="Are adults"
              subtitle="(18 years or over)"
            />
          </div>
          <p className="text-sm leading-5 text-foreground">
            You can add younger family members too. They share cashback but
            cannot unlock loans. We call these{" "}
            <span className="font-bold">Junior slots.</span>
          </p>
        </section>

        {/* The shared risk */}
        <section className="flex flex-col gap-2">
          <div className="flex flex-col">
            <SectionTitle>The shared risk — important</SectionTitle>
            <p className="text-sm leading-5 text-muted-foreground">
              This is the part you must understand before you invite anyone.
            </p>
          </div>
          <div className="flex gap-2 items-start rounded-md bg-accent px-2 py-[6px]">
            <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
              <Info className="h-4 w-4 text-foreground" />
            </div>
            <div className="flex flex-1 flex-col gap-3 text-sm">
              <p className="leading-5 text-foreground">
                Only invite people you trust to repay.
              </p>
              <div className="flex flex-col gap-3 text-muted-foreground">
                <p className="leading-5">
                  If any member of your Circle stops repaying their loan, your
                  loan access will be paused.
                </p>
                <p className="leading-5">
                  This applies to every member, including you.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How to add someone */}
        <section className="flex flex-col gap-2">
          <div className="flex flex-col">
            <SectionTitle>How to add someone</SectionTitle>
            <p className="text-sm leading-5 text-muted-foreground">
              Tap &lsquo;Add member&rsquo; and choose how to invite them:
            </p>
          </div>
          <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-2 [&::-webkit-scrollbar]:hidden">
            <InviteCard
              illustration={imgSendText}
              illustrationPosition="bottom"
              title="Send a text"
              imgClassName="h-[84px] w-24 object-contain"
            />
            <InviteCard
              illustration={imgScanQR}
              illustrationPosition="top"
              title="Scan a QR code"
              imgClassName="h-[84px] w-[124px] object-contain"
            />
            <InviteCard
              illustration={imgVoiceNote}
              illustrationPosition="bottom"
              title="Send a voice note"
              imgClassName="h-[84px] w-[84px] object-contain"
            />
          </div>
          <p className="text-sm font-medium leading-5 text-foreground">
            They will receive an invitation. Once they accept, their slot turns
            green.
          </p>

          {/* Avatar status chain */}
          <div className="flex flex-col gap-3 rounded-lg bg-muted p-4">
            <div className="flex items-start justify-start gap-4">
              {/* Empty / add slot */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-primary/30 bg-secondary">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="mt-[14px] text-muted-foreground">→</div>
              {/* Waiting member */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-warning-solid bg-card text-base font-medium text-foreground">
                    FL
                  </div>
                  <div className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-warning-solid" />
                </div>
                <div className="rounded-md bg-warning px-2 py-[3px]">
                  <span className="text-xs font-semibold leading-4 text-warning-foreground">
                    Waiting...
                  </span>
                </div>
              </div>
              <div className="mt-[14px] text-muted-foreground">→</div>
              {/* Accepted member */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-success-solid bg-card text-base font-medium text-foreground">
                    FL
                  </div>
                  <div className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-success-solid" />
                </div>
                <div className="rounded-md bg-success px-2 py-[3px]">
                  <span className="text-xs font-semibold leading-4 text-success-foreground">
                    Accepted!
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 items-start rounded-md bg-card px-2 py-[6px]">
              <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
                <Info className="h-4 w-4 text-foreground" />
              </div>
              <p className="flex-1 text-sm leading-5 text-foreground">
                Your Circle is ready when 2 people have accepted your invite.
              </p>
            </div>
          </div>
        </section>

        {/* Need more help */}
        <section className="flex flex-col gap-3 rounded-lg border border-border bg-muted px-4 pb-4 pt-3">
          <div className="flex flex-col text-sm">
            <p className="font-medium leading-5 text-foreground">
              Need more help?
            </p>
            <p className="leading-5 text-muted-foreground">
              Contact our support team
            </p>
          </div>
          <Item asChild size="sm" className="bg-card">
            <button type="button" onClick={handleCallSupport}>
              <ItemMedia>
                <Phone className="h-4 w-4 text-foreground" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle className="text-foreground">
                  Call Jireh Support
                </ItemTitle>
              </ItemContent>
              <ItemActions>
                <ChevronRight className="h-4 w-4 text-foreground" />
              </ItemActions>
            </button>
          </Item>
        </section>
      </div>
    </PatientPageWrapper>
  )
}
