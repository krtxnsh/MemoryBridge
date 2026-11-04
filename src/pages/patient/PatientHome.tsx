import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { 
  BookOpen, 
  Users, 
  History, 
  Music, 
  CalendarDays, 
  MessageCircleHeart,
  Globe,
  BookMarked,
  Sparkles
} from 'lucide-react';

export const PatientHome: React.FC = () => {
  const navigate = useNavigate();
  const { patientName, albums } = useApp();

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full animate-fadeIn">
      {/* Top Warm Greeting */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/70 backdrop-blur-sm p-4 sm:p-5 rounded-3xl border border-warm-peach shadow-soft">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-ink-primary leading-tight">
            Good morning, {patientName}!
          </h1>
          <p className="text-ink-secondary text-base sm:text-lg mt-1 font-medium">
            Would you like to explore a memory together today?
          </p>
        </div>
        <button
          onClick={() => navigate('/patient/companion')}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-primary to-primary-hover text-white font-semibold shadow-soft-md hover:scale-105 active:scale-95 transition-transform shrink-0"
        >
          <Sparkles className="w-5 h-5" />
          <span>Talk with Mira</span>
        </button>
      </div>

      {/* TOP THREE COMPANION CIRCLES (Matching Sofia top row) */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6 bg-gradient-to-r from-white/90 via-[#FFF9F3]/90 to-white/90 p-4 sm:p-6 rounded-3xl border border-warm-sand shadow-soft">
        {/* My Music */}
        <button
          onClick={() => navigate('/patient/music')}
          className="group flex flex-col items-center text-center p-3 sm:p-4 rounded-2xl hover:bg-white hover:shadow-soft transition-all"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#292521] via-[#423C36] to-[#1A1816] flex items-center justify-center text-white shadow-soft-md group-hover:scale-110 transition-transform relative">
            {/* Vinyl record grooves */}
            <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            </div>
          </div>
          <span className="mt-3 font-semibold text-ink-primary text-sm sm:text-base group-hover:text-primary transition-colors">
            My Music
          </span>
          <span className="text-xs text-ink-secondary hidden sm:inline">Calming melodies</span>
        </button>

        {/* My Journeys */}
        <button
          onClick={() => navigate('/patient/journeys')}
          className="group flex flex-col items-center text-center p-3 sm:p-4 rounded-2xl hover:bg-white hover:shadow-soft transition-all"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#4FC3F7] to-[#0288D1] flex items-center justify-center text-white shadow-soft-md group-hover:scale-110 transition-transform relative">
            <Globe className="w-10 h-10 sm:w-12 sm:h-12 text-white/90" />
          </div>
          <span className="mt-3 font-semibold text-ink-primary text-sm sm:text-base group-hover:text-primary transition-colors">
            My Journeys
          </span>
          <span className="text-xs text-ink-secondary hidden sm:inline">Goa, Shimla & more</span>
        </button>

        {/* My Diary */}
        <button
          onClick={() => navigate('/patient/diary')}
          className="group flex flex-col items-center text-center p-3 sm:p-4 rounded-2xl hover:bg-white hover:shadow-soft transition-all"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#A1887F] to-[#5D4037] flex items-center justify-center text-white shadow-soft-md group-hover:scale-110 transition-transform relative border-l-4 border-[#3E2723]">
            <BookMarked className="w-9 h-9 sm:w-11 sm:h-11 text-amber-200" />
          </div>
          <span className="mt-3 font-semibold text-ink-primary text-sm sm:text-base group-hover:text-primary transition-colors">
            My Diary
          </span>
          <span className="text-xs text-ink-secondary hidden sm:inline">Daily family note</span>
        </button>
      </div>

      {/* 3D BOOKSHELF VIEW (Sofia reference middle shelf) */}
      <section className="bg-gradient-to-b from-[#FFFDF9] to-[#F5ECE1] p-4 sm:p-6 rounded-3xl border border-warm-sand shadow-soft">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink-primary">
              Your Memory Storybooks
            </h2>
          </div>
          <button
            onClick={() => navigate('/patient/memories')}
            className="text-primary-text font-semibold hover:underline text-sm sm:text-base"
          >
            View all albums →
          </button>
        </div>

        {/* The Bookshelf grid with realistic 3D book covers */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 relative pb-4">
          {albums.map((album) => (
            <div
              key={album.id}
              onClick={() => navigate(`/patient/memories?album=${album.id}`)}
              className="cursor-pointer group flex flex-col items-center transition-transform hover:-translate-y-2 active:scale-95"
            >
              {/* 3D Book Cover Card */}
              <div 
                className={`w-full aspect-[3/4] max-w-[130px] rounded-xl overflow-hidden shadow-book relative flex flex-col justify-between p-2 border-2 ${
                  album.colorTheme === 'blue' 
                    ? 'bg-gradient-to-br from-[#90CAF9] to-[#42A5F5] border-[#1E88E5]' 
                    : album.colorTheme === 'coral' 
                      ? 'bg-gradient-to-br from-[#FFAB91] to-[#FF7043] border-[#F4511E]' 
                      : album.colorTheme === 'gold' 
                        ? 'bg-gradient-to-br from-[#FFE082] to-[#FFCA28] border-[#FFA000]' 
                        : album.colorTheme === 'sage' 
                          ? 'bg-gradient-to-br from-[#A5D6A7] to-[#66BB6A] border-[#43A047]' 
                          : 'bg-gradient-to-br from-[#FFCC80] to-[#FFA726] border-[#FB8C00]'
                }`}
              >
                {/* Book Spine Shadow Left */}
                <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-black/30 to-transparent pointer-events-none" />

                {/* Inner Framed Photo */}
                <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-white/90 p-1 shadow-sm mt-1">
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="w-full h-full object-cover rounded"
                  />
                </div>

                {/* Book Spine Gold Accent */}
                <div className="text-center pb-1">
                  <span className="text-[10px] sm:text-xs font-bold text-white tracking-wider uppercase drop-shadow-sm line-clamp-1">
                    {album.yearRange}
                  </span>
                </div>
              </div>

              {/* Album Title Below Shelf */}
              <span className="mt-2 text-xs sm:text-sm font-semibold text-ink-primary text-center line-clamp-1 group-hover:text-primary transition-colors">
                {album.title}
              </span>
            </div>
          ))}
        </div>

        {/* Wooden Shelf Bar */}
        <div className="h-4 bg-gradient-to-r from-[#D7CCC8] via-[#BCAAA4] to-[#A1887F] rounded-full shadow-md mt-1 border-t border-white/50" />
      </section>

      {/* SIX LARGE TACTILE CHOICES (Patient Dementia-Friendly UX) */}
      <section>
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink-primary mb-3 px-2">
          What would you like to do?
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. My Memories */}
          <button
            onClick={() => navigate('/patient/memories')}
            className="flex items-center gap-4 p-5 rounded-2xl bg-white border-2 border-warm-peach hover:border-primary shadow-soft hover:shadow-soft-md transition-all text-left group min-h-[88px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-warm-peach flex items-center justify-center text-primary group-hover:scale-110 transition-transform shrink-0">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-ink-primary group-hover:text-primary transition-colors">
                My Memories
              </h3>
              <p className="text-ink-secondary text-sm">Flip through your life photo books</p>
            </div>
          </button>

          {/* 2. My Family */}
          <button
            onClick={() => navigate('/patient/family')}
            className="flex items-center gap-4 p-5 rounded-2xl bg-white border-2 border-warm-peach hover:border-primary shadow-soft hover:shadow-soft-md transition-all text-left group min-h-[88px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#E8F8F5] flex items-center justify-center text-[#117A65] group-hover:scale-110 transition-transform shrink-0">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-ink-primary group-hover:text-primary transition-colors">
                My Family
              </h3>
              <p className="text-ink-secondary text-sm">Anita, Riya, Daniel & loved ones</p>
            </div>
          </button>

          {/* 3. My Life Story */}
          <button
            onClick={() => navigate('/patient/timeline')}
            className="flex items-center gap-4 p-5 rounded-2xl bg-white border-2 border-warm-peach hover:border-primary shadow-soft hover:shadow-soft-md transition-all text-left group min-h-[88px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#FEF8E7] flex items-center justify-center text-[#D97706] group-hover:scale-110 transition-transform shrink-0">
              <History className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-ink-primary group-hover:text-primary transition-colors">
                My Life Story
              </h3>
              <p className="text-ink-secondary text-sm">Your journey through the years</p>
            </div>
          </button>

          {/* 4. Listen to Music */}
          <button
            onClick={() => navigate('/patient/music')}
            className="flex items-center gap-4 p-5 rounded-2xl bg-white border-2 border-warm-peach hover:border-primary shadow-soft hover:shadow-soft-md transition-all text-left group min-h-[88px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#EBF4F6] flex items-center justify-center text-[#2563EB] group-hover:scale-110 transition-transform shrink-0">
              <Music className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-ink-primary group-hover:text-primary transition-colors">
                Listen to Music
              </h3>
              <p className="text-ink-secondary text-sm">Soothing songs from your past</p>
            </div>
          </button>

          {/* 5. Daily Activities & Games */}
          <button
            onClick={() => navigate('/patient/activities')}
            className="flex items-center gap-4 p-5 rounded-2xl bg-white border-2 border-warm-peach hover:border-primary shadow-soft hover:shadow-soft-md transition-all text-left group min-h-[88px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#FDEEE4] flex items-center justify-center text-[#B8431A] group-hover:scale-110 transition-transform shrink-0">
              <CalendarDays className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-ink-primary group-hover:text-primary transition-colors">
                Daily Activities
              </h3>
              <p className="text-ink-secondary text-sm">Relaxing puzzles & morning routine</p>
            </div>
          </button>

          {/* 6. Talk to MemoryBridge */}
          <button
            onClick={() => navigate('/patient/companion')}
            className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-br from-[#FFF5EC] to-[#FED7C3] border-2 border-primary hover:border-primary-hover shadow-soft hover:shadow-soft-md transition-all text-left group min-h-[88px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white group-hover:scale-110 transition-transform shrink-0 shadow-sm">
              <MessageCircleHeart className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-primary-text transition-colors">
                Talk to MemoryBridge
              </h3>
              <p className="text-ink-primary text-sm font-medium">Revisit a memory with Mira</p>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
};
