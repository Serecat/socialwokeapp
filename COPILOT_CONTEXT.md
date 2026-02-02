# Project Context for GitHub Copilot

This project is a social media web application with the following properties:

- Public-facing platform for adults using real identities
- Followers-only social graph (Twitter-style)
- Chronological feeds only (no ranking algorithms)
- Two feeds:
  - Follower Feed (users you follow)
  - Exploration Feed (interest-based, chronological)
- Text-only posts in MVP
- 1:1 real-time chat between users
- Modular monolith architecture
- Tech stack:
  - Frontend: React + TypeScript
  - Backend: NestJS (Node.js + TypeScript)
  - Database: PostgreSQL
  - Cache / Realtime scaling: Redis
- Strong focus on security, GDPR compliance, and extensibility
- Future features include dating, games, and a public API

All code should follow the modular monolith architecture described in PRD.md.