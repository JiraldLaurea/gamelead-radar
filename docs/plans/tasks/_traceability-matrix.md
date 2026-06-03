# Traceability Matrix

| Feature | API/UI | Task |
|---|---|---|
| Source manager | `/sources`, `/api/sources` | BE-SOURCES |
| RSS/webpage crawler | `/api/crawl` | BE-CRAWLER |
| Article analysis | `/api/analyze` | BE-ANALYZER |
| Lead dashboard/list/detail | `/`, `/leads`, `/leads/:id` | FE-DASHBOARD, FE-LEADS |
| Outreach drafts | `/api/leads/:id/drafts` | FS-OUTREACH |
| Status management | `/api/leads/:id/status` | FE-LEADS |
| CSV/Excel export | `/export`, `/api/export` | FS-EXPORT-BACKUP |
| Backup | `/settings`, `/api/backup` | FS-EXPORT-BACKUP |
