import { Prisma, AccessRole, VerificationStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export class GraphService {
  async getGraph(
    patientId: string,
    context: {
      isPatientSession: boolean;
      accessRole?: AccessRole;
      userId?: string;
    }
  ) {
    const patient = await prisma.patientProfile.findFirst({
      where: { id: patientId, deletedAt: null }
    });

    if (!patient) {
      throw new AppError('PATIENT_NOT_FOUND', 'Patient resource not found.', 404);
    }

    // 1. Build people filter
    const peopleFilter: Prisma.PersonWhereInput = {
      patientId,
      deletedAt: null
    };
    if (context.isPatientSession) {
      peopleFilter.confirmedByFamily = true;
    }

    // 2. Build memory filter
    const memoryFilter: Prisma.MemoryWhereInput = {
      patientId,
      deletedAt: null
    };
    if (context.isPatientSession || context.accessRole === AccessRole.VIEWER) {
      memoryFilter.verificationStatus = VerificationStatus.VERIFIED;
    } else if (context.accessRole === AccessRole.FAMILY) {
      memoryFilter.OR = [
        { verificationStatus: VerificationStatus.VERIFIED },
        { createdBy: context.userId }
      ];
    }

    // Fetch in parallel
    const [people, memories, albums, relationships] = await Promise.all([
      prisma.person.findMany({ where: peopleFilter }),
      prisma.memory.findMany({
        where: memoryFilter,
        include: { people: true }
      }),
      prisma.album.findMany({ where: { patientId } }),
      prisma.relationship.findMany({
        where: {
          patientId,
          personOne: { deletedAt: null },
          personTwo: { deletedAt: null }
        }
      })
    ]);

    const activePersonIds = new Set(people.map((p) => p.id));
    const activeMemoryIds = new Set(memories.map((m) => m.id));
    const activeAlbumIds = new Set(albums.map((a) => a.id));

    // Construct Nodes
    const nodes: any[] = [
      {
        id: patient.id,
        type: 'patient',
        label: patient.fullName,
        image: patient.profileImage
      }
    ];

    for (const p of people) {
      // Don't duplicate if self-person already represents patient
      if (p.id !== patient.personId) {
        nodes.push({
          id: p.id,
          type: 'person',
          label: p.fullName,
          image: p.profileImage,
          confirmedByFamily: p.confirmedByFamily
        });
      }
    }

    for (const m of memories) {
      nodes.push({
        id: m.id,
        type: 'memory',
        label: m.title,
        era: m.era,
        approximateYear: m.approximateYear,
        x: m.mapX,
        y: m.mapY
      });
    }

    for (const a of albums) {
      nodes.push({
        id: a.id,
        type: 'album',
        label: a.title,
        colorTheme: a.colorTheme
      });
    }

    // Construct Links
    const links: any[] = [];

    // Relationship links
    for (const r of relationships) {
      if (activePersonIds.has(r.personOneId) && activePersonIds.has(r.personTwoId)) {
        links.push({
          id: r.id,
          source: r.personOneId,
          target: r.personTwoId,
          type: 'relationship',
          label: r.relationshipType
        });
      }
    }

    // Memory-Person links
    for (const m of memories) {
      for (const p of m.people) {
        if (activePersonIds.has(p.personId)) {
          links.push({
            id: `${m.id}-${p.personId}`,
            source: m.id,
            target: p.personId,
            type: 'memory_person'
          });
        }
      }

      // Album-Memory links
      if (m.albumId && activeAlbumIds.has(m.albumId)) {
        links.push({
          id: `${m.albumId}-${m.id}`,
          source: m.albumId,
          target: m.id,
          type: 'album_memory'
        });
      }
    }

    return {
      nodes,
      links
    };
  }
}

export const graphService = new GraphService();

