const { getDb } = require("../db/connection");

function getAll() {
  const db = getDb();
  const rows = db.prepare("SELECT key, value FROM site_settings").all();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

function get(key) {
  const db = getDb();
  const row = db.prepare("SELECT value FROM site_settings WHERE key = ?").get(key);
  return row ? row.value : null;
}

function set(key, value) {
  const db = getDb();
  db.prepare(
    `INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
  ).run(key, value === "" || value === undefined ? null : String(value));
}

function setMany(pairs) {
  Object.entries(pairs).forEach(([key, value]) => set(key, value));
}

module.exports = { getAll, get, set, setMany };
