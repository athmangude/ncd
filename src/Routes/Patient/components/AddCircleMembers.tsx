import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import FormGroupInput from "@/components/form/FormGroupInput"
import FormGroupSelect from "@/components/form/FormGroupSelect"
import { validatePhoneNumber } from "@/utilities/validators"
import parsePhoneNumberFromString from "libphonenumber-js"
import { relationshipOptions } from "../Pages/Network/PatientAddConnection"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/Drawer"
import DeletableItem from "./DeletableItem"
import { Button } from "@/components/Button"
import { SectionTitle } from "@/components/SectionTitle"
import { usePatientAuthStore } from "../stores/patientAuthStore"
import { Plus } from "lucide-react"

export type AddCircleMemberInput = {
  firstName: string
  lastName: string
  relationship: string
  phoneNumber?: string
  age?: number
}

export default function AddCircleMembers({
  circleMembers,
  setCircleMembers,
}: {
  circleMembers: AddCircleMemberInput[]
  setCircleMembers: (input: any) => void
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <section className="flex flex-col gap-5 mt-5 w-full">
        <div className="flex flex-wrap gap-4 justify-center">
          {relationshipOptions.map((option) => (
            <AddButton
              key={option.value}
              label={option.name}
              onClick={() => {
                setDrawerOpen(true)
              }}
            />
          ))}
        </div>
      </section>

      <AddToCircleDrawer
        circleMembers={circleMembers}
        setCircleMembers={setCircleMembers}
        open={drawerOpen}
        setOpen={setDrawerOpen}
      />

      {circleMembers.length > 0 && (
        <>
          <SectionTitle className="mt-5">Your Circle</SectionTitle>

          <div className="grid w-full gap-2 border-y py-4">
            {circleMembers.map((member: any) => (
              <DeletableItem
                key={member.firstName + " " + member.lastName}
                title={member.firstName + " " + member.lastName}
                description={`${member.relationship}${member.phoneNumber ? ` • ${member.phoneNumber}` : ""}`}
                onDelete={() => {
                  setCircleMembers((prev: any) =>
                    prev.filter(
                      (p: any) =>
                        p.firstName !== member.firstName ||
                        p.lastName !== member.lastName
                    )
                  )
                }}
              />
            ))}
          </div>
        </>
      )}
    </>
  )
}

export function AddToCircleDrawer({
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
  } = useForm<AddCircleMemberInput>()

  const user = usePatientAuthStore((state) => state.user)

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent>
        <div className="w-full max-w-lg mx-auto">
          <DrawerHeader>
            <DrawerTitle className="text-center">
              Add connection's details
            </DrawerTitle>
            <DrawerDescription className="text-center sr-only">
              Fill in the details to add a new connection to your circle.
            </DrawerDescription>
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
                label="First Name"
                type="text"
                placeholder="Enter the first name"
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
                label="Last Name"
                type="text"
                placeholder="Enter the last name"
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

            <Controller
              name="relationship"
              control={control}
              rules={{ required: "Relationship is required" }}
              render={({ field }) => (
                <FormGroupSelect
                  id="relationship"
                  label="Relationship to you"
                  placeholder="Select relationship"
                  field={field}
                  error={errors.relationship?.message}
                  options={relationshipOptions}
                />
              )}
            />

            {watch("relationship") !== "CHILD" && (
              <FormGroupInput
                id="phoneNumber"
                label="Phone Number"
                type="phone"
                placeholder="Enter phone number"
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
                defaultValue={control._defaultValues["phoneNumber"]?.toString()}
              />
            )}

            {watch("relationship") === "CHILD" && (
              <FormGroupInput
                id="age"
                label="Age of child"
                type="text"
                placeholder="Enter age"
                register={register("age", {
                  required: {
                    value: true,
                    message: "Please enter the age of the child",
                  },
                  max: {
                    value: 17,
                    message: "Age must be less than 17",
                  },
                  min: {
                    value: 0,
                    message: "Age must be greater than 0",
                  },
                })}
                error={errors.age?.message}
              />
            )}

            <Button className="w-full" type="submit">
              Save
            </Button>

            <Button
              className="w-full"
              type="button"
              onClick={() => {
                setOpen(false)
                reset()
                control._reset()
              }}
              variant="outline"
            >
              Cancel
            </Button>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      className="bg-primary/10 rounded-full px-4 py-1"
      onClick={onClick}
      type="button"
    >
      {label}
      <Plus className="inline ml-1 w-4 h-4" />
    </button>
  )
}
