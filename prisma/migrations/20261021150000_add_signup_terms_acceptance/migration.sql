-- Do not assume that existing users have accepted these terms.
ALTER TABLE "User"
ADD COLUMN "termsAcceptedAt" TIMESTAMP(3),
ADD COLUMN "termsVersion" TEXT;
