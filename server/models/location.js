const { getDb } = require("../db/connection");

function findAllPublished() {
  const db = getDb();
  return db.prepare("SELECT * FROM locations WHERE is_published = 1 ORDER BY name").all();
}

function findAllForAdmin() {
  const db = getDb();
  return db.prepare("SELECT * FROM locations ORDER BY name").all();
}

function findBySlug(slug) {
  const db = getDb();
  return db.prepare("SELECT * FROM locations WHERE slug = ?").get(slug);
}

function findById(id) {
  const db = getDb();
  return db.prepare("SELECT * FROM locations WHERE id = ?").get(id);
}

function create({ name, slug, city, region, description, imagePath, isPublished, isDemoSeed }) {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO locations (name, slug, city, region, description, image_path, is_published, is_demo_seed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(name, slug, city || null, region || null, description || null, imagePath || null, isPublished ? 1 : 0, isDemoSeed ? 1 : 0);
  return findById(Number(result.lastInsertRowid));
}

function update(id, { name, slug, city, region, description, isPublished }) {
  const db = getDb();
  db.prepare(
    `UPDATE locations SET name = ?, slug = ?, city = ?, region = ?, description = ?, is_published = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(name, slug, city || null, region || null, description || null, isPublished ? 1 : 0, id);
  return findById(id);
}

function setImage(id, imagePath) {
  const db = getDb();
  db.prepare("UPDATE locations SET image_path = ?, updated_at = datetime('now') WHERE id = ?").run(imagePath, id);
  return findById(id);
}

function remove(id) {
  const db = getDb();
  db.prepare("DELETE FROM locations WHERE id = ?").run(id);
}

function slugExists(slug, excludeId = null) {
  const db = getDb();
  const row = excludeId
    ? db.prepare("SELECT id FROM locations WHERE slug = ? AND id != ?").get(slug, excludeId)
    : db.prepare("SELECT id FROM locations WHERE slug = ?").get(slug);
  return Boolean(row);
}

module.exports = {
  findAllPublished,
  findAllForAdmin,
  findBySlug,
  findById,
  create,
  update,
  setImage,
  remove,
  slugExists,
};
