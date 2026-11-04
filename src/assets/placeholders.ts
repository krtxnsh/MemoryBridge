// Local standalone SVG photo generator & curated placeholders
// Does not rely on network images, fully offline and consistent with the design system

export const createSvgPhoto = (
  theme: 'wedding' | 'goa' | 'college' | 'childhood' | 'family' | 'daniel' | 'nepal' | 'school' | 'diwali',
  title: string,
  badgeText?: string
): string => {
  const configs = {
    wedding: {
      bg: 'linear-gradient(135deg, #FDEBD0 0%, #F5B7B1 50%, #D7BDE2 100%)',
      accent: '#B8431A',
      symbol: `<g transform="translate(180, 100) scale(1.5)">
        <circle cx="20" cy="20" r="14" fill="#FAD7A0" stroke="#B8431A" stroke-width="2"/>
        <circle cx="34" cy="20" r="14" fill="#EDBB99" stroke="#B8431A" stroke-width="2"/>
        <path d="M22 6 L27 1 L32 6" stroke="#E67E22" stroke-width="2" fill="none"/>
        <text x="27" y="-5" text-anchor="middle" font-family="serif" font-size="10" fill="#B8431A">✨ 1985</text>
      </g>`,
      caption: 'Rajiv & Anita’s Wedding Vows'
    },
    goa: {
      bg: 'linear-gradient(135deg, #AED6F1 0%, #F9E79F 50%, #EDBB99 100%)',
      accent: '#2980B9',
      symbol: `<g transform="translate(180, 80) scale(1.4)">
        <circle cx="30" cy="15" r="18" fill="#F39C12" opacity="0.85"/>
        <path d="M-10 65 Q 20 40, 50 65 T 100 65" fill="#5DADE2" opacity="0.7"/>
        <path d="M-20 75 Q 30 50, 70 75 T 120 75" fill="#2E86C1" opacity="0.8"/>
        <path d="M60 40 Q 62 20, 68 5 Q 73 20, 80 40" stroke="#27AE60" stroke-width="3" fill="none"/>
      </g>`,
      caption: 'Goa Golden Beach Picnic'
    },
    college: {
      bg: 'linear-gradient(135deg, #D4EFDF 0%, #A9DFBF 50%, #EDBB99 100%)',
      accent: '#196F3D',
      symbol: `<g transform="translate(190, 95) scale(1.3)">
        <polygon points="25,5 50,20 25,35 0,20" fill="#2C3E50"/>
        <rect x="18" y="35" width="14" height="18" fill="#34495E" rx="2"/>
        <path d="M45 23 L45 42" stroke="#E67E22" stroke-width="2.5"/>
        <circle cx="45" cy="44" r="3" fill="#E67E22"/>
      </g>`,
      caption: 'Class of 1978 · St. Stephens'
    },
    childhood: {
      bg: 'linear-gradient(135deg, #FCF3CF 0%, #FAD7A0 60%, #EDBB99 100%)',
      accent: '#D35400',
      symbol: `<g transform="translate(180, 95) scale(1.3)">
        <circle cx="10" cy="30" r="16" fill="none" stroke="#797D7F" stroke-width="3"/>
        <circle cx="55" cy="30" r="16" fill="none" stroke="#797D7F" stroke-width="3"/>
        <polyline points="10,30 32,30 45,10 55,30" fill="none" stroke="#C0392B" stroke-width="3"/>
        <line x1="32" y1="30" x2="25" y2="12" stroke="#C0392B" stroke-width="3"/>
        <line x1="20" y1="12" x2="30" y2="12" stroke="#333" stroke-width="3"/>
      </g>`,
      caption: 'Red Bicycle on Hill Road · 1960'
    },
    family: {
      bg: 'linear-gradient(135deg, #FADBD8 0%, #F5CBA7 60%, #D5F5E3 100%)',
      accent: '#BA4A00',
      symbol: `<g transform="translate(180, 95) scale(1.2)">
        <circle cx="15" cy="20" r="12" fill="#F8C471"/>
        <circle cx="40" cy="18" r="13" fill="#EDBB99"/>
        <circle cx="65" cy="24" r="9" fill="#FAD7A0"/>
        <path d="M3 45 C 8 32, 22 32, 27 45" fill="#E59866"/>
        <path d="M28 45 C 33 30, 48 30, 53 45" fill="#DC7633"/>
        <path d="M55 45 C 58 35, 72 35, 75 45" fill="#F0B27A"/>
      </g>`,
      caption: 'The Family Garden Gathering'
    },
    daniel: {
      bg: 'linear-gradient(135deg, #FFF9C4 0%, #FFE082 50%, #FFCC80 100%)',
      accent: '#F57C00',
      symbol: `<g transform="translate(190, 85) scale(1.4)">
        <circle cx="25" cy="25" r="16" fill="#FFE0B2"/>
        <circle cx="20" cy="22" r="2.5" fill="#4E342E"/>
        <circle cx="30" cy="22" r="2.5" fill="#4E342E"/>
        <path d="M19 28 Q 25 34, 31 28" fill="none" stroke="#E64A19" stroke-width="2" stroke-linecap="round"/>
        <circle cx="12" cy="14" r="5" fill="#FFA726"/>
        <circle cx="38" cy="14" r="5" fill="#FFA726"/>
      </g>`,
      caption: 'Grandson Daniel laughing in tulip field'
    },
    nepal: {
      bg: 'linear-gradient(135deg, #E8F8F5 0%, #D1F2EB 50%, #A3E4D7 100%)',
      accent: '#117A65',
      symbol: `<g transform="translate(180, 85) scale(1.3)">
        <polygon points="10,60 35,15 60,60" fill="#A2D9CE"/>
        <polygon points="35,15 45,30 25,30" fill="#FFFFFF"/>
        <polygon points="45,60 70,25 95,60" fill="#73C6B6"/>
        <polygon points="70,25 78,36 62,36" fill="#FFFFFF"/>
      </g>`,
      caption: 'Mountain Morning in Kathmandu'
    },
    school: {
      bg: 'linear-gradient(135deg, #EAECEE 0%, #D5D8DC 60%, #ABB2B9 100%)',
      accent: '#2C3E50',
      symbol: `<g transform="translate(190, 95) scale(1.3)">
        <polygon points="30,5 60,25 0,25" fill="#922B21"/>
        <rect x="8" y="25" width="44" height="30" fill="#D5D8DC" stroke="#7B7D7D" stroke-width="1.5"/>
        <rect x="22" y="38" width="16" height="17" fill="#6E2C00"/>
        <circle cx="30" cy="18" r="4" fill="#F39C12"/>
      </g>`,
      caption: 'First Day at St. Xavier’s · 1966'
    },
    diwali: {
      bg: 'linear-gradient(135deg, #FAD7A0 0%, #F5B041 50%, #EB984E 100%)',
      accent: '#B9770E',
      symbol: `<g transform="translate(190, 85) scale(1.3)">
        <ellipse cx="30" cy="40" rx="22" ry="10" fill="#A04000"/>
        <path d="M22 36 Q 30 15, 30 5 Q 30 15, 38 36 Z" fill="#F4D03F" stroke="#E67E22" stroke-width="1.5"/>
        <ellipse cx="30" cy="24" rx="4" ry="7" fill="#E74C3C"/>
      </g>`,
      caption: 'Diwali Lights with Anita & Riya'
    }
  };

  const c = configs[theme] || configs.family;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 300" width="100%" height="100%">
    <defs>
      <pattern id="grain-${theme}" width="8" height="8" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="0.8" fill="#77716B" opacity="0.08"/>
        <circle cx="6" cy="6" r="0.8" fill="#77716B" opacity="0.08"/>
      </pattern>
    </defs>
    <rect width="460" height="300" fill="url(#bg-${theme})" />
    <defs>
      <linearGradient id="bg-${theme}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${theme === 'wedding' ? '#FFF5EB' : theme === 'goa' ? '#E1F5FE' : '#F5EFEB'}"/>
        <stop offset="100%" stop-color="${theme === 'wedding' ? '#FED7C3' : theme === 'goa' ? '#FFE082' : '#E8D9C8'}"/>
      </linearGradient>
    </defs>
    <rect width="460" height="300" fill="url(#grain-${theme})" />
    
    <!-- Warm Editorial Frame Border -->
    <rect x="12" y="12" width="436" height="276" rx="14" fill="none" stroke="#FFFFFF" stroke-width="3" opacity="0.85"/>
    <rect x="18" y="18" width="424" height="264" rx="10" fill="none" stroke="${c.accent}" stroke-width="1" opacity="0.25"/>

    <!-- Scene Vector Graphic -->
    ${c.symbol}

    <!-- Photo Label Badge -->
    <rect x="28" y="235" width="230" height="34" rx="8" fill="#FFFFFF" opacity="0.94" />
    <text x="40" y="257" font-family="'Inter', sans-serif" font-weight="600" font-size="13" fill="#292521">${title || c.caption}</text>
    
    ${badgeText ? `
      <rect x="340" y="26" width="90" height="24" rx="12" fill="#F36B32" opacity="0.9"/>
      <text x="385" y="42" font-family="'Inter', sans-serif" font-weight="600" font-size="11" fill="#FFFFFF" text-anchor="middle">${badgeText}</text>
    ` : ''}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// Avatar generator for people
export const createSvgAvatar = (initials: string, bgColor: string, relationship: string): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
    <circle cx="80" cy="80" r="76" fill="${bgColor}" stroke="#FFF" stroke-width="6"/>
    <circle cx="80" cy="80" r="72" fill="none" stroke="#E9E3DC" stroke-width="2"/>
    <text x="80" y="94" font-family="'Playfair Display', serif" font-weight="bold" font-size="44" fill="#292521" text-anchor="middle">${initials}</text>
    <rect x="30" y="125" width="100" height="22" rx="11" fill="#292521" opacity="0.85"/>
    <text x="80" y="140" font-family="'Inter', sans-serif" font-size="10" font-weight="600" fill="#FFF" text-anchor="middle">${relationship.toUpperCase()}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};
