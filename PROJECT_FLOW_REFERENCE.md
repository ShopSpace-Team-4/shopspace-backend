# ShopSpace Backend - Project Structure & Current Flow Reference

> Updated to reflect the multi-role system (`roles[]` + `activeRole`) and Google Sign-In (explicit linking) added on top of the original Phase 1 auth flow.

## 1) Project Structure Tree

```text
shopspace-backend/
├── package.json
├── README.md
├── tsconfig.json
├── ShopSpace-Local.postman_environment.json
├── ShopSpace-Phase1.postman_collection.json
├── src/
│   ├── main.ts
│   ├── app.controller.ts
│   ├── common/
│   │   ├── enums/
│   │   │   ├── email.enum.ts
│   │   │   ├── index.ts
│   │   │   ├── otp-purpose.enum.ts
│   │   │   ├── role.enum.ts
│   │   │   └── token.enum.ts
│   │   ├── exceptions/
│   │   │   ├── application.exception.ts
│   │   │   ├── domain.exception.ts
│   │   │   └── index.ts
│   │   ├── interfaces/
│   │   │   ├── index.ts
│   │   │   ├── jwt-payload.interface.ts      # payload now carries roles: Role[], not a single role
│   │   │   └── user.interface.ts
│   │   ├── response/
│   │   │   ├── index.ts
│   │   │   └── success.response.ts
│   │   ├── services/
│   │   │   ├── email.service.ts
│   │   │   ├── google-auth.service.ts        # NEW — verifies Google ID tokens via google-auth-library
│   │   │   ├── index.ts
│   │   │   ├── otp.service.ts
│   │   │   ├── redis.service.ts
│   │   │   ├── security.service.ts
│   │   │   └── token.service.ts
│   │   ├── types/
│   │   │   └── express.types.ts
│   │   ├── utils/
│   │   │   ├── jwt.util.ts
│   │   │   ├── otp-generator.util.ts
│   │   │   └── security/
│   │   │       ├── encryption.security.ts
│   │   │       ├── hash.security.ts
│   │   │       └── index.ts
│   │   └── validation/
│   │       └── general.valodation.ts
│   ├── config/
│   │   └── config.ts                         # + GOOGLE_CLIENT_ID
│   ├── DB/
│   │   ├── connection.db.ts
│   │   ├── models/
│   │   │   ├── otp-token.model.ts
│   │   │   └── user.model.ts                 # roles[], activeRole, googleId?, avatarUrl?, password now optional; phone optional for Google-only accounts
│   │   └── repository/
│   │       ├── base.repository.ts
│   │       ├── index.ts
│   │       ├── otp-token.repository.ts
│   │       └── user.repository.ts
│   ├── middleware/
│   │   ├── authentication.middleware.ts
│   │   ├── authorization.middleware.ts       # checks overlap with req.user.roles[], not equality against one role
│   │   ├── error.middleware.ts
│   │   ├── index.ts
│   │   ├── rate-limit.middleware.ts
│   │   └── validation.middleware.ts
│   └── modules/
│       ├── auth/
│       │   ├── auth.controller.ts            # + googleAuth handler
│       │   ├── auth.dto.ts                   # signup DTO no longer takes role; + GoogleAuthDto
│       │   ├── auth.entity.ts
│       │   ├── auth.service.ts               # + loginWithGoogle; issueTokens now signs roles[]
│       │   ├── auth.validation.ts            # role removed from signup schema; + googleAuthSchema
│       │   └── index.ts
│       ├── post/
│       │   └── README.md
│       └── user/
│           ├── index.ts
│           ├── user.controller.ts            # + active-role, roles, link-google handlers
│           ├── user.dto.ts                   # profile response returns roles[] + activeRole, not role
│           ├── user.service.ts
│           └── user.validation.ts            # + schemas for the 3 new endpoints below
```

## 2) Main Application Flow

The current backend is built around an Express + TypeScript + MongoDB architecture.

### Entry Point
- The app starts from `src/main.ts`.
- `src/main.ts` bootstraps the application by calling the bootstrap function from `src/app.controller.ts`.

### Request Lifecycle
1. A request comes into Express.
2. Global middleware runs:
   - `express.json()`
   - `cors()`
   - `cookieParser()`
3. The route is matched under:
   - `/api/v1/auth` for authentication routes
   - `/api/v1/users` for user routes
4. The controller receives the request and delegates to the service layer.
5. The service uses repositories to interact with MongoDB through Mongoose models.
6. Responses are wrapped in a standard success format.
7. Errors are passed to the global error middleware.

## 3) Current Auth Flow

### A. Signup Flow
1. Client sends `POST /api/v1/auth/signup`.
2. The controller in `src/modules/auth/auth.controller.ts` receives the request.
3. Validation middleware validates the incoming payload using `auth.validation.ts`. **No `role` field is accepted here anymore** — role selection was removed from signup entirely.
4. `auth.service.ts` checks whether the email/phone already exists.
5. If valid, a new user is created with `roles: [Role.TENANT]` and `activeRole: Role.TENANT` by default. Everyone starts as a tenant; landlord capability is added later via the role-toggle flow (see 3H).
6. An OTP is generated and sent using `otp.service.ts` and `email.service.ts`.
7. The response returns a success message and the created user ID.

### B. Login Flow
1. Client sends `POST /api/v1/auth/login`.
2. The controller calls `auth.service.ts`.
3. The service looks up the user by email and verifies the password.
4. The account must already be verified.
5. If valid, access and refresh tokens are issued using JWT utilities. **The token payload now carries `roles: Role[]`** instead of a single `role`.
6. The tokens are returned to the client.

### C. Account Verification Flow
1. Client sends `POST /api/v1/auth/verify`.
2. The service verifies the OTP against the stored OTP record.
3. If the OTP is valid, the user is marked as verified.
4. The OTP is invalidated after use.

### D. Resend OTP Flow
1. Client sends `POST /api/v1/auth/resend-otp`.
2. The service checks whether the account exists and is not already verified.
3. A new OTP is generated and sent again.

### E. Logout Flow
1. Client sends `POST /api/v1/auth/logout`.
2. The authenticate middleware verifies the access token first.
3. If the token is valid, the service increments the user `tokenVersion`.
4. This invalidates old refresh tokens for that user.

### F. Refresh Token Flow
1. Client sends `POST /api/v1/auth/refresh-token`.
2. The service verifies the refresh token using JWT utilities.
3. If valid and the `tokenVersion` matches, a fresh access/refresh token pair is issued, carrying the current `roles[]`.

### G. Forgot Password / Reset Password Flow
1. Client sends `POST /api/v1/auth/forgot-password`.
2. The service sends a password-reset OTP if the email exists.
3. Client sends `POST /api/v1/auth/reset-password`.
4. The service verifies the OTP and updates the password.
5. The user is logged out from all previous sessions by increasing `tokenVersion`.

### H. Google Sign-In Flow — NEW
1. Client sends `POST /api/v1/auth/google` with `{ idToken }` obtained from Google's client-side OAuth flow.
2. `google-auth.service.ts` verifies the ID token against `GOOGLE_CLIENT_ID` and extracts `{ email, firstName, lastName, googleId, avatarUrl }`.
3. `auth.service.ts` looks the user up:
   - **Found by `googleId`** → log in immediately, issue tokens.
   - **Not found by `googleId`, but an account exists with that email and no `googleId` linked** → **rejected**, not auto-linked. The response tells the client to log in with the existing password-based account and link Google from account settings instead.
   - **No account exists at all for that email** → a new user is created: no password, no phone number, `googleId` set, `isVerified: true` (Google already verified the email, so the OTP step is skipped for this path only), `roles: [Role.TENANT]`, `activeRole: Role.TENANT`.
4. Tokens are issued and returned the same way as regular login.
5. **This is deliberately explicit-linking, not auto-linking** — see the design note in section 4.

### I. Link Google Account Flow — NEW
1. Client is already authenticated (has a valid access token) and sends `PATCH /api/v1/users/me/link-google` with `{ idToken }`.
2. The ID token is verified the same way as in the Google Sign-In flow.
3. The service checks the resulting `googleId` isn't already linked to a *different* user account.
4. If clear, `googleId` and `avatarUrl` are attached to the current `req.user`'s account.
5. This is the **only** path in the system that attaches a `googleId` to an already-existing local (password-based) account. Signup and `/auth/google` never do this automatically.

## 4) Current Role / Authorization Flow — UPDATED

### Why this changed
The original single-`role` model assumed a user was either a landlord or a tenant, fixed at signup. The product now supports **one account holding multiple roles**, with a UI-level toggle to switch which dashboard is active (see the "Personal Details" sidebar mockup — Landlord/Tenant switch). This required separating *what a user is authorized to do* from *what the UI is currently showing them*.

#### 1. Roles are now a list, not a single value
`src/DB/models/user.model.ts` stores:
- `roles: Role[]` — every role this account holds. Defaults to `[Role.TENANT]` at signup.
- `activeRole: Role` — which dashboard/mode the UI currently shows. Defaults to `Role.TENANT`. Must always be a value present in `roles` (enforced by a model validator).

`Role` enum values are unchanged: `LANDLORD`, `TENANT`, plus the system-level `ADMIN` in `RoleEnum`.

#### 2. `activeRole` is a UI preference — it is NOT a security boundary
This is the key design decision: **switching modes in the sidebar never grants or removes access to anything.** A user's authorization is determined entirely by their `roles[]` array, regardless of which mode they last clicked into. This avoids a confusing failure mode where a landlord gets a 403 on a landlord-only endpoint just because they happened to be viewing their tenant dashboard at the time.

- `PATCH /api/v1/users/me/active-role` — switches `activeRole`. Validates the requested role is already present in `roles`. **No token reissue** — this changes nothing about what the user is allowed to do, only what the UI defaults to.
- `POST /api/v1/users/me/roles` — adds a new role to `roles[]` (e.g. "Become a Landlord," a plain one-click toggle, no extra confirmation step required). Idempotent — calling it when the role is already present just returns 200. **This DOES change authorization, so a fresh access/refresh token pair is issued and returned immediately** — otherwise the user's existing token wouldn't reflect the new role for up to 15 minutes.

#### 3. The JWT payload carries the full `roles[]` array
In `src/modules/auth/auth.service.ts`, the token payload now includes:
- `userId`
- `roles: Role[]` (was: single `role`)
- `tokenVersion`

`activeRole` is intentionally **not** included in the JWT — it lives only on the User document and is read fresh via `GET /api/v1/users/me`, since it's a UI concern, not an auth claim.

#### 4. Authentication attaches the full roles array to the request
In `src/middleware/authentication.middleware.ts`:
- the access token is verified
- the user is fetched from the database
- the `tokenVersion` is checked
- `req.user` is populated with the decoded payload, including `roles[]`

#### 5. Authorization middleware checks array overlap, not equality
`src/middleware/authorization.middleware.ts` now checks whether `req.user.roles` has **any overlap** with the allowed-roles array passed into the middleware, rather than comparing a single role for equality. The exported usage pattern is unchanged (`authorize(...roles)`, `isLandlord`, `isTenant`), so existing route wiring doesn't need to change shape — only the internal check does.

Behavior:
- If `req.user` does not exist, it throws `UnauthorizedException`.
- If none of `req.user.roles` are in the allowed-roles array, it throws `ForbiddenException`.
- If there's overlap, it calls `next()`.

### What is still not fully applied
Authorization middleware exists and works, but — same caveat as before the role-model change — **it's still not applied to most routes yet.** `src/modules/user/user.controller.ts` still only uses `authenticate` on most endpoints, not `authorization`. The system authenticates users correctly and now carries the right role information end-to-end, but role-gated routes (e.g. "only landlords can create a listing," which will matter once the Listings module lands) still need to be wired up explicitly per route.

### Example of how it should work in the future
A route could be protected like this:
```ts
router.post('/listings', authenticate, authorize(Role.LANDLORD), listingController.create);
```
This means:
- a user whose `roles[]` includes `LANDLORD` can access the route, **regardless of their current `activeRole`**
- a user whose `roles[]` is only `[TENANT]` receives a forbidden error

## 5) Core Components and Their Roles

### Controllers
- Handle HTTP routing and response shaping.
- They do not contain business logic.
- Example: `src/modules/auth/auth.controller.ts`

### Services
- Contain the business logic.
- Example: `src/modules/auth/auth.service.ts`

### Repositories
- Encapsulate database access.
- Example: `src/DB/repository/user.repository.ts`

### Models
- Define MongoDB schemas and Mongoose behavior.
- Example: `src/DB/models/user.model.ts`

### Middleware
- Handle authentication, authorization, validation, rate limiting, and error handling.
- Example: `src/middleware/authentication.middleware.ts`

### Utilities
- JWT, password hashing, OTP generation, and encryption helpers live here.

## 6) Important Notes About the Current Design

- The authentication flow is split into thin controller layers and service-oriented logic.
- OTPs are hashed before storage and compared during verification.
- Password hashing is handled by the user model pre-save hook, not directly inside the service.
- The authenticate middleware protects routes that require a logged-in user.
- Global error handling centralizes exceptions and response formatting.
- **Google Sign-In uses explicit linking, not auto-linking by email.** A local account and a Google sign-in attempt on the same email are treated as separate until the user deliberately links them while logged in via `PATCH /users/me/link-google`. This is a deliberate security choice: auto-linking by email would let an attacker who temporarily controls someone's email complete a Google OAuth flow and gain access to an existing account without ever knowing its password.
- **Phone is still required for local signup, but optional in storage/profile output.** Google ID tokens do not include a phone number, so Google-only accounts are allowed to start without one. A local signup request still validates and requires `phone`.
- **Role switching is a UI concern, authorization is not.** `activeRole` never appears in JWT claims and is never checked by `authorization.middleware.ts`. Only `roles[]` gates access. This was a deliberate decision to avoid the confusing case of a user being denied access to something they're actually allowed to do, just because of which dashboard they last viewed.
- **Adding a role reissues tokens; switching the active role does not.** This distinction matters because one changes what the user can do (needs a fresh token to reflect it immediately) and the other only changes what's displayed.

## 7) Suggested Reading Order

If you want to understand the project quickly, read these files in order:

1. `src/main.ts`
2. `src/app.controller.ts`
3. `src/modules/auth/auth.controller.ts`
4. `src/modules/auth/auth.service.ts` — pay attention to `issueTokens` and `loginWithGoogle`
5. `src/middleware/authentication.middleware.ts`
6. `src/middleware/authorization.middleware.ts` — note the array-overlap check
7. `src/common/services/otp.service.ts`
8. `src/common/services/google-auth.service.ts`
9. `src/DB/repository/user.repository.ts`
10. `src/DB/models/user.model.ts` — note `roles[]` vs `activeRole`
