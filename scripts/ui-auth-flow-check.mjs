// Real browser forms -> Nginx -> Auth -> SMTP -> Mailpit -> OTP verification.
// Requires explicit local-mail mode. Uses disposable accounts; no signed fixture tokens.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const { Browser, sleep } = await import(pathToFileURL(resolve(process.env.TASTE_SKILL_DIR, 'scripts/lib/cdp.mjs')).href);
const smtp = execFileSync('docker', ['exec', 'auth-service', 'printenv', 'SPRING_MAIL_HOST'], { encoding: 'utf8' }).trim();
assert.equal(smtp, 'mailpit', 'Only run against local Mailpit');
const base = 'http://localhost:4173', inbox = 'http://localhost:8025';
const email = `browser-auth-${randomUUID().slice(0, 8)}@example.invalid`;
const password = `Browser!${randomUUID()}Aa1`, newPassword = `Reset!${randomUUID()}Aa1`;
const out = resolve('.taste-skill/auth-flow'); mkdirSync(out, { recursive: true });
let checks = 0;
const pass = (v, s) => { assert(v, s); checks++; console.log('PASS', s); };
const browser = await Browser.launch();
const page = await browser.newPage({ width: 1440, height: 1000 });
async function wait(fn, label) {
  for (let i = 0; i < 80; i++) { if (await page.eval(fn)) return; await sleep(200); }
  throw Error(`Timed out: ${label}; UI: ` + await page.eval(() => document.querySelector('[role="alert"]')?.textContent || document.querySelector('.ec-error')?.textContent || document.querySelector('h1')?.textContent));
}
async function fill(label, value) {
  await page.eval(({ label, value }) => {
    const el = [...document.querySelectorAll('label')].find(l => l.firstChild?.textContent.trim() === label)?.querySelector('input');
    if (!el) throw Error('Missing input: ' + label);
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, { label, value });
}
async function submit() { await page.eval(() => document.querySelector('form').requestSubmit()); }
async function otp(excluded = new Set()) {
  for (let i = 0; i < 40; i++) {
    const list = await (await fetch(inbox + '/api/v1/messages')).json();
    const msg = list.messages.find(m => !excluded.has(m.ID) && m.To.some(t => t.Address === email));
    if (msg) {
      const detail = await (await fetch(inbox + '/api/v1/message/' + msg.ID)).json();
      const code = detail.HTML.match(/class="otp"[^>]*>\s*(\d{6})/)?.[1];
      assert(code, 'OTP in delivered email'); return { code, id: msg.ID };
    }
    await sleep(200);
  }
  throw Error('No delivered OTP email');
}
const used = new Set();
try {
  let ready = false;
  for (let i = 0; i < 90; i++) {
    try {
      const r = await fetch(base + '/backend/auth/api/v1/auth/forgot-password', {
        method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'readiness@example.invalid' }),
      });
      if (r.status === 404) { ready = true; break; }
    } catch {}
    await sleep(500);
  }
  assert(ready, 'Auth ready and browser Origin allowed');
  // Browser Origin must reach validation rather than fail CORS.
  const denied = await fetch(base + '/backend/auth/api/v1/auth/forgot-password', {
    method: 'POST', headers: { Origin: 'https://untrusted.example', 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
  });
  pass(denied.status === 403, 'untrusted Origin rejected');
  await page.goto(base + '/register', { settleMs: 800 });
  for (const [label, value] of [['Email', email], ['Họ', 'Browser'], ['Tên', 'Test'], ['Mật khẩu', password], ['Nhập lại mật khẩu', password]]) await fill(label, value);
  await submit(); await wait(() => !!document.querySelector('.ec-success'), 'register');
  pass(true, 'registration through browser Origin 4173');
  await page.goto(base + '/login', { settleMs: 500 });
  await fill('Email', email); await fill('Mật khẩu', password); await submit();
  await wait(() => !!document.querySelector('input[autocomplete="one-time-code"]'), 'login OTP screen');
  const first = await otp(used); used.add(first.id);
  pass(true, 'password accepted and login OTP delivered over SMTP');
  const wrong = first.code === '000000' ? '111111' : '000000';
  await fill('Mã OTP gồm 6 chữ số', wrong); await submit();
  await wait(() => !!document.querySelector('[role="alert"]'), 'incorrect OTP error');
  pass(await page.eval(() => location.pathname === '/login' && !localStorage.getItem('accessToken')), 'wrong OTP cannot sign in');
  await fill('Mã OTP gồm 6 chữ số', first.code); await submit();
  await wait(() => location.pathname === '/' && !!localStorage.getItem('accessToken'), 'signed in');
  pass(true, 'correct emailed OTP creates real login session');
  await page.goto(base + '/my-reports', { settleMs: 700 });
  pass(await page.eval(() => location.pathname === '/my-reports'), 'authenticated user opens protected route');
  await page.eval(() => localStorage.clear());
  await page.goto(base + '/forgot-password', { settleMs: 500 });
  await fill('Email', email); await submit();
  await wait(() => !!document.querySelector('input[autocomplete="one-time-code"]'), 'reset OTP screen');
  const reset = await otp(used); used.add(reset.id);
  pass(true, 'forgot password delivers new OTP through SMTP');
  await page.screenshot({ path: resolve(out, 'recovery-otp.jpg') });
  await fill('Mã OTP gồm 6 chữ số', reset.code); await submit();
  await wait(() => document.querySelector('h1')?.textContent === 'Đặt mật khẩu mới', 'reset form');
  await fill('Mật khẩu mới', newPassword); await fill('Nhập lại mật khẩu', newPassword); await submit();
  await wait(() => !!document.querySelector('.ec-success'), 'reset complete');
  pass(true, 'email verification and password reset complete');
  await page.screenshot({ path: resolve(out, 'recovery-success.jpg') });
  await page.goto(base + '/login', { settleMs: 500 });
  await fill('Email', email); await fill('Mật khẩu', password); await submit();
  await wait(() => !!document.querySelector('[role="alert"]'), 'old password error');
  pass(await page.eval(() => !document.querySelector('input[autocomplete="one-time-code"]')), 'old password rejected');
  await fill('Mật khẩu', newPassword); await submit();
  await wait(() => !!document.querySelector('input[autocomplete="one-time-code"]'), 'new password OTP');
  const last = await otp(used); used.add(last.id);
  await fill('Mã OTP gồm 6 chữ số', last.code); await submit();
  await wait(() => location.pathname === '/' && !!localStorage.getItem('accessToken'), 'new password login');
  pass(true, 'new password plus emailed OTP signs in');
  console.log(`TOTAL ${checks} browser auth checks; no fixture JWT bypass`);
} finally {
  await browser.close();
  execFileSync('docker', ['exec', '-i', 'postgresql', 'sh', '-c', 'psql -U "$POSTGRES_USER" -d auth_service -v ON_ERROR_STOP=1'], {
    input: `DELETE FROM users WHERE email='${email}';`, stdio: ['pipe', 'pipe', 'pipe'],
  });
}
