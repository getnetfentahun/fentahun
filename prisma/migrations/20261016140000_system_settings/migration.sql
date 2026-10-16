CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Addis_Ababa',
    "reportDefaultDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);
