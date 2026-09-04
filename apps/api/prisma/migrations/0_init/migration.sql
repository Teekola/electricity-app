-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "electricitydata" (
    "id" BIGINT NOT NULL,
    "date" DATE,
    "starttime" TIMESTAMP(6),
    "productionamount" DECIMAL(11,5),
    "consumptionamount" DECIMAL(11,3),
    "hourlyprice" DECIMAL(6,3),

    CONSTRAINT "electricitydata_pkey" PRIMARY KEY ("id")
);

