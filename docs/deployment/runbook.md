# Local Runbook

1. Copy `.env.example` to `.env`.
2. Keep `ENABLE_AUTO_EMAIL_SEND=false` and `ENABLE_LINKEDIN_AUTOMATION=false`.
3. Run `npm install`.
4. Run `npm run db:generate`.
5. Run `npx prisma db push`.
6. Run `npm run db:seed`.
7. Run `npm run dev`.

Health check: open `http://localhost:3000` and verify dashboard counts render.
