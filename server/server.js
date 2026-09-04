const env = require("./config/env");
const { runMigrations } = require("./db/migrate");
const { createAdmin } = require("./db/create-admin");
const { migrate: migrateStaticContent } = require("./seed/migrate-static-content");
const { migrate: migrateRealContent } = require("./seed/migrate-real-content");
const { createApp } = require("./app");

runMigrations();

// Bootstraps the first admin user from ADMIN_EMAIL/ADMIN_PASSWORD when set
// (idempotent — skips if that email already exists). Runs here, inside the
// container that actually has the mounted volume, rather than as a
// separate pre-deploy step (Railway's pre-deploy commands run without
// volume access, which is where this used to fail).
if (env.adminEmail && env.adminPassword) {
  try {
    createAdmin({ exitOnError: false });
  } catch (err) {
    console.error("[server] Admin bootstrap failed:", err.message);
  }
}

// Both are idempotent (guarded by slug/name checks) and insert only real,
// already-approved business content — never demo data — so it's safe to
// run on every boot in every environment, including production.
try {
  migrateStaticContent();
  migrateRealContent();
} catch (err) {
  console.error("[server] Real-content migration failed:", err.message);
}

const app = createApp();

app.listen(env.port, () => {
  console.log(`[server] PK Developer Builders & Advisor running at http://localhost:${env.port}`);
});
