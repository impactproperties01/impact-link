ALTER TABLE "User"
ADD COLUMN "stateOfOrigin" TEXT,
ADD COLUMN "lga" TEXT,
ADD COLUMN "nextOfKinName" TEXT,
ADD COLUMN "nextOfKinPhone" TEXT;

ALTER TABLE "Property"
ADD COLUMN "declarationAcceptedAt" TIMESTAMP(3),
ADD COLUMN "declarationText" TEXT;
