# Lead Dashboard — Repository Instructions

## Codex execution preference

- This repository is intended to be worked on with `gpt-5.5` at `medium` reasoning effort.
- Preserve that explicit model choice. Do not silently substitute another model.
- Model and reasoning selection are configured in Codex, not by application code.

## Project goal

Build a focused, single-admin lead dashboard that:

1. Creates and monitors scraping jobs through the existing `gosom/google-maps-scraper` REST API.
2. Downloads completed job results as CSV.
3. Imports, normalizes, deduplicates, filters, and stores business leads.
4. Lets the admin select eligible leads and send approved WhatsApp messages through the existing Evolution API instance.
5. Stores campaign and delivery history without becoming a general-purpose CRM.

Keep the MVP narrow. Do not add Chatwoot, n8n, AI agents, billing, teams, multi-tenancy, complex role management, or unrelated CRM features unless the user explicitly expands scope.

## Current environment

Development runs on macOS. Production will run with Docker Compose on an Ubuntu server.

Existing external services:

- Gosom API (development): `http://192.168.1.2:8085`
- Evolution API (development): `http://192.168.1.2:8086`
- Evolution instance: `google-maps-sender`
- Local Next.js app: `http://localhost:3000`
- Local PostgreSQL: `127.0.0.1:5433`
- Local Redis: `127.0.0.1:6380`

Never hardcode these values. Read them from environment variables.

Required local environment variables:

```env
DATABASE_URL=
REDIS_URL=
GOSOM_API_URL=
EVOLUTION_API_URL=
EVOLUTION_INSTANCE=
EVOLUTION_API_KEY=
```

Never commit `.env.local`, API keys, database passwords, scraped contact exports, or WhatsApp session data.

## Technology

- Next.js App Router
- TypeScript with strict typing
- React Server Components by default
- Client Components only for browser interaction
- Tailwind CSS
- Drizzle ORM
- PostgreSQL
- Redis and BullMQ for background jobs
- Zod for external input and API response validation
- Docker Compose for local infrastructure and production deployment

Do not introduce another ORM, database, state-management library, component framework, or backend framework without a concrete need and user approval.

## Repository layout

Prefer this structure:

```text
src/
  app/
    api/
    dashboard/
    scraping/
    leads/
    campaigns/
    settings/
  components/
    layout/
    dashboard/
    scraping/
    leads/
    ui/
  db/
    index.ts
    schema.ts
  lib/
    gosom/
    evolution/
    cleaning/
    queue/
    validation/
  workers/
drizzle/
compose.yaml
drizzle.config.ts
```

Inspect the actual repository before editing. Adapt to files already present and do not recreate or overwrite working setup unnecessarily.

## Gosom API contract

The currently documented endpoints are:

```text
POST   /api/v1/jobs
GET    /api/v1/jobs
GET    /api/v1/jobs/{id}
GET    /api/v1/jobs/{id}/download
DELETE /api/v1/jobs/{id}
```

Runtime job responses use capitalized fields even though the OpenAPI spec shows lowercase fields:

```ts
type GosomJob = {
  ID: string;
  Name: string;
  Date: string;
  Status: string;
  Data: {
    keywords: string[];
    lang: string;
    zoom: number;
    lat: string;
    lon: string;
    fast_mode: boolean;
    radius: number;
    depth: number;
    email: boolean;
    extra_reviews?: boolean;
    max_time: number;
    proxies: string[] | null;
  };
};
```

Known successful status: `ok`.

The download endpoint returns CSV, not JSON. Parse it server-side. Do not expose Gosom directly to the browser.

CSV columns currently include:

```text
input_id,link,title,category,address,open_hours,popular_times,website,phone,
plus_code,review_count,review_rating,reviews_per_rating,latitude,longitude,cid,
status,descriptions,reviews_link,thumbnail,timezone,price_range,data_id,
street_view_url,place_id,images,reservations,order_online,menu,owner,
complete_address,credit_cards_accepted,about,user_reviews,
user_reviews_extended,emails
```

Store frequently queried fields in normal columns and preserve complex/unneeded source fields in `raw_data JSONB`.

## Data model

The current first-phase tables are:

- `scrape_jobs`
- `leads`

Future campaign phase tables:

- `campaigns`
- `campaign_recipients`

Do not store dashboard data inside Evolution API's PostgreSQL database. The dashboard owns a separate PostgreSQL database and migrations.

Use Gosom `external_job_id` as the idempotency key for job synchronization. For leads, prefer deduplication in this order:

1. `place_id`
2. `cid`
3. normalized phone number
4. normalized website domain
5. normalized business name plus address

Do not silently discard duplicate source rows. Merge useful information or mark duplicate relationships so the import remains auditable.

## Lead cleaning rules

- Preserve every original value in `raw_data` and keep `phone_raw` unchanged.
- Trim whitespace and normalize empty strings to `null` where appropriate.
- Normalize Indonesian mobile numbers to digits-only E.164 form, e.g. `0812...` to `62812...`.
- Never prepend `62` to an already normalized `62...` number.
- Classify obvious Indonesian landlines separately from mobile numbers.
- Lowercase email addresses, remove invalid values, and deduplicate them.
- Normalize websites and derive a lowercase hostname without `www.` for `website_domain`.
- Treat missing phone numbers, landlines, duplicates, excluded contacts, and opted-out contacts as ineligible for WhatsApp campaigns.
- Never infer recipient consent merely because a phone number appears in scraped data.

Cleaning must be deterministic and covered by unit tests.

## Evolution API contract

Send text messages server-side only:

```text
POST /message/sendText/{instanceName}
Header: apikey
Content-Type: application/json
```

For the installed Evolution API `v2.3.7`, the verified request body is flat:

```json
{
  "number": "628xxxxxxxxxx",
  "text": "Message text",
  "delay": 1000,
  "linkPreview": false
}
```

Do not use the older nested `textMessage.text` structure for this deployment.

Never call Evolution API from a Client Component. Keep the API key server-only. Campaign sending must use a background queue, remain idempotent, record Evolution message IDs, and never send the same campaign recipient twice after retries.

Incoming messages may use `remoteJid` in `@lid` format and expose the real phone number through `remoteJidAlt` in `@s.whatsapp.net` format. When matching contacts, prefer the normalized phone derived from `remoteJidAlt` when available. Exclude group chats ending in `@g.us`.

## UI scope

The first usable interface should contain:

1. Dashboard overview
2. Scraping Jobs
3. Leads
4. Campaigns (can remain disabled until the lead import is stable)
5. Settings

### Dashboard overview

Show only useful metrics:

- total scraping jobs
- running jobs
- total leads
- leads with mobile numbers
- duplicate/incomplete leads
- campaign-ready leads

### Scraping Jobs

- Clear create-job action
- Job table with name, keywords, date, status, result count, and actions
- Status badges for queued/running/success/failed/imported states
- Manual refresh/sync action
- Import action only when a job is complete
- Loading, empty, and error states
- Confirmation before destructive deletion

### Leads

- Searchable, filterable, paginated table
- Columns: selection, business, category, location, phone, website, rating, cleaning status, WhatsApp eligibility, and actions
- Filters for job, category, location, has phone, duplicates, cleaning status, and WhatsApp status
- Preserve table usability on smaller screens; horizontal scrolling is acceptable for dense data
- Bulk actions must show selected count and require confirmation for destructive changes or messaging

## Visual direction

Build a restrained, modern B2B SaaS dashboard. Avoid generic template clutter.

- Primary dark color: `#1D293B`
- App background: `#F6F8FB`
- Surface: white
- Border: subtle neutral gray
- Accent: accessible blue for primary actions
- Success, warning, and error colors must have sufficient contrast
- Use Geist or the existing Next.js font setup
- Use a compact left sidebar and clear top bar
- Prefer 8–12px radii, subtle shadows, and consistent spacing
- Do not use oversized headings, excessive gradients, glassmorphism, or decorative charts without meaningful data
- Use icons consistently and always pair ambiguous icons with labels or tooltips
- Interface copy should be Indonesian, while code identifiers remain English

Accessibility requirements:

- semantic HTML
- visible keyboard focus
- labeled controls
- keyboard-operable dialogs and menus
- meaningful empty/error states
- color must not be the only status indicator

## Engineering conventions

- Use absolute imports through `@/`.
- Use named exports except where Next.js requires a default export.
- Keep external API types and parsers close to their clients.
- Validate untrusted input at server boundaries with Zod.
- Prefer server-side pagination, filtering, and sorting for lead tables.
- Avoid `any`; use `unknown` and narrow it.
- Do not leak raw upstream errors, credentials, or internal URLs to browser responses.
- Return consistent API response shapes.
- Use transactions for imports and other multi-record state changes.
- Make job sync, CSV import, and campaign sending safe to retry.
- Update `updated_at` explicitly on mutations.
- Log identifiers and useful context, but never API keys, full message bodies, or sensitive raw exports.

## Working procedure

Before changing code:

1. Read `package.json`, `compose.yaml`, `.gitignore`, Drizzle configuration, current schema, and relevant source files.
2. Run `git status` and preserve unrelated user changes.
3. Confirm existing commands and dependencies instead of assuming them.
4. For multi-step or ambiguous work, present a short plan before implementation.

During implementation:

- Work in small coherent increments.
- Reuse existing components and conventions.
- Do not rewrite working infrastructure merely for style.
- Do not introduce mock data into production paths. Seed/demo data must be explicit and removable.
- Never trigger real scraping or WhatsApp sends in automated tests.

After implementation, run all relevant checks:

```bash
npm run lint
npm run build
npm run db:generate
```

Run database migrations only when the task requires them and the target environment is confirmed:

```bash
npm run db:migrate
```

For Docker-related changes:

```bash
docker compose config --quiet
docker compose ps
```

Add targeted tests for cleaning, normalization, deduplication, CSV parsing, idempotency, and message payload generation as those features are implemented.

## Definition of done

A task is complete only when:

- requested behavior is implemented, not only visually mocked
- loading, empty, success, and error states are handled
- TypeScript, lint, and production build pass
- database changes include reviewed migrations
- external calls remain server-side and secrets remain private
- relevant retry/idempotency behavior is considered
- no unrelated files or user changes were removed
- the final response lists changed files, verification performed, and any remaining limitation

## Current implementation priority

Work in this order unless the user explicitly changes priority:

1. Inspect and stabilize the existing project foundation.
2. Build the application shell and navigation.
3. Implement read-only Scraping Jobs UI using the verified Gosom API client.
4. Synchronize Gosom jobs into `scrape_jobs` idempotently.
5. Implement completed-job CSV download and transactional lead import.
6. Implement deterministic cleaning and Leads UI.
7. Only after imports are stable, add campaign tables, BullMQ worker, and Evolution API sending.

Do not skip directly to bulk WhatsApp sending before lead import, cleaning, eligibility, audit logging, and retry safety are complete.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
