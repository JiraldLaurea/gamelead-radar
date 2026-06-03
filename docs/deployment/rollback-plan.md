# Rollback Plan

## Code

Use Git to return to the previous validated commit.

## Database

Restore a timestamped SQLite backup from `backups/db/` into `prisma/data/gamelead-radar.sqlite`.

## Configuration

Restore `.env` values from `.env.example` and keep automation-related flags disabled.
