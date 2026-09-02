-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "driver_profiles" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "certLevel" TEXT NOT NULL DEFAULT 'CD',
    "certStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "validUntil" DATETIME,
    "licenseNo" TEXT,
    "joinedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accidentFree" TEXT,
    "englishLevel" TEXT,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "currentVehicleId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    CONSTRAINT "driver_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "driver_profiles_currentVehicleId_fkey" FOREIGN KEY ("currentVehicleId") REFERENCES "vehicles" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "passenger_profiles" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "department" TEXT NOT NULL,
    CONSTRAINT "passenger_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plate" TEXT NOT NULL,
    "qrValue" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE'
);

-- CreateTable
CREATE TABLE "transport_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "passengerId" TEXT NOT NULL,
    "driverId" TEXT,
    "vehicleId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "pickup" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "time" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "transport_requests_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "passenger_profiles" ("userId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transport_requests_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "driver_profiles" ("userId") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transport_requests_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "driverId" TEXT NOT NULL,
    "written" REAL NOT NULL DEFAULT 0,
    "practical" TEXT NOT NULL DEFAULT '{}',
    "operational" TEXT NOT NULL DEFAULT '{}',
    "feedbackAvg" REAL NOT NULL DEFAULT 0,
    "overallScore" REAL NOT NULL DEFAULT 0,
    "certLevel" TEXT NOT NULL DEFAULT 'CD',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "assessments_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "driver_profiles" ("userId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "feedbacks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "feedbacks_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "transport_requests" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "feedbacks_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "passenger_profiles" ("userId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "feedbacks_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "driver_profiles" ("userId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "feedbacks_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vehicle_checkins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "checkInLocation" TEXT,
    "checkInTime" DATETIME,
    "checkInRemark" TEXT,
    "checkOutLocation" TEXT,
    "checkOutTime" DATETIME,
    "checkOutRemark" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CHECKED_IN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vehicle_checkins_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "vehicle_checkins_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "driver_profiles" ("userId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "vehicle_checkins_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "transport_requests" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipientId" TEXT NOT NULL,
    "recipientRole" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "relatedRequestId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_relatedRequestId_fkey" FOREIGN KEY ("relatedRequestId") REFERENCES "transport_requests" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "writtenWeight" REAL NOT NULL DEFAULT 0.2,
    "practicalWeight" REAL NOT NULL DEFAULT 0.3,
    "operationalWeight" REAL NOT NULL DEFAULT 0.3,
    "feedbackWeight" REAL NOT NULL DEFAULT 0.2,
    "passMarks" TEXT NOT NULL DEFAULT '{"CD":75,"CC":80,"CPC":85,"CEC":88,"CMC":90}',
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plate_key" ON "vehicles"("plate");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_qrValue_key" ON "vehicles"("qrValue");

-- CreateIndex
CREATE UNIQUE INDEX "feedbacks_requestId_key" ON "feedbacks"("requestId");
