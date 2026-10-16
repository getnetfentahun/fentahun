ALTER TABLE "Attendance"
ADD COLUMN "attendanceDate" DATE;

UPDATE "Attendance"
SET "attendanceDate" = ("checkIn" AT TIME ZONE 'UTC')::date;

ALTER TABLE "Attendance"
ALTER COLUMN "attendanceDate" SET NOT NULL;

CREATE UNIQUE INDEX "Attendance_employeeId_attendanceDate_key"
ON "Attendance"("employeeId", "attendanceDate");
