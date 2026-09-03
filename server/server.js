const env = require("./config/env");
const { runMigrations } = require("./db/migrate");
const { createAdmin } = require("./db/create-admin");
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

const app = createApp();

app.listen(env.port, () => {
  console.log(`[server] PK Developer Builders & Advisor running at http://localhost:${env.port}`);
});
