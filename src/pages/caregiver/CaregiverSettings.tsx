import React, { useState } from 'react';
import { useApp } from '../../store/AppContext';
import { 
  Settings as SettingsIcon, 
  RotateCcw, 
  Volume2, 
  Type, 
  User, 
  Bell, 
  ShieldCheck, 
  CheckCircle2 
} from 'lucide-react';

export const CaregiverSettings: React.FC = () => {
  const { 
    patientName, 
    textSize, 
    setTextSize, 
    voiceEnabled, 
    setVoiceEnabled, 
    resetDemoData 
  } = useApp();

  const [confirmReset, setConfirmReset] = useState(false);

  const handleReset = () => {
    resetDemoData();
    setConfirmReset(false);
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-primary">
          Caregiver Settings & Preferences
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          Configure patient experience, voice narration, display sizes, and demo data state.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-surface-border p-6 sm:p-8 shadow-soft space-y-6">
        {/* Patient Profile Setting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
          <div>
            <h3 className="font-serif text-lg font-bold text-ink-primary flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <span>Primary Patient Name</span>
            </h3>
            <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
              Used in all companion voice greetings and personal storybook headers.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={patientName}
              className="px-4 py-2 rounded-xl bg-warm-cream border border-surface-border text-sm font-semibold text-ink-primary w-40"
            />
          </div>
        </div>

        {/* Text Size Accessibility */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
          <div>
            <h3 className="font-serif text-lg font-bold text-ink-primary flex items-center gap-2">
              <Type className="w-5 h-5 text-primary" />
              <span>Patient Display Text Size</span>
            </h3>
            <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
              Enlarges touch targets and text throughout the tablet companion screens.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-warm-cream p-1 rounded-2xl border border-surface-border">
            {(['normal', 'large', 'xlarge'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setTextSize(size)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  textSize === size
                    ? 'bg-primary text-white shadow-soft'
                    : 'text-ink-secondary hover:text-ink-primary'
                }`}
              >
                {size === 'normal' ? 'Standard' : size === 'large' ? 'Large (+20%)' : 'Extra Large'}
              </button>
            ))}
          </div>
        </div>

        {/* Voice Read-Aloud Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
          <div>
            <h3 className="font-serif text-lg font-bold text-ink-primary flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-primary" />
              <span>Voice Narration & TTS Assistance</span>
            </h3>
            <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
              Speaks memory stories, daily diary entries, and AI companion answers aloud.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={voiceEnabled}
              onChange={(e) => setVoiceEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {/* Reset Demo Data */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <h3 className="font-serif text-lg font-bold text-ink-primary flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-600" />
              <span>Reset Prototype Demo Data</span>
            </h3>
            <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
              Clears localStorage and restores initial verified memories, timeline, and pending queue.
            </p>
          </div>
          <button
            onClick={() => setConfirmReset(true)}
            className="px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors shadow-sm"
          >
            Reset Demo Data
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-surface-border animate-fadeIn">
            <h3 className="font-serif text-xl font-bold text-ink-primary">
              Reset Demo Data to Original?
            </h3>
            <p className="text-sm text-ink-secondary mt-2">
              This will restore all default albums (Childhood, Wedding, Goa, etc.), clear any created test stories, and reset routine items.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setConfirmReset(false)}
                className="px-4 py-2 text-sm font-semibold text-ink-secondary hover:bg-warm-cream rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary-hover text-white rounded-xl shadow-soft"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
