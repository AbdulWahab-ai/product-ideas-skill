#!/usr/bin/env node
/* Build a product-ideas catalogue page from a data JSON file.
   Usage: node build.js <data.json> <out.html> [--check-links]
   Validates the data first; exits 1 with a list of problems if anything is wrong. */
"use strict";
const fs = require("fs");
const path = require("path");

const [, , dataPath, outPath, ...flags] = process.argv;
if (!dataPath || !outPath) {
  console.error("Usage: node build.js <data.json> <out.html> [--check-links]");
  process.exit(2);
}
const checkLinks = flags.includes("--check-links");
const template = fs.readFileSync(path.join(__dirname, "..", "assets", "template.html"), "utf8");

let D;
try { D = JSON.parse(fs.readFileSync(dataPath, "utf8")); }
catch (e) { console.error("Cannot read JSON: " + e.message); process.exit(1); }

const errs = [], warns = [];
const err = (m) => errs.push(m), warn = (m) => warns.push(m);
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const isNum = (v) => typeof v === "number" && isFinite(v);

/* meta */
const M = D.meta || {};
["title", "industry", "date", "intro", "profile"].forEach((k) => { if (!isStr(M[k])) err(`meta.${k} is missing`); });

/* sources */
const S = D.sources || {};
if (!Object.keys(S).length) err("sources is empty");
for (const [k, v] of Object.entries(S)) {
  if (!Array.isArray(v) || !isStr(v[0]) || !isStr(v[1])) { err(`sources.${k} must be [label, url, optional date]`); continue; }
  if (!/^https:\/\//.test(v[1])) err(`sources.${k} url must start with https://`);
}

/* weights and settings */
if (D.weights) {
  if (!Array.isArray(D.weights) || D.weights.length !== 8 || !D.weights.every(isNum)) err("weights must be 8 numbers");
  else if (D.weights.reduce((a, b) => a + b, 0) !== 100) err("weights must add up to 100");
}
if (D.rates) for (const t of ["s", "x"]) if (!Array.isArray(D.rates[t]) || D.rates[t].length !== 3 || !D.rates[t].every(isNum)) err(`rates.${t} must be [monthly low, monthly high, hourly]`);
if (D.marketBands && (!Array.isArray(D.marketBands) || D.marketBands.length !== 4)) err("marketBands must be 4 thresholds, largest first");

/* evidence */
(D.evidence || []).forEach((e, j) => {
  ["label", "value", "note", "src"].forEach((k) => { if (!isStr(e[k])) err(`evidence[${j}].${k} is missing`); });
  if (e.src && !S[e.src]) err(`evidence[${j}] cites unknown source "${e.src}"`);
});
if (!(D.evidence || []).length) warn("no evidence tiles: the header strip will be empty");

/* ideas */
const I = D.ideas || [];
if (I.length < 5) err(`only ${I.length} ideas`);
const TEXT = ["name", "one", "cat", "why", "size", "ind", "buyer", "price", "model", "mvp", "comp", "impact", "regions",
  "buyersText", "trigger", "cycle", "team", "mvpTime", "ai", "dependency", "techRisk", "hwTier", "hwCost", "legal", "platformRisk", "kill"];
const CALC = ["buyers", "share", "deal", "people", "monthsLow", "monthsHigh", "toolsLow", "toolsHigh", "hours", "thirdParty", "infra", "customers"];
const SCORES = ["urgency", "fit", "speed", "competition", "defensibility", "simplicity", "legal"];
const seenN = {}, seenName = {};
I.forEach((i, j) => {
  const id = `idea #${i.n ?? j + 1}${i.name ? " (" + i.name + ")" : ""}`;
  if (!Number.isInteger(i.n)) err(`${id}: n must be an integer`);
  else if (seenN[i.n]) err(`${id}: duplicate number`); else seenN[i.n] = 1;
  if (i.name) { const key = i.name.toLowerCase(); if (seenName[key]) err(`${id}: duplicate name`); seenName[key] = 1; }
  TEXT.forEach((k) => { if (!isStr(i[k])) err(`${id}: ${k} is missing`); });
  if (!Array.isArray(i.seg) || !i.seg.length) err(`${id}: seg must list at least one customer type`);
  if (!Array.isArray(i.src) || !i.src.length) err(`${id}: src must cite at least one source`);
  else i.src.forEach((k) => { if (!S[k]) err(`${id}: unknown source "${k}"`); });
  if (!isNum(i.pnum) || i.pnum < 0) err(`${id}: pnum must be a number (annualised minimum deal, 0 if none)`);
  if (!["Low", "Medium", "High"].includes(i.build)) err(`${id}: build must be Low, Medium or High`);
  if (!["Low", "Medium", "High"].includes(i.fit)) err(`${id}: fit must be Low, Medium or High`);
  const c = i.calc || {};
  CALC.forEach((k) => { if (!isNum(c[k]) || c[k] < 0) err(`${id}: calc.${k} must be a number ≥ 0`); });
  if (!["s", "x"].includes(c.tier)) err(`${id}: calc.tier must be "s" or "x"`);
  if (isNum(c.share) && (c.share <= 0 || c.share > 100)) err(`${id}: calc.share is a percentage (0–100]`);
  if (isNum(c.customers) && c.customers < 1) err(`${id}: calc.customers must be at least 1`);
  if (isNum(c.monthsLow) && isNum(c.monthsHigh) && c.monthsLow > c.monthsHigh) err(`${id}: monthsLow > monthsHigh`);
  if (isNum(c.toolsLow) && isNum(c.toolsHigh) && c.toolsLow > c.toolsHigh) err(`${id}: toolsLow > toolsHigh`);
  if (isNum(c.share) && c.share > 50) warn(`${id}: share of ${c.share}% is unusually high; justify it or lower it`);
  if (isNum(c.deal) && isNum(i.pnum) && i.pnum > 0 && c.deal < i.pnum) warn(`${id}: typical deal is below the minimum price`);
  const s = i.scores || {};
  SCORES.forEach((k) => { if (!Number.isInteger(s[k]) || s[k] < 1 || s[k] > 5) err(`${id}: scores.${k} must be an integer 1–5`); });
});
(D.caveats || []).forEach((c, j) => { if (!isStr(c)) err(`caveats[${j}] is empty`); });

/* Quick economics preview, same formulas as the page */
const RATE = D.rates || { s: [1500, 3000, 25], x: [2500, 5000, 40] };
const W = D.weights || [20, 15, 15, 15, 10, 10, 10, 5];
const B = D.marketBands || [20e6, 10e6, 5e6, 2e6];
const band = (m) => (m >= B[0] ? 5 : m >= B[1] ? 4 : m >= B[2] ? 3 : m >= B[3] ? 2 : 1);
const rows = errs.length ? [] : I.map((i) => {
  const c = i.calc, r = RATE[c.tier], s = i.scores;
  const mkt = c.buyers * c.share / 100 * c.deal;
  const cogs = c.hours * r[2] + c.thirdParty + c.infra / c.customers;
  const gm = 1 - cogs / c.deal;
  if (gm <= 0) warn(`idea #${i.n}: cost to serve is above the typical deal (margin ${Math.round(gm * 100)}%)`);
  const sc = [s.urgency, band(mkt), s.fit, s.speed, s.competition, s.defensibility, s.simplicity, s.legal];
  return { n: i.n, name: i.name, mkt, gm, score: Math.round(sc.reduce((a, v, j) => a + v * W[j], 0) / 5) };
});

async function linkCheck() {
  const bad = [];
  await Promise.all(Object.entries(S).map(async ([k, v]) => {
    try {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 12000);
      let res = await fetch(v[1], { method: "HEAD", redirect: "follow", signal: ctl.signal, headers: { "user-agent": "Mozilla/5.0 (link check)" } });
      if (res.status === 405 || res.status === 403) res = await fetch(v[1], { method: "GET", redirect: "follow", signal: ctl.signal, headers: { "user-agent": "Mozilla/5.0 (link check)" } });
      clearTimeout(t);
      if (res.status >= 400) bad.push(`${k}: HTTP ${res.status} ${v[1]}`);
    } catch (e) { bad.push(`${k}: ${e.name === "AbortError" ? "timeout" : e.message} ${v[1]}`); }
  }));
  return bad;
}

(async () => {
  if (checkLinks && !errs.length) {
    const bad = await linkCheck();
    bad.forEach((b) => warn("link may be broken (some sites block automated checks; open it to confirm): " + b));
  }
  warns.forEach((w) => console.log("WARN  " + w));
  if (errs.length) {
    errs.forEach((e) => console.log("ERROR " + e));
    console.log(`\n${errs.length} error(s). Nothing was written.`);
    process.exit(1);
  }
  /* Escape "<" and the two JS line separators (U+2028, U+2029) so the JSON is safe inside a <script> tag */
  const BS = String.fromCharCode(92);
  const json = JSON.stringify(D).replace(/</g, BS + "u003c").split(String.fromCharCode(0x2028)).join(BS + "u2028").split(String.fromCharCode(0x2029)).join(BS + "u2029");
  const title = String(M.title).replace(/[&<>]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[ch]));
  const html = template.replace("__TITLE__", () => title).replace("__DATA_JSON__", () => json);
  fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
  fs.writeFileSync(outPath, html);
  rows.sort((a, b) => b.score - a.score || a.n - b.n);
  const fm = (n) => (n >= 1e6 ? "$" + (n / 1e6).toFixed(1) + "M" : "$" + Math.round(n / 1e3) + "k");
  console.log(`OK  ${I.length} ideas, ${Object.keys(S).length} sources, ${warns.length} warning(s) → ${outPath} (${Math.round(html.length / 1024)} KB)`);
  console.log("Top 10 by score:");
  rows.slice(0, 10).forEach((r, k) => console.log(`  ${String(k + 1).padStart(2)}. #${r.n} ${r.name} — ${r.score}/100, market ${fm(r.mkt)}/yr, margin ${Math.round(r.gm * 100)}%`));
})();
