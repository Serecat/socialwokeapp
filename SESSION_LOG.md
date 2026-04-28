# Session Log

SESSION_LOG.md is the append-only chronological record of development sessions.
Do not edit, reorder, or delete prior entries. Only append new entries at the end
immediately after each meaningful change.

## Entry Template

Timestamp:
Headline:
Refs: 
Summary:
Implementation notes:
Validation:
Security/privacy notes:
Spec/requirements changes approved: Yes/No
If Yes:
Changes:
Approved by:
Approved at:
Plan updates made:

## Entries

Timestamp: 2026-04-22T20:20:00+00:00
Headline: Create SESSION_LOG.md for append-only session tracking
Refs: local/untracked change
Summary: Added the required session log with header, template, and initial entry to establish the append-only practice.
Implementation notes: Created SESSION_LOG.md at the repository root with the mandated structure and documented current validation context.
Validation: backend npm run lint (warning: src/main.ts no-floating-promises), backend npm run test (failed: AppController "Hello World" mismatch), backend npm run build (pass); frontend npm run build (pass); frontend npm test (pass).
Security/privacy notes: None
Spec/requirements changes approved: No
If Yes:
Changes: N/A
Approved by: N/A
Approved at: N/A
Plan updates made: N/A

Timestamp: 2026-04-27T19:47:32+00:00
Headline: Phase 0.1 – Security baseline & code hygiene
Refs: branch copilot/implement-phase-0-1, commit 13302e3
Summary: Implemented all tasks listed under Phase 0.1 of implementation-plan.md. Fixed critical and medium security findings: missing startup validation for JWT_SECRET, no rate limiting on auth endpoints, email PII exposure in user search/profile APIs, unvalidated comment payloads, inconsistent MaxLength on UpdatePostDto, debug logging in Signup.tsx, and redundant jsonwebtoken dependency.
Implementation notes:
- Added @nestjs/config with a Joi validation schema (backend/src/common/config.ts) that throws at startup if JWT_SECRET < 32 chars or DATABASE_URL/CORS_ORIGIN are absent.
- AuthModule switched to JwtModule.registerAsync; JwtStrategy now injects ConfigService instead of reading process.env.JWT_SECRET directly.
- Installed @nestjs/throttler; ThrottlerGuard registered globally (60 req/min default). AuthController decorated with @Throttle({ default: { ttl: 60000, limit: 5 } }) for 5 req/min on all POST /auth/* endpoints.
- Removed email from select and where clauses in UsersService.getProfileBasicsById and searchUsers; email only returned via /users/me.
- Created CreateCommentDto (@IsString @IsNotEmpty @MaxLength(1000)) and wired it into the POST /:id/comments endpoint, replacing the raw @Body('content') parameter.
- Aligned UpdatePostDto MaxLength to 2000 (was 5000).
- Removed console.group debug block from frontend/src/screens/Auth/Signup.tsx.
- Removed redundant jsonwebtoken direct dependency from backend/package.json.
- Cleaned up main.ts: removed commented-out dotenv import; PORT and CORS_ORIGIN now read via ConfigService.
Validation: backend npm run build (pass), backend npm run lint (pass, no warnings), backend npm run test (1 pre-existing failure: AppController "Hello NIXON!" vs "Hello World!" — unrelated to this session), CodeQL scan (0 alerts).
Security/privacy notes: JWT_SECRET is now validated at startup — server will refuse to start if the secret is absent or too short. Email field removed from user search responses (GDPR PII fix). Auth endpoints are now rate-limited to prevent brute-force attacks.
Spec/requirements changes approved: No
If Yes:
Changes: N/A
Approved by: N/A
Approved at: N/A
Plan updates made: N/A

Timestamp: 2026-04-27T20:01:08+00:00
Headline: Phase 0.2 – Full httpOnly cookie + refresh token auth flow
Refs: branch copilot/implement-phase-0-2
Summary: Replaced localStorage JWT storage with a secure httpOnly cookie-based session system. Access tokens are now short-lived (15 min) and kept in React memory only. Refresh tokens (30-day) are stored hashed (SHA-256) in a new RefreshToken DB table and delivered via an httpOnly + Secure + SameSite=Strict cookie. A 401 interceptor silently rotates the token and retries failed requests; on rotation failure the user is redirected to login.
Implementation notes:
- Added RefreshToken model to prisma/schema.prisma (id, userId, tokenHash unique, expiresAt, createdAt) with CASCADE delete from User; manual migration SQL created in prisma/migrations/20260427200000_add_refresh_token/.
- Installed cookie-parser + @types/cookie-parser; wired app.use(cookieParser()) in main.ts.
- auth.module.ts: JWT signOptions expiry changed from 1h → 15m.
- auth.service.ts: login() now generates a 128-char hex refresh token, hashes it with SHA-256, persists the hash, and sets the httpOnly cookie (path /auth). New refresh() method validates the cookie token against the DB, atomically rotates (delete + insert in $transaction), and issues a new access token. New logout() deletes the DB record and clears the cookie.
- auth.controller.ts: POST /auth/login updated to inject @Res({ passthrough: true }); new POST /auth/refresh and POST /auth/logout endpoints added (all still under the 5 req/min throttle).
- frontend/src/services/api.ts: removed localStorage token read; added module-level _accessToken, setAccessToken(), getAccessToken(), setOnUnauthenticated() exports; axios instance gains withCredentials: true; added 401 response interceptor with concurrent-request queuing that calls /auth/refresh, retries the original request on success, or calls onUnauthenticated() on failure.
- frontend/src/screens/Auth/Login.tsx: replaced localStorage.setItem with setAccessToken(); onSuccess prop simplified (no longer passes email).
- frontend/src/App.tsx: added useEffect that fires a silent POST /auth/refresh on mount (restores session from cookie after page reload); loading state shown during the attempt; logout now calls logoutUser() API then clears in-memory token; setOnUnauthenticated(goToAuth) registered on mount.
- frontend/src/App.test.tsx: updated to mock axios.post to reject (simulating no refresh cookie) and use waitFor so the test waits for the async mount effect to settle before asserting the login heading.
Validation: backend npm run build (pass), backend npm run lint (pass), backend npm run test (1 pre-existing failure: AppController "Hello NIXON!" vs "Hello World!" — unrelated), frontend npm run build (pass), frontend npm test (pass — 1 test updated to match new async loading behaviour).
Security/privacy notes: Refresh tokens are stored only as SHA-256 hashes — the raw token is never persisted. Token rotation is atomic (Prisma $transaction) to prevent replay attacks. The httpOnly + Secure + SameSite=Strict cookie flags prevent XSS token theft and CSRF. Access token is kept only in JS memory and is never written to localStorage or any non-httpOnly cookie.
Spec/requirements changes approved: No
If Yes:
Changes: N/A
Approved by: N/A
Approved at: N/A
Plan updates made: implementation-plan.md — added ✅ checkmarks to Phase 0.1 and Phase 0.2 task lists and section headings.

Timestamp: 2026-04-28T17:05:00+00:00
Headline: Phases 0.3–0.6 – Tailwind build dep, global exception filter, Helmet, CI/CD, Redis
Refs: branch copilot/implement-phase-03-to-06
Summary: Implemented all tasks listed under Phases 0.3, 0.4, 0.5, and 0.6 of implementation-plan.md. Moved Tailwind CSS from CDN to a proper build dependency (v4 Vite plugin), added Helmet HTTP security headers, created a global exception filter to prevent stack-trace leakage, wired up a CI/CD pipeline via GitHub Actions, and introduced a Redis service with ioredis used as the ThrottlerModule storage backend.
Implementation notes:
- Phase 0.3: Installed tailwindcss v4, postcss, autoprefixer, and @tailwindcss/vite. Updated vite.config.ts to add the @tailwindcss/vite plugin (Tailwind v4 Vite-first setup). Added @import "tailwindcss" to index.css. Removed CDN <script src="https://cdn.tailwindcss.com"> from index.html. Also fixed a pre-existing TypeScript error in App.test.tsx where actual.default was referenced incorrectly (should be actual for AxiosStatic); build and tests pass.
- Phase 0.4: Installed helmet; added app.use(helmet()) before cookieParser in main.ts. Created backend/src/common/filters/all-exceptions.filter.ts — catches PrismaClientKnownRequestError (P2002→409, P2025→404, P2003→400), PrismaClientValidationError (→400), HttpException (passed through), and unknown errors (generic 500, stack logged server-side only). Registered globally via app.useGlobalFilters().
- Phase 0.5: Created .github/workflows/ci.yml with two parallel jobs: backend-ci (npm ci → npm run lint → npm run test) and frontend-ci (npm ci → npm run build → npm test). Both jobs use Node 18.x and cache node_modules by package-lock.json hash.
- Phase 0.6: Installed ioredis v5 (ships own types) and @nest-lab/throttler-storage-redis. Created backend/src/common/redis.service.ts — an @Injectable() that opens an ioredis connection on module init (lazyConnect, 1 retry, offline queue disabled), logs connect/error, and exposes getClient(). Exported from CommonModule (@Global). Updated AppModule to use ThrottlerModule.forRootAsync with ThrottlerStorageRedisService backed by REDIS_URL config. Added REDIS_URL to config validation (optional, defaults to redis://localhost:6379) and .env.example.
Validation: backend npm run build (pass), backend npm run lint (pass, no warnings), backend npm run test (1 pre-existing failure: AppController "Hello NIXON!" vs "Hello World!" — unrelated), frontend npm run build (pass), frontend npm test (pass).
Security/privacy notes: Helmet adds X-Frame-Options, X-Content-Type-Options, X-DNS-Prefetch-Control, Strict-Transport-Security, and other standard security headers to all responses. The global exception filter ensures no Prisma error details or stack traces leak to API consumers.
Spec/requirements changes approved: No
If Yes:
Changes: N/A
Approved by: N/A
Approved at: N/A
Plan updates made: implementation-plan.md — added ✅ checkmarks to Phase 0.3, 0.4, 0.5, and 0.6 task lists and section headings. Updated 0.3 task list to reflect Tailwind v4 Vite plugin approach instead of init -p. Updated 0.6 files list to reference app.module.ts instead of main.ts for ThrottlerModule config.
