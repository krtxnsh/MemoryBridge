-- CreateEnum
CREATE TYPE "AiDescriptionStatus" AS ENUM ('NONE', 'AI_SUGGESTED', 'APPROVED', 'REJECTED');

-- AlterTable: caregiver-reviewed AI image descriptions (stored separately from
-- the family-entered caption; not patient-visible until APPROVED).
ALTER TABLE "Media"
  ADD COLUMN "aiDescription" TEXT,
  ADD COLUMN "aiDescriptionStatus" "AiDescriptionStatus" NOT NULL DEFAULT 'NONE',
  ADD COLUMN "aiDescriptionProvider" TEXT,
  ADD COLUMN "aiDescriptionModel" TEXT,
  ADD COLUMN "aiDescriptionGeneratedAt" TIMESTAMP(3),
  ADD COLUMN "aiDescriptionApprovedById" TEXT,
  ADD COLUMN "aiDescriptionApprovedAt" TIMESTAMP(3);
