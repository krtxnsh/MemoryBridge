-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CAREGIVER', 'FAMILY_MEMBER');

-- CreateEnum
CREATE TYPE "AccessRole" AS ENUM ('OWNER', 'CAREGIVER', 'FAMILY', 'VIEWER');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'AI_SUGGESTED');

-- CreateEnum
CREATE TYPE "MemorySource" AS ENUM ('FAMILY_SUBMITTED', 'CAREGIVER', 'AI_DRAFTED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO');

-- CreateEnum
CREATE TYPE "StorybookStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "RoutinePeriod" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');

-- CreateEnum
CREATE TYPE "RoutineCategory" AS ENUM ('ACTIVITY', 'MEAL', 'MEDICATION', 'FAMILY_CALL', 'WALK');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('ACTIVE', 'DISMISSED');

-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('USER', 'COMPANION');

-- CreateEnum
CREATE TYPE "EmbeddingStatus" AS ENUM ('NONE', 'PENDING', 'READY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'FAMILY_MEMBER',
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientProfile" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "profileImage" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "biography" TEXT,
    "personId" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "accessRole" "AccessRole" NOT NULL DEFAULT 'FAMILY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Memory" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "albumId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "story" TEXT NOT NULL,
    "audioDescription" TEXT,
    "eventDate" TIMESTAMP(3),
    "approximateYear" INTEGER,
    "location" TEXT,
    "eventType" TEXT,
    "era" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source" "MemorySource" NOT NULL DEFAULT 'FAMILY_SUBMITTED',
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "songId" TEXT,
    "mapX" DOUBLE PRECISION,
    "mapY" DOUBLE PRECISION,
    "mapLabel" TEXT,
    "contentHash" TEXT,
    "embeddingStatus" "EmbeddingStatus" NOT NULL DEFAULT 'NONE',
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Memory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Album" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "coverImage" TEXT,
    "colorTheme" TEXT NOT NULL DEFAULT 'amber',
    "yearRange" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "biography" TEXT,
    "birthYear" INTEGER,
    "profileImage" TEXT,
    "confirmedByFamily" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Relationship" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "personOneId" TEXT NOT NULL,
    "personTwoId" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Relationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoryPeople" (
    "memoryId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,

    CONSTRAINT "MemoryPeople_pkey" PRIMARY KEY ("memoryId","personId")
);

-- CreateTable
CREATE TABLE "Storybook" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "generatedStory" TEXT,
    "status" "StorybookStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Storybook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorybookMemories" (
    "id" TEXT NOT NULL,
    "storybookId" TEXT NOT NULL,
    "memoryId" TEXT NOT NULL,
    "sequenceOrder" INTEGER NOT NULL,

    CONSTRAINT "StorybookMemories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "memoryId" TEXT NOT NULL,
    "verifiedById" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "memoryId" TEXT,
    "mediaType" "MediaType" NOT NULL,
    "storagePath" TEXT NOT NULL,
    "thumbnailPath" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "caption" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineItem" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scheduledTime" TEXT NOT NULL,
    "period" "RoutinePeriod" NOT NULL,
    "category" "RoutineCategory" NOT NULL,
    "notes" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "reminderStatus" "ReminderStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoutineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiaryEntry" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "weather" TEXT NOT NULL,
    "greeting" TEXT NOT NULL,
    "morningNote" TEXT NOT NULL,
    "afternoonNote" TEXT NOT NULL,
    "eveningNote" TEXT NOT NULL,
    "caregiverSign" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiaryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "userId" TEXT,
    "patientSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderType" "SenderType" NOT NULL,
    "messageText" TEXT NOT NULL,
    "relatedMemoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientSession" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientPairingCode" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientPairingCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "patientId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_family_idx" ON "RefreshToken"("family");

-- CreateIndex
CREATE UNIQUE INDEX "PatientProfile_personId_key" ON "PatientProfile"("personId");

-- CreateIndex
CREATE INDEX "PatientProfile_fullName_idx" ON "PatientProfile"("fullName");

-- CreateIndex
CREATE INDEX "PatientProfile_isDemo_idx" ON "PatientProfile"("isDemo");

-- CreateIndex
CREATE INDEX "PatientAccess_userId_idx" ON "PatientAccess"("userId");

-- CreateIndex
CREATE INDEX "PatientAccess_patientId_idx" ON "PatientAccess"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientAccess_userId_patientId_key" ON "PatientAccess"("userId", "patientId");

-- CreateIndex
CREATE INDEX "Memory_patientId_idx" ON "Memory"("patientId");

-- CreateIndex
CREATE INDEX "Memory_patientId_verificationStatus_idx" ON "Memory"("patientId", "verificationStatus");

-- CreateIndex
CREATE INDEX "Memory_albumId_idx" ON "Memory"("albumId");

-- CreateIndex
CREATE INDEX "Memory_approximateYear_idx" ON "Memory"("approximateYear");

-- CreateIndex
CREATE INDEX "Memory_era_idx" ON "Memory"("era");

-- CreateIndex
CREATE INDEX "Memory_createdBy_idx" ON "Memory"("createdBy");

-- CreateIndex
CREATE INDEX "Memory_approvedById_idx" ON "Memory"("approvedById");

-- CreateIndex
CREATE INDEX "Album_patientId_idx" ON "Album"("patientId");

-- CreateIndex
CREATE INDEX "Person_patientId_idx" ON "Person"("patientId");

-- CreateIndex
CREATE INDEX "Relationship_patientId_idx" ON "Relationship"("patientId");

-- CreateIndex
CREATE INDEX "Relationship_personOneId_idx" ON "Relationship"("personOneId");

-- CreateIndex
CREATE INDEX "Relationship_personTwoId_idx" ON "Relationship"("personTwoId");

-- CreateIndex
CREATE UNIQUE INDEX "Relationship_patientId_personOneId_personTwoId_relationship_key" ON "Relationship"("patientId", "personOneId", "personTwoId", "relationshipType");

-- CreateIndex
CREATE INDEX "MemoryPeople_memoryId_idx" ON "MemoryPeople"("memoryId");

-- CreateIndex
CREATE INDEX "MemoryPeople_personId_idx" ON "MemoryPeople"("personId");

-- CreateIndex
CREATE INDEX "Storybook_patientId_idx" ON "Storybook"("patientId");

-- CreateIndex
CREATE INDEX "Storybook_createdBy_idx" ON "Storybook"("createdBy");

-- CreateIndex
CREATE INDEX "StorybookMemories_storybookId_idx" ON "StorybookMemories"("storybookId");

-- CreateIndex
CREATE INDEX "StorybookMemories_memoryId_idx" ON "StorybookMemories"("memoryId");

-- CreateIndex
CREATE UNIQUE INDEX "StorybookMemories_storybookId_sequenceOrder_key" ON "StorybookMemories"("storybookId", "sequenceOrder");

-- CreateIndex
CREATE INDEX "Verification_memoryId_idx" ON "Verification"("memoryId");

-- CreateIndex
CREATE INDEX "Verification_verifiedById_idx" ON "Verification"("verifiedById");

-- CreateIndex
CREATE INDEX "Media_patientId_idx" ON "Media"("patientId");

-- CreateIndex
CREATE INDEX "Media_memoryId_idx" ON "Media"("memoryId");

-- CreateIndex
CREATE INDEX "Media_uploadedBy_idx" ON "Media"("uploadedBy");

-- CreateIndex
CREATE INDEX "RoutineItem_patientId_idx" ON "RoutineItem"("patientId");

-- CreateIndex
CREATE INDEX "DiaryEntry_patientId_idx" ON "DiaryEntry"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "DiaryEntry_patientId_date_key" ON "DiaryEntry"("patientId", "date");

-- CreateIndex
CREATE INDEX "Conversation_patientId_idx" ON "Conversation"("patientId");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_relatedMemoryId_idx" ON "Message"("relatedMemoryId");

-- CreateIndex
CREATE INDEX "PatientSession_patientId_idx" ON "PatientSession"("patientId");

-- CreateIndex
CREATE INDEX "PatientSession_expiresAt_idx" ON "PatientSession"("expiresAt");

-- CreateIndex
CREATE INDEX "PatientSession_createdBy_idx" ON "PatientSession"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "PatientPairingCode_codeHash_key" ON "PatientPairingCode"("codeHash");

-- CreateIndex
CREATE INDEX "PatientPairingCode_patientId_idx" ON "PatientPairingCode"("patientId");

-- CreateIndex
CREATE INDEX "PatientPairingCode_expiresAt_idx" ON "PatientPairingCode"("expiresAt");

-- CreateIndex
CREATE INDEX "PatientPairingCode_createdBy_idx" ON "PatientPairingCode"("createdBy");

-- CreateIndex
CREATE INDEX "AuditLog_patientId_idx" ON "AuditLog"("patientId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientProfile" ADD CONSTRAINT "PatientProfile_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAccess" ADD CONSTRAINT "PatientAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAccess" ADD CONSTRAINT "PatientAccess_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memory" ADD CONSTRAINT "Memory_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memory" ADD CONSTRAINT "Memory_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memory" ADD CONSTRAINT "Memory_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memory" ADD CONSTRAINT "Memory_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Album" ADD CONSTRAINT "Album_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_personOneId_fkey" FOREIGN KEY ("personOneId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_personTwoId_fkey" FOREIGN KEY ("personTwoId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryPeople" ADD CONSTRAINT "MemoryPeople_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryPeople" ADD CONSTRAINT "MemoryPeople_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Storybook" ADD CONSTRAINT "Storybook_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Storybook" ADD CONSTRAINT "Storybook_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorybookMemories" ADD CONSTRAINT "StorybookMemories_storybookId_fkey" FOREIGN KEY ("storybookId") REFERENCES "Storybook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorybookMemories" ADD CONSTRAINT "StorybookMemories_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineItem" ADD CONSTRAINT "RoutineItem_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaryEntry" ADD CONSTRAINT "DiaryEntry_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_relatedMemoryId_fkey" FOREIGN KEY ("relatedMemoryId") REFERENCES "Memory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientSession" ADD CONSTRAINT "PatientSession_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientSession" ADD CONSTRAINT "PatientSession_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientPairingCode" ADD CONSTRAINT "PatientPairingCode_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientPairingCode" ADD CONSTRAINT "PatientPairingCode_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

