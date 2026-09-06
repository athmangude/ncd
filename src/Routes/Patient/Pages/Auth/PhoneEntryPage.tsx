import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import PatientAuthWrapper from "../../components/PatientAuthWrapper"
import PatientAuthHeadline from "../../components/PatientAuthHeadline"
import FormGroup from "@/components/form/FormGroupInput"
import { PrimaryCTAFooter } from "@/Routes/shell/footers"
import { CountryCode, parsePhoneNumber } from "libphonenumber-js"
import { validatePhoneNumber } from "@/utilities/validators"
import { useToast } from "@/hooks/useToast"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/Button"
import { User } from "lucide-react"

const DEMO_USERS = [
  {
    name: "Nancy Kamau",
    phone: "0700000001",
    description: "Diabetes & hypertension — full dashboard with circle, credit & cashback",
  },
  {
    name: "James Ochieng",
    phone: "0700000002",
    description: "Diabetes & hypertension — dual medication regimen",
  },
  {
    name: "Mary Wanjiku",
    phone: "0700000003",
    description: "Diabetes & hypertension — regular refills & lab tests",
  },
  {
    name: "Peter Mwangi",
    phone: "0700000004",
    description: "Diabetes & hypertension — cost-focused care",
  },
  {
    name: "Grace Akinyi",
    phone: "0700000005",
    description: "Diabetes only — simpler medication profile",
  },
  {
    name: "David Kimani",
    phone: "0700000006",
    description: "Diabetes only — medication reminders & education",
  },
  {
    name: "Sarah Njeri",
    phone: "0700000007",
    description: "Hypertension only — blood pressure tracking",
  },
  {
    name: "John Otieno",
    phone: "0700000008",
    description: "Hypertension only — kidney function monitoring",
  },
  {
    name: "Faith Wambui",
    phone: "0700000009",
    description: "Diabetes, hypertension & high cholesterol — complex care",
  },
  {
    name: "Michael Kiprop",
    phone: "0700000010",
    description: "Diabetes, hypertension & high cholesterol — multiple meds",
  },
  {
    name: "Agnes Chebet",
    phone: "0700000011",
    description: "Asthma & hypertension — inhaler + BP medications",
  },
]

const SHARED_PIN_INFO = { signInPin: "123456", paymentPin: "1234" }

type Inputs = {
  phoneNumber: string
  countryCode: CountryCode
}

export default function PhoneEntryPage() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: {
      countryCode: "KE",
    },
  })

  const currentCountryCode = watch("countryCode")

  const mutation = useMutation({
    mutationFn: async (data: Inputs) => {
      const parsed = parsePhoneNumber(data.phoneNumber, data.countryCode)
      const phone = parsed.number
      const phoneDisplay = parsed.formatInternational()

      const { data: exists } = await supabase.rpc("check_phone_exists", {
        phone_input: phone,
      })

      if (exists) {
        navigate("/patients/auth/pin", { state: { phone, phoneDisplay } })
      } else {
        navigate("/patients/auth/create-account", {
          state: { phone, phoneDisplay },
        })
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  return (
    <PatientAuthWrapper
      footer={
        <PrimaryCTAFooter
          label="Continue"
          form="supabase-phone-entry"
          type="submit"
          disabled={mutation.isPending}
          isLoading={mutation.isPending}
        />
      }
    >
      <form
        id="supabase-phone-entry"
        className="flex flex-col gap-7"
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
      >
        <PatientAuthHeadline text="Please type in your phone number" />

        <input type="hidden" {...register("countryCode")} />

        <FormGroup
          id="phoneNumber"
          label="Phone Number"
          type="phone"
          placeholder="Enter your phone number"
          register={register("phoneNumber", {
            required: {
              value: true,
              message: "Please enter your phone number",
            },
            validate: (value) => {
              if (
                !validatePhoneNumber({
                  countryCode: watch("countryCode"),
                  phoneNumber: value,
                })
              ) {
                return "Please enter a valid phone number"
              }
              return true
            },
          })}
          error={errors.phoneNumber?.message}
          countryCode={currentCountryCode}
          onCountryCodeChange={(code) => setValue("countryCode", code)}
          isDevMode={
            import.meta.env.DEV ||
            import.meta.env.VITE_NODE_ENV === "development"
          }
        />
      </form>

      <div className="flex flex-col gap-3 mt-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Demo accounts
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs bg-muted/50 rounded-lg px-3 py-2">
          <div>
            <span className="text-muted-foreground">Sign-in PIN</span>
            <p className="font-mono font-medium">
              {SHARED_PIN_INFO.signInPin}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Payment PIN</span>
            <p className="font-mono font-medium">
              {SHARED_PIN_INFO.paymentPin}
            </p>
          </div>
        </div>
        <div className="-mx-4 px-4 flex gap-2 overflow-x-auto snap-x snap-mandatory no-scrollbar">
          {DEMO_USERS.map((user) => (
            <button
              key={user.phone}
              type="button"
              className="snap-start shrink-0 w-52 border rounded-xl p-3 flex flex-col gap-2 text-left"
              onClick={() => {
                setValue("phoneNumber", user.phone)
                mutation.mutate({
                  phoneNumber: user.phone,
                  countryCode: "KE",
                })
              }}
            >
              <div className="flex items-center gap-2">
                <div className="shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-secondary-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.phone}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {user.description}
              </p>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Or enter any phone number above to create your own profile.
        </p>
      </div>
    </PatientAuthWrapper>
  )
}
