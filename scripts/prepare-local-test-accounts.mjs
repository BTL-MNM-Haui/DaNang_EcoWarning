// Explicit local-only test accounts. Never changes existing users/passwords.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const file = new URL('../.delivery/local-test-accounts.json', import.meta.url);
if (existsSync(file)) {
  console.log('Local account details already exist in .delivery/local-test-accounts.json');
  process.exit(0);
}
const smtp = execFileSync('docker', ['exec', 'auth-service', 'printenv', 'SPRING_MAIL_HOST'], { encoding: 'utf8' }).trim();
if (smtp !== 'mailpit') throw Error('Start the explicit local-mail Compose override first.');
const accounts = [];
for (const role of ['USER', 'ADMIN']) {
  const email = `local-${role.toLowerCase()}-${randomBytes(3).toString('hex')}@example.invalid`;
  const password = `Local!${randomBytes(8).toString('hex')}Aa1`;
  const r = await fetch('http://localhost:4173/backend/auth/api/v1/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:4173' },
    body: JSON.stringify({ email, password, firstName: 'Local', lastName: role, phone: '0901234567' }),
  });
  if (r.status !== 201) throw Error(`Registration failed (${r.status})`);
  if (role === 'ADMIN') execFileSync('docker', ['exec', '-i', 'postgresql', 'sh', '-c', 'psql -U "$POSTGRES_USER" -d auth_service -v ON_ERROR_STOP=1'], {
    input: `UPDATE users SET role='ROLE_ADMIN' WHERE email='${email}';`, stdio: ['pipe', 'pipe', 'pipe'],
  });
  accounts.push({ email, password, role: `ROLE_${role}` });
}
mkdirSync(new URL('../.delivery/', import.meta.url), { recursive: true });
writeFileSync(file, JSON.stringify(accounts, null, 2), { mode: 0o600 });
console.log('Created USER and ADMIN accounts. Credentials: .delivery/local-test-accounts.json (Git ignored).');
