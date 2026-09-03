// Strips demo/seed data (rows flagged is_demo_seed = 1) without touching
// any real, manually-entered content. This is intentionally NOT a full
// database wipe — real admin-entered rows must never be at risk from a
// single command typo.
const { getDb } = require("./connection");
const { runMigrations } = require("./migrate");

function resetDemoData() {
  runMigrations();
  const db = getDb();

  db.exec("BEGIN");
  try {
    // Child rows first (property_images/property_features/project_images/
    // project_features have no is_demo_seed column of their own — they
    // cascade-delete via their parent's FK when the parent demo row is removed).
    for (const table of ["properties", "locations", "agents", "projects", "team_members", "testimonials", "articles"]) {
      const result = db.prepare(`DELETE FROM ${table} WHERE is_demo_seed = 1`).run();
      if (result.changes > 0) {
        console.log("[db:reset] Removed %d demo row(s) from %s", result.changes, table);
      }
    }
    db.exec("COMMIT");
    console.log("[db:reset] Done.");
  } catch (err) {
    db.exec("ROLLBACK");
    console.error("[db:reset] Failed:", err.message);
    throw err;
  }
}

if (require.main === module) {
  resetDemoData();
}

module.exports = { resetDemoData };
