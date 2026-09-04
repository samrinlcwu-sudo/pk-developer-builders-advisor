-- SQLite has no ALTER TABLE ... ADD CHECK, so widening the enquiries.type
-- CHECK constraint to include 'chatbot' means rebuilding the table.
CREATE TABLE enquiries_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK (type IN ('consultation', 'property-info', 'project-info', 'viewing', 'advisory', 'contact', 'whatsapp-click', 'chatbot')),
  name TEXT,
  phone TEXT,
  email TEXT,
  message TEXT,
  interest TEXT,
  property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  source_page TEXT,
  status TEXT NOT NULL CHECK (status IN ('new', 'contacted', 'qualified', 'closed')) DEFAULT 'new',
  notified_at TEXT,
  notify_error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO enquiries_new SELECT * FROM enquiries;
DROP TABLE enquiries;
ALTER TABLE enquiries_new RENAME TO enquiries;

CREATE INDEX idx_enquiries_status ON enquiries(status);
CREATE INDEX idx_enquiries_created ON enquiries(created_at);
