# PK Developer Builders & Advisor — Website

Static site, no build step. Open `index.html` directly or serve the folder
with any static file server.

## Pages

- `index.html` — Home
- `about.html` — About / mission / team
- `services.html` — Development, Construction, Advisory
- `projects.html` — Project portfolio
- `contact.html` — Contact form + details

## Content still required before launch

Every gold-dashed placeholder box on the site marks real content that's
missing — the design is done, the facts aren't. Highlights:

- Company overview, founding story, mission/vision/values
- Real stats (years in business, projects delivered, clients served, cities)
- Real project portfolio (names, locations, photos, descriptions)
- Real client testimonials
- Team names, titles, and photos
- Contact details: address, phone, email, office hours, map
- Phone / WhatsApp number for the quick-contact buttons on the Contact page
- Logo / brand photography (currently styled placeholder blocks throughout)
- Business registration/license number, if applicable

## Contact form

The form on `contact.html` validates client-side but does **not** send
anywhere yet — it needs a real backend endpoint or a form service (e.g. a
mail-relay API) wired up before launch. This was left undone rather than
adding a third-party integration without checking first.

## Design system

Palette, type, and component styles live in `css/style.css` as CSS
variables at the top of the file — update those to change the whole site's
look consistently.
