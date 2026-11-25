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

      {/* FOUR PRIMARY ACTIONS — the main, low-load decision surface */}
      <section aria-label="Main choices">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. Talk to Mira (flagship) */}
          <button
            onClick={() => navigate('/patient/companion')}
            className="flex items-center gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#FFF5EC] to-[#FED7C3] border-2 border-primary hover:border-primary-hover shadow-soft hover:shadow-soft-md transition-all text-left group min-h-[112px]"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white group-hover:scale-110 transition-transform shrink-0 shadow-sm">
              <MessageCircleHeart className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-primary-text">Talk to Mira</h3>
              <p className="text-ink-primary text-sm sm:text-base font-medium">Revisit a memory together</p>
            </div>
          </button>

          {/* 2. My Memories */}
          <button
            onClick={() => navigate('/patient/memories')}
            className="flex items-center gap-4 p-5 sm:p-6 rounded-3xl bg-white border-2 border-warm-peach hover:border-primary shadow-soft hover:shadow-soft-md transition-all text-left group min-h-[112px]"
          >
            <div className="w-16 h-16 rounded-2xl bg-warm-peach flex items-center justify-center text-primary group-hover:scale-110 transition-transform shrink-0">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink-primary group-hover:text-primary transition-colors">My Memories</h3>
              <p className="text-ink-secondary text-sm sm:text-base">Your life photo books</p>
            </div>
          </button>

          {/* 3. My Family */}
          <button
            onClick={() => navigate('/patient/family')}
            className="flex items-center gap-4 p-5 sm:p-6 rounded-3xl bg-white border-2 border-warm-peach hover:border-primary shadow-soft hover:shadow-soft-md transition-all text-left group min-h-[112px]"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#E8F8F5] flex items-center justify-center text-[#117A65] group-hover:scale-110 transition-transform shrink-0">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink-primary group-hover:text-primary transition-colors">My Family</h3>
              <p className="text-ink-secondary text-sm sm:text-base">The people who love you</p>
            </div>
          </button>

          {/* 4. Listen to Music */}
          <button
            onClick={() => navigate('/patient/music')}
            className="flex items-center gap-4 p-5 sm:p-6 rounded-3xl bg-white border-2 border-warm-peach hover:border-primary shadow-soft hover:shadow-soft-md transition-all text-left group min-h-[112px]"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#EBF4F6] flex items-center justify-center text-[#2563EB] group-hover:scale-110 transition-transform shrink-0">
              <Music className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink-primary group-hover:text-primary transition-colors">Listen to Music</h3>
              <p className="text-ink-secondary text-sm sm:text-base">Soothing songs you love</p>
            </div>
          </button>
        </div>
      </section>

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

      {/* MORE TO EXPLORE — secondary, visually lighter so it doesn't compete
          with the four primary actions above. */}
      <section>
        <h2 className="font-serif text-lg sm:text-xl font-bold text-ink-secondary mb-3 px-2">
          More to explore
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* My Life Story */}
          <button
            onClick={() => navigate('/patient/timeline')}
            className="flex flex-col items-center text-center gap-2 p-4 rounded-2xl bg-white/70 border border-warm-sand hover:border-primary hover:bg-white transition-all group min-h-[96px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#FEF8E7] flex items-center justify-center text-[#D97706] group-hover:scale-110 transition-transform shrink-0">
              <History className="w-6 h-6" />
            </div>
            <span className="font-semibold text-ink-primary text-sm group-hover:text-primary transition-colors">My Life Story</span>
          </button>

          {/* Daily Activities */}
          <button
            onClick={() => navigate('/patient/activities')}
            className="flex flex-col items-center text-center gap-2 p-4 rounded-2xl bg-white/70 border border-warm-sand hover:border-primary hover:bg-white transition-all group min-h-[96px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#FDEEE4] flex items-center justify-center text-[#B8431A] group-hover:scale-110 transition-transform shrink-0">
              <CalendarDays className="w-6 h-6" />
            </div>
            <span className="font-semibold text-ink-primary text-sm group-hover:text-primary transition-colors">Daily Activities</span>
          </button>

          {/* My Journeys */}
          <button
            onClick={() => navigate('/patient/journeys')}
            className="flex flex-col items-center text-center gap-2 p-4 rounded-2xl bg-white/70 border border-warm-sand hover:border-primary hover:bg-white transition-all group min-h-[96px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#E3F2FD] flex items-center justify-center text-[#0288D1] group-hover:scale-110 transition-transform shrink-0">
              <Globe className="w-6 h-6" />
            </div>
            <span className="font-semibold text-ink-primary text-sm group-hover:text-primary transition-colors">My Journeys</span>
          </button>

          {/* My Diary */}
          <button
            onClick={() => navigate('/patient/diary')}
            className="flex flex-col items-center text-center gap-2 p-4 rounded-2xl bg-white/70 border border-warm-sand hover:border-primary hover:bg-white transition-all group min-h-[96px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#EFEBE9] flex items-center justify-center text-[#5D4037] group-hover:scale-110 transition-transform shrink-0">
              <BookMarked className="w-6 h-6" />
            </div>
            <span className="font-semibold text-ink-primary text-sm group-hover:text-primary transition-colors">My Diary</span>
          </button>
        </div>
      </section>
    </div>
  );
};
