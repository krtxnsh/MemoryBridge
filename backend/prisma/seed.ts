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
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Guard: Never run in production
  if (process.env.NODE_ENV === 'production') {
    console.error('ERROR: Seed script is strictly forbidden from running in production.');
    process.exit(1);
  }

  console.log('--- Starting MemoryBridge Seed ---');

  // Clean existing demo data if in development/test
  console.log('Cleaning existing demo data...');
  const existingDemoPatients = await prisma.patientProfile.findMany({
    where: { isDemo: true }
  });

  for (const patient of existingDemoPatients) {
    await prisma.patientProfile.delete({ where: { id: patient.id } });
  }

  // 1. Seed Users
  console.log('Seeding demo users...');
  const saltRounds = 12;
  const devPasswordHash = await bcrypt.hash('Password123!', saltRounds);

  const anitaUser = await prisma.user.upsert({
    where: { email: 'anita@example.com' },
    update: { passwordHash: devPasswordHash },
    create: {
      email: 'anita@example.com',
      name: 'Anita Sharma',
      passwordHash: devPasswordHash,
      role: UserRole.CAREGIVER
    }
  });

  const riyaUser = await prisma.user.upsert({
    where: { email: 'riya@example.com' },
    update: { passwordHash: devPasswordHash },
    create: {
      email: 'riya@example.com',
      name: 'Riya Sharma',
      passwordHash: devPasswordHash,
      role: UserRole.FAMILY_MEMBER
    }
  });

  // 2. Seed Demo Patient: Rajiv Sharma
  console.log('Seeding Rajiv Sharma profile...');
  const rajiv = await prisma.patientProfile.create({
    data: {
      fullName: 'Rajiv Sharma',
      dateOfBirth: new Date('1957-08-14'),
      profileImage: '/placeholders/rajiv.svg',
      preferredLanguage: 'en',
      biography: 'Born in 1957 in Shimla. Passionate reader, nature lover, and civil engineer who built cherished bridges and gardens.',
      isDemo: true
    }
  });

  // 3. Grant Patient Access
  await prisma.patientAccess.createMany({
    data: [
      {
        userId: anitaUser.id,
        patientId: rajiv.id,
        relationship: 'Wife',
        accessRole: AccessRole.OWNER
      },
      {
        userId: riyaUser.id,
        patientId: rajiv.id,
        relationship: 'Daughter',
        accessRole: AccessRole.FAMILY
      }
    ]
  });

  // 4. Seed Family & Friends (People)
  console.log('Seeding family circle people...');
  const personRajiv = await prisma.person.create({
    data: {
      patientId: rajiv.id,
      fullName: 'Rajiv',
      birthYear: 1957,
      biography: 'Born in 1957. Passionate reader, nature lover, and civil engineer who built cherished bridges and gardens.',
      profileImage: '/placeholders/rajiv.svg',
      confirmedByFamily: true
    }
  });

  // Link Rajiv person row to PatientProfile.personId
  await prisma.patientProfile.update({
    where: { id: rajiv.id },
    data: { personId: personRajiv.id }
  });

  const personAnita = await prisma.person.create({
    data: {
      patientId: rajiv.id,
      fullName: 'Anita',
      birthYear: 1960,
      biography: 'Married to Rajiv since 1985. Loves morning jasmine tea, gardening, and singing folk songs.',
      profileImage: '/placeholders/anita.svg',
      confirmedByFamily: true
    }
  });

  const personRiya = await prisma.person.create({
    data: {
      patientId: rajiv.id,
      fullName: 'Riya',
      birthYear: 1990,
      biography: 'Rajiv and Anita’s daughter. Architect living nearby who visits every Sunday with homemade sweets.',
      profileImage: '/placeholders/riya.svg',
      confirmedByFamily: true
    }
  });

  const personSuresh = await prisma.person.create({
    data: {
      patientId: rajiv.id,
      fullName: 'Suresh',
      birthYear: 1957,
      biography: 'College friend from St. Stephens batch of 1978. Shared many bicycle adventures and cricket matches.',
      profileImage: '/placeholders/suresh.svg',
      confirmedByFamily: true
    }
  });

  const personDaniel = await prisma.person.create({
    data: {
      patientId: rajiv.id,
      fullName: 'Daniel',
      birthYear: 2018,
      biography: 'Riya’s 6-year-old son. Loved running through tulip fields with Rajiv and listening to his bedtime train stories.',
      profileImage: '/placeholders/daniel.svg',
      confirmedByFamily: true
    }
  });

  // 5. Seed Relationships
  console.log('Seeding relationships...');
  await prisma.relationship.createMany({
    data: [
      {
        patientId: rajiv.id,
        personOneId: personRajiv.id,
        personTwoId: personAnita.id,
        relationshipType: 'Spouse',
        description: 'Married in 1985. Shares memories of Rose Garden wedding, Goa sunset, and morning tea.'
      },
      {
        patientId: rajiv.id,
        personOneId: personRajiv.id,
        personTwoId: personRiya.id,
        relationshipType: 'Child',
        description: 'Father & Daughter. Architect daughter who visits every Sunday.'
      },
      {
        patientId: rajiv.id,
        personOneId: personRajiv.id,
        personTwoId: personSuresh.id,
        relationshipType: 'Friend',
        description: 'College Best Friends from St. Stephens batch of 1978.'
      },
      {
        patientId: rajiv.id,
        personOneId: personRajiv.id,
        personTwoId: personDaniel.id,
        relationshipType: 'Grandchild',
        description: 'Grandson born 2018. Shares memories of tulip park walks and leaf whistling.'
      },
      {
        patientId: rajiv.id,
        personOneId: personAnita.id,
        personTwoId: personRiya.id,
        relationshipType: 'Child',
        description: 'Mother & Daughter.'
      },
      {
        patientId: rajiv.id,
        personOneId: personRiya.id,
        personTwoId: personDaniel.id,
        relationshipType: 'Child',
        description: 'Mother & Son.'
      }
    ]
  });

  // 6. Seed Albums
  console.log('Seeding albums...');
  const albumChildhood = await prisma.album.create({
    data: {
      patientId: rajiv.id,
      title: 'Childhood & Growing Up',
      colorTheme: 'amber',
      yearRange: '1960 – 1972',
      description: 'Bicycle rides, mango orchards, and school days in Shimla hills.'
    }
  });

  const albumCollege = await prisma.album.create({
    data: {
      patientId: rajiv.id,
      title: 'College & Friendships',
      colorTheme: 'blue',
      yearRange: '1974 – 1978',
      description: 'St. Stephens college campus, debates, tea stalls, and friends.'
    }
  });

  const albumWedding = await prisma.album.create({
    data: {
      patientId: rajiv.id,
      title: 'My Wedding',
      colorTheme: 'coral',
      yearRange: '1985',
      description: 'The golden day Rajiv married Anita surrounded by marigolds and laughter.'
    }
  });

  const albumTrips = await prisma.album.create({
    data: {
      patientId: rajiv.id,
      title: 'Family Trips & Journeys',
      colorTheme: 'gold',
      yearRange: '1995 – 2017',
      description: 'Sunsets in Calangute, Goa beach picnics, and train trips with Anita and Riya.'
    }
  });

  const albumFestivals = await prisma.album.create({
    data: {
      patientId: rajiv.id,
      title: 'Festivals & Celebrations',
      colorTheme: 'sage',
      yearRange: '1986 – 2021',
      description: 'Diwali clay lamps, sweet boxes, and courtyard celebrations.'
    }
  });

  const albumGrandson = await prisma.album.create({
    data: {
      patientId: rajiv.id,
      title: 'Grandson Daniel',
      colorTheme: 'peach',
      yearRange: '2019 – 2024',
      description: 'Laughing among flower fields, reading picture books, and afternoon walks.'
    }
  });

  // 7. Seed Memories with People & Verifications
  console.log('Seeding memories...');
  const seedMemories = [
    {
      title: 'The Red Bicycle on Hill Road',
      approximateYear: 1960,
      eventDate: new Date('1960-08-14'),
      location: 'Shimla Hills',
      albumId: albumChildhood.id,
      era: 'Childhood',
      tags: ['Bicycle', 'Shimla', 'Childhood', 'Summer'],
      story: 'Rajiv received his first red bicycle on his 3rd birthday from his father. He would race down the gentle hill road with the wind in his face, feeling completely free.',
      audioDescription: 'This was your first bicycle in Shimla hills, Rajiv. You loved riding it down the garden path.',
      verificationStatus: VerificationStatus.VERIFIED,
      source: MemorySource.FAMILY_SUBMITTED,
      mapX: 340,
      mapY: 120,
      mapLabel: 'Shimla 1960',
      peopleIds: [personRajiv.id]
    },
    {
      title: 'First Day at St. Xavier’s School',
      approximateYear: 1966,
      eventDate: new Date('1966-07-05'),
      location: 'Delhi',
      albumId: albumChildhood.id,
      era: 'First School',
      tags: ['School', 'Books', 'Uniform'],
      story: 'A bright July morning when Rajiv wore his new navy blue blazer and carried a wooden pencil box. He made his first friends during the recess bell.',
      verificationStatus: VerificationStatus.VERIFIED,
      source: MemorySource.FAMILY_SUBMITTED,
      mapX: 330,
      mapY: 180,
      mapLabel: 'Delhi 1966',
      peopleIds: [personRajiv.id]
    },
    {
      title: 'Graduation Day with Suresh',
      approximateYear: 1978,
      eventDate: new Date('1978-05-20'),
      location: 'St. Stephens College Campus',
      albumId: albumCollege.id,
      era: 'College',
      tags: ['College', 'Engineering', 'Suresh', 'Tea'],
      story: 'Rajiv graduated with honors in Civil Engineering alongside his closest buddy Suresh. They celebrated with samosas and cardamom tea at the university canteen.',
      audioDescription: 'Here is your college graduation with Suresh in 1978. You both looked so proud and happy.',
      verificationStatus: VerificationStatus.VERIFIED,
      source: MemorySource.FAMILY_SUBMITTED,
      songId: 'song-college',
      peopleIds: [personRajiv.id, personSuresh.id]
    },
    {
      title: 'Wedding Day with Anita',
      approximateYear: 1985,
      eventDate: new Date('1985-11-22'),
      location: 'Rose Garden Mandap, Delhi',
      albumId: albumWedding.id,
      era: 'Wedding & Family',
      tags: ['Wedding', 'Anita', 'Marigolds', 'Love'],
      story: 'On a cool November evening, Rajiv and Anita were married under a canopy of fresh orange marigolds and jasmine. Anita wore a deep red silk saree, and Rajiv couldn’t stop smiling all evening.',
      audioDescription: 'Your wedding day with Anita on November 22, 1985. The flowers smelled wonderful and everyone danced.',
      verificationStatus: VerificationStatus.VERIFIED,
      source: MemorySource.FAMILY_SUBMITTED,
      songId: 'song-wedding',
      mapX: 335,
      mapY: 190,
      mapLabel: 'Rose Garden 1985',
      peopleIds: [personRajiv.id, personAnita.id]
    },
    {
      title: 'First Bridge Project at ABC Company',
      approximateYear: 1988,
      eventDate: new Date('1988-03-10'),
      location: 'Yamuna River Crossing',
      albumId: albumTrips.id,
      era: 'Career',
      tags: ['Work', 'Engineering', 'Bridge', 'Yamuna'],
      story: 'Rajiv led the structural planning team at ABC Company for the new river flyover. He kept a miniature brass ruler in his pocket for good luck.',
      verificationStatus: VerificationStatus.VERIFIED,
      source: MemorySource.FAMILY_SUBMITTED,
      peopleIds: [personRajiv.id]
    },
    {
      title: 'Goa Golden Beach Picnic',
      approximateYear: 1998,
      eventDate: new Date('1998-04-13'),
      location: 'Calangute, Goa',
      albumId: albumTrips.id,
      era: 'Wedding & Family',
      tags: ['Goa', 'Beach', 'Anita', 'Riya', 'Sunset', 'Picnic'],
      story: 'Your family visited Goa in April 1998. Anita and little Riya were with you. You built sandcastles together and Rajiv tasted fresh coconut water while watching the orange sun dip into the ocean.',
      audioDescription: 'Of course, Rajiv! Your family visited Goa in 1998. Anita and Riya were with you. Would you like to see the photographs from that trip?',
      verificationStatus: VerificationStatus.VERIFIED,
      source: MemorySource.FAMILY_SUBMITTED,
      songId: 'song-goa',
      mapX: 280,
      mapY: 280,
      mapLabel: 'Goa 1998',
      peopleIds: [personRajiv.id, personAnita.id, personRiya.id]
    },
    {
      title: 'Diwali Courtyard with Little Riya',
      approximateYear: 2001,
      eventDate: new Date('2001-11-04'),
      location: 'Family Courtyard, Delhi',
      albumId: albumFestivals.id,
      era: 'Wedding & Family',
      tags: ['Diwali', 'Lights', 'Family', 'Halwa'],
      story: 'Rajiv and 11-year-old Riya arranged over 50 clay oil lamps around the verandah railing. Anita made warm almond halwa, filling the entire house with sweet cardamom aroma.',
      verificationStatus: VerificationStatus.VERIFIED,
      source: MemorySource.FAMILY_SUBMITTED,
      peopleIds: [personRajiv.id, personAnita.id, personRiya.id]
    },
    {
      title: 'Picnic in Tulip Field with Grandson Daniel',
      approximateYear: 2019,
      eventDate: new Date('2019-04-21'),
      location: 'Tulip Meadows Park',
      albumId: albumGrandson.id,
      era: 'Golden Years',
      tags: ['Daniel', 'Grandson', 'Flowers', 'Spring', 'Tulips'],
      story: 'A warm sunny morning in spring. Little Daniel held Rajiv’s hand while discovering butterflies. Rajiv showed him how to whistle with a leaf.',
      audioDescription: 'Grandpa Rajiv and Daniel laughing in the tulip garden. A sunny day filled with smiles.',
      verificationStatus: VerificationStatus.VERIFIED,
      source: MemorySource.FAMILY_SUBMITTED,
      mapX: 350,
      mapY: 150,
      mapLabel: 'Tulip Park 2019',
      peopleIds: [personRajiv.id, personDaniel.id, personRiya.id]
    },
    // Deliberate Pending Memory
    {
      title: 'Trip to Kathmandu with Mountain Views',
      approximateYear: 1994,
      eventDate: new Date('1994-10-12'),
      location: 'Kathmandu, Nepal',
      albumId: albumTrips.id,
      era: 'Career',
      tags: ['Nepal', 'Mountains', 'Suresh', 'Travel'],
      story: 'AI Suggested draft from Suresh: Rajiv and Suresh took a bus to Kathmandu in autumn 1994, staying at a quiet guesthouse near Boudhanath Stupa.',
      verificationStatus: VerificationStatus.PENDING,
      source: MemorySource.AI_DRAFTED,
      peopleIds: [personRajiv.id, personSuresh.id]
    },
    // Deliberate AI Suggested Memory
    {
      title: 'Rajiv’s First Acoustic Guitar',
      approximateYear: 1975,
      eventDate: new Date('1975-09-01'),
      location: 'St. Stephens Hostel',
      albumId: albumCollege.id,
      era: 'College',
      tags: ['Music', 'Guitar', 'Hostel'],
      story: 'AI Draft suggestion: Rajiv learned 3 chords on a borrowed guitar during monsoon evenings.',
      verificationStatus: VerificationStatus.AI_SUGGESTED,
      source: MemorySource.AI_DRAFTED,
      peopleIds: [personRajiv.id]
    }
  ];

  for (const memData of seedMemories) {
    const { peopleIds, ...rest } = memData;
    const isVerified = rest.verificationStatus === VerificationStatus.VERIFIED;

    const memory = await prisma.memory.create({
      data: {
        ...rest,
        patientId: rajiv.id,
        createdBy: anitaUser.id,
        approvedById: isVerified ? anitaUser.id : null,
        people: {
          create: peopleIds.map((pId) => ({ personId: pId }))
        }
      }
    });

    if (isVerified) {
      await prisma.verification.create({
        data: {
          memoryId: memory.id,
          verifiedById: anitaUser.id,
          status: VerificationStatus.VERIFIED,
          comments: 'Initial verified family archive'
        }
      });
    }
  }

  // 8. Seed Routine Items
  console.log('Seeding routine items...');
  await prisma.routineItem.createMany({
    data: [
      {
        patientId: rajiv.id,
        title: 'Morning Garden Walk & Tea',
        scheduledTime: '08:30',
        period: RoutinePeriod.MORNING,
        category: RoutineCategory.WALK,
        notes: 'Gentle 15-minute stroll in the courtyard. Fresh air and jasmine tea with Anita.',
        completed: true,
        reminderStatus: ReminderStatus.ACTIVE,
        createdBy: anitaUser.id
      },
      {
        patientId: rajiv.id,
        title: 'Colouring & Memory Album',
        scheduledTime: '10:00',
        period: RoutinePeriod.MORNING,
        category: RoutineCategory.ACTIVITY,
        notes: 'A relaxing, lighthearted activity before lunch.',
        completed: false,
        reminderStatus: ReminderStatus.ACTIVE,
        createdBy: anitaUser.id
      },
      {
        patientId: rajiv.id,
        title: 'Lunch with Chickpea Stew',
        scheduledTime: '12:30',
        period: RoutinePeriod.AFTERNOON,
        category: RoutineCategory.MEAL,
        notes: 'Warm chickpea bowl in the pink container in the refrigerator.',
        completed: false,
        reminderStatus: ReminderStatus.ACTIVE,
        createdBy: anitaUser.id
      },
      {
        patientId: rajiv.id,
        title: 'Afternoon Caregiver Reminder',
        scheduledTime: '13:30',
        period: RoutinePeriod.AFTERNOON,
        category: RoutineCategory.MEDICATION,
        notes: 'Caregiver reminder: check white pillbox.',
        completed: false,
        reminderStatus: ReminderStatus.ACTIVE,
        createdBy: anitaUser.id
      },
      {
        patientId: rajiv.id,
        title: 'Listen to Favorite Melodies',
        scheduledTime: '16:00',
        period: RoutinePeriod.AFTERNOON,
        category: RoutineCategory.ACTIVITY,
        notes: 'Enjoy 20 minutes of calming music in the sunroom.',
        completed: false,
        reminderStatus: ReminderStatus.ACTIVE,
        createdBy: anitaUser.id
      },
      {
        patientId: rajiv.id,
        title: 'Evening Video Call with Riya & Daniel',
        scheduledTime: '18:00',
        period: RoutinePeriod.EVENING,
        category: RoutineCategory.FAMILY_CALL,
        notes: 'Daniel wants to show his drawing of a green steam train.',
        completed: false,
        reminderStatus: ReminderStatus.ACTIVE,
        createdBy: anitaUser.id
      }
    ]
  });

  // 9. Seed Diary Entry
  console.log('Seeding diary entry...');
  await prisma.diaryEntry.create({
    data: {
      patientId: rajiv.id,
      date: new Date('2026-11-01'),
      weather: 'Sunny & Pleasant · 24°C',
      greeting: 'Have a sweet dream, Rajiv',
      morningNote: 'Rajiv enjoyed a warm cup of jasmine tea with toast by the verandah window. He smiled as the morning sunlight touched his hands, noting how peaceful the sparrow birds sounded.',
      afternoonNote: 'Looked through the 1998 Goa trip photograph album. Rajiv pointed at the ocean waves and remembered the chilled fresh coconut water.',
      eveningNote: 'Finished a simple jigsaw puzzle with Daniel’s smiling photo. Ready for a calm, restful sleep surrounded by family love.',
      caregiverSign: 'Written with care by Anita & Riya'
    }
  });

  console.log('--- MemoryBridge Seed Complete! ---');
  console.log('Demo Credentials:');
  console.log('Caregiver: anita@example.com / Password123!');
  console.log('Family:    riya@example.com / Password123!');
}

main()
  .catch((e) => {
    console.error('Seed script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
