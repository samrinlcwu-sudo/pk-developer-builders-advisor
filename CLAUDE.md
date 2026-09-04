# PK Developer Builders & Advisor — Project Guide

## Purpose

A premium marketing website for **PK Developer Builders & Advisor**, a real
property developer / builder / real estate advisory business. The site is
the company's digital headquarters and must read as a professionally
commissioned $15,000+ real-estate/development website — not a generic
template. It should communicate: **Trust · Quality · Transparency ·
Expertise · Architecture · Investment · Growth.**

## Non-Negotiable Content Rule

PK Developer Builders & Advisor is a real business. **Never fabricate
business facts** — years of experience, project/client counts, awards,
certifications, government approvals, locations, prices, testimonials,
team members, or investment returns. Never promise guaranteed returns or
profits. Where real information is missing, use a clearly visible
`[CONTENT REQUIRED: description]` placeholder — never let a placeholder
harden into an invented "fact." This applies to all future edits, not just
the initial build.

## Tech Stack

A Node.js + Express + EJS backend (added with explicit client sign-off —
see `Backend` section below) now server-renders the pages that need real,
admin-managed data (currently: Properties, Projects, Locations, Agents,
Team, Testimonials, Articles, Site Settings). Pages with no listable
entity behind them (`services.html`, `development.html`,
`construction.html`, `advisory.html`, `contact.html`) remain plain static
HTML served as-is — there is still no build step, bundler, or component
framework anywhere in the project. `node --watch server/server.js`
(`npm run dev`) is the dev server; no separate SPA, no client-side
data-fetching layer.

## Technical Architecture

Marketing pages with no backing entity stay static HTML/CSS, styled via
the shared CSS variables in `css/style.css` — not componentized, just
copy-pasted and kept visually consistent by hand. Pages backed by real
data (Properties, Projects, Articles, and about.html's Team section) are
EJS views rendered by Express from `data.sqlite` (via `node:sqlite`, no
ORM). This is a deliberate, client-approved exception to the original
static-only architecture — extending it further (new entities, new admin
screens) follows the same milestone plan rather than being freeform.

## Structure

- `/` and `/index.html` — Home (server-rendered: featured projects,
  testimonials, stats band from Site Settings)
- `/about.html` — Company story, mission, team (server-rendered: Team
  section)
- `services.html` — Services overview (hub)
- `development.html` — Development service detail
- `construction.html` — Construction service detail
- `advisory.html` — Advisory service detail
- `/projects`, `/projects/:slug` — Project portfolio, server-rendered
- `/insights`, `/insights/:slug` — Insights/articles, category filter +
  featured article, server-rendered
- `contact.html` — Contact form + details
- `css/style.css` — All styles (CSS variables for theme); `css/admin.css`
  — small admin-panel-only layout additions on top of the same tokens
- `js/script.js` — Nav toggle, insights filter, form handling
- `robots.txt` — SEO crawler file (update the placeholder domain once a
  real production domain is chosen). `/sitemap.xml` is generated at
  request time from `PUBLIC_SITE_ORIGIN` + every published
  Property/Project/Article — there is no static `sitemap.xml` file
  anymore (see `server/routes/public/sitemap.js`).
- `assets/` — Images (logo, founder photo; a few unused pre-staged photos
  not yet wired into any page)
- `server/` — Express app, `node:sqlite` models/migrations, admin + public
  routes, EJS views (see `Backend` section below)
- `data.sqlite`, `.env`, `uploads/`, `node_modules/` — gitignored, local
  only, never committed

Properties (`/properties`, `/properties/:slug`), Projects (`/projects`,
`/projects/:slug`), and Insights (`/insights`, `/insights/:slug`) are
server-rendered from the database — the old `properties.html`/
`property-detail.html`/`projects.html`/`project-detail.html`/
`insights.html`/`insights-article.html`/`index.html`/`about.html` static
files no longer exist. `about.html` and `index.html` keep their original
URLs (`/about.html`, `/` and `/index.html`) but are now EJS views. Every
other page above is still a plain `.html` file served as-is.

## Design System

- Palette: deep navy (`--color-navy`), warm gold accent (`--color-gold`),
  cream background (`--color-cream`), charcoal text.
- Type: "Playfair Display" (serif, headings) + "Inter" (sans, body), via
  Google Fonts.
- Tone: confident, understated luxury — not flashy/gaudy.

## Rules

- Keep it simple: no framework/build step beyond the approved Express+EJS
  backend unless the user asks for more.
- Every unverified business fact gets a `[CONTENT REQUIRED: ...]` marker,
  visibly styled so it's obvious in the browser, not just in source. This
  applies to the database too — see `Backend` below.
- No third-party network calls (analytics, forms, maps, email/SMS
  notification providers) without asking first — the Google Maps embed
  on `contact.html` was added with explicit permission. The `nodemailer`
  notification pipeline is now wired up in code, but makes zero real
  network calls until `SMTP_HOST`/`NOTIFY_TO_EMAIL` are filled into
  `.env` — until then every enquiry still persists, it just logs
  "SMTP not configured" instead of emailing anyone. The AI chat widget
  (`server/services/chatbot.js`, calling the Anthropic API from the
  server — the key never reaches the browser) was added with explicit
  permission; it makes zero real network calls until `ANTHROPIC_API_KEY`
  is set, showing a "not set up yet" message instead. Its system prompt
  restricts it to real published Property/Project/SiteSettings data
  fetched fresh per request and explicitly forbids inventing facts or
  promising guaranteed returns — the Non-Negotiable Content Rule applies
  to its output exactly as it does to every static page. Anything outside
  that scope is handed off via a `capture_lead` tool call that writes
  into the same `enquiries` table as the other public forms (`type =
  'chatbot'`), not a separate pipeline.
- The WhatsApp click-to-chat button (`initWhatsAppButton()` in
  `js/script.js`) only renders once a real number is entered at
  `/admin/site-settings` — never hard-code or guess a number, even one
  that looks plausible from an existing phone number elsewhere on the
  site.
- Every admin `POST`/multipart form requires a CSRF token
  (`server/middleware/csrf.js`) — the browser side is automatic
  (`js/admin.js` reads a meta tag and injects `_csrf` into every admin
  form), but any new admin route must call `verifyCsrfToken` itself,
  placed *after* any `multer` upload middleware on that route (multer is
  what populates `req.body` for multipart requests — putting the check
  before it means `req.body._csrf` doesn't exist yet). Routes with no
  multipart forms can use `router.use(verifyCsrfToken)` instead.
- `helmet` is applied globally with a customized CSP (see `server/app.js`)
  — `frame-src` explicitly allows `https://www.google.com` for the Maps
  embed. If a future change adds an external resource (another embed, a
  CDN script, etc.), the CSP will need a matching directive added or it
  will silently fail to load — check the browser console for
  "Refused to..." messages after any such change.
- Only touch files needed for the current task.

## Backend

Full audit, architecture decisions, schema, API route plan, admin panel
plan, and the milestone roadmap live in the plan file the client's
backend spec was approved against — read it before extending the
backend further. See `API.md` for the concrete route reference. Key
rules that apply to all future backend work:

- **Never seed or invent real-looking business data.** Any demo/dev seed
  data (`npm run seed`) is name-prefixed `"[DEMO] "` and flagged
  `is_demo_seed = 1` in the database — this must never be relaxed, even
  temporarily. `npm run db:reset` strips all such rows without touching
  real content.
- Public API/pages only ever serve `is_published = 1` rows.
- A content entity (Property, Project, Article) can only be published
  once its required fields + at least one image exist — enforced
  server-side in the admin route, not just in the UI. A Testimonial can
  only be published once marked `is_verified = 1` — same enforcement
  pattern.
- Auth is session-based (bcrypt + `express-session` + a SQLite-backed
  store) — do not introduce JWT without a real reason to revisit that
  decision.
- Migrations live in `server/db/migrations/*.sql`, applied in order and
  recorded in `schema_migrations` — never edit an already-applied
  migration file; add a new one.
- Currently built: Properties, Projects, and Articles (full CRUD, public
  list/detail, admin panel, image upload, publish gates), full
  Location/Agent CRUD, Team (CRUD, wired into `/about.html`),
  Testimonials (CRUD with the verify-before-publish gate, wired into
  `/`), Site Settings (key-value table; the admin form currently covers
  the homepage's 4 stats + the WhatsApp number), and Enquiries — all 3
  public forms (`contact.html`, and the `.enquiry-form` instances on
  property/project detail pages) persist to the `enquiries` table and
  fire an (currently no-op, see `Rules` above) email notification, both
  rate-limited and honeypot-protected; the admin has a filterable
  enquiries inbox with status updates and CSV export. The three
  testimonials, the one team member (M. Zeeshan Awan), and the 4 stat
  values already in the database are real, pre-existing content migrated
  from the old static HTML via `server/seed/migrate-static-content.js` —
  not fabricated. Also built: `helmet` security headers with a
  site-appropriate CSP, CSRF protection on every admin form, rate
  limiting on the admin login (10 attempts/15 min) in addition to the
  existing public-write limiter, JSON-LD (`RealEstateListing` on
  Property/Project detail pages, `Article` on Insights detail pages) via
  the `jsonLd()`/`absoluteUrl()` `app.locals` helpers, and a dynamic
  `/sitemap.xml`. Not yet built: WhatsApp/SMS *notification* delivery
  (the click-to-chat button and its click tracking are done; sending the
  business itself a WhatsApp/SMS alert is deferred, per the architecture
  decision, until real provider credentials are supplied) and a
  from-scratch OpenAPI spec (a hand-written markdown reference exists at
  `API.md` instead).

## Workflow

- Preview locally via the dev server defined in `.claude/launch.json`
  (`npm run dev`, an Express server on port 5588 backed by
  `data.sqlite`), not by assuming a `file://` open behaves identically
  to a served page.
- First-time setup: copy `.env.example` to `.env` and fill in
  `SESSION_SECRET`/`ADMIN_EMAIL`/`ADMIN_PASSWORD`, then
  `npm install && npm run db:migrate && npm run create-admin && npm run
  migrate-static-content` (the last one loads the real team
  member/testimonials/stats that used to be hard-coded in the static
  HTML — safe to re-run, it skips rows that already exist). `npm run
  seed` adds demo data for local testing; `npm run db:reset` removes it
  again.
- Before calling any UI change done, verify it in the live browser
  preview rather than by reading the source alone.
