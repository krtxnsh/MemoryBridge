import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MascotMira } from '../components/common/MascotMira';
import { 
  HeartHandshake, 
  BookOpen, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Users, 
  MessageCircleHeart, 
  Music, 
  CalendarCheck,
  CheckCircle2,
  Check
} from 'lucide-react';
import { createSvgPhoto } from '../assets/placeholders';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-warm-wash text-ink-primary selection:bg-warm-peach selection:text-primary-text">
      
      {/* ========================================== */}
      {/* 1. HERO SECTION */}
      {/* ========================================== */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-16 sm:pb-24 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 flex flex-col items-start gap-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-primary-200 shadow-soft text-primary-text font-bold text-xs sm:text-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Personal AI Memory Companion for Dementia & Alzheimer’s Care</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-ink-primary leading-[1.15] tracking-tight">
              Every memory deserves <br />
              <span className="text-primary italic font-serif">to be remembered.</span>
            </h1>

            <p className="font-sans text-lg sm:text-xl text-ink-secondary leading-relaxed max-w-2xl font-normal">
              Bringing families, memories, and meaningful conversations closer together. A comforting tablet companion for loved ones living with memory loss, anchored strictly in family-verified life stories.
            </p>

            {/* Main Action CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto pt-2">
              <button
                onClick={() => navigate('/patient')}
                className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-primary-hover text-white font-bold text-base sm:text-lg shadow-soft-lg hover:scale-105 active:scale-95 transition-all"
              >
                <span>Launch Patient Experience</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => navigate('/family')}
                className="inline-flex items-center justify-center gap-3 px-7 py-4 rounded-2xl bg-white hover:bg-warm-cream text-ink-primary border-2 border-warm-sand font-bold text-base sm:text-lg shadow-soft hover:border-primary transition-all"
              >
                <ShieldCheck className="w-5 h-5 text-primary" />
                <span>Caregiver Dashboard</span>
              </button>
            </div>

            {/* Core Principle Disclaimer */}
            <div className="p-3.5 rounded-2xl bg-white/70 border border-warm-sand backdrop-blur-sm max-w-xl text-xs text-ink-secondary flex items-start gap-2.5">
              <span className="text-primary text-base leading-none">✦</span>
              <p>
                <strong>The MemoryBridge Guarantee:</strong> The AI never invents a person’s past. It speaks only from family-approved memories, offers calming music and photos, and openly says when it doesn't know.
              </p>
            </div>
          </div>

          {/* Hero Right Visual: Elderly & Family album scene + Floating Polaroids */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Soft glowing ambient circle */}
            <div className="absolute w-80 h-80 rounded-full bg-gradient-to-tr from-primary-200/50 to-warm-yellow/60 blur-3xl -z-10" />

            <div className="relative w-full max-w-md aspect-square bg-white rounded-3xl p-6 shadow-soft-lg border-2 border-warm-sand flex flex-col items-center justify-between">
              
              {/* Floating Polaroid 1: Childhood */}
              <div className="absolute -top-6 -left-6 w-36 aspect-[4/5] bg-white p-2 rounded-xl shadow-soft-md border border-warm-sand -rotate-12 hover:rotate-0 transition-transform duration-300 hidden sm:block">
                <img src={createSvgPhoto('childhood', 'Shimla 1960')} alt="Childhood" className="w-full aspect-[4/3] object-cover rounded" />
                <span className="text-[10px] font-bold text-center block mt-1 text-ink-primary">Childhood Bicycle</span>
              </div>

              {/* Floating Polaroid 2: Wedding Day */}
              <div className="absolute -top-4 -right-6 w-36 aspect-[4/5] bg-white p-2 rounded-xl shadow-soft-md border border-warm-sand rotate-12 hover:rotate-0 transition-transform duration-300 hidden sm:block">
                <img src={createSvgPhoto('wedding', 'Wedding 1985')} alt="Wedding Day" className="w-full aspect-[4/3] object-cover rounded" />
                <span className="text-[10px] font-bold text-center block mt-1 text-ink-primary">Wedding Vows</span>
              </div>

              {/* Mascot Center Stage */}
              <div className="my-auto flex flex-col items-center text-center">
                <MascotMira
                  state="celebrating"
                  size="xl"
                  speechText="Hello! I'm Mira. Ready to revisit a beautiful memory?"
                />
                <h3 className="font-serif text-xl font-bold text-ink-primary mt-2">
                  Meet Mira, Memory Companion
                </h3>
                <p className="text-xs text-ink-secondary">
                  Voice-ready, warm, and comforting
                </p>
              </div>

              {/* Floating Polaroid 3: Family Vacation */}
              <div className="absolute -bottom-6 -left-4 w-40 aspect-[4/5] bg-white p-2 rounded-xl shadow-soft-md border border-warm-sand rotate-6 hover:rotate-0 transition-transform duration-300 hidden sm:block">
                <img src={createSvgPhoto('goa', 'Goa 1998')} alt="Family Vacation" className="w-full aspect-[4/3] object-cover rounded" />
                <span className="text-[10px] font-bold text-center block mt-1 text-ink-primary">Family Goa Picnic</span>
              </div>

              {/* Floating Polaroid 4: Grandson Daniel */}
              <div className="absolute -bottom-6 -right-4 w-40 aspect-[4/5] bg-white p-2 rounded-xl shadow-soft-md border border-warm-sand -rotate-6 hover:rotate-0 transition-transform duration-300 hidden sm:block">
                <img src={createSvgPhoto('daniel', 'Joy 2019')} alt="Grandson Daniel" className="w-full aspect-[4/3] object-cover rounded" />
                <span className="text-[10px] font-bold text-center block mt-1 text-ink-primary">Grandson Daniel</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* 2. HOW MEMORYBRIDGE WORKS */}
      {/* ========================================== */}
      <section className="py-16 sm:py-24 bg-white/80 border-t border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-text">
              Thoughtful By Design
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink-primary mt-2">
              How MemoryBridge Works
            </h2>
            <p className="text-ink-secondary text-base sm:text-lg mt-3">
              A dual-app architecture bridging caregivers' dedication with a comforting, dementia-first patient tablet interface.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-warm-cream/50 rounded-3xl p-8 border border-warm-sand flex flex-col justify-between hover:shadow-soft transition-shadow">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-warm-peach text-primary flex items-center justify-center font-serif text-xl font-bold mb-6">
                  1
                </div>
                <h3 className="font-serif text-2xl font-bold text-ink-primary">
                  Caregivers Curate
                </h3>
                <p className="text-ink-secondary text-sm sm:text-base mt-3 leading-relaxed">
                  Family members upload vintage photos, recordings, and recollections. The 4-step wizard generates warm, deterministic story drafts without hallucinations.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-warm-sand/80 text-xs text-primary-text font-bold">
                ✓ Verification Queue Safeguards
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-warm-cream/50 rounded-3xl p-8 border border-warm-sand flex flex-col justify-between hover:shadow-soft transition-shadow">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#E8F8F5] text-[#117A65] flex items-center justify-center font-serif text-xl font-bold mb-6">
                  2
                </div>
                <h3 className="font-serif text-2xl font-bold text-ink-primary">
                  Instant Verification Sync
                </h3>
                <p className="text-ink-secondary text-sm sm:text-base mt-3 leading-relaxed">
                  Once a family member verifies a memory, it immediately updates the shared memory store. Unverified drafts remain safely masked from the patient.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-warm-sand/80 text-xs text-[#117A65] font-bold">
                ✓ Zero Hallucinations Guaranteed
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-warm-cream/50 rounded-3xl p-8 border border-warm-sand flex flex-col justify-between hover:shadow-soft transition-shadow">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#FEF8E7] text-[#D97706] flex items-center justify-center font-serif text-xl font-bold mb-6">
                  3
                </div>
                <h3 className="font-serif text-2xl font-bold text-ink-primary">
                  Patient Reconnects
                </h3>
                <p className="text-ink-secondary text-sm sm:text-base mt-3 leading-relaxed">
                  The patient explores albums as 3D book covers, listens to voice readouts, plays gentle cognitive puzzles, and converses with Mira in calm, comforting dialogue.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-warm-sand/80 text-xs text-[#D97706] font-bold">
                ✓ 56px+ Touch Targets & Voice-First
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* 3. FOUR CORE CAPABILITIES */}
      {/* ========================================== */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary-text">
              Emotional & Cognitive Care
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink-primary mt-2">
              Preserve Precious Memories & Reconnect Through Gentle Conversation
            </h2>
            <p className="text-ink-secondary text-base sm:text-lg mt-4 leading-relaxed">
              Designed specifically around the cognitive realities of mild cognitive impairment and early Alzheimer's disease.
            </p>

            <ul className="space-y-4 mt-6">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#327A55]/10 text-[#327A55] flex items-center justify-center shrink-0 mt-1">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-ink-primary text-base">3D Interactive Open-Spread Storybooks</h4>
                  <p className="text-xs sm:text-sm text-ink-secondary">Modeled on traditional photo albums with two-page spreads, voice narration, and tagged loved ones.</p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#327A55]/10 text-[#327A55] flex items-center justify-center shrink-0 mt-1">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-ink-primary text-base">Pressure-Free Cognitive Games</h4>
                  <p className="text-xs sm:text-sm text-ink-secondary">Photo jigsaw puzzles, family face-matching, and digital colouring with zero timers, scores, or wrong buzzers.</p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#327A55]/10 text-[#327A55] flex items-center justify-center shrink-0 mt-1">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-ink-primary text-base">Soothing Musical Connections</h4>
                  <p className="text-xs sm:text-sm text-ink-secondary">Vinyl record player interface connecting memorable melodies to specific life eras without surprise autoplay.</p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#327A55]/10 text-[#327A55] flex items-center justify-center shrink-0 mt-1">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-ink-primary text-base">Bedtime Daily Memory Diary</h4>
                  <p className="text-xs sm:text-sm text-ink-secondary">Caregiver-penned warm recaps of the day read aloud gently by Sleepy Mira with tea and sunshine reflections.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-white via-warm-cream to-[#FFF5EC] p-8 rounded-3xl border-2 border-warm-sand shadow-soft-lg flex flex-col items-center text-center">
            <MascotMira state="reading" size="2xl" />
            <h3 className="font-serif text-2xl font-bold text-ink-primary mt-4">
              "Tell me about my Goa trip, Mira."
            </h3>
            <p className="text-sm text-ink-secondary mt-2 max-w-md italic">
              "Of course, Rajiv! Your family visited Goa in 1998. Anita and Riya were with you. You walked on the golden sand and enjoyed sweet coconut water at sunset."
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => navigate('/patient/companion')}
                className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-soft"
              >
                Try the Companion Dialogue →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* 4. FOOTER */}
      {/* ========================================== */}
      <footer className="mt-auto py-12 bg-white border-t border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-ink-secondary">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <span className="font-serif font-bold text-base text-ink-primary">MemoryBridge</span>
            <span>· Supportive Companion for Dementia & Alzheimer’s Care</span>
          </div>

          <div className="flex items-center gap-4 font-semibold">
            <button onClick={() => navigate('/patient')} className="hover:text-primary transition-colors">
              Patient App
            </button>
            <button onClick={() => navigate('/family')} className="hover:text-primary transition-colors">
              Caregiver Hub
            </button>
            <button onClick={() => navigate('/family/settings')} className="hover:text-primary transition-colors">
              Preferences
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
