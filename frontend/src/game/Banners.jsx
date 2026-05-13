import React from 'react';

// =============================================================
// Catalogue de 30 bannières thématiques.
// - 5 sont gratuites/pré-débloquées (ids 0..4).
// - Les autres sont achetables (boutique) ou déblocables (battle pass).
// price=0 → gratuit. unlockSource:
//   'free'   → débloquée d'office au lancement du compte
//   'shop'   → achetable
//   'pass-N' → débloquée au niveau N du battle pass (saison 1)
// =============================================================
export const BANNER_CATALOG = [
  // ── 5 GRATUITES ──
  { id: 'b-default',   name: 'GambleLife',    theme: 'casino',   price: 0,        unlockSource: 'free',   colors: ['#d4af37','#1a1410'] },
  { id: 'b-classic',   name: 'Classique',     theme: 'minimal',  price: 0,        unlockSource: 'free',   colors: ['#3a3a40','#0a0a0a'] },
  { id: 'b-cards',     name: 'Cartes',        theme: 'cards',    price: 0,        unlockSource: 'free',   colors: ['#a01a2e','#1a1a1a'] },
  { id: 'b-neon',      name: 'Néon Noir',     theme: 'neon',     price: 0,        unlockSource: 'free',   colors: ['#3fe6ff','#ff2a8a'] },
  { id: 'b-pixel',     name: 'Pixel Art',     theme: 'pixel',    price: 0,        unlockSource: 'free',   colors: ['#1eea60','#0a0a18'] },

  // ── GUERRE ──
  { id: 'b-war-camo',     name: 'Camouflage',   theme: 'war',     price: 200000,   unlockSource: 'shop',   colors: ['#4a5a3a','#2a3220'] },
  { id: 'b-war-tank',     name: 'Tank',         theme: 'war',     price: 500000,   unlockSource: 'shop',   colors: ['#3a3a2a','#1a1810'] },
  { id: 'b-war-medal',    name: 'Médaille',     theme: 'war',     price: 1500000,  unlockSource: 'pass-8', colors: ['#d4af37','#6a3a1a'] },

  // ── MER ──
  { id: 'b-sea-wave',     name: 'Vagues',       theme: 'sea',     price: 300000,   unlockSource: 'shop',   colors: ['#1ea8d0','#08394a'] },
  { id: 'b-sea-ship',     name: 'Galion',       theme: 'sea',     price: 800000,   unlockSource: 'shop',   colors: ['#1a3a5a','#d4af37'] },
  { id: 'b-sea-shark',    name: 'Requin',       theme: 'sea',     price: 2000000,  unlockSource: 'pass-15',colors: ['#5a7080','#0a1a2a'] },

  // ── GALAXY ──
  { id: 'b-galaxy-stars', name: 'Étoiles',      theme: 'galaxy',  price: 400000,   unlockSource: 'shop',   colors: ['#5a3a80','#0a0820'] },
  { id: 'b-galaxy-nebula',name: 'Nébuleuse',    theme: 'galaxy',  price: 1200000,  unlockSource: 'shop',   colors: ['#c84080','#1a0a50'] },
  { id: 'b-galaxy-ufo',   name: 'OVNI',         theme: 'galaxy',  price: 3000000,  unlockSource: 'pass-20',colors: ['#3fe6ff','#1a0a30'] },

  // ── JEUX VIDÉO ──
  { id: 'b-game-arcade',  name: 'Arcade',       theme: 'video',   price: 350000,   unlockSource: 'shop',   colors: ['#ff2a8a','#1a0a2a'] },
  { id: 'b-game-controller', name: 'Manette',   theme: 'video',   price: 700000,   unlockSource: 'shop',   colors: ['#3fe6ff','#0a1a30'] },
  { id: 'b-game-pixel',   name: 'Retro Pixel',  theme: 'video',   price: 1800000,  unlockSource: 'pass-12',colors: ['#1eea60','#100a1a'] },

  // ── MONTAGNE ──
  { id: 'b-mountain-peak', name: 'Sommet',      theme: 'mountain',price: 300000,   unlockSource: 'shop',   colors: ['#7a8a98','#1a2030'] },
  { id: 'b-mountain-pine', name: 'Forêt',       theme: 'mountain',price: 600000,   unlockSource: 'shop',   colors: ['#2a5a3a','#0a1a14'] },
  { id: 'b-mountain-aurora',name:'Aurore',      theme: 'mountain',price: 2500000,  unlockSource: 'pass-18',colors: ['#3fe6ff','#0a1010'] },

  // ── ASIE ──
  { id: 'b-asia-sakura',  name: 'Sakura',       theme: 'asia',    price: 450000,   unlockSource: 'shop',   colors: ['#ff8aa8','#3a1a2a'] },
  { id: 'b-asia-dragon',  name: 'Dragon',       theme: 'asia',    price: 1400000,  unlockSource: 'shop',   colors: ['#c81818','#1a0808'] },
  { id: 'b-asia-koi',     name: 'Carpe Koï',    theme: 'asia',    price: 2200000,  unlockSource: 'pass-22',colors: ['#ff5a1a','#0a1a2a'] },

  // ── AMÉRIQUE ──
  { id: 'b-am-stars',     name: 'Étoiles & Bandes', theme: 'america', price: 500000, unlockSource: 'shop', colors: ['#c81830','#1820a0'] },
  { id: 'b-am-eagle',     name: 'Aigle',        theme: 'america', price: 1600000,  unlockSource: 'shop',   colors: ['#7a4a1a','#d4af37'] },
  { id: 'b-am-route66',   name: 'Route 66',     theme: 'america', price: 2800000,  unlockSource: 'pass-25',colors: ['#d4a020','#1a1410'] },

  // ── BONUS ──
  { id: 'b-money',        name: 'Cash',         theme: 'money',   price: 1000000,  unlockSource: 'shop',   colors: ['#2c9a5a','#0a2010'] },
  { id: 'b-diamond',      name: 'Diamants',     theme: 'diamond', price: 4000000,  unlockSource: 'shop',   colors: ['#9be0ff','#1a2a3a'] },
  { id: 'b-fire',         name: 'Inferno',      theme: 'fire',    price: 3500000,  unlockSource: 'shop',   colors: ['#ff5a1a','#100a08'] },
  { id: 'b-king',         name: 'Couronne Roi', theme: 'royal',   price: 8000000,  unlockSource: 'pass-25',colors: ['#ffd700','#3a1a0a'] },
];

// Liste des ids gratuits (pré-débloqués au create-account)
export const FREE_BANNER_IDS = BANNER_CATALOG.filter(b => b.unlockSource === 'free').map(b => b.id);

// =============================================================
// <Banner> — rendu visuel (SVG) d'une bannière selon son thème.
// Largement procédural pour n'avoir aucun asset à embarquer.
// Props : id, width, height, label (overlay)
// =============================================================
export const Banner = ({ id = 'b-default', width = 320, height = 100, label, showName = true }) => {
  const def = BANNER_CATALOG.find(b => b.id === id) || BANNER_CATALOG[0];
  const [a, b] = def.colors;

  return (
    <div
      data-testid={`banner-${def.id}`}
      style={{
        width, height,
        borderRadius: 10, overflow: 'hidden',
        position: 'relative',
        background: `linear-gradient(135deg, ${a} 0%, ${b} 100%)`,
        border: '1px solid rgba(255,255,255,0.18)',
        boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
      }}
    >
      <ThemeArt theme={def.theme} colors={def.colors} width={width} height={height} />
      {showName && (
        <div style={{
          position: 'absolute', bottom: 6, right: 10,
          fontSize: 10, fontWeight: 800, letterSpacing: 1.2,
          color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.85)',
          fontFamily: 'Georgia, serif',
        }}>
          {def.name.toUpperCase()}
        </div>
      )}
      {label && (
        <div style={{
          position: 'absolute', top: 8, left: 10,
          fontSize: 14, fontWeight: 900, letterSpacing: 1,
          color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          fontFamily: 'Georgia, serif',
        }}>
          {label}
        </div>
      )}
    </div>
  );
};

// =============================================================
// ThemeArt — SVG décoratif par thème
// =============================================================
const ThemeArt = ({ theme, colors, width, height }) => {
  const [a, b] = colors;
  const W = 320, H = 100; // viewBox normalisé
  const common = { width, height };

  if (theme === 'casino') {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} {...common} preserveAspectRatio="xMidYMid slice">
        <text x="20" y="50" fill={a} fontSize="44" fontWeight="900" fontFamily="Georgia" opacity="0.9">♠ ♥ ♦ ♣</text>
        <circle cx="280" cy="50" r="30" fill={a} opacity="0.18" />
      </svg>
    );
  }
  if (theme === 'minimal') {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} {...common} preserveAspectRatio="xMidYMid slice">
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={i} x1={i * 40} y1="0" x2={i * 40 + 40} y2={H}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        ))}
      </svg>
    );
  }
  if (theme === 'cards') {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} {...common} preserveAspectRatio="xMidYMid slice">
        {[40, 110, 180, 250].map((cx, i) => (
          <g key={i} transform={`translate(${cx}, ${20 + (i % 2) * 8}) rotate(${(i - 1.5) * 12})`}>
            <rect x="-12" y="-18" width="24" height="36" rx="3" fill="#fff" stroke="#000" strokeWidth="0.5" />
            <text x="0" y="6" fill={i % 2 === 0 ? '#c81818' : '#000'} fontSize="14" textAnchor="middle" fontWeight="900">
              {['A', 'K', 'Q', 'J'][i]}
            </text>
          </g>
        ))}
      </svg>
    );
  }
  if (theme === 'neon') {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} {...common} preserveAspectRatio="xMidYMid slice">
        {[20, 60, 100, 140, 180, 220, 260, 300].map((x, i) => (
          <rect key={i} x={x} y="20" width="3" height="60" fill={i % 2 === 0 ? a : b}
            opacity="0.85" filter="url(#glow)" />
        ))}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>
      </svg>
    );
  }
  if (theme === 'pixel') {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} {...common} preserveAspectRatio="xMidYMid slice">
        {Array.from({ length: 80 }).map((_, i) => {
          const x = (i % 16) * 20;
          const y = Math.floor(i / 16) * 20;
          if ((i * 7919) % 4 !== 0) return null;
          return <rect key={i} x={x} y={y} width="20" height="20" fill={a} opacity={((i * 13) % 5) / 6} />;
        })}
      </svg>
    );
  }
  if (theme === 'war') {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} {...common} preserveAspectRatio="xMidYMid slice">
        {/* Camo blobs */}
        {Array.from({ length: 14 }).map((_, i) => {
          const cx = (i * 53) % W;
          const cy = (i * 37) % H;
          return <ellipse key={i} cx={cx} cy={cy} rx={18 + (i % 4) * 6} ry={12 + (i % 3) * 5}
            fill={i % 3 === 0 ? a : i % 3 === 1 ? b : '#5a4a30'} opacity="0.55" />;
        })}
        {/* Étoile */}
        <polygon points="280,30 286,46 304,46 290,56 295,72 280,62 265,72 270,56 256,46 274,46"
          fill="#d4af37" opacity="0.9" />
      </svg>
    );
  }
  if (theme === 'sea') {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} {...common} preserveAspectRatio="xMidYMid slice">
        {[30, 50, 70].map((y, i) => (
          <path key={i} d={`M 0 ${y} Q 40 ${y - 8} 80 ${y} T 160 ${y} T 240 ${y} T 320 ${y}`}
            stroke={i === 1 ? a : 'rgba(255,255,255,0.4)'} strokeWidth="2" fill="none" opacity={1 - i * 0.2} />
        ))}
        <circle cx="270" cy="20" r="16" fill={a} opacity="0.85" />
      </svg>
    );
  }
  if (theme === 'galaxy') {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} {...common} preserveAspectRatio="xMidYMid slice">
        {Array.from({ length: 50 }).map((_, i) => {
          const sx = (i * 67) % W;
          const sy = (i * 41) % H;
          const r = ((i * 13) % 3) * 0.6 + 0.5;
          return <circle key={i} cx={sx} cy={sy} r={r} fill="#fff" opacity={((i * 17) % 9 + 1) / 10} />;
        })}
        <ellipse cx="200" cy="50" rx="60" ry="20" fill={a} opacity="0.35" />
        <ellipse cx="200" cy="50" rx="30" ry="10" fill="#fff" opacity="0.4" />
      </svg>
    );
  }
  if (theme === 'video') {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} {...common} preserveAspectRatio="xMidYMid slice">
        {/* Pixels d'écran arcade */}
        {Array.from({ length: 40 }).map((_, i) => {
          const x = (i % 10) * 32;
          const y = Math.floor(i / 10) * 25;
          return <rect key={i} x={x} y={y} width="28" height="20" rx="2"
            fill={i % 4 === 0 ? a : (i % 4 === 1 ? '#fff' : 'transparent')} opacity="0.75" />;
        })}
      </svg>
    );
  }
  if (theme === 'mountain') {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} {...common} preserveAspectRatio="xMidYMid slice">
        <polygon points="0,100 60,40 100,70 160,20 230,55 290,30 320,100" fill={a} opacity="0.85" />
        <polygon points="0,100 80,55 140,80 200,40 260,70 320,50 320,100" fill="#fff" opacity="0.2" />
        <polygon points="80,55 90,48 100,60" fill="#fff" />
        <polygon points="200,40 215,30 230,45" fill="#fff" />
      </svg>
    );
  }
  if (theme === 'asia') {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} {...common} preserveAspectRatio="xMidYMid slice">
        <circle cx="80" cy="50" r="28" fill={a} opacity="0.9" />
        {/* Pétales sakura */}
        {Array.from({ length: 24 }).map((_, i) => {
          const x = 160 + (i * 11) % 160;
          const y = 10 + (i * 17) % 80;
          return <circle key={i} cx={x} cy={y} r="3.5" fill="#ffaad0" opacity={0.7} />;
        })}
      </svg>
    );
  }
  if (theme === 'america') {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} {...common} preserveAspectRatio="xMidYMid slice">
        {[10, 30, 50, 70, 90].map((y, i) => (
          <rect key={i} x="0" y={y} width={W} height="10" fill={i % 2 === 0 ? a : '#fff'} opacity="0.5" />
        ))}
        <rect x="0" y="0" width="120" height="50" fill={b} opacity="0.85" />
        {Array.from({ length: 9 }).map((_, i) => (
          <text key={i} x={20 + (i % 5) * 22} y={15 + Math.floor(i / 5) * 22}
            fill="#fff" fontSize="14" fontWeight="900">★</text>
        ))}
      </svg>
    );
  }
  if (theme === 'money') {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} {...common} preserveAspectRatio="xMidYMid slice">
        {Array.from({ length: 12 }).map((_, i) => (
          <text key={i} x={(i * 28) % W} y={20 + (i * 17) % 70}
            fill="#fff" fontSize="32" fontWeight="900" opacity="0.55">$</text>
        ))}
      </svg>
    );
  }
  if (theme === 'diamond') {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} {...common} preserveAspectRatio="xMidYMid slice">
        {Array.from({ length: 6 }).map((_, i) => {
          const cx = 30 + i * 50;
          const cy = 50;
          return (
            <g key={i}>
              <polygon points={`${cx},${cy - 20} ${cx + 15},${cy} ${cx},${cy + 22} ${cx - 15},${cy}`}
                fill="#fff" opacity="0.7" />
              <polygon points={`${cx},${cy - 20} ${cx + 8},${cy} ${cx},${cy + 22}`}
                fill={a} opacity="0.5" />
            </g>
          );
        })}
      </svg>
    );
  }
  if (theme === 'fire') {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} {...common} preserveAspectRatio="xMidYMid slice">
        {Array.from({ length: 10 }).map((_, i) => (
          <ellipse key={i} cx={(i * 35 + 15) % W} cy={50 + (i % 3) * 15}
            rx={16 + (i % 4) * 4} ry={28 + (i % 3) * 6}
            fill={i % 2 === 0 ? a : '#ffd860'} opacity="0.75" />
        ))}
      </svg>
    );
  }
  if (theme === 'royal') {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} {...common} preserveAspectRatio="xMidYMid slice">
        <polygon points="50,75 60,30 80,50 100,20 130,55 150,30 160,75"
          fill={a} stroke="#fff" strokeWidth="1.5" />
        <circle cx="60" cy="25" r="5" fill="#c81818" />
        <circle cx="100" cy="15" r="5" fill="#3fe6ff" />
        <circle cx="150" cy="25" r="5" fill="#a8e88a" />
        <text x="260" y="55" fill={a} fontSize="36" fontWeight="900" fontFamily="Georgia">♛</text>
      </svg>
    );
  }
  // Default
  return null;
};

export default Banner;
