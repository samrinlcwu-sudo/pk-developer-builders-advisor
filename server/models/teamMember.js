const { getDb } = require("../db/connection");

function findAllPublished() {
  const db = getDb();
  return db.prepare("SELECT * FROM team_members WHERE is_published = 1 ORDER BY sort_order, id").all();
}

function findAllForAdmin() {
  const db = getDb();
  return db.prepare("SELECT * FROM team_members ORDER BY sort_order, id").all();
}

function findById(id) {
  const db = getDb();
  return db.prepare("SELECT * FROM team_members WHERE id = ?").get(id);
}

function create({ name, roleTitle, bio, photoPath, sortOrder, isPublished, isDemoSeed }) {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO team_members (name, role_title, bio, photo_path, sort_order, is_published, is_demo_seed)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(name, roleTitle || null, bio || null, photoPath || null, sortOrder || 0, isPublished ? 1 : 0, isDemoSeed ? 1 : 0);
  return findById(Number(result.lastInsertRowid));
}

function update(id, { name, roleTitle, bio, sortOrder, isPublished }) {
  const db = getDb();
  db.prepare(
    `UPDATE team_members SET name = ?, role_title = ?, bio = ?, sort_order = ?, is_published = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(name, roleTitle || null, bio || null, sortOrder || 0, isPublished ? 1 : 0, id);
  return findById(id);
}

function setPhoto(id, photoPath) {
  const db = getDb();
  db.prepare("UPDATE team_members SET photo_path = ?, updated_at = datetime('now') WHERE id = ?").run(photoPath, id);
  return findById(id);
}

function remove(id) {
  const db = getDb();
  db.prepare("DELETE FROM team_members WHERE id = ?").run(id);
}

module.exports = { findAllPublished, findAllForAdmin, findById, create, update, setPhoto, remove };
