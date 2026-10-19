-- Existing listings retain null inspection contacts until details are provided.
CREATE TYPE "InspectionContactType" AS ENUM ('OWNER', 'CUSTOM');

ALTER TABLE "Property"
ADD COLUMN "inspectionContactType" "InspectionContactType",
ADD COLUMN "inspectionContactName" TEXT,
ADD COLUMN "inspectionContactPhone" TEXT;
