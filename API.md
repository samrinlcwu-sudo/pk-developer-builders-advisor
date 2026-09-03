# API Reference

This documents the actual routes the backend exposes. Most of the site is
server-rendered HTML (EJS), not a JSON API — only Properties and a small
Site Settings slice have a dedicated JSON API today; everything else is
consumed by visiting the page directly. See `CLAUDE.md`'s `Backend`
section for the architecture behind this.

All responses are JSON unless noted. Error shape is consistent:

```json
{ "error": { "message": "...", "code": "..." } }
```

## Public JSON API (`/api/v1`)

No authentication. Only ever returns rows with `is_published = 1`.

### `GET /api/v1/properties`

Query params (all optional): `type`, `status`, `location` (a Location
slug), `minPrice`, `maxPrice`, `minArea`, `maxArea`, `bedrooms` (matches
"at least N"), `bathrooms` (at least N), `page`, `pageSize` (max 50),
`sort` (`newest` | `price_asc` | `price_desc`).

```json
{
  "data": [ { "id": 1, "slug": "...", "title": "...", "price": 25000000, "...": "..." } ],
  "pagination": { "page": 1, "pageSize": 12, "total": 1, "totalPages": 1 }
}
```

An empty result set returns `200` with `"data": []`, never an error.

### `GET /api/v1/properties/:slug`

`{ "data": { ...property, "images": [...], "features": [...], "agent": {...} | null } }`,
or `404 { "error": {...} }` if not found or unpublished.

### `GET /api/v1/site-settings/public`

Exposes only the settings safe for public page JS to read — currently
just the WhatsApp number (or `null` if not configured):

```json
{ "data": { "whatsappNumber": "923001234567" } }
```

## Public write endpoints (lead capture)

Unauthenticated but rate-limited (5 requests / 10 min per IP, shared
across all four routes below — see `server/middleware/rateLimit.js`) and
protected by a honeypot field named `website` (`server/middleware/honeypot.js`).
A filled honeypot silently returns success without persisting anything.

### `POST /enquiries`

Body (form-encoded): `name` (required), `phone` or `email` (at least one
required), `interest`, `message`. Persists an `enquiries` row with
`type = 'contact'`. Returns `{ "ok": true }` or `422` with a validation
message.

### `POST /properties/:slug/enquire`

Same body/validation as above. Persists with `type = 'property-info'`
and `property_id` set. `404` if the property doesn't exist or isn't
published.

### `POST /projects/:slug/enquire`

Same, with `type = 'project-info'` and `project_id` set.

### `POST /whatsapp-click`

No body required, no validation. Fired via `navigator.sendBeacon` when
the floating WhatsApp button is clicked. Persists a `type = 'whatsapp-click'`
row for analytics only — no notification email is sent for these.
Returns `204 No Content`.

## Server-rendered public pages

Not a JSON API — visiting these URLs returns full HTML pages.

| Path | Notes |
| --- | --- |
| `/`, `/index.html` | Home — featured projects, testimonials, stats band |
| `/about.html` | Company story, mission, Team section |
| `/properties`, `/properties/:slug` | Filterable list + detail |
| `/projects`, `/projects/:slug` | Filterable list + detail (Verified Features) |
| `/insights`, `/insights/:slug` | Category-filterable list + detail |
| `/sitemap.xml` | Generated at request time from published Properties/Projects/Articles |
| `services.html`, `development.html`, `construction.html`, `advisory.html`, `contact.html` | Static, no backing entity |

## Admin routes (`/admin/...`)

Session-authenticated (`express-session`, SQLite-backed store). All
state-changing (`POST`) requests require a valid CSRF token — see
`server/middleware/csrf.js`. The browser handles this automatically
(`js/admin.js` injects the token into every admin form from a meta tag);
anything scripting these routes directly (e.g. `curl`) must first `GET`
an admin page to obtain a session + token, then include `_csrf` in the
POST body.

- `GET /admin/login`, `POST /admin/login` (rate-limited, 10 attempts /
  15 min per IP), `POST /admin/logout`
- `GET /admin` — dashboard (row counts across every entity)
- Full CRUD (`GET /`, `GET /new`, `POST /`, `GET /:id/edit`, `POST /:id`,
  `POST /:id/delete`) for each of: `properties`, `locations`, `agents`,
  `projects`, `team`, `testimonials`, `articles`. `properties` and
  `projects` additionally have `POST /:id/images` (multipart upload) and
  `POST /:id/images/:imageId/delete`; `locations`/`agents`/`team`/
  `articles` accept a single photo/cover-image upload on their create
  and edit forms instead.
- `GET /admin/site-settings`, `POST /admin/site-settings` — one form
  covering the homepage stats + WhatsApp number
- `GET /admin/enquiries` (filter by `?type=`/`?status=`),
  `GET /admin/enquiries/export.csv`, `POST /admin/enquiries/:id/status`

### Publish gates (enforced server-side, not just in the UI)

- **Property, Project, Article** — require their core fields (title,
  type/location as applicable, body for articles) *and* at least one
  image before `is_published` can be set.
- **Testimonial** — requires `is_verified = 1` first.
