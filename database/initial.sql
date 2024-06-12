CREATE TABLE "sessions" (
  "id" INTEGER PRIMARY KEY,
  "current_mode" TEXT,
  "endTime" DATETIME
);

CREATE TABLE "cars" (
  "id" INTEGER PRIMARY KEY,
  "car_number" INTEGER NOT NULL UNIQUE
);

CREATE TABLE "driver_car_assignments" (
  "id" INTEGER PRIMARY KEY,
  "session_id" INTEGER,
  "car_id" INTEGER,
  "driver_name" TEXT,
  FOREIGN KEY("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE,
  FOREIGN KEY("car_id") REFERENCES "cars"("id"),
  UNIQUE("session_id", "driver_name"),
  UNIQUE("session_id", "car_id")
);

CREATE TABLE "lap_times" (
  "id" INTEGER PRIMARY KEY,
  "session_id" INTEGER NOT NULL,
  "car_id" INTEGER NOT NULL,
  "lap_number" INTEGER NOT NULL,
  "lap_time" DECIMAL(10, 3) NOT NULL,
  FOREIGN KEY("session_id") REFERENCES "sessions"("id"),
  FOREIGN KEY("car_id") REFERENCES "cars"("id")
);

INSERT INTO cars (car_number) VALUES (1), (2), (3), (4), (5), (6), (7), (8);

