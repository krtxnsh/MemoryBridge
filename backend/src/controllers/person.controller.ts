import { Request, Response } from 'express';
import { personService } from '../services/person.service.js';
import { relationshipService } from '../services/relationship.service.js';
import {
  createPersonSchema,
  updatePersonSchema,
  listPeopleQuerySchema
} from '../validators/person.validator.js';
import {
  createRelationshipSchema,
  updateRelationshipSchema,
  listRelationshipsQuerySchema
} from '../validators/relationship.validator.js';
import { sendCreated, sendSuccess } from '../utils/response.js';

export class PersonController {
  // --- People ---
  async listPeople(req: Request, res: Response): Promise<void> {
    const patientId = req.params.patientId as string;
    const query = listPeopleQuerySchema.parse(req.query);

    const isPatientSession = Boolean(req.patientSession);
    const accessRole = req.patientAccess?.accessRole;
    const userId = req.user?.id;

    const result = await personService.listPeople(patientId, query, {
      isPatientSession,
      accessRole,
      userId
    });

    sendSuccess(res, result);
  }

  async getPerson(req: Request, res: Response): Promise<void> {
    const personId = req.params.id as string;
    const isPatientSession = Boolean(req.patientSession);
    const accessRole = req.patientAccess?.accessRole;
    const userId = req.user?.id;

    const result = await personService.getPersonById(personId, {
      isPatientSession,
      accessRole,
      userId
    });

    sendSuccess(res, result);
  }

  async createPerson(req: Request, res: Response): Promise<void> {
    const patientId = req.params.patientId as string;
    const input = createPersonSchema.parse(req.body);
    const userId = req.user!.id;

    const result = await personService.createPerson(patientId, userId, input);
    sendCreated(res, result);
  }

  async updatePerson(req: Request, res: Response): Promise<void> {
    const personId = req.params.id as string;
    const input = updatePersonSchema.parse(req.body);
    const userId = req.user!.id;

    const result = await personService.updatePerson(personId, userId, input);
    sendSuccess(res, result);
  }

  async deletePerson(req: Request, res: Response): Promise<void> {
    const personId = req.params.id as string;
    const userId = req.user!.id;

    const result = await personService.deletePerson(personId, userId);
    sendSuccess(res, result);
  }

  // --- Relationships ---
  async listRelationships(req: Request, res: Response): Promise<void> {
    const patientId = req.params.patientId as string;
    const query = listRelationshipsQuerySchema.parse(req.query);

    const isPatientSession = Boolean(req.patientSession);
    const accessRole = req.patientAccess?.accessRole;
    const userId = req.user?.id;

    const result = await relationshipService.listRelationships(patientId, query, {
      isPatientSession,
      accessRole,
      userId
    });

    sendSuccess(res, result);
  }

  async getRelationship(req: Request, res: Response): Promise<void> {
    const relationshipId = req.params.id as string;
    const isPatientSession = Boolean(req.patientSession);
    const accessRole = req.patientAccess?.accessRole;
    const userId = req.user?.id;

    const result = await relationshipService.getRelationshipById(relationshipId, {
      isPatientSession,
      accessRole,
      userId
    });

    sendSuccess(res, result);
  }

  async createRelationship(req: Request, res: Response): Promise<void> {
    const patientId = req.params.patientId as string;
    const input = createRelationshipSchema.parse(req.body);
    const userId = req.user!.id;

    const result = await relationshipService.createRelationship(patientId, userId, input);
    sendCreated(res, result);
  }

  async updateRelationship(req: Request, res: Response): Promise<void> {
    const relationshipId = req.params.id as string;
    const input = updateRelationshipSchema.parse(req.body);
    const userId = req.user!.id;

    const result = await relationshipService.updateRelationship(relationshipId, userId, input);
    sendSuccess(res, result);
  }

  async deleteRelationship(req: Request, res: Response): Promise<void> {
    const relationshipId = req.params.id as string;
    const userId = req.user!.id;

    const result = await relationshipService.deleteRelationship(relationshipId, userId);
    sendSuccess(res, result);
  }
}

export const personController = new PersonController();
