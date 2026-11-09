# Catalogue data format

One JSON file per catalogue. `scripts/build.js` validates it and injects it into `assets/template.html`. The page computes every derived figure (market size, build cost, margin, price floor, year-2 revenue, payback, score) from the inputs below and shows the working on each card. **Never write a derived figure into the data.** The page calculates it.

`examples/cybersecurity.json` is a complete, valid example with 50 ideas. Copy its shape.

## Top level

| Key | Required | What it holds |
|---|---|---|
| `meta` | yes | `title` (2–5 words, e.g. "40 Logistics Product Ideas"), `industry`, `date` (research date, e.g. "6 Nov 2026"), `intro` (1–2 sentences), `profile` (who the fit ratings are for, e.g. "a two-person dev team selling to mid-size UK retailers"), optional `badge` (short marker, default "Research"), `label` (default "industry · date"), `payNote` (why the pay rates fit the team's base) |
| `sources` | yes | `{ key: [label, https-url, optional "published date"] }`. The label names the publisher and the claim, e.g. "FBI IC3 2025 report: $20.9B losses (Help Net Security)". Name the outlet when it is secondary coverage. |
| `evidence` | recommended | 4–6 headline tiles: `{label, value, note, src}`. Each `src` must be a key in `sources`. |
| `ideas` | yes | Array of idea objects (below). |
| `start` | optional | Paragraphs added under "Where to start", after the automatic ranking summary. `**bold**` allowed. |
| `caveats` | recommended | Bullet strings. `**bold**` allowed. |
| `weights` | optional | 8 integers adding to 100, in criterion order. Default `[20,15,15,15,10,10,10,5]`. |
| `rates` | optional | `{s:[monthly low, monthly high, hourly], x:[…]}` in USD. Default `s:[1500,3000,25]`, `x:[2500,5000,40]` (Pakistan-based team). For UK/US/Gulf teams use roughly `s:[4000,8000,60]`, `x:[7000,12000,90]`. |
| `floorMargin` | optional | Target gross margin for the price floor. Default `0.6`. |
| `marketBands` | optional | 4 thresholds for the deal-size score, largest first. Default `[20e6,10e6,5e6,2e6]`. Scale them down for small or local markets. |

## Idea object

### Card text (all strings unless noted)

| Key | Meaning |
|---|---|
| `n` | Integer 1..N, unique |
| `name` | Product name, 2–6 words |
| `one` | One-line description of what it does |
| `cat` | Category. Use 5–9 categories in total. |
| `seg` | Array of customer types, e.g. `["SMB","Enterprise"]`. Keep the vocabulary small and consistent. |
| `why` | Why this is suggested now: the pain and what changed |
| `size` | The problem's size, as a sourced fact with a number and year |
| `src` | Array of source keys backing `size` (at least 1) |
| `ind` | Industries helped |
| `buyer` | Job title(s) of who signs the cheque |
| `price` | Minimum sale price as shown, e.g. "$300/month" |
| `pnum` | Number: that minimum, annualised per customer in USD (`$300/month` → 3600; `$149 per case` → 149; grant-funded → 0) |
| `model` | Pricing model |
| `build` | `"Low"`, `"Medium"` or `"High"` build difficulty |
| `mvp` | What the first sellable version contains |
| `comp` | Named competitors, then the gap |
| `impact` | Who it protects or helps |
| `regions` | Best regions |
| `fit` | `"High"`, `"Medium"` or `"Low"` fit for `meta.profile` |

### Decision details (strings)

`buyersText` (who and how many, e.g. "~2,000 banks, brokers and retailers in GCC + UK"), `trigger` (what makes them buy now), `cycle` (sales cycle), `team` (roles needed for the first version), `mvpTime` (e.g. "6–8 weeks"; the cost is computed), `ai` (AI/ML intensity), `dependency` (the key outside dependency), `techRisk` (main technical risk), `hwTier` (one of: Cloud · In-country cloud · GPU · Test lab · On-prem at customer · Forensics · Training range, or a combination), `hwCost`, `legal` (licences, certifications, laws), `platformRisk` ("Low/Medium/High: who could add it free"), `kill` (a dated, measurable test that tells you to stop, e.g. "Under 5 paying customers after 90 days of outreach").

### `calc`: inputs for the computed figures (numbers)

| Key | Meaning | How to estimate |
|---|---|---|
| `buyers` | Organisations (or people, for consumer products) in the target regions that could buy | Count from registries, associations, industry reports or a prospect database. Must match `buyersText`. |
| `share` | % of them likely to buy *this category* within 3–5 years | Usually 2–30. Mature, mandated categories are higher; new categories and consumers are lower. Above 50 triggers a warning. |
| `deal` | Typical yearly deal per customer, USD | Comparable vendor pricing. It is normally ≥ `pnum`. |
| `people` | Headcount on the first version | Count the roles in `team`. |
| `monthsLow`, `monthsHigh` | First-version duration | Consistent with `mvpTime` (6–8 weeks → 1.5, 2). |
| `tier` | `"s"` standard or `"x"` specialist pay | `"x"` for ML, offensive security, forensics, telecom, OT, actuarial and similar scarce skills. |
| `toolsLow`, `toolsHigh` | Non-staff first-version cost, USD | Licences, data, hardware, certifications, cloud during the build |
| `hours` | Delivery and support hours per customer per year | Covers onboarding, analyst work and support. Near 0 for self-serve SaaS; hundreds for services. |
| `thirdParty` | Per-customer third-party cost per year, USD | APIs, data feeds, app-store fees, partner licences |
| `infra` | Shared infrastructure per year, USD | Hosting, GPUs, storage |
| `customers` | Target customers by end of year 2 | Realistic for this team, not the market maximum |

### `scores`: integer judgements 1–5

`urgency`, `fit`, `speed`, `competition` (5 = little), `defensibility`, `simplicity` (5 = cloud-only and simple), `legal` (5 = light). The deal-size score is **not** entered. The page computes it from the market size.

Rubric for a 5: urgency = dated deadline or recent losses and budget already exists · fit = the team in `meta.profile` can deliver it now · speed = paid work within ~2 months for under ~$30k · competition = few rivals in the regions and low risk of a big platform adding it free · defensibility = data, relationships or licences that are hard to copy · simplicity = cloud only, no special hardware, no in-house models · legal = no licences or approvals needed to start.
