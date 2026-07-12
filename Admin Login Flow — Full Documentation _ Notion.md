You’re almost there — sign up to start building in Notion today. 

Sign up or login 

## **Admin Login Flow — Full Documentation** 

## **Overview** 

Admin login is a **multi-step flow** : password → MFA (TOTP) → (first time only) forced password reset. No single call returns a usable access token except the final step of whichever path applies. All requests are `POST` , JSON body, `Content-Type: application/json` . 

**Base path:** `/auth` (behind whatever gateway/host prefix is configured for adminservice) 

## **Step 1 —** **`POST /auth/login`** 

## **Request** 

`{ "email": "superadmin@cryptoplatform.ng", "password": "<password >" }` 

**Response** **`200`** 

`{ "sessionToken": "6a7d5f25-6821-4c1e-9887-c4117b743ac2", "mfaRequ ired": true }` 

> **`sessionToken` is NOT a bearer token and NOT an OTP.** It's a shortlived (5 min) opaque reference that just proves the password was correct. Do **not** put it in an `Authorization` header. Carry it forward in the **body** of every subsequent call in this flow until you get real tokens back in the final step. 

**Errors:** `401` invalid credentials, `403` account suspended, `429` too many failed attempts (5/10min lockout). 

## **Step 2 — First-time only:** **`POST /auth/totp/setup`** 

Skip this and go straight to Step 4 if the admin already has MFA enrolled ( `mfaEnrolled: true` ). 

## **Request** 

```
{ "sessionToken":"<from step 1>" }
```

## **Response** **`200`** 

   - `{ "otpauthUrl": "otpauth://totp/Admin:superadmin%40cryptoplatform. ng?secret=...", "secret": "JBSWY3DPEHPK3PXP", "debugTotpToken": "4 82913" }` 

- `otpauthUrl` → render as a QR code for scanning into Google 

- Authenticator/Authy. 

- `secret` → base32 fallback for manual entry into an authenticator app. 

- `debugTotpToken` → **only present when the server is NOT running in** 

- **production** ( `NODE_ENV !== 'production'` ). It's the currently-valid 6-digit code for that secret, computed server-side, so you can test the whole flow without a real authenticator app. **This field will not exist in production** — production clients must get the code from a real authenticator app. 

**Errors:** `401` session expired/invalid, `409` MFA already enrolled for this account. 

## **Step 3 — First-time only:** **`POST /auth/totp/confirm`** 

**Request** 

```
{ "sessionToken":"<same one>", "totpToken":"482913" }
```

( `totpToken` = the code from your authenticator app, or `debugTotpToken` from Step 2 in non-prod.) 

## **Response** **`200`** 

```
{ "success":true, "debugTotpToken":"719204" }
```

This marks `mfaEnrolled: true` on the account. `debugTotpToken` here is a **fresh** code (the previous one may be stale by now) — again, non-production only. 

**Errors:** `401` invalid/expired code, `403` MFA not set up yet (call `totp/setup` first), `409` already enrolled. 

## **Step 4 —** **`POST /auth/totp/verify`** 

This is where **every** login converges, whether MFA was just set up or was already enrolled. 

## **Request** 

```
{ "sessionToken":"<same one>", "totpToken":"719204" }
```

## **Response** **`200` — two possible shapes:** 

**A) Account has a pending forced password change** (true for a freshly seeded super admin): 

```
{ "forcePasswordChange":true }
```

→ go to Step 5. No tokens yet. 

## **B) Normal case — everything set up already:** 

```
{ "accessToken":"<JWT>", "refreshToken":"<sessionId.rawSecret>",
"expiresIn":900, "admin": { "id":"...", "email":"...", "role":
"SUPER_ADMIN", "status":"ACTIVE", "mfaEnrolled":true, "forcePass
wordChange":false, "lastLoginAt":"..." } }
```

→ **login complete.** Use `accessToken` as `Authorization: Bearer <accessToken>` on all subsequent authenticated requests. 

**Errors:** `401` invalid TOTP or expired session, `403` MFA not enrolled. 

**Step 5 — First-time only (if Step 4 returned** **`forcePasswordChange: true` ):** **`POST /auth/force-password-change`** 

## **Request** 

```
{ "sessionToken":"<same one>", "newPassword":"<new password, min
12 chars>" }
```

**Response** **`200`** — same shape as Step 4's success response (real `accessToken` / `refreshToken` / `admin` ). **Login is now complete.** 

**Errors:** `401` session expired, `403` no pending forced change on this account, `422` new password same as current. 

## **Subsequent (non-first-time) logins** 

Once `mfaEnrolled: true` and `forcePasswordChange: false` , the flow is just: 

1. `POST /auth/login` → `sessionToken` 

2. `POST /auth/totp/verify` → real tokens directly (skip setup/confirm/force- 

password-change entirely) 

## **Other auth endpoints (for reference)** 

|Endpoint|Auth required|
|---|---|
|`POST /auth/refresh`|none (body:<br>)<br>`refreshToken`|
|`POST /auth/change-password`|`Authorization: Bearer`<br>`<accessToken>`|
|`POST /auth/logout`|`Authorization: Bearer`<br>`<accessToken>`|



## **Quick sequence diagram (first-time login)** 

`login ── ▶ sessionToken │ ▼ totp/setup(sessionToken) ── ▶ otpauthUrl / secret / debugTotpToken │ ▼ totp/confirm(sessionToken, totpToke n) ── ▶ success / fresh debugTotpToken │ ▼ totp/verify(sessionToke n, totpToken) ── ▶ { forcePasswordChange: true } │ ▼ force-password -change(sessionToken, newPassword) ── ▶ accessToken + refreshToken │ ▼` ✅ `logged in — use accessToken as Bearer token from here on` 

