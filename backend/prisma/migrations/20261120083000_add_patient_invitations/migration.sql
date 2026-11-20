CREATE TABLE "PatientInvitation" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "accessRole" "AccessRole" NOT NULL DEFAULT 'FAMILY',
    "relationship" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "redeemedAt" TIMESTAMP(3),
    "redeemedBy" TEXT,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PatientInvitation_codeHash_key" ON "PatientInvitation"("codeHash");
CREATE INDEX "PatientInvitation_patientId_idx" ON "PatientInvitation"("patientId");
CREATE INDEX "PatientInvitation_createdBy_idx" ON "PatientInvitation"("createdBy");
CREATE INDEX "PatientInvitation_expiresAt_idx" ON "PatientInvitation"("expiresAt");
CREATE INDEX "PatientInvitation_redeemedBy_idx" ON "PatientInvitation"("redeemedBy");

ALTER TABLE "PatientInvitation"
ADD CONSTRAINT "PatientInvitation_patientId_fkey"
FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PatientInvitation"
ADD CONSTRAINT "PatientInvitation_createdBy_fkey"
FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PatientInvitation"
ADD CONSTRAINT "PatientInvitation_redeemedBy_fkey"
FOREIGN KEY ("redeemedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
