import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import { useApp } from './store/AppContext';
import { getPatientSessionToken } from './api/client';
import { HeaderBar } from './components/common/HeaderBar';

const LandingPage = lazy(() => import('./pages/LandingPage').then(module => ({ default: module.LandingPage })));
const JoinFamily = lazy(() => import('./pages/JoinFamily').then(module => ({ default: module.JoinFamily })));
const SetupPatient = lazy(() => import('./pages/SetupPatient').then(module => ({ default: module.SetupPatient })));
const PatientLayout = lazy(() => import('./components/patient/PatientLayout').then(module => ({ default: module.PatientLayout })));
const PatientHome = lazy(() => import('./pages/patient/PatientHome').then(module => ({ default: module.PatientHome })));
const PatientMemories = lazy(() => import('./pages/patient/PatientMemories').then(module => ({ default: module.PatientMemories })));
const PatientFamily = lazy(() => import('./pages/patient/PatientFamily').then(module => ({ default: module.PatientFamily })));
const PatientTimeline = lazy(() => import('./pages/patient/PatientTimeline').then(module => ({ default: module.PatientTimeline })));
const PatientMusic = lazy(() => import('./pages/patient/PatientMusic').then(module => ({ default: module.PatientMusic })));
const PatientJourneys = lazy(() => import('./pages/patient/PatientJourneys').then(module => ({ default: module.PatientJourneys })));
const PatientDiary = lazy(() => import('./pages/patient/PatientDiary').then(module => ({ default: module.PatientDiary })));
const PatientActivities = lazy(() => import('./pages/patient/PatientActivities').then(module => ({ default: module.PatientActivities })));
const PatientCompanion = lazy(() => import('./pages/patient/PatientCompanion').then(module => ({ default: module.PatientCompanion })));
const CaregiverLayout = lazy(() => import('./components/caregiver/CaregiverLayout').then(module => ({ default: module.CaregiverLayout })));
const CaregiverOverview = lazy(() => import('./pages/caregiver/CaregiverOverview').then(module => ({ default: module.CaregiverOverview })));
const CaregiverLibrary = lazy(() => import('./pages/caregiver/CaregiverLibrary').then(module => ({ default: module.CaregiverLibrary })));
const CaregiverCreateStorybook = lazy(() => import('./pages/caregiver/CaregiverCreateStorybook').then(module => ({ default: module.CaregiverCreateStorybook })));
const CaregiverMemoryDetail = lazy(() => import('./pages/caregiver/CaregiverMemoryDetail').then(module => ({ default: module.CaregiverMemoryDetail })));
const CaregiverPeople = lazy(() => import('./pages/caregiver/CaregiverPeople').then(module => ({ default: module.CaregiverPeople })));
const CaregiverTimeline = lazy(() => import('./pages/caregiver/CaregiverTimeline').then(module => ({ default: module.CaregiverTimeline })));
const CaregiverConnections = lazy(() => import('./pages/caregiver/CaregiverConnections').then(module => ({ default: module.CaregiverConnections })));
const CaregiverRoutine = lazy(() => import('./pages/caregiver/CaregiverRoutine').then(module => ({ default: module.CaregiverRoutine })));
const CaregiverVerification = lazy(() => import('./pages/caregiver/CaregiverVerification').then(module => ({ default: module.CaregiverVerification })));
const CaregiverSettings = lazy(() => import('./pages/caregiver/CaregiverSettings').then(module => ({ default: module.CaregiverSettings })));
const CaregiverFamilyAccess = lazy(() => import('./pages/caregiver/CaregiverFamilyAccess').then(module => ({ default: module.CaregiverFamilyAccess })));

const LoadingGate: React.FC = () => (
  <div className="flex-1 grid place-items-center text-ink-secondary font-semibold">Opening MemoryBridge…</div>
);

const RequireWorkspace: React.FC = () => {
  const { currentUser, isLoading, patientsList } = useApp();
  if (isLoading) return <LoadingGate />;
  if (!currentUser) return <Navigate to="/" replace />;
  if (patientsList.length === 0) return <Navigate to="/setup" replace />;
  return <Outlet />;
};

const RequireAccount: React.FC = () => {
  const { currentUser, isLoading } = useApp();
  if (isLoading) return <LoadingGate />;
  return currentUser ? <Outlet /> : <Navigate to="/" replace />;
};

const RequirePatientSession: React.FC = () => {
  const { currentUser, isLoading, patientsList } = useApp();
  if (isLoading) return <LoadingGate />;
  if (currentUser && patientsList.length === 0) return <Navigate to="/setup" replace />;
  return currentUser || getPatientSessionToken() ? <Outlet /> : <Navigate to="/" replace />;
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-[#FFFDF9] text-[#292521]">
          {/* Global Header Bar with Mode Switcher & Accessibility Controls */}
          <HeaderBar />

          {/* App Route Switcher */}
          <Suspense fallback={<LoadingGate />}>
            <Routes>
            {/* Landing Page */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/join" element={<JoinFamily />} />
            <Route element={<RequireAccount />}>
              <Route path="/setup" element={<SetupPatient />} />
            </Route>

            {/* Patient Companion Experience (/patient/*) */}
            <Route element={<RequirePatientSession />}>
              <Route path="/patient" element={<PatientLayout />}>
                <Route index element={<PatientHome />} />
                <Route path="memories" element={<PatientMemories />} />
                <Route path="family" element={<PatientFamily />} />
                <Route path="timeline" element={<PatientTimeline />} />
                <Route path="music" element={<PatientMusic />} />
                <Route path="journeys" element={<PatientJourneys />} />
                <Route path="diary" element={<PatientDiary />} />
                <Route path="calendar" element={<PatientActivities />} />
                <Route path="activities" element={<PatientActivities />} />
                <Route path="companion" element={<PatientCompanion />} />
              </Route>
            </Route>

            {/* Caregiver Management App (/family/*) */}
            <Route element={<RequireWorkspace />}>
              <Route path="/family" element={<CaregiverLayout />}>
                <Route index element={<CaregiverOverview />} />
                <Route path="library" element={<CaregiverLibrary />} />
                <Route path="create-storybook" element={<CaregiverCreateStorybook />} />
                <Route path="memory/:id" element={<CaregiverMemoryDetail />} />
                <Route path="people" element={<CaregiverPeople />} />
                <Route path="timeline" element={<CaregiverTimeline />} />
                <Route path="connections" element={<CaregiverConnections />} />
                <Route path="companion" element={<PatientCompanion />} />
                <Route path="routine" element={<CaregiverRoutine />} />
                <Route path="verification" element={<CaregiverVerification />} />
                <Route path="settings" element={<CaregiverSettings />} />
                <Route path="access" element={<CaregiverFamilyAccess />} />
              </Route>
            </Route>

            {/* Fallback to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
