# Migration Plan

The MVP uses Prisma with SQLite. For local development, run:

```bash
npx prisma db push
```

Before future destructive migrations, copy the active database to `backups/db/`.
