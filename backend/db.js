const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(path.join(DB_DIR, '4wcycle.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    title       TEXT NOT NULL,
    route       TEXT NOT NULL,
    experience  TEXT NOT NULL,
    photos      TEXT DEFAULT '[]',
    status      TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
    admin_note  TEXT DEFAULT '',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

module.exports = db;
