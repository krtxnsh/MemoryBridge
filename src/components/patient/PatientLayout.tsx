import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, Calendar, BookOpen, Mic, Music, Compass, BookMarked, Sparkles } from 'lucide-react';
import { MascotMira } from '../common/MascotMira';
import { useApp } from '../../store/AppContext';
import { speechService } from '../../services';

export const PatientLayout: React.FC = () => {
  const navigate = useNavigate();
  const { textSize, patientName, voiceEnabled } = useApp();
  const [micActive, setMicActive] = useState(false);

  const getTextClass = () => {
    if (textSize === 'large') return 'text-xl';
    if (textSize === 'xlarge') return 'text-2xl';
    return 'text-base';
  };

  const handleMicClick = () => {
    setMicActive(true);
    if (voiceEnabled) {
      speechService.speak(`Hello ${patientName}! I'm listening. How can I help you today?`, () => {
        setMicActive(false);
      });
    } else {
      setTimeout(() => setMicActive(false), 2000);
    }
    navigate('/patient/companion');
  };

  return (
    <div className={`min-h-[calc(100vh-60px)] bg-warm-wash p-2 sm:p-4 md:p-6 lg:p-8 flex items-center justify-center ${getTextClass()}`}>
      {/* Tablet Bezel Container */}
      <div className="w-full max-w-6xl bg-[#201C19] p-3 sm:p-4 md:p-6 rounded-[2rem] sm:rounded-[2.5rem] md:rounded-[3rem] shadow-2xl border-4 border-[#3D3732] transition-all">
        {/* Tablet Inner Screen */}
        <div className="bg-[#FFFDF9] rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.25rem] min-h-[620px] md:min-h-[720px] overflow-hidden flex flex-col md:flex-row shadow-inner border border-surface-border">
          
          {/* SLIM LEFT RAIL (Sofia style) */}
          <aside className="w-full md:w-56 bg-gradient-to-b from-[#FFF5EC] to-[#F7EFE6] border-b md:border-b-0 md:border-r border-[#E9E1D8] p-4 flex flex-row md:flex-col justify-between items-center md:items-stretch select-none shrink-0">
            {/* Top Navigation Buttons */}
            <div className="flex flex-row md:flex-col gap-2 sm:gap-3 w-full justify-around md:justify-start">
              <NavLink
                to="/patient"
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3.5 rounded-2xl transition-all font-semibold ${
                    isActive
                      ? 'bg-primary text-white shadow-soft-md scale-[1.02]'
                      : 'bg-white/80 text-ink-primary hover:bg-white hover:text-primary shadow-sm border border-warm-sand'
                  }`
                }
                aria-label="Go to Home"
              >
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Home className="w-5 h-5" />
                </div>
                <span className="text-base sm:text-lg">Home</span>
              </NavLink>

              <NavLink
                to="/patient/calendar"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3.5 rounded-2xl transition-all font-semibold ${
                    isActive
                      ? 'bg-primary text-white shadow-soft-md scale-[1.02]'
                      : 'bg-white/80 text-ink-primary hover:bg-white hover:text-primary shadow-sm border border-warm-sand'
                  }`
                }
                aria-label="Daily Routine and Activities"
              >
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-base sm:text-lg">Calendar</span>
              </NavLink>

              <NavLink
                to="/patient/memories"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3.5 rounded-2xl transition-all font-semibold ${
                    isActive
                      ? 'bg-primary text-white shadow-soft-md scale-[1.02]'
                      : 'bg-white/80 text-ink-primary hover:bg-white hover:text-primary shadow-sm border border-warm-sand'
                  }`
                }
                aria-label="View Memory Albums"
              >
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-base sm:text-lg">Memory</span>
              </NavLink>
            </div>

            {/* Sub-menu on desktop for quick exploration */}
            <div className="hidden md:flex flex-col gap-1.5 py-4 border-t border-b border-[#E9E1D8]/60 my-2">
              <span className="text-xs uppercase font-bold text-ink-secondary tracking-wider px-2">Quick Visit</span>
              <NavLink
                to="/patient/music"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-ink-secondary hover:text-ink-primary hover:bg-white/60 text-sm font-medium transition-colors"
              >
                <Music className="w-4 h-4 text-primary" />
                <span>My Music</span>
              </NavLink>
              <NavLink
                to="/patient/journeys"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-ink-secondary hover:text-ink-primary hover:bg-white/60 text-sm font-medium transition-colors"
              >
                <Compass className="w-4 h-4 text-primary" />
                <span>My Journeys</span>
              </NavLink>
              <NavLink
                to="/patient/diary"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-ink-secondary hover:text-ink-primary hover:bg-white/60 text-sm font-medium transition-colors"
              >
                <BookMarked className="w-4 h-4 text-primary" />
                <span>My Diary</span>
              </NavLink>
            </div>

            {/* Bottom Mascot & Large Mic Button (Sofia reference corner) */}
            <div className="hidden md:flex flex-col items-center pt-2">
              <NavLink to="/patient/companion" className="group flex flex-col items-center">
                <MascotMira
                  state={micActive ? 'listening' : 'reading'}
                  size="md"
                  speechText="Talk to me anytime!"
                />
              </NavLink>

              <button
                onClick={handleMicClick}
                className={`mt-2 w-14 h-14 rounded-full flex items-center justify-center shadow-soft-lg transition-transform hover:scale-105 active:scale-95 ${
                  micActive 
                    ? 'bg-primary animate-pulse text-white ring-4 ring-primary-200' 
                    : 'bg-white text-ink-primary hover:text-primary border-2 border-primary-200'
                }`}
                title="Tap to talk to MemoryBridge companion"
                aria-label="Talk to me microphone"
              >
                <Mic className="w-7 h-7" />
              </button>
              <span className="text-xs font-semibold text-ink-secondary mt-1.5">Talk to me</span>
            </div>
          </aside>

          {/* MAIN CALM PANEL */}
          <main className="flex-1 bg-gradient-to-br from-[#FFFDF9] via-[#FFF8F0] to-[#F5EFE6] p-4 sm:p-6 md:p-8 flex flex-col overflow-y-auto min-h-[500px]">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
