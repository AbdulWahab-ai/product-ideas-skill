# product-ideas: a Claude Code skill

This skill researches any industry and publishes a sourced, interactive catalogue of product or service ideas. Every idea gets:

- why now, and how big the problem is, with source links
- the industries it helps, who pays, and the minimum sale price
- the team, first-version time and cost, AI needs, hardware tier and legal requirements
- the platform risk and a dated kill criterion
- a weighted score out of 100 and a rank
- **shown working** for market size, build cost, cost to serve, gross margin, price floor, year-2 revenue and payback

Claude only writes a **data file** per run. The page template and formulas are fixed, so catalogues for different industries are directly comparable.

## Install

Clone into your Claude Code skills folder:

```bash
git clone <this-repo-url> ~/.claude/skills/product-ideas
```

On Windows, that folder is `C:\Users\<you>\.claude\skills\product-ideas`. Start a new Claude Code session so the skill loads.

You'll need [Node.js](https://nodejs.org) 18 or later for the build script.

## Use

In Claude Code:

```
/product-ideas healthcare --regions GCC,UK --ideas 30
```

Or ask in plain words, for example "give me product ideas for logistics". Claude asks for anything missing (regions, customer type, your team, number of ideas), then works in five stages:

1. **Research:** losses, recent incidents, regulation deadlines, funding, buyer pain and regional facts, logged with links and dates.
2. **Generate ideas:** for 25 or more, split across parallel helper agents by category.
3. **Fill the data:** card text, decision details, calculation inputs and judgement scores.
4. **Build and check:** validate the data, check the links, and sanity-check the top 10.
5. **Publish:** as a private Claude artifact page.

Work is saved in `./product-research/<industry>-<yyyy-mm>/`. Run it again on the same industry to refresh the catalogue.

## Build a page by hand

```bash
node scripts/build.js examples/cybersecurity.json out.html --check-links
```

The script stops with a list of errors if the data is invalid (missing fields, unknown sources, out-of-range numbers, non-https links). It warns about doubtful inputs and prints the top 10.

## How the figures are calculated

| Figure | Formula |
|---|---|
| Market size | buyers in your regions × % likely to buy in 3–5 years × typical yearly deal |
| First-version cost | people × months × monthly pay + tools, licences and hardware (low and high case) |
| Cost to serve | delivery hours × hourly cost + third-party fees + shared infrastructure ÷ customers |
| Gross margin | (typical deal − cost to serve) ÷ typical deal |
| Price floor | cost to serve ÷ (1 − target margin, default 60%) |
| Customers to repay the build | high-case build cost ÷ (typical deal × margin) |
| Score | Σ(rating × weight) ÷ 5. The deal-size rating is calculated from the market size; the other seven are judgements against a fixed rubric. |

The default pay rates assume a Pakistan-based team. `references/schema.md` gives UK, US and Gulf rates and explains how to estimate every input.

## Files

| Path | Purpose |
|---|---|
| `SKILL.md` | The workflow Claude follows |
| `references/schema.md` | Data format and estimation guide |
| `assets/template.html` | The catalogue page (cards, compare table, filters, working) |
| `scripts/build.js` | Validates data and builds the page |
| `examples/cybersecurity.json` | A complete 50-idea example (cybersecurity, Nov 2026) |

## Caveats

Market sizes, prices and scores are estimates built from public data and comparable products, not measured figures. Check buyer counts in a prospect database and test prices with real buyers before you commit money.
