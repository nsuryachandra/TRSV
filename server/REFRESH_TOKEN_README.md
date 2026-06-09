# Refresh Token Flow & Testing

This file documents the refresh-token reuse detection and how to test it locally.

Key points
- Refresh tokens are stored hashed (`token_hash`) in `refresh_tokens` table.
- On refresh, the server rotates the refresh token: the old row is marked `revoked = true` and a new token is inserted.
- If an already-revoked refresh token is presented later (reuse), server treats it as a compromise and revokes all sessions for the user.
- Middleware and socket handshake require a valid refresh cookie to renew expired JWTs — the expanded-grace fallback has been removed.

Files
- `server/routes/auth.js` — `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/logout-all`, signup/login.
- `server/middleware/auth.js` — `requireAuth` middleware; enforces refresh-cookie-only refresh behavior.
- `server/server.js` — socket handshake changes to enforce refresh cookie.
- `server/routes/sessions.js` — `GET /api/auth/sessions` lists current user's refresh sessions.
- `server/test_refresh.js` — smoke test script used during development.

Quick tests (local)
1. Start server:

```powershell
node server/server.js
```

2. Create a test user (signup) or use existing user.

3. Use the `server/test_refresh.js` script to exercise rotation and reuse detection:

```powershell
node server/test_refresh.js
```

This script:
- Signs up a temporary test user,
- Inserts a raw refresh token hash for the user,
- Calls `/api/auth/refresh` with the raw token (first call should succeed),
- Calls `/api/auth/refresh` again with the same raw token (second call should trigger reuse detection and revoke all sessions).

Manual curl example

1. Signup (PowerShell example):

```powershell
$body = @{ fullName='Test User'; email='you@example.com'; password='Password123!' } | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/signup' -Method Post -Body $body -ContentType 'application/json'
```

2. Refresh (if you have a refresh token value):

```powershell
$body = @{ refreshToken = '<raw-refresh-token>' } | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/refresh' -Method Post -Body $body -ContentType 'application/json'
```

Admin session listing

- GET `/api/auth/sessions` with `Authorization: Bearer <access-token>` header returns array of session rows for the authenticated user.

Security note

- After testing, rotate secrets and clear test accounts if required. The server now treats refresh-token reuse as a compromise and revokes all sessions for safety.
