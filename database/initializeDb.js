import sqlite3 from "sqlite3";
import { open } from "sqlite";
import fs from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from 'node:url';

export async function initializeDb() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  let db;
  try {
    db = await open({
      filename: join(__dirname, "database.db"),
      driver: sqlite3.Database,
    });
  } catch (err) {
    err.message = ("Error opening database:", err.message);
    throw new Error(err);
  }

  const sqlFilePath = join(__dirname, "initial.sql");
  let schema;
  try {
    schema = fs.readFileSync(sqlFilePath, "utf-8");
  } catch (err) {
    err.message = ("Error reading SQL schema:", err.message);
    throw new Error(err);
  }

try {
    // Create metadata table to database if it doesn't exist
    const result = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='metadata';");
    if (!result || !result.name) {
      await db.run("CREATE TABLE metadata (schemaApplied INTEGER);");
    }

    // If schema is not applied, apply it
    const schemaResult = await db.get("SELECT schemaApplied FROM metadata LIMIT 1;");
    if (!schemaResult || !schemaResult.schemaApplied) {
      await db.exec(schema);
      // Update the metadata table
      await db.run("INSERT INTO metadata (schemaApplied) VALUES (1);");
    }
  } catch (err) {
    err.message = ("Error applying SQL schema:", err.message);
    throw new Error(err);
  }

  return db;
}
