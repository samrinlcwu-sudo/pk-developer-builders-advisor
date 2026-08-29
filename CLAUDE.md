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

Static HTML/CSS/JS, no build tools or frameworks — multi-page site
(one `.html` file per page, shared `css/style.css` and `js/script.js`).
Chosen for simplicity, zero-dependency hosting, and fast load times on a
brand/marketing site with no dynamic backend needs yet.

## Structure

- `index.html` — Home
- `about.html` — Company story, mission, team
- `services.html` — Development / Construction / Advisory services
- `projects.html` — Project portfolio
- `contact.html` — Contact form + details
- `css/style.css` — All styles (CSS variables for theme)
- `js/script.js` — Nav toggle, scroll animations, form handling
- `assets/` — Images (currently empty — real photography/logo needed)

## Design System

- Palette: deep navy (`--color-navy`), warm gold accent (`--color-gold`),
  cream background (`--color-cream`), charcoal text.
- Type: "Playfair Display" (serif, headings) + "Inter" (sans, body), via
  Google Fonts.
- Tone: confident, understated luxury — not flashy/gaudy.

## Rules

- Keep it simple: no framework/build step unless the user asks for one.
- Every unverified business fact gets a `[CONTENT REQUIRED: ...]` marker,
  visibly styled so it's obvious in the browser, not just in source.
- No third-party network calls (analytics, forms, maps) without asking
  first — the contact form is currently front-end only pending a real
  backend/email-service decision.
- Only touch files needed for the current task.
