const { getDb } = require("../db/connection");

function create({ type, name, phone, email, message, interest, propertyId, projectId, sourcePage }) {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO enquiries (type, name, phone, email, message, interest, property_id, project_id, source_page)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      type,
      name || null,
      phone || null,
      email || null,
      message || null,
      interest || null,
      propertyId || null,
      projectId || null,
      sourcePage || null
    );
  return findById(Number(result.lastInsertRowid));
}

function findById(id) {
  const db = getDb();
  return db.prepare("SELECT * FROM enquiries WHERE id = ?").get(id);
}

function markNotified(id, error = null) {
  const db = getDb();
  db.prepare(
    `UPDATE enquiries SET notified_at = datetime('now'), notify_error = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(error, id);
}

function findAllForAdmin(filters = {}) {
  const db = getDb();
  const where = [];
  const params = [];

  if (filters.type) {
    where.push("type = ?");
    params.push(filters.type);
  }
  if (filters.status) {
    where.push("status = ?");
    params.push(filters.status);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  return db.prepare(`SELECT * FROM enquiries ${whereSql} ORDER BY created_at DESC`).all(...params);
}

function setStatus(id, status) {
  const db = getDb();
  db.prepare("UPDATE enquiries SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
  return findById(id);
}

function countByStatus(status) {
  const db = getDb();
  return db.prepare("SELECT COUNT(*) AS n FROM enquiries WHERE status = ?").get(status).n;
}

function countAll() {
  const db = getDb();
  return db.prepare("SELECT COUNT(*) AS n FROM enquiries").get().n;
}

module.exports = { create, findById, markNotified, findAllForAdmin, setStatus, countByStatus, countAll };
