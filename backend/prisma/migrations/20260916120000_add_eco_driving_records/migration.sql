-- CreateTable
CREATE TABLE "eco_driving_records" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "violationType" TEXT NOT NULL,
    "violationValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "penaltyPoints" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rank" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "duration" DOUBLE PRECISION,
    "mileage" DOUBLE PRECISION,
    "avgSpeed" DOUBLE PRECISION,
    "tripDuration" DOUBLE PRECISION,
    "engineHoursDuration" DOUBLE PRECISION,
    "date" TIMESTAMP(3) NOT NULL,
    "syncDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "netprosUnitId" TEXT,

    CONSTRAINT "eco_driving_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "eco_driving_records_vehicleId_violationType_date_key" ON "eco_driving_records"("vehicleId", "violationType", "date");

-- AddForeignKey
ALTER TABLE "eco_driving_records" ADD CONSTRAINT "eco_driving_records_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "driver_profiles"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eco_driving_records" ADD CONSTRAINT "eco_driving_records_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
