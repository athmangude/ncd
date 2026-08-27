# Explore Tab — Medication Stock Integration

## Problem

The Pharmacy Stock Finder page (`/patients/companion/pharmacy-stock`) shows medication availability at nearby pharmacies, but it uses hardcoded fixture data (only Metformin 500mg and Amlodipine 5mg) instead of the user's actual intake profile medications. It also exists as a standalone page disconnected from the Explore tab where users already discover healthcare facilities.

## Solution

Merge pharmacy stock features into the Explore tab and Facility Details page, personalized to the user's intake profile medications.

### Changes

**1. "Your Medications Nearby" section in Explore tab**
- New section between search bar and facility list
- Horizontal-scroll medication cards, one per profile medication
- Each card shows: medication name, stock summary (e.g., "In stock at 3 nearby"), tappable
- Tapping a medication card filters the facility list to show only facilities with that medication
- Uses `treatment.medicationNames` from `CareCompanionProfile`

**2. Facility cards show medication stock indicator**
- Verified partner cards get a subtle badge: "3 of your meds available" (or similar)
- Only shown when profile exists and has medications

**3. Facility Details — medication stock section in About tab**
- New "Your Medication Availability" section showing stock status for each of the user's medications at this specific facility
- Stock status badges: In stock (green), Low stock (amber), Out of stock (red), Not carried (grey)

**4. Profile-aware mock data generation**
- `getProfileAwarePharmacyStock(profileMedications, facilityIds)` generates stock entries dynamically from profile medications + real facility data
- Deterministic status assignment (hash of med name + facility ID) so results are stable across reloads
- Replaces hardcoded fixture for the Explore/Details use case

**5. Cleanup**
- Remove `PharmacyStockFinderPage.tsx`, its route, test, and quick action
- Remove `usePharmacyStock` hook (if no longer referenced)
- Update RefillSchedulePage "Find pharmacy" link → navigate to Explore tab
- Preserve PHARMACY_STOCK analytics events, repurpose for new location

### Data flow

```
Explore tab mounts
  → useIntakeProfile() fetches CareCompanionProfile
  → profile.treatment.medicationNames → ["Metformin 500mg", "Amlodipine 5mg", ...]
  → GET /care-companion/pharmacy-stock?medications=Metformin+500mg,Amlodipine+5mg
  → MSW handler calls getProfileAwarePharmacyStock(meds, allFacilities)
  → Returns PharmacyStock[] tied to real facility IDs from discovery fixture
```

### Files touched

| File | Change |
|------|--------|
| `mocks/domain/careCompanion.ts` | Add `getProfileAwarePharmacyStock()` |
| `mocks/handlers/carecompanion.ts` | Update handler to support `medications` param |
| `hooks/useMyMedicationStock.ts` | New hook combining profile + stock |
| `discovery/MedicationStockSection.tsx` | New component for Explore |
| `discovery/DiscoveryHomeView.tsx` | Add medication stock section + filter |
| `PatientDashboardExploreTab.tsx` | Wire up profile data |
| `facility-details/AboutTab.tsx` | Add medication stock section |
| `facility-details/FacilityMedicationStock.tsx` | New component |
| `CareCompanionWrapper.tsx` | Remove pharmacy-stock route |
| `CareCompanionHome.tsx` | Remove "Find Pharmacy" quick action |
| `RefillSchedulePage.tsx` | Update pharmacy link |
| `analytics/events.ts` | Add MEDICATION_STOCK events to DISCOVERY |
