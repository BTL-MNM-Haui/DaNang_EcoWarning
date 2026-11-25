import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
export const { Browser, sleep } = await import(
  pathToFileURL(resolve(process.env.TASTE_SKILL_DIR, "scripts/lib/cdp.mjs"))
    .href
);
export const base = "http://localhost:4173";
export async function wait(page, fn, label) {
  for (let i = 0; i < 120; i++) {
    if (await page.eval(fn)) return;
    await sleep(150);
  }
  throw Error(
    "Timed out: " +
      label +
      "; UI: " +
      (await page.eval(
        () =>
          document.querySelector('[role="alert"]')?.textContent ||
          document.querySelector("h1")?.textContent,
      )),
  );
}
export async function fill(page, label, value, scope = "body") {
  await page.eval(
    ({ label, value, scope }) => {
      const el = [...document.querySelector(scope).querySelectorAll("label")]
        .find((l) => l.textContent.trim().startsWith(label))
        ?.querySelector("input,textarea,select");
      if (!el) throw Error("Missing field: " + label);
      const proto =
        el.tagName === "SELECT"
          ? HTMLSelectElement.prototype
          : el.tagName === "TEXTAREA"
            ? HTMLTextAreaElement.prototype
            : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
      el.dispatchEvent(
        new Event(el.tagName === "SELECT" ? "change" : "input", {
          bubbles: true,
        }),
      );
    },
    { label, value, scope },
  );
}
export async function button(page, text, scope = "body") {
  await page.eval(
    ({ text, scope }) => {
      const el = [
        ...document.querySelector(scope).querySelectorAll("button"),
      ].find((b) => b.textContent.trim() === text);
      if (!el || el.disabled)
        throw Error("Button missing or disabled: " + text);
      el.click();
    },
    { text, scope },
  );
}
export async function submit(page, selector = "form") {
  await page.eval(
    (selector) => document.querySelector(selector).requestSubmit(),
    selector,
  );
}
export async function login(page, account) {
  const before = new Set(
    (
      await (await fetch("http://localhost:8025/api/v1/messages")).json()
    ).messages.map((m) => m.ID),
  );
  await page.goto(base + "/login", { settleMs: 500 });
  await fill(page, "Email", account.email);
  await fill(page, "Mật khẩu", account.password);
  await submit(page);
  await wait(
    page,
    () => !!document.querySelector('input[autocomplete="one-time-code"]'),
    "login OTP screen",
  );
  let code;
  for (let i = 0; i < 60; i++) {
    const list = await (
      await fetch("http://localhost:8025/api/v1/messages")
    ).json();
    const mail = list.messages.find(
      (m) => !before.has(m.ID) && m.To.some((t) => t.Address === account.email),
    );
    if (mail) {
      const d = await (
        await fetch("http://localhost:8025/api/v1/message/" + mail.ID)
      ).json();
      code = d.HTML.match(/class="otp"[^>]*>\s*(\d{6})/)?.[1];
      break;
    }
    await sleep(200);
  }
  assert(code, "OTP delivered to local SMTP inbox");
  await fill(page, "Mã OTP", code);
  await submit(page);
  await wait(
    page,
    () =>
      location.pathname !== "/login" && !!localStorage.getItem("accessToken"),
    "real login session",
  );
}
