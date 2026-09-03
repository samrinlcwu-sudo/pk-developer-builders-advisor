const bcrypt = require("bcryptjs");
const env = require("../config/env");
const { runMigrations } = require("./migrate");
const adminUserModel = require("../models/adminUser");

function createAdmin({ exitOnError = true } = {}) {
  runMigrations();

  const email = env.adminEmail;
  const password = env.adminPassword;
  const fail = (message) => {
    console.error(message);
    if (exitOnError) process.exit(1);
  };

  if (!email || !password) {
    fail("[create-admin] Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file before running this script.");
    return;
  }

  if (password.length < 8) {
    fail("[create-admin] ADMIN_PASSWORD must be at least 8 characters.");
    return;
  }

  const existing = adminUserModel.findByEmail(email);
  if (existing) {
    console.log("[create-admin] An admin with email %s already exists. No changes made.", email);
    return;
  }

  const passwordHash = bcrypt.hashSync(password, 12);
  const admin = adminUserModel.create({ email, passwordHash, role: "admin" });
  console.log("[create-admin] Created admin user #%d (%s).", admin.id, admin.email);
}

if (require.main === module) {
  createAdmin();
}

module.exports = { createAdmin };
