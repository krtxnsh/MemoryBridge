import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { memoryService, speechService } from '../../services';
import { 
  ArrowLeft, 
  Volume2, 
  VolumeX, 
  MapPin, 
  Calendar, 
  Music, 
  MessageCircleHeart, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Users
} from 'lucide-react';

export const PatientMemories: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedAlbumParam = searchParams.get('album');

  const { memories, albums, people, playSong, songs, voiceEnabled } = useApp();
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>(selectedAlbumParam || 'album-trips');
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Dementia safety: ONLY verified memories in patient app
  const verifiedMemories = memoryService.getVerifiedMemories(memories);
  const filteredMemories = selectedAlbumId === 'all'
    ? verifiedMemories
    : verifiedMemories.filter(m => m.albumId === selectedAlbumId);

  const currentMemory = filteredMemories[activeIndex] || filteredMemories[0] || verifiedMemories[0];

  const handleSelectAlbum = (id: string) => {
    setSelectedAlbumId(id);
    setActiveIndex(0);
    setSearchParams(id === 'all' ? {} : { album: id });
  };

  const handlePlayAudio = (text: string) => {
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    speechService.speak(text, () => {
      setIsSpeaking(false);
    });
  };

  const currentSong = currentMemory?.songId 
    ? songs.find(s => s.id === currentMemory.songId)
    : songs[0];

  const taggedPeople = currentMemory ? people.filter(p => currentMemory.peopleIds.includes(p.id)) : [];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full animate-fadeIn pb-8">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/patient')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-warm-sand hover:border-primary shadow-soft text-ink-primary font-semibold transition-all hover:scale-105 active:scale-95"
          aria-label="Back to Patient Home"
        >
          <ArrowLeft className="w-5 h-5 text-primary" />
          <span>Back to Home</span>
        </button>

        {/* Album Selector Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-2xl no-scrollbar">
          <button
            onClick={() => handleSelectAlbum('all')}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              selectedAlbumId === 'all'
                ? 'bg-primary text-white shadow-soft'
                : 'bg-white/80 text-ink-secondary hover:bg-white hover:text-ink-primary border border-warm-sand'
            }`}
          >
            All Memories ({verifiedMemories.length})
          </button>
          {albums.map((album) => (
            <button
              key={album.id}
              onClick={() => handleSelectAlbum(album.id)}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                selectedAlbumId === album.id
                  ? 'bg-primary text-white shadow-soft'
                  : 'bg-white/80 text-ink-secondary hover:bg-white hover:text-ink-primary border border-warm-sand'
              }`}
            >
              {album.title}
            </button>
          ))}
        </div>
      </div>

      {/* 2-PAGE OPEN STORYBOOK SPREAD (Directly matching Sofia bottom tablet reference) */}
      {currentMemory ? (
        <div className="relative bg-[#FFFDF9] rounded-3xl shadow-soft-lg border-4 border-[#EFE7DC] p-4 sm:p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 paper-texture">
          {/* Subtle center book fold spine */}
          <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-8 -ml-4 bg-gradient-to-r from-black/5 via-transparent to-black/5 pointer-events-none" />

          {/* LEFT PAGE: Photo, Audio button, Song link, First paragraph */}
          <div className="flex-1 flex flex-col justify-between gap-4 border-b md:border-b-0 md:border-r border-[#E8DFC8] pb-6 md:pb-0 md:pr-6">
            <div>
              {/* Photo Frame */}
              <div className="w-full aspect-[16/10] rounded-2xl overflow-hidden bg-white shadow-soft border-2 border-white relative group">
                <img
                  src={currentMemory.media[0]?.url}
                  alt={currentMemory.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur-sm">
                  {currentMemory.year}
                </div>
              </div>

              {/* Title & Metadata Badges */}
              <div className="mt-4">
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-primary leading-snug">
                  {currentMemory.title}
                </h2>
                
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs sm:text-sm text-ink-secondary">
                  <div className="flex items-center gap-1.5 text-primary-text font-medium bg-warm-peach px-2.5 py-1 rounded-lg">
                    <MapPin className="w-4 h-4" />
                    <span>{currentMemory.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-warm-cream px-2.5 py-1 rounded-lg">
                    <Calendar className="w-4 h-4" />
                    <span>{currentMemory.dateStr}</span>
                  </div>
                </div>
              </div>

              {/* Story text */}
              <p className="mt-4 text-ink-primary text-base sm:text-lg leading-relaxed font-normal">
                {currentMemory.story}
              </p>
            </div>

            {/* Bottom Actions on Left Page: Listen to Voice & Song */}
            <div className="pt-4 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
              {/* Audio Read Aloud button */}
              <button
                onClick={() => handlePlayAudio(currentMemory.story)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold shadow-soft transition-all ${
                  isSpeaking 
                    ? 'bg-primary text-white animate-pulse' 
                    : 'bg-warm-peach hover:bg-primary-100 text-primary-text border border-primary-200'
                }`}
                aria-label="Listen to story read aloud"
              >
                {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                <span>{isSpeaking ? 'Pause Reading' : 'Play Story Audio'}</span>
              </button>

              {/* Related Song Pill if present */}
              {currentSong && (
                <button
                  onClick={() => playSong(currentSong)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white hover:bg-warm-cream border border-warm-sand text-ink-primary font-medium text-sm shadow-soft transition-colors"
                  title="Listen to melody connected to this memory"
                >
                  <Music className="w-4 h-4 text-primary" />
                  <span className="truncate max-w-[160px]">{currentSong.title}</span>
                </button>
              )}
            </div>
          </div>

          {/* RIGHT PAGE: Secondary perspective, Tagged family members, AI prompt */}
          <div className="flex-1 flex flex-col justify-between gap-4 md:pl-6">
            <div>
              {/* Tagged People in this memory */}
              {taggedPeople.length > 0 && (
                <div className="mb-4 bg-white p-3.5 rounded-2xl border border-warm-sand shadow-soft">
                  <div className="flex items-center gap-2 text-xs font-bold text-ink-secondary uppercase tracking-wider mb-2">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    <span>Who was with you</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {taggedPeople.map(p => (
                      <button
                        key={p.id}
                        onClick={() => navigate('/patient/family')}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-warm-peach/60 hover:bg-warm-peach border border-primary-100 transition-colors"
                      >
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-white shrink-0">
                          <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-sm font-semibold text-ink-primary">{p.name}</span>
                        <span className="text-xs text-primary-text">({p.relationship})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional photo or reflection */}
              <div className="w-full aspect-[16/10] rounded-2xl overflow-hidden bg-white shadow-soft border-2 border-white relative">
                <img
                  src={currentMemory.media[1]?.url || currentMemory.media[0]?.url}
                  alt={currentMemory.media[0]?.caption || currentMemory.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Caption */}
              <p className="mt-3 text-xs sm:text-sm text-ink-secondary italic bg-white/70 p-2.5 rounded-xl border border-warm-sand">
                "{currentMemory.media[0]?.caption || 'A joyful day preserved in the family storybook.'}"
              </p>

              {/* Verified Family Badge */}
              <div className="mt-4 flex items-center gap-2 text-xs text-[#327A55] bg-[#E8F5E9] px-3 py-1.5 rounded-xl font-medium w-fit border border-[#C8E6C9]">
                <span>✓ Verified by {currentMemory.approvedBy || 'Anita'}</span>
              </div>
            </div>

            {/* Bottom Actions: Ask Mira + Page Navigation */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-[#E8DFC8]/60">
              <button
                onClick={() => navigate(`/patient/companion?prompt=${encodeURIComponent(`Tell me more about ${currentMemory.title}`)}`)}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-primary to-primary-hover text-white font-semibold shadow-soft hover:scale-105 active:scale-95 transition-transform"
              >
                <MessageCircleHeart className="w-5 h-5" />
                <span>Ask Mira about this</span>
              </button>

              {/* Page Turner Controls */}
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setActiveIndex(prev => Math.max(0, prev - 1))}
                  disabled={activeIndex === 0}
                  className="p-3 rounded-xl bg-white border border-warm-sand hover:bg-warm-peach text-ink-primary disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-soft"
                  title="Previous memory page"
                  aria-label="Previous memory page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-semibold text-ink-secondary px-2">
                  {activeIndex + 1} of {filteredMemories.length}
                </span>
                <button
                  onClick={() => setActiveIndex(prev => Math.min(filteredMemories.length - 1, prev + 1))}
                  disabled={activeIndex === filteredMemories.length - 1}
                  className="p-3 rounded-xl bg-white border border-warm-sand hover:bg-warm-peach text-ink-primary disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-soft"
                  title="Next memory page"
                  aria-label="Next memory page"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-warm-sand p-8 shadow-soft">
          <p className="text-lg font-medium text-ink-secondary">No memories found in this album.</p>
          <button
            onClick={() => handleSelectAlbum('all')}
            className="mt-4 px-5 py-2.5 rounded-2xl bg-primary text-white font-semibold shadow-soft"
          >
            Show All Memories
          </button>
        </div>
      )}
    </div>
  );
};
