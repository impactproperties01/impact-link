-- Unit tenants do not need a registered User or Lease to record rent.
ALTER TABLE "Payment" ALTER COLUMN "leaseId" DROP NOT NULL;
ALTER TABLE "Payment"
ADD COLUMN "unitId" TEXT,
ADD COLUMN "tenantName" TEXT,
ADD COLUMN "unitName" TEXT,
ADD COLUMN "requestId" TEXT;

CREATE UNIQUE INDEX "Payment_requestId_key" ON "Payment"("requestId");
CREATE INDEX "Payment_unitId_idx" ON "Payment"("unitId");
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_unitId_fkey"
FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Every payment has exactly one source; existing lease payments remain valid.
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_source_check"
CHECK (("leaseId" IS NOT NULL) <> ("unitId" IS NOT NULL));
