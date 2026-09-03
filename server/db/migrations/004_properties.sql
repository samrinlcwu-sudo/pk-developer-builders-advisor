CREATE TABLE properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('residential', 'commercial', 'plot', 'house', 'apartment', 'office', 'shop')),
  status TEXT NOT NULL CHECK (status IN ('available', 'under-offer', 'sold', 'rented')) DEFAULT 'available',
  location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
  price REAL,
  price_currency TEXT DEFAULT 'PKR',
  area_sqft REAL,
  bedrooms INTEGER,
  bathrooms INTEGER,
  description TEXT,
  map_embed_url TEXT,
  agent_id INTEGER REFERENCES agents(id) ON DELETE SET NULL,
  is_published INTEGER NOT NULL DEFAULT 0,
  is_demo_seed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX idx_properties_slug ON properties(slug);
CREATE INDEX idx_properties_type ON properties(type);
CREATE INDEX idx_properties_location ON properties(location_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_published ON properties(is_published);
