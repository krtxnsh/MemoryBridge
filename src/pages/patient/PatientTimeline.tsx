import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { memoryService, speechService } from '../../services';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  VolumeX, 
  BookOpen, 
  Calendar, 
  MapPin,
  Sparkles
} from 'lucide-react';

export const PatientTimeline: React.FC = () => {
  const navigate = useNavigate();
  const { memories, patientName } = useApp();
  const verifiedMemories = memoryService.getVerifiedMemories(memories);

  // Chronologically ordered timeline
  const timelineMemories = [...verifiedMemories].sort((a, b) => a.year - b.year);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const current = timelineMemories[currentIndex] || timelineMemories[0];

  const handleReadAloud = () => {
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
      return;
    }
    const text = `In the year ${current.year}, during ${current.era}: ${current.title}. ${current.story}`;
    setIsSpeaking(true);
    speechService.speak(text, () => setIsSpeaking(false));
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
          {patientName}'s Life Journey
        </h1>
      </div>

      {/* Era Progress Stepper Bar */}
      <div className="bg-white/80 p-3 sm:p-4 rounded-3xl border border-warm-sand shadow-soft flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        {timelineMemories.map((mem, idx) => (
          <button
            key={mem.id}
            onClick={() => {
              setCurrentIndex(idx);
              speechService.stop();
              setIsSpeaking(false);
            }}
            className={`flex flex-col items-center px-3 py-1.5 rounded-2xl transition-all shrink-0 ${
              currentIndex === idx
                ? 'bg-primary text-white shadow-soft font-bold scale-105'
                : 'text-ink-secondary hover:text-ink-primary hover:bg-warm-peach/60'
            }`}
          >
            <span className="text-sm sm:text-base font-bold">{mem.year}</span>
            <span className="text-[11px] opacity-90 line-clamp-1">{mem.era}</span>
          </button>
        ))}
      </div>

      {/* Main Single Era Spotlight Card */}
      {current && (
        <div className="bg-white rounded-3xl border-3 border-warm-sand shadow-soft-lg p-6 sm:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-center">
          {/* Large Photo */}
          <div className="w-full md:w-1/2 aspect-[4/3] rounded-2xl overflow-hidden bg-warm-cream shadow-soft border-2 border-white relative">
            <img
              src={current.media[0]?.url}
              alt={current.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-primary text-white font-bold text-sm shadow-sm">
              {current.year}
            </div>
          </div>

          {/* Era Content */}
          <div className="w-full md:w-1/2 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-text mb-1">
                <span>Era: {current.era}</span>
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-primary leading-tight">
                {current.title}
              </h2>

              <div className="flex items-center gap-2 mt-2 text-sm text-ink-secondary">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{current.location}</span>
              </div>

              <p className="mt-4 font-serif text-lg sm:text-xl text-ink-primary leading-relaxed">
                {current.story}
              </p>
            </div>

            {/* Read Aloud & Storybook Actions */}
            <div className="mt-6 pt-6 border-t border-warm-sand flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleReadAloud}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold shadow-soft transition-all ${
                  isSpeaking
                    ? 'bg-primary text-white animate-pulse'
                    : 'bg-warm-peach hover:bg-primary-100 text-primary-text border border-primary-200'
                }`}
              >
                {isSpeaking ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-primary" />}
                <span>{isSpeaking ? 'Pause Story' : 'Read Era Aloud'}</span>
              </button>

              <button
                onClick={() => navigate(`/patient/memories?album=${current.albumId}`)}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white hover:bg-warm-cream border border-warm-sand text-ink-primary font-semibold shadow-soft"
              >
                <BookOpen className="w-5 h-5 text-primary" />
                <span>Open in Book</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Big Previous / Next Era Buttons */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => {
            setCurrentIndex(prev => Math.max(0, prev - 1));
            speechService.stop();
            setIsSpeaking(false);
          }}
          disabled={currentIndex === 0}
          className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-white border-2 border-warm-sand hover:border-primary text-ink-primary font-bold text-base sm:text-lg shadow-soft disabled:opacity-30 disabled:pointer-events-none transition-all"
        >
          <ChevronLeft className="w-6 h-6 text-primary" />
          <span>Previous Era</span>
        </button>

        <span className="text-sm font-semibold text-ink-secondary">
          {currentIndex + 1} of {timelineMemories.length}
        </span>

        <button
          onClick={() => {
            setCurrentIndex(prev => Math.min(timelineMemories.length - 1, prev + 1));
            speechService.stop();
            setIsSpeaking(false);
          }}
          disabled={currentIndex === timelineMemories.length - 1}
          className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-primary hover:bg-primary-hover text-white font-bold text-base sm:text-lg shadow-soft-md disabled:opacity-30 disabled:pointer-events-none transition-all"
        >
          <span>Next Era</span>
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
