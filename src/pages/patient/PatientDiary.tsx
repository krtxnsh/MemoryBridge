import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { speechService } from '../../services';
import { MascotMira } from '../../components/common/MascotMira';
import { ArrowLeft, Volume2, VolumeX, Sun, Coffee, BookOpen, Moon, Heart } from 'lucide-react';

export const PatientDiary: React.FC = () => {
  const navigate = useNavigate();
  const { diary, patientName } = useApp();
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const handleReadDiary = () => {
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
      return;
    }
    const fullText = `${diary.greeting}. Today was ${diary.dateStr}, with ${diary.weather}. In the morning: ${diary.morningNote}. In the afternoon: ${diary.afternoonNote}. In the evening: ${diary.eveningNote}. Goodnight ${patientName}.`;
    setIsSpeaking(true);
    speechService.speak(fullText, () => setIsSpeaking(false));
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full animate-fadeIn pb-8">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/patient')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-warm-sand hover:border-primary shadow-soft text-ink-primary font-semibold transition-all hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 text-primary" />
          <span>Back to Home</span>
        </button>

        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-primary">
          My Daily Memory Diary
        </h1>
      </div>

      {/* Main Sleepy Bedtime Diary Spread (Sofia reference image 2 right view) */}
      <div className="bg-gradient-to-br from-[#FFFDF9] via-[#FFF9F3] to-[#F5ECE1] rounded-3xl border-3 border-warm-sand shadow-soft-lg p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-center paper-texture">
        {/* Left Side: Mascot in sleepy pajamas hugging teddy bear */}
        <div className="w-full md:w-5/12 flex flex-col items-center text-center">
          <MascotMira
            state="sleepy"
            size="xl"
            speechText={`Sleep well, ${patientName}!`}
          />
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-primary mt-4">
            {diary.greeting}
          </h2>
          <p className="text-ink-secondary text-sm mt-1">
            Rest easy knowing tomorrow brings more smiles.
          </p>

          <button
            onClick={handleReadDiary}
            className={`mt-6 w-full max-w-xs flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl font-bold text-base shadow-soft transition-all ${
              isSpeaking
                ? 'bg-primary text-white animate-pulse'
                : 'bg-warm-peach hover:bg-primary-100 text-primary-text border-2 border-primary-200'
            }`}
          >
            {isSpeaking ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-primary" />}
            <span>{isSpeaking ? 'Pause Diary' : 'Read Diary Aloud'}</span>
          </button>
        </div>

        {/* Right Side: Caregiver Written Daily Recap Journal Page */}
        <div className="w-full md:w-7/12 bg-white rounded-2xl border-2 border-[#E8DFC8] p-6 shadow-soft relative flex flex-col justify-between">
          <div>
            {/* Header with Date & Weather */}
            <div className="flex items-center justify-between border-b border-[#E8DFC8] pb-4 mb-4">
              <div className="flex items-center gap-2 text-ink-primary font-bold">
                <Sun className="w-5 h-5 text-amber-500" />
                <span className="font-serif text-lg">{diary.dateStr}</span>
              </div>
              <span className="text-xs sm:text-sm font-semibold px-3 py-1 rounded-full bg-warm-yellow text-amber-900 border border-amber-200">
                {diary.weather}
              </span>
            </div>

            {/* Daily Summary Blocks */}
            <div className="space-y-4 font-serif text-base sm:text-lg text-ink-primary leading-relaxed">
              {/* Morning */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-1">
                  <Coffee className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-sans text-xs font-bold uppercase tracking-wider text-amber-800 block">Morning</span>
                  <p className="mt-0.5">{diary.morningNote}</p>
                </div>
              </div>

              {/* Afternoon */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center shrink-0 mt-1">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-sans text-xs font-bold uppercase tracking-wider text-sky-800 block">Afternoon</span>
                  <p className="mt-0.5">{diary.afternoonNote}</p>
                </div>
              </div>

              {/* Evening */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0 mt-1">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-sans text-xs font-bold uppercase tracking-wider text-purple-800 block">Evening</span>
                  <p className="mt-0.5">{diary.eveningNote}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Caregiver Signoff */}
          <div className="mt-6 pt-4 border-t border-[#E8DFC8] flex items-center justify-between text-xs text-ink-secondary">
            <span className="italic flex items-center gap-1.5 font-sans">
              <Heart className="w-3.5 h-3.5 fill-primary text-primary" />
              <span>{diary.caregiverSign}</span>
            </span>
            <span className="font-bold text-primary-text">Always with you</span>
          </div>
        </div>
      </div>
    </div>
  );
};
