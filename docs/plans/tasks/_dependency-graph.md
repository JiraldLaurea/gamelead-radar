# Dependency Graph

1. INF-SETUP
2. DB-SCHEMA depends on INF-SETUP
3. BE-SOURCES depends on DB-SCHEMA
4. BE-CRAWLER depends on BE-SOURCES
5. BE-ANALYZER depends on DB-SCHEMA
6. FE-DASHBOARD depends on BE-CRAWLER and BE-ANALYZER
7. FE-LEADS depends on BE-ANALYZER
8. FS-OUTREACH depends on FE-LEADS
9. FS-EXPORT-BACKUP depends on FE-LEADS
10. TEST-DOCS depends on all implementation tasks
