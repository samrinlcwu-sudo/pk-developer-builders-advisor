CREATE TABLE articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('real-estate', 'investment', 'construction', 'development', 'market-insights', 'guides')),
  author_name TEXT,
  excerpt TEXT,
  body TEXT,
  cover_image_path TEXT,
  is_featured INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  is_published INTEGER NOT NULL DEFAULT 0,
  is_demo_seed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_published ON articles(is_published);
