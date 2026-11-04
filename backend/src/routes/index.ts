import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import patientRoutes from './patient.routes.js';
import memoryRoutes from './memory.routes.js';
import personRoutes from './person.routes.js';
import albumRoutes from './album.routes.js';
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

// People & Relationship Endpoints: /api/v1/people/*, /api/v1/relationships/*, /api/v1/patients/:patientId/people/*
router.use(personRoutes);

// Album Endpoints: /api/v1/albums/* & /api/v1/patients/:patientId/albums/*
router.use(albumRoutes);

export default router;
