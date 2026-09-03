const fs = require("node:fs");
const path = require("node:path");
const { getDb } = require("./connection");

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

function ensureMigrationsTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

function runMigrations() {
  const db = getDb();
  ensureMigrationsTable(db);

  const applied = new Set(
    db.prepare("SELECT filename FROM schema_migrations").all().map((row) => row.filename)
  );

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const pending = files.filter((f) => !applied.has(f));

  if (pending.length === 0) {
    console.log("[migrate] Database already up to date (%d migrations applied).", applied.size);
    return;
  }

  for (const filename of pending) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, filename), "utf8");
    console.log("[migrate] Applying %s...", filename);
    db.exec("BEGIN");
    try {
      db.exec(sql);
      db.prepare("INSERT INTO schema_migrations (filename) VALUES (?)").run(filename);
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      console.error("[migrate] Failed applying %s:", filename, err.message);
      throw err;
    }
  }

  console.log("[migrate] Applied %d migration(s).", pending.length);
}

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
