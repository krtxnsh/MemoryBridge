import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { ArrowLeft, MapPin, BookOpen, Volume2, Sparkles, Navigation } from 'lucide-react';
import { Memory } from '../../types';

interface JourneyPin {
  id: string;
  name: string;
  year: number;
  cx: number;
  cy: number;
  memoryId: string;
  count: number;
  description: string;
}

export const PatientJourneys: React.FC = () => {
  const navigate = useNavigate();
  const { memories, patientName } = useApp();

  const journeyPins: JourneyPin[] = [
    {
      id: 'pin-shimla',
      name: 'Shimla Hills',
      year: 1960,
      cx: 280,
      cy: 110,
      memoryId: 'mem-1960',
      count: 1,
      description: 'First red bicycle, crisp mountain air, and childhood joy.'
    },
    {
      id: 'pin-delhi',
      name: 'Delhi & Rose Garden',
      year: 1985,
      cx: 300,
      cy: 180,
      memoryId: 'mem-1985',
      count: 4,
      description: 'St. Stephens college, sacred wedding with Anita, and Diwali diyas.'
    },
    {
      id: 'pin-goa',
      name: 'Calangute, Goa',
      year: 1998,
      cx: 230,
      cy: 330,
      memoryId: 'mem-1998',
      count: 2,
      description: 'Golden sunset on the beach, fresh sweet coconut water with Anita & Riya.'
    },
    {
      id: 'pin-tulips',
      name: 'Tulip Meadows',
      year: 2019,
      cx: 360,
      cy: 160,
      memoryId: 'mem-2019',
      count: 1,
      description: 'Spring flowers, laughing with grandson Daniel and whistling with leaves.'
    }
  ];

  const [activePin, setActivePin] = useState<JourneyPin>(journeyPins[2]); // Goa by default
  const selectedMemory = memories.find(m => m.id === activePin.memoryId) || memories[0];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full animate-fadeIn pb-8">
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
          {patientName}’s Life Journeys & Places
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Illustrated Stylized Map Container (SVG, completely offline) */}
        <div className="lg:col-span-7 bg-[#EBF4F6] rounded-3xl border-3 border-warm-sand shadow-soft-lg p-4 relative overflow-hidden">
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm px-3.5 py-1.5 rounded-xl border border-warm-sand shadow-sm text-xs font-bold text-ink-primary flex items-center gap-2">
            <Navigation className="w-4 h-4 text-primary" />
            <span>Tap any pin to view memories</span>
          </div>

          <svg
            viewBox="0 0 500 440"
            className="w-full h-auto select-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="landGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FCF3CF" />
                <stop offset="50%" stop-color="#FAD7A0" />
                <stop offset="100%" stop-color="#EDBB99" />
              </linearGradient>

              <radialGradient id="oceanGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#E1F5FE" />
                <stop offset="100%" stop-color="#B3E5FC" />
              </radialGradient>
            </defs>

            {/* Ocean background */}
            <rect width="500" height="440" fill="url(#oceanGrad)" rx="20" />

            {/* Decorative ocean waves */}
            <path d="M 40 80 Q 70 70, 100 80 T 160 80" stroke="#81D4FA" stroke-width="2" fill="none" opacity="0.6" />
            <path d="M 50 200 Q 80 190, 110 200 T 170 200" stroke="#81D4FA" stroke-width="2" fill="none" opacity="0.6" />
            <path d="M 380 340 Q 410 330, 440 340" stroke="#81D4FA" stroke-width="2" fill="none" opacity="0.6" />

            {/* Stylized Illustrated Landmass */}
            <path
              d="M 180 40 
                 Q 280 20, 360 50 
                 Q 420 90, 400 160 
                 Q 380 220, 330 260 
                 Q 310 320, 270 380 
                 Q 240 420, 230 400 
                 Q 210 340, 220 280 
                 Q 210 200, 170 140 
                 Q 140 90, 180 40 Z"
              fill="url(#landGrad)"
              stroke="#D4AC0D"
              stroke-width="2"
              opacity="0.85"
            />

            {/* Mountain symbols in north */}
            <polygon points="260,80 275,55 290,80" fill="#797D7F" opacity="0.6" />
            <polygon points="285,80 300,50 315,80" fill="#797D7F" opacity="0.6" />
            <polygon points="310,80 325,58 340,80" fill="#797D7F" opacity="0.6" />

            {/* Connecting memory flight/train dotted lines */}
            <path
              d="M 280 110 Q 290 145, 300 180"
              stroke="#F36B32"
              stroke-width="2.5"
              stroke-dasharray="6 4"
              fill="none"
              opacity="0.7"
            />
            <path
              d="M 300 180 Q 250 240, 230 330"
              stroke="#F36B32"
              stroke-width="2.5"
              stroke-dasharray="6 4"
              fill="none"
              opacity="0.7"
            />
            <path
              d="M 300 180 Q 330 170, 360 160"
              stroke="#F36B32"
              stroke-width="2.5"
              stroke-dasharray="6 4"
              fill="none"
              opacity="0.7"
            />

            {/* INTERACTIVE PINS */}
            {journeyPins.map((pin) => {
              const isActive = activePin.id === pin.id;
              return (
                <g
                  key={pin.id}
                  onClick={() => setActivePin(pin)}
                  className="cursor-pointer transition-transform duration-200"
                  transform={`translate(${pin.cx}, ${pin.cy})`}
                >
                  {/* Pulse ring for active pin */}
                  {isActive && (
                    <circle cx="0" cy="0" r="26" fill="#F36B32" opacity="0.3" className="animate-ping" />
                  )}

                  {/* Pin Drop Pin Body */}
                  <circle cx="0" cy="0" r={isActive ? 18 : 14} fill={isActive ? '#F36B32' : '#292521'} stroke="#FFFFFF" stroke-width="3" />
                  <circle cx="0" cy="0" r={isActive ? 8 : 6} fill="#FFFFFF" />

                  {/* Label flag */}
                  <rect
                    x={isActive ? 22 : 18}
                    y="-14"
                    width={pin.name.length * 8 + 26}
                    height="26"
                    rx="8"
                    fill={isActive ? '#F36B32' : '#FFFFFF'}
                    stroke={isActive ? '#D95424' : '#E9E3DC'}
                    stroke-width="1.5"
                  />
                  <text
                    x={isActive ? 32 : 28}
                    y="3"
                    font-family="'Inter', sans-serif"
                    font-size="11"
                    font-weight="bold"
                    fill={isActive ? '#FFFFFF' : '#292521'}
                  >
                    {pin.name} ({pin.year})
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Journey Spotlight Card */}
        <div className="lg:col-span-5 bg-white rounded-3xl border-3 border-warm-peach shadow-soft-lg p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warm-peach text-primary-text font-bold text-xs">
                <MapPin className="w-3.5 h-3.5" />
                <span>{activePin.year} Journey</span>
              </span>
              <span className="text-xs font-semibold text-ink-secondary">
                {activePin.count} memories
              </span>
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-primary mt-3">
              {activePin.name}
            </h2>
            <p className="text-ink-secondary text-sm sm:text-base mt-2">
              {activePin.description}
            </p>

            {/* Photo from this location */}
            {selectedMemory && (
              <div className="mt-4 rounded-2xl overflow-hidden bg-warm-cream shadow-soft border-2 border-white aspect-[16/10]">
                <img
                  src={selectedMemory.media[0]?.url}
                  alt={selectedMemory.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {selectedMemory && (
              <div className="mt-3 bg-warm-cream/60 p-3 rounded-2xl border border-warm-sand">
                <h4 className="font-bold text-ink-primary text-sm">{selectedMemory.title}</h4>
                <p className="text-ink-secondary text-xs mt-1 line-clamp-2">
                  {selectedMemory.story}
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-warm-sand flex flex-col gap-3">
            {selectedMemory && (
              <button
                onClick={() => navigate(`/patient/memories?album=${selectedMemory.albumId}`)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-primary hover:bg-primary-hover text-white font-semibold shadow-soft hover:scale-105 active:scale-95 transition-transform"
              >
                <BookOpen className="w-5 h-5" />
                <span>Open Memory in Storybook</span>
              </button>
            )}

            <button
              onClick={() => navigate(`/patient/companion?prompt=${encodeURIComponent(`Tell me about my trip to ${activePin.name}`)}`)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-warm-peach hover:bg-primary-100 text-primary-text font-semibold border border-primary-200 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask Mira about this trip</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
