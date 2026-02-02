Social Media Platform – Technical PRD (MVP)

1. Product Overview

A public, free-speech-oriented social platform for adults using real
identities, focused on chronological content, interest-based discovery,
and real-time communication.

Core Principles

-   Chronological feeds (no algorithmic ranking)
-   Followers-only social graph
-   Interest-based discovery
-   Real-time communication
-   Strong security & GDPR compliance
-   Extensible architecture (dating, games, public API)

------------------------------------------------------------------------

2. Target Audience

-   Adults
-   Users valuing free speech & non-mainstream ideas
-   Public-facing community
-   Languages: English & Swedish

------------------------------------------------------------------------

3. MVP Functional Requirements

3.1 Authentication & Accounts

-   Email/password authentication
-   One account per email
-   Real-name policy (first + last name, changeable)
-   Public or private accounts
-   Profile visibility based on account settings

3.2 Profiles

-   Name
-   Bio
-   Interests (selected at account creation)
-   Followers / following count
-   User’s posts (chronological)

3.3 Social Graph

-   Followers-only model (Twitter-style)
-   Follow / unfollow users
-   Private account follow requests (auto-accept optional)

3.4 Posting

-   Text-only posts
-   Timestamped
-   Visibility: public or followers-only
-   Soft deletion support for moderation

3.5 Feeds

Follower Feed

-   Chronological posts from followed users

Exploration Feed

-   Chronological posts based on user interests

3.6 Interactions

-   Likes
-   Comments (single-level, no threading)

3.7 Chat

-   1:1 direct messaging between any users
-   Real-time delivery
-   Message persistence
-   No read receipts or typing indicators in MVP

3.8 Admin Moderation

-   Admin can ban users
-   Admin can remove posts
-   All moderation actions logged
-   No shadow banning

------------------------------------------------------------------------

4. Out of Scope (MVP)

-   Media uploads (backend prepared only)
-   Notifications
-   User reporting
-   Groups
-   Dating
-   Games
-   Monetization
-   Dark mode
-   Public API

------------------------------------------------------------------------

5. Non-Functional Requirements

5.1 Security

-   Password hashing (bcrypt or argon2)
-   HTTPS everywhere
-   CSRF protection
-   XSS protection
-   Rate limiting (auth, posting, chat)
-   Secure JWT-based authentication
-   Audit logs for admin actions

5.2 GDPR Compliance

-   Explicit consent during signup
-   Right to data export
-   Right to account deletion
-   Minimal data collection
-   Clear data retention policy

5.3 Scalability

-   Support thousands of users
-   Stateless backend services
-   Horizontal scalability possible
-   Real-time services scalable via Redis pub/sub

------------------------------------------------------------------------

6. Technical Stack

6.1 Frontend

-   React + TypeScript
-   Tailwind CSS (minimal, clean design)
-   Headless UI / Radix UI (optional)
-   REST API communication

6.2 Backend

-   Node.js + TypeScript
-   NestJS framework
-   REST API (GraphQL possible later)

6.3 Database

-   PostgreSQL (primary relational database)
-   Redis (caching, rate limiting, real-time pub/sub)

6.4 Real-Time Communication

-   WebSockets via NestJS Gateway
-   Redis pub/sub for horizontal scaling

6.5 Authentication

-   JWT access tokens
-   Refresh tokens stored as httpOnly cookies
-   MFA-ready design (future)

6.6 Media (Post-MVP)

-   S3-compatible object storage
-   Media service abstraction prepared in MVP

------------------------------------------------------------------------

7. Architecture

7.1 Architectural Style

-   Modular monolith
-   Single deployable application
-   Strict module boundaries

7.2 Backend Modules

/auth
/users
/profiles
/interests
/social-graph
/posts
/comments
/likes
/feeds
/chat
/moderation
/admin
/common

7.3 Architecture Rules

-   Each module owns its data
-   No direct cross-module database writes
-   Communication via services/interfaces only
-   Shared utilities placed in /common
-   Stateless services wherever possible

------------------------------------------------------------------------

8. Extensibility Strategy

8.1 Dating Integration (Future)

-   Reuse profiles, interests, and chat
-   Separate dating module
-   Matching logic isolated from core social feed

8.2 Games (Future)

-   Dedicated real-time modules
-   Async and real-time support
-   No coupling with social feed logic

8.3 Public API (Future)

-   API gateway in front of existing services
-   Rate-limited and scoped access

------------------------------------------------------------------------

9. Deployment & Infrastructure (Initial)

-   Managed hosting (Render / Railway / Fly.io)
-   Managed PostgreSQL
-   Managed Redis
-   CI/CD via GitHub Actions
-   Environment-based configuration

------------------------------------------------------------------------

10. Risks & Mitigations

Free Speech & Abuse

-   Built-in moderation hooks from day one
-   Audit logs for accountability

Inexperienced Team

-   Opinionated framework (NestJS)
-   Modular boundaries enforced early
-   Avoid microservices initially

------------------------------------------------------------------------

11. Success Criteria (MVP)

-   Users can register, post, follow, chat, and interact
-   Feeds are chronological and performant
-   Real-time chat works reliably
-   Admin moderation actions function correctly
-   GDPR requirements met
