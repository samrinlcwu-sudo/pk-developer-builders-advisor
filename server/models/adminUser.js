const { getDb } = require("../db/connection");

function findByEmail(email) {
  const db = getDb();
  return db.prepare("SELECT * FROM admin_users WHERE email = ?").get(email);
}

function findById(id) {
  const db = getDb();
  return db.prepare("SELECT * FROM admin_users WHERE id = ?").get(id);
}

function create({ email, passwordHash, role = "admin" }) {
  const db = getDb();
  const result = db
    .prepare("INSERT INTO admin_users (email, password_hash, role) VALUES (?, ?, ?)")
    .run(email, passwordHash, role);
  return findById(Number(result.lastInsertRowid));
}

function setPasswordHash(id, passwordHash) {
  const db = getDb();
  db.prepare("UPDATE admin_users SET password_hash = ? WHERE id = ?").run(passwordHash, id);
  return findById(id);
}

function touchLastLogin(id) {
  const db = getDb();
  db.prepare("UPDATE admin_users SET last_login_at = datetime('now') WHERE id = ?").run(id);
}

function count() {
  const db = getDb();
  return db.prepare("SELECT COUNT(*) AS n FROM admin_users").get().n;
}

module.exports = { findByEmail, findById, create, setPasswordHash, touchLastLogin, count };
