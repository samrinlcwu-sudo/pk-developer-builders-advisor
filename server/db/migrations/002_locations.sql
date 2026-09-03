CREATE TABLE locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  city TEXT,
  region TEXT,
  description TEXT,
  image_path TEXT,
  is_published INTEGER NOT NULL DEFAULT 0,
  is_demo_seed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX idx_locations_slug ON locations(slug);
