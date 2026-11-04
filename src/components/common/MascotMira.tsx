import React from 'react';

export type MascotState = 
  | 'idle' 
  | 'waving' 
  | 'listening' 
  | 'thinking' 
  | 'speaking' 
  | 'reading' 
  | 'celebrating' 
  | 'sleepy';

interface MascotMiraProps {
  state?: MascotState;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  speechText?: string;
}

export const MascotMira: React.FC<MascotMiraProps> = ({
  state = 'idle',
  size = 'md',
  className = '',
  speechText
}) => {
  const sizeMap = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
    xl: 'w-60 h-60',
    '2xl': 'w-72 h-72'
  };

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* Optional Speech Bubble above mascot */}
      {speechText && (
        <div className="mb-3 max-w-xs bg-white/95 backdrop-blur-sm border border-warm-peach px-4 py-2.5 rounded-2xl shadow-soft text-ink-primary text-sm font-medium leading-relaxed relative animate-fadeIn">
          {speechText}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white" />
        </div>
      )}

      {/* Mira Vector SVG Component */}
      <svg
        viewBox="0 0 200 220"
        className={`${sizeMap[size]} transition-all duration-300 filter drop-shadow-md`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={`Mira companion character in ${state} mode`}
      >
        <defs>
          {/* Gradients for warm 3D soft clay look */}
          <radialGradient id="skinGrad" cx="45%" cy="40%" r="55%">
            <stop offset="0%" stop-color="#FFF0E5" />
            <stop offset="65%" stop-color="#FED7C3" />
            <stop offset="100%" stop-color="#F5B799" />
          </radialGradient>

          <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#5D4037" />
            <stop offset="100%" stop-color="#3E2723" />
          </linearGradient>

          <linearGradient id="dressGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#80CBC4" />
            <stop offset="100%" stop-color="#4DB6AC" />
          </linearGradient>

          <linearGradient id="pajamaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#E1F5FE" />
            <stop offset="100%" stop-color="#B3E5FC" />
          </linearGradient>

          <linearGradient id="bookGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#D95424" />
            <stop offset="100%" stop-color="#F36B32" />
          </linearGradient>
        </defs>

        {/* Shadow base */}
        <ellipse cx="100" cy="206" rx="55" ry="10" fill="#292521" opacity="0.12" />

        {/* ================= BACKGROUND ACCESSORIES (HEADPHONES / SLEEPY CAP / CONFETTI) ================= */}
        {state === 'listening' && (
          <g className="animate-pulse">
            {/* Soft sound waves */}
            <circle cx="100" cy="85" r="75" stroke="#F36B32" stroke-width="2" stroke-dasharray="6 6" opacity="0.35" />
            <circle cx="100" cy="85" r="90" stroke="#F36B32" stroke-width="1.5" opacity="0.2" />
            {/* Headphones band */}
            <path d="M52 82 C52 46, 148 46, 148 82" stroke="#5D4037" stroke-width="6" fill="none" stroke-linecap="round" />
            {/* Ear pads */}
            <rect x="44" y="70" width="14" height="26" rx="7" fill="#F36B32" />
            <rect x="142" y="70" width="14" height="26" rx="7" fill="#F36B32" />
          </g>
        )}

        {state === 'celebrating' && (
          <g>
            <circle cx="35" cy="40" r="4" fill="#F36B32" />
            <circle cx="165" cy="45" r="5" fill="#F1C40F" />
            <circle cx="45" cy="75" r="3" fill="#27AE60" />
            <circle cx="155" cy="80" r="4" fill="#E67E22" />
            <polygon points="100,20 104,30 115,30 106,37 110,47 100,41 90,47 94,37 85,30 96,30" fill="#F39C12" opacity="0.85" />
          </g>
        )}

        {/* Back Hair */}
        <ellipse cx="100" cy="95" rx="50" ry="46" fill="url(#hairGrad)" />

        {/* Body / Clothing */}
        {state === 'sleepy' ? (
          // Sleepy Pajamas
          <g>
            <path d="M68 140 C68 132, 132 132, 132 140 L140 195 C140 200, 60 200, 60 195 Z" fill="url(#pajamaGrad)" />
            {/* Soft pajama stars */}
            <circle cx="85" cy="160" r="2" fill="#F39C12" />
            <circle cx="115" cy="170" r="2" fill="#F39C12" />
            <circle cx="95" cy="180" r="2" fill="#F39C12" />
          </g>
        ) : (
          // Standard Dress / Pinafore
          <g>
            <path d="M72 136 C72 128, 128 128, 128 136 L138 195 C138 200, 62 200, 62 195 Z" fill="url(#dressGrad)" />
            {/* Apricot inner shirt collar */}
            <path d="M85 130 Q100 144, 115 130" stroke="#FFFDF9" stroke-width="4" fill="none" stroke-linecap="round" />
            {/* Cute pocket */}
            <path d="M92 165 C92 162, 108 162, 108 165 L106 177 C106 180, 94 180, 94 177 Z" fill="#3B9E94" opacity="0.5" />
          </g>
        )}

        {/* Little Legs / Shoes */}
        <ellipse cx="84" cy="198" rx="10" ry="6" fill="#8D6E63" />
        <ellipse cx="116" cy="198" rx="10" ry="6" fill="#8D6E63" />

        {/* Head */}
        <circle cx="100" cy="90" r="38" fill="url(#skinGrad)" />

        {/* Front Hair Bangs and Hair Bow */}
        <path d="M66 84 C70 60, 130 60, 134 84 C120 72, 80 72, 66 84 Z" fill="url(#hairGrad)" />
        {/* Hair side strands */}
        <path d="M64 82 C60 100, 62 114, 68 118" stroke="url(#hairGrad)" stroke-width="7" stroke-linecap="round" fill="none" />
        <path d="M136 82 C140 100, 138 114, 132 118" stroke="url(#hairGrad)" stroke-width="7" stroke-linecap="round" fill="none" />

        {/* Hair Bow (light sky blue) */}
        {state !== 'sleepy' && (
          <g transform="translate(100, 52)">
            <ellipse cx="-12" cy="0" rx="9" ry="6" fill="#64B5F6" transform="rotate(-15)" />
            <ellipse cx="12" cy="0" rx="9" ry="6" fill="#64B5F6" transform="rotate(15)" />
            <circle cx="0" cy="0" r="4.5" fill="#2196F3" />
          </g>
        )}

        {/* Sleepy Nightcap */}
        {state === 'sleepy' && (
          <g>
            <path d="M72 68 C80 30, 140 25, 148 55 C154 75, 126 72, 126 72 Z" fill="#90CAF9" />
            <circle cx="152" cy="60" r="7" fill="#FFF59D" />
            <circle cx="95" cy="48" r="2.5" fill="#FFFFFF" />
            <circle cx="118" cy="40" r="2" fill="#FFFFFF" />
          </g>
        )}

        {/* Cheeks */}
        <ellipse cx="78" cy="98" rx="6" ry="3.5" fill="#F88A58" opacity="0.45" />
        <ellipse cx="122" cy="98" rx="6" ry="3.5" fill="#F88A58" opacity="0.45" />

        {/* EYES AND EXPRESSIONS BASED ON STATE */}
        {state === 'sleepy' ? (
          // Sleeping happy eyes
          <g stroke="#3E2723" stroke-width="2.5" stroke-linecap="round" fill="none">
            <path d="M80 92 Q86 98, 92 92" />
            <path d="M108 92 Q114 98, 120 92" />
          </g>
        ) : state === 'celebrating' ? (
          // Joyful arched eyes
          <g stroke="#3E2723" stroke-width="2.5" stroke-linecap="round" fill="none">
            <path d="M80 94 Q86 87, 92 94" />
            <path d="M108 94 Q114 87, 120 94" />
          </g>
        ) : state === 'thinking' ? (
          // Looking up in wonder
          <g fill="#3E2723">
            <circle cx="86" cy="88" r="4.5" />
            <circle cx="88" cy="86" r="1.5" fill="#FFFFFF" />
            <circle cx="114" cy="88" r="4.5" />
            <circle cx="116" cy="86" r="1.5" fill="#FFFFFF" />
          </g>
        ) : (
          // Gentle warm eyes with twinkle
          <g fill="#3E2723">
            <circle cx="85" cy="92" r="4" />
            <circle cx="87" cy="90" r="1.5" fill="#FFFFFF" />
            <circle cx="115" cy="92" r="4" />
            <circle cx="117" cy="90" r="1.5" fill="#FFFFFF" />
          </g>
        )}

        {/* Eyebrows */}
        {state === 'thinking' ? (
          <g stroke="#5D4037" stroke-width="1.8" stroke-linecap="round" fill="none">
            <path d="M80 82 Q86 78, 92 82" />
            <path d="M108 81 Q114 76, 120 83" />
          </g>
        ) : (
          <g stroke="#5D4037" stroke-width="1.8" stroke-linecap="round" fill="none">
            <path d="M80 84 Q86 81, 92 84" />
            <path d="M108 84 Q114 81, 120 84" />
          </g>
        )}

        {/* Nose */}
        <circle cx="100" cy="96" r="1.8" fill="#E57373" />

        {/* MOUTH BASED ON STATE */}
        {state === 'speaking' ? (
          <path d="M94 103 Q100 114, 106 103 Z" fill="#D32F2F" />
        ) : state === 'celebrating' || state === 'waving' ? (
          <path d="M94 103 Q100 112, 106 103" stroke="#D32F2F" stroke-width="2.5" stroke-linecap="round" fill="none" />
        ) : (
          <path d="M96 104 Q100 109, 104 104" stroke="#D32F2F" stroke-width="2" stroke-linecap="round" fill="none" />
        )}

        {/* ================= FOREGROUND ARMS & PROPS ================= */}
        {state === 'sleepy' && (
          // Hugging Teddy Bear
          <g transform="translate(90, 145) scale(0.85)">
            {/* Teddy bear body */}
            <ellipse cx="20" cy="28" rx="16" ry="20" fill="#BCAAA4" />
            {/* Teddy head */}
            <circle cx="20" cy="8" r="14" fill="#BCAAA4" />
            {/* Teddy ears */}
            <circle cx="10" cy="-2" r="5" fill="#8D6E63" />
            <circle cx="30" cy="-2" r="5" fill="#8D6E63" />
            {/* Teddy snout */}
            <ellipse cx="20" cy="11" rx="6" ry="4" fill="#D7CCC8" />
            <circle cx="20" cy="10" r="2" fill="#4E342E" />
            {/* Mira arms hugging */}
            <path d="M-15 15 C-5 25, 10 25, 20 25" stroke="#FED7C3" stroke-width="7" stroke-linecap="round" fill="none" />
            <path d="M45 15 C35 25, 25 25, 15 25" stroke="#FED7C3" stroke-width="7" stroke-linecap="round" fill="none" />
          </g>
        )}

        {state === 'reading' && (
          // Holding open Storybook
          <g transform="translate(64, 150)">
            {/* Book left page */}
            <path d="M36 10 L4 0 L4 35 L36 45 Z" fill="#FFFDF9" stroke="#E9E3DC" stroke-width="1.5" />
            {/* Book right page */}
            <path d="M36 10 L68 0 L68 35 L36 45 Z" fill="#FFFDF9" stroke="#E9E3DC" stroke-width="1.5" />
            {/* Spine */}
            <line x1="36" y1="10" x2="36" y2="45" stroke="#F36B32" stroke-width="3" />
            {/* Cover trim */}
            <path d="M2 37 L36 48 L70 37" stroke="url(#bookGrad)" stroke-width="3" fill="none" />
            {/* Faux lines on pages */}
            <line x1="10" y1="12" x2="30" y2="16" stroke="#D7CCC8" stroke-width="1.5" />
            <line x1="10" y1="20" x2="30" y2="24" stroke="#D7CCC8" stroke-width="1.5" />
            <line x1="42" y1="16" x2="62" y2="12" stroke="#D7CCC8" stroke-width="1.5" />
            {/* Hands holding book */}
            <circle cx="6" cy="22" r="5" fill="#FED7C3" />
            <circle cx="66" cy="22" r="5" fill="#FED7C3" />
          </g>
        )}

        {state === 'celebrating' && (
          // Both arms high in the air
          <g stroke="#FED7C3" stroke-width="7" stroke-linecap="round" fill="none">
            <path d="M72 136 Q55 105, 42 80" />
            <path d="M128 136 Q145 105, 158 80" />
            <circle cx="42" cy="78" r="5" fill="#FED7C3" stroke="none" />
            <circle cx="158" cy="78" r="5" fill="#FED7C3" stroke="none" />
          </g>
        )}

        {state === 'waving' && (
          <g stroke="#FED7C3" stroke-width="7" stroke-linecap="round" fill="none">
            {/* Left resting arm */}
            <path d="M72 136 Q60 155, 68 170" />
            {/* Right waving arm */}
            <path d="M128 136 Q150 115, 155 90" />
            <circle cx="155" cy="88" r="5.5" fill="#FED7C3" stroke="none" />
          </g>
        )}

        {state === 'thinking' && (
          <g stroke="#FED7C3" stroke-width="7" stroke-linecap="round" fill="none">
            <path d="M72 136 Q60 155, 68 170" />
            {/* Hand to cheek */}
            <path d="M128 136 Q135 125, 124 106" />
            <circle cx="122" cy="106" r="5" fill="#FED7C3" stroke="none" />
            {/* Thinking bubbles */}
            <circle cx="145" cy="75" r="4" fill="#FFE0B2" stroke="none" />
            <circle cx="158" cy="60" r="7" fill="#FFE0B2" stroke="none" />
          </g>
        )}

        {state === 'idle' && (
          // Calm resting arms
          <g stroke="#FED7C3" stroke-width="7" stroke-linecap="round" fill="none">
            <path d="M72 136 Q60 158, 70 172" />
            <path d="M128 136 Q140 158, 130 172" />
            <circle cx="70" cy="172" r="4.5" fill="#FED7C3" stroke="none" />
            <circle cx="130" cy="172" r="4.5" fill="#FED7C3" stroke="none" />
          </g>
        )}

        {state === 'speaking' && (
          // Expressive communicative hands
          <g stroke="#FED7C3" stroke-width="7" stroke-linecap="round" fill="none">
            <path d="M72 136 Q60 150, 78 158" />
            <path d="M128 136 Q145 145, 132 152" />
            <circle cx="78" cy="158" r="4.5" fill="#FED7C3" stroke="none" />
            <circle cx="132" cy="152" r="4.5" fill="#FED7C3" stroke="none" />
          </g>
        )}
      </svg>
    </div>
  );
};
