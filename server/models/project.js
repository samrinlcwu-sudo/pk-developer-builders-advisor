const fs = require("node:fs");
const path = require("node:path");
const { getDb } = require("../db/connection");
const env = require("../config/env");
const { VERIFIED_FEATURE_CATEGORIES } = require("../middleware/validate");

function buildFilterClause(filters) {
  const where = [];
  const params = [];

  if (filters.publishedOnly) {
    where.push("p.is_published = 1");
  }
  if (filters.status) {
    where.push("p.status = ?");
    params.push(filters.status);
  }
  if (filters.location) {
    where.push("l.slug = ?");
    params.push(filters.location);
  }

  return { whereSql: where.length ? `WHERE ${where.join(" AND ")}` : "", params };
}

function findAll(filters = {}) {
  const db = getDb();
  const { whereSql, params } = buildFilterClause(filters);
  const page = Math.max(1, Number(filters.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(filters.pageSize) || 12));
  const offset = (page - 1) * pageSize;

  const totalRow = db
    .prepare(`SELECT COUNT(*) AS n FROM projects p LEFT JOIN locations l ON l.id = p.location_id ${whereSql}`)
    .get(...params);

  const rows = db
    .prepare(
      `SELECT p.*, l.name AS location_name, l.slug AS location_slug
       FROM projects p LEFT JOIN locations l ON l.id = p.location_id
       ${whereSql}
       ORDER BY p.created_at DESC
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

function findFeaturedPublished(limit = 3) {
  const db = getDb();
  return db
    .prepare(
      `SELECT p.*, l.name AS location_name, l.slug AS location_slug
       FROM projects p LEFT JOIN locations l ON l.id = p.location_id
       WHERE p.is_published = 1
       ORDER BY p.created_at DESC
       LIMIT ?`
    )
    .all(limit);
}

function findAllForAdmin() {
  const db = getDb();
  return db
    .prepare(
      `SELECT p.*, l.name AS location_name
       FROM projects p LEFT JOIN locations l ON l.id = p.location_id
       ORDER BY p.created_at DESC`
    )
    .all();
}

function attachRelations(project) {
  if (!project) return project;
  const db = getDb();
  project.images = db
    .prepare("SELECT * FROM project_images WHERE project_id = ? ORDER BY sort_order, id")
    .all(project.id);
  project.features = db
    .prepare("SELECT * FROM project_features WHERE project_id = ? ORDER BY sort_order, id")
    .all(project.id);

  const verifiedRows = db
    .prepare("SELECT category, value FROM project_verified_features WHERE project_id = ?")
    .all(project.id);
  const verifiedByCategory = Object.fromEntries(verifiedRows.map((r) => [r.category, r.value]));
  project.verifiedFeatures = VERIFIED_FEATURE_CATEGORIES.map((category) => ({
    category,
    value: verifiedByCategory[category] ?? null,
  }));

  return project;
}

function findBySlug(slug, { publishedOnly = false } = {}) {
  const db = getDb();
  const sql = `SELECT p.*, l.name AS location_name, l.slug AS location_slug
               FROM projects p LEFT JOIN locations l ON l.id = p.location_id
               WHERE p.slug = ? ${publishedOnly ? "AND p.is_published = 1" : ""}`;
  const project = db.prepare(sql).get(slug);
  return attachRelations(project);
}

function findById(id) {
  const db = getDb();
  const project = db
    .prepare(
      `SELECT p.*, l.name AS location_name, l.slug AS location_slug
       FROM projects p LEFT JOIN locations l ON l.id = p.location_id
       WHERE p.id = ?`
    )
    .get(id);
  return attachRelations(project);
}

function create(fields) {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO projects (slug, title, location_id, status, overview, property_type, is_published, is_demo_seed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      fields.slug,
      fields.title,
      fields.locationId || null,
      fields.status || "upcoming",
      fields.overview || null,
      fields.propertyType || null,
      fields.isPublished ? 1 : 0,
      fields.isDemoSeed ? 1 : 0
    );
  return findById(Number(result.lastInsertRowid));
}

function update(id, fields) {
  const db = getDb();
  db.prepare(
    `UPDATE projects SET
      slug = ?, title = ?, location_id = ?, status = ?, overview = ?, property_type = ?,
      is_published = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    fields.slug,
    fields.title,
    fields.locationId || null,
    fields.status || "upcoming",
    fields.overview || null,
    fields.propertyType || null,
    fields.isPublished ? 1 : 0,
    id
  );
  return findById(id);
}

function remove(id) {
  const db = getDb();
  db.prepare("DELETE FROM projects WHERE id = ?").run(id);
}

function addImage(projectId, { filePath, isPrimary = false, sortOrder = 0 }) {
  const db = getDb();
  if (isPrimary) {
    db.prepare("UPDATE project_images SET is_primary = 0 WHERE project_id = ?").run(projectId);
    db.prepare("UPDATE projects SET hero_image_path = ? WHERE id = ?").run(filePath, projectId);
  }
  db.prepare(
    "INSERT INTO project_images (project_id, file_path, is_primary, sort_order) VALUES (?, ?, ?, ?)"
  ).run(projectId, filePath, isPrimary ? 1 : 0, sortOrder);
}

function removeImage(imageId) {
  const db = getDb();
  const image = db.prepare("SELECT * FROM project_images WHERE id = ?").get(imageId);
  db.prepare("DELETE FROM project_images WHERE id = ?").run(imageId);
  if (image && image.file_path.startsWith("/media/")) {
    const diskPath = path.join(env.uploadsDir, image.file_path.replace("/media/", ""));
    fs.unlink(diskPath, () => {});
  }
}

function replaceFeatures(projectId, labels) {
  const db = getDb();
  db.prepare("DELETE FROM project_features WHERE project_id = ?").run(projectId);
  const insert = db.prepare(
    "INSERT INTO project_features (project_id, label, sort_order) VALUES (?, ?, ?)"
  );
  labels.forEach((label, index) => {
    if (label && label.trim()) {
      insert.run(projectId, label.trim(), index);
    }
  });
}

function replaceVerifiedFeatures(projectId, valuesByCategory) {
  const db = getDb();
  const upsert = db.prepare(
    `INSERT INTO project_verified_features (project_id, category, value) VALUES (?, ?, ?)
     ON CONFLICT (project_id, category) DO UPDATE SET value = excluded.value`
  );
  VERIFIED_FEATURE_CATEGORIES.forEach((category) => {
    const value = valuesByCategory[category];
    upsert.run(projectId, category, value && value.trim() ? value.trim() : null);
  });
}

function slugExists(slug, excludeId = null) {
  const db = getDb();
  const row = excludeId
    ? db.prepare("SELECT id FROM projects WHERE slug = ? AND id != ?").get(slug, excludeId)
    : db.prepare("SELECT id FROM projects WHERE slug = ?").get(slug);
  return Boolean(row);
}

module.exports = {
  findAll,
  findFeaturedPublished,
  findAllForAdmin,
  findBySlug,
  findById,
  create,
  update,
  remove,
  addImage,
  removeImage,
  replaceFeatures,
  replaceVerifiedFeatures,
  slugExists,
};
