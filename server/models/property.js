const fs = require("node:fs");
const path = require("node:path");
const { getDb } = require("../db/connection");
const env = require("../config/env");

const SORTS = {
  newest: "p.created_at DESC",
  price_asc: "p.price ASC",
  price_desc: "p.price DESC",
};

function buildFilterClause(filters) {
  const where = [];
  const params = [];

  if (filters.publishedOnly) {
    where.push("p.is_published = 1");
  }
  if (filters.type) {
    where.push("p.type = ?");
    params.push(filters.type);
  }
  if (filters.status) {
    where.push("p.status = ?");
    params.push(filters.status);
  }
  if (filters.location) {
    where.push("l.slug = ?");
    params.push(filters.location);
  }
  if (filters.minPrice != null) {
    where.push("p.price >= ?");
    params.push(filters.minPrice);
  }
  if (filters.maxPrice != null) {
    where.push("p.price <= ?");
    params.push(filters.maxPrice);
  }
  if (filters.minArea != null) {
    where.push("p.area_sqft >= ?");
    params.push(filters.minArea);
  }
  if (filters.maxArea != null) {
    where.push("p.area_sqft <= ?");
    params.push(filters.maxArea);
  }
  if (filters.bedrooms != null) {
    where.push("p.bedrooms >= ?");
    params.push(filters.bedrooms);
  }
  if (filters.bathrooms != null) {
    where.push("p.bathrooms >= ?");
    params.push(filters.bathrooms);
  }

  return { whereSql: where.length ? `WHERE ${where.join(" AND ")}` : "", params };
}

function findAll(filters = {}) {
  const db = getDb();
  const { whereSql, params } = buildFilterClause(filters);
  const sortSql = SORTS[filters.sort] || SORTS.newest;
  const page = Math.max(1, Number(filters.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(filters.pageSize) || 12));
  const offset = (page - 1) * pageSize;

  const totalRow = db
    .prepare(
      `SELECT COUNT(*) AS n FROM properties p LEFT JOIN locations l ON l.id = p.location_id ${whereSql}`
    )
    .get(...params);

  const rows = db
    .prepare(
      `SELECT p.*, l.name AS location_name, l.slug AS location_slug
       FROM properties p LEFT JOIN locations l ON l.id = p.location_id
       ${whereSql}
       ORDER BY ${sortSql}
       LIMIT ? OFFSET ?`
    )
    .all(...params, pageSize, offset);

  if (rows.length) {
    const ids = rows.map((r) => r.id);
    const placeholders = ids.map(() => "?").join(",");
    const images = db
      .prepare(
        `SELECT * FROM property_images WHERE property_id IN (${placeholders}) ORDER BY property_id, sort_order, id`
      )
      .all(...ids);
    const imagesByProperty = new Map();
    for (const image of images) {
      if (!imagesByProperty.has(image.property_id)) imagesByProperty.set(image.property_id, []);
      imagesByProperty.get(image.property_id).push(image);
    }
    for (const row of rows) {
      row.images = imagesByProperty.get(row.id) || [];
    }
  }

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

function findAllForAdmin() {
  const db = getDb();
  return db
    .prepare(
      `SELECT p.*, l.name AS location_name
       FROM properties p LEFT JOIN locations l ON l.id = p.location_id
       ORDER BY p.created_at DESC`
    )
    .all();
}

function attachRelations(property) {
  if (!property) return property;
  const db = getDb();
  property.images = db
    .prepare("SELECT * FROM property_images WHERE property_id = ? ORDER BY sort_order, id")
    .all(property.id);
  property.features = db
    .prepare("SELECT * FROM property_features WHERE property_id = ? ORDER BY sort_order, id")
    .all(property.id);
  if (property.agent_id) {
    property.agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(property.agent_id);
  }
  return property;
}

function findBySlug(slug, { publishedOnly = false } = {}) {
  const db = getDb();
  const sql = `SELECT p.*, l.name AS location_name, l.slug AS location_slug
               FROM properties p LEFT JOIN locations l ON l.id = p.location_id
               WHERE p.slug = ? ${publishedOnly ? "AND p.is_published = 1" : ""}`;
  const property = db.prepare(sql).get(slug);
  return attachRelations(property);
}

function findById(id) {
  const db = getDb();
  const property = db
    .prepare(
      `SELECT p.*, l.name AS location_name, l.slug AS location_slug
       FROM properties p LEFT JOIN locations l ON l.id = p.location_id
       WHERE p.id = ?`
    )
    .get(id);
  return attachRelations(property);
}

function create(fields) {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO properties
        (slug, title, type, status, location_id, price, price_currency, area_sqft,
         bedrooms, bathrooms, description, map_embed_url, agent_id, is_published, is_demo_seed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      fields.slug,
      fields.title,
      fields.type,
      fields.status || "available",
      fields.locationId || null,
      fields.price ?? null,
      fields.priceCurrency || "PKR",
      fields.areaSqft ?? null,
      fields.bedrooms ?? null,
      fields.bathrooms ?? null,
      fields.description || null,
      fields.mapEmbedUrl || null,
      fields.agentId || null,
      fields.isPublished ? 1 : 0,
      fields.isDemoSeed ? 1 : 0
    );
  return findById(Number(result.lastInsertRowid));
}

function update(id, fields) {
  const db = getDb();
  db.prepare(
    `UPDATE properties SET
      slug = ?, title = ?, type = ?, status = ?, location_id = ?, price = ?, price_currency = ?,
      area_sqft = ?, bedrooms = ?, bathrooms = ?, description = ?, map_embed_url = ?, agent_id = ?,
      is_published = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    fields.slug,
    fields.title,
    fields.type,
    fields.status || "available",
    fields.locationId || null,
    fields.price ?? null,
    fields.priceCurrency || "PKR",
    fields.areaSqft ?? null,
    fields.bedrooms ?? null,
    fields.bathrooms ?? null,
    fields.description || null,
    fields.mapEmbedUrl || null,
    fields.agentId || null,
    fields.isPublished ? 1 : 0,
    id
  );
  return findById(id);
}

function remove(id) {
  const db = getDb();
  db.prepare("DELETE FROM properties WHERE id = ?").run(id);
}

function addImage(propertyId, { filePath, isPrimary = false, sortOrder = 0 }) {
  const db = getDb();
  if (isPrimary) {
    db.prepare("UPDATE property_images SET is_primary = 0 WHERE property_id = ?").run(propertyId);
  }
  db.prepare(
    "INSERT INTO property_images (property_id, file_path, is_primary, sort_order) VALUES (?, ?, ?, ?)"
  ).run(propertyId, filePath, isPrimary ? 1 : 0, sortOrder);
}

function removeImage(imageId) {
  const db = getDb();
  const image = db.prepare("SELECT * FROM property_images WHERE id = ?").get(imageId);
  db.prepare("DELETE FROM property_images WHERE id = ?").run(imageId);
  if (image && image.file_path.startsWith("/media/")) {
    const diskPath = path.join(env.uploadsDir, image.file_path.replace("/media/", ""));
    fs.unlink(diskPath, () => {});
  }
}

function replaceFeatures(propertyId, labels) {
  const db = getDb();
  db.prepare("DELETE FROM property_features WHERE property_id = ?").run(propertyId);
  const insert = db.prepare(
    "INSERT INTO property_features (property_id, label, sort_order) VALUES (?, ?, ?)"
  );
  labels.forEach((label, index) => {
    if (label && label.trim()) {
      insert.run(propertyId, label.trim(), index);
    }
  });
}

function slugExists(slug, excludeId = null) {
  const db = getDb();
  const row = excludeId
    ? db.prepare("SELECT id FROM properties WHERE slug = ? AND id != ?").get(slug, excludeId)
    : db.prepare("SELECT id FROM properties WHERE slug = ?").get(slug);
  return Boolean(row);
}

module.exports = {
  findAll,
  findAllForAdmin,
  findBySlug,
  findById,
  create,
  update,
  remove,
  addImage,
  removeImage,
  replaceFeatures,
  slugExists,
};
