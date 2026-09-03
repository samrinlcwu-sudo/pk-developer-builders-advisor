CREATE TABLE enquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK (type IN ('consultation', 'property-info', 'project-info', 'viewing', 'advisory', 'contact', 'whatsapp-click')),
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

CREATE INDEX idx_enquiries_status ON enquiries(status);
CREATE INDEX idx_enquiries_created ON enquiries(created_at);
