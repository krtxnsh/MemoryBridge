import { Router } from 'express';
import { AccessRole } from '@prisma/client';
import { conversationController } from '../controllers/conversation.controller.js';
import { authenticateUserOrPatient } from '../middleware/auth.js';
import { prisma } from '../config/prisma.js';

const router = Router();

// Send message to companion (Supports both direct patient conversation and conversation ID)
router.post(
  '/patients/:patientId/conversations/messages',
  authenticateUserOrPatient(AccessRole.VIEWER),
  (req, res, next) => {
    conversationController.sendMessage(req, res, next);
  }
);

router.post(
  '/conversations/:id/messages',
  authenticateUserOrPatient(AccessRole.VIEWER),
  async (req, res, next) => {
    // If not already resolved, find patientId from conversation
    if (!req.patient && !req.patientSession) {
      const conv = await prisma.conversation.findUnique({
        where: { id: req.params.id as string }
      });
      if (conv) {
        req.params.patientId = conv.patientId;
      }
    }
    conversationController.sendMessage(req, res, next);
  }
);

export default router;
