const path = require("node:path");
const express = require("express");
const session = require("express-session");
const helmet = require("helmet");

const env = require("./config/env");
const { SqliteSessionStore } = require("./middleware/sessionStore");
const { requireAdmin } = require("./middleware/auth");
const { attachCsrfToken } = require("./middleware/csrf");
const { adminLoginLimiter } = require("./middleware/rateLimit");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const adminAuthRoutes = require("./routes/admin/auth");
const adminDashboardRoutes = require("./routes/admin/dashboard");
const adminPropertiesRoutes = require("./routes/admin/properties");
const adminLocationsRoutes = require("./routes/admin/locations");
const adminAgentsRoutes = require("./routes/admin/agents");
const adminProjectsRoutes = require("./routes/admin/projects");
const adminTeamRoutes = require("./routes/admin/team");
const adminTestimonialsRoutes = require("./routes/admin/testimonials");
const adminArticlesRoutes = require("./routes/admin/articles");
const adminSiteSettingsRoutes = require("./routes/admin/siteSettings");
const adminEnquiriesRoutes = require("./routes/admin/enquiries");
const publicPropertiesRoutes = require("./routes/public/properties");
const publicProjectsRoutes = require("./routes/public/projects");
const publicInsightsRoutes = require("./routes/public/insights");
const publicPagesRoutes = require("./routes/public/pages");
const publicEnquiriesRoutes = require("./routes/public/enquiries");
const publicChatRoutes = require("./routes/public/chat");
const publicSitemapRoutes = require("./routes/public/sitemap");
const apiV1PropertiesRoutes = require("./routes/api/v1/properties");
const apiV1SiteSettingsRoutes = require("./routes/api/v1/siteSettings");

const PROJECT_ROOT = path.join(__dirname, "..");

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function createApp() {
  const app = express();

  // Required behind Railway's (or any) reverse proxy: without this,
  // express-rate-limit can't tell clients apart by X-Forwarded-For (every
  // request looks like it comes from the proxy) and secure cookies can
  // misbehave.
  if (env.isProduction) {
    app.set("trust proxy", 1);
  }

  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          // The site relies on inline style="" attributes throughout —
          // the default style-src already allows 'unsafe-inline', kept as-is.
          // Google Maps embed on contact.html needs its own frame-src;
          // the default falls back to default-src 'self' and would block it.
          "frame-src": ["'self'", "https://www.google.com"],
          "upgrade-insecure-requests": null,
        },
      },
    })
  );

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.use(
    session({
      store: new SqliteSessionStore(),
      secret: env.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 8, // 8 hours
        sameSite: "lax",
        secure: env.isProduction,
      },
    })
  );

  // Reusable "content required" helpers — every EJS view uses these instead
  // of ever inventing a value, matching the site's existing dashed-border
  // placeholder convention (css/style.css .content-required[-block]).
  app.locals.cr = (value, label) => {
    if (value === null || value === undefined || value === "") {
      return `<span class="content-required">[CONTENT REQUIRED: ${escapeHtml(label)}]</span>`;
    }
    return escapeHtml(String(value));
  };
  app.locals.crBlock = (label) => `<div class="content-required-block">[CONTENT REQUIRED: ${escapeHtml(label)}]</div>`;
  app.locals.formatPrice = (price, currency) => {
    if (price === null || price === undefined) return null;
    return `${currency || "PKR"} ${Number(price).toLocaleString("en-PK")}`;
  };
  app.locals.formatArea = (area) => {
    if (area === null || area === undefined) return null;
    return `${Number(area).toLocaleString("en-PK")} sq ft`;
  };
  // Renders a JSON-LD <script> block. Escapes '<' so nothing in the data
  // (e.g. a "</script>" substring inside admin-entered text) can break
  // out of the script tag.
  app.locals.jsonLd = (obj) => {
    const json = JSON.stringify(obj).replace(/</g, "\\u003c");
    return `<script type="application/ld+json">${json}</script>`;
  };
  app.locals.absoluteUrl = (path) => `${env.publicSiteOrigin}${path}`;

  // Dynamic page routes (index/about/properties/projects) must be
  // registered before express.static so they take priority over any
  // leftover static file of the same name.
  app.use("/", publicPagesRoutes);
  app.use("/", publicPropertiesRoutes);
  app.use("/", publicProjectsRoutes);
  app.use("/", publicInsightsRoutes);
  app.use("/", publicEnquiriesRoutes);
  app.use("/", publicChatRoutes);
  app.use("/", publicSitemapRoutes);

  // Static assets and the untouched marketing pages (services/development/
  // construction/advisory/etc.) are served exactly as before.
  app.use(express.static(PROJECT_ROOT, { extensions: ["html"] }));
  app.use("/media", express.static(env.uploadsDir));

  app.use("/api/v1/properties", apiV1PropertiesRoutes);
  app.use("/api/v1/site-settings", apiV1SiteSettingsRoutes);

  // Ensures res.locals.csrfToken exists for every admin page render (login
  // included) — actual verification happens per-route, after any multer
  // middleware has parsed the body (see each admin/*.js route file).
  app.use("/admin", attachCsrfToken);

  // Auth routes (/admin/login, /admin/logout) must stay reachable without a
  // session; everything else under /admin requires one.
  app.use("/admin/login", adminLoginLimiter);
  app.use("/admin", adminAuthRoutes);
  app.use("/admin", requireAdmin, adminDashboardRoutes);
  app.use("/admin/properties", requireAdmin, adminPropertiesRoutes);
  app.use("/admin/locations", requireAdmin, adminLocationsRoutes);
  app.use("/admin/agents", requireAdmin, adminAgentsRoutes);
  app.use("/admin/projects", requireAdmin, adminProjectsRoutes);
  app.use("/admin/team", requireAdmin, adminTeamRoutes);
  app.use("/admin/testimonials", requireAdmin, adminTestimonialsRoutes);
  app.use("/admin/articles", requireAdmin, adminArticlesRoutes);
  app.use("/admin/site-settings", requireAdmin, adminSiteSettingsRoutes);
  app.use("/admin/enquiries", requireAdmin, adminEnquiriesRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
