-- CreateEnum
CREATE TYPE "MediaUploadPurpose" AS ENUM ('MEMORY_MEDIA', 'PATIENT_PROFILE', 'PERSON_PROFILE', 'ALBUM_COVER', 'STORYBOOK_COVER');

-- CreateEnum
CREATE TYPE "MediaUploadStatus" AS ENUM ('PENDING', 'CONFIRMED', 'EXPIRED', 'FAILED');

-- AlterTable
ALTER TABLE "Media" ADD COLUMN "checksum" TEXT;

-- CreateTable
CREATE TABLE "MediaUpload" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "purpose" "MediaUploadPurpose" NOT NULL DEFAULT 'MEMORY_MEDIA',
    "declaredMimeType" TEXT NOT NULL,
    "declaredSizeBytes" INTEGER NOT NULL,
    "memoryId" TEXT,
    "targetId" TEXT,
    "status" "MediaUploadStatus" NOT NULL DEFAULT 'PENDING',
    "mediaId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaUpload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Media_storagePath_key" ON "Media"("storagePath");

-- CreateIndex
CREATE UNIQUE INDEX "MediaUpload_storagePath_key" ON "MediaUpload"("storagePath");

-- CreateIndex
CREATE UNIQUE INDEX "MediaUpload_mediaId_key" ON "MediaUpload"("mediaId");

-- CreateIndex
CREATE INDEX "MediaUpload_patientId_idx" ON "MediaUpload"("patientId");

-- CreateIndex
CREATE INDEX "MediaUpload_userId_idx" ON "MediaUpload"("userId");

-- CreateIndex
CREATE INDEX "MediaUpload_status_idx" ON "MediaUpload"("status");

-- CreateIndex
CREATE INDEX "MediaUpload_expiresAt_idx" ON "MediaUpload"("expiresAt");

-- AddForeignKey
ALTER TABLE "MediaUpload" ADD CONSTRAINT "MediaUpload_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaUpload" ADD CONSTRAINT "MediaUpload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaUpload" ADD CONSTRAINT "MediaUpload_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaUpload" ADD CONSTRAINT "MediaUpload_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

