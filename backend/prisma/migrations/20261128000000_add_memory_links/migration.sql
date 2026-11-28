-- CreateTable: curated directional links between two memories of a patient,
-- with a note explaining the connection (used by life-story narration).
CREATE TABLE "MemoryLink" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "fromMemoryId" TEXT NOT NULL,
    "toMemoryId" TEXT NOT NULL,
    "linkType" TEXT NOT NULL,
    "connectionNote" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemoryLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MemoryLink_fromMemoryId_toMemoryId_key" ON "MemoryLink"("fromMemoryId", "toMemoryId");
CREATE INDEX "MemoryLink_patientId_idx" ON "MemoryLink"("patientId");
CREATE INDEX "MemoryLink_fromMemoryId_idx" ON "MemoryLink"("fromMemoryId");
CREATE INDEX "MemoryLink_toMemoryId_idx" ON "MemoryLink"("toMemoryId");

-- AddForeignKey
ALTER TABLE "MemoryLink" ADD CONSTRAINT "MemoryLink_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemoryLink" ADD CONSTRAINT "MemoryLink_fromMemoryId_fkey" FOREIGN KEY ("fromMemoryId") REFERENCES "Memory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemoryLink" ADD CONSTRAINT "MemoryLink_toMemoryId_fkey" FOREIGN KEY ("toMemoryId") REFERENCES "Memory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
