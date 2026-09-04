const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  return value;
}

// Defaults to the project root for local dev; set DATA_DIR to a mounted
// persistent volume's path in production (e.g. Railway) so the database
// and uploads survive redeploys instead of living inside the ephemeral
// deployed code directory.
const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, "..", "..");

module.exports = {
  port: Number(process.env.PORT) || 5588,
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  sessionSecret: required("SESSION_SECRET", "dev-only-insecure-secret-change-me"),
  adminEmail: process.env.ADMIN_EMAIL || "",
  adminPassword: process.env.ADMIN_PASSWORD || "",
  // Opt-in, one-time flag: when true, boot-time admin bootstrap overwrites
  // an existing admin's password with ADMIN_PASSWORD instead of leaving it
  // alone. Meant to be set for one deploy then unset again — never left on,
  // or every future deploy would silently reset the password back to it.
  adminResetPassword: process.env.ADMIN_RESET_PASSWORD === "true",
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "",
  },
  notifyToEmail: process.env.NOTIFY_TO_EMAIL || "",
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || "",
    model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
  },
  publicSiteOrigin: process.env.PUBLIC_SITE_ORIGIN || `http://localhost:${Number(process.env.PORT) || 5588}`,
  dbPath: path.join(dataDir, "data.sqlite"),
  uploadsDir: path.join(dataDir, "uploads"),
};
