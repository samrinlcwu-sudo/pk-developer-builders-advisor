const { getDb } = require("../db/connection");

function findAllPublished(limit) {
  const db = getDb();
  const sql = `SELECT * FROM testimonials WHERE is_published = 1 AND is_verified = 1 ORDER BY sort_order, id${
    limit ? " LIMIT ?" : ""
  }`;
  return limit ? db.prepare(sql).all(limit) : db.prepare(sql).all();
}

function findAllForAdmin() {
  const db = getDb();
  return db.prepare("SELECT * FROM testimonials ORDER BY sort_order, id").all();
}

function findById(id) {
  const db = getDb();
  return db.prepare("SELECT * FROM testimonials WHERE id = ?").get(id);
}

function create({ quote, authorName, authorRole, isVerified, sortOrder, isPublished, isDemoSeed }) {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO testimonials (quote, author_name, author_role, is_verified, sort_order, is_published, is_demo_seed)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(quote, authorName, authorRole || null, isVerified ? 1 : 0, sortOrder || 0, isPublished ? 1 : 0, isDemoSeed ? 1 : 0);
  return findById(Number(result.lastInsertRowid));
}

function update(id, { quote, authorName, authorRole, isVerified, sortOrder, isPublished }) {
  const db = getDb();
  db.prepare(
    `UPDATE testimonials SET quote = ?, author_name = ?, author_role = ?, is_verified = ?, sort_order = ?, is_published = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(quote, authorName, authorRole || null, isVerified ? 1 : 0, sortOrder || 0, isPublished ? 1 : 0, id);
  return findById(id);
}

function remove(id) {
  const db = getDb();
  db.prepare("DELETE FROM testimonials WHERE id = ?").run(id);
}

module.exports = { findAllPublished, findAllForAdmin, findById, create, update, remove };
