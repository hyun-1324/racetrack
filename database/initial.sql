DROP TABLE IF EXISTS "sessions";
DROP TABLE IF EXISTS "race_mode";
DROP TABLE IF EXISTS "driver_car_assignments";
DROP TABLE IF EXISTS "lap_times";

CREATE TABLE "sessions" (
  "id" INTEGER PRIMARY KEY,
  "status" TEXT,
  "end_time" DATETIME
);

CREATE TABLE "race_mode" (
  "id" INTEGER PRIMARY KEY,
  "mode" TEXT
);

CREATE TABLE "driver_car_assignments" (
  "id" INTEGER PRIMARY KEY,
  "session_id" INTEGER,
  "car_num" INTEGER,
  "driver_name" TEXT,
  FOREIGN KEY("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE
);

CREATE TABLE "lap_times" (
  "id" INTEGER PRIMARY KEY,
  "session_id" INTEGER NOT NULL,
  "car_num" INTEGER NOT NULL,
  "lap_num" INTEGER NOT NULL,
  "lap_started" INTEGER NOT NULL,
  "fastest_lap" INTEGER NOT NULL,
  FOREIGN KEY("session_id") REFERENCES "sessions"("id")
);


INSERT INTO race_mode (id, mode) VALUES (1, 'danger');
