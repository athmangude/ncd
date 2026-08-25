import { Label } from "@/components/Label"
import FormGroupWrapper from "@/components/form/FormGroupWrapper"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select"
import IntakeOption from "../components/IntakeOption"
import type { CareCompanionProfile } from "@/types/care-companion"

type UserRoleData = CareCompanionProfile["userRole"]
type RoleValue = UserRoleData["role"]
type RelationshipValue = NonNullable<UserRoleData["patientRelationship"]>

interface UserRoleStepProps {
  data: UserRoleData
  onUpdate: (data: UserRoleData) => void
}

const ROLE_OPTIONS: { value: RoleValue; label: string; description: string }[] =
  [
    {
      value: "SELF",
      label: "I am the patient",
      description: "I am managing my own health condition",
    },
    {
      value: "CAREGIVER",
      label: "I am caring for someone else",
      description: "I help manage a family member's health",
    },
    {
      value: "BOTH",
      label: "Both",
      description:
        "I have a condition and I care for someone who does too",
    },
  ]

const RELATIONSHIP_OPTIONS: {
  value: RelationshipValue
  label: string
}[] = [
  { value: "SPOUSE", label: "Spouse" },
  { value: "PARENT", label: "Parent" },
  { value: "CHILD", label: "Child" },
  { value: "SIBLING", label: "Sibling" },
  { value: "OTHER", label: "Other" },
]

export default function UserRoleStep({
  data,
  onUpdate,
}: UserRoleStepProps) {
  function setRole(role: RoleValue) {
    const needsRelationship = role === "CAREGIVER" || role === "BOTH"
    onUpdate({
      role,
      patientRelationship: needsRelationship
        ? data.patientRelationship
        : null,
    })
  }

  function setRelationship(value: string) {
    onUpdate({
      ...data,
      patientRelationship: value as RelationshipValue,
    })
  }

  const showRelationship =
    data.role === "CAREGIVER" || data.role === "BOTH"

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 >
          Who is this for?
        </h2>
        <p className="text-sm text-muted-foreground">
          Are you managing this condition yourself, or caring for someone
          else?
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="User role"
        className="flex flex-col gap-3"
      >
        {ROLE_OPTIONS.map(({ value, label, description }) => (
          <IntakeOption
            key={value}
            label={label}
            description={description}
            selected={data.role === value}
            onToggle={() => setRole(value)}
            mode="radio"
            value={value}
          />
        ))}
      </div>

      {showRelationship && (
        <FormGroupWrapper>
          <Label htmlFor="patient-relationship">
            What is your relationship to the patient?
          </Label>
          <Select
            value={data.patientRelationship ?? ""}
            onValueChange={setRelationship}
          >
            <SelectTrigger id="patient-relationship" className="w-full">
              <SelectValue placeholder="Select relationship" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {RELATIONSHIP_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </FormGroupWrapper>
      )}
    </div>
  )
}
