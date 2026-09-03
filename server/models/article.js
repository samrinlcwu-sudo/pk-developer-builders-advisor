const { getDb } = require("../db/connection");

function buildFilterClause(filters) {
  const where = [];
  const params = [];

  if (filters.publishedOnly) {
    where.push("is_published = 1");
  }
  if (filters.category) {
    where.push("category = ?");
    params.push(filters.category);
  }
  if (filters.featured) {
    where.push("is_featured = 1");
  }

  return { whereSql: where.length ? `WHERE ${where.join(" AND ")}` : "", params };
}

function findAll(filters = {}) {
  const db = getDb();
  const { whereSql, params } = buildFilterClause(filters);
  const page = Math.max(1, Number(filters.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(filters.pageSize) || 12));
  const offset = (page - 1) * pageSize;

  const totalRow = db.prepare(`SELECT COUNT(*) AS n FROM articles ${whereSql}`).get(...params);

  const rows = db
    .prepare(
      `SELECT * FROM articles ${whereSql}
       ORDER BY COALESCE(published_at, created_at) DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, pageSize, offset);

  return {
    data: rows,
    pagination: {
      page,
      pageSize,
      total: totalRow.n,
      totalPages: Math.max(1, Math.ceil(totalRow.n / pageSize)),
    },
  };
}

function findFeaturedPublished() {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM articles WHERE is_published = 1 AND is_featured = 1
       ORDER BY COALESCE(published_at, created_at) DESC LIMIT 1`
    )
    .get();
}

function findRelatedPublished(excludeId, limit = 3) {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM articles WHERE is_published = 1 AND id != ?
       ORDER BY COALESCE(published_at, created_at) DESC LIMIT ?`
    )
    .all(excludeId, limit);
}

function findAllForAdmin() {
  const db = getDb();
  return db.prepare("SELECT * FROM articles ORDER BY created_at DESC").all();
}

function findBySlug(slug, { publishedOnly = false } = {}) {
  const db = getDb();
  const sql = `SELECT * FROM articles WHERE slug = ? ${publishedOnly ? "AND is_published = 1" : ""}`;
  return db.prepare(sql).get(slug);
}

function findById(id) {
  const db = getDb();
  return db.prepare("SELECT * FROM articles WHERE id = ?").get(id);
}

function create(fields) {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO articles (slug, title, category, author_name, excerpt, body, cover_image_path, is_featured, published_at, is_published, is_demo_seed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      fields.slug,
      fields.title,
      fields.category,
      fields.authorName || null,
      fields.excerpt || null,
      fields.body || null,
      fields.coverImagePath || null,
      fields.isFeatured ? 1 : 0,
      fields.publishedAt || null,
      fields.isPublished ? 1 : 0,
      fields.isDemoSeed ? 1 : 0
    );
  return findById(Number(result.lastInsertRowid));
}

function update(id, fields) {
  const db = getDb();
  db.prepare(
    `UPDATE articles SET
      slug = ?, title = ?, category = ?, author_name = ?, excerpt = ?, body = ?,
      is_featured = ?, published_at = ?, is_published = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    fields.slug,
    fields.title,
    fields.category,
    fields.authorName || null,
    fields.excerpt || null,
    fields.body || null,
    fields.isFeatured ? 1 : 0,
    fields.publishedAt || null,
    fields.isPublished ? 1 : 0,
    id
  );
  return findById(id);
}

function setCoverImage(id, coverImagePath) {
  const db = getDb();
  db.prepare("UPDATE articles SET cover_image_path = ?, updated_at = datetime('now') WHERE id = ?").run(coverImagePath, id);
  return findById(id);
}

function remove(id) {
  const db = getDb();
  db.prepare("DELETE FROM articles WHERE id = ?").run(id);
}

function slugExists(slug, excludeId = null) {
  const db = getDb();
  const row = excludeId
    ? db.prepare("SELECT id FROM articles WHERE slug = ? AND id != ?").get(slug, excludeId)
    : db.prepare("SELECT id FROM articles WHERE slug = ?").get(slug);
  return Boolean(row);
}

module.exports = {
  findAll,
  findFeaturedPublished,
  findRelatedPublished,
  findAllForAdmin,
  findBySlug,
  findById,
  create,
  update,
  setCoverImage,
  remove,
  slugExists,
};
