import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
const base = process.argv[2] || "http://localhost:4173";
let checks = 0;
const check = (v, s) => {
  assert(v, s);
  checks++;
  console.log("PASS", s);
};
const get = async (path) => {
  const r = await fetch(base + "/backend/data/api/v1" + path);
  assert.equal(r.status, 200);
  const j = await r.json();
  return j.status === "SUCCESS" ? j.data : j;
};
const cat = await get("/metric/catalog"),
  asset = cat.assets[0];
const metrics = await get("/metric/by-asset/" + asset.id);
for (const metric of metrics) {
  const entry = cat.metrics.find((m) => String(m.id) === String(metric.id));
  check(entry?.unit === metric.unit, "unit contract " + metric.id);
}
const cashew = cat.metrics.find((m) => m.name === "Điều - Diện tích trồng");
assert(cashew);
const history = await get(
  `/metric/history?assetId=${asset.id}&metricId=${cashew.id}`,
);
check(
  history.timeSeries.length === 4,
  "all four original cashew observations retained",
);
check(
  history.timeSeries.filter((p) => p.quality === "CONFLICT").length === 2,
  "conflict marks both source records",
);
check(history.quality.conflictTimestamps === 1, "one conflicting timestamp");
check(
  history.quality.trendSeries.find((p) => p.timestamp.startsWith("2022"))
    .value === null,
  "conflict creates a chart gap",
);
check(
  history.timeSeries.some((p) => p.value === "17.5") &&
    history.timeSeries.some((p) => p.value === "18"),
  "source values preserved",
);
const filtered = await get(
  `/metric/history?assetId=${asset.id}&metricId=${cashew.id}&fromDate=2023-01-01`,
);
check(
  filtered.timeSeries.length === 1 && filtered.quality.conflictTimestamps === 0,
  "quality statistics respect the selected date range",
);
writeFileSync(
  "docs/design-evidence/data-contract-check.json",
  JSON.stringify(
    { checks, cashew: history, filteredRecords: filtered.timeSeries.length },
    null,
    2,
  ) + "\n",
);
console.log("TOTAL", checks);
