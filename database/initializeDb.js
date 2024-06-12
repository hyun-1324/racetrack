import sqlite3 from "sqlite3";
import sqlite from "sqlite";
import fs from "node:fs";
import { join, dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function initializeDb() {
  const db = await sqlite.open({
    filename: join(__dirname, "database", "database.db"),
    driver: sqlite3.Database,
  });

  const sqlFilePath = join(__dirname, "database", "initial.sql");
  fs.readFileSync(sqlFilePath, "utf-8", (err, schema) => {
    if (err) {
      console.error("Error reading SQL schema:", err.message);
      return;
    }

    db.exec(schema, (err) => {
      if (err) {
        console.error("Error applying SQL schema:", err.message);
      } else {
        console.log("SQL schema applied successfully.");
      }
    });
  });
  return db;
}
