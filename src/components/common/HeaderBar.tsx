import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { Volume2, VolumeX, Type, Music, ShieldCheck, HeartHandshake, Home } from 'lucide-react';

export const HeaderBar: React.FC = () => {
  const location = useLocation();
  const { 
    textSize, 
    setTextSize, 
    voiceEnabled, 
    setVoiceEnabled, 
    activeSong, 
    isPlayingMusic, 
    pauseSong, 
    playSong,
    toast 
  } = useApp();

  const isPatientApp = location.pathname.startsWith('/patient');
  const isCaregiverApp = location.pathname.startsWith('/family');
  const isLanding = location.pathname === '/';

  const cycleTextSize = () => {
    if (textSize === 'normal') setTextSize('large');
    else if (textSize === 'large') setTextSize('xlarge');
    else setTextSize('normal');
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#FFFDF9]/90 backdrop-blur-md border-b border-surface-border px-4 py-2.5 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Brand Logo & Mode Title */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white shadow-soft group-hover:scale-105 transition-transform">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <span className="font-serif text-lg font-bold text-ink-primary tracking-tight group-hover:text-primary transition-colors">
                  MemoryBridge
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-warm-peach text-primary-text border border-primary-200">
                  {isPatientApp ? "Patient Companion Mode" : isCaregiverApp ? "Caregiver Management" : "Prototype"}
                </span>
              </div>
            </Link>
          </div>

          {/* Mode Switcher Nav Buttons */}
          <nav className="flex items-center gap-1.5 sm:gap-2 bg-warm-cream/80 p-1 rounded-2xl border border-warm-sand" aria-label="Mode Navigation">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                isLanding 
                  ? 'bg-white text-ink-primary shadow-soft font-semibold' 
                  : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Overview</span>
            </Link>
            <Link
              to="/patient"
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                isPatientApp 
                  ? 'bg-primary text-white shadow-soft font-semibold' 
                  : 'text-ink-secondary hover:text-ink-primary hover:bg-white/50'
              }`}
            >
              <span>👵</span>
              <span>Patient App</span>
            </Link>
            <Link
              to="/family"
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                isCaregiverApp 
                  ? 'bg-ink-primary text-white shadow-soft font-semibold' 
                  : 'text-ink-secondary hover:text-ink-primary hover:bg-white/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-primary-300" />
              <span>Caregiver</span>
            </Link>
          </nav>

          {/* Accessibility & Audio Controls */}
          <div className="flex items-center gap-2">
            {/* Active Song Floating Mini-pill */}
            {activeSong && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-warm-peach border border-primary-200 rounded-full text-xs text-primary-text animate-pulse">
                <Music className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                <span className="truncate max-w-[120px] font-medium">{activeSong.title}</span>
                <button 
                  onClick={() => isPlayingMusic ? pauseSong() : playSong(activeSong)} 
                  className="font-bold underline ml-1 hover:text-primary-hover"
                  aria-label={isPlayingMusic ? "Pause music" : "Resume music"}
                >
                  {isPlayingMusic ? 'Pause' : 'Play'}
                </button>
              </div>
            )}

            {/* Accessibility Font Size Toggle */}
            <button
              onClick={cycleTextSize}
              className="p-2 rounded-xl bg-warm-cream hover:bg-warm-peach text-ink-secondary hover:text-ink-primary transition-colors flex items-center gap-1 border border-surface-border text-xs"
              title={`Current text size: ${textSize}. Tap to toggle.`}
              aria-label="Toggle text size"
            >
              <Type className="w-4 h-4 text-primary" />
              <span className="uppercase font-bold text-[10px] hidden sm:inline">{textSize === 'normal' ? 'A' : textSize === 'large' ? 'A+' : 'A++'}</span>
            </button>

            {/* Voice toggle */}
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-2 rounded-xl border transition-colors ${
                voiceEnabled 
                  ? 'bg-warm-peach text-primary border-primary-200' 
                  : 'bg-warm-cream text-ink-muted border-surface-border'
              }`}
              title={voiceEnabled ? 'Voice assistance enabled' : 'Voice assistance muted'}
              aria-label={voiceEnabled ? 'Mute voice assistance' : 'Enable voice assistance'}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Persistent Toast Feedback Banner */}
      {toast && (
        <div 
          role="status" 
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 max-w-md animate-bounce-short"
        >
          <div className={`px-4 py-3 rounded-2xl shadow-soft-lg flex items-center gap-3 border ${
            toast.type === 'success' 
              ? 'bg-[#327A55] text-white border-[#276344]' 
              : toast.type === 'amber' 
                ? 'bg-[#D97706] text-white border-[#B45309]' 
                : 'bg-ink-primary text-white border-ink-secondary'
          }`}>
            <span className="text-lg">
              {toast.type === 'success' ? '✓' : toast.type === 'amber' ? 'ℹ' : '✦'}
            </span>
            <p className="text-sm font-medium leading-snug">{toast.message}</p>
          </div>
        </div>
      )}
    </>
  );
};
