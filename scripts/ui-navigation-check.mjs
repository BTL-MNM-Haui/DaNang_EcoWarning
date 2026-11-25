import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
const skillRoot = process.env.TASTE_SKILL_DIR;
if (!skillRoot)
  throw new Error(
    "Set TASTE_SKILL_DIR to the taste-skill folder containing scripts/lib/cdp.mjs",
  );
const { Browser, sleep } = await import(
  pathToFileURL(resolve(skillRoot, "scripts/lib/cdp.mjs")).href
);
const base = process.argv[2] || "http://localhost:4173";
const out = resolve("docs/design-evidence");
mkdirSync(out, { recursive: true });
const results = {
  base,
  checks: [],
  motion: [],
  note: "Goong style requests are paused for the loading-state screenshot, then resumed. No API data is fabricated.",
};
function check(v, label) {
  assert.ok(v, label);
  results.checks.push(label);
  console.log("PASS", label);
}
const b = await Browser.launch();
const move = (p, x, y) =>
  p.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
const width = (p) =>
  p.eval(() => document.querySelector("aside").getBoundingClientRect().width);
async function ready(p) {
  for (let i = 0; i < 60; i++) {
    if (await p.eval(() => !!document.querySelector("aside"))) return;
    await sleep(300);
  }
  throw Error("UI did not mount");
}
try {
  for (const w of [1440, 1024]) {
    const p = await b.newPage({ width: w, height: 900 });
    await p.goto(base + "/weather", { settleMs: 1000 });
    await ready(p);
    await move(p, 600, 80);
    await sleep(250);
    check(Math.round(await width(p)) === 76, "rail collapsed initially " + w);
    await move(p, 35, 120);
    const frames = await p.eval(
      () =>
        new Promise((resolve) => {
          const start = performance.now(),
            a = [];
          function frame(t) {
            const sidebar = document
                .querySelector("aside")
                .getBoundingClientRect(),
              main = document.querySelector("main").getBoundingClientRect();
            a.push({
              ms: Math.round(t - start),
              width: Math.round(sidebar.width * 10) / 10,
              covered: sidebar.right > main.left + 1,
            });
            if (t - start < 300) requestAnimationFrame(frame);
            else resolve(a);
          }
          requestAnimationFrame(frame);
        }),
    );
    results.motion.push({ viewport: w, frames });
    check(
      frames.some((f) => f.width > 77 && f.width < 287),
      "transition has intermediate positions " + w,
    );
    check(
      frames.every((f) => !f.covered),
      "no overlap during motion " + w,
    );
    check(Math.round(await width(p)) === 288, "hover expanded " + w);
    // Real pointer press/release reproduces focus left behind after clicking navigation.
    const point = await p.eval(() => {
      const r = document
        .querySelector('aside a[href="/weather"]')
        .getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    await move(p, point.x, point.y);
    await p.send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      button: "left",
      clickCount: 1,
      ...point,
    });
    await p.send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      button: "left",
      clickCount: 1,
      ...point,
    });
    check(
      await p.eval(() => document.activeElement.closest("aside") !== null),
      "clicked item has focus " + w,
    );
    await move(p, 650, 80);
    await sleep(300);
    check(Math.round(await width(p)) === 76, "click then leave collapses " + w);
    if (w === 1440)
      await p.screenshot({
        path: resolve(out, "sidebar-after-click-leave.jpg"),
        format: "jpeg",
        quality: 80,
      });
    for (let i = 0; i < 3; i++) {
      await move(p, 35, 120);
      await sleep(60);
      await move(p, 650, 80);
      await sleep(60);
    }
    await sleep(250);
    check(
      Math.round(await width(p)) === 76,
      "rapid hover reversal settles " + w,
    );
    await p.send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: "Tab",
      code: "Tab",
      windowsVirtualKeyCode: 9,
    });
    await p.send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Tab",
      code: "Tab",
      windowsVirtualKeyCode: 9,
    });
    await p.eval(() => document.querySelector("aside nav a").focus());
    await sleep(250);
    check(
      Math.round(await width(p)) === 288,
      "keyboard focus reveals labels " + w,
    );
    await p.send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: "Escape",
      code: "Escape",
      windowsVirtualKeyCode: 27,
    });
    await p.send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Escape",
      code: "Escape",
      windowsVirtualKeyCode: 27,
    });
    await sleep(250);
    check(
      Math.round(await width(p)) === 76,
      "Escape closes keyboard navigation " + w,
    );
    await p.close();
  }
  const reduced = await b.newPage({
    width: 1440,
    height: 900,
    reducedMotion: true,
  });
  await reduced.goto(base + "/weather", { settleMs: 1000 });
  await ready(reduced);
  check(
    await reduced.eval(
      () =>
        getComputedStyle(document.querySelector(".ec-app"))
          .transitionDuration === "0s",
    ),
    "reduced motion disables spatial transition",
  );
  await reduced.close();
  for (const w of [1440, 390]) {
    const p = await b.newPage({ width: w, height: 900, mobile: w === 390 });
    await p.send("Fetch.enable", {
      patterns: [{ urlPattern: "*tiles.goong.io*", requestStage: "Request" }],
    });
    await p.goto(base + "/", { settleMs: 1000 });
    await ready(p);
    for (let i = 0; i < 30; i++) {
      if (await p.eval(() => !!document.querySelector(".ec-map-warning")))
        break;
      await sleep(200);
    }
    check(
      await p.eval(() => {
        const el = document.querySelector(".ec-map-warning");
        if (!el) return false;
        const r = el.getBoundingClientRect(),
          canvas = el.parentElement.getBoundingClientRect();
        return (
          r.width <= 361 &&
          r.width < canvas.width &&
          r.left >= canvas.left &&
          r.right <= canvas.right
        );
      }),
      "loading message is compact and inside map " + w,
    );
    check(
      await p.eval(() =>
        document
          .querySelector(".ec-map-warning")
          ?.textContent.includes("Đang tải bản đồ"),
      ),
      "loading text visible " + w,
    );
    check(
      await p.eval(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      "no horizontal overflow " + w,
    );
    await p.screenshot({
      path: resolve(out, "map-loading-" + w + ".jpg"),
      format: "jpeg",
      quality: 80,
    });
    await p.send("Fetch.disable");
    if (w === 390) {
      await p.eval(() => document.querySelector(".ec-mobile button").click());
      check(
        await p.eval(() =>
          document.querySelector("aside").classList.contains("is-open"),
        ),
        "touch navigation opens",
      );
      await p.eval(() => document.querySelector(".ec-mobile button").click());
      check(
        await p.eval(
          () => !document.querySelector("aside").classList.contains("is-open"),
        ),
        "touch navigation closes",
      );
    }
    await p.close();
  }
  console.log("TOTAL", results.checks.length);
} finally {
  writeFileSync(
    resolve(out, "navigation-check.json"),
    JSON.stringify(results, null, 2) + "\n",
  );
  await b.close();
}
