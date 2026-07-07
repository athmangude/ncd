import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { FacilityCard } from "./FacilityCard"
import type { Facility } from "./types"

// Only the fields FacilityCard reads matter; the rest of the Facility shape is
// filled with placeholders so the object type-checks.
function makeFacility(overrides: Partial<Facility>): Facility {
  return {
    id: "1",
    name: "Aga Khan Hospital",
    registrationNumber: "",
    poBox: "",
    facilityType: "",
    facilityLevel: "",
    bedCapacity: 0,
    county: "Nairobi",
    status: "ACTIVE",
    plotNumber: "",
    latitude: "0",
    longitude: "0",
    updatedAt: "",
    createdAt: "",
    facility: null,
    placeImageUrl: "",
    phoneNumber: "",
    distance: null,
    hasActiveDiscount: false,
    verificationStatus: "APPROVED",
    ...overrides,
  }
}

describe("FacilityCard distance row", () => {
  it("renders the distance and its bullet when distance is present", () => {
    render(
      <FacilityCard
        facility={makeFacility({ distance: 2.34 })}
        onClick={vi.fn()}
      />
    )
    expect(screen.getByText("2.3 km")).toBeInTheDocument()
  })

  it("omits the distance entirely (no orphan 'km •') when distance is null", () => {
    // The old markup rendered `{distance?.toFixed(1)} km` unconditionally →
    // a bare " km •" leader when distance was undefined (audit §0).
    render(
      <FacilityCard
        facility={makeFacility({ distance: null })}
        onClick={vi.fn()}
      />
    )
    expect(screen.queryByText(/km/)).not.toBeInTheDocument()
  })
})
