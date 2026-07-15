# context/projects/

This folder contains **feature-specific technical specs** that are tightly coupled to the code in this repository.

---

## What Belongs Here

- Technical implementation specs for a specific feature in `jireh-core-client`
- API contract notes for an endpoint this frontend consumes
- Component design decisions and prop API drafts
- Architecture Decision Records (ADRs) scoped to this repo

**File naming convention:**
```
context/projects/
└── [feature-slug]/
    ├── spec.md              # Technical spec or implementation plan
    ├── api-contract.md      # API shape this feature depends on
    └── decisions.md         # Why we built it this way
```

---

## What Does NOT Belong Here

| Content | Where it lives |
|---------|---------------|
| Product PRDs, user stories | `jireh-master-context/` repo (external) |
| Figma exports, design mockups, images, PDFs | `jireh-master-context/` repo (external) |
| Cross-repo decisions (frontend + API + Python) | `jireh-master-context/` repo (external) |
| Business context, stakeholder docs | `jireh-master-context/` repo (external) |

**Binary files (images, PDFs, Figma exports) should never be committed here.** They bloat git history permanently and can't be efficiently diff'd. Put them in the external context repo where they can be managed separately.

---

## The External Context Repo

Product-level context and design artifacts live in a separate repository cloned alongside the main repos. This repo:
- Is readable by all AI agents working across any Jireh repo
- Stores Figma exports, wireframes, and design tokens as files
- Contains PRDs, user stories, and cross-repo specs
- Can be updated by non-technical contributors without touching code

Ask a team member for the location and access if you don't have it.

---

## Relationship to Architecture Docs

Architecture docs in `context/architecture/` describe the **current state** of how the app is built. Specs here describe **planned or in-progress work**. Once a feature ships, the relevant architecture docs should be updated to reflect any new patterns introduced.
