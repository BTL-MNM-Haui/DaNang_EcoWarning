import fs from "node:fs";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
const env = Object.fromEntries(
  fs
    .readFileSync("backend/.env", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      let i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
const token = (role, use = "access") => {
  const now = Math.floor(Date.now() / 1000),
    h = Buffer.from('{"alg":"HS256","typ":"JWT"}').toString("base64url"),
    p = Buffer.from(
      JSON.stringify({
        sub: "ai-check@example.invalid",
        role,
        token_use: use,
        iat: now,
        exp: now + 600,
      }),
    ).toString("base64url");
  return `${h}.${p}.${createHmac("sha256", Buffer.from(env.JWT_SECRET_KEY, "base64")).update(`${h}.${p}`).digest("base64url")}`;
};
const root = "http://localhost:4173/backend/data/api/v1/ai/flood";
let checks = 0;
const req = async (path, body, role = "ROLE_ADMIN", use = "access") => {
  const r = await fetch(root + path, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: "Bearer " + token(role, use),
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  return { status: r.status, data: text ? JSON.parse(text) : null };
};
for (let i = 0; i < 30; i++) {
  try {
    const r = await req("/model");
    if (r.status === 200) break;
  } catch {}
  await new Promise((r) => setTimeout(r, 500));
}
let r = await req("/model");
assert.equal(r.status, 200);
checks++;
for (const [name, label] of [
  ["no_flood", "No_Flood"],
  ["very_high", "Flood"],
]) {
  r = await req(
    "/predict",
    JSON.parse(fs.readFileSync("AI/examples/" + name + ".json")),
  );
  assert.equal(r.status, 200);
  assert.equal(r.data.label, label);
  assert(r.data.model_version);
  checks++;
  console.log("PASS", name, label);
}
r = await req("/predict", { features: { X: 1 } });
assert.equal(r.status, 422);
checks++;
r = await req("/model", null, "ROLE_USER");
assert.equal(r.status, 403);
checks++;
r = await req("/model", null, "ROLE_ADMIN", "otp");
assert(r.status === 401 || r.status === 403);
checks++;
console.log(
  "PASS",
  checks,
  "FE proxy → Java BE → Python AI, invalid input, role and token purpose",
);
