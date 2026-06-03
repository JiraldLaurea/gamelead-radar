# API Contract

## POST `/api/sources`

Creates or updates a source from form data: `name`, `region`, `sourceType`, `url`, `active`, `crawlFrequencyHours`.

## POST `/api/sources/:id/verify`

Checks HTTP/RSS/HTML parseability, sample item extraction, recency where available, and updates verification fields.

## POST `/api/sources/:id/discover-rss`

Attempts RSS/Atom auto-discovery from the source URL and saves `resolvedFeedUrl` when a valid feed is found.

## POST `/api/sources/:id/crawl`

Runs a single-source crawl and records a crawl run.

## POST `/api/crawl`

Runs a manual crawl against active sources and records a `CrawlRun`.

## POST `/api/analyze`

Analyzes unprocessed articles, creates opportunities or exclusions, and redirects to the lead list. When `OPENAI_API_KEY` is configured, analysis fetches full article-page content and uses OpenAI structured JSON output with heuristic fallback.

## POST `/api/leads/:id/status`

Updates lead status to one of `new`, `needs_research`, `draft_ready`, `contacted`, `replied`, `rejected`, or `archived`.

## POST `/api/leads/:id/drafts`

Generates email and LinkedIn drafts for Grade A/B leads only. It does not send anything.

## GET `/api/export`

Query params: `format=csv|xls`, optional `grade=A|B|C|D`. Returns a file download.

## POST `/api/backup`

Copies the local SQLite database into `backups/db/`.

## POST `/api/reset-data`

Requires form field `confirmation=RESET`. Clears collected articles, analysis records, outreach drafts, crawl runs, and logs while keeping registered sources.
