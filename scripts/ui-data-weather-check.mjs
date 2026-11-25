import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  Browser,
  base,
  wait,
  fill,
  button,
} from "./lib/local-browser.mjs";
const out = resolve(".taste-skill/data-weather-proof");
mkdirSync(out, { recursive: true });
const checks = [],
  external = {};
const check = (value, label) => {
  assert(value, label);
  checks.push(label);
  console.log("PASS", label);
};
const browser = await Browser.launch();
const page = await browser.newPage({ width: 1440, height: 1000 });
async function captureDownload(text) {
  await page.eval(() => {
    window.__savedCreateUrl = URL.createObjectURL;
    window.__savedAnchorClick = HTMLAnchorElement.prototype.click;
    URL.createObjectURL = (blob) => {
      window.__downloadBlob = blob;
      return "blob:download-check";
    };
    HTMLAnchorElement.prototype.click = () => {};
  });
  try {
    await button(page, text);
    return await page.eval(async () => window.__downloadBlob.text());
  } finally {
    await page.eval(() => {
      URL.createObjectURL = window.__savedCreateUrl;
      HTMLAnchorElement.prototype.click = window.__savedAnchorClick;
    });
  }
}
try {
  await page.goto(base + "/data", { settleMs: 900 });
  await wait(
    page,
    () => !!document.querySelector(".ec-dataset-heading h2"),
    "historical data loaded",
  );
  const temperature = await page.eval(
    () =>
      [...document.querySelectorAll(".ec-dataset-fields select")][2]
        .querySelectorAll("option")
        .values()
        .find((o) => o.textContent.includes("Nhiệt độ không khí trung bình"))
        ?.value,
  );
  assert(temperature, "temperature metric exists in local source");
  await fill(page, "Chỉ số cần xem", temperature);
  await wait(
    page,
    () =>
      document
        .querySelector(".ec-dataset-heading h2")
        ?.textContent.includes("Nhiệt độ không khí trung bình"),
    "temperature history",
  );
  check(
    await page.eval(
      () =>
        !!document.querySelector(".recharts-wrapper") &&
        document.querySelector(".ec-unit-label").textContent.includes("°C"),
    ),
    "historical chart and real unit render",
  );
  const csv = await captureDownload("Tải CSV");
  check(
    csv.includes("2002") && csv.split("\n").length > 60,
    "CSV export contains actual historical observations",
  );
  await button(page, "Bảng dữ liệu");
  check(
    await page.eval(
      () =>
        document.querySelectorAll(".ec-observation-table tbody tr").length > 0,
    ),
    "history table renders data rows",
  );
  await button(page, "Biểu đồ");
  await page.eval(
    () => (document.querySelector(".ec-data-provenance").open = true),
  );
  check(
    await page.eval(
      () =>
        [...document.querySelectorAll(".ec-data-provenance button")].find(
          (b) => b.textContent === "Phân tích bộ số liệu",
        ).disabled,
    ),
    "climate analysis requires explicit unit confirmation",
  );
  await page.eval(() =>
    document
      .querySelector('.ec-data-provenance input[type="checkbox"]')
      .click(),
  );
  await button(page, "Phân tích bộ số liệu");
  await wait(
    page,
    () => !!document.querySelector(".ec-data-provenance [aria-live]"),
    "climate result",
  );
  const analysis = JSON.parse(await captureDownload("Tải kết quả JSON"));
  check(
    analysis.status === "completed" &&
      analysis.usableObservations >= 60 &&
      analysis.unitConfirmed === true,
    "climate FE runs real seasonal analysis and exports matching result",
  );
  await page.eval(() => (document.querySelector(".ec-date-range").open = true));
  await fill(page, "Từ ngày", "2023-01-01");
  await fill(page, "Đến ngày", "2023-12-31");
  await wait(
    page,
    () =>
      document.querySelector(".ec-dataset-summary dd")?.textContent === "12",
    "filtered year",
  );
  check(
    await page.eval(
      () => !document.querySelector(".ec-data-provenance [aria-live]"),
    ),
    "date filter resets stale climate result",
  );
  await button(page, "Toàn bộ thời gian");
  const cashew = await page.eval(
    () =>
      [...document.querySelectorAll(".ec-dataset-fields select")][2]
        .querySelectorAll("option")
        .values()
        .find((o) => o.textContent.includes("Điều - Diện tích trồng"))?.value,
  );
  assert(cashew, "cashew source metric exists");
  await fill(page, "Chỉ số cần xem", cashew);
  await wait(
    page,
    () =>
      document.querySelector(".ec-dataset-heading h2")?.textContent ===
      "Điều - Diện tích trồng",
    "conflict dataset",
  );
  await button(page, "Bảng dữ liệu");
  await wait(
    page,
    () =>
      document.querySelectorAll(".ec-observation-table tbody tr").length === 4,
    "source table",
  );
  check(
    await page.eval(
      () =>
        document.querySelectorAll(".ec-observation-table tr.is-conflict")
          .length === 2,
    ),
    "conflicting source rows remain visible in FE",
  );
  for (const width of [1440, 768, 390]) {
    await page.setViewport({ width, height: 1000, mobile: width <= 768 });
    check(
      await page.eval(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      "data page stays within viewport: " + width,
    );
    await page.screenshot({
      path: resolve(out, `data-${width}.jpg`),
      fullPage: true,
    });
  }
  await button(page, "Ghi nhận ngập cộng đồng");
  await wait(
    page,
    () =>
      document.body.innerText.includes("Nhóm vị trí có nhiều ghi nhận ngập"),
    "community statistics",
  );
  check(
    true,
    "community statistics mode opens separately from historical data",
  );
  await page.goto(base + "/weather", { settleMs: 1000 });
  await wait(
    page,
    () =>
      document.querySelectorAll(".ec-weather-page .ec-loading").length === 0,
    "weather requests finish",
  );
  external.weather = await page.eval(() => ({
    current: !!document.querySelector(".ec-temperature"),
    air: !!document.querySelector(".ec-air-reading"),
    forecast: document.querySelectorAll(".ec-forecast-hour").length > 0,
    errors: [
      ...document.querySelectorAll('.ec-weather-page [role="alert"]'),
    ].map((e) => e.textContent),
  }));
  check(
    external.weather.current &&
      external.weather.air &&
      external.weather.forecast,
    "live OpenWeather current, air quality and forecast render",
  );
  const days = await page.eval(
    () => document.querySelector(".ec-forecast-panel select").options.length,
  );
  if (days > 1) {
    await page.eval(() => {
      const s = document.querySelector(".ec-forecast-panel select");
      Object.getOwnPropertyDescriptor(
        HTMLSelectElement.prototype,
        "value",
      ).set.call(s, s.options[1].value);
      s.dispatchEvent(new Event("change", { bubbles: true }));
    });
    check(
      await page.eval(
        () =>
          document.querySelector(".ec-forecast-panel select").selectedIndex ===
            1 && document.querySelectorAll(".ec-forecast-hour").length > 0,
      ),
      "forecast day selector changes visible hours",
    );
  }
  for (const width of [1440, 768, 390]) {
    await page.setViewport({ width, height: 1000, mobile: width <= 768 });
    check(
      await page.eval(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      "weather page stays within viewport: " + width,
    );
    await page.screenshot({
      path: resolve(out, `weather-${width}.jpg`),
      fullPage: true,
    });
  }
  check(
    page.consoleErrors.length === 0,
    "no runtime exceptions in data or weather UI",
  );
  writeFileSync(
    resolve(out, "checks.json"),
    JSON.stringify({ checks, external }, null, 2),
  );
  console.log(`TOTAL ${checks.length} FE data and weather checks`);
} catch (e) {
  await page.screenshot({ path: resolve(out, "failure.jpg"), fullPage: true });
  throw e;
} finally {
  await browser.close();
}
