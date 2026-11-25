// Checks only explicitly configured local accounts. Credentials stay in a Git-ignored file.
import fs from "node:fs";
import assert from "node:assert/strict";
import { Browser, base, wait, fill, submit } from "./lib/local-browser.mjs";
const accounts = JSON.parse(fs.readFileSync('.delivery/anh-local-accounts.json', 'utf8'));
const selected = accounts.filter(a => ['anh.admin@ecowarning.test', 'anh.user@ecowarning.test'].includes(a.email));
assert.equal(selected.length, 2);
const inbox = async () => (await (await fetch('http://localhost:8025/api/v1/messages')).json()).messages.filter(m => m.To.some(t => selected.some(a => a.email === t.Address))).map(m => m.ID).sort();
const before = await inbox();
const b = await Browser.launch();
let checks = 0;
try {
  for (const account of selected) {
    const p = await b.newPage({ width: 1440, height: 1000 });
    await p.goto(base + '/login', { settleMs: 400 });
    await p.eval(() => localStorage.clear());
    await p.goto(base + '/login', { settleMs: 400 });
    await fill(p, 'Email', account.email); await fill(p, 'Mật khẩu', 'incorrect-password'); await submit(p);
    await wait(p, () => !!document.querySelector('[role="alert"]'), 'invalid password rejected');
    assert(await p.eval(() => !localStorage.getItem('accessToken'))); checks++;
    await fill(p, 'Mật khẩu', account.password); await submit(p);
    await wait(p, () => location.pathname === '/' && !!localStorage.getItem('accessToken'), 'direct sign in');
    assert(await p.eval(() => !document.querySelector('input[autocomplete="one-time-code"]'))); checks++;
    const profile = await p.eval(async () => {
      const r = await fetch('/backend/auth/api/v1/auth/token', { method: 'POST', headers: { Authorization: 'Bearer ' + localStorage.getItem('accessToken') } });
      const j = await r.json(); return { status: r.status, role: j.data?.role };
    });
    assert.equal(profile.status, 200); assert.equal(profile.role, account.role); checks++;
    await p.goto(base + '/manage', { settleMs: 500 });
    assert(await p.eval(role => role === 'ROLE_ADMIN' ? document.querySelector('h1')?.textContent === 'Xác minh sự cố' : document.body.innerText.includes('Cần quyền quản lý'), account.role)); checks++;
    console.log('PASS direct password login, invalid-password rejection and role:', account.role);
    await p.close();
  }
  assert.deepEqual(await inbox(), before); checks++;
  console.log(`TOTAL ${checks} password-only browser checks; no login OTP email generated`);
} finally { await b.close(); }
