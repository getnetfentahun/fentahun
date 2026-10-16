CREATE TYPE "DepartmentStatus" AS ENUM ('ACTIVE', 'INACTIVE');

ALTER TABLE "Department"
ADD COLUMN "head" TEXT NOT NULL DEFAULT '',
ADD COLUMN "status" "DepartmentStatus" NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE "Employee"
ADD COLUMN "location" TEXT;
