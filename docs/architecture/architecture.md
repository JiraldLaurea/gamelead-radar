# Architecture

GameLead Radar is a single Next.js application using the App Router. Server Components render the local admin UI, Route Handlers provide form/API actions, and Prisma persists data to an isolated SQLite database.

## Decisions

- ADR-001: Use Next.js API Route Handlers for the MVP backend to keep local setup simple.
- ADR-002: Use SQLite with Prisma for local-first persistence and straightforward backup.
- ADR-003: Keep outreach draft creation manual-review only and never send messages automatically.
- ADR-004: Use RSS-first collection with conservative public webpage parsing.
- ADR-005: Provide deterministic heuristic analysis as an offline fallback; the strict AI JSON schema is implemented for future OpenAI integration.

## Cross-Cutting Concerns

- Validation: Zod validates route inputs and the AI analysis shape.
- Logging: crawl and analyzer failures are stored in `SystemLog`.
- Exports: CSV and XLSX are generated from filtered opportunities.
- Backup: SQLite backups are timestamped under `backups/db/`.
- Security: `.env` is ignored, automation flags default to false, and login/CAPTCHA bypass is out of scope.
