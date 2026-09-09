-- AlterTable
ALTER TABLE "transport_requests" ADD COLUMN "noOfPeople" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "transport_requests" ADD COLUMN "wayUsers" TEXT;
ALTER TABLE "transport_requests" ADD COLUMN "section" TEXT;
ALTER TABLE "transport_requests" ADD COLUMN "serviceType" TEXT;
ALTER TABLE "transport_requests" ADD COLUMN "purpose" TEXT;
ALTER TABLE "transport_requests" ADD COLUMN "returnTime" TEXT;
ALTER TABLE "transport_requests" ADD COLUMN "note" TEXT;
