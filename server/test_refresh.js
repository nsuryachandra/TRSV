const BASE = 'http://localhost:5000';
import pool from './config/db.js';
import crypto from 'crypto';

async function signup(emailSuffix){
  const email = `trsvtest+${emailSuffix}@example.com`;
  const resp = await fetch(`${BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: 'TRSV Test User', email, password: 'Password123!' })
  });
  const json = await resp.json();
  return { status: resp.status, body: json };
}

(async ()=>{
  try {
    console.log('Running quick signup test...');
    const r = await signup(Date.now());
    console.log('Signup status:', r.status);
    console.log('Body:', r.body);
    if (!r.body || !r.body.user) return console.error('Signup did not return user.');
    const userId = r.body.user.id;

    // Create a raw refresh token, insert its hash into DB for this user
    const rawToken = 'reusetest-' + crypto.randomBytes(12).toString('hex');
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30*24*60*60*1000);
    await pool.query('INSERT INTO refresh_tokens(token_hash, user_id, expires_at) VALUES ($1, $2, $3)', [hash, userId, expiresAt]);
    console.log('Inserted test refresh token for user', userId);

    // 1st refresh attempt with valid raw token
    const first = await fetch(`${BASE}/api/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: rawToken }) });
    const firstJson = await first.json();
    console.log('First refresh status:', first.status, 'body:', firstJson);

    // 2nd refresh attempt reusing same raw token (should trigger reuse detection)
    const second = await fetch(`${BASE}/api/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: rawToken }) });
    const secondJson = await second.json();
    console.log('Second refresh status:', second.status, 'body:', secondJson);

    process.exit(0);
  } catch (e) {
    console.error('Test failed:', e.message || e);
    process.exit(1);
  }
})();
