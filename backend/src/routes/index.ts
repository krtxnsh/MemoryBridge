import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import patientRoutes from './patient.routes.js';

const router = Router();

// Health Check
router.use(healthRoutes);

// Auth Endpoints: /api/v1/auth/*
router.use('/auth', authRoutes);

// Patient & Session Endpoints: /api/v1/patients/* & /api/v1/patient-sessions/*
router.use(patientRoutes);

export default router;
