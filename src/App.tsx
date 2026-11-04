import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import { HeaderBar } from './components/common/HeaderBar';

// Public Landing
import { LandingPage } from './pages/LandingPage';

// Patient App
import { PatientLayout } from './components/patient/PatientLayout';
import { PatientHome } from './pages/patient/PatientHome';
import { PatientMemories } from './pages/patient/PatientMemories';
import { PatientFamily } from './pages/patient/PatientFamily';
import { PatientTimeline } from './pages/patient/PatientTimeline';
import { PatientMusic } from './pages/patient/PatientMusic';
import { PatientJourneys } from './pages/patient/PatientJourneys';
import { PatientDiary } from './pages/patient/PatientDiary';
import { PatientActivities } from './pages/patient/PatientActivities';
import { PatientCompanion } from './pages/patient/PatientCompanion';

// Caregiver App
import { CaregiverLayout } from './components/caregiver/CaregiverLayout';
import { CaregiverOverview } from './pages/caregiver/CaregiverOverview';
import { CaregiverLibrary } from './pages/caregiver/CaregiverLibrary';
import { CaregiverCreateStorybook } from './pages/caregiver/CaregiverCreateStorybook';
import { CaregiverMemoryDetail } from './pages/caregiver/CaregiverMemoryDetail';
import { CaregiverPeople } from './pages/caregiver/CaregiverPeople';
import { CaregiverTimeline } from './pages/caregiver/CaregiverTimeline';
import { CaregiverConnections } from './pages/caregiver/CaregiverConnections';
import { CaregiverRoutine } from './pages/caregiver/CaregiverRoutine';
import { CaregiverVerification } from './pages/caregiver/CaregiverVerification';
import { CaregiverSettings } from './pages/caregiver/CaregiverSettings';

export const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-[#FFFDF9] text-[#292521]">
          {/* Global Header Bar with Mode Switcher & Accessibility Controls */}
          <HeaderBar />

          {/* App Route Switcher */}
          <Routes>
            {/* Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Patient Companion Experience (/patient/*) */}
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

            {/* Caregiver Management App (/family/*) */}
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
            </Route>

            {/* Fallback to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
