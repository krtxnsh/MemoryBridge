import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { Song } from '../../types';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Disc, 
  BookOpen, 
  Volume2, 
  SkipForward, 
  SkipBack, 
  Heart
} from 'lucide-react';

export const PatientMusic: React.FC = () => {
  const navigate = useNavigate();
  const { songs, memories, activeSong, isPlayingMusic, playSong, pauseSong } = useApp();
  
  const [currentSong, setCurrentSong] = useState<Song>(activeSong || songs[0]);
  const [progress, setProgress] = useState<number>(35);

  useEffect(() => {
    if (activeSong) {
      setCurrentSong(activeSong);
    }
  }, [activeSong]);

  // Gentle progress bar simulation if music is playing
  useEffect(() => {
    if (!isPlayingMusic) return;
    const interval = setInterval(() => {
      setProgress(p => (p >= 100 ? 0 : p + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlayingMusic]);

  const relatedMemory = currentSong?.relatedMemoryId 
    ? memories.find(m => m.id === currentSong.relatedMemoryId)
    : null;

  const handleTogglePlay = (song: Song) => {
    if (currentSong?.id === song.id && isPlayingMusic) {
      pauseSong();
    } else {
      setCurrentSong(song);
      playSong(song);
    }
  };

  const handleNext = () => {
    const idx = songs.findIndex(s => s.id === currentSong.id);
    const nextSong = songs[(idx + 1) % songs.length];
    setCurrentSong(nextSong);
    if (isPlayingMusic) playSong(nextSong);
  };

  const handlePrev = () => {
    const idx = songs.findIndex(s => s.id === currentSong.id);
    const prevSong = songs[(idx - 1 + songs.length) % songs.length];
    setCurrentSong(prevSong);
    if (isPlayingMusic) playSong(prevSong);
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
          My Favorite Melodies
        </h1>
      </div>

      {/* Main Music Player Card (Sofia reference turntable view) */}
      <div className="bg-gradient-to-br from-[#FFFDF9] via-[#FFF8F0] to-[#F5ECE1] rounded-3xl border-3 border-warm-sand shadow-soft-lg p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-center">
        {/* Animated Vinyl Record Turntable */}
        <div className="relative flex items-center justify-center">
          {/* Turntable wooden base */}
          <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-3xl bg-[#EFE6DC] shadow-inner p-4 flex items-center justify-center border-2 border-warm-sand">
            {/* Spinning Vinyl Record */}
            <div 
              className={`w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-gradient-to-br from-[#1A1816] via-[#2E2925] to-[#121110] shadow-2xl flex items-center justify-center relative border-4 border-[#3D3732] ${
                isPlayingMusic ? 'animate-spin' : ''
              }`}
              style={{ animationDuration: '14s' }}
            >
              {/* Concentric grooves */}
              <div className="w-48 h-48 rounded-full border border-white/10" />
              <div className="w-40 h-40 rounded-full border border-white/10 absolute" />
              <div className="w-32 h-32 rounded-full border border-white/10 absolute" />

              {/* Center Song Label */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-primary-hover p-2 flex flex-col items-center justify-center text-center shadow-md absolute text-white">
                <span className="text-[10px] font-bold tracking-tight uppercase line-clamp-1">{currentSong.era}</span>
                <span className="text-xs font-serif font-bold leading-tight line-clamp-2">{currentSong.title}</span>
                <div className="w-3 h-3 rounded-full bg-white mt-1" />
              </div>
            </div>

            {/* Turntable needle arm */}
            <div 
              className={`absolute top-2 right-4 w-12 h-28 border-r-4 border-t-4 border-[#786F66] rounded-tr-2xl transform origin-top-right transition-transform duration-700 pointer-events-none ${
                isPlayingMusic ? 'rotate-12' : '-rotate-12'
              }`}
            >
              <div className="w-3 h-6 bg-[#A1887F] rounded -bottom-2 -left-1 absolute" />
            </div>
          </div>
        </div>

        {/* Player Controls & Song Info */}
        <div className="flex-1 flex flex-col justify-between w-full">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warm-peach text-primary-text font-bold text-xs uppercase tracking-wider mb-2">
              <Disc className="w-3.5 h-3.5" />
              <span>Memories of {currentSong.era}</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink-primary leading-tight">
              {currentSong.title}
            </h2>
            <p className="text-lg font-medium text-ink-secondary mt-1">
              {currentSong.artist}
            </p>
            <p className="text-sm text-ink-secondary mt-3 italic bg-white/70 p-3 rounded-2xl border border-warm-sand">
              "{currentSong.note}"
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="w-full bg-[#E5DDD2] h-3 rounded-full overflow-hidden shadow-inner">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-semibold text-ink-secondary mt-2">
              <span>1:12</span>
              <span>{currentSong.duration}</span>
            </div>
          </div>

          {/* Big Tactile Audio Buttons */}
          <div className="mt-6 flex items-center justify-center gap-6">
            <button
              onClick={handlePrev}
              className="w-14 h-14 rounded-2xl bg-white border border-warm-sand hover:bg-warm-peach text-ink-primary flex items-center justify-center shadow-soft active:scale-95 transition-all"
              aria-label="Previous melody"
            >
              <SkipBack className="w-6 h-6 text-primary" />
            </button>

            <button
              onClick={() => handleTogglePlay(currentSong)}
              className="w-20 h-20 rounded-3xl bg-primary hover:bg-primary-hover text-white flex items-center justify-center shadow-soft-lg active:scale-95 hover:scale-105 transition-all"
              aria-label={isPlayingMusic ? "Pause music" : "Play music"}
            >
              {isPlayingMusic ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-1 fill-white" />}
            </button>

            <button
              onClick={handleNext}
              className="w-14 h-14 rounded-2xl bg-white border border-warm-sand hover:bg-warm-peach text-ink-primary flex items-center justify-center shadow-soft active:scale-95 transition-all"
              aria-label="Next melody"
            >
              <SkipForward className="w-6 h-6 text-primary" />
            </button>
          </div>

          {/* Connected Memory Card Link */}
          {relatedMemory && (
            <div 
              onClick={() => navigate(`/patient/memories?album=${relatedMemory.albumId}`)}
              className="mt-6 bg-white p-3.5 rounded-2xl border border-warm-sand hover:border-primary shadow-soft flex items-center justify-between cursor-pointer group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-warm-cream shrink-0 shadow-sm">
                  <img src={relatedMemory.media[0]?.url} alt={relatedMemory.title} className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="text-xs font-bold text-primary-text uppercase">Connected Memory</span>
                  <h4 className="font-semibold text-ink-primary text-sm group-hover:text-primary transition-colors">
                    {relatedMemory.title} ({relatedMemory.year})
                  </h4>
                </div>
              </div>
              <span className="text-sm font-semibold text-primary hover:underline">
                Go to memory →
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Playlist Grid */}
      <div>
        <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink-primary mb-3">
          Songs You Might Like
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {songs.map((song) => {
            const isThisPlaying = currentSong?.id === song.id && isPlayingMusic;
            return (
              <div
                key={song.id}
                onClick={() => handleTogglePlay(song)}
                className={`p-4 rounded-2xl flex items-center justify-between border cursor-pointer transition-all ${
                  currentSong?.id === song.id
                    ? 'bg-warm-peach/80 border-primary shadow-soft'
                    : 'bg-white hover:bg-warm-cream/50 border-warm-sand shadow-soft'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm text-white ${
                    song.id === 'song-goa' ? 'bg-[#29B6F6]' : song.id === 'song-wedding' ? 'bg-[#FF7043]' : 'bg-[#66BB6A]'
                  }`}>
                    {isThisPlaying ? <Volume2 className="w-6 h-6 animate-pulse" /> : <Disc className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-ink-primary text-base">
                      {song.title}
                    </h4>
                    <span className="text-xs text-ink-secondary">{song.artist} · {song.duration}</span>
                  </div>
                </div>

                <button
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-105 ${
                    isThisPlaying ? 'bg-primary text-white' : 'bg-warm-cream text-ink-primary hover:bg-warm-peach'
                  }`}
                  aria-label={isThisPlaying ? "Pause this song" : "Play this song"}
                >
                  {isThisPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5 fill-current" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
