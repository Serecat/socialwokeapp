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
