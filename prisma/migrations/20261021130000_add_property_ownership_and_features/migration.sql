-- Existing listings keep nulls until their ownership details and features are supplied.
CREATE TYPE "PropertyRelationship" AS ENUM ('DIRECT_OWNER', 'OTHER');

ALTER TABLE "Property"
ADD COLUMN "propertyRelationship" "PropertyRelationship",
ADD COLUMN "ownerRelationship" TEXT,
ADD COLUMN "directOwnerName" TEXT,
ADD COLUMN "directOwnerPhone" TEXT,
ADD COLUMN "directOwnerAddress" TEXT,
ADD COLUMN "features" TEXT;
