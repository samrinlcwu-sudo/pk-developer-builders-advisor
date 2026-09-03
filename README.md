# PK Developer Builders & Advisor — Website

A marketing website for PK Developer Builders & Advisor, a property
developer, builder, and real estate advisor. Most pages are still static,
zero-build HTML/CSS/JS; a Node.js + Express + EJS backend (with a small
SQLite database) now server-renders the pages that need real,
admin-managed data — Properties, Projects, Articles, the
Team/Testimonials/stats sections of the homepage and About page, and
lead capture from every form on the site. See `CLAUDE.md`'s `Backend`
section for the architecture/schema/milestone plan, and `API.md` for the
full route reference (public JSON API, lead-capture endpoints, and the
admin panel's routes).

## Features

- 13-page responsive site with a mobile nav toggle
- Lead-generation CTAs throughout (Book a Consultation, Request Property
  Information, Request Project Information, Request a Viewing, Talk to an
  Advisor), each backed by a short form that persists to the `enquiries`
  table, rate-limited (5 submissions / 10 min per IP) and honeypot-protected
- A floating WhatsApp click-to-chat button, shown on every page once a
  real number is set at `/admin/site-settings` (hidden until then — never
  a guessed or fabricated number); clicks are tracked as their own
  enquiry type
- An admin Enquiries inbox: filter by type/status, update status inline,
  export the current filtered view as CSV
- Property search/filter at `/properties` (type, location, price range,
  area range, bedrooms/bathrooms "at least N", status) — server-rendered
  and paginated, backed by the `properties` table (see `Backend` below)
- Project portfolio at `/projects` (status, location filters) with a
  detail page per project including a Verified Features block (only
  populated once the admin marks a feature verified)
- The homepage's Featured Work, Client Voices, and stats band, and the
  About page's Our Team section, are pulled live from the database
  instead of being hard-coded
- Insights/articles at `/insights` (category filter, one featured
  article) and `/insights/:slug`, server-rendered and paginated, backed
  by the `articles` table with a publish gate requiring a cover photo
- Accessibility: global `:focus-visible` styles and a
  `prefers-reduced-motion` media query that disables animation for users
  who request it
- SEO scaffolding: canonical + Open Graph tags on every page, `robots.txt`,
  a `/sitemap.xml` generated at request time from every published
  Property/Project/Article, and JSON-LD structured data (`Organization`
  on the homepage, `RealEstateListing` on property/project detail pages,
  `Article` on insight detail pages) — built only from real fields, never
  padded with invented ratings, review counts, or dates
- A visible `[CONTENT REQUIRED: ...]` placeholder convention — see
  `CLAUDE.md`'s Non-Negotiable Content Rule. No business fact is ever
  invented; unknown facts are marked, not guessed.
- Security: `helmet` security headers with a site-tuned CSP, CSRF
  protection on every admin form, and rate limiting on both the admin
  login and every public write endpoint

## Tech Stack

Node.js + Express + EJS + `node:sqlite` for pages/entities backed by real
data (Properties, Projects, Locations, Agents, Team, Testimonials,
Articles, Site Settings — see `CLAUDE.md`), plain HTML/CSS/JS (no build
step) for pages with no listable entity behind them (`services.html`,
`development.html`, `construction.html`, `advisory.html`, `contact.html`).
One process, one deploy artifact — no separate admin SPA, no client-side
data-fetching framework.

## Install

```bash
npm install
cp .env.example .env   # then fill in SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run db:migrate
npm run create-admin           # seeds the first admin user from .env
npm run migrate-static-content # one-time: loads the real founder/testimonial content
```

## Dev

The project's dev server is defined in `.claude/launch.json`:

```bash
npm run dev
```

Then open `http://localhost:5588`. `npm run seed` adds obviously-fake
`[DEMO]`-prefixed data for local testing; `npm run db:reset` removes it
again without touching real content (see `CLAUDE.md`'s `Backend` section
for the full non-negotiable-data policy behind this).

## Build

There is no build step for the static pages — edit HTML/CSS/JS directly
and refresh. The backend (`server/`) restarts automatically under
`npm run dev` via Node's built-in `--watch`.

## Environment Variables

See `.env.example` for the full list (session secret, first-admin
credentials, optional SMTP settings for lead notifications, allowed
public origin). `.env` is gitignored and must never be committed;
`SMTP_*`/`ADMIN_PASSWORD` values are real secrets once filled in.
Leaving `SMTP_HOST`/`NOTIFY_TO_EMAIL` blank simply disables email
notifications — every enquiry still persists to the database and shows
up in `/admin/enquiries` either way; the admin inbox just shows it as
"not sent" instead of "sent".

## Deployment

The backend needs a long-running Node process and **persistent disk**
(for `data.sqlite` and `uploads/`) — it can no longer be deployed as
static files copied to a CDN/static host. `npm start` runs the
production server; run `npm run db:migrate` and `npm run create-admin`
once against the production database before first launch.

The production domain is `https://redb.nimble.pk`, already set in every
page's canonical/Open Graph tags and `robots.txt` — update those once a
real domain is chosen. `/sitemap.xml` needs no such update: it's
generated dynamically from `PUBLIC_SITE_ORIGIN` (in `.env`) plus whatever
is currently published, so it's correct as soon as that one env var is
set for production.

## Folder Structure

```
.claude/                dev-server config (launch.json)
CLAUDE.md                project/brand guide for contributors
README.md                this file
API.md                   full route reference (public API, lead capture, admin)
server/                  Express app, node:sqlite models/migrations, EJS views
data.sqlite, .env, uploads/   gitignored, local/production only
/, /index.html             Home (server-rendered)
/about.html                Company story, mission, team (server-rendered)
services.html             Services overview (hub)
development.html          Development service detail
construction.html         Construction service detail
advisory.html             Advisory service detail
/projects, /projects/:slug   Project portfolio (server-rendered)
/insights, /insights/:slug   Insights/articles (server-rendered)
contact.html               Contact form + details
css/style.css              All styles (CSS variables for theme)
css/admin.css              Admin-panel-only layout additions
js/script.js               Nav toggle, insights filter, forms
robots.txt                 Crawler directives + sitemap reference
/sitemap.xml               Generated dynamically — no static file
assets/                    Logo, founder photo, a few unused pre-staged photos
```

Properties (`/properties`, `/properties/:slug`), Projects (`/projects`,
`/projects/:slug`), and Insights (`/insights`, `/insights/:slug`) are
server-rendered from the database — the old `properties.html`,
`property-detail.html`, `projects.html`, `project-detail.html`,
`insights.html`, and `insights-article.html` static files no longer
exist. `index.html` and `about.html` keep their original URLs but are now
server-rendered EJS views backed by the database (Team, Testimonials,
Featured Projects, homepage stats).

## Content still required before launch

Every `[CONTENT REQUIRED: ...]` marker on the site is a real business
fact that hasn't been supplied yet — see `CLAUDE.md`'s Non-Negotiable
Content Rule for the policy behind this. Highlights:

- Company overview, founding story, mission/vision/values
- Real project portfolio — the admin panel can now create/publish
  projects with photos, features, and verified details; none exist yet
- Real articles/insights — the admin panel can now create/publish
  articles with a cover photo; none exist yet
- Additional team members and testimonials beyond the one founder profile
  and three client quotes already in the database — add more via the
  admin panel as they're approved
- The homepage stats (years/projects/clients/cities) are editable at
  `/admin/site-settings`; update them there as the real numbers change
- Contact details: address, phone, email, office hours, map
- WhatsApp number for the click-to-chat button — set it at
  `/admin/site-settings` once confirmed; the button stays hidden until then
- Logo / brand photography (currently styled placeholder blocks throughout)
- Business registration/license number, if applicable
- Production domain (needed to replace the SEO placeholder domain above)
- Real SMTP credentials + a notification recipient in `.env`, so enquiries
  actually email someone instead of just landing in `/admin/enquiries`

## Contact form

The form on `contact.html` (and the `.enquiry-form` instances on detail
pages) now persist to the database and show up in `/admin/enquiries` —
see `CLAUDE.md`'s `Backend` section. Email notification is wired up in
code but inert until real SMTP credentials are supplied (see
`Environment Variables` above).

## Design system

Palette, type, and component styles live in `css/style.css` as CSS
variables at the top of the file — update those to change the whole
site's look consistently. See `CLAUDE.md`'s Design System section for the
palette/type/tone rationale.
