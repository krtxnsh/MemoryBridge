import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { MascotMira } from '../../components/common/MascotMira';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  Sparkles, 
  RotateCcw, 
  Brush, 
  Palette, 
  Heart,
  Grid,
  Puzzle,
  Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { createSvgAvatar } from '../../assets/placeholders';

export const PatientActivities: React.FC = () => {
  const navigate = useNavigate();
  const { routine, toggleRoutineCompleted, patientName, updateDiary } = useApp();

  const [activeTab, setActiveTab] = useState<'routine' | 'jigsaw' | 'coloring' | 'matching'>('routine');

  // ==========================================
  // JIGSAW PUZZLE STATE
  // ==========================================
  // 3x3 grid of indices 0..8.
  const [jigsawPieces, setJigsawPieces] = useState<number[]>([1, 4, 0, 7, 3, 8, 2, 5, 6]);
  const [jigsawSelected, setJigsawSelected] = useState<number | null>(null);
  const [jigsawCompleted, setJigsawCompleted] = useState<boolean>(false);

  const handleTileClick = (index: number) => {
    if (jigsawCompleted) return;
    if (jigsawSelected === null) {
      setJigsawSelected(index);
    } else {
      // Swap pieces
      const newPieces = [...jigsawPieces];
      const temp = newPieces[jigsawSelected];
      newPieces[jigsawSelected] = newPieces[index];
      newPieces[index] = temp;
      setJigsawPieces(newPieces);
      setJigsawSelected(null);

      // Check if solved: [0, 1, 2, 3, 4, 5, 6, 7, 8]
      const isSolved = newPieces.every((val, idx) => val === idx);
      if (isSolved) {
        setJigsawCompleted(true);
        confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
      }
    }
  };

  const handleSolveJigsaw = () => {
    setJigsawPieces([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    setJigsawCompleted(true);
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
  };

  const handleResetJigsaw = () => {
    setJigsawPieces([1, 4, 0, 7, 3, 8, 2, 5, 6]);
    setJigsawSelected(null);
    setJigsawCompleted(false);
  };

  // ==========================================
  // COLORING ACTIVITY STATE
  // ==========================================
  const colors = ['#F36B32', '#F1C40F', '#27AE60', '#2980B9', '#8E44AD', '#E74C3C', '#E67E22', '#D7CCC8'];
  const [selectedColor, setSelectedColor] = useState<string>('#F36B32');
  const [coloredSections, setColoredSections] = useState<Record<string, string>>({
    boyShirt: '#2980B9',
    girlDress: '#FADBD8',
    sky: '#E1F5FE',
    tree: '#A9DFBF'
  });

  const handleColorSection = (sectionKey: string) => {
    setColoredSections(prev => ({ ...prev, [sectionKey]: selectedColor }));
  };

  // ==========================================
  // MEMORY MATCHING GRID STATE (4x4)
  // ==========================================
  const cardsTemplate = [
    { id: 1, name: 'Anita', color: '#FADBD8', rel: 'Wife' },
    { id: 2, name: 'Riya', color: '#D5F5E3', rel: 'Daughter' },
    { id: 3, name: 'Daniel', color: '#FEF8E7', rel: 'Grandson' },
    { id: 4, name: 'Suresh', color: '#E8F8F5', rel: 'Friend' },
    { id: 5, name: 'Bicycle', color: '#FCF3CF', rel: '1960' },
    { id: 6, name: 'Wedding', color: '#FDEBD0', rel: '1985' },
    { id: 7, name: 'Goa', color: '#AED6F1', rel: '1998' },
    { id: 8, name: 'Diwali', color: '#FAD7A0', rel: '2001' }
  ];

  // 16 cards (8 pairs)
  const [matchingCards] = useState(() => {
    const double = [...cardsTemplate, ...cardsTemplate].map((item, idx) => ({
      ...item,
      uniqueId: idx
    }));
    // Fisher-Yates deterministic shuffle
    return double.sort((a, b) => ((a.uniqueId * 17 + 3) % 19) - ((b.uniqueId * 17 + 3) % 19));
  });

  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [matchedIds, setMatchedIds] = useState<number[]>([]);
  const [showHint, setShowHint] = useState<boolean>(false);

  const handleCardClick = (uniqueId: number) => {
    if (flippedIds.includes(uniqueId) || matchedIds.includes(uniqueId)) return;
    if (flippedIds.length === 2) return;

    const newFlipped = [...flippedIds, uniqueId];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      const card1 = matchingCards.find(c => c.uniqueId === newFlipped[0]);
      const card2 = matchingCards.find(c => c.uniqueId === newFlipped[1]);

      if (card1 && card2 && card1.id === card2.id) {
        // Matched!
        setTimeout(() => {
          setMatchedIds(prev => [...prev, newFlipped[0], newFlipped[1]]);
          setFlippedIds([]);
          if (matchedIds.length + 2 >= matchingCards.length) {
            confetti({ particleCount: 50 });
          }
        }, 500);
      } else {
        // Gentle reset without buzzer
        setTimeout(() => {
          setFlippedIds([]);
        }, 1200);
      }
    }
  };

  const handleResetMatching = () => {
    setFlippedIds([]);
    setMatchedIds([]);
    setShowHint(false);
  };

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
          Daily Routine & Mind Games
        </h1>
      </div>

      {/* Tabs Switcher for Routine vs Cognitive Games */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-warm-sand shadow-soft overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('routine')}
          className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 ${
            activeTab === 'routine'
              ? 'bg-primary text-white shadow-soft'
              : 'text-ink-secondary hover:text-ink-primary hover:bg-warm-cream'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Daily Schedule</span>
        </button>

        <button
          onClick={() => setActiveTab('jigsaw')}
          className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 ${
            activeTab === 'jigsaw'
              ? 'bg-primary text-white shadow-soft'
              : 'text-ink-secondary hover:text-ink-primary hover:bg-warm-cream'
          }`}
        >
          <Puzzle className="w-4 h-4" />
          <span>Photo Jigsaw</span>
        </button>

        <button
          onClick={() => setActiveTab('coloring')}
          className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 ${
            activeTab === 'coloring'
              ? 'bg-primary text-white shadow-soft'
              : 'text-ink-secondary hover:text-ink-primary hover:bg-warm-cream'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Warm Colouring</span>
        </button>

        <button
          onClick={() => setActiveTab('matching')}
          className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 ${
            activeTab === 'matching'
              ? 'bg-primary text-white shadow-soft'
              : 'text-ink-secondary hover:text-ink-primary hover:bg-warm-cream'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Face Matching</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. DAILY SCHEDULE / ROUTINE VIEW (Sofia reference image 2 left) */}
      {/* ======================================================== */}
      {activeTab === 'routine' && (
        <div className="bg-white rounded-3xl border-3 border-warm-sand shadow-soft-lg p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-warm-sand">
            <div>
              <h2 className="font-serif text-2xl font-bold text-ink-primary">
                Today's Gentle Rhythm
              </h2>
              <p className="text-sm text-ink-secondary mt-1">
                Take your time with each moment. You can mark items as done whenever you're ready.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warm-peach text-primary-text font-bold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>No rush, no stress</span>
            </div>
          </div>

          <div className="space-y-4">
            {routine.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleRoutineCompleted(item.id)}
                className={`p-4 sm:p-5 rounded-2xl border-2 flex items-center justify-between gap-4 cursor-pointer transition-all ${
                  item.completed
                    ? 'bg-[#F2F9F5] border-[#A3D9C9] opacity-75'
                    : 'bg-warm-cream/50 hover:bg-warm-peach/50 border-warm-sand shadow-soft'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                      item.completed ? 'bg-[#327A55] text-white' : 'bg-white text-ink-primary border border-warm-sand shadow-sm'
                    }`}
                  >
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-warm-sand text-ink-secondary">
                        {item.time}
                      </span>
                      <span className="text-xs font-semibold text-primary-text">
                        {item.period}
                      </span>
                    </div>
                    <h3 className={`font-serif text-lg sm:text-xl font-bold mt-1 ${item.completed ? 'line-through text-ink-muted' : 'text-ink-primary'}`}>
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
                      {item.notes}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold px-3 py-1 rounded-xl bg-white border border-warm-sand text-ink-primary shrink-0">
                  {item.completed ? 'Completed ✓' : 'Tap to mark done'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. PHOTO JIGSAW PUZZLE (Sofia reference image 5 left) */}
      {/* ======================================================== */}
      {activeTab === 'jigsaw' && (
        <div className="bg-gradient-to-br from-[#FFFDF9] via-[#FFF9F3] to-[#F5ECE1] rounded-3xl border-3 border-warm-sand shadow-soft-lg p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-center">
          {/* Left: Mascot Speech Panel */}
          <div className="w-full md:w-5/12 flex flex-col items-center text-center">
            <MascotMira
              state={jigsawCompleted ? 'celebrating' : 'thinking'}
              size="lg"
              speechText={
                jigsawCompleted
                  ? `Yaaay! ${patientName}, look, the whole picture is complete! Should we save this memory note in your diary?`
                  : `Tap two squares to swap their places. Take all the time you like!`
              }
            />

            {jigsawCompleted ? (
              <div className="mt-4 flex flex-col gap-2.5 w-full max-w-xs">
                <button
                  onClick={() => {
                    updateDiary({ eveningNote: `Completed a sweet photo jigsaw with grandson Daniel laughing in the flowers.` });
                    navigate('/patient/diary');
                  }}
                  className="py-3 px-5 rounded-2xl bg-primary text-white font-bold shadow-soft hover:scale-105 active:scale-95 transition-transform"
                >
                  Save Note to Diary →
                </button>
                <button
                  onClick={handleResetJigsaw}
                  className="py-2.5 px-4 rounded-2xl bg-white border border-warm-sand text-ink-primary font-semibold text-sm hover:bg-warm-cream"
                >
                  Play Puzzle Again
                </button>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={handleSolveJigsaw}
                  className="py-2 px-3.5 rounded-xl bg-warm-peach text-primary-text font-semibold text-xs border border-primary-200 hover:bg-primary-100 flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Show me solved picture</span>
                </button>
                <button
                  onClick={handleResetJigsaw}
                  className="py-2 px-3.5 rounded-xl bg-white text-ink-secondary font-semibold text-xs border border-warm-sand hover:bg-warm-cream flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Shuffle</span>
                </button>
              </div>
            )}
          </div>

          {/* Right: 3x3 Jigsaw Board */}
          <div className="w-full md:w-7/12 flex flex-col items-center">
            <div className="p-3 bg-white rounded-3xl border-3 border-warm-sand shadow-soft-lg">
              <div className="grid grid-cols-3 gap-2 w-72 h-72 sm:w-80 sm:h-80 bg-warm-cream rounded-2xl p-2 border-2 border-warm-sand">
                {jigsawPieces.map((pieceNum, index) => {
                  const isSelected = jigsawSelected === index;
                  // Calculate background position of the 3x3 split
                  const row = Math.floor(pieceNum / 3);
                  const col = pieceNum % 3;
                  const xPercent = col * 50;
                  const yPercent = row * 50;

                  return (
                    <button
                      key={index}
                      onClick={() => handleTileClick(index)}
                      className={`relative rounded-xl overflow-hidden shadow-sm transition-transform border-2 active:scale-95 ${
                        isSelected
                          ? 'border-primary ring-4 ring-primary-200 scale-105 z-10'
                          : 'border-white hover:border-warm-peach'
                      }`}
                      style={{
                        backgroundImage: `url(${createSvgAvatar('DK', '#FEF8E7', 'Daniel')})`,
                        backgroundSize: '300% 300%',
                        backgroundPosition: `${xPercent}% ${yPercent}%`
                      }}
                      aria-label={`Tile ${index + 1}`}
                    >
                      {/* Subtle number helper */}
                      <span className="absolute bottom-1 right-1.5 text-[10px] font-bold bg-black/40 text-white px-1.5 py-0.5 rounded-md">
                        {pieceNum + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="mt-3 text-xs font-semibold text-ink-secondary text-center">
              Grandson Daniel in the flower meadow · Tap two pieces to swap
            </p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. COLOURING ACTIVITY (Sofia reference image 5 top right) */}
      {/* ======================================================== */}
      {activeTab === 'coloring' && (
        <div className="bg-white rounded-3xl border-3 border-warm-sand shadow-soft-lg p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-center">
          {/* Left: Mascot & Tools */}
          <div className="w-full md:w-5/12 flex flex-col items-center text-center">
            <MascotMira
              state="reading"
              size="lg"
              speechText={`Here is your coloring picture! Pick a color below, then tap any part of the drawing.`}
            />

            {/* Color Palette Chips */}
            <div className="mt-6 w-full max-w-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary mb-2 block">
                Choose a Warm Color
              </span>
              <div className="flex flex-wrap justify-center gap-2.5 p-3 rounded-2xl bg-warm-cream border border-warm-sand">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`w-9 h-9 rounded-full shadow-sm transition-transform ${
                      selectedColor === c ? 'scale-125 ring-3 ring-ink-primary' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right: Interactive SVG Coloring Canvas */}
          <div className="w-full md:w-7/12 flex flex-col items-center">
            <div className="p-4 bg-warm-white rounded-3xl border-3 border-warm-sand shadow-soft-lg w-full max-w-md">
              <svg
                viewBox="0 0 320 280"
                className="w-full h-auto cursor-pointer"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Sky */}
                <rect
                  x="10"
                  y="10"
                  width="300"
                  height="160"
                  rx="12"
                  fill={coloredSections.sky}
                  onClick={() => handleColorSection('sky')}
                  stroke="#292521"
                  strokeWidth="2"
                />

                {/* Sun */}
                <circle
                  cx="50"
                  cy="50"
                  r="24"
                  fill="#F1C40F"
                  stroke="#292521"
                  strokeWidth="2"
                />

                {/* Tree foliage */}
                <circle
                  cx="260"
                  cy="110"
                  r="36"
                  fill={coloredSections.tree}
                  onClick={() => handleColorSection('tree')}
                  stroke="#292521"
                  strokeWidth="2"
                />
                <rect x="254" y="146" width="12" height="40" fill="#795548" stroke="#292521" strokeWidth="2" />

                {/* Ground Grass */}
                <rect
                  x="10"
                  y="170"
                  width="300"
                  height="100"
                  rx="8"
                  fill="#C8E6C9"
                  stroke="#292521"
                  strokeWidth="2"
                />

                {/* Friendly Character / Boy Shirt */}
                <g onClick={() => handleColorSection('boyShirt')}>
                  <circle cx="125" cy="110" r="26" fill="#FFE0B2" stroke="#292521" strokeWidth="2" />
                  <path d="M100 136 L150 136 L160 210 L90 210 Z" fill={coloredSections.boyShirt} stroke="#292521" strokeWidth="2" />
                  <circle cx="118" cy="108" r="3" fill="#292521" />
                  <circle cx="132" cy="108" r="3" fill="#292521" />
                  <path d="M120 120 Q125 125, 130 120" stroke="#292521" strokeWidth="2" fill="none" />
                </g>

                {/* Girl / Loved one hugging */}
                <g onClick={() => handleColorSection('girlDress')}>
                  <circle cx="175" cy="120" r="24" fill="#FED7C3" stroke="#292521" strokeWidth="2" />
                  <path d="M155 144 L195 144 L205 210 L145 210 Z" fill={coloredSections.girlDress} stroke="#292521" strokeWidth="2" />
                  <circle cx="168" cy="118" r="3" fill="#292521" />
                  <circle cx="182" cy="118" r="3" fill="#292521" />
                  <path d="M170 128 Q175 133, 180 128" stroke="#292521" strokeWidth="2" fill="none" />
                </g>
              </svg>
            </div>

            <p className="mt-3 text-xs font-semibold text-ink-secondary text-center">
              Tap anywhere on the drawing to fill with your chosen color
            </p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. FAMILY PHOTO MATCHING GRID (Sofia reference image 5 bottom right) */}
      {/* ======================================================== */}
      {activeTab === 'matching' && (
        <div className="bg-white rounded-3xl border-3 border-warm-sand shadow-soft-lg p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-center">
          {/* Left: Mascot & Controls */}
          <div className="w-full md:w-5/12 flex flex-col items-center text-center">
            <MascotMira
              state={matchedIds.length === matchingCards.length ? 'celebrating' : 'idle'}
              size="lg"
              speechText={
                matchedIds.length === matchingCards.length
                  ? `Wonderful job, ${patientName}! You found all the matching family cards!`
                  : `Tap any card to turn it over and find its matching friend. There is no rush at all.`
              }
            />

            <div className="mt-6 flex flex-col gap-2.5 w-full max-w-xs">
              <button
                onClick={() => setShowHint(prev => !prev)}
                className="py-3 px-4 rounded-2xl bg-warm-peach text-primary-text font-bold text-sm border border-primary-200 hover:bg-primary-100 flex items-center justify-center gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                <span>{showHint ? 'Hide Hints' : 'Show Me a Hint'}</span>
              </button>

              <button
                onClick={handleResetMatching}
                className="py-2.5 px-4 rounded-2xl bg-warm-cream text-ink-secondary font-semibold text-sm hover:bg-warm-peach/60 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play from Beginning</span>
              </button>
            </div>
          </div>

          {/* Right: 4x4 Grid of Cards */}
          <div className="w-full md:w-7/12 flex flex-col items-center">
            <div className="grid grid-cols-4 gap-2.5 sm:gap-3 p-3 rounded-3xl bg-warm-cream border-2 border-warm-sand shadow-inner">
              {matchingCards.map((card) => {
                const isFlipped = flippedIds.includes(card.uniqueId) || matchedIds.includes(card.uniqueId) || showHint;
                const isMatched = matchedIds.includes(card.uniqueId);

                return (
                  <button
                    key={card.uniqueId}
                    onClick={() => handleCardClick(card.uniqueId)}
                    className={`w-14 h-18 sm:w-18 sm:h-24 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 font-bold border-2 active:scale-95 shadow-soft ${
                      isFlipped
                        ? 'border-primary shadow-soft-md'
                        : 'bg-gradient-to-br from-[#FED7C3] to-[#F5ECE1] border-white text-primary text-xl'
                    }`}
                    style={isFlipped ? { backgroundColor: card.color } : undefined}
                    aria-label={isFlipped ? `${card.name} (${card.rel})` : "Card facedown"}
                  >
                    {isFlipped ? (
                      <div className="text-center p-1">
                        <span className="text-xs sm:text-sm font-bold text-ink-primary block leading-tight">{card.name}</span>
                        <span className="text-[10px] text-primary-text font-semibold">{card.rel}</span>
                        {isMatched && <span className="text-xs text-[#327A55] block">✓</span>}
                      </div>
                    ) : (
                      <span className="font-serif text-2xl font-bold text-primary">?</span>
                    )}
                  </button>
                );
              })}
            </div>

            <p className="mt-3 text-xs font-semibold text-ink-secondary text-center">
              Pairs found: {matchedIds.length / 2} of 8 · Zero timer, gentle encouragement
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
