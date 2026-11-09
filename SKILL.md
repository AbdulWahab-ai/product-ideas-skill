---
name: product-ideas
description: Research any industry and publish a sourced catalogue of product or service ideas. Each idea gets why-now, problem size with sources, buyer, minimum price, build and hardware needs, legal and platform risk, a kill criterion, a weighted score, and shown working for market size, build cost, margin, price floor and payback. Use when the user wants product, app, startup or business ideas for an industry, market or problem area, or wants to rerun or refresh a catalogue like this.
argument-hint: "<industry> [--regions ...] [--ideas N]"
---

# Product ideas catalogue

Produces one interactive page per industry, in the same format every time: cards, a compare table, filters, a score ranking, and a "How the figures were calculated" panel on every idea. You only write **data** (one JSON file). The template and formulas are fixed, so catalogues stay comparable across industries.

Files in this skill:
- `assets/template.html`: the page. Don't edit it per run.
- `scripts/build.js`: validates the data and writes the page. `node build.js <data.json> <out.html> [--check-links]`
- `references/schema.md`: the data format and how to estimate every input. **Read it before writing data.**
- `examples/cybersecurity.json`: a complete 50-idea example. Copy its shape and level of detail.

## 1. Inputs

Take the industry from the arguments. If any of these are missing and not clear from the conversation, ask in **one** AskUserQuestion call (max 4 questions):
1. **Regions** to sell in (multi-select).
2. **Customer type**: consumers, SMBs, mid-market, enterprise, government (multi-select).
3. **Team**: skills and base country. This sets `meta.profile`, the fit ratings and the pay `rates` (see schema).
4. **How many ideas**: 20 (quick), 30 (default), or 50 (full; slow and costly).

Use the default score weights unless the user gives priorities (e.g. "fast cash" → raise speed; "venture-scale" → raise deal size and defensibility).

Work in `./product-research/<industry-slug>-<yyyy-mm>/` under the current working directory: `data.json`, `notes.md` (search log and open questions), and the built `catalogue.html`. If that folder already has `data.json`, this is a **refresh**: keep idea numbers, update facts and sources, and add or retire ideas. Say what changed.

## 2. Research the landscape (before any ideas)

Run searches in parallel batches (WebSearch, `standard` mode; use `extended` for thin or very recent topics). Cover:
- money lost, wasted or at stake: losses, fines, costs, market size, with a year
- incidents, failures or news from the last 6–12 months, by region
- regulation and deadlines that force buying (dated triggers are the strongest signals)
- funding, M&A and launches: where money is flowing, and who just got absorbed by a platform
- buyer pain: surveys, job postings, complaints
- region-specific facts for every chosen region (don't let US data stand in for other regions)

Log each useful finding in `notes.md` with the URL and publication date.

**Source rules (no exceptions):**
- Cite only URLs that a search or fetch actually returned in this session. Never construct, guess or "fix" a URL.
- Prefer primary reports. When citing press coverage, name the outlet in the label: "IBM 2026 breach cost (eSecurity Planet)".
- A claim with only one, non-primary source gets "(single source)" in the `size` text.
- Every number in `size` and `evidence` needs a year and a source key.

## 3. Generate ideas

For **25+ ideas**, split by category and spawn 4–6 `general-purpose` subagents in parallel. Give each one its category, the user's inputs, the landscape findings (facts plus URLs), the path to `references/schema.md` and `examples/cybersecurity.json`, the source rules above, and the number of ideas to return. Each returns a JSON array of idea objects plus any new `sources` entries, using only URLs it actually retrieved. Then merge, de-duplicate, renumber 1..N and normalise categories and segment names yourself. For fewer ideas, do it inline.

Aim for a spread: mix build difficulty (some Low-build services that earn fast), customer types, price points, and include 2–4 public-good ideas. Each idea must solve a specific, evidenced problem. Don't relabel the same product for a different industry.

## 4. Fill decision data and estimates

Follow `references/schema.md` for every field. Consistency checks to apply as you go:
- `calc.buyers` matches `buyersText`. `calc.people` matches the roles in `team`. `monthsLow/High` matches `mvpTime`.
- `calc.deal` ≥ `pnum` unless the low price is deliberate.
- `share`: be conservative. It drives market size linearly and is the least certain input.
- Services need realistic `hours` (hundreds per customer a year). Self-serve SaaS needs near-zero hours but real `infra`.
- Scores are judgements against the rubric. Don't push every idea to 4–5.

## 5. Build and check

```
node "<skill dir>/scripts/build.js" data.json catalogue.html --check-links
```
- Fix every ERROR and rebuild. Nothing is written until the data is valid.
- Read every WARN. Fix high shares, negative margins and a deal below the minimum price, or keep them with a reason in `notes.md`. For a broken-link warning, open the URL. If it is really dead, replace the source with one you retrieved, or drop the claim.
- Sanity-check the printed top 10. If an idea ranks high only because of one doubtful input, fix the input; don't tune scores to reach a ranking you want.
- Add `start` paragraphs (your recommendation on where to begin and why) and `caveats`. Rebuild.

## 6. Publish and report

Publish `catalogue.html` with the Artifact tool: icon `lightbulb`, a one-sentence description, and the same file path on reruns so the URL stays the same. The template already meets the artifact page contract (tokens, dark mode, fonts, phone layout), so don't restyle it.

Then tell the user:
- the link
- the top 5 by score with a one-line why each
- the most uncertain inputs to validate first, usually buyer counts and share
- what the research could not find
- that the page is private until they share it

Offer one next step, such as a target-buyer list for the top idea.
