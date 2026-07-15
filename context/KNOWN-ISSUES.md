# Known Issues — jireh-core-client

Tracks confirmed bugs and incomplete implementations.

---

## 1. Guarantor Portal Not Implemented

**Severity: MEDIUM (missing feature, not a crash)**  
**No GitHub issue yet**

The SuperTokens multi-tenancy setup includes a `guarantors` tenant, and the workspace CLAUDE.md references a Guarantor portal. No guarantor-specific routes, pages, or stores exist in the codebase. The tenant can be set via localStorage but the user lands on a blank or broken experience.

**Impact:** Any guarantor who receives a loan co-signing notification cannot complete their journey.

**Action:** Create a GitHub issue and design the guarantor flows before implementing.

---

## 2. `patientLoanStore` Never Populated

**Severity: LOW (dead code, not a crash)**  
**See CONFLICTS.md for detail**

The Zustand loan store (`patientLoanStore`) exists but is never populated during the loan application journey. Any component that reads `usePatientLoanStore().loan` will receive null even during an active loan application.

---

## Reporting New Issues

When you discover a new issue:
1. Add an entry here with: severity, affected flow, root cause, fix
2. File a GitHub issue: `gh issue create --repo Jireh-Health/jireh-core-client`
3. Track the link in this file
