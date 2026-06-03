# GameLead Radar Development Instruction
## Game News-Based QROAD Outsourcing Sales Opportunity Discovery System

Document purpose: This document defines the project goal, scope, features, database structure, AI analysis rules, UI requirements, validation criteria, and rollback procedures so that a developer using Claude Code or Codex can begin implementation immediately.

---

## 0. Project Overview

### 0.1 Project Name
**GameLead Radar**

### 0.2 One-Line Definition
A local web-based sales automation tool that collects pre-launch Steam/mobile game news from Korea, Japan, and North America, matches relevant opportunities with QROAD's QA, operation, marketing, design, localization, and AI solution packages, and identifies qualified sales leads.

### 0.3 Core Objectives
1. Collect game news, official press releases, Steam launch information, and mobile launch information.
2. Use AI to extract the company name, game title, country, platform, launch stage, pre-launch status, and developer/publisher role.
3. Select only leads that are pre-launch or related to a new country/platform launch.
4. Automatically match each opportunity with QROAD service packages.
5. Calculate sales opportunity scores and classify leads as A/B/C/D.
6. Generate draft email and LinkedIn outreach messages.
7. Allow CSV/Excel download.
8. In the MVP, do not send messages automatically. A human must review and send manually.

---

## 1. Confirmed Business Scope

### 1.1 Target Countries
- Korea
- Japan
- North America, mainly the United States and Canada

### 1.2 Company Size
- No restriction.
- However, sales priority may reflect accessibility, availability of contact information, and clarity of launch timing.

### 1.3 Target Company Types

Included:
- Game developers that directly develop and service their games.
- Publishers that directly publish or service games.
- Studios with clear self-publishing or direct service plans.

Excluded:
- Game media outlets.
- Streamers or YouTubers.
- Pure investment companies.
- News about platform operators only, where no game-service outsourcing need is clear.
- Rumor-based articles where the launch owner is unclear.
- Simple reviews, ratings, or revenue ranking articles.

### 1.4 Target Platforms

Primary:
- Steam
- Mobile games: iOS, Android, Google Play, App Store

Conditionally included:
- PC online games
- Steam Early Access
- Steam Next Fest
- Cross-platform games

Usually excluded:
- Console-only AAA packaged games
- Board games, offline games, and non-game content

### 1.5 Post-Launch Exclusion Rule

Default rule:
- Exclude games that have already been officially launched and do not have any additional new launch, regional expansion, platform expansion, CBT/OBT, soft launch, relaunch, or expansion release planned.

Exceptions that should still be included:
- A game already launched in Korea but preparing for North America or Japan.
- A game already launched in Japan but preparing for global release.
- A mobile game preparing for a Steam release.
- A Steam game preparing for a mobile release.
- Steam Demo, Playtest, Next Fest, or Early Access scheduled before release.
- Relaunch or major expansion before release.
- New regional soft launch, CBT, or OBT.

---

## 2. QROAD Sales Package Definition

QROAD's company service profile should be reorganized into sales automation packages.

### 2.1 Package 1: Pre-Launch QA Package
Included services:
- Functional QA
- Compatibility QA
- Optimization QA
- Development QA
- Launching QA

Suitable situations:
- CBT/OBT scheduled
- Steam Playtest scheduled
- Before mobile launch
- Before Early Access
- Confirmed launch date

### 2.2 Package 2: Store & Platform QA Package
Included services:
- Market Policies QA
- App Store / Google Play review support
- Steam page and build review
- Payment testing
- Platform policy issue checks

Suitable situations:
- App Store Pre-order
- Google Play Pre-register
- Steam page opened
- Steam wishlist campaign
- Before mobile marketplace release
- Before platform review

### 2.3 Package 3: Global Launch Localization Package
Included services:
- Localization Polishing
- Localization QA
- UI/UX language check
- Translation quality review
- Culturalization review

Suitable situations:
- Global launch scheduled
- New release in North America, Japan, or Korea
- English, Japanese, or Korean version in preparation
- Multi-country launch announcement

### 2.4 Package 4: Launch Operation Support Package
Included services:
- Customer Support
- Community Management
- Global Service
- Platform Service
- 24H Monitoring
- Launch operation preparation

Suitable situations:
- Official launch scheduled
- Global launch preparation
- Soft launch
- Large-scale beta test
- Community operation resource needs
- CS operation setup needs

### 2.5 Package 5: Pre-Registration Marketing Package
Included services:
- Performance Marketing
- Brand/Viral Marketing
- Pre-registration campaign operation
- Ad campaign monitoring and optimization
- KOL/influencer campaign planning

Suitable situations:
- Pre-registration
- Pre-order
- Steam wishlist
- Launch campaign started
- Trailer released
- Brand campaign preparation

### 2.6 Package 6: Game Creative Production Package
Included services:
- Motion Graphic
- Video Production
- Graphic Design
- Ad creative production
- Store images, banners, and social media creatives

Suitable situations:
- New title trailer released
- Launch marketing preparation
- Pre-registration campaign preparation
- Steam/App Store/Google Play store page improvement needed
- Ad creative production needs

### 2.7 Package 7: AI Community & CS Monitoring Package
Included services:
- AI Customer Service
- AI Analysis
- AI Monitoring
- Harmful content monitoring
- Community sentiment and response analysis

Suitable situations:
- Games likely to build a large community
- Community operation preparation before global launch
- Discord, Reddit, Steam Community, X, YouTube comment monitoring needs
- CS automation or user feedback analysis needs

---

## 3. News Event to Service Package Matching Table

| Detected Event | Representative Keywords | Recommended Packages |
|---|---|---|
| New title announcement | announces, reveals, unveils, new title, first trailer | Pre-Launch QA, Game Creative Production |
| CBT scheduled | closed beta, CBT, beta test, tester recruitment | Pre-Launch QA, Launch Operation Support |
| OBT scheduled | open beta, OBT, public beta | Pre-Launch QA, Launch Operation Support |
| Soft launch | soft launch, limited launch, regional test | Pre-Launch QA, Store & Platform QA, Launch Operation Support |
| Pre-registration | pre-registration, pre-register, pre-order | Store & Platform QA, Pre-Registration Marketing, Game Creative Production |
| Steam wishlist | Steam wishlist, wishlist now | Store & Platform QA, Pre-Registration Marketing |
| Steam launch scheduled | coming to Steam, Steam page opened, Early Access | Pre-Launch QA, Store & Platform QA, Game Creative Production |
| Mobile launch scheduled | App Store, Google Play, mobile launch | Store & Platform QA, Pre-Launch QA, Launch Operation Support |
| Global launch | global launch, worldwide release, English version | Global Launch Localization, Launch Operation Support |
| Japan/Korea/North America launch | launches in Japan/Korea/North America | Global Launch Localization, Store & Platform QA |
| Publishing agreement | publishing deal, publishing agreement, partners with publisher | Global Launch Localization, Launch Operation Support, Pre-Registration Marketing |
| Major expansion before release | expansion, major DLC, new season before launch | Pre-Launch QA, Localization, Creative Production |
| Relaunch | relaunch, reboot, new version | Pre-Launch QA, Marketing, Operation |
| Simple review | review, impressions, rating | Exclude |
| Already launched article | now available, launched today, out now | Exclude by default, unless it is a new region/platform launch |
| Revenue ranking | revenue ranking, top grossing | Exclude |
| Rumor | rumor, leak, reportedly | Exclude or mark as Needs Research |

---

## 4. Lead Qualification Rules

### 4.1 Required Pass Conditions
The AI analysis result must satisfy all of the following conditions before creating an opportunity record.

1. Is the country Korea, Japan, or North America?
2. Is the company a developer or publisher?
3. Is the game for Steam or mobile?
4. Is the company directly servicing or directly publishing the game?
5. Is the game pre-launch or preparing for a new country/platform launch?
6. Does it match at least one QROAD service package?
7. Does the article include a source URL and supporting evidence text?

### 4.2 Exclusion Conditions
Exclude by default if any of the following conditions apply.

- The game is already officially launched with no additional launch plan.
- The article is a simple review, user reaction, or revenue ranking article.
- The article is rumor-based.
- The source is unclear.
- Company name or game title cannot be identified.
- The main entity is a media outlet, creator, or investor, not a developer or publisher.
- The article is about a console-only title unrelated to Steam/mobile.
- The launch stage is Unknown and there is no additional evidence.

### 4.3 Needs Research Status
Do not exclude immediately. Save as `needs_research` if:

- Developer and publisher roles are unclear.
- It is unclear whether the game is pre-launch or post-launch.
- It is unclear whether the platform is Steam/mobile.
- The country is unclear but may be inferred from the company name.
- The article context is ambiguous.

---

## 5. Launch Stage Classification Values

The AI must return exactly one of the following values as `launch_stage`.

- pre_announcement
- in_development
- cbt_scheduled
- obt_scheduled
- soft_launch_scheduled
- pre_registration
- steam_wishlist
- steam_playtest
- early_access_scheduled
- launch_scheduled
- regional_launch_scheduled
- global_launch_scheduled
- platform_expansion_scheduled
- expansion_pack_scheduled
- relaunch_scheduled
- already_launched
- post_launch_only
- unknown

Storage rules:
- Include: cbt_scheduled, obt_scheduled, soft_launch_scheduled, pre_registration, steam_wishlist, steam_playtest, early_access_scheduled, launch_scheduled, regional_launch_scheduled, global_launch_scheduled, platform_expansion_scheduled, expansion_pack_scheduled, relaunch_scheduled
- Conditional: pre_announcement, in_development
- Exclude: already_launched, post_launch_only
- Needs research: unknown

---

## 6. Lead Scoring Rules

### 6.1 Positive Scores

| Criteria | Score |
|---|---:|
| Target country: Korea/Japan/North America | +20 |
| Developer or publisher directly servicing the game | +20 |
| Steam or mobile game | +20 |
| Clear launch/test schedule | +25 |
| Global or multi-country launch | +20 |
| CBT/OBT/soft launch | +15 |
| Pre-registration or wishlist campaign | +15 |
| Matches 3 or more QROAD packages | +15 |
| Official contact information available | +10 |
| Official source or reliable media source | +10 |
| Article published within the last 30 days | +10 |

### 6.2 Deductions

| Criteria | Deduction |
|---|---:|
| Already launched with no additional plan | -50 |
| Simple review, rumor, or user reaction | -30 |
| Console-only, not Steam/mobile | -20 |
| Launch schedule unclear | -10 |
| Company role unclear | -10 |
| No contact information | -5 |

### 6.3 Grades

| Grade | Score | Action |
|---|---:|---|
| A | 80 or above | Generate outreach draft immediately |
| B | 60-79 | Research contact/person-in-charge, then propose |
| C | 40-59 | Monitor |
| D | 39 or below | Exclude or archive |

---

## 7. System Functional Requirements

### 7.1 Required Features
1. News source registration and management
2. RSS or webpage-based article collection
3. Duplicate article removal
4. Article raw content storage
5. AI-based article analysis
6. Target condition filtering
7. QROAD service package matching
8. Lead scoring
9. Lead list dashboard
10. Lead detail page
11. Email draft generation
12. LinkedIn message draft generation
13. Lead status management
14. CSV/Excel download
15. Crawl logs and error logs

### 7.2 Features Excluded from MVP
- Automatic mass email sending
- Automatic LinkedIn DM sending
- Automatic web form submission
- Login-session bypass crawling
- CAPTCHA bypass
- Unauthorized scraping of paid databases
- Mass collection of personal email addresses
- Fully automated quotation or contract sending

### 7.3 Phase 2 Enhancement Candidates
- Gmail draft integration
- HubSpot/Notion/Airtable CRM integration
- Slack/Telegram alerts
- Person-in-charge research
- Company-level history tracking
- Weekly sales report generation
- Multilingual outreach generation: English, Korean, Japanese

---

## 8. Recommended Technology Stack

### 8.1 Basic Architecture
- Frontend: Next.js + TypeScript
- Backend: Next.js API Routes or Node.js API
- DB: SQLite + Prisma
- AI: OpenAI API
- Scheduler: node-cron or Next.js server task approach
- Crawler: RSS Parser, Cheerio
- Optional crawler: Playwright, but never for login bypass, block circumvention, or evasion
- Export: CSV, XLSX
- Local execution: npm scripts
- Version control: independent Git repository

### 8.2 Project Separation Principle
This project must be fully separated from other sales automation projects.

Required:
- Separate Git repository
- Separate project folder
- Separate SQLite DB
- Separate `.env`
- Separate `package.json`
- Separate `README`
- Separate `backup` folder
- Do not reuse code, DB, or env files from other projects unless explicitly copied as a documented template

---

## 9. Environment Variable Example

Create `.env.example`.

```env
APP_NAME="GameLead Radar"
APP_ENV="local"
APP_ADMIN_PASSWORD="change-me"

DATABASE_URL="file:./data/gamelead-radar.sqlite"

OPENAI_API_KEY=""
OPENAI_MODEL="gpt-4.1-mini"

CRAWL_INTERVAL_HOURS="12"
MAX_ARTICLES_PER_SOURCE="20"
ARTICLE_RECENCY_DAYS="90"

ENABLE_AUTO_EMAIL_SEND="false"
ENABLE_LINKEDIN_AUTOMATION="false"

EXPORT_DIR="./exports"
BACKUP_DIR="./backups"
LOG_LEVEL="info"
```

Security rules:
- Do not commit `.env` to Git.
- Commit only `.env.example`.
- Do not hardcode API keys.
- Automatic sending-related values must remain false in the MVP.

---

## 10. Database Design

### 10.1 `sources`
News source management.

| Field | Type | Description |
|---|---|---|
| id | string | UUID |
| name | string | Source name |
| region | string | korea, japan, north_america, global |
| source_type | string | rss, website, steam, official |
| url | string | Collection URL |
| active | boolean | Active status |
| crawl_frequency_hours | int | Crawl frequency |
| last_crawled_at | datetime | Last crawl time |
| created_at | datetime | Created at |
| updated_at | datetime | Updated at |

### 10.2 `articles`
Collected articles.

| Field | Type | Description |
|---|---|---|
| id | string | UUID |
| source_id | string | sources FK |
| title | string | Article title |
| url | string | Source URL |
| published_at | datetime | Published date |
| author | string nullable | Author |
| raw_content | text | Raw content |
| summary | text nullable | Summary |
| language | string nullable | ko, ja, en |
| content_hash | string | Duplicate prevention |
| processed | boolean | AI processed status |
| created_at | datetime | Stored at |

### 10.3 `companies`
Company information.

| Field | Type | Description |
|---|---|---|
| id | string | UUID |
| name | string | Company name |
| country | string | Korea, Japan, USA, Canada, etc. |
| company_type | string | developer, publisher, developer_publisher, unknown |
| website | string nullable | Official website |
| contact_url | string nullable | Contact page |
| contact_email | string nullable | Official email |
| linkedin_url | string nullable | LinkedIn |
| notes | text nullable | Notes |
| created_at | datetime | Created at |
| updated_at | datetime | Updated at |

### 10.4 `games`
Game information.

| Field | Type | Description |
|---|---|---|
| id | string | UUID |
| title | string | Game title |
| platform | string | steam, mobile, ios, android, pc, cross_platform |
| genre | string nullable | Genre |
| steam_url | string nullable | Steam URL |
| app_store_url | string nullable | App Store URL |
| google_play_url | string nullable | Google Play URL |
| launch_stage | string | Launch stage |
| expected_launch_date | datetime nullable | Expected launch date |
| created_at | datetime | Created at |

### 10.5 `opportunities`
Sales opportunities.

| Field | Type | Description |
|---|---|---|
| id | string | UUID |
| article_id | string | articles FK |
| company_id | string | companies FK |
| game_id | string | games FK |
| target_region | string | korea, japan, north_america |
| opportunity_type | string | launch, beta, preregistration, global_launch, etc. |
| score | int | Sales score |
| grade | string | A, B, C, D |
| status | string | new, needs_research, draft_ready, contacted, replied, rejected, archived |
| recommended_packages | json | Recommended packages |
| reasoning | text | Sales opportunity reasoning |
| evidence_quotes | json | Evidence quotes |
| uncertainty | text nullable | Uncertainty |
| next_action | text | Next action |
| created_at | datetime | Created at |
| updated_at | datetime | Updated at |

### 10.6 `outreach_messages`
Outreach message drafts.

| Field | Type | Description |
|---|---|---|
| id | string | UUID |
| opportunity_id | string | opportunities FK |
| channel | string | email, linkedin |
| language | string | en, ko, ja |
| subject | string nullable | Email subject |
| body | text | Message body |
| status | string | draft, reviewed, sent_manually |
| created_at | datetime | Created at |
| updated_at | datetime | Updated at |

### 10.7 `crawl_runs`
Crawl execution logs.

| Field | Type | Description |
|---|---|---|
| id | string | UUID |
| started_at | datetime | Start time |
| finished_at | datetime nullable | End time |
| status | string | running, success, failed |
| articles_found | int | Articles found |
| articles_saved | int | Articles saved |
| error_message | text nullable | Error message |

### 10.8 `system_logs`
System logs.

| Field | Type | Description |
|---|---|---|
| id | string | UUID |
| level | string | info, warning, error |
| module | string | crawler, ai, db, export |
| message | text | Log message |
| metadata | json nullable | Additional information |
| created_at | datetime | Created at |

---

## 11. UI Screen Requirements

### 11.1 Dashboard
Display:
- Articles collected today
- New leads
- Grade A leads
- Needs Research leads
- Outreach drafts generated
- Excluded articles
- Last crawl time
- Recent errors

### 11.2 Source Manager
Features:
- Add source
- Edit source
- Activate/deactivate source
- Run manual crawl
- View last crawl result
- View source-level errors

Fields:
- Source name
- Region
- Source type
- URL
- Active
- Crawl frequency

### 11.3 Article Review
Features:
- View collected article list
- Filter by processing status
- Open source URL
- Re-run AI analysis
- Mark as excluded

### 11.4 Lead List
Columns:
- Grade
- Score
- Company
- Country
- Game
- Platform
- Launch Stage
- Opportunity Type
- Recommended Packages
- Status
- Source
- Published Date
- Action

Filters:
- Country
- Grade
- Platform
- Launch stage
- Recommended package
- Status
- Date range

### 11.5 Lead Detail
Display:
- Article title and source link
- Article summary
- Company name
- Game title
- Country
- Platform
- Launch stage
- Sales opportunity reasoning
- Evidence quotes
- Recommended QROAD packages
- Uncertainty
- Next action
- Email draft
- LinkedIn message draft
- Status update buttons

### 11.6 Export
Features:
- Download all leads as CSV
- Download only Grade A leads
- Download by status
- Download by date range
- Download Excel file

### 11.7 Settings
Features:
- Check whether OpenAI API key is configured
- Set model name
- Set crawl frequency
- Change admin password
- Run backup
- Check DB status

---

## 12. AI Analysis JSON Schema

The AI must return only the following JSON format. Any explanation outside JSON must be treated as a parsing failure.

```json
{
  "is_relevant": true,
  "relevance_reason": "string",
  "exclusion_reason": null,
  "company": {
    "name": "string",
    "country": "Korea | Japan | USA | Canada | Unknown",
    "company_type": "developer | publisher | developer_publisher | media | platform | investor | unknown",
    "is_direct_service_owner": true
  },
  "game": {
    "title": "string",
    "platforms": ["steam", "ios", "android"],
    "genre": "string | unknown",
    "launch_stage": "launch_scheduled",
    "expected_launch_date": "YYYY-MM-DD | null"
  },
  "opportunity": {
    "opportunity_type": "cbt | obt | soft_launch | pre_registration | steam_launch | mobile_launch | global_launch | regional_launch | publishing_deal | relaunch | expansion | unknown",
    "is_pre_launch_or_new_launch": true,
    "recommended_packages": [
      "Pre-Launch QA Package",
      "Store & Platform QA Package"
    ],
    "score": 85,
    "grade": "A",
    "next_action": "Create email draft and research official contact page."
  },
  "evidence": {
    "key_quotes": [
      "string"
    ],
    "detected_keywords": [
      "closed beta",
      "Steam"
    ]
  },
  "uncertainty": "string | null"
}
```

---

## 13. AI Analysis Prompt

### 13.1 System Prompt
```text
You are a senior game industry business development analyst for QROAD, a game service outsourcing company.

Your task is to analyze game industry news and determine whether it creates a sales opportunity for QROAD's outsourcing services.

QROAD service packages:
1. Pre-Launch QA Package
2. Store & Platform QA Package
3. Global Launch Localization Package
4. Launch Operation Support Package
5. Pre-Registration Marketing Package
6. Game Creative Production Package
7. AI Community & CS Monitoring Package

Target scope:
- Countries: Korea, Japan, North America only.
- Company type: game developers or publishers that directly service, develop, or publish games.
- Platforms: Steam and mobile games first.
- Sales timing: pre-launch, beta, soft launch, pre-registration, global/regional launch, new platform launch, relaunch, or expansion before release.
- Exclude post-launch-only news unless there is a new region/platform/global release, relaunch, expansion, beta, or pre-registration opportunity.

Return strict JSON only. Do not include markdown or explanations outside JSON.
```

### 13.2 User Prompt Template
```text
Analyze the following article and decide whether it is a valid QROAD sales lead.

Article:
Title: {{title}}
URL: {{url}}
Published at: {{published_at}}
Source: {{source_name}}
Content:
{{content}}

Required:
1. Identify company, country, company type, game title, platform, and launch stage.
2. Decide whether the company is a developer or publisher directly connected to the game service.
3. Decide whether the opportunity is pre-launch or a new launch opportunity.
4. Exclude post-launch-only, review-only, rumor-only, or non-target-region articles.
5. Match suitable QROAD service packages.
6. Provide evidence quotes from the article.
7. Assign a score and grade.
8. Return strict JSON only.
```

---

## 14. Outreach Message Generation Rules

### 14.1 Email Draft Generation Conditions
- Generate automatically only for Grade A or Grade B opportunities.
- Do not send automatically.
- Human review is required.
- Avoid exaggerated claims.
- Customize the message based on article content.
- Recommend only 2-3 QROAD packages.
- Do not list too many services.

### 14.2 Email Draft Base Structure
```text
Subject: Support for [Game Title]'s upcoming [launch/beta/global release]

Hi [Name/Team],

I saw the recent news about [Company] preparing [Game Title] for [specific launch event].

Based on this stage, teams often need support with [matched services].

QROAD supports game companies with:
- [Package 1]
- [Package 2]
- [Package 3 if needed]

Would it be possible to briefly discuss whether external support could help your upcoming schedule?

Best regards,
[Sender Name]
```

### 14.3 LinkedIn Message Base Structure
```text
Hi [Name],

I saw the news about [Company]'s upcoming [Game Title] [launch/beta/global release].

QROAD supports game companies with QA, localization QA, launch operations, community management, and marketing/creative support.

If your team is preparing for launch, I would be glad to share how we can support the schedule.

Best regards,
[Sender Name]
```

---

## 15. Initial News Source Seed Examples

Manage these through `seed/sources.json`. The developer must verify actual URLs before use.

### 15.1 Korea
- GameMeca
- Inven
- ThisIsGame
- Game Chosun
- Ruliweb News
- Official company press rooms

### 15.2 Japan
- 4Gamer
- Famitsu
- Game Watch
- Automaton
- Denfaminicogamer
- Official company press rooms

### 15.3 North America / Global
- GamesIndustry.biz
- GameDeveloper
- PC Gamer
- IGN
- Gematsu
- PocketGamer.biz
- MobileGamer.biz
- Steam News
- Steam Upcoming
- Steam Next Fest pages
- Official company press rooms

Collection policy:
- Use RSS first when available.
- Use official APIs first when available.
- Webpage collection must respect robots.txt and site terms.
- Do not implement login-required crawling, CAPTCHA bypass, or block circumvention.

---

## 16. Pre-Development Audit and Stabilization Instructions

Claude Code must perform the following before development.

### 16.1 Project Independence Check
- Confirm the current working folder is a new independent project.
- If mixed with an existing project, stop and create a new folder.
- If no Git repository exists, initialize a new one.
- If Git points to another project, stop.
- If the DB file belongs to another project, create a new DB.

### 16.2 Conflict Check
- Check for duplicate `package.json`.
- Check for duplicate `.env`.
- Check for duplicate `prisma/schema.prisma`.
- Check for duplicate DB files.
- Check for port conflicts.
- Check for stale `node_modules` conflicts.
- Check lockfile conflicts. Use only one of `package-lock.json`, `pnpm-lock.yaml`, or `yarn.lock`.

### 16.3 Backup
If files already exist:
- Copy them to `/backups/YYYYMMDD_HHMMSS/` before changes.
- Do not overwrite working code without confirmation.
- Print the list of files that will be modified.

### 16.4 Installation Stabilization
- Check Node.js version.
- Standardize on one package manager.
- Run clean install.
- Run Prisma generate.
- Run DB migration.
- Run lint/build/test.

### 16.5 Environment Variable Stabilization
- Create `.env.example`.
- If `.env` does not exist, instruct the user to create it from `.env.example`.
- Never hardcode API keys.
- If required environment variables are missing, show a clear UI error.

---

## 17. Development Sequence

### Phase 0: Scaffold & Stabilization
1. Create new project.
2. Initialize Git.
3. Configure Next.js + TypeScript.
4. Configure SQLite + Prisma.
5. Create `.env.example`.
6. Create `README`.
7. Confirm basic execution.

Completion criteria:
- `npm install`
- `npm run dev`
- `npm run build`
- Prisma migration succeeds

### Phase 1: DB & Seed
1. Write Prisma schema.
2. Create source seed structure.
3. Create service package seed.
4. Create launch stage enum.
5. Define scoring rules as constants.

Completion criteria:
- DB created.
- Seed can run.
- Data can be viewed in Admin UI.

### Phase 2: Crawler
1. Implement RSS collector.
2. Implement HTML collector.
3. Implement deduplication.
4. Save `crawl_runs` logs.
5. Implement manual crawl button.

Completion criteria:
- Articles are saved from at least 3 test sources.
- Duplicate URLs are not saved.
- Crawl failure logs are displayed.

### Phase 3: AI Analyzer
1. Implement AI analysis prompt.
2. Implement JSON schema validation.
3. Implement retry logic on failure.
4. Save analysis results to articles/companies/games/opportunities.
5. Handle excluded and needs_research states.

Completion criteria:
- Analyze 10 test articles.
- Exclude post-launch-only articles.
- Include CBT/pre-registration/Steam upcoming articles.
- Save logs on JSON parsing failure.

### Phase 4: Lead Dashboard
1. Implement Dashboard.
2. Implement Lead List.
3. Implement Lead Detail.
4. Implement status updates.
5. Implement filters and search.

Completion criteria:
- Filter A/B/C leads.
- Open source links.
- View recommended packages.
- Save status changes.

### Phase 5: Outreach Draft
1. Generate email drafts.
2. Generate LinkedIn drafts.
3. Generate English first.
4. Allow future Korean/Japanese expansion.
5. Save and edit drafts.

Completion criteria:
- Generate drafts for A/B leads.
- No automatic sending.
- Drafts can be copied.

### Phase 6: Export & Backup
1. CSV download.
2. Excel download.
3. Grade A lead download.
4. Date range download.
5. DB backup button.

Completion criteria:
- Download files are generated correctly.
- Filter conditions are reflected.
- Backup file is created.

### Phase 7: QA & Documentation
1. Write README.
2. Write beginner setup guide.
3. Add test data.
4. Write troubleshooting guide.
5. Run final build/test validation.

Completion criteria:
- A new user can run the app by following README.
- Error handling is documented.
- lint/build/test pass.

---

## 18. Test Cases

### 18.1 Articles That Should Be Included
1. Korean developer starts global pre-registration for a mobile RPG.
2. Japanese publisher recruits CBT users for a new Steam title.
3. North American developer plans a Steam Next Fest demo.
4. Mobile game prepares for North American soft launch.
5. Korean game prepares for Japan launch.
6. Japanese game prepares for North America launch.

### 18.2 Articles That Should Be Excluded
1. Review of an already launched game.
2. Revenue ranking article.
3. User reaction article.
4. Rumor article.
5. Console-only packaged game review.
6. Game media interview with no launch plan.
7. Streamer video introduction article.

### 18.3 Needs Research Handling
1. Developer/publisher is unclear.
2. Pre-launch or post-launch status is unclear.
3. Steam/mobile platform status is unclear.
4. Country is unclear but may be inferred from the company name.

---

## 19. Security and Policy Compliance

Required:
- No automatic email sending.
- No LinkedIn automation.
- No unauthorized mass personal email collection.
- No login bypass.
- No CAPTCHA bypass.
- Respect robots.txt and site terms.
- Do not redistribute full source articles externally.
- Store summaries and links instead of republishing articles.
- Manage API keys only through server-side environment variables.

---

## 20. Completion Criteria

MVP completion criteria:
1. Local web app runs successfully.
2. News sources can be registered.
3. Manual/automatic collection works.
4. AI analysis works.
5. Only pre-launch leads can be selected.
6. QROAD packages can be matched automatically.
7. Scores and grades are displayed.
8. Email/LinkedIn drafts can be generated.
9. CSV/Excel download works.
10. README and setup guide are provided.
11. build/test pass.
12. Automatic sending features remain disabled.

---

## 21. Rollback and Recovery Procedure

### 21.1 Code Rollback
- Create a Git commit before major work.
- Commit by feature.
- Restore to the previous commit if a feature fails.

### 21.2 DB Rollback
- Back up DB before migration.
- Store timestamped backups under `/backups/db/`.
- Restore backup DB on failure.

### 21.3 Configuration Rollback
- Do not back up `.env` directly, or remove sensitive values before backup.
- Update `.env.example` before configuration changes.
- Document required environment variables in README.

### 21.4 Incident Response
- Crawl failure: allow disabling the source in Source Manager.
- AI failure: provide re-analysis button.
- DB error: provide backup restoration instructions.
- Export failure: display logs and allow retry.

---

## 22. Final Claude Code Execution Prompt

Use the following prompt directly in Claude Code to begin development.

```text
You are building a new independent local web application called GameLead Radar.

Before coding, audit the current folder and make sure this is a clean, independent project. Do not reuse or overwrite files from other projects. Create a new Git repository, independent SQLite database, separate .env.example, and isolated project configuration.

Build a Next.js + TypeScript + SQLite/Prisma local web app that collects game industry news and identifies pre-launch sales opportunities for QROAD outsourcing services.

Business scope:
- Target countries: Korea, Japan, North America.
- Target company type: game developers and publishers that directly develop, service, or publish games.
- Target platforms: Steam and mobile games.
- Company size: no restriction.
- Include only pre-launch or new launch opportunities: CBT, OBT, soft launch, pre-registration, Steam wishlist, Steam playtest, early access scheduled, launch scheduled, global launch, regional launch, new platform launch, relaunch, expansion before release.
- Exclude post-launch-only news, reviews, revenue ranking, rumors, user reaction articles, non-game-service entities, and non-target platforms.

QROAD packages:
1. Pre-Launch QA Package
2. Store & Platform QA Package
3. Global Launch Localization Package
4. Launch Operation Support Package
5. Pre-Registration Marketing Package
6. Game Creative Production Package
7. AI Community & CS Monitoring Package

Core features:
- Source manager
- RSS/website crawler
- Article storage and deduplication
- AI article analysis with strict JSON schema
- Lead scoring and grading
- Lead dashboard
- Lead detail page
- Recommended QROAD package matching
- Email and LinkedIn draft generation
- CSV/Excel export
- Crawl logs and error logs
- Backup and rollback support
- README and beginner setup guide

MVP must not include automatic email sending, LinkedIn automation, CAPTCHA bypass, login bypass, or personal email scraping.

Follow the development phases in this document. After each phase, run lint/build/test checks, document changes, and commit to Git.
```

---

## 23. Required Developer Delivery Items

After development, the developer must submit:

1. Git commit history
2. Installation and execution guide
3. `.env.example`
4. DB schema explanation
5. Main screen screenshots
6. Test results
7. Known limitations
8. Suggested next improvements
9. Rollback instructions
10. Sample CSV/Excel export file
