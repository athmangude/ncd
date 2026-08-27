# Education Content Overhaul — Technical Spec

## Problem

The education page (`/patients/companion/education`) had only 12 articles covering 2 conditions (Diabetes, Hypertension) plus a few General articles. For a platform serving patients with 14+ NCD conditions, this was woefully insufficient. The articles also lacked visual headers and condition-based filtering, making it hard to find relevant content.

## Solution

### Content Expansion (10x)

Expanded from 12 articles to 119 articles covering all 16 condition types:

| Condition | Count |
|-----------|-------|
| DIABETES | 9 |
| HYPERTENSION | 8 |
| ASTHMA | 8 |
| CANCER | 7 |
| KIDNEY_DISEASE | 8 |
| HEART_DISEASE | 7 |
| SICKLE_CELL | 7 |
| HIV_AIDS | 7 |
| EPILEPSY | 7 |
| COPD | 7 |
| ARTHRITIS | 7 |
| MENTAL_HEALTH | 7 |
| THYROID | 7 |
| STROKE | 7 |
| LIVER_DISEASE | 7 |
| GENERAL | 9 |

All 7 content types are represented per condition: DIETARY, EXERCISE, MYTH_BUSTING, EMOTIONAL, ACCEPTANCE, SELF_MONITORING, MILESTONE.

### Content Quality

Every article is:
- **Kenyan-contextualized** — references ugali, sukuma wiki, chapati, omena, Royco cubes, KES pricing, local markets, mursik, githeri
- **Actionable** — specific steps the reader can take today
- **Empathetic** — written with understanding of the emotional burden of chronic disease
- **Household-compatible** — dietary advice works for the whole family where applicable
- **Cost-neutral** — recommendations that don't require additional spending where possible

### UI Improvements

1. **Condition filter chips** — horizontal scrollable row with "For You" (personalized based on intake profile conditions), "All Topics", and individual condition filters
2. **Content type filter chips** — second row with type-specific icons and colors
3. **Featured card** — first unread article displayed prominently with tall gradient header
4. **Visual article headers** — 30 unique gradient themes mapped to articles via `imageUrl` field, shown on featured cards and expanded article view
5. **Read progress tracking** — progress bar showing articles read / total
6. **Unread / Read sections** — articles grouped by read status
7. **Condition color badges** — each condition has a distinct color for quick visual scanning
8. **Read time estimates** — calculated from word count

### Data Model Changes

Added two fields to education card fixtures (already defined in `EducationContentCard` type):
- `imageUrl: string | null` — maps to gradient theme key in `IMAGE_THEMES`
- `isPublished: boolean` — all set to `true`

### Files Modified

- `src/mocks/fixtures/education-cards.json` — expanded from 12 to 119 articles
- `src/Routes/Patient/Pages/CareCompanion/EducationFeedPage.tsx` — complete UI overhaul with dual filter rows, featured card, gradient headers, condition badges, progress tracking

### Personalization

When a user has completed intake and has conditions on their profile, the "For You" filter (default) shows only articles matching their conditions plus GENERAL. This ensures the most relevant content surfaces first without hiding the broader library.
