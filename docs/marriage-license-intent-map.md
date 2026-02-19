# Marriage License Discount / Premarital Education Benefits — Visitor Intent Map

**Purpose:** This document maps every visitor job-to-be-done (JTBD) to the page sections, data fields, and acceptance criteria that must be present before a page can be considered "content-complete" for indexing and conversion.

It is the authoritative spec for:
- The page generator (Step 4): what sections to render and in what order
- QA (Step 6): what a human reviewer checks before promoting to `verified`
- The extractor (Step 3): which fields to prioritize and why

---

## Visitor JTBD Map

### JTBD 1 — "Do I qualify for this benefit?"

**What the visitor is really asking:**
- Does my state/county actually have a discount or waiting period waiver?
- Do I need to be a resident?
- Does this apply if we're already engaged / already started counseling?
- Are both of us required to attend?

**Required page sections:**

| Section | Required fields | Acceptance criteria |
|---------|----------------|---------------------|
| Eligibility Summary | `benefit_types`, `eligibility_rules.residency_required`, `eligibility_rules.both_parties_required` | Written in plain English; "Yes/No" answers visible without scrolling |
| Exclusions callout | `exclusions` | If exclusions exist, render as a warning box above requirements |
| Benefit type badge | `benefit_types` | Clearly label whether benefit is fee discount, waiting period waiver, or both |

**Content rules:**
- Lead with the most common eligibility question for that state (e.g., FL: "Do we both need to complete the course?")
- Never say "may qualify" — state the actual rule or flag it as unverified
- If `residency_required = false`, explicitly say "You do not need to be a resident of [State]"

---

### JTBD 2 — "How much do I save, and what exactly must I do?"

**What the visitor is really asking:**
- What is the exact standard fee vs. the discounted fee?
- Is the waiting period also waived?
- What is the step-by-step process?

**Required page sections:**

| Section | Required fields | Acceptance criteria |
|---------|----------------|---------------------|
| Savings summary box (above the fold) | `license_fee_cents`, `discounted_fee_cents`, `savings_amount_cents`, `currency` | Dollar amounts visible without scrolling; formatted as "Save $X.XX" |
| Waiting period callout | `standard_waiting_period_hours`, `waiting_period_waived`, `waiting_period_reduction_hours` | If waived: "3-day waiting period waived — you can marry the same day you get your license" |
| Step-by-step guide | `submission_process`, `certificate_fields`, `premarital_program_required`, `hours_required` | Numbered list, ≤7 steps, each step is one actionable sentence |
| Fee table | `license_fee_cents`, `discounted_fee_cents`, `savings_amount_cents` | Three-column table: Standard / With Counseling / You Save |

**Content rules:**
- Fees must be in USD with two decimal places (e.g., "$32.50 not $32.5")
- If `fee_varies_by_county = true`, show a range + link to county pages; never show a single number
- Step-by-step guide must end at "receive your license/discount" — not just "complete counseling"

---

### JTBD 3 — "Is online premarital counseling accepted? How many hours?"

**What the visitor is really asking:**
- Can we do this entirely online?
- How many hours minimum?
- Does it matter what platform/app we use?
- Can we do it asynchronously, or does it need to be live?

**Required page sections:**

| Section | Required fields | Acceptance criteria |
|---------|----------------|---------------------|
| Online/In-Person callout | `accepted_formats`, `accepted_formats_notes` | One of: "Online accepted", "In-person only", or "Online accepted if [condition]" — never vague |
| Hours requirement | `hours_required` | Exact number of hours stated; if null and program required, flag as "Minimum hours not specified by state" |
| Format details | `accepted_formats`, `accepted_formats_notes` | If online is conditionally accepted, the condition is spelled out verbatim |
| Provider type summary | `approved_provider_rules.accepted_types`, `approved_provider_rules.state_registration_required` | List of license types accepted; note if state registration is required |

**Content rules:**
- "Online counseling accepted" must link to the statute/clerk FAQ that confirms it — not an assumption
- If the state has no explicit online rule in statute, say "State statute does not explicitly address online — contact your county clerk to confirm"
- Hours must reflect state minimum, not a counselor's recommendation

---

### JTBD 4 — "Where do I submit proof, and what form or certificate is required?"

**What the visitor is really asking:**
- Do I submit the certificate before or at the time of the license application?
- Is there an official state form or can any certificate work?
- Where exactly do I go (county clerk? court? online)?
- Can I mail it or submit online?

**Required page sections:**

| Section | Required fields | Acceptance criteria |
|---------|----------------|---------------------|
| Submission process | `submission_process.where`, `submission_process.how`, `submission_process.deadline_window` | Answers: WHERE + HOW + WHEN in three sentences or less |
| Certificate requirements | `certificate_fields.state_issued_form`, `certificate_fields.official_form_url`, `certificate_fields.required_fields` | If state form required, prominent download link. If any cert works, list required fields on the cert |
| Certificate validity | `certificate_fields.validity_days` | Explicit: "Certificate is valid for X days" or "No stated expiration" (never omit) |
| Forms download | `certificate_fields.official_form_url` | Direct link to state/county form; tested within last 90 days |

**Content rules:**
- "County clerk" is not enough — name the specific office type used in that state (Probate Court in GA, Circuit Court Clerk in FL, etc.)
- If `online_submission_allowed = false`, say so explicitly — don't just omit it
- Deadline window must answer: "Can we submit it after the ceremony?" and "Can we submit it before we pick a date?"

---

### JTBD 5 — "What's the fastest compliant path for my jurisdiction?"

**What the visitor is really asking:**
- We're getting married soon — what's the minimum viable path?
- Which online programs are accepted AND fast AND cheap?
- Can we do everything in one day?

**Required page sections:**

| Section | Required fields | Acceptance criteria |
|---------|----------------|---------------------|
| Fast Path box | `fast_path_text`, `hours_required`, `accepted_formats`, `waiting_period_waived` | Callout box with a bolded 2-3 sentence "fastest route" narrative |
| Time estimate | `hours_required`, `waiting_period_waived`, `submission_process.online_submission_allowed` | Total time from "start counseling" to "receive license in hand" |
| Related providers | links to directory pages | "Find online counselors who offer [State] certificate" links to `/premarital-counseling/[state]?formats=online` |

**Content rules:**
- `fast_path_text` is human-written and reviewed (not AI-generated alone) for high-traffic states
- Fast path must account for waiting period: if waived, say "Same-day marriage license possible"
- Must not overstate speed — if provider scheduling takes days, acknowledge it

---

## Page Layout Spec (order of sections)

The following order is mandatory for all state and county pages. Sections marked *(conditional)* only render when data is present and valid.

```
1.  Breadcrumb nav
2.  Page title (H1): "[State] Marriage License Discount — Save [Amount] with Premarital Counseling"
3.  Savings Summary Box          ← above fold; JTBD 2
4.  Fast Path callout box        ← above fold; JTBD 5
5.  Eligibility section          ← JTBD 1
    5a. Exclusions warning       ← (conditional) JTBD 1
6.  Requirements section         ← JTBD 3
    6a. Online/In-person callout ← JTBD 3
    6b. Hours requirement        ← JTBD 3
    6c. Provider types           ← JTBD 3
7.  Certificate details          ← JTBD 4
    7a. State form download      ← (conditional) JTBD 4
8.  Submission process           ← JTBD 4
9.  Step-by-step guide (HowTo)   ← JTBD 2 + 4
10. [County variations]          ← (conditional, state pages only when fee_varies_by_county=true)
11. Local counselors             ← conversion; links to directory
12. FAQ section                  ← all JTBDs; minimum 5 questions
13. Citations / last verified    ← trust; required before indexing
14. Related internal links       ← SEO; waiting period, online counseling, state counselor pages
```

---

## Section-level acceptance criteria (gate for is_indexed)

A page CANNOT be indexed unless ALL of the following pass:

| Check | Field(s) | Rule |
|-------|----------|------|
| Savings box renderable | `savings_amount_cents` OR `fee_varies_by_county=true` | Must show concrete savings or explain county variability |
| Online answer present | `accepted_formats` | Must not be empty |
| Submission process complete | `submission_process.where` | Must name the specific office |
| At least 1 FAQ covering JTBD 3 | `faqs[].jtbd = 'online'` | Must have an online counseling Q&A |
| At least 1 citation | `official_sources` with `source_type IN (state_statute, county_clerk_site, official_form)` | Must link to a primary government source |
| Verified within 90 days | `last_verified_at` | Older pages auto-demoted to `stale` |
| `verification_status = 'verified'` | `verification_status` | Admin or automated QA must approve |
| `page_readiness_score >= 70` | `page_readiness_score` | Computed by trigger; see score breakdown in schema |

---

## County vs. State page differences

| Attribute | State page | County page |
|-----------|-----------|-------------|
| URL | `/premarital-counseling/marriage-license-discount/[state]` | `/premarital-counseling/marriage-license-discount/[state]/[county]` |
| Fee shown | Range if varies; exact if fixed | Exact county fee |
| Submission office | Generalized by state | Specific county clerk name, address |
| Eligibility | State rule | County overrides (if any) |
| Parent relationship | `jurisdiction_type = 'state'` | `parent_jurisdiction_id → state row` |
| When to create | Always for discount states | Only when county overrides state baseline |

---

## Hub page (`/premarital-counseling/marriage-license-discount`)

The hub page lists all states where `is_indexed = true` and `jurisdiction_type = 'state'`.

**Required for each state card on the hub:**
- `jurisdiction_name`, `state_abbr`
- `savings_amount_cents` OR benefit summary text
- `benefit_types` (to show "Discount + Waiting Period Waived" badges)
- Link to state detail page

**Hub page is indexed independently** — does not require any particular count of state pages.

---

## FAQ coverage requirements

Each state page must have a minimum of 5 FAQs covering these JTBD tags:

| JTBD tag | Example question | Mandatory? |
|----------|-----------------|-----------|
| `qualify` | "Do we both need to complete the course?" | Yes |
| `savings` | "How much does a marriage license cost in [State] with the discount?" | Yes |
| `online` | "Can we do premarital counseling online and still get the [State] discount?" | Yes |
| `submission` | "Where do we submit the certificate in [State]?" | Yes |
| `fastest` | "How quickly can we get a marriage license in [State] after counseling?" | Recommended |
| `provider` | "Who qualifies to provide premarital counseling in [State]?" | Recommended |
| `validity` | "How long is the premarital counseling certificate valid in [State]?" | Recommended |

---

## Data quality ladder

```
draft
  └─ Field populated from raw source (not yet validated)

needs_review
  └─ Extractor confidence >= 0.70 on all critical fields
  └─ At least 1 official source with excerpt
  └─ Readiness score >= 50

verified
  └─ Human or automated QA approved
  └─ All critical fields validated against primary source
  └─ Readiness score >= 70
  └─ is_indexed = true
  └─ Page live and canonical

stale
  └─ Was verified but last_verified_at > 90 days ago
  └─ is_indexed = false until re-verified
  └─ Noindex meta added to page

no_benefit
  └─ State confirmed: no benefit exists
  └─ Used to suppress pages for states where we previously had data
```

---

## Citations block spec

Every indexed page must render a Citations section at the bottom containing:

```
Last verified: [last_verified_at formatted as "February 18, 2026"]
Verified by: [verified_by]

Sources:
  1. [title] — [source_type label] — [url]
     Excerpt: "[excerpt]"
  2. ...

[Statute citation if present]:
  [statute_citation] — link to official legislative database if URL available

[Corrections link]: "See an error? Submit a correction"  → /corrections
```

This block is required for `is_indexed = true`. Its presence is part of the editorial standards at `/editorial-standards`.

---

*Last updated: 2026-02-18 | Owner: growth/SEO team*
