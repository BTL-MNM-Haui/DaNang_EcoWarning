// Local browser integration: real password + emailed OTP, real BE and AI responses.
// Requires start.ps1 -LocalMail and prepare-local-test-accounts.mjs.
import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const { Browser, sleep } = await import(
  pathToFileURL(resolve(process.env.TASTE_SKILL_DIR, "scripts/lib/cdp.mjs"))
    .href
);
const accounts = JSON.parse(
  readFileSync(".delivery/local-test-accounts.json", "utf8"),
);
const base = "http://localhost:4173",
  out = resolve(".taste-skill/ai-workspace-proof");
mkdirSync(out, { recursive: true });
const checks = [],
  requests = [];
function check(value, label) {
  assert(value, label);
  checks.push(label);
  console.log("PASS", label);
}
async function wait(page, fn, label) {
  for (let i = 0; i < 100; i++) {
    if (await page.eval(fn)) return;
    await sleep(150);
  }
  throw Error(
    "UI timeout: " +
      label +
      "; " +
      (await page.eval(
        () =>
          document.querySelector('[role="alert"]')?.textContent ||
          document.querySelector("h1")?.textContent,
      )),
  );
}
async function set(page, selector, value) {
  await page.eval(
    ({ selector, value }) => {
      const el = document.querySelector(selector);
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      ).set.call(el, value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    },
    { selector, value },
  );
}
async function click(page, selector) {
  await page.eval(
    (selector) => document.querySelector(selector).click(),
    selector,
  );
}
async function login(page, role, alreadyOnLogin = false) {
  const account = accounts.find((a) => a.role === role);
  assert(account, "local account exists");
  const before = new Set(
    (
      await (await fetch("http://localhost:8025/api/v1/messages")).json()
    ).messages.map((m) => m.ID),
  );
  if (!alreadyOnLogin) await page.goto(base + "/login", { settleMs: 600 });
  await set(page, 'input[type="email"]', account.email);
  await set(page, 'input[type="password"]', account.password);
  await page.eval(() => document.querySelector("form").requestSubmit());
  await wait(
    page,
    () => !!document.querySelector('input[autocomplete="one-time-code"]'),
    "OTP form",
  );
  let code;
  for (let i = 0; i < 50; i++) {
    const list = await (
      await fetch("http://localhost:8025/api/v1/messages")
    ).json();
    const mail = list.messages.find(
      (m) => !before.has(m.ID) && m.To.some((t) => t.Address === account.email),
    );
    if (mail) {
      const detail = await (
        await fetch("http://localhost:8025/api/v1/message/" + mail.ID)
      ).json();
      code = detail.HTML.match(/class="otp"[^>]*>\s*(\d{6})/)?.[1];
      break;
    }
    await sleep(200);
  }
  assert(code, "real OTP delivered");
  await set(page, 'input[autocomplete="one-time-code"]', code);
  await page.eval(() => document.querySelector("form").requestSubmit());
  await wait(
    page,
    () =>
      !!localStorage.getItem("accessToken") && location.pathname !== "/login",
    "login session",
  );
}
const browser = await Browser.launch();
try {
  const page = await browser.newPage({ width: 1440, height: 1000 });
  await page.send("Network.enable");
  browser.on(page.sessionId, "Network.requestWillBeSent", ({ request }) => {
    if (request.url.includes("/backend/data/api/v1/ai/flood/predict"))
      requests.push({
        url: request.url,
        method: request.method,
        payload: JSON.parse(request.postData),
      });
  });
  await page.goto(base + "/", { settleMs: 600 });
  check(
    await page.eval(
      () => !!document.querySelector('.ec-map-actions a[href="/ai"]'),
    ),
    "AI entry visible on map",
  );
  await click(page, '.ec-map-actions a[href="/ai"]');
  await wait(page, () => !!document.querySelector(".ec-ai-input"), "AI page");
  check(
    await page.eval(() =>
      document
        .querySelector('.ec-sidebar a[href="/ai"]')
        .textContent.includes("Phân tích AI"),
    ),
    "AI in primary navigation for guest",
  );
  check(
    await page.eval(
      () =>
        !!document.querySelector('.ec-ai-access a[href="/login"]') &&
        document.querySelector('.ec-ai-submit [type="submit"]').disabled,
    ),
    "guest sees preview and explicit login action",
  );
  await click(page, '[data-ai-sample="negative"]');
  check(
    await page.eval(() =>
      document.querySelector(".ec-ai-count").textContent.includes("9/9"),
    ),
    "guest can inspect dataset sample",
  );
  await click(page, '.ec-ai-access a[href="/login"]');
  await login(page, "ROLE_ADMIN", true);
  check(
    await page.eval(() => location.pathname === "/ai"),
    "AI login action returns to AI workspace after real OTP",
  );
  await page.goto(base + "/ai-flood", { settleMs: 700 });
  await wait(
    page,
    () => !document.querySelector('.ec-ai-submit [type="submit"]').disabled,
    "live model",
  );
  check(
    await page.eval(
      () =>
        location.pathname === "/ai" &&
        document
          .querySelector(".ec-ai-service-state")
          .textContent.includes("Đã kết nối"),
    ),
    "legacy route resolves to AI workspace with live model",
  );
  for (const [sample, label] of [
    ["negative", "No_Flood"],
    ["positive", "Flood"],
  ]) {
    await click(page, `[data-ai-sample="${sample}"]`);
    await page.eval(() =>
      document.querySelector(".ec-ai-input").requestSubmit(),
    );
    await wait(
      page,
      () => !!document.querySelector(".ec-ai-classification"),
      "inference result",
    );
    check(
      await page.eval(
        (label) =>
          document.querySelector(".ec-ai-classification code").textContent ===
          label,
        label,
      ),
      "real FE → BE → AI sample: " + label,
    );
    check(
      await page.eval(
        () =>
          document.querySelector("meter").value >= 0 &&
          document.querySelector("meter").value <= 1,
      ),
      "score within response range: " + label,
    );
  }
  check(
    requests.length === 2 &&
      requests.every(
        (r) =>
          r.method === "POST" && Object.keys(r.payload.features).length === 9,
      ),
    "browser sends full nine-feature contract to backend proxy",
  );
  await page.eval(() => {
    window.__aiBlob = null;
    URL.createObjectURL = (blob) => {
      window.__aiBlob = blob;
      return "blob:local-check";
    };
    HTMLAnchorElement.prototype.click = () => {};
  });
  await click(page, ".ec-ai-result button");
  const exported = await page.eval(async () =>
    JSON.parse(await window.__aiBlob.text()),
  );
  check(
    exported.response.label === "Flood" &&
      exported.payload.features.X === requests[1].payload.features.X &&
      exported.experimental === true,
    "download contains matching input, actual result and scope",
  );
  await set(page, "#ai-X", "");
  check(
    await page.eval(() => !document.querySelector(".ec-ai-classification")),
    "changing input clears stale result",
  );
  await page.eval(() => document.querySelector(".ec-ai-input").requestSubmit());
  await wait(
    page,
    () => !!document.querySelector('form [role="alert"]'),
    "missing confirmation",
  );
  check(
    requests.length === 2,
    "missing input requires explicit imputation consent before request",
  );
  await click(page, '.ec-ai-imputation input[type="checkbox"]');
  await page.eval(() => document.querySelector(".ec-ai-input").requestSubmit());
  await wait(
    page,
    () => !!document.querySelector(".ec-ai-classification"),
    "imputed result",
  );
  check(
    await page.eval(
      () =>
        document.querySelector(".ec-ai-result-facts dd").textContent === "X",
    ),
    "real model reports X as imputed",
  );
  // Failure injection exercises only the error state; successful results above are unmocked.
  const off = browser.on(page.sessionId, "Fetch.requestPaused", (e) => {
    page
      .send("Fetch.fulfillRequest", {
        requestId: e.requestId,
        responseCode: 503,
        responseHeaders: [{ name: "Content-Type", value: "application/json" }],
        body: Buffer.from(
          JSON.stringify({
            detail: "Dịch vụ AI chưa sẵn sàng; chưa có kết quả dự đoán.",
          }),
        ).toString("base64"),
      })
      .catch(() => {});
  });
  await page.send("Fetch.enable", {
    patterns: [
      { urlPattern: "*/api/v1/ai/flood/predict", requestStage: "Request" },
    ],
  });
  await click(page, '[data-ai-sample="positive"]');
  await page.eval(() => document.querySelector(".ec-ai-input").requestSubmit());
  await wait(
    page,
    () => !!document.querySelector('form [role="alert"]'),
    "503 state",
  );
  check(
    await page.eval(
      () =>
        !document.querySelector(".ec-ai-classification") &&
        document
          .querySelector('form [role="alert"]')
          .textContent.includes("chưa sẵn sàng"),
    ),
    "503 displays error without manufacturing a result (injected)",
  );
  await page.send("Fetch.disable");
  off();
  for (const width of [1440, 768, 390]) {
    await page.setViewport({ width, height: 1000, mobile: width === 390 });
    await click(page, '[data-ai-sample="positive"]');
    await page.eval(() =>
      document.querySelector(".ec-ai-input").requestSubmit(),
    );
    await wait(
      page,
      () => !!document.querySelector(".ec-ai-classification"),
      "responsive inference",
    );
    check(
      await page.eval(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      "no horizontal overflow: " + width,
    );
    check(
      await page.eval(() =>
        [
          ...document.querySelectorAll(
            ".ec-ai-connection > span, .ec-ai-panel, .ec-ai-fields input",
          ),
        ].every((e) => e.getBoundingClientRect().right <= innerWidth + 1),
      ),
      "connection and inputs remain within viewport: " + width,
    );
    check(
      await page.eval(() =>
        [...document.querySelectorAll(".ec-ai-fields input")].every(
          (e) => e.labels?.length > 0,
        ),
      ),
      "numeric input labels: " + width,
    );
    if (width <= 850) {
      check(await page.eval(() => {
        const heading = document.querySelector('.ec-ai-result h2');
        return document.activeElement === heading && heading.getBoundingClientRect().top >= 55 && heading.getBoundingClientRect().top < innerHeight;
      }), 'mobile inference brings result into view: ' + width);
      await page.screenshot({ path: resolve(out, `manager-${width}-result.jpg`), quality: 80 });
    }
    await page.eval(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
    await sleep(100);
    await page.screenshot({
      path: resolve(out, `manager-${width}.jpg`),
      fullPage: true,
      quality: 80,
    });
  }
  check(page.consoleErrors.length === 0, "no browser runtime exceptions");
  await page.close();
  const member = await browser.newPage({ width: 1440, height: 1000 });
  await login(member, "ROLE_USER");
  await member.goto(base + "/ai", { settleMs: 600 });
  check(
    await member.eval(
      () =>
        document.body.innerText.includes("Tài khoản này chưa có quyền") &&
        document.querySelector('.ec-ai-submit [type="submit"]').disabled,
    ),
    "member sees explicit permission requirement",
  );
  const forbidden = await member.eval(
    async () =>
      (
        await fetch("/backend/data/api/v1/ai/flood/model", {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("accessToken"),
          },
        })
      ).status,
  );
  check(forbidden === 403, "backend independently rejects real member token");
  await member.close();
  writeFileSync(
    resolve(out, "checks.json"),
    JSON.stringify(
      { checks, predictionRequests: requests.length, injectedFailureRequests: 1 },
      null,
      2,
    ),
  );
  console.log(`TOTAL ${checks.length} AI workspace browser checks`);
} finally {
  await browser.close();
}
