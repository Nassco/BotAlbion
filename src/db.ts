import Database from "better-sqlite3";

const db = new Database("players.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    idAO TEXT NOT NULL,
    guildId TEXT NOT NULL,
    registeredAt TEXT DEFAULT CURRENT_TIMESTAMP,
    lastKill TEXT,
    lastDeath TEXT
  );
`);

export default db;
