import { Request, Response, NextFunction } from 'express';
import { personService } from '../services/person.service.js';
import {
  createPersonSchema,
  updatePersonSchema,
  createRelationshipSchema
} from '../validators/core.validator.js';
import { sendSuccess } from '../utils/response.js';

export class PersonController {
  async listPeople(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.patient?.id || req.patientSession?.patientId || (req.params.patientId as string);
      const people = await personService.listPeople(patientId);
      sendSuccess(res, people);
    } catch (err) {
      next(err);
    }
  }

  async getPerson(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const person = await personService.getPersonById(id);
      sendSuccess(res, person);
    } catch (err) {
      next(err);
    }
  }

  async createPerson(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.patient!.id;
      const userId = req.user!.id;
      const validated = createPersonSchema.parse(req.body);

      const person = await personService.createPerson(patientId, userId, validated);
      sendSuccess(res, person, 201);
    } catch (err) {
      next(err);
    }
  }

  async updatePerson(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const patientId = req.patient!.id;
      const userId = req.user!.id;
      const validated = updatePersonSchema.parse(req.body);

      const person = await personService.updatePerson(id, userId, patientId, validated);
      sendSuccess(res, person);
    } catch (err) {
      next(err);
    }
  }

  async deletePerson(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const patientId = req.patient!.id;
      const userId = req.user!.id;

      const person = await personService.deletePerson(id, userId, patientId);
      sendSuccess(res, { id: person.id, message: 'Person removed from family circle' });
    } catch (err) {
      next(err);
    }
  }

  async listRelationships(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.patient!.id;
      const relationships = await personService.listRelationships(patientId);
      sendSuccess(res, relationships);
    } catch (err) {
      next(err);
    }
  }

  async createRelationship(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.patient!.id;
      const userId = req.user!.id;
      const validated = createRelationshipSchema.parse(req.body);

      const relationship = await personService.createRelationship(patientId, userId, validated);
      sendSuccess(res, relationship, 201);
    } catch (err) {
      next(err);
    }
  }

  async getGraph(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.patient!.id;
      const graph = await personService.getConnectionsGraph(patientId);
      sendSuccess(res, graph);
    } catch (err) {
      next(err);
    }
  }
}

export const personController = new PersonController();
