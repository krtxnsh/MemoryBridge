import {
  PrismaClient,
  UserRole,
  AccessRole,
  VerificationStatus,
  MemorySource,
  RoutinePeriod,
  RoutineCategory,
  ReminderStatus
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import { embeddingService } from '../src/services/embedding.service.js';
// The embedding service uses the app's shared (config) Prisma client; disconnect
// it too so the seed process exits cleanly instead of hanging on open handles.
import { prisma as enginePrisma } from '../src/config/prisma.js';
import {  // seed data
  PATIENT,
  PEOPLE,
  RELATIONSHIPS,
  ALBUMS,
  MEMORIES,
  LINKS
} from './seed-data.js';

const prisma = new PrismaClient();

async function main() {
  // Guard: Never run in production
  if (process.env.NODE_ENV === 'production') {
    console.error('ERROR: Seed script is strictly forbidden from running in production.');
    process.exit(1);
  }

  console.log('--- Starting MemoryBridge Seed ---');

  // Idempotency: remove previously seeded demo patient(s) and all their data.
  console.log('Cleaning existing demo data...');
  const existingDemoPatients = await prisma.patientProfile.findMany({ where: { isDemo: true } });
  for (const patient of existingDemoPatients) {
    await prisma.patientProfile.delete({ where: { id: patient.id } });
  }

  // 1. Users (upsert -> idempotent)
  console.log('Seeding demo users...');
  const devPasswordHash = await bcrypt.hash('Password123!', 12);
  const anitaUser = await prisma.user.upsert({
    where: { email: 'anita@example.com' },
    update: { passwordHash: devPasswordHash },
    create: { email: 'anita@example.com', name: 'Anita Rao', passwordHash: devPasswordHash, role: UserRole.CAREGIVER }
  });
  const riyaUser = await prisma.user.upsert({
    where: { email: 'riya@example.com' },
    update: { passwordHash: devPasswordHash },
    create: { email: 'riya@example.com', name: 'Meera Rao', passwordHash: devPasswordHash, role: UserRole.FAMILY_MEMBER }
  });

  // 2. Patient
  console.log(`Seeding patient ${PATIENT.fullName}...`);
  const patient = await prisma.patientProfile.create({
    data: {
      fullName: PATIENT.fullName,
      dateOfBirth: new Date(PATIENT.dateOfBirth),
      profileImage: '/placeholders/avatar.svg',
      preferredLanguage: PATIENT.preferredLanguage,
      biography: PATIENT.biography,
      isDemo: true
    }
  });

  // 3. Access
  await prisma.patientAccess.createMany({
    data: [
      { userId: anitaUser.id, patientId: patient.id, relationship: 'Wife', accessRole: AccessRole.OWNER },
      { userId: riyaUser.id, patientId: patient.id, relationship: 'Daughter', accessRole: AccessRole.FAMILY }
    ]
  });

  // 4. People
  console.log(`Seeding ${PEOPLE.length} people...`);
  const personIdByKey = new Map<string, string>();
  for (const p of PEOPLE) {
    const created = await prisma.person.create({
      data: {
        patientId: patient.id,
        fullName: p.fullName,
        birthYear: p.birthYear ?? null,
        biography: p.biography,
        profileImage: '/placeholders/avatar.svg',
        confirmedByFamily: true
      }
    });
    personIdByKey.set(p.key, created.id);
  }
  // Link the patient's own person row
  await prisma.patientProfile.update({
    where: { id: patient.id },
    data: { personId: personIdByKey.get('gopal')! }
  });

  // 5. Relationships
  console.log(`Seeding ${RELATIONSHIPS.length} relationships...`);
  await prisma.relationship.createMany({
    data: RELATIONSHIPS.map((r) => ({
      patientId: patient.id,
      personOneId: personIdByKey.get(r.personOne)!,
      personTwoId: personIdByKey.get(r.personTwo)!,
      relationshipType: r.relationshipType,
      description: r.description
    }))
  });

  // 6. Albums
  console.log(`Seeding ${ALBUMS.length} albums...`);
  const albumIdByKey = new Map<string, string>();
  for (const a of ALBUMS) {
    const created = await prisma.album.create({
      data: {
        patientId: patient.id,
        title: a.title,
        colorTheme: a.colorTheme,
        yearRange: a.yearRange,
        description: a.description
      }
    });
    albumIdByKey.set(a.key, created.id);
  }

  // 7. Memories (+ verification rows for verified)
  console.log(`Seeding ${MEMORIES.length} memories...`);
  const memoryIdByKey = new Map<string, string>();
  const verifiedMemoryIds: string[] = [];
  for (const m of MEMORIES) {
    const status = m.status as VerificationStatus;
    const isVerified = status === VerificationStatus.VERIFIED;
    const created = await prisma.memory.create({
      data: {
        patientId: patient.id,
        createdBy: anitaUser.id,
        albumId: albumIdByKey.get(m.albumKey) ?? null,
        title: m.title,
        description: m.description,
        story: m.story,
        audioDescription: m.audioDescription ?? null,
        eventDate: new Date(m.eventDate),
        approximateYear: m.approximateYear,
        location: m.location,
        eventType: m.eventType,
        era: m.era,
        tags: m.tags,
        source: m.source as MemorySource,
        verificationStatus: status,
        approvedById: isVerified ? anitaUser.id : null,
        people: { create: m.peopleKeys.map((k) => ({ personId: personIdByKey.get(k)! })) }
      }
    });
    memoryIdByKey.set(m.key, created.id);
    if (isVerified) {
      verifiedMemoryIds.push(created.id);
      await prisma.verification.create({
        data: {
          memoryId: created.id,
          verifiedById: anitaUser.id,
          status: VerificationStatus.VERIFIED,
          comments: 'Verified family archive'
        }
      });
    }
  }

  // 8. Memory links (only create when both endpoints exist; narration filters to verified at read time)
  console.log(`Seeding ${LINKS.length} memory links...`);
  for (const link of LINKS) {
    const fromId = memoryIdByKey.get(link.from);
    const toId = memoryIdByKey.get(link.to);
    if (!fromId || !toId) continue;
    await prisma.memoryLink.create({
      data: {
        patientId: patient.id,
        fromMemoryId: fromId,
        toMemoryId: toId,
        linkType: link.linkType,
        connectionNote: link.connectionNote
      }
    });
  }

  // 9. Embed ONLY the verified memories (pending/rejected are never embedded).
  console.log(`Embedding ${verifiedMemoryIds.length} verified memories...`);
  for (const id of verifiedMemoryIds) {
    await embeddingService.embedVerifiedMemory(id);
  }

  // 10. Routine + diary (kept small, warm, consistent with the patient)
  console.log('Seeding routine items...');
  await prisma.routineItem.createMany({
    data: [
      { patientId: patient.id, title: 'Morning Filter Coffee & Garden Walk', scheduledTime: '08:00', period: RoutinePeriod.MORNING, category: RoutineCategory.WALK, notes: 'Filter coffee with Lakshmi, then a gentle walk by the jasmine.', completed: true, reminderStatus: ReminderStatus.ACTIVE, createdBy: anitaUser.id },
      { patientId: patient.id, title: 'Looking Through the Memory Album', scheduledTime: '10:30', period: RoutinePeriod.MORNING, category: RoutineCategory.ACTIVITY, notes: 'A calm activity before lunch.', completed: false, reminderStatus: ReminderStatus.ACTIVE, createdBy: anitaUser.id },
      { patientId: patient.id, title: 'Lunch with Rasam and Rice', scheduledTime: '13:00', period: RoutinePeriod.AFTERNOON, category: RoutineCategory.MEAL, notes: 'Warm rasam rice in the steel tiffin.', completed: false, reminderStatus: ReminderStatus.ACTIVE, createdBy: anitaUser.id },
      { patientId: patient.id, title: 'Afternoon Medicine Reminder', scheduledTime: '14:00', period: RoutinePeriod.AFTERNOON, category: RoutineCategory.MEDICATION, notes: 'Caregiver reminder: check the pillbox.', completed: false, reminderStatus: ReminderStatus.ACTIVE, createdBy: anitaUser.id },
      { patientId: patient.id, title: 'Evening Video Call with Arjun & Nithya', scheduledTime: '18:30', period: RoutinePeriod.EVENING, category: RoutineCategory.FAMILY_CALL, notes: 'The grandchildren love to show their drawings.', completed: false, reminderStatus: ReminderStatus.ACTIVE, createdBy: anitaUser.id }
    ]
  });

  console.log('Seeding diary entry...');
  await prisma.diaryEntry.create({
    data: {
      patientId: patient.id,
      date: new Date('2026-11-01'),
      weather: 'Pleasant & Breezy · 26°C',
      greeting: 'Have a restful evening, Gopal',
      morningNote: 'Gopal enjoyed his filter coffee by the window and watered the jasmine in the garden.',
      afternoonNote: 'Looked through the Grandparent Years album and smiled at Arjun’s badminton medal photo.',
      eveningNote: 'Sang a few lines of the old Jo Jo lullaby and settled down calmly for the night.',
      caregiverSign: 'Written with care by Anita & Meera'
    }
  });

  console.log('--- MemoryBridge Seed Complete! ---');
  console.log('Demo Credentials:');
  console.log('Caregiver: anita@example.com / Password123!');
  console.log('Family:    riya@example.com / Password123!');
  console.log(`Patient: ${PATIENT.fullName} — ${verifiedMemoryIds.length} verified memories, ${LINKS.length} links.`);
}

main()
  .catch((e) => {
    console.error('Seed script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await enginePrisma.$disconnect().catch(() => {});
  });
