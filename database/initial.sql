CREATE TABLE "sessions" (
  "id" INTEGER PRIMARY KEY,
  "status", TEXT,
  "endTime" DATETIME
);


CREATE TABLE "driver_car_assignments" (
  "id" INTEGER PRIMARY KEY,
  "session_id" INTEGER,
  "car_num" INTEGER,
  "driver_name" TEXT,
  FOREIGN KEY("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE,
  UNIQUE("session_id", "driver_name"),
  UNIQUE("session_id", "car_num")
);

CREATE TABLE "lap_times" (
  "id" INTEGER PRIMARY KEY,
  "session_id" INTEGER NOT NULL,
  "car_num" INTEGER NOT NULL,
  "lap_number" INTEGER NOT NULL,
  "lap_time" DECIMAL(10, 3) NOT NULL,
  FOREIGN KEY("session_id") REFERENCES "sessions"("id")
);
