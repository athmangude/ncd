import { Controller, useForm } from "react-hook-form"
import FormGroupInput from "@/components/form/FormGroupInput"
import FormGroupSelect from "@/components/form/FormGroupSelect"
import { validatePhoneNumber } from "@/utilities/validators"
import parsePhoneNumberFromString from "libphonenumber-js"
import { relationshipOptions } from "../Network/PatientAddConnection"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/Drawer"
import { Button } from "@/components/Button"
import { usePatientAuthStore } from "../../stores/patientAuthStore"
import { AddCircleMemberInput } from "../../components/AddCircleMembers"
import { Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { trackEvent, EVENTS } from "@/analytics"

export function AddToCircleDrawerKYC({
  circleMembers,
  setCircleMembers,
  open,
  setOpen,
}: {
  circleMembers: AddCircleMemberInput[]
  setCircleMembers: React.Dispatch<React.SetStateAction<AddCircleMemberInput[]>>
  open: boolean
  setOpen: (open: boolean) => void
}) {
  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<AddCircleMemberInput & { nickname?: string }>({
    defaultValues: {
      phoneNumber: "254",
    },
  })

  const user = usePatientAuthStore((state) => state.user)

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent>
        <div className="w-full max-w-lg mx-auto">
          <DrawerHeader>
            <div className="flex flex-col items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <DrawerTitle className="text-center">
                Add member details
              </DrawerTitle>
              <DrawerDescription className="text-center">
                Add 2 adult members to access loans.
              </DrawerDescription>
            </div>
          </DrawerHeader>
          <form
            className="flex flex-col gap-5 p-4"
            onSubmit={handleSubmit((data) => {
              const existingMember = circleMembers.find(
                (member) =>
                  member.firstName === data.firstName &&
                  member.lastName === data.lastName
              )

              if (!existingMember) {
                try {
                  trackEvent(EVENTS.KYC.ADD_CIRCLE_MEMBERS_ADD, {
                    relationship: data.relationship,
                  })
                } catch {
                  // Silent fail
                }
                setCircleMembers((prev) => [...prev, data])
              }

              reset()
              control._reset()
              setOpen(false)
            })}
          >
            <div className="grid grid-cols-2 gap-2">
              <FormGroupInput
                id="firstName"
                label="First name"
                type="text"
                placeholder="Firstname"
                register={register("firstName", {
                  required: {
                    value: true,
                    message: "Please enter the first name",
                  },
                  minLength: {
                    value: 2,
                    message: "First name must be at least 2 characters",
                  },
                })}
                error={errors.firstName?.message}
                defaultValue={control._defaultValues["firstName"]?.toString()}
              />

              <FormGroupInput
                id="lastName"
                label="Last name"
                type="text"
                placeholder="Lastname"
                register={register("lastName", {
                  required: {
                    value: true,
                    message: "Please enter the last name",
                  },
                  minLength: {
                    value: 2,
                    message: "Last name must be at least 2 characters",
                  },
                })}
                error={errors.lastName?.message}
                defaultValue={control._defaultValues["lastName"]?.toString()}
              />
            </div>

            <FormGroupInput
              id="phoneNumber"
              label="Phone number"
              type="phone"
              placeholder="254"
              register={register("phoneNumber", {
                required: {
                  value: true,
                  message: "Please enter your phone number",
                },
                validate: (value) => {
                  if (
                    !validatePhoneNumber({
                      countryCode: "KE",
                      phoneNumber: value || "",
                    })
                  ) {
                    return "Please enter a valid phone number"
                  }

                  //parse the phone number to ensure it is a valid number
                  const parsed = parsePhoneNumberFromString(value || "", "KE")

                  if (parsed?.number === user.phoneNumber) {
                    return "You cannot add yourself to your circle. Use a different phone number."
                  }

                  return true
                },
              })}
              error={errors.phoneNumber?.message}
              defaultValue={
                control._defaultValues["phoneNumber"]?.toString() || "254"
              }
            />

            <Controller
              name="relationship"
              control={control}
              rules={{ required: "Relationship is required" }}
              render={({ field }) => (
                <FormGroupSelect
                  id="relationship"
                  label="Relationship to you"
                  placeholder="Select an item"
                  field={field}
                  error={errors.relationship?.message}
                  options={relationshipOptions.filter(
                    (opt) => opt.value !== "CHILD"
                  )}
                />
              )}
            />

            <FormGroupInput
              id="nickname"
              label="Nickname (optional)"
              type="text"
              placeholder="e.g. Msee wa mayai"
              register={register("nickname" as any)}
              error={(errors as any).nickname?.message}
              defaultValue={(
                control._defaultValues as any
              )?.nickname?.toString()}
            />

            <Button
              className={cn(
                "w-full",
                watch("firstName") &&
                  watch("lastName") &&
                  watch("relationship") &&
                  watch("phoneNumber")
                  ? "bg-primary hover:bg-primary/90 text-white"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
              type="submit"
              disabled={
                !watch("firstName") ||
                !watch("lastName") ||
                !watch("relationship") ||
                !watch("phoneNumber")
              }
            >
              Save
            </Button>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
