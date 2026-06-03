# Database Design

The database follows the requested entities:

- `Source`: registered RSS, website, Steam, or official sources.
- `Article`: collected article content with URL/hash deduplication and processing flags.
- `Company`: developer or publisher metadata.
- `Game`: platform and launch-stage metadata.
- `Opportunity`: scored QROAD sales lead connected to an article, company, and game.
- `OutreachMessage`: manually reviewed email and LinkedIn draft records.
- `CrawlRun`: crawl execution audit trail.
- `SystemLog`: operational errors and events.

SQLite is stored at `prisma/data/gamelead-radar.sqlite` when using the default Prisma relative path.
