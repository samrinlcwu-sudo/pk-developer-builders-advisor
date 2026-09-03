const session = require("express-session");
const { getDb } = require("../db/connection");

class SqliteSessionStore extends session.Store {
  constructor() {
    super();
    this.db = getDb();
  }

  get(sid, callback) {
    try {
      const row = this.db.prepare("SELECT sess, expires FROM sessions WHERE sid = ?").get(sid);
      if (!row) return callback(null, null);
      if (new Date(row.expires).getTime() < Date.now()) {
        this.db.prepare("DELETE FROM sessions WHERE sid = ?").run(sid);
        return callback(null, null);
      }
      callback(null, JSON.parse(row.sess));
    } catch (err) {
      callback(err);
    }
  }

  set(sid, sessionData, callback) {
    try {
      const maxAge = sessionData.cookie && sessionData.cookie.maxAge ? sessionData.cookie.maxAge : 86400000;
      const expires = new Date(Date.now() + maxAge).toISOString();
      const sess = JSON.stringify(sessionData);
      this.db
        .prepare(
          `INSERT INTO sessions (sid, sess, expires) VALUES (?, ?, ?)
           ON CONFLICT(sid) DO UPDATE SET sess = excluded.sess, expires = excluded.expires`
        )
        .run(sid, sess, expires);
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  destroy(sid, callback) {
    try {
      this.db.prepare("DELETE FROM sessions WHERE sid = ?").run(sid);
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  touch(sid, sessionData, callback) {
    this.set(sid, sessionData, callback);
  }
}

module.exports = { SqliteSessionStore };
