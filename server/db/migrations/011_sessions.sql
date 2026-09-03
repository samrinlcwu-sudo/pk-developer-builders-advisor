CREATE TABLE sessions (
  sid TEXT PRIMARY KEY,
  sess TEXT NOT NULL,
  expires TEXT NOT NULL
);

CREATE INDEX idx_sessions_expires ON sessions(expires);
