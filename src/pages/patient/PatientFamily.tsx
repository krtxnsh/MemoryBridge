import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { speechService } from '../../services';
import { ArrowLeft, Volume2, VolumeX, Heart, BookOpen, Sparkles } from 'lucide-react';
import { Person } from '../../types';

export const PatientFamily: React.FC = () => {
  const navigate = useNavigate();
  const { people, memories } = useApp();
  const [selectedPerson, setSelectedPerson] = useState<Person>(people[1] || people[0]); // Anita by default
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const sharedMemories = memories.filter(
    m => m.status === 'verified' && m.peopleIds.includes(selectedPerson.id)
  );

  const handleReadBio = (person: Person) => {
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
      return;
    }
    const textToSpeak = `This is ${person.name}, your ${person.relationship}. ${person.bio}`;
    setIsSpeaking(true);
    speechService.speak(textToSpeak, () => setIsSpeaking(false));
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full animate-fadeIn pb-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/patient')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-warm-sand hover:border-primary shadow-soft text-ink-primary font-semibold transition-all hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 text-primary" />
          <span>Back to Home</span>
        </button>

        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-primary">
          My Beloved Family & Friends
        </h1>
      </div>

      {/* Grid of Big Face Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        {people.map((person) => {
          const isSelected = selectedPerson.id === person.id;
          return (
            <button
              key={person.id}
              onClick={() => {
                setSelectedPerson(person);
                handleReadBio(person);
              }}
              className={`p-3 sm:p-4 rounded-3xl flex flex-col items-center text-center transition-all min-h-[140px] ${
                isSelected
                  ? 'bg-gradient-to-b from-[#FFF0E7] to-[#FED7C3] border-3 border-primary shadow-soft-md scale-105'
                  : 'bg-white hover:bg-warm-peach/40 border-2 border-warm-sand shadow-soft'
              }`}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden shadow-soft border-3 border-white mb-2 relative">
                <img
                  src={person.avatarUrl}
                  alt={person.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-ink-primary line-clamp-1">
                {person.name}
              </h3>
              <span className="text-xs sm:text-sm font-semibold text-primary-text mt-0.5">
                {person.relationship}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Person Spotlight Card */}
      {selectedPerson && (
        <div className="bg-white rounded-3xl border-3 border-warm-peach shadow-soft-lg p-6 sm:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          {/* Large Portrait on Left */}
          <div className="w-full md:w-56 flex flex-col items-center shrink-0 text-center">
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden shadow-soft-lg border-4 border-warm-peach relative">
              <img
                src={selectedPerson.avatarUrl}
                alt={selectedPerson.name}
                className="w-full h-full object-cover"
              />
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-primary mt-4">
              {selectedPerson.name}
            </h2>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-warm-peach text-primary-text font-bold text-sm mt-1">
              <Heart className="w-4 h-4 fill-primary text-primary" />
              <span>{selectedPerson.relationship}</span>
            </div>

            <button
              onClick={() => handleReadBio(selectedPerson)}
              className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold shadow-soft transition-all ${
                isSpeaking 
                  ? 'bg-primary text-white animate-pulse' 
                  : 'bg-warm-cream hover:bg-warm-peach text-ink-primary border border-warm-sand'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-primary" />}
              <span>{isSpeaking ? 'Stop Voice' : 'Hear Who This Is'}</span>
            </button>
          </div>

          {/* Details & Shared Memories */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
                About {selectedPerson.name}
              </span>
              <p className="mt-2 font-serif text-xl sm:text-2xl text-ink-primary leading-relaxed">
                {selectedPerson.bio}
              </p>

              {/* Verified family confirmation */}
              <div className="mt-4 flex items-center gap-2 text-xs text-[#327A55] bg-[#E8F5E9] px-3 py-1.5 rounded-xl font-medium w-fit border border-[#C8E6C9]">
                <span>✓ Confirmed family relationship</span>
              </div>
            </div>

            {/* Shared Memories Row */}
            <div className="mt-6 pt-6 border-t border-warm-sand">
              <h3 className="font-serif text-lg font-bold text-ink-primary mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <span>Shared Memories with {selectedPerson.name} ({sharedMemories.length})</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sharedMemories.map(m => (
                  <div
                    key={m.id}
                    onClick={() => navigate(`/patient/memories?album=${m.albumId}`)}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-warm-cream/60 hover:bg-warm-peach border border-warm-sand cursor-pointer transition-colors group"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-white shrink-0 shadow-sm">
                      <img src={m.media[0]?.url} alt={m.title} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-ink-primary text-sm group-hover:text-primary transition-colors line-clamp-1">
                        {m.title}
                      </h4>
                      <span className="text-xs text-ink-secondary">{m.year} · {m.location}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Ask Mira button */}
              <div className="mt-4">
                <button
                  onClick={() => navigate(`/patient/companion?prompt=${encodeURIComponent(`Tell me about my shared memories with ${selectedPerson.name}`)}`)}
                  className="inline-flex items-center gap-2 text-primary-text font-semibold hover:underline text-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Ask Mira more about {selectedPerson.name} →</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
