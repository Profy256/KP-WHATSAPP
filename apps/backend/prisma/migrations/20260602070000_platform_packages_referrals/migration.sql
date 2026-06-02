-- Add referralCode as nullable first, populate, then make unique
ALTER TABLE "User" ADD COLUMN "referralCode" TEXT;
UPDATE "User" SET "referralCode" = gen_random_uuid()::text WHERE "referralCode" IS NULL;
ALTER TABLE "User" ALTER COLUMN "referralCode" SET NOT NULL;
ALTER TABLE "User" ADD CONSTRAINT "User_referralCode_key" UNIQUE ("referralCode");

-- Add selectedPackage to Business
ALTER TABLE "Business" ADD COLUMN "selectedPackage" TEXT NOT NULL DEFAULT 'WHATSAPP_BOT';

-- Create Referral table
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "refereeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_refereeId_key" UNIQUE ("refereeId");
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create PlatformConfig table
CREATE TABLE "PlatformConfig" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlatformConfig_pkey" PRIMARY KEY ("id")
);

-- Remove apiKey from AiConfig (no longer user-managed)
ALTER TABLE "AiConfig" DROP COLUMN IF EXISTS "provider";
ALTER TABLE "AiConfig" DROP COLUMN IF EXISTS "model";
ALTER TABLE "AiConfig" DROP COLUMN IF EXISTS "apiKey";
