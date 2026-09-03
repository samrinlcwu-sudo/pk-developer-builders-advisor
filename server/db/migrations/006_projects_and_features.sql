CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('upcoming', 'ongoing', 'completed', 'available')) DEFAULT 'upcoming',
  hero_image_path TEXT,
  overview TEXT,
  property_type TEXT,
  is_published INTEGER NOT NULL DEFAULT 0,
  is_demo_seed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_published ON projects(is_published);

CREATE TABLE project_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_project_images_project ON project_images(project_id);

CREATE TABLE project_features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_project_features_project ON project_features(project_id);

CREATE TABLE project_verified_features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('architecture', 'security', 'parking', 'landscaping')),
  value TEXT,
  UNIQUE (project_id, category)
);
