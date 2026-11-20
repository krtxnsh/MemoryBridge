import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service.js';
import { graphService } from '../services/graph.service.js';
import { sendSuccess } from '../utils/response.js';

export class DashboardController {
  async getDashboard(req: Request, res: Response): Promise<void> {
    const patientId = req.params.patientId as string;
    const isPatientSession = Boolean(req.patientSession);
    const accessRole = req.patientAccess?.accessRole;
    const userId = req.user?.id;

    const result = await dashboardService.getDashboard(patientId, {
      isPatientSession,
      accessRole,
      userId
    });

    sendSuccess(res, result);
  }

  async getGraph(req: Request, res: Response): Promise<void> {
    const patientId = req.params.patientId as string;
    const isPatientSession = Boolean(req.patientSession);
    const accessRole = req.patientAccess?.accessRole;
    const userId = req.user?.id;

    const result = await graphService.getGraph(patientId, {
      isPatientSession,
      accessRole,
      userId
    });

    sendSuccess(res, result);
  }
}

export const dashboardController = new DashboardController();

