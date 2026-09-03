const { DatabaseSync } = require("node:sqlite");
const env = require("../config/env");

let db = null;

function getDb() {
  if (!db) {
    db = new DatabaseSync(env.dbPath);
    db.exec("PRAGMA foreign_keys = ON;");
    db.exec("PRAGMA journal_mode = WAL;");
  }
  return db;
}

module.exports = { getDb };
