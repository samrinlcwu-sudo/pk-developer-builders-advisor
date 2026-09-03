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
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "",
  },
  notifyToEmail: process.env.NOTIFY_TO_EMAIL || "",
  publicSiteOrigin: process.env.PUBLIC_SITE_ORIGIN || `http://localhost:${Number(process.env.PORT) || 5588}`,
  dbPath: path.join(dataDir, "data.sqlite"),
  uploadsDir: path.join(dataDir, "uploads"),
};
