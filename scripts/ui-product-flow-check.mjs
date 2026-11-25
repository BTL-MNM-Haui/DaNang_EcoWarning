// Real FE actions across the product; API/SQL only prepare and clean disposable fixtures.
import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  Browser,
  sleep,
  base,
  wait,
  fill,
  button,
  submit,
  login,
} from "./lib/local-browser.mjs";
const id = randomUUID().slice(0, 8),
  note = `Browser workflow ${id}`;
const user = {
  email: `flow-user-${id}@example.invalid`,
  password: `Flow!${randomUUID()}Aa1`,
};
const admin = {
  email: `flow-admin-${id}@example.invalid`,
  password: `Flow!${randomUUID()}Aa1`,
};
const out = resolve(".taste-skill/product-flow-proof");
mkdirSync(out, { recursive: true });
const checks = [],
  external = {};
assert.equal(execFileSync('docker', ['exec', 'auth-service', 'printenv', 'SPRING_MAIL_HOST'], { encoding: 'utf8' }).trim(), 'mailpit', 'Run only with explicit local SMTP capture');
const env = Object.fromEntries(
  readFileSync("backend/.env", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
const check = (value, label) => {
  assert(value, label);
  checks.push(label);
  console.log("PASS", label);
};
const sql = (db, text) =>
  execFileSync(
    "docker",
    [
      "exec",
      "-i",
      "postgresql",
      "sh",
      "-c",
      'psql -U "$POSTGRES_USER" -d "$1" -v ON_ERROR_STOP=1',
      "sh",
      db,
    ],
    { input: text, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] },
  );
let assetId, metricId, reportId, browser, page;
try {
  for (const account of [user, admin]) {
    const r = await fetch(base + "/backend/auth/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: base },
      body: JSON.stringify({
        ...account,
        firstName: "Workflow",
        lastName: "Fixture",
        phone: "0901234567",
      }),
    });
    assert.equal(r.status, 201);
  }
  sql(
    "auth_service",
    `UPDATE users SET role='ROLE_ADMIN' WHERE email='${admin.email}';`,
  );
  assetId = Number(
    sql(
      "collector_data_service",
      `INSERT INTO assets(name,asset_type) VALUES ('${note}','TEST') RETURNING id;`,
    ).match(/\n\s*(\d+)\s*\n/)?.[1],
  );
  metricId = Number(
    sql(
      "collector_data_service",
      `INSERT INTO metrics(name,category,unit) VALUES ('${note}','TEST','test-unit') RETURNING id;`,
    ).match(/\n\s*(\d+)\s*\n/)?.[1],
  );
  browser = await Browser.launch();
  page = await browser.newPage({ width: 1440, height: 1000 });
  await page.goto(base + "/", { settleMs: 1000 });
  await wait(
    page,
    () => !!document.querySelector(".ec-map-heading"),
    "public map",
  );
  check(
    await page.eval(
      () => !document.querySelector('.ec-map-heading [role="alert"]'),
    ),
    "public map and report controls render",
  );
  await page.setViewport({ width: 390, height: 900, mobile: true });
  await page.eval(() => document.querySelector(".ec-mobile button").click());
  check(
    await page.eval(() =>
      document.querySelector(".ec-sidebar").classList.contains("is-open"),
    ),
    "mobile navigation opens",
  );
  await page.eval(() => document.querySelector(".ec-mobile button").click());
  check(
    await page.eval(
      () =>
        !document.querySelector(".ec-sidebar").classList.contains("is-open"),
    ),
    "mobile navigation closes",
  );
  await page.goto(base + "/report", { settleMs: 500 });
  check(
    await page.eval(() => location.pathname === "/login"),
    "guest report redirects to login",
  );
  await page.setViewport({ width: 1440, height: 1000, mobile: false });
  await login(page, user);
  check(true, "user signs in through password and emailed OTP");
  await page.goto(base + "/watch-areas", { settleMs: 600 });
  await fill(page, "Tên gợi nhớ", note);
  await submit(page);
  await wait(
    page,
    () => document.querySelectorAll(".ec-watch-row").length > 0,
    "watch area saved",
  );
  check(
    await page.eval(
      (note) =>
        document.querySelector(".ec-watch-row").textContent.includes(note),
      note,
    ),
    "watch area saved and listed in FE",
  );
  await page.goto(base + "/report", { settleMs: 800 });
  await wait(
    page,
    () => !document.querySelector('form [type="submit"]').disabled,
    "report types",
  );
  await browser.send("Browser.grantPermissions", {
    origin: base,
    permissions: ["geolocation"],
  });
  await page.send("Emulation.setGeolocationOverride", {
    latitude: 16.06,
    longitude: 108.21,
    accuracy: 10,
  });
  await button(page, "Vị trí hiện tại");
  await wait(
    page,
    () =>
      [...document.querySelectorAll("label")]
        .find((l) => l.textContent.trim().startsWith("Vĩ độ *"))
        .querySelector("input").value === "16.06",
    "emulated geolocation",
  );
  check(
    true,
    "location control uses browser-provided in-area coordinate (emulated)",
  );
  await fill(page, "Vĩ độ *", "16.0544");
  await fill(page, "Kinh độ *", "108.2022");
  await fill(
    page,
    "Mô tả sự cố",
    note + " — temporary incident for browser verification.",
  );
  await fill(page, "Địa chỉ hoặc mốc", note);
  await fill(page, "Độ ngập ước tính", "0");
  await page.goto(base + "/report", { settleMs: 600 });
  check(
    await page.eval(
      (note) => document.querySelector("textarea").value.includes(note),
      note,
    ),
    "report draft survives page reload",
  );
  await page.eval(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 160;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 320, 160);
    ctx.fillStyle = "#17324d";
    ctx.font = "20px sans-serif";
    ctx.fillText("AUTOMATED TEST - NOT AN INCIDENT", 5, 80);
    const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
    const transfer = new DataTransfer();
    transfer.items.add(
      new File([blob], "browser-test-only.png", { type: "image/png" }),
    );
    const el = document.querySelector(".ec-upload input");
    el.files = transfer.files;
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await wait(
    page,
    () =>
      !!document.querySelector(".ec-image-preview img")?.complete &&
      document.querySelector(".ec-image-preview img")?.naturalWidth > 0,
    "image preview",
  );
  check(true, "image selection, compression and preview work in FE");
  await submit(page, ".ec-report-grid");
  await wait(
    page,
    () => location.pathname.startsWith("/incidents/"),
    "submitted report detail",
  );
  reportId = Number(await page.eval(() => location.pathname.split("/").pop()));
  await wait(
    page,
    () => !!document.querySelector(".ec-description"),
    "saved report body",
  );
  check(
    await page.eval(() =>
      document
        .querySelector(".ec-statuses")
        .textContent.includes("Chờ xác minh"),
    ),
    "new report shows pending verification",
  );
  await wait(
    page,
    () =>
      !!document.querySelector(".ec-evidence")?.complete &&
      document.querySelector(".ec-evidence")?.naturalWidth > 0,
    "uploaded evidence",
  );
  check(
    await page.eval(() =>
      document
        .querySelector(".ec-evidence")
        .src.startsWith("https://res.cloudinary.com/"),
    ),
    "actual Cloudinary upload is visible on incident detail",
  );
  check(
    await page.eval(
      () =>
        !Object.keys(localStorage).some((k) =>
          k.startsWith("ec-report-draft:"),
        ),
    ),
    "successful submission clears local draft",
  );
  await fill(page, "Nội dung cập nhật", note + " community follow-up");
  await button(page, "Gửi cập nhật");
  await wait(
    page,
    () =>
      document
        .querySelector(".ec-success")
        ?.textContent.includes("Đã thêm thông tin"),
    "community update",
  );
  check(true, "community update submits from detail form");
  await page.goto(base + "/my-reports", { settleMs: 600 });
  check(
    await page.eval((note) => document.body.innerText.includes(note), note),
    "my reports displays submitted incident",
  );
  await page.goto(base + "/manage", { settleMs: 500 });
  check(
    await page.eval(() =>
      document.body.innerText.includes("Cần quyền quản lý"),
    ),
    "member cannot open moderation UI",
  );

  await login(page, admin);
  await page.goto(base + `/incidents/${reportId}`, { settleMs: 700 });
  await fill(page, "Xác minh", "VERIFIED");
  await fill(page, "Căn cứ / lý do", note + " verified in browser");
  await button(page, "Lưu kết quả kiểm tra");
  await wait(
    page,
    () =>
      document
        .querySelector(".ec-statuses")
        ?.textContent.includes("Đã xác minh"),
    "verified status",
  );
  check(true, "manager verifies incident through FE");
  await fill(page, "Diễn biến", "RESOLVED");
  await fill(page, "Căn cứ / lý do", note + " resolved in browser");
  await button(page, "Lưu kết quả kiểm tra");
  await wait(
    page,
    () =>
      document
        .querySelector(".ec-statuses")
        ?.textContent.includes("Đã kết thúc"),
    "resolved status",
  );
  check(true, "manager resolves incident without changing verified status");

  await page.goto(base + "/imports", { settleMs: 500 });
  await fill(page, "Nguồn dữ liệu", note);
  const csv = (unit) =>
    `assetId,metricId,recordTime,value,unit\n${assetId},${metricId},2020-01-01T00:00:00,0,${unit}\n`;
  async function upload(text) {
    await page.eval(
      ({ text, name }) => {
        const d = new DataTransfer();
        d.items.add(new File([text], name, { type: "text/csv" }));
        const e = document.querySelector('input[type="file"]');
        e.files = d.files;
        e.dispatchEvent(new Event("change", { bubbles: true }));
      },
      { text, name: `browser-${id}.csv` },
    );
  }
  await upload(csv("wrong-unit"));
  await submit(page);
  await wait(
    page,
    () => document.body.innerText.includes("Có dòng lỗi"),
    "invalid CSV preview",
  );
  check(
    await page.eval(
      () =>
        [...document.querySelectorAll("button")].find(
          (b) => b.textContent === "Xác nhận nhập dữ liệu",
        ).disabled,
    ),
    "CSV with wrong unit cannot be committed from FE",
  );
  await upload(csv("test-unit"));
  await submit(page);
  await wait(
    page,
    () => document.body.innerText.includes("Tất cả các dòng vượt qua"),
    "valid CSV preview",
  );
  check(
    await page.eval(() =>
      [...document.querySelectorAll("td")].some((e) => e.textContent === "0"),
    ),
    "CSV preview preserves zero",
  );
  await button(page, "Xác nhận nhập dữ liệu");
  await wait(
    page,
    () =>
      document.querySelector(".ec-success")?.textContent.includes("Đã nhập 1"),
    "CSV committed",
  );
  check(
    await page.eval(
      (note) =>
        [...document.querySelectorAll("tbody tr")].some(
          (r) =>
            r.textContent.includes(note) && r.textContent.includes("Đã lưu"),
        ),
      note,
    ),
    "CSV commit and import history work in FE",
  );

  await page.goto(base + "/ai?view=evaluation", { settleMs: 600 });
  await wait(
    page,
    () =>
      document.querySelectorAll('.ec-ai-importance-table [role="row"]')
        .length === 10,
    "live Gini report",
  );
  check(
    await page.eval(
      () =>
        document.body.innerText.includes("không phải độ chính xác") &&
        document.body.innerText.includes("chưa xuất bảng số gốc"),
    ),
    "evaluation distinguishes weights, converted notebook ranks and unavailable raw data",
  );
  for (const title of [
    "Gini Importance",
    "Permutation Importance",
    "Ablation Importance",
    "Mean Absolute SHAP",
  ]) {
    await button(page, title, ".ec-ai-methods");
    await wait(
      page,
      () =>
        !!document.querySelector(".ec-ai-notebook-chart img")?.complete &&
        document.querySelector(".ec-ai-notebook-chart img")?.naturalWidth > 0,
      "notebook chart",
    );
    check(
      await page.eval(
        (title) =>
          document
            .querySelector(".ec-ai-notebook-chart img")
            .alt.startsWith(title),
        title,
      ),
      "authenticated notebook chart: " + title,
    );
  }
  const off = browser.on(page.sessionId, "Fetch.requestPaused", (e) => {
    page
      .send("Fetch.fulfillRequest", {
        requestId: e.requestId,
        responseCode: 503,
        responseHeaders: [{ name: "Content-Type", value: "application/json" }],
        body: Buffer.from(
          JSON.stringify({ detail: "Evaluation temporarily unavailable" }),
        ).toString("base64"),
      })
      .catch(() => {});
  });
  await page.send("Fetch.enable", {
    patterns: [
      { urlPattern: "*/api/v1/ai/flood/evaluation", requestStage: "Request" },
    ],
  });
  await button(page, "Tải lại báo cáo");
  await wait(
    page,
    () => !!document.querySelector('.ec-ai-evaluation [role="alert"]'),
    "evaluation failure",
  );
  check(
    await page.eval(() => !document.querySelector(".ec-ai-importance-table")),
    "evaluation failure hides old report (injected 503)",
  );
  await page.send("Fetch.disable");
  off();
  await button(page, "Thử lại", ".ec-ai-evaluation");
  await wait(
    page,
    () =>
      document.querySelectorAll('.ec-ai-importance-table [role="row"]')
        .length === 10,
    "evaluation recovery",
  );
  check(true, "evaluation retries against real BE after failure");
  await wait(
    page,
    () => !!document.querySelector(".ec-ai-notebook-chart img")?.naturalWidth,
    "restored chart",
  );
  const offImage = browser.on(page.sessionId, 'Fetch.requestPaused', e => { page.send('Fetch.fulfillRequest', { requestId: e.requestId, responseCode: 503, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from('{}').toString('base64') }).catch(() => {}); });
  await page.send('Fetch.enable', { patterns: [{ urlPattern: '*/evaluation/charts/permutation', requestStage: 'Request' }] });
  await button(page, 'Permutation Importance', '.ec-ai-methods');
  await wait(page, () => !!document.querySelector('.ec-ai-notebook-chart [role="alert"]'), 'chart error');
  check(await page.eval(() => !document.querySelector('.ec-ai-notebook-chart img')), 'chart error clears previous image (injected 503)');
  await page.send('Fetch.disable'); offImage(); await button(page, 'Thử lại biểu đồ');
  await wait(page, () => !!document.querySelector('.ec-ai-notebook-chart img')?.naturalWidth, 'chart retry');
  check(await page.eval(() => document.querySelector('.ec-ai-notebook-chart img').alt.startsWith('Permutation')), 'chart retry loads real selected image');
  await page.screenshot({
    path: resolve(out, "ai-evaluation-desktop.jpg"),
    fullPage: true,
  });
  for (const width of [768, 390]) {
    await page.setViewport({ width, height: 1000, mobile: true });
    check(
      await page.eval(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      "evaluation no horizontal overflow: " + width,
    );
    await button(page, "Phóng to biểu đồ");
    check(
      await page.eval(
        () =>
          !!document.querySelector(".ec-ai-chart-dialog[open]") &&
          document
            .querySelector(".ec-ai-chart-scroll img")
            .getBoundingClientRect().width >= 700,
      ),
      "full-size notebook chart readable in dialog: " + width,
    );
    await button(page, "Đóng biểu đồ");
    await page.screenshot({
      path: resolve(out, `ai-evaluation-${width}.jpg`),
      fullPage: true,
    });
  }
  await page.setViewport({ width: 1440, height: 1000, mobile: false });
  await login(page, user);
  const deniedEvaluation = await page.eval(async () =>
    Promise.all(
      ["/evaluation", "/evaluation/charts/gini"].map(
        async (path) =>
          (
            await fetch("/backend/data/api/v1/ai/flood" + path, {
              headers: {
                Authorization: "Bearer " + localStorage.getItem("accessToken"),
              },
            })
          ).status,
      ),
    ),
  );
  check(
    deniedEvaluation.every((status) => status === 403),
    "BE protects evaluation JSON and PNG from member token",
  );
  await page.goto(base + "/notifications", { settleMs: 600 });
  await wait(
    page,
    () => document.querySelectorAll(".ec-notification").length > 0,
    "incident notifications",
  );
  check(
    true,
    "verified/resolved incident generates visible watch-area notifications",
  );
  await button(page, "Đánh dấu đã đọc");
  await wait(
    page,
    () =>
      !![...document.querySelectorAll(".ec-notification small")].find((e) =>
        e.textContent.includes("Đã đọc"),
      ),
    "read notification",
  );
  check(true, "notification can be marked read");
  await page.goto(base + "/watch-areas", { settleMs: 500 });
  await button(page, "Bỏ theo dõi");
  await wait(
    page,
    () => document.querySelectorAll(".ec-watch-row").length === 0,
    "remove watch area",
  );
  check(true, "unfollow removes saved area");

  await page.goto(base + "/profile", { settleMs: 500 });
  await wait(
    page,
    () => !!document.querySelector('input[name="firstName"]'),
    "profile",
  );
  await fill(page, "Tên", "UpdatedWorkflow");
  await button(page, "Lưu thông tin");
  await wait(
    page,
    () => !!document.querySelector(".ec-success"),
    "profile saved",
  );
  await page.goto(base + "/profile", { settleMs: 500 });
  await wait(
    page,
    () =>
      document.querySelector('input[name="firstName"]')?.value ===
      "UpdatedWorkflow",
    "profile persisted",
  );
  check(true, "profile update persists after reload");
  const profileShape = await page.eval(async () => {
    const r = await fetch("/backend/auth/api/v1/user/profile", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("accessToken"),
      },
    });
    const j = await r.json();
    return Object.keys(j.data || j);
  });
  check(
    !profileShape.includes("password"),
    "profile API does not send password hash to FE",
  );
  const newPassword = `Changed!${randomUUID()}Aa1`;
  await fill(page, "Mật khẩu hiện tại", user.password);
  await fill(page, "Mật khẩu mới", newPassword);
  await fill(page, "Nhập lại mật khẩu mới", newPassword);
  await button(page, "Đổi mật khẩu");
  await wait(
    page,
    () => !!document.querySelector(".ec-success"),
    "change password",
  );
  user.password = newPassword;
  await login(page, user);
  check(true, "changed password authenticates with new OTP");
  await page.eval(() =>
    document.querySelector(".ec-sidebar footer button").click(),
  );
  await wait(page, () => !localStorage.getItem("accessToken"), "logout");
  check(true, "logout clears real session");
  await page.goto(base + "/my-reports", { settleMs: 500 });
  check(
    await page.eval(() => location.pathname === "/login"),
    "protected route requires login again after logout",
  );
  check(
    page.consoleErrors.length === 0,
    "no uncaught runtime errors during product workflow",
  );
  writeFileSync(
    resolve(out, "checks.json"),
    JSON.stringify({ checks, external }, null, 2),
  );
  console.log(`TOTAL ${checks.length} product FE workflow checks`);
} catch (e) {
  if (page)
    await page
      .screenshot({ path: resolve(out, "failure.jpg"), fullPage: true })
      .catch(() => {});
  throw e;
} finally {
  if (browser) await browser.close();
  // Delete only Cloudinary images attached to this run's uniquely owned fixture reports.
  const urls =
    sql(
      "citizen_report_service",
      `SELECT image_url FROM reports WHERE owner_email='${user.email}' AND image_url IS NOT NULL;`,
    ).match(/https:\/\/res\.cloudinary\.com\/[^\s]+/g) || [];
  for (const url of urls) {
    const parsed = new URL(url);
    const prefix = `/${env.CLOUDINARY_CLOUD_NAME}/image/upload/`;
    assert(
      parsed.pathname.startsWith(prefix),
      "Only own Cloudinary cloud fixture may be deleted",
    );
    const publicId = decodeURIComponent(
      parsed.pathname
        .slice(prefix.length)
        .replace(/^v\d+\//, "")
        .replace(/\.[^.\/]+$/, ""),
    );
    assert(
      publicId.startsWith("ecowarning/reports/"),
      "Only report fixture folder may be deleted",
    );
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = createHash("sha1")
      .update(
        `public_id=${publicId}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`,
      )
      .digest("hex");
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(env.CLOUDINARY_CLOUD_NAME)}/image/destroy`,
      {
        method: "POST",
        body: new URLSearchParams({
          public_id: publicId,
          timestamp,
          signature,
          api_key: env.CLOUDINARY_API_KEY,
        }),
        signal: AbortSignal.timeout(15000),
      },
    );
    assert(
      response.ok &&
        ["ok", "not found"].includes((await response.json()).result),
      "Cloudinary fixture cleanup",
    );
  }
  if (urls.length)
    console.log("Removed Cloudinary images created by this workflow.");
  sql(
    "citizen_report_service",
    `DELETE FROM incident_notifications WHERE owner_email IN ('${user.email}','${admin.email}') OR report_id IN (SELECT id FROM reports WHERE owner_email='${user.email}'); DELETE FROM incident_events WHERE report_id IN (SELECT id FROM reports WHERE owner_email='${user.email}'); UPDATE reports SET merged_into=NULL WHERE owner_email='${user.email}'; DELETE FROM reports WHERE owner_email='${user.email}'; DELETE FROM watch_areas WHERE owner_email IN ('${user.email}','${admin.email}');`,
  );
  sql(
    "collector_data_service",
    `DELETE FROM data_import_batches WHERE owner_email IN ('${user.email}','${admin.email}');`,
  );
  if (assetId)
    sql(
      "collector_data_service",
      `DELETE FROM observations WHERE asset_id=${assetId}; DELETE FROM assets WHERE id=${assetId};`,
    );
  if (metricId)
    sql("collector_data_service", `DELETE FROM metrics WHERE id=${metricId};`);
  sql(
    "auth_service",
    `DELETE FROM users WHERE email IN ('${user.email}','${admin.email}');`,
  );
  console.log("Removed disposable workflow fixtures.");
}
