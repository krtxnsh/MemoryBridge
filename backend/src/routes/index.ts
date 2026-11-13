import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import patientRoutes from './patient.routes.js';
import memoryRoutes from './memory.routes.js';
import personRoutes from './person.routes.js';
import albumRoutes from './album.routes.js';
import storybookRoutes from './storybook.routes.js';
import verificationRoutes from './verification.routes.js';
import routineRoutes from './routine.routes.js';
import diaryRoutes from './diary.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import companionRoutes from './companion.routes.js';
import mediaRoutes from './media.routes.js';
import localStorageRoutes from './local-storage.routes.js';
import { generalApiRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Health Check (unrestricted)
router.use(healthRoutes);

// Apply general API rate limiter to all api routes
router.use(generalApiRateLimiter);

// Auth Endpoints: /api/v1/auth/*
router.use('/auth', authRoutes);

// Patient & Session Endpoints: /api/v1/patients/* & /api/v1/patient-sessions/*
router.use(patientRoutes);

// Memory Endpoints: /api/v1/memories/* & /api/v1/patients/:patientId/memories/*
router.use(memoryRoutes);

// Verification Endpoints: /api/v1/memories/:memoryId/verify, /reject, /api/v1/patients/:patientId/verifications/*
router.use(verificationRoutes);

// People & Relationship Endpoints: /api/v1/people/*, /api/v1/relationships/*, /api/v1/patients/:patientId/people/*
router.use(personRoutes);

// Album Endpoints: /api/v1/albums/* & /api/v1/patients/:patientId/albums/*
router.use(albumRoutes);

// Storybook Endpoints: /api/v1/storybooks/* & /api/v1/patients/:patientId/storybooks/*
router.use(storybookRoutes);

// Routine Endpoints: /api/v1/routine/* & /api/v1/patients/:patientId/routine/*
router.use(routineRoutes);

// Diary Endpoints: /api/v1/diary/* & /api/v1/patients/:patientId/diary/*
router.use(diaryRoutes);

// Dashboard & Graph Endpoints: /api/v1/patients/:patientId/dashboard & /graph
router.use(dashboardRoutes);

// Companion Endpoints: /api/v1/patients/:patientId/companion/*
router.use(companionRoutes);

// Media Endpoints: /api/v1/patients/:patientId/media/* & /api/v1/media/*
router.use(mediaRoutes);

// Local Storage Serving (dev only): /api/v1/storage/*
router.use(localStorageRoutes);

export default router;
