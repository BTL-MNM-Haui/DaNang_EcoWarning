import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const { Browser, sleep } = await import(
  pathToFileURL(resolve(process.env.TASTE_SKILL_DIR, "scripts/lib/cdp.mjs"))
    .href
);
const base = process.argv[2] || "http://localhost:4173",
  out = resolve(process.argv[3] || ".taste-skill/bright-proof");
mkdirSync(out, { recursive: true });
const report = { checks: [], contrast: [], routes: [] };
const ok = (v, s) => {
  assert(v, s);
  report.checks.push(s);
  console.log("PASS", s);
};
const lum = (color) => {
  const v = color
    .match(/[\d.]+/g)
    .slice(0, 3)
    .map(Number)
    .map((x) => x / 255)
    .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return v[0] * 0.2126 + v[1] * 0.7152 + v[2] * 0.0722;
};
const ratio = (a, b) =>
  (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
async function wait(p, fn) {
  for (let i = 0; i < 80; i++) {
    if (await p.eval(fn)) return;
    await sleep(200);
  }
  throw Error("UI not ready");
}
async function contrast(
  p,
  selector,
  background,
  label,
  threshold = 4.5,
  border = false,
) {
  const colors = await p.eval(
    ({ selector, background, border }) => {
      const e = document.querySelector(selector),
        bg = document.querySelector(background);
      const s = getComputedStyle(e);
      return {
        foreground: border ? s.borderTopColor : s.color,
        background: getComputedStyle(bg).backgroundColor,
      };
    },
    { selector, background, border },
  );
  const value = ratio(colors.foreground, colors.background);
  report.contrast.push({ label, ...colors, ratio: value, threshold });
  ok(value >= threshold, label + " contrast " + value.toFixed(2));
}
const b = await Browser.launch();
try {
  for (const width of [1440, 768, 390])
    for (const route of ["/weather", "/data", "/login", "/"]) {
      const p = await b.newPage({ width, height: 1000, mobile: width <= 768 });
      await p.goto(base + route, { settleMs: 1000 });
      await wait(p, () => !!document.querySelector("h1"));
      await p.eval("document.fonts.ready");
      ok(
        await p.eval(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        "no overflow " + route + " " + width,
      );
      report.routes.push({ route, width });
      if (route === "/weather") {
        await contrast(
          p,
          ".ec-current-weather h2",
          ".ec-current-weather",
          "weather heading " + width,
        );
        await wait(
          p,
          () =>
            !!document.querySelector(".ec-current-weather .ec-source") ||
            !!document.querySelector(".ec-current-weather .ec-error"),
        );
        if (
          await p.eval(
            () => !!document.querySelector(".ec-current-weather .ec-source"),
          )
        ) {
          await contrast(
            p,
            ".ec-current-weather .ec-source",
            ".ec-current-weather",
            "weather source " + width,
          );
          ok(
            await p.eval(() => {
              const s = getComputedStyle(
                document.querySelector(".ec-current-weather"),
              );
              return s.backgroundColor !== "rgb(7, 83, 111)";
            }),
            "weather uses a light surface " + width,
          );
        }
        await contrast(
          p,
          ".ec-secondary",
          ".ec-secondary",
          "secondary button " + width,
        );
        const box = await p.eval(() => {
          const r = document
            .querySelector(".ec-secondary")
            .getBoundingClientRect();
          return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
        });
        if (width > 850) {
          await p.send("Input.dispatchMouseEvent", {
            type: "mouseMoved",
            ...box,
          });
          await sleep(200);
          await contrast(
            p,
            ".ec-secondary",
            ".ec-secondary",
            "secondary hover " + width,
          );
        }
      }
      if (route === "/data") {
        await wait(p, () => !!document.querySelector(".ec-dataset-heading"));
        await contrast(
          p,
          ".ec-dataset-fields select",
          ".ec-dataset-fields select",
          "input text " + width,
        );
        await contrast(
          p,
          ".ec-dataset-fields select",
          ".ec-dataset-fields select",
          "input boundary " + width,
          3,
          true,
        );
        await contrast(
          p,
          ".ec-dataset-heading h2",
          ".ec-dataset-heading",
          "dataset heading " + width,
        );
      }
      if (route === "/login" && width > 850) {
        await contrast(
          p,
          ".ec-auth-intro h2",
          ".ec-auth-intro",
          "auth headline",
        );
        await contrast(
          p,
          ".ec-auth-intro p",
          ".ec-auth-intro",
          "auth supporting text",
        );
        await contrast(
          p,
          ".ec-auth-sheet .ec-button",
          ".ec-auth-sheet .ec-button",
          "primary button",
        );
      }
      if (route === "/" && width > 850) {
        await contrast(
          p,
          ".ec-sidebar nav a.active",
          ".ec-sidebar nav a.active",
          "active navigation",
        );
        await p.send("Input.dispatchMouseEvent", {
          type: "mouseMoved",
          x: 30,
          y: 130,
        });
        await sleep(250);
        ok(
          await p.eval(
            () =>
              document.querySelector("aside").getBoundingClientRect().right <=
              document.querySelector("main").getBoundingClientRect().left + 1,
          ),
          "expanded sidebar never covers content",
        );
      }
      await p.screenshot({
        path: resolve(out, (route.slice(1) || "map") + "-" + width + ".jpg"),
        format: "jpeg",
        quality: 80,
      });
      await p.close();
    }
  console.log("TOTAL", report.checks.length);
} finally {
  writeFileSync(
    resolve(out, "bright-check.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  await b.close();
}
