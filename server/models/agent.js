const { getDb } = require("../db/connection");

function findAllPublished() {
  const db = getDb();
  return db.prepare("SELECT * FROM agents WHERE is_published = 1 ORDER BY name").all();
}

function findAllForAdmin() {
  const db = getDb();
  return db.prepare("SELECT * FROM agents ORDER BY name").all();
}

function findById(id) {
  const db = getDb();
  return db.prepare("SELECT * FROM agents WHERE id = ?").get(id);
}

function create({ name, roleTitle, phone, email, photoPath, isPublished, isDemoSeed }) {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO agents (name, role_title, phone, email, photo_path, is_published, is_demo_seed)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(name, roleTitle || null, phone || null, email || null, photoPath || null, isPublished ? 1 : 0, isDemoSeed ? 1 : 0);
  return findById(Number(result.lastInsertRowid));
}

function update(id, { name, roleTitle, phone, email, isPublished }) {
  const db = getDb();
  db.prepare(
    `UPDATE agents SET name = ?, role_title = ?, phone = ?, email = ?, is_published = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(name, roleTitle || null, phone || null, email || null, isPublished ? 1 : 0, id);
  return findById(id);
}

function setPhoto(id, photoPath) {
  const db = getDb();
  db.prepare("UPDATE agents SET photo_path = ?, updated_at = datetime('now') WHERE id = ?").run(photoPath, id);
  return findById(id);
}

function remove(id) {
  const db = getDb();
  db.prepare("DELETE FROM agents WHERE id = ?").run(id);
}

module.exports = { findAllPublished, findAllForAdmin, findById, create, update, setPhoto, remove };
