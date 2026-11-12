import fs from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHmac, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
const { Browser, sleep } = await import(
  pathToFileURL(resolve(process.env.TASTE_SKILL_DIR, "scripts/lib/cdp.mjs"))
    .href
);
const base = process.argv[2] || "http://localhost:4173",
  evidence = resolve("docs/design-evidence"),
  scratch = resolve(".taste-skill/final-all-layout");
fs.mkdirSync(scratch, { recursive: true });
const env = Object.fromEntries(
  fs
    .readFileSync("backend/.env", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
const email = `layout-review-${randomUUID().slice(0, 8)}@example.invalid`,
  password = `Review!${randomUUID()}A1`;
const results = {
  checks: [],
  routes: [],
  fixture:
    "Disposable local account, removed after verification; no real account credentials recorded.",
};
function ok(v, label) {
  assert.ok(v, label);
  results.checks.push(label);
  console.log("PASS", label);
}
const register = await fetch(base + "/backend/auth/api/v1/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    firstName: "Layout",
    lastName: "Review",
    email,
    password,
    phone: "0901234567",
  }),
});
assert.equal(register.status, 201);
const sql = (s) =>
  execFileSync(
    "docker",
    [
      "exec",
      "-i",
      "postgresql",
      "sh",
      "-c",
      'psql -U "$POSTGRES_USER" -d auth_service -v ON_ERROR_STOP=1',
    ],
    { input: s, stdio: ["pipe", "pipe", "pipe"] },
  );
sql(`UPDATE users SET role='ROLE_ADMIN' WHERE email='${email}';`);
const now = Math.floor(Date.now() / 1000),
  h = Buffer.from('{"alg":"HS256","typ":"JWT"}').toString("base64url"),
  p = Buffer.from(
    JSON.stringify({
      sub: email,
      role: "ROLE_ADMIN",
      token_use: "access",
      iat: now,
      exp: now + 1800,
    }),
  ).toString("base64url");
const token = `${h}.${p}.${createHmac("sha256", Buffer.from(env.JWT_SECRET_KEY, "base64")).update(`${h}.${p}`).digest("base64url")}`;
const b = await Browser.launch();
async function wait(page, fn) {
  for (let i = 0; i < 60; i++) {
    if (await page.eval(fn)) return true;
    await sleep(200);
  }
  return false;
}
try {
  const response = await (
    await fetch(base + "/backend/reports/api/v1/reports?size=1")
  ).json();
  const detail = response.items?.[0]?.id;
  for (const width of [1440, 768, 390]) {
    const page = await b.newPage({ width, height: 1000, mobile: width <= 768 });
    await page.goto(base + "/login", { settleMs: 1000 });
    await page.eval(
      ({ token, email }) => {
        localStorage.setItem("accessToken", token);
        localStorage.setItem(
          "user",
          JSON.stringify({ email, role: "ROLE_ADMIN" }),
        );
      },
      { token, email },
    );
    for (const route of [
      "/",
      "/weather",
      "/data",
      "/report",
      "/my-reports",
      "/watch-areas",
      "/notifications",
      "/manage",
      "/imports",
      "/profile",
      ...(detail ? ["/incidents/" + detail] : []),
    ]) {
      await page.goto(base + route, { settleMs: 800 });
      ok(
        await wait(page, () => !!document.querySelector("h1")),
        "renders " + route + " " + width,
      );
      await page.eval("document.fonts.ready");
      ok(
        await page.eval(() => location.pathname !== "/login"),
        "session preserved " + route + " " + width,
      );
      ok(
        await page.eval(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        "no horizontal overflow " + route + " " + width,
      );
      const name = route === "/" ? "map" : route.replaceAll("/", "-").slice(1);
      await page.screenshot({
        path: resolve(scratch, name + "-" + width + ".jpg"),
        format: "jpeg",
        quality: 75,
      });
      results.routes.push({ route, width });
      if (route === "/data") {
        ok(
          await wait(
            page,
            () => !!document.querySelector(".ec-dataset-heading h2"),
          ),
          "dataset loaded " + width,
        );
        ok(
          await page.eval(() => document.fonts.check('16px "Be Vietnam Pro"')),
          "Vietnamese font loaded " + width,
        );
        ok(
          await page.eval(
            () =>
              parseFloat(
                getComputedStyle(
                  document.querySelector(".ec-dataset-fields select"),
                ).fontSize,
              ) >= 16,
          ),
          "readable controls " + width,
        );
        if (width === 1440)
          await page.screenshot({
            path: resolve(evidence, "data-overview.jpg"),
            format: "jpeg",
            quality: 80,
          });
        await page.eval(() => {
          const s = document.querySelector(
            ".ec-dataset-fields label:last-child select",
          );
          s.value = "94";
          s.dispatchEvent(new Event("change", { bubbles: true }));
        });
        ok(
          await wait(
            page,
            () =>
              document.querySelector(".ec-dataset-heading h2")?.textContent ===
              "Điều - Diện tích trồng",
          ),
          "cashew source selected " + width,
        );
        ok(
          await wait(
            page,
            () => !!document.querySelector(".ec-quality-summary"),
          ),
          "conflict visible " + width,
        );
        await page.eval(() =>
          document.querySelector(".ec-quality-summary button").click(),
        );
        ok(
          await page.eval(
            () =>
              document.querySelectorAll(".ec-observation-table tr.is-conflict")
                .length === 2,
          ),
          "both conflicting records retained " + width,
        );
        ok(
          await page.eval(
            () =>
              document
                .querySelector(".ec-observation-table")
                .innerText.includes("17,5") &&
              document
                .querySelector(".ec-observation-table")
                .innerText.includes("18"),
          ),
          "source values unchanged " + width,
        );
        await sleep(250);
        if (width === 1440 || width === 390)
          await page.screenshot({
            path: resolve(evidence, "data-conflicts-" + width + ".jpg"),
            format: "jpeg",
            quality: 80,
          });
      }
      if (route === "/report" && width === 1440)
        await page.screenshot({
          path: resolve(evidence, "report-form.jpg"),
          format: "jpeg",
          quality: 80,
        });
    }
    await page.eval(() => localStorage.clear());
    for (const route of ["/login", "/register", "/forgot-password"]) {
      await page.goto(base + route, { settleMs: 800 });
      ok(
        await wait(page, () => !!document.querySelector(".ec-auth-sheet h1")),
        "account renders " + route + " " + width,
      );
      ok(
        await page.eval(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        "account fits " + route + " " + width,
      );
      if (route === "/login" && width === 1440)
        await page.screenshot({
          path: resolve(evidence, "account-layout.jpg"),
          format: "jpeg",
          quality: 80,
        });
    }
    await page.close();
  }
  console.log("TOTAL", results.checks.length);
} finally {
  await b.close();
  sql(`DELETE FROM users WHERE email='${email}';`);
  fs.writeFileSync(
    resolve(evidence, "all-layout-check.json"),
    JSON.stringify(results, null, 2) + "\n",
  );
  console.log("Removed disposable layout account");
}
