# SocialWoke – Priority-Based Implementation Plan

> Generated: 2026-04-22  
> Based on: PRD.md, Executioon roadmap.md, _MVP_Execution_Manual.md_, full codebase review, and owner Q&A.

---

## Owner Decisions (locked)

| # | Question | Decision |
|---|---|---|
| Q1 | JWT storage strategy | Full httpOnly cookie + refresh token flow, implemented in Phase 0 |
| Q2 | Private account follow requests | Manual accept/reject only for MVP |
| Q3 | Account deletion behaviour | Posts anonymised (author de-identified, content preserved) |
| Q4 | Interests feed scope | Predefined interest list for MVP |
| Q5 | Admin tooling | REST-only for MVP (no admin UI) |
| Q6 | Localisation | English-only for MVP |
| Q7 | Redis setup timing | Set up in Phase 0 (needed for chat + rate limiting) |
| Q8 | Doc filename typos | No changes needed |

---

## Repo State Summary

### ✅ Implemented
| Area | Notes |
|---|---|
| NestJS project scaffold | Modules, routing, `ValidationPipe` |
| Auth – register + login | bcrypt hashing, JWT access token, class-validator DTOs |
| Users service | `getMe`, `getUserProfile`, `searchUsers` |
| Posts CRUD | create, update, soft-delete, cursor pagination |
| Likes | Toggle with atomic counter via `$transaction` |
| Comments | `addComment`, `getPostComments` (non-threaded) |
| Follower feed | Cursor-paginated, chronological |
| Global feed | Cursor-paginated, public posts |
| Prisma schema | User, Post, Comment, PostLike, Follow with indexes |
| Health endpoint (`/ready`) | DB liveness check |
| Frontend – auth screens | Login + Signup wired to API |
| Frontend – feed screen | Post creation, likes, comments, user search, feed toggle |
| Frontend – profile screen | Own and other user profiles, post list |
| CORS config | Env-var driven |

### ⚠️ Partially Implemented
| Area | Notes |
|---|---|
| Social Graph module | Module/service/controller exist but are empty — no follow/unfollow endpoints |
| Moderation module | Empty shell |
| Chat module | Backend and frontend stubs only |
| Exploration/interests feed | `getGlobalFeed` returns all public posts — not interest-based |
| User profile fields | Only firstName/lastName/email — no bio, isPrivate, or interests |

### ❌ Not Started
| Area | Notes |
|---|---|
| Interests module | No schema model, no module, no UI |
| Private account + follow request flow | No `isPrivate` flag, no `FollowRequest` model |
| Admin module | No routes, no `role` field on User |
| WebSocket Gateway | No real-time chat wiring |
| Redis integration | No connection, no pub/sub, no rate limiting |
| Refresh tokens (httpOnly cookies) | Only short-lived access tokens returned as JSON body |
| Rate limiting | No throttler on any endpoint |
| Security headers (Helmet) | Not installed |
| GDPR endpoints | No data export, no anonymisation/deletion |
| Audit log model | No schema model or service |
| CI/CD workflows | No `.github/workflows/` directory |
| Profile edit endpoint | No `PATCH /users/me` |
| GDPR consent flag | No field, no UI checkbox |
| Frontend router | State-machine navigation only (no React Router) |

---

## Key Risks & Security Findings

### 🔴 HIGH

**1 – JWT stored in `localStorage` — XSS token theft**
- Risk: Any injected script steals the token → full account takeover.
- Location: `frontend/src/screens/Auth/Login.tsx:24`, `App.tsx:20`, `services/api.ts:11`
- Fix: Move to httpOnly + Secure + SameSite=Strict cookie; keep access token in React memory only. *(Addressed in Phase 0.2)*

**2 – No refresh token flow — tokens never revocable**
- Risk: Stolen tokens valid for 1 hour; no logout-all capability.
- Location: `auth.service.ts`, `auth.module.ts`
- Fix: Short-lived access token (15 min) + long-lived refresh token in httpOnly cookie. Add `/auth/refresh` and `/auth/logout`. *(Addressed in Phase 0.2)*

**3 – No rate limiting on auth endpoints**
- Risk: Unlimited brute-force attempts against `/auth/login`.
- Location: `auth.controller.ts`, `main.ts`
- Fix: `@nestjs/throttler` with Redis store; 5 req/min on auth routes. *(Addressed in Phase 0.1)*

**4 – `JWT_SECRET` not validated at startup**
- Risk: If env var is absent, tokens are signed with `undefined` as the secret — all tokens become trivially forgeable.
- Location: `auth.module.ts:11`, `jwt.strategy.ts:14`
- Fix: `@nestjs/config` with Joi/Zod schema that throws on startup if `JWT_SECRET` is missing or too short. *(Addressed in Phase 0.1)*

### 🟡 MEDIUM

**5 – Email exposed in user search and profile responses**
- Risk: Authenticated users can enumerate all emails via `GET /users/search?q=a` — GDPR PII leak.
- Location: `users.service.ts:44–55`, `users.service.ts:14–31`
- Fix: Remove `email` from `select` in `searchUsers` and `getProfileBasicsById`; email visible only to account owner via `/users/me`. *(Addressed in Phase 0.1)*

**6 – Debug logging of HTTP request data in production code**
- Risk: `console.group` logs full request URL and server response to browser console, leaking API structure.
- Location: `frontend/src/screens/Auth/Signup.tsx:34–40`
- Fix: Remove debug block (or gate behind `import.meta.env.DEV`). *(Addressed in Phase 0.1)*

**7 – No HTTP security headers (Helmet)**
- Risk: Missing CSP, X-Frame-Options, X-Content-Type-Options, etc.
- Fix: `npm install helmet`, `app.use(helmet())` in `main.ts`. *(Addressed in Phase 0.4)*

**8 – Comment content not validated via DTO**
- Risk: No server-side length limit → potential DoS via oversized payloads.
- Location: `posts.controller.ts:82–89` (`@Body('content') content: string` bypasses class-validator)
- Fix: Create `CreateCommentDto` with `@IsString() @MaxLength(1000) content`. *(Addressed in Phase 0.1)*

**9 – Tailwind CSS loaded from CDN in production**
- Risk: CDN availability dependency, no tree-shaking, CSP issues.
- Location: `frontend/index.html:12`
- Fix: Install Tailwind as a PostCSS dev dependency. *(Addressed in Phase 0.3)*

**10 – UpdatePost `MaxLength` 5000 vs CreatePost 2000 — inconsistency**
- Risk: Users can expand posts via PATCH beyond what they could create.
- Location: `posts-dto/update-posts.dto.ts:7`, `create-posts.dto.ts:15`
- Fix: Align both to 2000. *(Addressed in Phase 0.1)*

### 🟢 LOW

**11 – No global exception filter — Prisma errors can leak stack traces**
- Fix: Add `GlobalExceptionFilter` that catches `PrismaClientKnownRequestError` and returns sanitised HTTP responses. *(Addressed in Phase 0.4)*

**12 – `import 'dotenv/config'` commented out in `main.ts`**
- Risk: Production may miss env vars if not loaded by the process manager.
- Fix: Use `@nestjs/config` consistently. *(Addressed in Phase 0.1)*

**13 – `jsonwebtoken` listed as a direct dependency alongside `@nestjs/jwt`**
- Risk: Redundant dependency increases surface area.
- Fix: Remove `jsonwebtoken` from `package.json`. *(Addressed in Phase 0.1)*

---

## Priority-Based Implementation Plan

---

### Phase 0 — Foundations & Security Hardening
> *Complete before any new feature work. Fixes critical vulnerabilities and sets up infrastructure.*

---

#### 0.1 – Security baseline & code hygiene
**Objective:** Fix the top critical vulnerabilities and clean up obvious code issues.

**Key tasks:**
- Add `@nestjs/config` with Joi startup validation for `JWT_SECRET` (min 32 chars), `DATABASE_URL`, `CORS_ORIGIN`
- Install `@nestjs/throttler` with Redis store (see 0.6); apply 5 req/min to auth routes
- Remove `email` from `select` in `users.service.ts` (`searchUsers` + `getProfileBasicsById`); email visible only via `/users/me`
- Create `CreateCommentDto` (`@IsString() @MaxLength(1000) content`) and apply to the comment endpoint
- Align `UpdatePostDto` `MaxLength` to 2000
- Remove debug `console.group` block from `Signup.tsx`
- Remove redundant `jsonwebtoken` dependency from `backend/package.json`

**Files:**
- `backend/src/main.ts`
- `backend/src/auth/auth.module.ts`
- `backend/src/users/users.service.ts`
- `backend/src/posts/posts.controller.ts` (new `CreateCommentDto`)
- `backend/src/posts/posts-dto/update-posts.dto.ts`
- `frontend/src/screens/Auth/Signup.tsx`
- `backend/package.json`

**Effort:** S  
**Risk:** Low — purely additive or restrictive changes.  
**Validation:** Auth endpoints return 429 after 5 rapid attempts. User search response contains no email field. Startup throws a clear error if `JWT_SECRET` is missing. Comment endpoint rejects payloads over 1000 chars.

---

#### 0.2 – Full httpOnly cookie + refresh token auth flow
**Objective:** Replace `localStorage` JWT with a secure cookie-based session system as specified in the PRD.

**Key tasks:**
- Add `RefreshToken` model to Prisma schema: `id`, `userId`, `tokenHash`, `expiresAt`, `createdAt`
- Implement `POST /auth/refresh`: validate refresh token cookie → issue new access token + rotate refresh token
- Implement `POST /auth/logout`: invalidate refresh token in DB, clear cookie
- Update `login` response: access token in JSON body (short-lived, 15 min), refresh token as `httpOnly + Secure + SameSite=Strict` cookie (30-day expiry)
- Frontend: remove `localStorage.setItem('access_token')`; store access token in React context/state only
- Add axios response interceptor for 401 → silent `/auth/refresh` → retry original request
- Handle refresh failure by redirecting to login

**Files:**
- `backend/prisma/schema.prisma` (new `RefreshToken` model)
- `backend/src/auth/auth.service.ts`
- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/auth.module.ts` (import `ConfigModule`, `CookieParserModule`)
- `frontend/src/services/api.ts` (interceptor, remove localStorage)
- `frontend/src/screens/Auth/Login.tsx`
- `frontend/src/App.tsx` (auth context)

**Dependencies:** 0.1 (ConfigModule in place), 0.6 (Redis for token invalidation optionally)  
**Effort:** M  
**Risk:** Medium — token rotation must be atomic to avoid race conditions on concurrent requests. Use a DB transaction or Redis SET NX.  
**Validation:** `access_token` is not present in `localStorage` or any readable cookie. Refresh cookie is `HttpOnly`. `/auth/logout` clears the cookie and the DB record. A second call to `/auth/refresh` with the same (rotated-away) token returns 401.

---

#### 0.3 – Tailwind CSS as a proper build dependency
**Objective:** Remove the CDN `<script>` tag; ensure Tailwind is tree-shaken at build time.

**Key tasks:**
- `npm install -D tailwindcss postcss autoprefixer` in `frontend/`
- `npx tailwindcss init -p` (generates `tailwind.config.js` + `postcss.config.js`)
- Configure `content` paths in `tailwind.config.js`
- Add `@tailwind base; @tailwind components; @tailwind utilities;` to `frontend/src/index.css`
- Remove CDN `<script>` tag from `frontend/index.html`

**Files:**
- `frontend/index.html`
- `frontend/src/index.css`
- `frontend/package.json`
- `frontend/tailwind.config.js` (new)
- `frontend/postcss.config.js` (new)

**Effort:** S  
**Validation:** `npm run build` succeeds with no CDN script tag; Tailwind classes still render correctly in `npm run dev`.

---

#### 0.4 – Global exception filter + Helmet
**Objective:** Prevent stack trace leakage and add standard HTTP security headers.

**Key tasks:**
- `npm install helmet` in backend; `app.use(helmet())` in `main.ts`
- Create `src/common/filters/all-exceptions.filter.ts` implementing `ExceptionFilter`; catch `PrismaClientKnownRequestError` and `PrismaClientValidationError`, map to clean HTTP responses (400/404/409); catch unknown errors and return generic 500 with no internal details
- Register filter globally in `main.ts`

**Files:**
- `backend/src/main.ts`
- `backend/src/common/filters/all-exceptions.filter.ts` (new)

**Effort:** S  
**Validation:** `GET /nonexistent` returns `{"statusCode":404,"message":"Not Found"}` with no stack trace. Response headers include `X-Frame-Options`, `X-Content-Type-Options`.

---

#### 0.5 – CI/CD pipeline
**Objective:** Automated lint + test on every push and pull request.

**Key tasks:**
- Create `.github/workflows/ci.yml` with jobs:
  - `backend-ci`: `npm ci`, `npm run lint`, `npm run test`
  - `frontend-ci`: `npm ci`, `npm run build`, `npm test`
- Use Node 18.x
- Backend tests use a test database (environment secret `DATABASE_URL_TEST`) or Prisma with SQLite in-memory for unit tests
- Cache `node_modules` by `package-lock.json` hash

**Files:**
- `.github/workflows/ci.yml` (new)

**Effort:** S  
**Validation:** Opening a PR triggers the workflow; a failing test blocks merge.

---

#### 0.6 – Redis setup
**Objective:** Single Redis connection usable by rate limiting (Phase 0.1), chat (Phase 1.5), and future caching.

**Key tasks:**
- `npm install ioredis` in backend
- Create `src/common/redis.service.ts` — NestJS injectable wrapping `ioredis`, connection from `REDIS_URL` env var
- Export from `CommonModule`
- Add `REDIS_URL` to `.env.example` and config validation (0.1)
- Wire `@nestjs/throttler` to use Redis store

**Files:**
- `backend/src/common/redis.service.ts` (new)
- `backend/src/common/common.module.ts`
- `backend/.env.example`
- `backend/src/main.ts` (ThrottlerModule config)

**Effort:** S  
**Validation:** Backend starts and logs Redis connection. Rate limiting is functional (see 0.1 validation).

---

### Phase 1 — MVP Core Features

---

#### 1.1 – Extended schema
**Objective:** Bring the Prisma schema in line with all PRD requirements in one migration.

**Key tasks:**

Add to `User` model:
- `bio String? @db.Text`
- `isPrivate Boolean @default(false)`
- `role UserRole @default(USER)` (enum: `USER`, `ADMIN`)
- `gdprConsent Boolean @default(false)`
- `gdprConsentAt DateTime?`
- `bannedAt DateTime?`

New models:
- `Interest` — `id`, `name` (unique), `slug` (unique)
- `UserInterest` — join table `userId + interestId` (composite PK)
- `FollowRequest` — `id`, `fromUserId`, `toUserId`, `status` (enum: `PENDING`, `ACCEPTED`, `REJECTED`), `createdAt`
- `ChatMessage` — `id`, `senderId`, `receiverId`, `content`, `createdAt`, `readAt DateTime?`
- `AuditLog` — `id`, `adminId`, `action String`, `targetType String`, `targetId String`, `metadata Json?`, `createdAt`

Add DB indexes for `ChatMessage([senderId, receiverId, createdAt])`, `FollowRequest([toUserId, status])`.

**Files:**
- `backend/prisma/schema.prisma`
- New migration file via `prisma migrate dev`

**Dependencies:** 0.1 (ConfigModule for DATABASE_URL validation)  
**Effort:** M  
**Risk:** Low for new columns/models; `gdprConsent` defaults handle existing rows.  
**Validation:** `prisma migrate dev` succeeds; `prisma studio` shows all new fields and models.

---

#### 1.2 – Profile module (read + edit)
**Objective:** Full profile with bio, interests, privacy toggle, follower/following counts.

**Key tasks:**
- `PATCH /users/me` — update `firstName`, `lastName`, `bio`, `isPrivate`, interests (replace set)
- Update `GET /users/me` response to include `bio`, `isPrivate`, `interests`, `followerCount`, `followingCount`
- Update `GET /users/:id` — if target account is private and requester is not a follower, return limited info (name only, no bio/posts)
- Frontend `Profile.tsx` — add bio display, follow/unfollow button (calls Phase 1.3 endpoints), edit form for own profile
- DTOs: `UpdateProfileDto`

**Files:**
- `backend/src/users/users.service.ts`
- `backend/src/users/users.controller.ts`
- `backend/src/users/users.module.ts`
- New `UpdateProfileDto`
- `frontend/src/screens/Profile/Profile.tsx`
- `frontend/src/services/api.ts`

**Dependencies:** 1.1 (schema fields)  
**Effort:** M  
**Validation:** `PATCH /users/me` updates bio and `isPrivate`. `GET /users/:id` for a private account returns 200 with limited fields for non-followers.

---

#### 1.3 – Social Graph module
**Objective:** Follow/unfollow + private account follow request flow.

**Key tasks:**
- `POST /social-graph/follow/:userId`
  - Public account → create `Follow` immediately
  - Private account → create `FollowRequest` with status `PENDING`; return `{ status: 'requested' }`
- `DELETE /social-graph/follow/:userId` — unfollow (delete `Follow` or cancel `FollowRequest`)
- `GET /social-graph/followers/:userId` — paginated followers list
- `GET /social-graph/following/:userId` — paginated following list
- `GET /social-graph/follow-requests` — own pending incoming requests (auth required)
- `POST /social-graph/follow-requests/:requestId/accept`
- `POST /social-graph/follow-requests/:requestId/reject`
- Frontend: follow/unfollow button on profile, pending requests indicator

**Files:**
- `backend/src/social-graph/social-graph.service.ts`
- `backend/src/social-graph/social-graph.controller.ts`
- `backend/src/social-graph/social-graph.module.ts`
- New DTOs
- `frontend/src/screens/Profile/Profile.tsx`
- `frontend/src/services/api.ts`

**Dependencies:** 1.1 (FollowRequest model, `isPrivate` field)  
**Effort:** M  
**Validation:** Following a public user creates a `Follow` record immediately. Following a private user creates a `FollowRequest` and `GET /social-graph/follow-requests` returns it. Accept/reject changes the record status.

---

#### 1.4 – Interests module + Exploration feed
**Objective:** Predefined interest list, user interest selection, and interest-based exploration feed.

**Key tasks:**
- Create `/interests` module
- `GET /interests` — return full predefined list (seeded via Prisma seed script)
- `POST /users/me/interests` — replace user's interest set
- Seed ~25 predefined interests (e.g. Technology, Science, Politics, Arts, Sports, Gaming, etc.)
- Update `getGlobalFeed` → rename to `getExplorationFeed`: filter posts by authors who share ≥ 1 interest with the requesting user (fall back to all public posts if user has no interests set)
- Add interests picker to `Signup.tsx` (at least one required)
- Add interests display/edit to `Profile.tsx`
- Update feed UI tabs: "Following" | "Explore"

**Files:**
- `backend/src/` — new `interests/` module
- `backend/src/feeds/feeds.service.ts`
- `backend/src/feeds/feeds.controller.ts`
- `backend/prisma/seed.ts` (new)
- `frontend/src/screens/Auth/Signup.tsx`
- `frontend/src/screens/Feed/Feed.tsx`
- `frontend/src/services/api.ts`

**Dependencies:** 1.1 (Interest, UserInterest models)  
**Effort:** M  
**Validation:** `GET /interests` returns 20+ items. Exploration feed only shows posts from authors sharing at least one interest with the user. User with no interests sees all public posts.

---

#### 1.5 – Chat (WebSocket + Redis pub/sub + persistence)
**Objective:** 1:1 real-time messaging with message history.

**Key tasks:**
- Install `@nestjs/websockets`, `@nestjs/platform-socket.io`, `@socket.io/redis-adapter`
- Create `chat.gateway.ts` with `@WebSocketGateway`
  - Authenticate connection via access token (passed in `auth` header during handshake, not query param)
  - `sendMessage` event: persist `ChatMessage` to DB, publish to Redis channel, deliver to recipient if online
  - `joinConversation` event: client subscribes to its own channel
- `GET /chat/conversations` — list distinct conversations for authenticated user (last message preview + unread count)
- `GET /chat/:userId/messages` — paginated message history (cursor-based)
- `POST /chat/:userId/messages` — REST fallback for message sending
- Frontend `Chat.tsx`: conversation list sidebar, message thread, real-time Socket.IO client

**Files:**
- `backend/src/chat/chat.gateway.ts` (new)
- `backend/src/chat/chat.service.ts`
- `backend/src/chat/chat.controller.ts`
- `backend/src/chat/chat.module.ts`
- `frontend/src/screens/Chat/Chat.tsx`
- `frontend/src/services/api.ts`

**Dependencies:** 1.1 (ChatMessage model), 0.2 (secure auth), 0.6 (Redis)  
**Effort:** L  
**Risk:** WebSocket authentication — never pass JWT in query string (visible in logs). Use Socket.IO `auth` option on handshake.  
**Validation:** Two browser sessions can exchange real-time messages. Messages persist after page reload. `GET /chat/:userId/messages` returns history in reverse-chronological order.

---

#### 1.6 – Moderation module + Admin role
**Objective:** Admin ban users, remove posts, full audit trail.

**Key tasks:**
- Create `RolesGuard` and `@Roles('ADMIN')` decorator
- Add `AdminModule` (or extend `ModerationModule`):
  - `POST /admin/users/:id/ban` — set `bannedAt`; write `AuditLog`
  - `DELETE /admin/posts/:id` — admin soft-delete (bypasses ownership check); write `AuditLog`
  - `GET /admin/audit-logs` — paginated audit log
- Update `JwtStrategy.validate` to check `bannedAt` → throw 403 if banned
- Protect moderation endpoints with `RolesGuard`

**Files:**
- `backend/src/moderation/moderation.service.ts`
- `backend/src/moderation/moderation.controller.ts`
- `backend/src/moderation/moderation.module.ts`
- `backend/src/auth/jwt.strategy.ts`
- `backend/src/common/guards/roles.guard.ts` (new)
- `backend/src/common/decorators/roles.decorator.ts` (new)

**Dependencies:** 1.1 (AuditLog, `role`, `bannedAt` fields)  
**Effort:** M  
**Validation:** `POST /admin/users/:id/ban` with a non-admin token returns 403. Banned user's subsequent API requests return 403. `GET /admin/audit-logs` returns a record of the ban.

---

### Phase 2 — Hardening & GDPR

---

#### 2.1 – GDPR compliance endpoints
**Objective:** Meet legal requirements for data portability and right to erasure.

**Key tasks:**
- Add `gdprConsent` checkbox to `Signup.tsx` (required); persist `gdprConsent: true` + `gdprConsentAt: now()` on register
- `GET /users/me/export` — return JSON dump of: profile, posts, comments, likes, follow relationships, chat messages
- `DELETE /users/me` — anonymise user:
  - Set `firstName = 'Deleted'`, `lastName = 'User'`, `email = deleted_{id}@removed`, `password = ''`, `bio = null`
  - Delete: `RefreshToken`, `PostLike`, `Follow`, `FollowRequest`, `UserInterest`
  - Mark `ChatMessage` records with a `deletedBySender` flag (retain for recipient)
  - Invalidate all active sessions
- `RegisterDto` must include `gdprConsent: true` (validated via `@IsBoolean() @Equals(true)`)

**Files:**
- `backend/src/users/users.service.ts`
- `backend/src/users/users.controller.ts`
- `backend/src/auth/auth-dto/register.dto.ts`
- `frontend/src/screens/Auth/Signup.tsx`

**Dependencies:** 1.1 (gdprConsent fields), 0.2 (session invalidation)  
**Effort:** M  
**Risk:** Anonymisation must be atomic (wrap in `$transaction`).  
**Validation:** After `DELETE /users/me`, all subsequent API calls with the user's tokens fail. `GET /posts/:id` for a former user's post shows author as "Deleted User". Export file contains all expected data.

---

#### 2.2 – Structured logging & observability
**Objective:** Replace raw `console.log` with structured logs; surface errors to monitoring.

**Key tasks:**
- Install `nestjs-pino` (or `winston` with NestJS adapter)
- Remove `console.log('🟢 connected to database')` from `prisma.service.ts`; use the logger
- Add request-scoped request ID middleware
- (Optional) Integrate Sentry with PII scrubbing for error reporting

**Files:**
- `backend/src/main.ts`
- `backend/src/common/prisma.service.ts`
- `backend/src/common/middleware/request-id.middleware.ts` (new)

**Effort:** M

---

#### 2.3 – Test coverage
**Objective:** Bring test coverage from near-zero to a meaningful baseline.

**Key tasks:**
- Backend unit tests (Jest + Prisma mock):
  - `auth.service.spec.ts` — register (duplicate email, success), login (wrong password, success)
  - `posts.service.spec.ts` — createPost, softDelete (ownership check), toggleLike
  - `feeds.service.spec.ts` — follower feed query shape, exploration feed interest filter
  - `social-graph.service.spec.ts` — follow public/private, accept/reject request
- Backend E2E tests (`supertest`):
  - Full auth flow: register → login → refresh → logout
  - Post flow: create → like → comment → delete
- Frontend component tests (Vitest + Testing Library):
  - `Login.test.tsx` — renders, submits, shows error on failure
  - `Signup.test.tsx` — renders, submits, GDPR consent required
  - `Feed.test.tsx` — renders post list, toggling feed type

**Files:**
- `backend/src/**/*.spec.ts`
- `backend/test/app.e2e-spec.ts`
- `frontend/src/**/*.test.tsx`

**Effort:** L  
**Validation:** `npm run test:cov` (backend) shows >60% statement coverage on service files. CI passes.

---

#### 2.4 – Frontend routing (React Router)
**Objective:** Replace state-machine navigation with proper URL-based routing.

**Key tasks:**
- Install `react-router-dom` in frontend
- Define routes: `/` (redirect), `/login`, `/signup`, `/feed`, `/profile`, `/profile/:userId`, `/chat`, `/chat/:userId`
- Create `ProtectedRoute` component — redirects to `/login` if no valid access token
- Update `App.tsx` to use `BrowserRouter` + `Routes`
- Update all navigation calls (`setView(...)`) to `navigate(...)`

**Files:**
- `frontend/src/App.tsx`
- `frontend/src/screens/**/*.tsx`
- `frontend/package.json`

**Effort:** M  
**Validation:** Navigating to `/feed` while logged out redirects to `/login`. Browser back button works between profile and feed.

---

### Phase 3 — Pre-Launch (Beta Readiness)

---

#### 3.1 – Performance review
- DB index audit for chat messages: `@@index([senderId, receiverId, createdAt])`
- Consider Redis caching for follower feed on high-follow-count users (simple TTL cache, invalidated on new post)
- Vite bundle analysis: `rollup-plugin-visualizer`

**Effort:** S–M

---

#### 3.2 – Accessibility baseline
- `aria-label` on all icon-only buttons (like/comment icons)
- Keyboard navigation in follow request dialogs
- Focus management when navigating between views
- Colour contrast review (slate/blue palette against WCAG AA)

**Effort:** S

---

#### 3.3 – API documentation
- Install `@nestjs/swagger`
- Annotate all controllers with `@ApiTags`, `@ApiOperation`, `@ApiResponse`
- Expose Swagger UI at `/api/docs` (disabled in production or protected by IP)

**Effort:** M

---

#### 3.4 – Deployment setup
- `docker-compose.yml` for local dev (Postgres 15 + Redis 7 + backend + frontend)
- Environment-specific `.env.production.example`
- Managed hosting setup documentation (Render / Railway / Fly.io)
- Secrets management checklist (never commit `.env`)

**Effort:** S–M

---

## Post-MVP Backlog (Do Not Start Until MVP Is Stable)

| Feature | Notes |
|---|---|
| Media uploads | Backend abstraction for S3-compatible storage; PRD says "prepared only" |
| Push notifications | After chat and social graph are stable |
| Dark mode | Theme toggle post-MVP |
| Dating module | Separate module reusing profiles, interests, chat |
| Games module | Dedicated real-time modules |
| Public API / API gateway | Rate-limited, scoped |
| Threaded comments | Non-threaded is MVP scope |
| Group chats | 1:1 only for MVP |
| Swedish localisation | English-only for MVP |
| Advanced admin UI | REST-only for MVP |

---

## PRD Alignment Gaps (to close during Phase 1)

| PRD Requirement | Gap |
|---|---|
| Refresh tokens in httpOnly cookies | Not implemented — Phase 0.2 |
| Interest-based exploration feed | Currently returns all public posts — Phase 1.4 |
| Social graph follow/unfollow | Module is empty — Phase 1.3 |
| Private account + follow requests | No schema or logic — Phase 1.1 + 1.3 |
| 1:1 real-time chat | Stub only — Phase 1.5 |
| Admin moderation + audit logs | Stub only — Phase 1.6 |
| GDPR consent at signup | Missing field + UI — Phase 2.1 |
| Right to data export + deletion | Not implemented — Phase 2.1 |
| `bio`, `isPrivate`, `role` on User | Missing from schema — Phase 1.1 |
| Rate limiting | Not implemented — Phase 0.1 |
| Security headers | Not installed — Phase 0.4 |
