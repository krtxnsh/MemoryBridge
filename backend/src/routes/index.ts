import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import patientRoutes from './patient.routes.js';
import memoryRoutes from './memory.routes.js';
import personRoutes from './person.routes.js';
import albumRoutes from './album.routes.js';
import routineRoutes from './routine.routes.js';
import diaryRoutes from './diary.routes.js';
import conversationRoutes from './conversation.routes.js';
import mediaRoutes from './media.routes.js';

const router = Router();

// Health Check
router.use(healthRoutes);

// Auth Endpoints: /api/v1/auth/*
router.use('/auth', authRoutes);

// Patient & Session Endpoints: /api/v1/patients/* & /api/v1/patient-sessions/*
router.use(patientRoutes);

// Core Domain Endpoints
router.use(memoryRoutes);
router.use(personRoutes);
router.use(albumRoutes);
router.use(routineRoutes);
router.use(diaryRoutes);
router.use(conversationRoutes);
router.use(mediaRoutes);

export default router;
