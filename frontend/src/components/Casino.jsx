import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';

// ============== CASINOS THÉMATIQUES ==============
const CASINOS = {
  vegas: {
    name: 'Las Vegas',
    country: '🇺🇸',
    flag: ['#b22234', '#ffffff', '#3c3b6e'],
    primary: '#ff0040',
    secondary: '#ffd700',
    accent: '#ff6b00',
    bg: 'radial-gradient(ellipse at top, #2a0510 0%, #0a0005 80%)',
    wallColor: '#3a0a1a',
    floorColor: '#1a0a0a',
    tagline: 'Sin City — Ville des lumières',
  },
  malta: {
    name: 'Malta Casino',
    country: '🇲🇹',
    flag: ['#cf142b', '#ffffff'],
    primary: '#cf142b',
    secondary: '#ffffff',
    accent: '#8b0000',
    bg: 'radial-gradient(ellipse at top, #2a0a0a 0%, #1a0505 80%)',
    wallColor: '#3a1010',
    floorColor: '#2a0505',
    tagline: 'L\'élégance méditerranéenne',
  },
  barcelona: {
    name: 'Casino Barcelona',
    country: '🇪🇸',
    flag: ['#aa151b', '#f1bf00'],
    primary: '#aa151b',
    secondary: '#f1bf00',
    accent: '#d4a017',
    bg: 'radial-gradient(ellipse at top, #2a1a0a 0%, #1a0f05 80%)',
    wallColor: '#3a2010',
    floorColor: '#2a1808',
    tagline: 'Passion catalane',
  },
  prague: {
    name: 'Prague Casino',
    country: '🇨🇿',
    flag: ['#11457e', '#d7141a', '#ffffff'],
    primary: '#11457e',
    secondary: '#d7141a',
    accent: '#4a7bc0',
    bg: 'radial-gradient(ellipse at top, #0a1530 0%, #050a1a 80%)',
    wallColor: '#0f2040',
    floorColor: '#081428',
    tagline: 'Charme bohémien',
  },
  monaco: {
    name: 'Monaco Casino',
    country: '🇲🇨',
    flag: ['#ce1126', '#ffffff'],
    primary: '#ce1126',
    secondary: '#d4af37',
    accent: '#f5e6a8',
    bg: 'radial-gradient(ellipse at top, #1a0505 0%, #0a0202 80%)',
    wallColor: '#2a0808',
    floorColor: '#180404',
    tagline: 'Luxe à la française',
  },
  jonzac: {
    name: 'Jonzac France Casino',
    country: '🇫🇷',
    flag: ['#0055a4', '#ffffff', '#ef4135'],
    primary: '#0055a4',
    secondary: '#ef4135',
    accent: '#ffffff',
    bg: 'radial-gradient(ellipse at top, #0a1530 0%, #050a1a 80%)',
    wallColor: '#0f2050',
    floorColor: '#0a1530',
    tagline: 'Charme charentais',
  },
};

// ============== TROPHÉES (plus dur + récompenses) ==============
const TROPHIES = [
  { threshold: 10000, name: 'Bronze', icon: '🥉', color: '#cd7f32', reward: 500 },
  { threshold: 50000, name: 'Argent', icon: '🥈', color: '#c0c0c0', reward: 2500 },
  { threshold: 150000, name: 'Or', icon: '🥇', color: '#ffd700', reward: 7500 },
  { threshold: 500000, name: 'Platine', icon: '💎', color: '#e5e4e2', reward: 25000 },
  { threshold: 1500000, name: 'Diamant', icon: '💠', color: '#b9f2ff', reward: 75000 },
  { threshold: 5000000, name: 'Légende', icon: '👑', color: '#ff6b9d', reward: 250000 },
  { threshold: 15000000, name: 'Mythique', icon: '🏆', color: '#ff0080', reward: 750000 },
];

// ============== ARMES ==============
const WEAPONS = [
  { id: 'knife', name: 'Couteau tactique', price: 20000, damage: 'léger', desc: 'Lame Ka-Bar affûtée', type: 'melee' },
  { id: 'machete', name: 'Machette', price: 40000, damage: 'moyen', desc: 'Lame lourde 45cm', type: 'melee' },
  { id: 'gun', name: 'Pistolet 9mm', price: 60000, damage: 'fort', desc: 'Glock 17, 17 coups', type: 'gun' },
  { id: 'shotgun', name: 'Fusil à pompe', price: 80000, damage: 'très fort', desc: 'Remington 870 cal.12', type: 'gun' },
  { id: 'bazooka', name: 'Bazooka RPG', price: 100000, damage: 'massif', desc: 'Lance-roquettes RPG-7', type: 'rocket' },
  { id: 'flamethrower', name: 'Lance-flammes', price: 2500000, damage: 'dévastateur', desc: 'M2 avec 5L de napalm', type: 'flame' },
];

// ============== VÉHICULES ==============
// Marche = 1x, Skateboard = 2x, Vélo = 3x
const VEHICLES = [
  { id: 'skateboard', name: 'Skateboard Benz', price: 1000000,  speedMul: 2, emoji: '🛹', desc: 'Plateau carbone, roues uréthane – 2× plus rapide qu\'à pied' },
  { id: 'bike',       name: 'Vélo Benz Turbo',  price: 5000000,  speedMul: 3, emoji: '🚴', desc: 'Cadre titane, assistance secrète – 3× plus rapide qu\'à pied' },
];

// ============== CATALOGUE PERSONNALISATION PERSONNAGE ==============
// 10 coupes de cheveux (3 gratuits + 7 payants)
const HAIR_CATALOG = [
  { id: 0, name: 'Classique',         price: 0,      color: '#3a2817' },
  { id: 1, name: 'Rasée',             price: 0,      color: '#111111' },
  { id: 2, name: 'Afro',              price: 0,      color: '#2a1a0f' },
  { id: 3, name: 'Dreadlocks',        price: 15000,  color: '#1f1408' },
  { id: 4, name: 'Man bun',           price: 20000,  color: '#4a3220' },
  { id: 5, name: 'Crête punk',        price: 35000,  color: '#c72424' },
  { id: 6, name: 'Blonde surfeur',    price: 25000,  color: '#e8c77b' },
  { id: 7, name: 'Platine',           price: 80000,  color: '#f4f4f4' },
  { id: 8, name: 'Rose néon',         price: 120000, color: '#f06fb5' },
  { id: 9, name: 'Dorés VIP',         price: 500000, color: '#d4af37' },
];
// 10 ensembles/vêtements (3 gratuits + 7 payants)
const OUTFIT_CATALOG = [
  { id: 0, name: 'T-shirt blanc',      price: 0,       color: '#f1ead0' },
  { id: 1, name: 'Survêt noir',        price: 0,       color: '#1a1a1a' },
  { id: 2, name: 'Jean & chemise',     price: 0,       color: '#2a3a68' },
  { id: 3, name: 'Blouson cuir',       price: 30000,   color: '#1c1c1e' },
  { id: 4, name: 'Costume business',   price: 120000,  color: '#14141a' },
  { id: 5, name: 'Smoking casino',     price: 250000,  color: '#0b0b0b' },
  { id: 6, name: 'Survêt or',          price: 180000,  color: '#d4af37' },
  { id: 7, name: 'Veste militaire',    price: 60000,   color: '#425c2a' },
  { id: 8, name: 'Kimono urbain',      price: 90000,   color: '#8b1f2b' },
  { id: 9, name: 'Manteau fourrure',   price: 900000,  color: '#3a2a18' },
];
// 10 chaussures (3 gratuites + 7 payantes)
const SHOES_CATALOG = [
  { id: 0, name: 'Baskets blanches',   price: 0,       color: '#f1f1ea' },
  { id: 1, name: 'Baskets noires',     price: 0,       color: '#1a1a1a' },
  { id: 2, name: 'Tongs',              price: 0,       color: '#3a3a40' },
  { id: 3, name: 'Mocassins',          price: 20000,   color: '#2a1608' },
  { id: 4, name: 'Bottes militaires',  price: 45000,   color: '#1c1208' },
  { id: 5, name: 'Sneakers lumineux',  price: 80000,   color: '#2aa6ff' },
  { id: 6, name: 'Oxford cuir',        price: 140000,  color: '#0b0b0b' },
  { id: 7, name: 'Crocs diamantés',    price: 300000,  color: '#9fe3ff' },
  { id: 8, name: 'Bottines rock',      price: 200000,  color: '#3a1e1e' },
  { id: 9, name: 'Baskets Benz or',    price: 700000,  color: '#d4af37' },
];

// ============== CARTES ==============
const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const RANK_VALUE = { A: 14, K: 13, Q: 12, J: 11, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 };

const createDeck = () => {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, id: `${rank}${suit}-${Math.random()}` });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

const bjValue = (card) => {
  if (['J', 'Q', 'K'].includes(card.rank)) return 10;
  if (card.rank === 'A') return 11;
  return parseInt(card.rank);
};

const handValue = (hand) => {
  let total = hand.reduce((s, c) => s + bjValue(c), 0);
  let aces = hand.filter((c) => c.rank === 'A').length;
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
};

// ============== ROULETTE NUMBERS ==============
const ROULETTE_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
  16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const getColor = (n) => (n === 0 ? 'green' : RED_NUMBERS.includes(n) ? 'red' : 'black');

// ============== WHEEL PRIZES ==============
const WHEEL_PRIZES = [
  { label: '200', value: 200, color: '#2d5016', weight: 40 },
  { label: '5000', value: 5000, color: '#4a7c2e', weight: 25 },
  { label: 'RIEN', value: 0, color: '#1a1a1a', weight: 20 },
  { label: '15000', value: 15000, color: '#8b0000', weight: 10 },
  { label: '100000', value: 100000, color: '#d4af37', weight: 4 },
  { label: 'JACKPOT', value: 1000000, color: '#ff0080', weight: 1 },
];

// ============== HELPERS ==============
const fmt = (n) => n.toLocaleString('fr-FR');
const FOUR_HOURS = 4 * 60 * 60 * 1000;

// ============== CROUPIERS VARIÉS ==============
const DEALER_PROFILES = [
  { id: 'marco', name: 'Marco', skin: '#e8b896', hair: '#2a1810', eyes: '#4a2c1a', beard: true, glasses: false, gender: 'm' },
  { id: 'antonio', name: 'Antonio', skin: '#c9936a', hair: '#1a0e08', eyes: '#2a1808', beard: false, glasses: true, gender: 'm' },
  { id: 'sophia', name: 'Sophia', skin: '#f0c9a6', hair: '#4a2818', eyes: '#3a5828', beard: false, glasses: false, gender: 'f' },
  { id: 'viktor', name: 'Viktor', skin: '#d4a888', hair: '#8a6820', eyes: '#2a3a58', beard: true, glasses: false, gender: 'm' },
  { id: 'elena', name: 'Elena', skin: '#e8c0a0', hair: '#1a0a04', eyes: '#5a3a20', beard: false, glasses: true, gender: 'f' },
  { id: 'jamal', name: 'Jamal', skin: '#8b5a3c', hair: '#0a0603', eyes: '#1a0a04', beard: true, glasses: false, gender: 'm' },
  { id: 'aisha', name: 'Aisha', skin: '#a07858', hair: '#0a0603', eyes: '#3a2010', beard: false, glasses: false, gender: 'f' },
  { id: 'hiroshi', name: 'Hiroshi', skin: '#e8c698', hair: '#0a0603', eyes: '#2a1810', beard: false, glasses: true, gender: 'm' },
];

const Dealer = ({ profile, splats, dead, shot, bloodStreams }) => {
  const p = profile || DEALER_PROFILES[0];
  
  return (
    <div style={{
      position: 'relative', width: 200, height: 260,
      transition: 'all 0.3s',
      filter: dead ? 'saturate(0.5) brightness(0.6)' : 'none',
      transform: dead ? 'rotate(25deg) translateY(30px)' : 'none',
    }}>
      <svg viewBox="0 0 200 260" style={{ width: '100%', height: '100%' }}>
        <defs>
          <radialGradient id={`skin-${p.id}`} cx="45%" cy="35%">
            <stop offset="0%" stopColor={lighten(p.skin, 15)} />
            <stop offset="70%" stopColor={p.skin} />
            <stop offset="100%" stopColor={darken(p.skin, 20)} />
          </radialGradient>
          <radialGradient id={`skinShade-${p.id}`} cx="50%" cy="50%">
            <stop offset="0%" stopColor={p.skin} />
            <stop offset="100%" stopColor={darken(p.skin, 30)} />
          </radialGradient>
          <linearGradient id={`suit-${p.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a1a2e" />
            <stop offset="50%" stopColor="#0a0a1a" />
            <stop offset="100%" stopColor="#000" />
          </linearGradient>
          <filter id={`shadow-${p.id}`}>
            <feGaussianBlur stdDeviation="1" />
          </filter>
        </defs>

        {/* Épaules / corps */}
        <path d="M 30 200 L 70 170 L 100 180 L 130 170 L 170 200 L 175 260 L 25 260 Z" 
          fill={`url(#suit-${p.id})`} stroke="#000" strokeWidth="0.5" />
        
        {/* Col chemise */}
        <path d="M 75 175 L 100 195 L 125 175 L 115 170 L 100 180 L 85 170 Z" fill="#f5f5f5" />
        <path d="M 75 175 L 85 170 L 100 180 Z" fill="#e8e8e8" />
        
        {/* Cravate/noeud papillon */}
        {p.gender === 'm' ? (
          <>
            <path d="M 95 182 L 105 182 L 107 200 L 108 235 L 100 245 L 92 235 L 93 200 Z" 
              fill="#8b0000" />
            <path d="M 93 200 L 107 200 L 108 235 L 92 235 Z" fill="#6a0000" opacity="0.4" />
          </>
        ) : (
          <>
            <ellipse cx="100" cy="188" rx="14" ry="6" fill="#8b0000" />
            <ellipse cx="100" cy="188" rx="3" ry="4" fill="#4a0000" />
          </>
        )}

        {/* Cou */}
        <path d="M 85 155 L 85 180 L 115 180 L 115 155 Z" fill={`url(#skin-${p.id})`} />
        <path d="M 85 170 L 115 170" stroke={darken(p.skin, 25)} strokeWidth="1" opacity="0.6" />
        <path d="M 90 175 L 110 175" stroke={darken(p.skin, 30)} strokeWidth="0.5" opacity="0.4" />

        {/* Tête - forme plus réaliste */}
        <path d="M 65 90 Q 62 60 80 45 Q 100 38 120 45 Q 138 60 135 90 Q 138 115 130 135 Q 120 155 100 158 Q 80 155 70 135 Q 62 115 65 90 Z" 
          fill={`url(#skin-${p.id})`} />

        {/* Ombrages faciaux (joues, temples) */}
        <path d="M 68 95 Q 65 115 72 130" stroke={darken(p.skin, 25)} strokeWidth="1.2" fill="none" opacity="0.4" />
        <path d="M 132 95 Q 135 115 128 130" stroke={darken(p.skin, 25)} strokeWidth="1.2" fill="none" opacity="0.4" />
        <ellipse cx="75" cy="120" rx="8" ry="12" fill={darken(p.skin, 15)} opacity="0.2" />
        <ellipse cx="125" cy="120" rx="8" ry="12" fill={darken(p.skin, 15)} opacity="0.2" />

        {/* Cheveux selon profil */}
        {renderHair(p)}

        {/* Oreilles */}
        <ellipse cx="62" cy="100" rx="6" ry="10" fill={`url(#skin-${p.id})`} />
        <ellipse cx="138" cy="100" rx="6" ry="10" fill={`url(#skin-${p.id})`} />
        <path d="M 60 98 Q 63 102 60 108" stroke={darken(p.skin, 30)} strokeWidth="0.8" fill="none" />
        <path d="M 140 98 Q 137 102 140 108" stroke={darken(p.skin, 30)} strokeWidth="0.8" fill="none" />

        {/* Sourcils */}
        <path d="M 76 88 Q 84 83 92 87" stroke={darken(p.hair, 10)} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M 108 87 Q 116 83 124 88" stroke={darken(p.hair, 10)} strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* Yeux */}
        <ellipse cx="84" cy="97" rx="5" ry="3.5" fill="white" />
        <ellipse cx="116" cy="97" rx="5" ry="3.5" fill="white" />
        <circle cx={dead ? 82 : 84} cy="97" r="2.5" fill={p.eyes} />
        <circle cx={dead ? 114 : 116} cy="97" r="2.5" fill={p.eyes} />
        <circle cx={dead ? 82.5 : 84.5} cy="96.5" r="0.7" fill="white" />
        <circle cx={dead ? 114.5 : 116.5} cy="96.5" r="0.7" fill="white" />
        
        {/* X morts */}
        {dead && (
          <>
            <line x1="79" y1="92" x2="89" y2="102" stroke="#000" strokeWidth="2" />
            <line x1="89" y1="92" x2="79" y2="102" stroke="#000" strokeWidth="2" />
            <line x1="111" y1="92" x2="121" y2="102" stroke="#000" strokeWidth="2" />
            <line x1="121" y1="92" x2="111" y2="102" stroke="#000" strokeWidth="2" />
          </>
        )}

        {/* Cernes */}
        <path d="M 78 103 Q 84 106 90 103" stroke={darken(p.skin, 20)} strokeWidth="0.6" fill="none" opacity="0.5" />
        <path d="M 110 103 Q 116 106 122 103" stroke={darken(p.skin, 20)} strokeWidth="0.6" fill="none" opacity="0.5" />

        {/* Lunettes */}
        {p.glasses && (
          <g>
            <circle cx="84" cy="97" r="9" fill="none" stroke="#1a1a1a" strokeWidth="1.5" />
            <circle cx="116" cy="97" r="9" fill="none" stroke="#1a1a1a" strokeWidth="1.5" />
            <line x1="93" y1="97" x2="107" y2="97" stroke="#1a1a1a" strokeWidth="1.5" />
            <circle cx="84" cy="97" r="9" fill="rgba(200,220,240,0.15)" />
            <circle cx="116" cy="97" r="9" fill="rgba(200,220,240,0.15)" />
          </g>
        )}

        {/* Nez - plus détaillé */}
        <path d="M 100 100 L 94 125 Q 100 130 106 125 Z" 
          fill={darken(p.skin, 8)} filter={`url(#shadow-${p.id})`} />
        <path d="M 100 105 L 96 122" stroke={darken(p.skin, 20)} strokeWidth="0.5" opacity="0.6" />
        <ellipse cx="96" cy="127" rx="1.5" ry="1" fill={darken(p.skin, 35)} />
        <ellipse cx="104" cy="127" rx="1.5" ry="1" fill={darken(p.skin, 35)} />
        <path d="M 98 128 Q 100 130 102 128" stroke={darken(p.skin, 25)} strokeWidth="0.5" fill="none" />

        {/* Bouche - expression selon état */}
        {dead ? (
          <path d="M 90 142 Q 100 138 110 142" stroke="#4a1818" strokeWidth="2" fill="#3a0a0a" strokeLinecap="round" />
        ) : (
          <>
            <path d="M 90 140 Q 100 144 110 140" stroke="#5a2818" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M 91 141 Q 100 143 109 141" fill="#c96b5a" opacity="0.7" />
            {p.gender === 'f' && (
              <path d="M 91 141 Q 100 143 109 141" fill="#d14848" opacity="0.4" />
            )}
          </>
        )}

        {/* Barbe */}
        {p.beard && (
          <>
            <ellipse cx="100" cy="148" rx="22" ry="10" fill={p.hair} opacity="0.3" />
            <ellipse cx="100" cy="145" rx="18" ry="6" fill={p.hair} opacity="0.4" />
          </>
        )}

        {/* Grain / texture peau */}
        <ellipse cx="82" cy="110" rx="1" ry="1" fill={darken(p.skin, 25)} opacity="0.3" />
        <ellipse cx="115" cy="115" rx="0.8" ry="0.8" fill={darken(p.skin, 25)} opacity="0.3" />
        <ellipse cx="95" cy="135" rx="0.6" ry="0.6" fill={darken(p.skin, 25)} opacity="0.3" />

        {/* Trou de balle si shot */}
        {shot && (
          <g>
            <circle cx="100" cy="97" r="5" fill="#1a0000" />
            <circle cx="100" cy="97" r="3.5" fill="#4a0000" />
            <circle cx="100" cy="97" r="2" fill="#000" />
            {/* Sang qui sort */}
            <path d="M 100 97 Q 100 110 95 130" stroke="#8b0000" strokeWidth="3" fill="none" />
            <path d="M 100 97 Q 102 115 108 135" stroke="#6a0000" strokeWidth="2.5" fill="none" />
          </g>
        )}
      </svg>

      {/* Nom du croupier */}
      {!dead && (
        <div style={{
          position: 'absolute', bottom: -5, left: 0, right: 0,
          textAlign: 'center', color: '#ffd700', fontSize: 11,
          fontFamily: 'Georgia, serif', fontStyle: 'italic',
          textShadow: '1px 1px 2px #000',
        }}>
          ~ {p.name} ~
        </div>
      )}

      {/* Splats */}
      {splats.map((splat) => (
        <div key={splat.id} style={{
          position: 'absolute',
          left: `${splat.x}%`, top: `${splat.y}%`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none', zIndex: 10,
        }}>
          {renderSplat(splat)}
        </div>
      ))}

      {/* Flots de sang réalistes */}
      {bloodStreams && bloodStreams.map((b, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${b.x}%`, top: `${b.y}%`,
          width: b.width, 
          height: b.height,
          background: `linear-gradient(to bottom, #8b0000 0%, #6a0000 50%, #4a0000 100%)`,
          borderRadius: '40% 40% 50% 50% / 10% 10% 90% 90%',
          animation: `bloodFlow ${b.duration}s ease-in forwards`,
          animationDelay: `${b.delay}s`,
          boxShadow: '0 0 4px rgba(139,0,0,0.8)',
          transformOrigin: 'top',
          zIndex: 9,
        }} />
      ))}
    </div>
  );
};

// Helpers couleurs
function lighten(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `rgb(${r},${g},${b})`;
}
function darken(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `rgb(${r},${g},${b})`;
}

function renderHair(p) {
  if (p.gender === 'f') {
    return (
      <>
        <path d={`M 60 80 Q 55 40 100 30 Q 145 40 140 80 Q 155 100 150 140 Q 145 155 135 160 Q 132 130 130 100 Q 120 85 100 83 Q 80 85 70 100 Q 68 130 65 160 Q 55 155 50 140 Q 45 100 60 80 Z`}
          fill={p.hair} />
        <path d={`M 65 75 Q 75 55 100 50 Q 125 55 135 75`} stroke={lighten(p.hair, 10)} strokeWidth="1" fill="none" opacity="0.6" />
      </>
    );
  }
  return (
    <>
      <path d={`M 62 78 Q 65 48 100 42 Q 135 48 138 78 Q 138 65 125 60 Q 110 58 100 60 Q 90 58 75 60 Q 62 65 62 78 Z`}
        fill={p.hair} />
      <path d={`M 65 72 Q 80 55 100 55 Q 120 55 135 72 L 133 65 Q 115 58 100 60 Q 85 58 67 65 Z`}
        fill={darken(p.hair.slice(1) === '0a0603' ? '#0a0603' : p.hair, 5)} />
    </>
  );
}

function renderSplat(splat) {
  if (splat.type === 'tomato') {
    return (
      <div style={{
        width: 80, height: 80,
        background: 'radial-gradient(circle at 30% 30%, #ff4444, #8b0000 60%, #4a0000)',
        borderRadius: '50% 40% 60% 45% / 45% 55% 40% 60%',
        boxShadow: '0 0 10px rgba(139,0,0,0.8), inset -6px -6px 12px rgba(0,0,0,0.4)',
        animation: 'splatGrow 0.3s ease-out',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: -6, left: -10,
          width: 28, height: 18, background: '#c93030',
          borderRadius: '50%', transform: 'rotate(-30deg)',
        }} />
        <div style={{
          position: 'absolute', bottom: -10, right: -12,
          width: 22, height: 14, background: '#a02020',
          borderRadius: '50%', transform: 'rotate(45deg)',
        }} />
        <div style={{
          position: 'absolute', top: '30%', left: -15,
          width: 10, height: 6, background: '#8b0000',
          borderRadius: '50%',
        }} />
      </div>
    );
  }
  if (splat.type === 'beer') {
    return (
      <div style={{
        width: 90, height: 70,
        background: 'radial-gradient(ellipse at 40% 30%, rgba(245,200,80,0.9), rgba(180,120,30,0.7) 70%)',
        borderRadius: '40% 60% 50% 50% / 60% 40% 60% 40%',
        boxShadow: '0 0 12px rgba(245,200,80,0.6), inset -4px -4px 10px rgba(80,40,0,0.4)',
        animation: 'splatGrow 0.3s ease-out',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 5, right: 10,
          width: 10, height: 14, background: 'rgba(150,200,220,0.7)',
          clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
          transform: 'rotate(25deg)',
        }} />
        <div style={{
          position: 'absolute', bottom: 10, left: 15,
          width: 8, height: 10, background: 'rgba(150,200,220,0.7)',
          clipPath: 'polygon(0% 0%, 100% 50%, 50% 100%)',
        }} />
        <div style={{
          position: 'absolute', top: -6, left: 20,
          width: 35, height: 12, background: 'rgba(255,250,240,0.9)',
          borderRadius: '50%',
        }} />
      </div>
    );
  }
  if (splat.type === 'bullet' || splat.type === 'wound') {
    return (
      <div style={{
        width: 50, height: 50,
        background: 'radial-gradient(circle at 50% 50%, #8b0000 0%, #5a0000 40%, transparent 70%)',
        borderRadius: '50%',
        animation: 'splatGrow 0.3s ease-out',
      }}>
        <div style={{
          width: 10, height: 10, background: '#1a0000',
          borderRadius: '50%',
          margin: '20px auto',
          boxShadow: '0 0 8px #000',
        }} />
      </div>
    );
  }
  if (splat.type === 'explosion') {
    return (
      <div style={{
        width: 120, height: 120,
        background: 'radial-gradient(circle, #ff0 0%, #f80 30%, #800 60%, transparent 80%)',
        borderRadius: '50%',
        animation: 'explosion 0.6s ease-out',
      }} />
    );
  }
  return null;
}

// ============== PROJECTILE EN VOL ==============
const FlyingProjectile = ({ type, onComplete }) => {
  useEffect(() => {
    const dur = type === 'bullet' || type === 'shotgun_shot' ? 300 : type === 'rocket' ? 800 : 600;
    const timer = setTimeout(onComplete, dur);
    return () => clearTimeout(timer);
  }, [onComplete, type]);

  if (type === 'bullet' || type === 'shotgun_shot') {
    return (
      <div style={{
        position: 'absolute', bottom: 40, left: '50%',
        width: 30, height: 6,
        animation: 'bulletFly 0.3s linear forwards',
        zIndex: 100, pointerEvents: 'none',
      }}>
        <div style={{
          width: '100%', height: '100%',
          background: 'linear-gradient(to right, transparent, #ff0, #f80)',
          borderRadius: 3,
          boxShadow: '0 0 20px #ff0, 0 0 40px #f80',
        }} />
      </div>
    );
  }
  if (type === 'rocket') {
    return (
      <div style={{
        position: 'absolute', bottom: 20, left: '50%',
        width: 40, height: 12,
        animation: 'rocketFly 0.8s ease-in forwards',
        zIndex: 100, pointerEvents: 'none',
      }}>
        <div style={{
          width: '100%', height: '100%',
          background: 'linear-gradient(to right, #333, #666, #aaa)',
          borderRadius: '3px 6px 6px 3px',
          boxShadow: '0 0 15px #f80',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', left: -30, top: 0, height: '100%', width: 30,
            background: 'linear-gradient(to right, transparent, #f80, #ff0)',
            filter: 'blur(2px)',
          }} />
        </div>
      </div>
    );
  }
  if (type === 'knife' || type === 'machete') {
    return (
      <div style={{
        position: 'absolute', bottom: 20, left: '50%',
        width: 50, height: 10,
        animation: 'knifeFly 0.5s linear forwards',
        zIndex: 100, pointerEvents: 'none',
      }}>
        <div style={{
          width: '100%', height: '100%',
          background: 'linear-gradient(to right, #666, #ccc 20%, #fff 50%, #ccc 80%, #333)',
          clipPath: type === 'machete' ? 'polygon(0% 30%, 80% 0%, 100% 50%, 80% 100%, 0% 70%)' : 'polygon(0% 30%, 70% 0%, 100% 50%, 70% 100%, 0% 70%)',
          boxShadow: '0 0 10px rgba(255,255,255,0.5)',
        }} />
      </div>
    );
  }
  return (
    <div style={{
      position: 'absolute', bottom: 20, left: '50%',
      width: 40, height: 40,
      animation: 'throwProjectile 0.6s ease-in forwards',
      zIndex: 100, pointerEvents: 'none',
    }}>
      {type === 'tomato' ? (
        <div style={{
          width: '100%', height: '100%',
          background: 'radial-gradient(circle at 30% 30%, #ff4444, #8b0000)',
          borderRadius: '50%',
          boxShadow: '0 0 15px rgba(255,0,0,0.6)',
        }} />
      ) : (
        <div style={{
          width: 30, height: 45,
          background: 'linear-gradient(to bottom, #8b6914, #5a4510)',
          borderRadius: '5px 5px 8px 8px',
          margin: '0 auto',
          boxShadow: '0 0 10px rgba(0,0,0,0.5)',
        }} />
      )}
    </div>
  );
};

// ============== CARTE ==============
const Card = ({ card, hidden, delay = 0, small = false }) => {
  const w = small ? 50 : 70;
  const h = small ? 72 : 100;
  if (hidden) {
    return (
      <div style={{
        width: w, height: h,
        background: 'linear-gradient(135deg, #8b0000, #4a0000)',
        borderRadius: 6, border: '2px solid #ffd700',
        animation: `cardDeal 0.4s ease-out ${delay}s both`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', inset: 4,
          border: '1px solid #ffd700', borderRadius: 3,
          background: 'repeating-linear-gradient(45deg, #8b0000, #8b0000 4px, #6a0000 4px, #6a0000 8px)',
        }} />
      </div>
    );
  }
  const isRed = card.suit === '♥' || card.suit === '♦';
  return (
    <div style={{
      width: w, height: h,
      background: 'linear-gradient(145deg, #fff, #e8e8e8)',
      borderRadius: 6, border: '1px solid #aaa',
      padding: small ? 3 : 5,
      position: 'relative',
      animation: `cardDeal 0.4s ease-out ${delay}s both`,
      boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
      fontFamily: 'Georgia, serif',
    }}>
      <div style={{ color: isRed ? '#c00' : '#000', fontWeight: 'bold', fontSize: small ? 11 : 15, lineHeight: 1 }}>
        <div>{card.rank}</div>
        <div style={{ fontSize: small ? 13 : 17 }}>{card.suit}</div>
      </div>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        fontSize: small ? 26 : 36, color: isRed ? '#c00' : '#000' }}>
        {card.suit}
      </div>
      <div style={{ position: 'absolute', bottom: small ? 3 : 5, right: small ? 3 : 5,
        color: isRed ? '#c00' : '#000', fontWeight: 'bold', fontSize: small ? 11 : 15,
        transform: 'rotate(180deg)', lineHeight: 1 }}>
        <div>{card.rank}</div>
        <div style={{ fontSize: small ? 13 : 17 }}>{card.suit}</div>
      </div>
    </div>
  );
};

// ============== JETON ==============
const Chip = ({ value, onClick, selected, disabled, size = 60 }) => {
  const colors = {
    5: ['#fff', '#ccc', '#000'],
    10: ['#1a1a8a', '#0a0a5a', '#fff'],
    25: ['#0a6a0a', '#054a05', '#fff'],
    100: ['#1a1a1a', '#000', '#fff'],
    500: ['#8b008b', '#5a005a', '#fff'],
    1000: ['#ffd700', '#b8860b', '#000'],
    5000: ['#ff0080', '#a00050', '#fff'],
    10000: ['#00d4ff', '#0080a0', '#000'],
    50000: ['#00ff88', '#00aa44', '#000'],
    100000: ['#ff00ff', '#aa00aa', '#fff'],
    500000: ['#9400d3', '#4b0082', '#fff'],
    1000000: ['#ff1493', '#8b008b', '#fff'],
    5000000: ['#ffd700', '#ff8c00', '#000'],
    10000000: ['#000000', '#ffd700', '#ffd700'],
  };
  const [main, dark, text] = colors[value] || colors[5];
  const isPlaque = value >= 50000; // Plaquette rectangulaire pour VIP
  
  if (isPlaque) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          width: size * 1.3, height: size * 0.65,
          borderRadius: 6,
          border: selected ? '3px solid #ffd700' : `1px solid ${text}`,
          background: `linear-gradient(135deg, ${main} 0%, ${dark} 50%, ${main} 100%)`,
          color: text,
          fontWeight: 'bold',
          fontSize: size < 50 ? 11 : 14,
          letterSpacing: 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.4 : 1,
          fontFamily: 'Georgia, serif',
          position: 'relative',
          boxShadow: selected
            ? `0 0 25px #ffd700, 0 4px 10px rgba(0,0,0,0.7)`
            : `0 4px 8px rgba(0,0,0,0.7), inset 0 0 10px rgba(255,255,255,0.15)`,
          transition: 'transform 0.15s',
          transform: selected ? 'translateY(-4px)' : 'translateY(0)',
          backgroundImage: `linear-gradient(135deg, ${main} 0%, ${dark} 50%, ${main} 100%), repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(255,215,0,0.15) 4px, rgba(255,215,0,0.15) 5px)`,
        }}
      >
        {value >= 1000000 ? `${value/1000000}M` : `${value/1000}K`}
      </button>
    );
  }
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: size, height: size,
        borderRadius: '50%',
        border: selected ? '3px solid #ffd700' : `2px dashed ${text}`,
        background: `radial-gradient(circle at 30% 30%, ${main}, ${dark})`,
        color: text,
        fontWeight: 'bold',
        fontSize: size < 50 ? 10 : 12,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        fontFamily: 'Georgia, serif',
        position: 'relative',
        boxShadow: selected 
          ? `0 0 20px #ffd700, 0 4px 8px rgba(0,0,0,0.6), inset 0 0 8px rgba(0,0,0,0.3)`
          : `0 4px 8px rgba(0,0,0,0.6), inset 0 0 8px rgba(0,0,0,0.3)`,
        transition: 'transform 0.15s',
        transform: selected ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      {value >= 1000000 ? `${value/1000000}M` : value >= 1000 ? `${value/1000}K` : value}
    </button>
  );
};

const ChipStack = ({ amount, size = 'small' }) => {
  if (!amount) return null;
  const stackHeight = Math.min(6, Math.ceil(amount / 1000));
  const w = size === 'small' ? 24 : 36;
  return (
    <div style={{
      position: 'absolute',
      bottom: size === 'small' ? -6 : -4, right: size === 'small' ? -6 : -4,
      width: w, height: stackHeight * 3 + 8,
      animation: 'chipDrop 0.3s ease-out',
    }}>
      {[...Array(stackHeight)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          bottom: i * 3, left: 0, right: 0,
          height: w, 
          borderRadius: '50%',
          background: `radial-gradient(circle, #ffd700, #b8860b)`,
          border: '1px solid #000',
          boxShadow: '0 1px 2px rgba(0,0,0,0.6)',
        }} />
      ))}
      <div style={{
        position: 'absolute', top: -18, left: 0, right: 0,
        textAlign: 'center', color: '#ffd700', fontSize: 10, fontWeight: 'bold',
        textShadow: '1px 1px 2px #000',
      }}>
        {amount >= 1000000 ? `${(amount/1000000).toFixed(amount % 1000000 === 0 ? 0 : 1)}M` : amount >= 1000 ? `${(amount/1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K` : amount}
      </div>
    </div>
  );
};

// ============== ROUE DE LA FORTUNE - 2D FLAT (droite, recto-verso) ==============
const FortuneWheel3D = ({ onComplete, onClose, canSpin, nextSpinTime, casino }) => {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [countdown, setCountdown] = useState("");
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (canSpin) return;
    const update = () => {
      const remaining = nextSpinTime - Date.now();
      if (remaining <= 0) { setCountdown("Disponible !"); return; }
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setCountdown(h+"h "+m+"m "+s+"s");
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [canSpin, nextSpinTime]);

  const spin = () => {
    if (spinning || !canSpin) return;
    setSpinning(true);

    const totalWeight = WHEEL_PRIZES.reduce((s, p) => s + p.weight, 0);
    let r = Math.random() * totalWeight;
    let selectedIdx = 0;
    for (let i = 0; i < WHEEL_PRIZES.length; i++) {
      r -= WHEEL_PRIZES[i].weight;
      if (r <= 0) { selectedIdx = i; break; }
    }

    const segAng = 360 / WHEEL_PRIZES.length;
    const targetAngle = 360 - (selectedIdx * segAng + segAng / 2);
    const extraSpins = 6 + Math.floor(Math.random() * 3);
    const newRot = rotation - (rotation % 360) + extraSpins * 360 + targetAngle;
    setRotation(newRot);

    setTimeout(() => {
      setResult(WHEEL_PRIZES[selectedIdx]);
      setSpinning(false);
    }, 5200);
  };

  const segAngle = 360 / WHEEL_PRIZES.length;
  const radius = 150;
  const innerRadius = 55;

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "radial-gradient(ellipse at center, #2a1010 0%, #000 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      zIndex: 1500, padding: 16,
    }}>
      <button onClick={onClose} style={{
        position: "absolute", top: 20, right: 20,
        padding: "8px 16px",
        background: "rgba(0,0,0,0.6)", border: "1px solid #ffd700",
        color: "#ffd700", borderRadius: 6, cursor: "pointer", fontFamily: "Georgia, serif",
        zIndex: 10,
      }} data-testid="wheel-close">Fermer</button>

      <h2 style={{
        color: "#ffd700", fontFamily: "Georgia, serif",
        fontSize: 26, marginBottom: 12, textAlign: "center",
        letterSpacing: 4, textShadow: "0 0 30px #ffd700, 0 0 60px #ff8800",
        animation: "neonPulse 2s ease-in-out infinite",
      }}>ROUE DE LA FORTUNE</h2>

      {!canSpin && !result && (
        <div style={{
          background: "rgba(0,0,0,0.7)", border: "2px solid " + casino.primary,
          borderRadius: 10, padding: 12, marginBottom: 12,
          textAlign: "center", color: "#fff",
        }}>
          <div style={{ fontSize: 13, marginBottom: 4 }}>Prochaine rotation dans :</div>
          <div style={{ color: "#ffd700", fontSize: 22, fontWeight: "bold" }}>{countdown}</div>
        </div>
      )}

      {/* 2D flat wheel */}
      <div style={{ position: "relative", width: "min(340px, 90vw)", height: "min(340px, 90vw)", maxHeight: "60vh" }}>
        {/* Pointer on top */}
        <div style={{
          position: "absolute", top: -6, left: "50%", transform: "translateX(-50%)",
          width: 0, height: 0,
          borderLeft: "14px solid transparent", borderRight: "14px solid transparent",
          borderTop: "22px solid #ff3030", zIndex: 10,
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,.6))",
        }} />

        <svg viewBox="-170 -170 340 340" width="100%" height="100%"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? "transform 5s cubic-bezier(.12,.65,.25,1)" : "transform 0.4s",
            filter: "drop-shadow(0 10px 30px rgba(255,215,0,.3))",
          }}
          data-testid="wheel-svg">
          {/* Outer ring */}
          <circle r="168" fill="#2a1a0a" stroke="#ffd700" strokeWidth="4" />
          {WHEEL_PRIZES.map((prize, i) => {
            const startA = (i * segAngle - 90 - segAngle/2) * Math.PI / 180;
            const endA = ((i+1) * segAngle - 90 - segAngle/2) * Math.PI / 180;
            const x1 = Math.cos(startA) * radius, y1 = Math.sin(startA) * radius;
            const x2 = Math.cos(endA) * radius, y2 = Math.sin(endA) * radius;
            const x3 = Math.cos(endA) * innerRadius, y3 = Math.sin(endA) * innerRadius;
            const x4 = Math.cos(startA) * innerRadius, y4 = Math.sin(startA) * innerRadius;
            const midA = ((i * segAngle + segAngle/2) - 90 - segAngle/2) * Math.PI / 180;
            const tx = Math.cos(midA) * ((radius + innerRadius) / 2);
            const ty = Math.sin(midA) * ((radius + innerRadius) / 2);
            return (
              <g key={i}>
                <path d={`M${x1},${y1} L${x2},${y2} L${x3},${y3} L${x4},${y4} Z`}
                  fill={prize.color} stroke="#ffd700" strokeWidth="2" />
                {/* Counter-rotate text to keep it upright no matter the wheel rotation (recto-verso readability) */}
                <g transform={`translate(${tx} ${ty}) rotate(${-rotation})`}>
                  <text x="0" y="0" fill="#fff" fontSize={prize.label === "JACKPOT" ? 14 : 18} fontWeight="800"
                    textAnchor="middle" dominantBaseline="central"
                    style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 3 }}>
                    {prize.label}
                  </text>
                </g>
              </g>
            );
          })}
          {/* Center */}
          <circle r={innerRadius} fill="#1a1a1a" stroke="#ffd700" strokeWidth="3" />
          <circle r={innerRadius - 12} fill="#0f0f14" stroke="#8b6914" strokeWidth="1" />
          <circle r="14" fill="#ffd700" />
          {/* Bulbs around rim */}
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <circle key={i} cx={Math.cos(a) * 160} cy={Math.sin(a) * 160} r="5"
              fill="#fff8a0" stroke="#b8860b" strokeWidth="1" />;
          })}
        </svg>
      </div>

      <div style={{ marginTop: 20 }}>
        {!result && canSpin && (
          <button onClick={spin} disabled={spinning}
            data-testid="wheel-spin-btn"
            style={{
              padding: "16px 44px", fontSize: 20,
              background: spinning ? "#555" : "linear-gradient(135deg, #ffd700, #b8860b)",
              color: "#1a1a1a", border: "3px solid #fff", borderRadius: 10,
              cursor: spinning ? "not-allowed" : "pointer",
              fontWeight: "bold", fontFamily: "Georgia, serif",
              boxShadow: "0 8px 25px rgba(255,215,0,0.7)",
              letterSpacing: 2,
            }}>
            {spinning ? "TOURNE..." : "TOURNER"}
          </button>
        )}

        {result && (
          <div style={{ textAlign: "center", animation: "prizeReveal 0.6s ease-out" }}>
            <div style={{
              fontSize: result.label === "JACKPOT" ? 36 : 26,
              color: result.label === "JACKPOT" ? "#ff0080" : "#ffd700",
              fontWeight: "bold", fontFamily: "Georgia, serif",
              textShadow: `0 0 40px ${result.label === "JACKPOT" ? "#ff0080" : "#ffd700"}`,
              marginBottom: 16,
            }}>
              {result.label === "RIEN" ? "Dommage !" :
               result.label === "JACKPOT" ? "JACKPOT ! +1 000 000 B" :
               "+" + fmt(result.value) + " Benzouz"}
            </div>
            <button onClick={() => onComplete(result.value)}
              data-testid="wheel-claim-btn"
              style={{
                padding: "14px 40px", fontSize: 18,
                background: "linear-gradient(135deg, #ffd700, #b8860b)",
                color: "#1a1a1a", border: "none", borderRadius: 8,
                cursor: "pointer", fontWeight: "bold", fontFamily: "Georgia, serif",
              }}>Recuperer</button>
          </div>
        )}
      </div>
    </div>
  );
};



// ============== ÉCRAN DE CONNEXION + CASINO ==============
const LoginScreen = ({ onLogin, savedProfiles }) => {
  const [name, setName] = useState('');
  const [selectedCasino, setSelectedCasino] = useState(null);
  const [mode, setMode] = useState('select');

  if (mode === 'select' && savedProfiles.length > 0) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at center, #1a0a0a 0%, #000 70%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, fontFamily: 'Georgia, serif',
      }}>
        <div style={{
          background: 'linear-gradient(145deg, #2a1a0a, #0a0503)',
          border: '2px solid #ffd700', borderRadius: 12, padding: 40,
          maxWidth: 500, width: '100%',
          boxShadow: '0 0 60px rgba(255,215,0,0.3)',
        }}>
          <h1 style={{
            color: '#ffd700', fontSize: 42, textAlign: 'center', margin: 0,
            textShadow: '0 0 20px rgba(255,215,0,0.6)', letterSpacing: 3,
          }}>BENZOUZ</h1>
          <div style={{ textAlign: 'center', color: '#cca366', fontStyle: 'italic', marginBottom: 30 }}>
            ~ Casino Royal ~
          </div>

          <div style={{ color: '#ffd700', marginBottom: 12, fontSize: 14 }}>Profils existants :</div>
          {savedProfiles.map((p) => {
            const c = CASINOS[p.casino] || CASINOS.vegas;
            return (
              <button key={p.name} onClick={() => onLogin(p.name, false)}
                style={{
                  width: '100%', padding: 14, marginBottom: 8,
                  background: `linear-gradient(90deg, ${c.primary}22, transparent)`,
                  border: `1px solid ${c.primary}`, borderRadius: 8, color: '#fff',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 15,
                  textAlign: 'left', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <div>
                  <div>{c.country} {p.name}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{c.name}</div>
                </div>
                <span style={{ color: c.primary, fontSize: 13 }}>{fmt(p.totalWinnings)} B</span>
              </button>
            );
          })}
          <button onClick={() => setMode('new')}
            style={{
              width: '100%', padding: 12, marginTop: 8, background: 'transparent',
              border: '1px dashed #cca366', color: '#cca366',
              borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
            }}>+ Nouveau joueur</button>
        </div>
      </div>
    );
  }

  // Sélection casino + nom
  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at center, #1a0a0a 0%, #000 70%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, fontFamily: 'Georgia, serif',
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #2a1a0a, #0a0503)',
        border: '2px solid #ffd700', borderRadius: 12, padding: 30,
        maxWidth: 700, width: '100%',
        boxShadow: '0 0 60px rgba(255,215,0,0.3)',
      }}>
        <h1 style={{
          color: '#ffd700', fontSize: 42, textAlign: 'center', margin: 0,
          textShadow: '0 0 20px rgba(255,215,0,0.6)', letterSpacing: 3,
        }}>BENZOUZ</h1>
        <div style={{ textAlign: 'center', color: '#cca366', fontStyle: 'italic', marginBottom: 25 }}>
          ~ Choisis ton casino ~
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10, marginBottom: 25,
        }}>
          {Object.entries(CASINOS).map(([id, c]) => (
            <button key={id} onClick={() => setSelectedCasino(id)}
              style={{
                padding: 16,
                background: selectedCasino === id 
                  ? `linear-gradient(135deg, ${c.primary}, ${c.accent})`
                  : 'rgba(0,0,0,0.4)',
                border: selectedCasino === id ? `3px solid ${c.secondary}` : `2px solid ${c.primary}`,
                borderRadius: 10, cursor: 'pointer',
                color: selectedCasino === id ? '#fff' : '#ccc',
                transition: 'all 0.2s', fontFamily: 'inherit',
                transform: selectedCasino === id ? 'scale(1.03)' : 'scale(1)',
                boxShadow: selectedCasino === id ? `0 0 20px ${c.primary}` : 'none',
              }}>
              <div style={{ fontSize: 26, marginBottom: 4 }}>{c.country}</div>
              <div style={{ fontWeight: 'bold', fontSize: 13 }}>{c.name}</div>
              <div style={{ fontSize: 10, opacity: 0.8, fontStyle: 'italic', marginTop: 4 }}>
                {c.tagline}
              </div>
              <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 6 }}>
                {c.flag.map((col, i) => (
                  <div key={i} style={{
                    width: 14, height: 6, background: col,
                    borderRadius: 1, border: '0.5px solid rgba(0,0,0,0.2)',
                  }} />
                ))}
              </div>
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Ton pseudo de joueur"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && name.trim() && selectedCasino) onLogin(name.trim(), true, selectedCasino); }}
          style={{
            width: '100%', padding: 12,
            background: 'rgba(0,0,0,0.5)', border: '1px solid #ffd700',
            borderRadius: 8, color: '#fff', fontSize: 16,
            fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 12,
          }}
        />
        <button
          onClick={() => name.trim() && selectedCasino && onLogin(name.trim(), true, selectedCasino)}
          disabled={!name.trim() || !selectedCasino}
          style={{
            width: '100%', padding: 14,
            background: (!name.trim() || !selectedCasino) ? '#555' : 'linear-gradient(135deg, #ffd700, #b8860b)',
            color: '#1a1a1a', border: 'none', borderRadius: 8,
            fontSize: 16, fontWeight: 'bold',
            cursor: (!name.trim() || !selectedCasino) ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}>ENTRER DANS LE CASINO</button>
        {savedProfiles.length > 0 && (
          <button onClick={() => setMode('select')}
            style={{
              width: '100%', marginTop: 8, padding: 8,
              background: 'transparent', border: 'none',
              color: '#cca366', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
            }}>← Retour aux profils</button>
        )}
      </div>
    </div>
  );
};

// ============== VUE ARME 1ÈRE PERSONNE (SVG overlay) ==============
const FPWeaponView = ({ id }) => {
  const hands = (
    <g>
      <ellipse cx="60" cy="240" rx="55" ry="24" fill="#d2a27c" stroke="#8a6040" strokeWidth="2" />
      <ellipse cx="210" cy="240" rx="50" ry="20" fill="#d2a27c" stroke="#8a6040" strokeWidth="2" />
    </g>
  );
  if (id === 'knife') {
    return (
      <svg viewBox="0 0 340 260" style={{ width: '100%' }}>
        {hands}
        <g stroke="#d4af37" strokeWidth="2">
          <rect x="140" y="100" width="14" height="120" fill="#1a1a1a" />
          <rect x="136" y="220" width="22" height="24" fill="#3a2010" />
        </g>
      </svg>
    );
  }
  if (id === 'machete') {
    return (
      <svg viewBox="0 0 340 260" style={{ width: '100%' }}>
        {hands}
        <g stroke="#d4af37" strokeWidth="2">
          <path d="M140 90 L160 90 L170 220 L130 220 Z" fill="#c0c0c0" />
          <rect x="130" y="220" width="40" height="20" fill="#3a1a0a" />
        </g>
      </svg>
    );
  }
  if (id === 'gun') {
    return (
      <svg viewBox="0 0 340 260" style={{ width: '100%' }}>
        {hands}
        <g fill="#1a1a1a" stroke="#d4af37" strokeWidth="2">
          <path d="M80 160 L260 160 L260 186 L120 186 L110 230 L80 230 L70 186 L70 160 Z" />
          <rect x="250" y="148" width="30" height="16" rx="3" />
        </g>
      </svg>
    );
  }
  if (id === 'shotgun') {
    return (
      <svg viewBox="0 0 340 260" style={{ width: '100%' }}>
        {hands}
        <g stroke="#d4af37" strokeWidth="2">
          <rect x="30" y="150" width="260" height="14" fill="#1a1a1a" />
          <path d="M30 152 L90 152 L100 195 L80 225 L40 225 L28 195 Z" fill="#5a3a1e" />
          <rect x="290" y="140" width="32" height="28" rx="3" fill="#1a1a1a" />
        </g>
      </svg>
    );
  }
  if (id === 'bazooka') {
    return (
      <svg viewBox="0 0 340 260" style={{ width: '100%' }}>
        {hands}
        <g stroke="#d4af37" strokeWidth="2">
          <rect x="30" y="138" width="280" height="40" rx="10" fill="#3a3a3a" />
          <rect x="20" y="128" width="30" height="60" fill="#111" />
          <circle cx="310" cy="158" r="24" fill="#1a1a1a" stroke="#ffd700" strokeWidth="3" />
        </g>
      </svg>
    );
  }
  if (id === 'flamethrower') {
    return (
      <svg viewBox="0 0 340 260" style={{ width: '100%' }}>
        {hands}
        <g stroke="#d4af37" strokeWidth="2">
          <rect x="60" y="148" width="240" height="16" fill="#2a2a2a" />
          <circle cx="300" cy="156" r="18" fill="#ff6a00" />
          <rect x="110" y="164" width="36" height="34" fill="#3a1a0a" />
          <rect x="60" y="130" width="40" height="60" rx="6" fill="#c00" />
        </g>
      </svg>
    );
  }
  return null;
};

// ============== VUE PERSONNAGE 3ÈME PERSONNE ==============
const TPPlayerView = ({ profile, selectedWeapon, firing }) => {
  const hair = (profile && profile.hair !== undefined) ? profile.hair : 0;
  const outfit = (profile && profile.outfit !== undefined) ? profile.outfit : 0;
  const shoes = (profile && profile.shoes !== undefined) ? profile.shoes : 0;
  const skin = (profile && profile.skin) || '#e0b48a';
  const equippedVeh = profile && profile.equippedVehicle;
  const hairColor = HAIR_CATALOG[hair]?.color || '#3a2817';
  const outfitColor = OUTFIT_CATALOG[outfit]?.color || '#1a1a1a';
  const shoesColor = SHOES_CATALOG[shoes]?.color || '#111';

  return (
    <div style={{
      filter: firing ? 'brightness(1.2)' : 'brightness(1)',
      transform: firing ? 'translate(-4px, 4px)' : 'none',
      transition: 'transform .08s, filter .08s',
      position: 'relative',
    }}>
      <svg viewBox="0 0 80 140" width="140" height="240">
        <ellipse cx="40" cy="136" rx="22" ry="3" fill="rgba(0,0,0,.4)" />
        <rect x="28" y="90" width="10" height="36" rx="3" fill={outfitColor} />
        <rect x="42" y="90" width="10" height="36" rx="3" fill={outfitColor} />
        <rect x="26" y="122" width="14" height="8" rx="3" fill={shoesColor} />
        <rect x="40" y="122" width="14" height="8" rx="3" fill={shoesColor} />
        <rect x="22" y="56" width="36" height="38" rx="8" fill={outfitColor} />
        <rect x="12" y="58" width="10" height="30" rx="5" fill={outfitColor} />
        <rect x="58" y="58" width="10" height="30" rx="5" fill={outfitColor} />
        <circle cx="17" cy="90" r="5" fill={skin} />
        <circle cx="63" cy="90" r="5" fill={skin} />
        <circle cx="40" cy="38" r="14" fill={skin} />
        <path d="M26 30 Q40 14 54 30 L54 38 Q40 32 26 38 Z" fill={hairColor} />
        <circle cx="35" cy="38" r="1.3" fill="#111" />
        <circle cx="45" cy="38" r="1.3" fill="#111" />
      </svg>
      {/* Vehicle under character */}
      {equippedVeh && (
        <div style={{
          position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)',
          zIndex: -1,
        }}>
          <div style={{ width: 160 }}>
            <VehicleGraphic id={equippedVeh} />
          </div>
        </div>
      )}
      {/* Weapon attached to hand */}
      {selectedWeapon && (
        <div style={{
          position: 'absolute', right: -40, top: 110,
          transform: firing ? 'rotate(-8deg)' : 'rotate(0)',
          transition: 'transform .08s',
        }}>
          <div style={{ width: 80 }}>
            <FPWeaponView id={selectedWeapon} />
          </div>
        </div>
      )}
    </div>
  );
};

// ============== LOBBY 3D ==============
// ============== ICÔNES D'ARMES SVG RÉALISTES ==============
const WeaponIcon = ({ id, size = 60 }) => {
  const s = size;
  if (id === 'knife') return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      <defs>
        <linearGradient id="bladeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8e8e8" />
          <stop offset="50%" stopColor="#c0c0c0" />
          <stop offset="100%" stopColor="#666" />
        </linearGradient>
      </defs>
      <polygon points="15,45 75,40 80,50 75,55 15,52" fill="url(#bladeGrad)" stroke="#444" strokeWidth="0.5" />
      <polygon points="15,45 15,52 5,55 5,42" fill="#2a1810" />
      <rect x="0" y="44" width="15" height="12" fill="#4a2810" rx="2" />
      <line x1="3" y1="47" x2="12" y2="47" stroke="#2a1810" strokeWidth="0.5" />
      <line x1="3" y1="50" x2="12" y2="50" stroke="#2a1810" strokeWidth="0.5" />
      <line x1="3" y1="53" x2="12" y2="53" stroke="#2a1810" strokeWidth="0.5" />
      <polygon points="75,42 80,45 78,50 75,48" fill="#888" />
    </svg>
  );
  if (id === 'machete') return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      <defs>
        <linearGradient id="machGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d0d0d0" />
          <stop offset="100%" stopColor="#555" />
        </linearGradient>
      </defs>
      <path d="M 10 50 L 85 38 L 90 45 L 88 55 L 15 58 Z" fill="url(#machGrad)" stroke="#333" strokeWidth="0.5" />
      <rect x="0" y="46" width="15" height="16" fill="#1a0a04" rx="2" />
      <circle cx="3" cy="50" r="0.8" fill="#ffd700" />
      <circle cx="7" cy="50" r="0.8" fill="#ffd700" />
      <circle cx="11" cy="50" r="0.8" fill="#ffd700" />
    </svg>
  );
  if (id === 'gun') return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      <defs>
        <linearGradient id="gunGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a3a3a" />
          <stop offset="50%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>
      </defs>
      <rect x="20" y="42" width="55" height="12" fill="url(#gunGrad)" rx="1" />
      <rect x="75" y="44" width="8" height="8" fill="#000" />
      <rect x="18" y="52" width="20" height="20" fill="url(#gunGrad)" rx="2" />
      <polygon points="22,52 35,52 30,72 22,72" fill="#1a1a1a" />
      <rect x="30" y="54" width="6" height="10" fill="#444" />
      <circle cx="33" cy="59" r="2" fill="#000" />
      <rect x="22" y="44" width="3" height="8" fill="#666" />
      <rect x="72" y="40" width="4" height="3" fill="#666" />
    </svg>
  );
  if (id === 'shotgun') return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      <defs>
        <linearGradient id="shotGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a2810" />
          <stop offset="100%" stopColor="#2a1a0a" />
        </linearGradient>
      </defs>
      <rect x="5" y="47" width="70" height="6" fill="#1a1a1a" />
      <rect x="75" y="45" width="20" height="10" fill="url(#shotGrad)" rx="1" />
      <polygon points="2,48 5,47 5,53 2,52" fill="#666" />
      <circle cx="3" cy="50" r="1.5" fill="#000" />
      <rect x="40" y="53" width="15" height="4" fill="#333" />
      <rect x="55" y="55" width="8" height="3" fill="#666" />
    </svg>
  );
  if (id === 'bazooka') return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      <defs>
        <linearGradient id="bazGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a5a2a" />
          <stop offset="100%" stopColor="#1a2a0a" />
        </linearGradient>
      </defs>
      <rect x="10" y="42" width="70" height="14" fill="url(#bazGrad)" rx="3" />
      <circle cx="10" cy="49" r="7" fill="#1a1a1a" stroke="#333" strokeWidth="1" />
      <circle cx="10" cy="49" r="5" fill="#000" />
      <rect x="80" y="44" width="12" height="10" fill="#2a3a0a" rx="2" />
      <rect x="35" y="56" width="10" height="6" fill="#333" />
      <circle cx="25" cy="42" r="2" fill="#ff4" />
      <text x="50" y="51" fill="#ff0" fontSize="5" fontWeight="bold">RPG</text>
    </svg>
  );
  if (id === 'flamethrower') return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      <defs>
        <linearGradient id="flameGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a6820" />
          <stop offset="100%" stopColor="#4a3810" />
        </linearGradient>
        <radialGradient id="fireJet">
          <stop offset="0%" stopColor="#ffff00" />
          <stop offset="50%" stopColor="#ff8800" />
          <stop offset="100%" stopColor="#ff0000" stopOpacity="0.5" />
        </radialGradient>
      </defs>
      <ellipse cx="20" cy="50" rx="12" ry="18" fill="url(#flameGrad)" />
      <rect x="28" y="46" width="40" height="8" fill="#2a2a2a" rx="1" />
      <circle cx="70" cy="50" r="4" fill="#1a1a1a" stroke="#666" strokeWidth="1" />
      <circle cx="70" cy="50" r="2" fill="#000" />
      <ellipse cx="82" cy="50" rx="12" ry="6" fill="url(#fireJet)" opacity="0.9" />
      <ellipse cx="88" cy="50" rx="8" ry="3" fill="#ff0" opacity="0.7" />
      <rect x="38" y="54" width="8" height="5" fill="#444" />
      <rect x="18" y="32" width="4" height="8" fill="#666" />
    </svg>
  );
  return <div style={{fontSize: s * 0.7}}>⚔️</div>;
};

// ============== ÉCRAN TOILETTES - ANIMATION PIPI ==============
const ToiletScreen = ({ onExit, casino }) => {
  const [phase, setPhase] = useState('start');
  const [drops, setDrops] = useState([]);
  const [streamHeight, setStreamHeight] = useState(0);
  
  useEffect(() => {
    if (phase !== 'peeing') return;
    const id = setInterval(() => {
      setDrops(prev => [...prev, { id: Date.now() + Math.random(), x: Math.random() * 10 - 5 }].slice(-15));
    }, 80);
    // Animation du jet qui grossit
    const streamAnim = setInterval(() => {
      setStreamHeight(h => Math.min(100, h + 5));
    }, 50);
    const end = setTimeout(() => setPhase('done'), 4000);
    return () => { clearInterval(id); clearInterval(streamAnim); clearTimeout(end); };
  }, [phase]);
  
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(180deg, #d4d4d0 0%, #b0b0a8 50%, #888880 100%)',
      fontFamily: 'Georgia, serif', color: '#333',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20,
    }}>
      {/* Mur carrelage */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(0,0,0,0.08) 40px, rgba(0,0,0,0.08) 42px),
          repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,0,0,0.08) 40px, rgba(0,0,0,0.08) 42px)
        `,
      }} />
      
      {/* Bouton SORTIR PERMANENT en haut à droite */}
      <button onClick={onExit} style={{
        position: 'absolute', top: 20, right: 20, zIndex: 100,
        padding: '10px 20px',
        background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
        color: '#fff', border: '2px solid ' + casino.secondary,
        borderRadius: 8, cursor: 'pointer',
        fontFamily: 'inherit', fontWeight: 'bold', fontSize: 14,
        boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
      }}>← Sortir</button>
      
      {/* Urinoir */}
      <div style={{
        position: 'relative', width: 200, height: 300,
        background: 'linear-gradient(180deg, #fff 0%, #e8e8e8 50%, #c0c0c0 100%)',
        borderRadius: '50% 50% 20% 20% / 40% 40% 10% 10%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset -10px -10px 20px rgba(0,0,0,0.15)',
        border: '2px solid #999',
      }}>
        <div style={{
          position: 'absolute', top: 30, left: '50%', transform: 'translateX(-50%)',
          width: 40, height: 10, background: '#888', borderRadius: '50%',
        }} />
        {/* Flaque */}
        <div style={{
          position: 'absolute', bottom: 20, left: '20%', right: '20%',
          height: phase === 'peeing' || phase === 'done' ? 40 : 0,
          background: 'radial-gradient(ellipse, #f0d040aa, #b09020aa)',
          borderRadius: '50%',
          transition: 'height 4s linear',
          boxShadow: '0 0 10px rgba(240,200,64,0.4)',
        }} />
        
        {/* Jet continu */}
        {phase === 'peeing' && (
          <div style={{
            position: 'absolute', top: 100, left: '50%',
            transform: 'translateX(-50%)',
            width: 6,
            height: streamHeight + '%',
            background: 'linear-gradient(180deg, transparent 0%, #ffef60 30%, #f0d040 100%)',
            borderRadius: 3,
            opacity: 0.9,
          }} />
        )}
        
        {/* Éclaboussures */}
        {phase === 'peeing' && drops.map(d => (
          <div key={d.id} style={{
            position: 'absolute',
            bottom: 40 + Math.random() * 20,
            left: `calc(50% + ${d.x * 3}px)`,
            width: 3, height: 8,
            background: '#f0d040',
            borderRadius: '50%',
            opacity: 0.8,
            boxShadow: '0 0 3px rgba(240,200,64,0.6)',
          }} />
        ))}
      </div>
      
      <div style={{
        marginTop: 30, padding: 16,
        background: 'rgba(0,0,0,0.85)', borderRadius: 10,
        color: '#fff', textAlign: 'center', minWidth: 280,
        zIndex: 10,
      }}>
        {phase === 'start' && (
          <>
            <div style={{ fontSize: 18, marginBottom: 12 }}>🚻 Toilettes</div>
            <button onClick={() => setPhase('peeing')}
              style={{
                padding: '12px 28px',
                background: 'linear-gradient(135deg, #ffd700, #b8860b)',
                color: '#000', border: 'none', borderRadius: 8,
                fontSize: 16, fontWeight: 'bold', cursor: 'pointer',
                fontFamily: 'inherit',
              }}>💧 Faire pipi</button>
          </>
        )}
        {phase === 'peeing' && (
          <div style={{ fontSize: 20, color: '#ffd700' }}>
            💧 En cours... Ahhhh 💧
          </div>
        )}
        {phase === 'done' && (
          <>
            <div style={{ fontSize: 18, color: '#00ff88', marginBottom: 12 }}>✓ Soulagé !</div>
            <button onClick={onExit}
              style={{
                padding: '10px 24px',
                background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
                color: '#fff', border: 'none', borderRadius: 8,
                cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold',
              }}>Retour au casino</button>
          </>
        )}
      </div>
    </div>
  );
};

// ============== ÉCRAN BAR - BOISSONS ==============
const BarScreen = ({ balance, setBalance, onExit, casino }) => {
  const [phase, setPhase] = useState('menu'); // menu | drinking | throwing | done
  const [selectedDrink, setSelectedDrink] = useState(null);
  const [liquidLevel, setLiquidLevel] = useState(100);
  const [serverHit, setServerHit] = useState(false);
  
  const drinks = [
    { id: 'water', name: 'Eau', price: 25, color: '#a0d8f0', can: '#e8f4f8', liquidColor: '#a0d8f0' },
    { id: 'alcohol', name: 'Bière / Alcool', price: 50, color: '#d4a017', can: '#2a4a1a', liquidColor: '#e8b820' },
    { id: 'redbull', name: 'Red Bull', price: 100, color: '#1a4b8a', can: '#1a4b8a', liquidColor: '#f4d030' },
  ];
  
  const buyDrink = (drink) => {
    if (balance < drink.price) return;
    setBalance(b => b - drink.price);
    setSelectedDrink(drink);
    setPhase('drinking');
    setLiquidLevel(100);
    
    // Animation de boire - 2.5s
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setLiquidLevel(100 - (step * 8));
      if (step >= 12) {
        clearInterval(interval);
        setPhase('throwing');
        // Lancer canette - arrive à 1.5s
        setTimeout(() => {
          setServerHit(true);
          setTimeout(() => setPhase('done'), 2500);
        }, 1500);
      }
    }, 200);
  };
  
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: `linear-gradient(180deg, ${casino.bg.includes('gradient') ? '#1a0a0a' : '#1a0a0a'} 0%, #0a0503 100%)`,
      fontFamily: 'Georgia, serif', color: '#fff',
      zIndex: 1000, display: 'flex', flexDirection: 'column',
    }}>
      {/* Bouton SORTIR PERMANENT */}
      <button onClick={onExit} style={{
        position: 'absolute', top: 20, right: 20, zIndex: 100,
        padding: '10px 20px',
        background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
        color: '#fff', border: '2px solid ' + casino.secondary,
        borderRadius: 8, cursor: 'pointer',
        fontFamily: 'inherit', fontWeight: 'bold', fontSize: 14,
        boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
      }}>← Sortir</button>
      
      {/* Mur du bar */}
      <div style={{
        flex: 1, position: 'relative',
        background: `linear-gradient(180deg, #2a1a0a 0%, #1a0f05 40%, #0f0803 100%)`,
        overflow: 'hidden',
      }}>
        {/* Étagères avec bouteilles */}
        <div style={{
          position: 'absolute', top: 60, left: 40, right: 40, height: 120,
          background: 'linear-gradient(180deg, #3a2010, #2a1608)',
          border: '2px solid #8b6914',
          borderRadius: 4,
          display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end',
          padding: 8,
        }}>
          {[...Array(12)].map((_, i) => {
            const colors = ['#8b4513', '#d4af37', '#2a4a1a', '#7a0a0a', '#1a4b8a', '#e8a020'];
            return (
              <div key={i} style={{
                width: 16, height: 80 + (i % 3) * 10,
                background: `linear-gradient(90deg, ${colors[i % 6]}, ${colors[(i+1) % 6]})`,
                borderRadius: '50% 50% 10% 10% / 20% 20% 10% 10%',
                border: '1px solid #000',
                boxShadow: '0 2px 4px rgba(0,0,0,0.6)',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)',
                  width: 6, height: 12, background: '#000', borderRadius: 2,
                }} />
              </div>
            );
          })}
        </div>
        
        {/* Serveur */}
        <div style={{
          position: 'absolute', top: 180, left: '50%',
          transform: `translateX(-50%) ${serverHit ? 'rotate(-20deg) translateY(20px)' : ''}`,
          transition: 'transform 0.5s',
          width: 140, height: 200,
        }}>
          <svg viewBox="0 0 140 200" style={{ width: '100%', height: '100%' }}>
            {/* Corps */}
            <rect x="45" y="90" width="50" height="80" fill="#1a1a2e" rx="4" />
            <rect x="50" y="95" width="40" height="50" fill="#fff" />
            {/* Noeud papillon */}
            <path d="M 60 100 L 80 100 L 78 108 L 82 112 L 58 112 L 62 108 Z" fill="#8b0000" />
            {/* Tête */}
            <ellipse cx="70" cy="70" rx="22" ry="26" fill="#e8b896" />
            <path d="M 48 60 Q 50 42 70 40 Q 90 42 92 60 L 88 50 Q 70 45 52 50 Z" fill="#2a1810" />
            {/* Yeux */}
            <ellipse cx="62" cy="70" rx="3" ry="2" fill="#fff" />
            <ellipse cx="78" cy="70" rx="3" ry="2" fill="#fff" />
            <circle cx={serverHit ? 60 : 62} cy="70" r="1.5" fill="#000" />
            <circle cx={serverHit ? 76 : 78} cy="70" r="1.5" fill="#000" />
            {serverHit && (
              <>
                <line x1="57" y1="66" x2="67" y2="74" stroke="#000" strokeWidth="1.5" />
                <line x1="67" y1="66" x2="57" y2="74" stroke="#000" strokeWidth="1.5" />
                <line x1="73" y1="66" x2="83" y2="74" stroke="#000" strokeWidth="1.5" />
                <line x1="83" y1="66" x2="73" y2="74" stroke="#000" strokeWidth="1.5" />
              </>
            )}
            {/* Bouche */}
            {serverHit ? (
              <ellipse cx="70" cy="84" rx="5" ry="3" fill="#2a0000" />
            ) : (
              <path d="M 65 82 Q 70 85 75 82" stroke="#333" strokeWidth="1.5" fill="none" />
            )}
            {/* Bras */}
            <rect x="30" y="95" width="15" height="50" fill="#1a1a2e" rx="2" />
            <rect x="95" y="95" width="15" height="50" fill="#1a1a2e" rx="2" />
            
            {/* Bosse si frappé */}
            {serverHit && (
              <circle cx="55" cy="55" r="6" fill="#8b0000" />
            )}
          </svg>
          <div style={{
            textAlign: 'center', color: '#ffd700', fontSize: 12, fontStyle: 'italic',
            textShadow: '1px 1px 2px #000', marginTop: -5,
          }}>~ Fabio le barman ~</div>
        </div>
        
        {/* Comptoir */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
          background: 'linear-gradient(180deg, #4a2a10 0%, #2a1808 100%)',
          borderTop: '4px solid #ffd700',
          boxShadow: '0 -10px 20px rgba(0,0,0,0.6)',
        }}>
          <div style={{
            position: 'absolute', top: 8, left: '10%', right: '10%', height: 4,
            background: 'linear-gradient(90deg, transparent, #ffd700, transparent)',
          }} />
        </div>
        
        {/* Canette en animation (boisson) */}
        {phase === 'drinking' && selectedDrink && (
          <div style={{
            position: 'absolute', bottom: 100, left: '50%',
            transform: 'translateX(-50%) rotate(-30deg)',
            animation: 'drinkPose 2.5s ease-in-out',
          }}>
            <svg viewBox="0 0 60 140" width="80" height="180">
              {/* Canette */}
              <rect x="15" y="20" width="30" height="100" fill={selectedDrink.can} stroke="#333" strokeWidth="1" rx="2" />
              <rect x="15" y="20" width="30" height="8" fill="#888" />
              <ellipse cx="30" cy="20" rx="15" ry="4" fill="#aaa" />
              <ellipse cx="30" cy="25" rx="15" ry="4" fill={selectedDrink.can} />
              <circle cx="26" cy="24" r="1.5" fill="#666" />
              {/* Étiquette */}
              <rect x="18" y="45" width="24" height="40" fill="rgba(255,255,255,0.2)" />
              <text x="30" y="67" fill="#fff" fontSize="6" fontWeight="bold" textAnchor="middle">
                {selectedDrink.name.split(' ')[0]}
              </text>
              {/* Niveau de liquide (vu par transparence) */}
              <rect x="16" y={28 + (100 - liquidLevel) * 0.9} width="28" height={liquidLevel * 0.9} 
                fill={selectedDrink.liquidColor} opacity="0.6" />
              {/* Liquide qui sort */}
              {liquidLevel < 90 && (
                <>
                  <path d={`M 30 22 Q 25 -10 15 -40`} stroke={selectedDrink.liquidColor} strokeWidth="3" fill="none" />
                  <circle cx="20" cy="-30" r="3" fill={selectedDrink.liquidColor} />
                  <circle cx="17" cy="-20" r="2" fill={selectedDrink.liquidColor} />
                  <circle cx="22" cy="-10" r="2.5" fill={selectedDrink.liquidColor} />
                </>
              )}
            </svg>
          </div>
        )}
        
        {/* Canette qui vole vers le serveur */}
        {phase === 'throwing' && selectedDrink && !serverHit && (
          <div style={{
            position: 'absolute', bottom: 60, left: '50%',
            animation: 'canThrow 1.5s ease-in forwards',
          }}>
            <svg viewBox="0 0 30 100" width="30" height="80">
              <rect x="2" y="5" width="26" height="85" fill={selectedDrink.can} stroke="#333" strokeWidth="1" rx="2" />
              <rect x="2" y="5" width="26" height="5" fill="#888" />
            </svg>
          </div>
        )}
        
        {/* Canette bosselée sur le sol après impact */}
        {phase === 'done' && selectedDrink && (
          <div style={{
            position: 'absolute', top: 300, left: '50%', transform: 'translateX(-20px) rotate(70deg)',
          }}>
            <svg viewBox="0 0 30 100" width="30" height="70">
              <path d="M 2 5 L 28 5 L 28 90 Q 15 95 2 90 Z" fill={selectedDrink.can} stroke="#333" strokeWidth="1" />
              <rect x="2" y="5" width="26" height="5" fill="#888" />
              <path d="M 10 40 Q 15 35 20 42" stroke="#000" strokeWidth="1" fill="none" />
            </svg>
          </div>
        )}
      </div>
      
      {/* HUD */}
      <div style={{
        padding: 16, background: 'rgba(0,0,0,0.85)',
        borderTop: `2px solid ${casino.primary}`,
      }}>
        {phase === 'menu' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ color: casino.secondary, fontSize: 20, letterSpacing: 2, marginBottom: 4 }}>
                🍸 LE BAR
              </div>
              <div style={{ color: '#cca366', fontSize: 12, fontStyle: 'italic' }}>
                Solde : {fmt(balance)} B
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {drinks.map(d => (
                <button key={d.id} onClick={() => buyDrink(d)}
                  disabled={balance < d.price}
                  style={{
                    padding: 12, minWidth: 110,
                    background: balance >= d.price ? `linear-gradient(135deg, ${d.color}, ${d.color}88)` : '#444',
                    border: `2px solid ${casino.secondary}`,
                    color: '#fff', borderRadius: 8,
                    cursor: balance >= d.price ? 'pointer' : 'not-allowed',
                    fontFamily: 'inherit', fontSize: 13,
                  }}>
                  <div style={{ fontWeight: 'bold' }}>{d.name}</div>
                  <div style={{ fontSize: 11, opacity: 0.9 }}>{d.price} B</div>
                </button>
              ))}
            </div>
            <button onClick={onExit} style={{
              width: '100%', marginTop: 12, padding: 10,
              background: 'transparent', border: `1px solid ${casino.secondary}`,
              color: casino.secondary, borderRadius: 6,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>Sortir du bar</button>
          </>
        )}
        {phase === 'drinking' && (
          <div style={{ textAlign: 'center', color: '#ffd700', fontSize: 16 }}>
            🍺 Tu bois ta {selectedDrink?.name}... gluglu
          </div>
        )}
        {phase === 'throwing' && (
          <div style={{ textAlign: 'center', color: '#ff6600', fontSize: 16 }}>
            💢 Tu balances la canette sur le serveur !
          </div>
        )}
        {phase === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#ff4444', marginBottom: 8 }}>✓ Serveur assommé !</div>
            <button onClick={onExit} style={{
              padding: '10px 24px',
              background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
              color: '#fff', border: 'none', borderRadius: 8,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>Sortir du bar</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============== BENZBET - PARIS SPORTIFS ==============
// ============== BASES DE DONNÉES SPORTIVES ==============
// Top 20 clubs européens (foot)
const FOOT_CLUBS = [
  'Real Madrid', 'Man City', 'Arsenal', 'Liverpool', 'Barcelone',
  'Bayern Munich', 'PSG', 'Inter Milan', 'Atlético Madrid', 'Chelsea',
  'Juventus', 'Milan AC', 'Borussia Dortmund', 'Tottenham', 'Naples',
  'Atalanta', 'Benfica', 'Porto', 'Leverkusen', 'Aston Villa',
];

// 30 équipes NBA
const NBA_TEAMS = [
  'Lakers', 'Celtics', 'Warriors', 'Bulls', 'Nets',
  'Heat', 'Knicks', 'Bucks', 'Nuggets', 'Suns',
  'Mavericks', 'Clippers', 'Timberwolves', 'Grizzlies', 'Kings',
  'Pelicans', 'Cavaliers', 'Hawks', 'Raptors', '76ers',
  'Magic', 'Pacers', 'Wizards', 'Rockets', 'Thunder',
  'Jazz', 'Spurs', 'Pistons', 'Hornets', 'Blazers',
];

// Top 50 tennis mondial
const TENNIS_PLAYERS = [
  'Sinner', 'Alcaraz', 'Zverev', 'Djokovic', 'Medvedev',
  'Fritz', 'De Minaur', 'Rublev', 'Dimitrov', 'Hurkacz',
  'Paul', 'Rune', 'Tsitsipas', 'Ruud', 'Shelton',
  'Humbert', 'Khachanov', 'Tiafoe', 'Popyrin', 'Mensik',
  'Berrettini', 'Arnaldi', 'Musetti', 'Korda', 'Bublik',
  'Auger-Aliassime', 'Fils', 'Cobolli', 'Shapovalov', 'Davidovich',
  'Cerundolo', 'Baez', 'Lehecka', 'Nakashima', 'Monfils',
  'Jarry', 'Safiullin', 'Michelsen', 'McDonald', 'Giron',
  'Goffin', 'Struff', 'Sonego', 'Nishikori', 'Coric',
  'Griekspoor', 'Van de Zandschulp', 'Kotov', 'Altmaier', 'Djere',
];

// Génère 8 matchs aléatoires pour un sport donné
const generateMatches = (sport) => {
  const matches = [];
  let pool;
  if (sport === 'foot') pool = FOOT_CLUBS;
  else if (sport === 'nba') pool = NBA_TEAMS;
  else pool = TENNIS_PLAYERS;
  
  const sportLabel = sport === 'foot' ? '⚽ Football' 
                   : sport === 'nba' ? '🏀 Basket' 
                   : '🎾 Tennis';
  
  const used = new Set();
  for (let i = 0; i < 8; i++) {
    let h, a;
    let attempts = 0;
    do {
      h = pool[Math.floor(Math.random() * pool.length)];
      a = pool[Math.floor(Math.random() * pool.length)];
      attempts++;
    } while ((h === a || used.has(`${h}-${a}`) || used.has(`${a}-${h}`)) && attempts < 20);
    used.add(`${h}-${a}`);
    
    // Cotes réalistes (favorite un peu avant)
    const fav = Math.random() < 0.5;
    const base1 = 1.3 + Math.random() * 1.2;
    const base2 = 2.5 + Math.random() * 3;
    const nullOdds = sport === 'nba' ? 20 + Math.random() * 15 
                   : sport === 'tennis' ? 30 + Math.random() * 20 
                   : 3 + Math.random() * 1.5;
    
    matches.push({
      sport: sportLabel,
      home: h,
      away: a,
      oddsH: fav ? +base1.toFixed(2) : +base2.toFixed(2),
      oddsN: +nullOdds.toFixed(2),
      oddsA: fav ? +base2.toFixed(2) : +base1.toFixed(2),
    });
  }
  return matches;
};

// Conservé pour compatibilité (BenzBet peut encore en utiliser par défaut)
const BENZBET_MATCHES = generateMatches('foot');

const BENZBET_KEY = (name) => `benzbet:${name}:activeBet`;

const sportBtnStyle = (color) => ({
  padding: 16,
  background: `linear-gradient(135deg, ${color}33, ${color}11)`,
  border: `2px solid ${color}`,
  color: '#fff', borderRadius: 10,
  cursor: 'pointer', fontFamily: 'Georgia, serif',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
});

const BenzBetScreen = ({ balance, setBalance, weapons, username, onExit, casino }) => {
  const [phase, setPhase] = useState('menu');
  const [match, setMatch] = useState(null);
  const [choice, setChoice] = useState(null);
  const [betAmount, setBetAmount] = useState(100);
  const [startTime, setStartTime] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [result, setResult] = useState(null);
  const [dealerDead, setDealerDead] = useState(false);
  const [showWeapons, setShowWeapons] = useState(false);
  const [matchScore, setMatchScore] = useState({ h: 0, a: 0 });
  const [machineSlot, setMachineSlot] = useState(null); // 1 or 2

  // Clock
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Charger pari en cours au montage
  useEffect(() => {
    if (!username) return;
    try {
      const stored = localStorage.getItem(BENZBET_KEY(username));
      if (stored) {
        const bet = JSON.parse(stored);
        setMatch(bet.match);
        setChoice(bet.choice);
        setBetAmount(bet.betAmount);
        setStartTime(bet.startTime);
        setMachineSlot(bet.machineSlot || 1);
        // Deterministic result basé sur startTime + match
        const total = (1/bet.match.oddsH) + (1/bet.match.oddsN) + (1/bet.match.oddsA);
        const pH = (1/bet.match.oddsH) / total;
        const pN = (1/bet.match.oddsN) / total;
        // Utiliser le startTime comme seed pour avoir un résultat reproductible
        const seed = (bet.startTime % 10000) / 10000;
        let winner = 'A';
        if (seed < pH) winner = 'H';
        else if (seed < pH + pN) winner = 'N';
        const seedScore = (bet.startTime % 1000) / 1000;
        let score = { h: 0, a: 0 };
        if (winner === 'H') score = { h: 1 + Math.floor(seedScore * 3), a: 0 };
        else if (winner === 'A') score = { h: 0, a: 1 + Math.floor(seedScore * 3) };
        else score = { h: 1, a: 1 };

        const elapsed = Date.now() - bet.startTime;
        if (elapsed < 5000) {
          setPhase('waiting');
        } else if (elapsed < 5000 + 180000) {
          setPhase('playing');
          // Score progressif
          const matchProgress = (elapsed - 5000) / 180000;
          setMatchScore({
            h: Math.floor(score.h * matchProgress),
            a: Math.floor(score.a * matchProgress),
          });
        } else {
          // Match terminé
          setMatchScore(score);
          const won = winner === bet.choice;
          const odds = bet.choice === 'H' ? bet.match.oddsH : bet.choice === 'N' ? bet.match.oddsN : bet.match.oddsA;
          const payout = won ? Math.floor(bet.betAmount * odds) : 0;
          setResult({ winner, won, payout });
          setPhase('result');
        }
      }
    } catch (e) {}
  }, [username]);

  // Mettre à jour le score en temps réel pendant le match
  useEffect(() => {
    if (phase !== 'playing' || !match || !startTime) return;
    const elapsed = now - startTime;
    const matchProgress = Math.min(1, Math.max(0, (elapsed - 5000) / 180000));

    // Résultat deterministic
    const total = (1/match.oddsH) + (1/match.oddsN) + (1/match.oddsA);
    const pH = (1/match.oddsH) / total;
    const pN = (1/match.oddsN) / total;
    const seed = (startTime % 10000) / 10000;
    let winner = 'A';
    if (seed < pH) winner = 'H';
    else if (seed < pH + pN) winner = 'N';
    const seedScore = (startTime % 1000) / 1000;
    const seedScore2 = ((startTime / 1000) % 1000) / 1000;
    
    // Score selon le sport
    let finalScore = { h: 0, a: 0 };
    const sport = match.sport || '';
    
    if (sport.includes('Football')) {
      // Foot : scores faibles 0-4
      if (winner === 'H') finalScore = { h: 1 + Math.floor(seedScore * 3), a: Math.floor(seedScore2 * 2) };
      else if (winner === 'A') finalScore = { h: Math.floor(seedScore2 * 2), a: 1 + Math.floor(seedScore * 3) };
      else finalScore = { h: 1 + Math.floor(seedScore * 2), a: 1 + Math.floor(seedScore * 2) };
    } else if (sport.includes('Basket')) {
      // Basket : scores élevés 60-120
      const base = 75 + Math.floor(seedScore * 25);
      const diff = 5 + Math.floor(seedScore2 * 15);
      if (winner === 'H') finalScore = { h: base + diff, a: base };
      else if (winner === 'A') finalScore = { h: base, a: base + diff };
      else finalScore = { h: base + 10, a: base + 10 }; // très rare au basket
    } else if (sport.includes('Tennis')) {
      // Tennis : sets au meilleur des 3, format "X-Y X-Y" stocké dans h/a
      // On encode : h = set1H*100 + set2H, a = set1A*100 + set2A (max 7-6)
      const set1H = winner === 'H' ? 6 : Math.floor(seedScore * 5) + 1;
      const set1A = winner === 'H' ? Math.floor(seedScore2 * 5) : 6;
      const set2H = winner === 'H' ? 6 : Math.floor(seedScore2 * 5);
      const set2A = winner === 'H' ? Math.floor(seedScore * 5) : 6;
      finalScore = { 
        h: set1H * 100 + set2H, 
        a: set1A * 100 + set2A,
        isTennis: true,
        set1H, set1A, set2H, set2A,
      };
    }

    // Progression du score
    if (sport.includes('Tennis')) {
      // Pour le tennis, progression par set
      if (matchProgress < 0.5) {
        const setP = matchProgress * 2;
        setMatchScore({
          h: Math.floor(finalScore.set1H * setP) * 100,
          a: Math.floor(finalScore.set1A * setP) * 100,
          isTennis: true,
          set1H: Math.floor(finalScore.set1H * setP),
          set1A: Math.floor(finalScore.set1A * setP),
          set2H: 0, set2A: 0,
        });
      } else {
        const setP = (matchProgress - 0.5) * 2;
        setMatchScore({
          h: finalScore.set1H * 100 + Math.floor(finalScore.set2H * setP),
          a: finalScore.set1A * 100 + Math.floor(finalScore.set2A * setP),
          isTennis: true,
          set1H: finalScore.set1H,
          set1A: finalScore.set1A,
          set2H: Math.floor(finalScore.set2H * setP),
          set2A: Math.floor(finalScore.set2A * setP),
        });
      }
    } else {
      setMatchScore({
        h: Math.floor(finalScore.h * matchProgress),
        a: Math.floor(finalScore.a * matchProgress),
      });
    }

    if (elapsed >= 5000 + 180000) {
      setMatchScore(finalScore);
      const won = winner === choice;
      const odds = choice === 'H' ? match.oddsH : choice === 'N' ? match.oddsN : match.oddsA;
      const payout = won ? Math.floor(betAmount * odds) : 0;
      setResult({ winner, won, payout });
      setPhase('result');
    }
  }, [now, phase, match, startTime, choice, betAmount]);

  // Transition waiting -> playing
  useEffect(() => {
    if (phase !== 'waiting' || !startTime) return;
    const elapsed = now - startTime;
    if (elapsed >= 5000) {
      setPhase('playing');
    }
  }, [now, phase, startTime]);

  const pickMatch = (slot) => {
    setMachineSlot(slot);
    setPhase('sport_select');
  };

  const [availableMatches, setAvailableMatches] = useState([]);

  const chooseSport = (sport) => {
    setAvailableMatches(generateMatches(sport));
    setPhase('match_select');
  };

  const chooseMatch = (m) => {
    setMatch(m);
    setPhase('betting');
  };

  const placeBet = () => {
    if (betAmount > balance || betAmount <= 0) return;
    setBalance(b => b - betAmount);
    const st = Date.now();
    setStartTime(st);
    setPhase('waiting');
    // Sauvegarder dans localStorage
    if (username) {
      try {
        localStorage.setItem(BENZBET_KEY(username), JSON.stringify({
          match, choice, betAmount, startTime: st, machineSlot,
        }));
      } catch (e) {}
    }
  };

  const collectTicket = () => setPhase('ticket');

  const clearStoredBet = () => {
    if (username) {
      try { localStorage.removeItem(BENZBET_KEY(username)); } catch (e) {}
    }
  };

  const giveTicket = () => {
    setBalance(b => b + result.payout);
    clearStoredBet();
    setPhase('menu');
    setMatch(null); setChoice(null); setResult(null); setStartTime(0);
  };

  const resetFromLoss = () => {
    clearStoredBet();
    setPhase('menu');
    setMatch(null); setChoice(null); setResult(null); setStartTime(0);
  };

  const useWeaponOnDealer = (weaponId) => {
    setShowWeapons(false);
    setDealerDead(true);
    setTimeout(() => {
      setDealerDead(false);
      resetFromLoss();
    }, 10000);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(180deg, #1a0a1a 0%, #0a0505 100%)',
      fontFamily: 'Georgia, serif', color: '#fff', zIndex: 1000,
      display: 'flex', flexDirection: 'column', overflow: 'auto',
    }}>
      {/* Bouton SORTIR permanent */}
      <button onClick={onExit} style={{
        position: 'absolute', top: 20, right: 20, zIndex: 100,
        padding: '10px 20px',
        background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
        color: '#fff', border: '2px solid ' + casino.secondary,
        borderRadius: 8, cursor: 'pointer',
        fontFamily: 'inherit', fontWeight: 'bold', fontSize: 14,
        boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
      }}>← Sortir</button>

      <div style={{ flex: 1, position: 'relative', padding: 20, minHeight: 400 }}>
        <div style={{
          textAlign: 'center', marginBottom: 20,
          color: '#ff00aa', fontSize: 28, fontWeight: 'bold',
          letterSpacing: 4, textShadow: '0 0 20px #ff00aa',
          animation: 'neonPulse 2s ease-in-out infinite',
        }}>BENZ<span style={{color:'#ffd700'}}>BET</span></div>

        {/* Comptoir bookmaker */}
        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', marginBottom: 20 }}>
          <div style={{
            width: 200, height: 140, position: 'relative',
            transform: dealerDead ? 'rotate(-25deg) translateY(30px)' : 'none',
            transition: 'transform 0.5s', filter: dealerDead ? 'grayscale(1) brightness(0.5)' : 'none',
          }}>
            <svg viewBox="0 0 200 140" style={{ width: '100%', height: '100%' }}>
              <rect x="65" y="50" width="70" height="80" fill="#4a2a4a" rx="4" />
              <rect x="75" y="58" width="50" height="30" fill="#fff" />
              <path d="M 95 60 L 105 60 L 108 90 L 100 100 L 92 90 Z" fill="#ff00aa" />
              <ellipse cx="100" cy="30" rx="22" ry="26" fill="#d4a888" />
              <path d="M 78 20 Q 80 5 100 3 Q 120 5 122 20 L 118 15 Q 100 8 82 15 Z" fill="#4a2818" />
              <ellipse cx="92" cy="30" rx="3" ry="2" fill="#fff" />
              <ellipse cx="108" cy="30" rx="3" ry="2" fill="#fff" />
              <circle cx="92" cy="30" r="1.5" fill="#000" />
              <circle cx="108" cy="30" r="1.5" fill="#000" />
              {dealerDead && (
                <>
                  <line x1="87" y1="26" x2="97" y2="34" stroke="#000" strokeWidth="1.5" />
                  <line x1="97" y1="26" x2="87" y2="34" stroke="#000" strokeWidth="1.5" />
                  <line x1="103" y1="26" x2="113" y2="34" stroke="#000" strokeWidth="1.5" />
                  <line x1="113" y1="26" x2="103" y2="34" stroke="#000" strokeWidth="1.5" />
                  <circle cx="100" cy="30" r="3" fill="#8b0000" />
                </>
              )}
              <path d="M 95 42 Q 100 44 105 42" stroke="#333" strokeWidth="1.5" fill="none" />
            </svg>
            <div style={{
              textAlign: 'center', color: '#ff00aa', fontSize: 11, fontStyle: 'italic', marginTop: -5,
            }}>~ Rafael le bookmaker ~</div>
          </div>
        </div>

        <div style={{
          width: '100%', height: 20,
          background: 'linear-gradient(180deg, #4a2a10, #2a1608)',
          borderTop: '3px solid #ffd700', marginBottom: 20,
        }} />

        {phase === 'menu' && (
          <div style={{
            display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap',
          }}>
            {[1, 2].map(n => (
              <div key={n}
                onClick={() => pickMatch(n)}
                style={{
                  width: 160, height: 220,
                  background: 'linear-gradient(180deg, #1a1a2a, #0a0a15)',
                  border: '3px solid #ff00aa', borderRadius: 10,
                  padding: 12, cursor: 'pointer',
                  position: 'relative',
                  boxShadow: '0 0 20px #ff00aa66',
                }}>
                <div style={{ color: '#ff00aa', fontSize: 10, textAlign: 'center', letterSpacing: 2 }}>
                  BENZBET {n}
                </div>
                <div style={{
                  marginTop: 8, padding: 8,
                  background: '#000', border: '1px solid #ff00aa',
                  borderRadius: 4, minHeight: 80,
                  color: '#0f0', fontFamily: 'monospace', fontSize: 11,
                }}>
                  <div>&gt; FOOT / BASKET</div>
                  <div>&gt; TENNIS</div>
                  <div style={{ marginTop: 8, color: '#ff0' }}>&gt; MISEZ_</div>
                </div>
                <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: '#cca366' }}>
                  Cliquer pour miser
                </div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'radial-gradient(circle, #f00, #800)' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'radial-gradient(circle, #0f0, #080)' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'radial-gradient(circle, #ff0, #880)' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {phase === 'sport_select' && (
          <div style={{
            maxWidth: 500, margin: '0 auto',
            background: 'rgba(0,0,0,0.75)', border: '2px solid #ff00aa',
            borderRadius: 10, padding: 20,
          }}>
            <div style={{ textAlign: 'center', color: '#ffd700', fontSize: 18, marginBottom: 16, letterSpacing: 2 }}>
              BORNE {machineSlot} • CHOISIS TON SPORT
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => chooseSport('foot')} style={sportBtnStyle('#00aa44')}>
                <div style={{ fontSize: 32 }}>⚽</div>
                <div style={{ fontSize: 16, fontWeight: 'bold' }}>FOOTBALL</div>
                <div style={{ fontSize: 11, color: '#cca366' }}>Top 20 clubs européens</div>
              </button>
              <button onClick={() => chooseSport('nba')} style={sportBtnStyle('#ff6600')}>
                <div style={{ fontSize: 32 }}>🏀</div>
                <div style={{ fontSize: 16, fontWeight: 'bold' }}>BASKET NBA</div>
                <div style={{ fontSize: 11, color: '#cca366' }}>30 équipes NBA</div>
              </button>
              <button onClick={() => chooseSport('tennis')} style={sportBtnStyle('#ffd700')}>
                <div style={{ fontSize: 32 }}>🎾</div>
                <div style={{ fontSize: 16, fontWeight: 'bold' }}>TENNIS</div>
                <div style={{ fontSize: 11, color: '#cca366' }}>Top 50 mondial ATP</div>
              </button>
            </div>
            <button onClick={() => setPhase('menu')} style={{
              width: '100%', marginTop: 12, padding: 8,
              background: 'transparent', border: '1px solid #888',
              color: '#888', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
            }}>Retour</button>
          </div>
        )}

        {phase === 'match_select' && availableMatches.length > 0 && (
          <div style={{
            maxWidth: 560, margin: '0 auto',
            background: 'rgba(0,0,0,0.75)', border: '2px solid #ff00aa',
            borderRadius: 10, padding: 16,
          }}>
            <div style={{ textAlign: 'center', color: '#ffd700', fontSize: 15, marginBottom: 12, letterSpacing: 1 }}>
              {availableMatches[0].sport} • 8 matchs à parier
            </div>
            <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
              {availableMatches.map((m, i) => (
                <button key={i} onClick={() => chooseMatch(m)} style={{
                  width: '100%', padding: 12, marginBottom: 8,
                  background: 'rgba(40,10,40,0.6)',
                  border: '1px solid #ff00aa',
                  borderRadius: 8, color: '#fff',
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  gap: 8,
                }}>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 'bold' }}>
                      {m.home} <span style={{ color: '#ff00aa' }}>vs</span> {m.away}
                    </div>
                    <div style={{ fontSize: 10, color: '#cca366', marginTop: 2 }}>
                      1 : ×{m.oddsH} • N : ×{m.oddsN} • 2 : ×{m.oddsA}
                    </div>
                  </div>
                  <div style={{ color: '#ffd700', fontSize: 13 }}>→</div>
                </button>
              ))}
            </div>
            <button onClick={() => setPhase('sport_select')} style={{
              width: '100%', marginTop: 8, padding: 8,
              background: 'transparent', border: '1px solid #888',
              color: '#888', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
            }}>Changer de sport</button>
          </div>
        )}

        {phase === 'betting' && match && (
          <div style={{
            maxWidth: 500, margin: '0 auto',
            background: 'rgba(0,0,0,0.7)', border: '2px solid #ff00aa',
            borderRadius: 10, padding: 20,
          }}>
            <div style={{ textAlign: 'center', color: '#ffd700', fontSize: 16, marginBottom: 10 }}>
              BORNE {machineSlot} • {match.sport}
            </div>
            <div style={{ textAlign: 'center', fontSize: 20, marginBottom: 16 }}>
              {match.home} <span style={{ color: '#ff00aa' }}>VS</span> {match.away}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button onClick={() => setChoice('H')} style={choiceBtn(choice === 'H')}>
                <div>1 (Victoire)</div>
                <div style={{ fontSize: 18, color: '#ffd700' }}>×{match.oddsH}</div>
                <div style={{ fontSize: 10 }}>{match.home}</div>
              </button>
              <button onClick={() => setChoice('N')} style={choiceBtn(choice === 'N')}>
                <div>N (Nul)</div>
                <div style={{ fontSize: 18, color: '#ffd700' }}>×{match.oddsN}</div>
                <div style={{ fontSize: 10 }}>Égalité</div>
              </button>
              <button onClick={() => setChoice('A')} style={choiceBtn(choice === 'A')}>
                <div>2 (Défaite)</div>
                <div style={{ fontSize: 18, color: '#ffd700' }}>×{match.oddsA}</div>
                <div style={{ fontSize: 10 }}>{match.away}</div>
              </button>
            </div>
            <div style={{ marginBottom: 10, color: '#cca366', fontSize: 13 }}>
              Mise (solde: {fmt(balance)} B) :
            </div>
            <input type="number" value={betAmount} onChange={e => setBetAmount(parseInt(e.target.value) || 0)}
              min="10" max={balance}
              style={{
                width: '100%', padding: 10, background: '#000',
                border: '1px solid #ff00aa', color: '#fff', fontSize: 16, borderRadius: 4,
                fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 10,
              }} />
            <div style={{ color: '#00ff88', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>
              {choice && `Gain potentiel : ${fmt(Math.floor(betAmount * (choice === 'H' ? match.oddsH : choice === 'N' ? match.oddsN : match.oddsA)))} B`}
            </div>
            <button onClick={placeBet} disabled={!choice || betAmount <= 0 || betAmount > balance}
              style={{
                width: '100%', padding: 12,
                background: (choice && betAmount > 0 && betAmount <= balance)
                  ? 'linear-gradient(135deg, #ff00aa, #aa0055)' : '#444',
                color: '#fff', border: 'none', borderRadius: 6,
                fontSize: 16, fontWeight: 'bold', cursor: 'pointer',
                fontFamily: 'inherit', letterSpacing: 1,
              }}>VALIDER LE PARI</button>
            <button onClick={() => setPhase('menu')} style={{
              width: '100%', marginTop: 8, padding: 8,
              background: 'transparent', border: '1px solid #888',
              color: '#888', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
            }}>Annuler</button>
          </div>
        )}

        {phase === 'waiting' && startTime > 0 && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ color: '#ffd700', fontSize: 20 }}>Le match commence dans...</div>
            <div style={{ color: '#ff00aa', fontSize: 72, fontWeight: 'bold', margin: 20 }}>
              {Math.max(0, Math.ceil((5000 - (now - startTime)) / 1000))}
            </div>
            <div style={{ color: '#cca366', fontSize: 12, fontStyle: 'italic' }}>
              Tu peux sortir et revenir plus tard, le match jouera sans toi
            </div>
          </div>
        )}

        {phase === 'playing' && match && startTime > 0 && (
          <div style={{
            maxWidth: 500, margin: '0 auto',
            background: 'rgba(0,0,0,0.8)', border: '3px solid #00ff88',
            borderRadius: 10, padding: 20, textAlign: 'center',
          }}>
            <div style={{ color: '#00ff88', fontSize: 12, marginBottom: 8, animation: 'blink 1s infinite' }}>
              ● EN DIRECT • BORNE {machineSlot}
            </div>
            <div style={{ fontSize: 14, color: '#cca366', marginBottom: 12 }}>{match.sport}</div>

            {/* Terrain simulé */}
            <div style={{
              background: '#0a4020', border: '2px solid #0f0',
              borderRadius: 8, padding: 8, marginBottom: 12,
              position: 'relative', height: 80,
              backgroundImage: `
                linear-gradient(90deg, transparent 49.5%, #fff 49.5%, #fff 50.5%, transparent 50.5%),
                repeating-linear-gradient(90deg, #0a4020, #0a4020 20%, #084018 20%, #084018 40%)
              `,
            }}>
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                width: 40, height: 40, border: '2px solid #fff', borderRadius: '50%',
              }} />
              {/* Ballons animés */}
              <div style={{
                position: 'absolute', top: '40%',
                left: `${20 + ((now - startTime) / 200) % 60}%`,
                width: 10, height: 10,
                background: 'radial-gradient(circle, #fff, #888)',
                borderRadius: '50%',
                transition: 'left 0.5s',
              }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ flex: 1, textAlign: 'right', fontSize: 16 }}>{match.home}</div>
              <div style={{ fontSize: matchScore.isTennis ? 20 : 32, color: '#ffd700', fontWeight: 'bold', margin: '0 20px' }}>
                {matchScore.isTennis
                  ? `${matchScore.set1H}-${matchScore.set1A}  ${matchScore.set2H}-${matchScore.set2A}`
                  : `${matchScore.h} - ${matchScore.a}`}
              </div>
              <div style={{ flex: 1, textAlign: 'left', fontSize: 16 }}>{match.away}</div>
            </div>
            <div style={{ color: '#cca366', fontSize: 14 }}>
              Temps : <strong style={{color: '#ffd700'}}>
                {Math.max(0, Math.floor((180000 - (now - startTime - 5000)) / 60000))}:
                {String(Math.max(0, Math.floor(((180000 - (now - startTime - 5000)) % 60000) / 1000))).padStart(2, '0')}
              </strong>
            </div>
            <div style={{ marginTop: 12, color: '#888', fontSize: 11, fontStyle: 'italic' }}>
              Ton pari : {choice === 'H' ? match.home : choice === 'N' ? 'Nul' : match.away} • {fmt(betAmount)} B
            </div>
            <div style={{ marginTop: 8, color: '#cca366', fontSize: 11, fontStyle: 'italic' }}>
              💡 Tu peux sortir et revenir à ta borne pour voir le résultat
            </div>
          </div>
        )}

        {phase === 'result' && result && match && (
          <div style={{
            maxWidth: 500, margin: '0 auto',
            background: 'rgba(0,0,0,0.8)',
            border: `3px solid ${result.won ? '#00ff88' : '#ff4444'}`,
            borderRadius: 10, padding: 20, textAlign: 'center',
          }}>
            <div style={{
              fontSize: 32, fontWeight: 'bold', marginBottom: 16,
              color: result.won ? '#00ff88' : '#ff4444',
              textShadow: `0 0 20px ${result.won ? '#00ff88' : '#ff4444'}`,
            }}>
              {result.won ? '🎉 GAGNÉ !' : '❌ PERDU'}
            </div>
            <div style={{ fontSize: 18, marginBottom: 8 }}>
              Score final : {matchScore.isTennis
                ? `${matchScore.set1H}-${matchScore.set1A}, ${matchScore.set2H}-${matchScore.set2A}`
                : `${matchScore.h} - ${matchScore.a}`}
            </div>
            <div style={{ color: '#cca366', marginBottom: 16 }}>
              {result.winner === 'H' ? `Victoire de ${match.home}` :
               result.winner === 'A' ? `Victoire de ${match.away}` : 'Match nul'}
            </div>
            {result.won ? (
              <>
                <div style={{ fontSize: 24, color: '#ffd700', marginBottom: 16 }}>
                  +{fmt(result.payout)} B
                </div>
                <button onClick={collectTicket} style={{
                  padding: '12px 28px',
                  background: 'linear-gradient(135deg, #ffd700, #b8860b)',
                  color: '#000', border: 'none', borderRadius: 8,
                  fontSize: 16, fontWeight: 'bold', cursor: 'pointer',
                  fontFamily: 'inherit',
                }}>🎟️ Récupérer le ticket</button>
              </>
            ) : (
              <>
                <div style={{ color: '#ff4444', marginBottom: 16 }}>-{fmt(betAmount)} B</div>
                {!dealerDead && weapons.length > 0 && (
                  <button onClick={() => setShowWeapons(true)} style={{
                    padding: '10px 24px', marginRight: 8,
                    background: 'linear-gradient(135deg, #8b0000, #4a0000)',
                    color: '#fff', border: 'none', borderRadius: 6,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>⚔️ Défoule-toi</button>
                )}
                <button onClick={resetFromLoss} style={{
                  padding: '10px 24px',
                  background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
                  color: '#fff', border: 'none', borderRadius: 6,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>Nouveau pari</button>
              </>
            )}
          </div>
        )}

        {phase === 'ticket' && result && (
          <div style={{
            maxWidth: 500, margin: '0 auto',
            background: 'linear-gradient(135deg, #fff 0%, #f4e8b0 100%)',
            border: '4px double #b8860b',
            borderRadius: 10, padding: 24, color: '#1a1a1a',
            boxShadow: '0 0 40px rgba(255,215,0,0.6)',
            textAlign: 'center',
          }}>
            <div style={{ color: '#b8860b', fontSize: 12, letterSpacing: 3, marginBottom: 8 }}>
              ✦ TICKET GAGNANT ✦
            </div>
            <div style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 8 }}>
              BENZ<span style={{color: '#b8860b'}}>BET</span>
            </div>
            <div style={{ borderTop: '2px dashed #b8860b', borderBottom: '2px dashed #b8860b', padding: '12px 0', margin: '12px 0' }}>
              <div style={{ fontSize: 14, marginBottom: 4 }}>{match.sport} • {match.home} vs {match.away}</div>
              <div style={{ fontSize: 12, color: '#666' }}>Pari : {choice === 'H' ? '1' : choice === 'N' ? 'N' : '2'} • Mise : {fmt(betAmount)} B</div>
              <div style={{ fontSize: 28, color: '#b8860b', fontWeight: 'bold', marginTop: 8 }}>
                GAIN : {fmt(result.payout)} B
              </div>
            </div>
            <div style={{ fontSize: 10, color: '#888', fontStyle: 'italic' }}>
              Borne {machineSlot} • Ticket n° BB-{String(startTime).slice(-7)}
            </div>
            <button onClick={giveTicket} style={{
              marginTop: 16, padding: '12px 28px',
              background: 'linear-gradient(135deg, #b8860b, #8b6914)',
              color: '#fff', border: 'none', borderRadius: 8,
              fontSize: 15, fontWeight: 'bold', cursor: 'pointer',
              fontFamily: 'inherit',
            }}>Donner au bookmaker</button>
          </div>
        )}
      </div>

      {showWeapons && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10,
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #1a0a0a, #0a0503)',
            border: '2px solid #8b0000', borderRadius: 12, padding: 24,
            maxWidth: 400, width: '90%',
          }}>
            <div style={{ color: '#ff4444', textAlign: 'center', fontSize: 18, marginBottom: 16 }}>
              ⚔️ Tire sur le bookmaker
            </div>
            {weapons.map(w => {
              const def = WEAPONS.find(x => x.id === w);
              return (
                <button key={w} onClick={() => { useWeaponOnDealer(w); /* eslint-disable-line react-hooks/rules-of-hooks */ }}
                  style={{
                    width: '100%', padding: 14, marginBottom: 8,
                    background: 'rgba(139,0,0,0.3)', border: '1px solid #8b0000',
                    borderRadius: 8, color: '#fff', cursor: 'pointer',
                    fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                  <WeaponIcon id={w} size={40} />
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontWeight: 'bold' }}>{def.name}</div>
                    <div style={{ fontSize: 11, color: '#cca366' }}>Dégâts : {def.damage}</div>
                  </div>
                </button>
              );
            })}
            <button onClick={() => setShowWeapons(false)} style={{
              width: '100%', marginTop: 8, padding: 10,
              background: 'transparent', border: '1px solid #888',
              color: '#888', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
            }}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
};


const choiceBtn = (selected) => ({
  flex: 1, padding: 12,
  background: selected ? 'linear-gradient(135deg, #ff00aa, #aa0055)' : 'rgba(0,0,0,0.4)',
  border: `2px solid ${selected ? '#ffd700' : '#ff00aa'}`,
  color: '#fff', borderRadius: 8, cursor: 'pointer',
  fontFamily: 'Georgia, serif', fontSize: 12,
  textAlign: 'center',
});

// ============== COULEURS 3D POUR CHAQUE CASINO ==============
const CASINO_3D_COLORS = {
  vegas:     { wall: 0x3a0a1a, floor: 0x1a0a0a, ceiling: 0x1a0008, carpet: 0x6a0018, light: 0xff0040 },
  malta:     { wall: 0x3a1010, floor: 0x2a0505, ceiling: 0x180303, carpet: 0x5a0808, light: 0xcf142b },
  barcelona: { wall: 0x3a2010, floor: 0x2a1808, ceiling: 0x1a1004, carpet: 0x6a3010, light: 0xf1bf00 },
  prague:    { wall: 0x0f2040, floor: 0x081428, ceiling: 0x050a1a, carpet: 0x11457e, light: 0x4a7bc0 },
  monaco:    { wall: 0x2a0808, floor: 0x180404, ceiling: 0x0a0202, carpet: 0x4a1010, light: 0xd4af37 },
  jonzac:    { wall: 0x0f2050, floor: 0x0a1530, ceiling: 0x050a20, carpet: 0x0055a4, light: 0xef4135 },
};

// ============== SCÈNE 3D THREE.JS - LOBBY COMPLET V4 ==============
const Lobby3D = ({ profile, casino, casinoId, onSelectGame, onLogout, onOpenTrophies, onOpenShop, onOpenATM, onOpenWheel, walletReady, wheelReady, balance, onOpenBar, onOpenToilet, onOpenBenzBet, weapons, selectedWeapon, setSelectedWeapon, onShoot, onChangeCasino, onOpenCharacter, onToggleVehicle }) => {
  const mountRef = useRef(null);
  const [nearZone, setNearZone] = useState(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [shooting, setShooting] = useState(false);
  const [viewMode, setViewMode] = useState('first'); // 'first' | 'third'
  const firingRef = useRef(false);
  const [visibleBullets, setVisibleBullets] = useState([]);
  const [muzzleKey, setMuzzleKey] = useState(0);
  const nearZoneRef = useRef(null);
  const onSelectRef = useRef(onSelectGame);
  const zoneCallbacksRef = useRef({});
  onSelectRef.current = onSelectGame;
  zoneCallbacksRef.current = {
    blackjack: () => onSelectGame('blackjack'),
    roulette: () => onSelectGame('roulette'),
    highcard: () => onSelectGame('highcard'),
    poker: () => onSelectGame('poker'),
    bar: () => onOpenBar(),
    toilet: () => onOpenToilet(),
    atm: () => onOpenATM(),
    wheel: () => onOpenWheel(),
    shop: () => onOpenShop(),
    benzbet: () => onOpenBenzBet(),
  };
  
  // État touches pour mobile
  const keysRef = useRef({ forward: false, backward: false, left: false, right: false });

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;
    const colors = CASINO_3D_COLORS[casinoId] || CASINO_3D_COLORS.vegas;
    const primaryHex = parseInt(casino.primary.slice(1), 16);
    const secondaryHex = parseInt(casino.secondary.slice(1), 16);
    const accentHex = parseInt(casino.accent.slice(1), 16);
    
    let width = mount.clientWidth;
    let height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1028);
    scene.fog = new THREE.Fog(0x1a1028, 25, 80);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
    camera.position.set(0, 1.7, 14);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = false;
    mount.appendChild(renderer.domElement);

    // ========== SOL MARBRE UNIFORME ==========
    // Texture marbre dessinée en canvas (uniforme partout)
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512; floorCanvas.height = 512;
    const floorCtx = floorCanvas.getContext('2d');
    // Fond crème/beige marbré
    const floorGrad = floorCtx.createRadialGradient(256, 256, 0, 256, 256, 400);
    floorGrad.addColorStop(0, '#f0e8d0');
    floorGrad.addColorStop(0.5, '#d8c898');
    floorGrad.addColorStop(1, '#b8a878');
    floorCtx.fillStyle = floorGrad;
    floorCtx.fillRect(0, 0, 512, 512);
    // Veines du marbre
    for (let i = 0; i < 30; i++) {
      floorCtx.strokeStyle = `rgba(${100 + Math.random() * 60}, ${80 + Math.random() * 40}, ${60 + Math.random() * 40}, 0.3)`;
      floorCtx.lineWidth = 0.5 + Math.random() * 1.5;
      floorCtx.beginPath();
      floorCtx.moveTo(Math.random() * 512, Math.random() * 512);
      for (let j = 0; j < 5; j++) {
        floorCtx.quadraticCurveTo(
          Math.random() * 512, Math.random() * 512,
          Math.random() * 512, Math.random() * 512
        );
      }
      floorCtx.stroke();
    }
    const floorTex = new THREE.CanvasTexture(floorCanvas);
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(8, 8);
    
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ 
        map: floorTex,
        roughness: 0.3, 
        metalness: 0.2,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // ========== TAPIS AUX COULEURS DU PAYS ==========
    // Canvas avec les bandes du drapeau
    const carpetCanvas = document.createElement('canvas');
    carpetCanvas.width = 512; carpetCanvas.height = 256;
    const carpetCtx = carpetCanvas.getContext('2d');
    // Fond sombre pour bords
    carpetCtx.fillStyle = '#1a0a05';
    carpetCtx.fillRect(0, 0, 512, 256);
    // Bandes des couleurs du drapeau (au centre)
    const stripeHeight = 256 - 60; // marges haut/bas
    const stripeY = 30;
    const stripeCount = casino.flag.length;
    const stripeWidth = (512 - 40) / stripeCount;
    casino.flag.forEach((col, i) => {
      carpetCtx.fillStyle = col;
      carpetCtx.fillRect(20 + i * stripeWidth, stripeY, stripeWidth, stripeHeight);
    });
    // Bordure dorée
    carpetCtx.strokeStyle = '#ffd700';
    carpetCtx.lineWidth = 8;
    carpetCtx.strokeRect(20, stripeY, 512 - 40, stripeHeight);
    // Motif central (étoile ou emblème)
    carpetCtx.fillStyle = 'rgba(255,215,0,0.3)';
    carpetCtx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 - 0.5) * Math.PI / 2.5;
      const r = i % 2 === 0 ? 40 : 18;
      const x = 256 + r * Math.cos(angle);
      const y = 130 + r * Math.sin(angle);
      if (i === 0) carpetCtx.moveTo(x, y);
      else carpetCtx.lineTo(x, y);
    }
    carpetCtx.closePath();
    carpetCtx.fill();
    
    const carpetTex = new THREE.CanvasTexture(carpetCanvas);
    const carpet = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 30),
      new THREE.MeshStandardMaterial({ 
        map: carpetTex,
        roughness: 0.95,
      })
    );
    carpet.rotation.x = -Math.PI / 2;
    carpet.rotation.z = Math.PI / 2;
    carpet.position.y = 0.01;
    carpet.receiveShadow = true;
    scene.add(carpet);

    // ========== PLAFOND avec motifs ==========
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ color: colors.ceiling, roughness: 1 })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 6;
    scene.add(ceiling);

    // Moulures dorées au plafond
    for (let i = 0; i < 6; i++) {
      const mold = new THREE.Mesh(
        new THREE.BoxGeometry(56, 0.15, 0.4),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.3 })
      );
      mold.position.set(0, 5.9, -25 + i * 10);
      scene.add(mold);
    }

    // ========== MURS ==========
    const wallMat = new THREE.MeshStandardMaterial({ color: colors.wall, roughness: 0.8 });
    const wallHi = new THREE.MeshStandardMaterial({ color: primaryHex, roughness: 0.7, metalness: 0.3 });
    
    // Mur arrière (30)
    const wallBack = new THREE.Mesh(new THREE.PlaneGeometry(40, 6), wallMat);
    wallBack.position.set(0, 3, -20);
    wallBack.receiveShadow = true;
    scene.add(wallBack);
    // Bande décorative
    const wallBackBand = new THREE.Mesh(new THREE.PlaneGeometry(40, 0.5), wallHi);
    wallBackBand.position.set(0, 4, -19.95);
    scene.add(wallBackBand);
    
    // Mur avant (30) avec porte ouverte
    const wallFrontL = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), wallMat);
    wallFrontL.position.set(-12, 3, 20);
    wallFrontL.rotation.y = Math.PI;
    scene.add(wallFrontL);
    const wallFrontR = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), wallMat);
    wallFrontR.position.set(12, 3, 20);
    wallFrontR.rotation.y = Math.PI;
    scene.add(wallFrontR);
    const wallFrontTop = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.5), wallMat);
    wallFrontTop.position.set(0, 5.25, 20);
    wallFrontTop.rotation.y = Math.PI;
    scene.add(wallFrontTop);
    
    // Murs latéraux
    const wallL = new THREE.Mesh(new THREE.PlaneGeometry(40, 6), wallMat);
    wallL.position.set(-20, 3, 0);
    wallL.rotation.y = Math.PI / 2;
    scene.add(wallL);
    const wallR = new THREE.Mesh(new THREE.PlaneGeometry(40, 6), wallMat);
    wallR.position.set(20, 3, 0);
    wallR.rotation.y = -Math.PI / 2;
    scene.add(wallR);

    // ========== LUMIÈRES ==========
    scene.add(new THREE.AmbientLight(0xfff4dc, 1.0));
    const hemi = new THREE.HemisphereLight(0xfff4dc, 0xffd700, 0.6);
    scene.add(hemi);
    
    // LUSTRES grandiose (6 pièces)
    const chandelierPositions = [[0, 0], [0, -8]];
    chandelierPositions.forEach(([x, z]) => {
      const group = new THREE.Group();
      
      // Chaîne
      const chain = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 1, 8),
        new THREE.MeshStandardMaterial({ color: 0x8b6914, metalness: 0.7 })
      );
      chain.position.set(0, 5.5, 0);
      group.add(chain);
      
      // Support doré
      const support = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.25, 0.3, 8),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.2 })
      );
      support.position.set(0, 5.1, 0);
      group.add(support);
      
      // Structure anneaux
      const ring1 = new THREE.Mesh(
        new THREE.TorusGeometry(0.7, 0.05, 8, 24),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.2 })
      );
      ring1.position.set(0, 4.8, 0);
      group.add(ring1);
      
      const ring2 = new THREE.Mesh(
        new THREE.TorusGeometry(0.5, 0.05, 8, 24),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 })
      );
      ring2.position.set(0, 4.6, 0);
      group.add(ring2);
      
      // Ampoules autour
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 8, 8),
          new THREE.MeshBasicMaterial({ color: colors.light })
        );
        bulb.position.set(Math.cos(angle) * 0.7, 4.8, Math.sin(angle) * 0.7);
        group.add(bulb);
        // Halo
        const halo = new THREE.Mesh(
          new THREE.SphereGeometry(0.25, 8, 8),
          new THREE.MeshBasicMaterial({ color: colors.light, transparent: true, opacity: 0.3 })
        );
        halo.position.copy(bulb.position);
        group.add(halo);
      }
      
      // Lumière réelle
      const light = new THREE.PointLight(0xffe080, 2.2, 22);
      light.position.set(0, 4.8, 0);
      // ombre désactivée pour perf
      group.add(light);
      
      // Pendeloques de cristal
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const crystal = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.08, 0),
          new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, metalness: 0.9, roughness: 0.1 })
        );
        crystal.position.set(Math.cos(angle) * 0.45, 4.4, Math.sin(angle) * 0.45);
        group.add(crystal);
      }
      
      group.position.set(x, 0, z);
      scene.add(group);
    });
    
    // Spots au-dessus des tables (en plus des lustres)
    const createSpot = (x, z, col) => {
      const spot = new THREE.SpotLight(col, 3.5, 18, Math.PI / 5, 0.3, 1);
      spot.position.set(x, 5.5, z);
      spot.target.position.set(x, 0, z);
      scene.add(spot);
      scene.add(spot.target);
    };
    createSpot(0, 5, colors.light);
    createSpot(0, -5, colors.light);
    createSpot(0, -15, colors.light);
    createSpot(-20, 0, 0xffd700);
    createSpot(20, 0, 0xffd700);
    createSpot(-20, -20, colors.light);
    createSpot(20, -20, colors.light);

    // LEDs murales
    for (let i = 0; i < 12; i++) {
      const led1 = new THREE.PointLight(primaryHex, 0.7, 6);
      led1.position.set(-29, 4, -25 + i * 5);
      scene.add(led1);
      const led2 = new THREE.PointLight(primaryHex, 0.7, 6);
      led2.position.set(29, 4, -25 + i * 5);
      scene.add(led2);
    }

    // ========== ENSEIGNE D'ENTRÉE ==========
    const entranceCanvas = document.createElement('canvas');
    entranceCanvas.width = 1024;
    entranceCanvas.height = 256;
    const ectx = entranceCanvas.getContext('2d');
    // Fond néon
    const grad = ectx.createLinearGradient(0, 0, 1024, 256);
    grad.addColorStop(0, casino.primary);
    grad.addColorStop(0.5, '#000');
    grad.addColorStop(1, casino.secondary);
    ectx.fillStyle = grad;
    ectx.fillRect(0, 0, 1024, 256);
    ectx.fillStyle = '#000';
    ectx.fillRect(10, 10, 1004, 236);
    ectx.strokeStyle = casino.secondary;
    ectx.lineWidth = 6;
    ectx.strokeRect(15, 15, 994, 226);
    ectx.fillStyle = casino.secondary;
    ectx.shadowColor = casino.secondary;
    ectx.shadowBlur = 20;
    ectx.font = 'bold 90px Georgia, serif';
    ectx.textAlign = 'center';
    ectx.fillText(casino.name.toUpperCase(), 512, 110);
    ectx.fillStyle = '#fff';
    ectx.shadowBlur = 10;
    ectx.font = 'italic 40px Georgia, serif';
    ectx.fillText(casino.tagline, 512, 180);
    const etex = new THREE.CanvasTexture(entranceCanvas);
    const entranceSign = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 3),
      new THREE.MeshBasicMaterial({ map: etex, transparent: true })
    );
    entranceSign.position.set(0, 4.8, 19.9);
    entranceSign.rotation.y = Math.PI;
    scene.add(entranceSign);
    // Bordure lumineuse autour
    for (let i = 0; i < 10; i++) {
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xffd700 })
      );
      const angle = i / 20;
      if (i < 10) bulb.position.set(-6 + angle * 12, 3.3, 19.85);
      else bulb.position.set(-6 + (angle - 0.5) * 12, 6.3, 19.85);
      scene.add(bulb);
    }
    
    // Tableaux décoratifs sur les murs
    const createPainting = (x, y, z, rotY, color) => {
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(2, 1.5, 0.1),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8 })
      );
      frame.position.set(x, y, z);
      frame.rotation.y = rotY;
      scene.add(frame);
      const inner = new THREE.Mesh(
        new THREE.PlaneGeometry(1.7, 1.2),
        new THREE.MeshStandardMaterial({ color })
      );
      inner.position.set(x + Math.cos(rotY + Math.PI/2) * 0.06, y, z + Math.sin(rotY + Math.PI/2) * 0.06);
      inner.rotation.y = rotY;
      scene.add(inner);
    };
    createPainting(-19.8, 3, -8, Math.PI / 2, 0x4a2a10);
    createPainting(-19.8, 3, 8, Math.PI / 2, 0x1a4a1a);
    createPainting(19.8, 3, -8, -Math.PI / 2, 0x1a1a4a);
    createPainting(19.8, 3, 8, -Math.PI / 2, 0x4a1a1a);

    // ========== TVs AVEC MATCHS LIVE ==========
    const tvTextures = [];
    const createTV = (x, y, z, rotY, sport) => {
      const tvGroup = new THREE.Group();
      
      // Cadre
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 1.9, 0.15),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.3 })
      );
      tvGroup.add(frame);
      
      // Écran (canvas)
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 180;
      const ctx = canvas.getContext('2d');
      const tex = new THREE.CanvasTexture(canvas);
      tvTextures.push({ canvas, ctx, texture: tex, sport, frame: 0, homeScore: 0, awayScore: 0 });
      
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(2.9, 1.63),
        new THREE.MeshBasicMaterial({ map: tex })
      );
      screen.position.z = 0.08;
      tvGroup.add(screen);
      
      // Support mural
      const bracket = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.2, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 })
      );
      bracket.position.z = -0.15;
      tvGroup.add(bracket);
      
      tvGroup.position.set(x, y, z);
      tvGroup.rotation.y = rotY;
      scene.add(tvGroup);
    };
    
    // 4 TVs autour du casino
    createTV(-19.8, 4.2, -3, Math.PI / 2, 'football');
    createTV(-19.8, 4.2, 3, Math.PI / 2, 'basket');
    createTV(19.8, 4.2, -3, -Math.PI / 2, 'tennis');
    createTV(19.8, 4.2, 3, -Math.PI / 2, 'football2');
    
    // Fonction qui dessine le frame de chaque TV
    const drawTVFrame = (tvData, time) => {
      const { canvas, ctx, texture, sport } = tvData;
      const w = canvas.width, h = canvas.height;
      
      if (sport === 'football' || sport === 'football2') {
        // Terrain de foot vue latérale
        ctx.fillStyle = '#1a5a1a';
        ctx.fillRect(0, 0, w, h);
        // Bandes alternées
        for (let i = 0; i < 6; i++) {
          if (i % 2 === 0) {
            ctx.fillStyle = '#1a6a1a';
            ctx.fillRect(i * (w/6), 0, w/6, h);
          }
        }
        // Lignes
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 40, w - 40, h - 80);
        ctx.beginPath();
        ctx.moveTo(w/2, 40); ctx.lineTo(w/2, h - 40);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(w/2, h/2, 40, 0, Math.PI * 2);
        ctx.stroke();
        
        // Ballon qui se déplace
        const ballX = w/2 + Math.sin(time * 0.002) * (w/3);
        const ballY = h/2 + Math.cos(time * 0.003) * 40;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ballX, ballY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(ballX - 2, ballY - 1, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Joueurs (petits rectangles)
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2 + time * 0.0005;
          const px = w/2 + Math.cos(angle) * 80 + Math.sin(time * 0.003 + i) * 20;
          const py = h/2 + Math.sin(angle) * 50;
          ctx.fillStyle = i < 3 ? '#ff0040' : '#0040ff';
          ctx.fillRect(px - 4, py - 10, 8, 20);
          // Tête
          ctx.fillStyle = '#f4c088';
          ctx.beginPath();
          ctx.arc(px, py - 13, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Bandeau score
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, w, 30);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(sport === 'football' ? 'PSG 2 - 1 OM' : 'REAL 0 - 0 BARCA', 10, 22);
        ctx.fillStyle = '#ff4444';
        ctx.fillText('● LIVE', w - 90, 22);
        
      } else if (sport === 'basket') {
        // Terrain de basket
        ctx.fillStyle = '#c8925a';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 40, w - 40, h - 80);
        ctx.beginPath();
        ctx.arc(w/2, h/2, 35, 0, Math.PI * 2);
        ctx.stroke();
        // Paniers
        ctx.fillStyle = '#222';
        ctx.fillRect(20, h/2 - 25, 8, 50);
        ctx.fillRect(w - 28, h/2 - 25, 8, 50);
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(15, h/2 - 10, 5, 20);
        ctx.fillRect(w - 20, h/2 - 10, 5, 20);
        
        // Ballon
        const bx = w/2 + Math.sin(time * 0.003) * (w/3);
        const by = h/2 + Math.abs(Math.cos(time * 0.004)) * 30;
        ctx.fillStyle = '#e85020';
        ctx.beginPath();
        ctx.arc(bx, by, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx - 7, by); ctx.lineTo(bx + 7, by);
        ctx.moveTo(bx, by - 7); ctx.lineTo(bx, by + 7);
        ctx.stroke();
        
        // Joueurs
        for (let i = 0; i < 10; i++) {
          const angle = (i / 10) * Math.PI * 2 + time * 0.0008;
          const px = w/2 + Math.cos(angle) * 100 + Math.sin(time * 0.002 + i) * 15;
          const py = h/2 + Math.sin(angle) * 60;
          ctx.fillStyle = i < 5 ? '#ffcc00' : '#006600';
          ctx.fillRect(px - 4, py - 11, 8, 22);
          ctx.fillStyle = '#f4c088';
          ctx.beginPath();
          ctx.arc(px, py - 14, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Score
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, w, 30);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Arial';
        ctx.fillText('LAKERS 89 - 84 CELTICS', 10, 22);
        ctx.fillStyle = '#ff4444';
        ctx.fillText('● LIVE Q3', w - 110, 22);
        
      } else if (sport === 'tennis') {
        // Court de tennis
        ctx.fillStyle = '#2a8a3e';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#4aaa5e';
        ctx.fillRect(50, 50, w - 100, h - 100);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, 50, w - 100, h - 100);
        // Filet
        ctx.beginPath();
        ctx.moveTo(w/2, 50); ctx.lineTo(w/2, h - 50);
        ctx.stroke();
        // Lignes de service
        ctx.strokeRect(50, h/2 - 40, w/2 - 50, 80);
        ctx.strokeRect(w/2, h/2 - 40, w/2 - 50, 80);
        
        // Balle
        const tx = w/2 + Math.sin(time * 0.005) * (w/3);
        const ty = h/2 + Math.cos(time * 0.006) * 60;
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(tx, ty, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // 2 joueurs
        const p1x = 150 + Math.sin(time * 0.003) * 30;
        const p2x = w - 150 + Math.cos(time * 0.004) * 30;
        ctx.fillStyle = '#fff';
        ctx.fillRect(p1x - 4, h/2 - 14, 8, 28);
        ctx.fillRect(p2x - 4, h/2 - 14, 8, 28);
        ctx.fillStyle = '#f4c088';
        ctx.beginPath();
        ctx.arc(p1x, h/2 - 18, 4, 0, Math.PI * 2);
        ctx.arc(p2x, h/2 - 18, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Score
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, w, 30);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('DJOKOVIC 6-4 4-3  NADAL', 10, 22);
        ctx.fillStyle = '#ff4444';
        ctx.fillText('● LIVE', w - 90, 22);
      }
      
      texture.needsUpdate = true;
    };

    // ========== AFFICHES / PUBLICITÉS ==========
    const createPoster = (x, y, z, rotY, type) => {
      const canvas = document.createElement('canvas');
      canvas.width = 400; canvas.height = 600;
      const ctx = canvas.getContext('2d');
      
      if (type === 'concert') {
        // Fond dégradé
        const grad = ctx.createLinearGradient(0, 0, 0, 600);
        grad.addColorStop(0, '#ff00aa');
        grad.addColorStop(0.5, '#6a0080');
        grad.addColorStop(1, '#000');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 400, 600);
        // Titre
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 56px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('CONCERT', 200, 100);
        ctx.font = 'bold 42px Georgia';
        ctx.fillStyle = '#fff';
        ctx.fillText('LIVE', 200, 160);
        // Silhouette
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(200, 320, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(160, 350, 80, 160);
        // Info
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 28px Arial';
        ctx.fillText('THIS SATURDAY', 200, 550);
        ctx.font = '20px Arial';
        ctx.fillText('CASINO ARENA', 200, 580);
      } else if (type === 'boxing') {
        ctx.fillStyle = '#1a0000';
        ctx.fillRect(0, 0, 400, 600);
        // Bordure rouge
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 8;
        ctx.strokeRect(10, 10, 380, 580);
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 60px Impact';
        ctx.textAlign = 'center';
        ctx.fillText('BOXING', 200, 100);
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 40px Impact';
        ctx.fillText('NIGHT', 200, 160);
        // VS
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 80px Impact';
        ctx.fillText('VS', 200, 340);
        // Noms
        ctx.font = 'bold 30px Arial';
        ctx.fillText('TYSON', 200, 260);
        ctx.fillText('ALI', 200, 420);
        ctx.fillStyle = '#ff0';
        ctx.font = '22px Arial';
        ctx.fillText('MAIN EVENT', 200, 520);
        ctx.font = '18px Arial';
        ctx.fillText('FRIDAY 10PM', 200, 560);
      } else if (type === 'casino') {
        ctx.fillStyle = '#0a0a20';
        ctx.fillRect(0, 0, 400, 600);
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 72px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('JACKPOT', 200, 120);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px Georgia';
        ctx.fillText('1 000 000', 200, 280);
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 24px Georgia';
        ctx.fillText('BENZOUZ', 200, 320);
        // Cartes
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = '#fff';
          ctx.fillRect(60 + i * 75, 400, 50, 70);
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.strokeRect(60 + i * 75, 400, 50, 70);
          ctx.fillStyle = i % 2 === 0 ? '#000' : '#ff0000';
          ctx.font = 'bold 24px Arial';
          ctx.fillText(['A', 'K', 'Q', 'J'][i], 85 + i * 75, 440);
        }
        ctx.fillStyle = '#ff00aa';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('TENTEZ VOTRE CHANCE', 200, 560);
      }
      
      const tex = new THREE.CanvasTexture(canvas);
      const poster = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 1.8),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true })
      );
      poster.position.set(x, y, z);
      poster.rotation.y = rotY;
      scene.add(poster);
      // Cadre
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 1.9, 0.08),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8 })
      );
      frame.position.copy(poster.position);
      frame.position.x += Math.cos(rotY + Math.PI) * 0.05;
      frame.position.z += Math.sin(rotY + Math.PI) * 0.05;
      frame.rotation.y = rotY;
      scene.add(frame);
    };
    
    createPoster(-19.7, 2.2, -13, Math.PI / 2, 'concert');
    createPoster(-19.7, 2.2, 13, Math.PI / 2, 'boxing');
    createPoster(19.7, 2.2, -13, -Math.PI / 2, 'casino');
    createPoster(19.7, 2.2, 13, -Math.PI / 2, 'concert');

    // ========== PLANTES ==========
    const createPlant = (x, z) => {
      const plantGroup = new THREE.Group();
      // Pot
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.3, 0.6, 12),
        new THREE.MeshStandardMaterial({ color: 0x5a2a10, roughness: 0.8 })
      );
      pot.position.y = 0.3;
      plantGroup.add(pot);
      // Feuilles
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const leaf = new THREE.Mesh(
          new THREE.ConeGeometry(0.15, 1.2, 4),
          new THREE.MeshStandardMaterial({ color: 0x1a5a1a, roughness: 0.9 })
        );
        leaf.position.set(Math.cos(angle) * 0.15, 1.2, Math.sin(angle) * 0.15);
        leaf.rotation.z = Math.cos(angle) * 0.3;
        leaf.rotation.x = Math.sin(angle) * 0.3;
        plantGroup.add(leaf);
      }
      // Tronc/tige central
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 0.8, 8),
        new THREE.MeshStandardMaterial({ color: 0x3a2010 })
      );
      trunk.position.y = 0.9;
      plantGroup.add(trunk);
      plantGroup.position.set(x, 0, z);
      scene.add(plantGroup);
    };
    
    createPlant(-18, -18);
    createPlant(18, -18);
    createPlant(-18, 18);
    createPlant(18, 18);
    createPlant(-5, 18);
    createPlant(5, 18);

    // ========== MIROIRS (grands panneaux réfléchissants simulés) ==========
    const createMirror = (x, y, z, rotY) => {
      const mirror = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 3),
        new THREE.MeshStandardMaterial({ 
          color: 0xe0e0e0, 
          metalness: 0.95, 
          roughness: 0.08,
          envMapIntensity: 2,
        })
      );
      mirror.position.set(x, y, z);
      mirror.rotation.y = rotY;
      scene.add(mirror);
      // Cadre doré
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 3.2, 0.1),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 })
      );
      frame.position.copy(mirror.position);
      frame.position.x += Math.cos(rotY + Math.PI) * 0.03;
      frame.position.z += Math.sin(rotY + Math.PI) * 0.03;
      frame.rotation.y = rotY;
      scene.add(frame);
    };
    
    createMirror(0, 3, -19.85, 0);

    // ========== DRAPEAU GÉANT DU PAYS ==========
    const flagCanvas = document.createElement('canvas');
    flagCanvas.width = 512; flagCanvas.height = 320;
    const fctx = flagCanvas.getContext('2d');
    const bands = casino.flag.length;
    casino.flag.forEach((col, i) => {
      fctx.fillStyle = col;
      fctx.fillRect((i / bands) * 512, 0, 512 / bands, 320);
    });
    const flagTex = new THREE.CanvasTexture(flagCanvas);
    const giantFlag = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 2.5),
      new THREE.MeshStandardMaterial({ map: flagTex, side: THREE.DoubleSide, roughness: 0.8 })
    );
    giantFlag.position.set(-8, 4.3, -19.8);
    scene.add(giantFlag);
    const giantFlag2 = giantFlag.clone();
    giantFlag2.position.set(8, 4.3, -19.8);
    scene.add(giantFlag2);

    // Stocker tvTextures pour animation dans la loop
    const tvTexturesRef = tvTextures;

    // ========== PNJ QUI SE BALADENT ==========
    const createNPC = (startX, startZ, skinHex, shirtHex, pantsHex, hairHex) => {
      const npc = new THREE.Group();
      
      // Jambes
      const pantsMat = new THREE.MeshStandardMaterial({ color: pantsHex });
      const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.8, 8), pantsMat);
      legL.position.set(-0.12, 0.4, 0);
      npc.add(legL);
      const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.8, 8), pantsMat);
      legR.position.set(0.12, 0.4, 0);
      npc.add(legR);
      // Chaussures
      const shoeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
      const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.07, 0.3), shoeMat);
      shoeL.position.set(-0.12, 0.035, 0.08);
      npc.add(shoeL);
      const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.07, 0.3), shoeMat);
      shoeR.position.set(0.12, 0.035, 0.08);
      npc.add(shoeR);
      
      // Torse
      const shirtMat = new THREE.MeshStandardMaterial({ color: shirtHex });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.55, 12), shirtMat);
      body.position.y = 1.15;
      npc.add(body);
      
      // Épaules
      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), shirtMat);
      shoulder.position.set(-0.3, 1.4, 0);
      npc.add(shoulder);
      const shoulderR = shoulder.clone();
      shoulderR.position.x = 0.3;
      npc.add(shoulderR);
      
      // Bras
      const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.65, 8), shirtMat);
      armL.position.set(-0.35, 1.05, 0);
      npc.add(armL);
      const armR = armL.clone();
      armR.position.x = 0.35;
      npc.add(armR);
      
      // Mains
      const handMat = new THREE.MeshStandardMaterial({ color: skinHex });
      const handL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), handMat);
      handL.position.set(-0.38, 0.7, 0);
      npc.add(handL);
      const handR = handL.clone();
      handR.position.x = 0.38;
      npc.add(handR);
      
      // Cou + tête
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.1, 8),
        new THREE.MeshStandardMaterial({ color: skinHex }));
      neck.position.y = 1.48;
      npc.add(neck);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16),
        new THREE.MeshStandardMaterial({ color: skinHex }));
      head.position.y = 1.73;
      head.scale.y = 1.1;
      npc.add(head);
      
      // Cheveux
      const hair = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: hairHex })
      );
      hair.position.y = 1.78;
      npc.add(hair);
      
      // Yeux simples
      const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000 });
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), eyeMat);
      eyeL.position.set(-0.08, 1.78, 0.2);
      npc.add(eyeL);
      const eyeR = eyeL.clone();
      eyeR.position.x = 0.08;
      npc.add(eyeR);
      
      npc.position.set(startX, 0, startZ);
      npc.userData = { isNpc: true, dead: false };
      scene.add(npc);
      return npc;
    };
    
    // Créer 6 PNJ avec des profils variés
    const npcs = [];
    const npcColors = [
      [0xe8b896, 0x4a2a80, 0x1a1a2a, 0x2a1810], // costume violet
      [0xd4a878, 0x8b0000, 0x2a1a0a, 0x3a1810],
      [0xf0c090, 0x006633, 0x1a1a1a, 0xffd700], // blonde
      [0xc08870, 0xff4500, 0x0a0a0a, 0x1a0a0a],
      [0xe0a078, 0x1a4b8a, 0x0a1020, 0x4a2818],
      [0xf4c088, 0xffd700, 0x2a1a2a, 0x1a1010], // riche doré
    ];
    const npcPaths = [
      { x0: -10, z0: 10, x1: 10, z1: 10, speed: 0.008 },
      { x0: 10, z0: -5, x1: -10, z1: -5, speed: 0.007 },
      { x0: -15, z0: -15, x1: 15, z1: 15, speed: 0.005 },
      { x0: 5, z0: 15, x1: -5, z1: -15, speed: 0.009 },
      { x0: 15, z0: 0, x1: -15, z1: 0, speed: 0.006 },
      { x0: 0, z0: -18, x1: 0, z1: 18, speed: 0.004 },
    ];
    for (let i = 0; i < 6; i++) {
      const [skin, shirt, pants, hair] = npcColors[i];
      const path = npcPaths[i];
      const npc = createNPC(path.x0, path.z0, skin, shirt, pants, hair);
      npcs.push({ mesh: npc, path, phase: Math.random() * Math.PI * 2 });
    }
    allNpcsRef.current = npcs.map(n => n.mesh);

    // ========== FONCTION CRÉATION CROUPIER 3D DÉTAILLÉ ==========
    const createDealer3D = (profileData) => {
      const g = new THREE.Group();
      const skinHex = parseInt(profileData.skin.slice(1), 16);
      const hairHex = parseInt(profileData.hair.slice(1), 16);
      
      // Jambes (pantalon noir) - NOUVEAU, évite de rentrer dans la table
      const pantsMat = new THREE.MeshStandardMaterial({ color: 0x0a0a15, roughness: 0.8 });
      const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.85, 8), pantsMat);
      legL.position.set(-0.13, 0.42, 0);
      g.add(legL);
      const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.85, 8), pantsMat);
      legR.position.set(0.13, 0.42, 0);
      g.add(legR);
      
      // Chaussures noires
      const shoeMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.2, metalness: 0.3 });
      const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.32), shoeMat);
      shoeL.position.set(-0.13, 0.04, 0.08);
      g.add(shoeL);
      const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.32), shoeMat);
      shoeR.position.set(0.13, 0.04, 0.08);
      g.add(shoeR);
      
      // Ceinture
      const belt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.32, 0.08, 12),
        new THREE.MeshStandardMaterial({ color: 0x1a0a05, roughness: 0.5 })
      );
      belt.position.y = 0.88;
      g.add(belt);
      const beltBuckle = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.07, 0.02),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 })
      );
      beltBuckle.position.set(0, 0.88, 0.33);
      g.add(beltBuckle);
      
      // Torse (veste noire)
      const suitMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.7 });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.35, 0.6, 12), suitMat);
      body.position.y = 1.22;
      body.castShadow = true;
      g.add(body);
      
      // Chemise blanche (devant)
      const shirt = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.45, 0.05),
        new THREE.MeshStandardMaterial({ color: 0xf8f8f8, roughness: 0.5 })
      );
      shirt.position.set(0, 1.25, 0.32);
      g.add(shirt);
      
      // Revers de la veste
      const revL = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.35, 0.03),
        new THREE.MeshStandardMaterial({ color: 0x0a0a15, roughness: 0.6 })
      );
      revL.position.set(-0.11, 1.3, 0.32);
      revL.rotation.z = -0.1;
      g.add(revL);
      const revR = revL.clone();
      revR.position.x = 0.11;
      revR.rotation.z = 0.1;
      g.add(revR);
      
      // Noeud papillon
      const bowCenter = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.04, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x6a0000 })
      );
      bowCenter.position.set(0, 1.45, 0.36);
      g.add(bowCenter);
      const bowL = new THREE.Mesh(
        new THREE.ConeGeometry(0.04, 0.08, 4),
        new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.4 })
      );
      bowL.rotation.z = Math.PI / 2;
      bowL.position.set(-0.06, 1.45, 0.36);
      g.add(bowL);
      const bowR = bowL.clone();
      bowR.position.x = 0.06;
      bowR.rotation.z = -Math.PI / 2;
      g.add(bowR);
      
      // Épaulettes
      const shoulderL = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        suitMat
      );
      shoulderL.position.set(-0.33, 1.48, 0);
      g.add(shoulderL);
      const shoulderR = shoulderL.clone();
      shoulderR.position.x = 0.33;
      g.add(shoulderR);
      
      // Cou
      const neck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.12, 0.15, 10),
        new THREE.MeshStandardMaterial({ color: skinHex, roughness: 0.5 })
      );
      neck.position.y = 1.6;
      g.add(neck);
      
      // Tête
      const headMat = new THREE.MeshStandardMaterial({ color: skinHex, roughness: 0.55 });
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 20), headMat);
      head.position.y = 1.86;
      head.scale.y = 1.15; // légèrement allongé
      head.castShadow = true;
      g.add(head);
      
      // Cheveux
      if (profileData.gender === 'f') {
        const hair = new THREE.Mesh(
          new THREE.SphereGeometry(0.28, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.75),
          new THREE.MeshStandardMaterial({ color: hairHex, roughness: 0.9 })
        );
        hair.position.y = 1.88;
        g.add(hair);
        // Queue ou mèches longues
        const pony = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.09, 0.3, 8),
          new THREE.MeshStandardMaterial({ color: hairHex })
        );
        pony.position.set(0, 1.6, -0.22);
        g.add(pony);
      } else {
        const hair = new THREE.Mesh(
          new THREE.SphereGeometry(0.26, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
          new THREE.MeshStandardMaterial({ color: hairHex, roughness: 0.9 })
        );
        hair.position.y = 1.92;
        g.add(hair);
      }
      
      // Oreilles
      const earMat = new THREE.MeshStandardMaterial({ color: skinHex });
      const earL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), earMat);
      earL.position.set(-0.23, 1.86, 0);
      earL.scale.set(0.7, 1.2, 1);
      g.add(earL);
      const earR = earL.clone();
      earR.position.x = 0.23;
      g.add(earR);
      
      // Yeux
      const eyesHex = parseInt(profileData.eyes.slice(1), 16);
      const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const eyeIris = new THREE.MeshStandardMaterial({ color: eyesHex });
      
      const eyeLW = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), eyeWhite);
      eyeLW.position.set(-0.09, 1.9, 0.2);
      eyeLW.scale.set(1, 0.7, 0.5);
      g.add(eyeLW);
      const eyeRW = eyeLW.clone(); eyeRW.position.x = 0.09; g.add(eyeRW);
      
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.023, 8, 8), eyeIris);
      eyeL.position.set(-0.09, 1.9, 0.24);
      g.add(eyeL);
      const eyeR = eyeL.clone(); eyeR.position.x = 0.09; g.add(eyeR);
      
      const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
      const pupL = new THREE.Mesh(new THREE.SphereGeometry(0.01, 6, 6), pupilMat);
      pupL.position.set(-0.09, 1.9, 0.26);
      g.add(pupL);
      const pupR = pupL.clone(); pupR.position.x = 0.09; g.add(pupR);
      
      // Sourcils
      const browMat = new THREE.MeshStandardMaterial({ color: hairHex });
      const browL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.015, 0.02), browMat);
      browL.position.set(-0.09, 1.96, 0.22);
      browL.rotation.z = -0.1;
      g.add(browL);
      const browR = browL.clone();
      browR.position.x = 0.09;
      browR.rotation.z = 0.1;
      g.add(browR);
      
      // Nez
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.1, 6),
        new THREE.MeshStandardMaterial({ color: skinHex }));
      nose.rotation.x = Math.PI / 2;
      nose.position.set(0, 1.85, 0.25);
      g.add(nose);
      
      // Bouche (plus détaillée)
      const mouthMat = new THREE.MeshStandardMaterial({ color: 0x7a3828 });
      const lipUpper = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.01, 0.02), mouthMat);
      lipUpper.position.set(0, 1.76, 0.23);
      g.add(lipUpper);
      const lipLower = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.012, 0.02), 
        new THREE.MeshStandardMaterial({ color: 0x8a4030 }));
      lipLower.position.set(0, 1.745, 0.23);
      g.add(lipLower);
      
      // Barbe
      if (profileData.beard) {
        const beard = new THREE.Mesh(
          new THREE.SphereGeometry(0.22, 12, 12, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.4),
          new THREE.MeshStandardMaterial({ color: hairHex, roughness: 0.95 })
        );
        beard.position.y = 1.76;
        beard.scale.set(1.05, 0.8, 1);
        g.add(beard);
        // Moustache
        const mustache = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.02, 0.03),
          new THREE.MeshStandardMaterial({ color: hairHex })
        );
        mustache.position.set(0, 1.78, 0.23);
        g.add(mustache);
      }
      
      // Lunettes
      if (profileData.glasses) {
        const glassMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.6 });
        const lensL = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.008, 6, 12), glassMat);
        lensL.position.set(-0.09, 1.9, 0.25);
        g.add(lensL);
        const lensR = lensL.clone(); lensR.position.x = 0.09; g.add(lensR);
        const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.008, 0.008), glassMat);
        bridge.position.set(0, 1.9, 0.25);
        g.add(bridge);
        // Branches
        const armL = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.008, 0.14), glassMat);
        armL.position.set(-0.17, 1.9, 0.18);
        g.add(armL);
        const armRB = armL.clone();
        armRB.position.x = 0.17;
        g.add(armRB);
      }
      
      // Bras avec épaules, biceps, avant-bras, mains
      const armUpperL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.1, 0.4, 8), suitMat
      );
      armUpperL.position.set(-0.4, 1.3, 0.05);
      armUpperL.rotation.x = -0.15;
      armUpperL.rotation.z = 0.05;
      g.add(armUpperL);
      const armUpperR = armUpperL.clone();
      armUpperR.position.x = 0.4;
      armUpperR.rotation.z = -0.05;
      g.add(armUpperR);
      
      const armLowerL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.085, 0.09, 0.38, 8), suitMat
      );
      armLowerL.position.set(-0.43, 0.92, 0.18);
      armLowerL.rotation.x = -0.35;
      g.add(armLowerL);
      const armLowerR = armLowerL.clone();
      armLowerR.position.x = 0.43;
      g.add(armLowerR);
      
      // Manchettes blanches qui dépassent
      const cuffMat = new THREE.MeshStandardMaterial({ color: 0xf8f8f8 });
      const cuffL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 8), cuffMat);
      cuffL.position.set(-0.46, 0.74, 0.23);
      g.add(cuffL);
      const cuffR = cuffL.clone();
      cuffR.position.x = 0.46;
      g.add(cuffR);
      
      // Mains
      const handMat = new THREE.MeshStandardMaterial({ color: skinHex });
      const handL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), handMat);
      handL.position.set(-0.47, 0.68, 0.27);
      handL.scale.set(1, 0.85, 1.1);
      g.add(handL);
      const handR = handL.clone(); 
      handR.position.x = 0.47;
      g.add(handR);
      
      return g;
    };


    // ========== TABLES DE JEU ==========
    const createTable = (x, z, label, colHex, id, dealerData) => {
      const group = new THREE.Group();
      group.position.set(x, 0, z);

      // Piétement
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.8, 0.8, 16),
        new THREE.MeshStandardMaterial({ color: 0x2a1608, metalness: 0.4, roughness: 0.6 })
      );
      base.position.y = 0.4;
      base.castShadow = true;
      group.add(base);

      let topGeom;
      if (id === 'roulette') topGeom = new THREE.CylinderGeometry(2, 2, 0.15, 32);
      else {
        topGeom = new THREE.CylinderGeometry(1.8, 1.8, 0.15, 32);
        topGeom.scale(1.4, 1, 1);
      }
      const top = new THREE.Mesh(topGeom,
        new THREE.MeshStandardMaterial({ color: 0x0a4020, roughness: 0.8 }));
      top.position.y = 0.9;
      top.castShadow = true;
      top.receiveShadow = true;
      group.add(top);

      // Bordure dorée
      let borderGeom;
      if (id === 'roulette') borderGeom = new THREE.TorusGeometry(2, 0.08, 8, 32);
      else {
        borderGeom = new THREE.TorusGeometry(1.8, 0.08, 8, 32);
        borderGeom.scale(1.4, 1, 1);
      }
      const border = new THREE.Mesh(borderGeom,
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.2 }));
      border.position.y = 0.98;
      border.rotation.x = Math.PI / 2;
      group.add(border);

      // Eléments spécifiques
      let rouletteWheel = null;
      if (id === 'roulette') {
        rouletteWheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.6, 0.6, 0.1, 37),
          new THREE.MeshStandardMaterial({ color: 0x3a2010, metalness: 0.7 })
        );
        rouletteWheel.position.set(0, 1.05, 0);
        group.add(rouletteWheel);
        const ball = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 12, 12),
          new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.5 })
        );
        ball.position.set(0.45, 1.15, 0);
        group.add(ball);
      } else if (id === 'blackjack') {
        for (let i = 0; i < 3; i++) {
          const card = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.02, 0.4),
            new THREE.MeshStandardMaterial({ color: 0xffffff })
          );
          card.position.set(-0.5 + i * 0.4, 1.0, 0.3);
          card.rotation.y = (Math.random() - 0.5) * 0.2;
          group.add(card);
        }
      } else if (id === 'highcard') {
        const cardMat = new THREE.MeshStandardMaterial({ color: 0x8b0000 });
        const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.55), cardMat);
        c1.position.set(-0.6, 1.0, 0);
        group.add(c1);
        const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.55), cardMat);
        c2.position.set(0.6, 1.0, 0);
        group.add(c2);
      }

      // Jetons décoratifs
      for (let i = 0; i < 5; i++) {
        const chipColors = [0xff0000, 0x0000ff, 0x00ff00, 0x000000, 0xffd700];
        const chip = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.1, 0.04, 16),
          new THREE.MeshStandardMaterial({ color: chipColors[i % 5] })
        );
        chip.position.set(Math.cos(i) * 1.3, 1.0 + (i * 0.04), Math.sin(i) * 1.3);
        group.add(chip);
      }

      // Croupier 3D détaillé
      const dealer = createDealer3D(dealerData);
      dealer.position.set(0, 0, -2.8);
      dealer.userData = { isDealer: true, dead: false };
      group.add(dealer);

      // Panneau lumineux
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.8, 0.05),
        new THREE.MeshBasicMaterial({ color: colHex })
      );
      sign.position.set(0, 3.8, -2.5);
      group.add(sign);

      const canvas = document.createElement('canvas');
      canvas.width = 512; canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 512, 128);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 60px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 256, 64);
      const tex = new THREE.CanvasTexture(canvas);
      const text = new THREE.Mesh(
        new THREE.PlaneGeometry(3, 0.7),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true })
      );
      text.position.set(0, 3.8, -2.47);
      group.add(text);

      const zone = new THREE.Mesh(
        new THREE.SphereGeometry(3, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      zone.userData = { zoneId: id };
      group.add(zone);

      scene.add(group);
      return { wheel: rouletteWheel, zone, dealer };
    };

    // Tables avec croupiers uniques
    const bjDealer = DEALER_PROFILES[Math.floor(Math.random() * DEALER_PROFILES.length)];
    const rlDealer = DEALER_PROFILES[Math.floor(Math.random() * DEALER_PROFILES.length)];
    const hcDealer = DEALER_PROFILES[Math.floor(Math.random() * DEALER_PROFILES.length)];
    
    const bj = createTable(-6, -2, 'BLACKJACK', secondaryHex, 'blackjack', bjDealer);
    const rl = createTable(0, -8, 'ROULETTE', 0xff0040, 'roulette', rlDealer);
    const hc = createTable(6, -2, 'CARTE HAUTE', 0x00d4ff, 'highcard', hcDealer);
    const pkDealer = DEALER_PROFILES[Math.floor(Math.random() * DEALER_PROFILES.length)];
    const pk = createTable(0, 4, 'POKER', 0x00aa66, 'poker', pkDealer);

    // Liste de tous les croupiers pour le tir visé
    allDealersRef.current = [bj.dealer, rl.dealer, hc.dealer, pk.dealer].filter(Boolean);

    // ========== BAR ==========
    const createBar = () => {
      const group = new THREE.Group();
      group.position.set(-13, 0, 5);
      group.rotation.y = Math.PI / 2; // face vers l'intérieur

      // ========== COMPTOIR EN L ==========
      // Comptoir principal (5m de long)
      const counter = new THREE.Mesh(
        new THREE.BoxGeometry(5, 1.1, 0.9),
        new THREE.MeshStandardMaterial({ color: 0x3a2010, roughness: 0.4, metalness: 0.2 })
      );
      counter.position.set(0, 0.55, 0.8);
      group.add(counter);

      // Dessus du comptoir en marbre
      const counterTop = new THREE.Mesh(
        new THREE.BoxGeometry(5.1, 0.1, 1),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.1, metalness: 0.4 })
      );
      counterTop.position.set(0, 1.15, 0.8);
      group.add(counterTop);

      // Bordure dorée sur le bord du comptoir
      const counterEdge = new THREE.Mesh(
        new THREE.BoxGeometry(5.1, 0.03, 0.03),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.1 })
      );
      counterEdge.position.set(0, 1.21, 1.29);
      group.add(counterEdge);

      // Face avant du comptoir avec panneaux
      for (let i = 0; i < 5; i++) {
        const panel = new THREE.Mesh(
          new THREE.BoxGeometry(0.85, 0.9, 0.04),
          new THREE.MeshStandardMaterial({ color: 0x2a1608, roughness: 0.5 })
        );
        panel.position.set(-2 + i, 0.55, 1.27);
        group.add(panel);
        // Petit filet doré
        const filet = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 0.02, 0.03),
          new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 })
        );
        filet.position.set(-2 + i, 0.55, 1.29);
        group.add(filet);
      }

      // ========== TABOURETS DE BAR (3) ==========
      for (let i = -1; i <= 1; i++) {
        const stool = new THREE.Group();
        // Siège rouge
        const seat = new THREE.Mesh(
          new THREE.CylinderGeometry(0.25, 0.25, 0.08, 16),
          new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.7 })
        );
        seat.position.y = 0.85;
        stool.add(seat);
        // Pied chromé
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.05, 0.8, 8),
          new THREE.MeshStandardMaterial({ color: 0x888, metalness: 0.9, roughness: 0.2 })
        );
        pole.position.y = 0.4;
        stool.add(pole);
        // Base
        const base = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 0.35, 0.05, 16),
          new THREE.MeshStandardMaterial({ color: 0x333, metalness: 0.7 })
        );
        base.position.y = 0.025;
        stool.add(base);
        stool.position.set(i * 1.5, 0, 1.7);
        group.add(stool);
      }

      // ========== MUR DU FOND + ÉTAGÈRES ==========
      const backWall = new THREE.Mesh(
        new THREE.PlaneGeometry(5.5, 3),
        new THREE.MeshStandardMaterial({ color: 0x1a0a05, roughness: 0.8 })
      );
      backWall.position.set(0, 2, -0.4);
      group.add(backWall);

      // Grande étagère centrale en bois
      const shelfMain = new THREE.Mesh(
        new THREE.BoxGeometry(5, 2.2, 0.35),
        new THREE.MeshStandardMaterial({ color: 0x2a1608, roughness: 0.5 })
      );
      shelfMain.position.set(0, 2.3, -0.25);
      group.add(shelfMain);

      // 3 étagères horizontales pour les bouteilles
      for (let s = 0; s < 3; s++) {
        const shelf = new THREE.Mesh(
          new THREE.BoxGeometry(4.8, 0.05, 0.4),
          new THREE.MeshStandardMaterial({ color: 0x4a2a10, roughness: 0.3, metalness: 0.2 })
        );
        shelf.position.set(0, 1.6 + s * 0.7, -0.1);
        group.add(shelf);
      }

      // Bouteilles sur chaque étagère (différentes couleurs)
      const bottleColors = [
        0x8b4513, // whisky ambre
        0xd4af37, // or
        0x2a4a1a, // vert foncé
        0x7a0a0a, // vin rouge
        0x1a4b8a, // bleu
        0xf0a040, // rhum
        0xe8e8e8, // gin clair
        0x3a0a3a, // liqueur violette
      ];
      for (let s = 0; s < 3; s++) {
        for (let b = 0; b < 10; b++) {
          const color = bottleColors[b % bottleColors.length];
          // Corps de la bouteille
          const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.07, 0.08, 0.35, 10),
            new THREE.MeshStandardMaterial({ 
              color, 
              transparent: true, 
              opacity: 0.7,
              roughness: 0.05,
              metalness: 0.3,
            })
          );
          body.position.set(-2.3 + b * 0.5, 1.85 + s * 0.7, -0.1);
          group.add(body);
          // Goulot
          const neck = new THREE.Mesh(
            new THREE.CylinderGeometry(0.025, 0.035, 0.12, 8),
            new THREE.MeshStandardMaterial({ color })
          );
          neck.position.set(-2.3 + b * 0.5, 2.08 + s * 0.7, -0.1);
          group.add(neck);
          // Bouchon
          const cap = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 0.04, 8),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
          );
          cap.position.set(-2.3 + b * 0.5, 2.16 + s * 0.7, -0.1);
          group.add(cap);
        }
      }

      // ========== VERRES EN RÉSERVE ==========
      for (let g = 0; g < 6; g++) {
        const glass = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.04, 0.1, 8),
          new THREE.MeshStandardMaterial({ 
            color: 0xccddff, 
            transparent: true, 
            opacity: 0.4,
            roughness: 0.05,
          })
        );
        glass.position.set(-1.2 + g * 0.15, 1.22, 0.4);
        group.add(glass);
      }

      // ========== BARMAN 3D DÉTAILLÉ ==========
      const barman = createDealer3D({ 
        skin: '#e8b896', hair: '#2a1810', eyes: '#4a2c1a', 
        beard: true, glasses: false, gender: 'm' 
      });
      // Le barman est debout derrière le comptoir
      barman.position.set(0, 0, 0);
      // Il tient un shaker ? on simule avec un petit cylindre dans la main
      const shaker = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.05, 0.25, 10),
        new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.15 })
      );
      shaker.position.set(0.55, 0.75, 0.2);
      barman.add(shaker);
      group.add(barman);

      // ========== ENSEIGNE BAR NÉON ==========
      const barCanvas = document.createElement('canvas');
      barCanvas.width = 512; barCanvas.height = 128;
      const bctx = barCanvas.getContext('2d');
      bctx.fillStyle = '#000';
      bctx.fillRect(0, 0, 512, 128);
      bctx.shadowColor = '#ffd700';
      bctx.shadowBlur = 20;
      bctx.fillStyle = '#ffd700';
      bctx.font = 'bold 70px Georgia, serif';
      bctx.textAlign = 'center';
      bctx.fillText('🍸 BAR', 256, 80);
      bctx.shadowBlur = 0;
      bctx.fillStyle = '#ff00aa';
      bctx.font = 'italic 24px Georgia';
      bctx.fillText('Cocktails • Bières • Spiritueux', 256, 115);
      const btex = new THREE.CanvasTexture(barCanvas);
      const barSign = new THREE.Mesh(
        new THREE.PlaneGeometry(3.5, 0.9),
        new THREE.MeshBasicMaterial({ map: btex, transparent: true })
      );
      barSign.position.set(0, 4.1, -0.3);
      group.add(barSign);

      // ========== LUMIÈRE SOUS COMPTOIR (effet pub) ==========
      const underLight = new THREE.PointLight(0xffaa00, 1.5, 5);
      underLight.position.set(0, 0.3, 1);
      group.add(underLight);

      // Lumière derrière le bar pour éclairer les bouteilles
      const backLight1 = new THREE.PointLight(0xff00aa, 0.8, 4);
      backLight1.position.set(-1.5, 2.5, 0.3);
      group.add(backLight1);
      const backLight2 = new THREE.PointLight(0x00ffff, 0.8, 4);
      backLight2.position.set(1.5, 2.5, 0.3);
      group.add(backLight2);

      // Zone d'interaction
      const zone = new THREE.Mesh(
        new THREE.SphereGeometry(3, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      zone.userData = { zoneId: 'bar' };
      zone.position.set(0, 1, 2.5);
      group.add(zone);

      scene.add(group);
      return { zone };
    };

    const barObj = createBar();

    // ========== TOILETTES ==========
    const createToilet = () => {
      const group = new THREE.Group();
      group.position.set(13, 0, 5);
      
      // Cabine
      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(3, 4, 2.5),
        new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.7 })
      );
      cabin.position.set(0, 2, -0.5);
      group.add(cabin);
      
      // Porte
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 2.4, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x4a2a10, roughness: 0.8 })
      );
      door.position.set(0, 1.2, 0.74);
      group.add(door);
      
      // Poignée
      const handle = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 })
      );
      handle.position.set(0.4, 1.2, 0.78);
      group.add(handle);
      
      // Panneau WC
      const wcCanvas = document.createElement('canvas');
      wcCanvas.width = 256; wcCanvas.height = 256;
      const wctx = wcCanvas.getContext('2d');
      wctx.fillStyle = '#fff';
      wctx.fillRect(0, 0, 256, 256);
      wctx.fillStyle = '#000';
      wctx.font = 'bold 150px sans-serif';
      wctx.textAlign = 'center';
      wctx.fillText('🚻', 128, 180);
      const wcTex = new THREE.CanvasTexture(wcCanvas);
      const wcSign = new THREE.Mesh(
        new THREE.PlaneGeometry(0.6, 0.6),
        new THREE.MeshBasicMaterial({ map: wcTex })
      );
      wcSign.position.set(0, 2.7, 0.78);
      group.add(wcSign);
      
      const zone = new THREE.Mesh(
        new THREE.SphereGeometry(2, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      zone.userData = { zoneId: 'toilet' };
      zone.position.set(0, 1, 1);
      group.add(zone);
      
      scene.add(group);
      return { zone };
    };
    const toiletObj = createToilet();

    // ========== ATM ==========
    const createATM = () => {
      const group = new THREE.Group();
      group.position.set(-8, 0, 12);
      
      // Corps de l'ATM
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 2.2, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x1a3a4a, metalness: 0.6, roughness: 0.4 })
      );
      body.position.y = 1.1;
      body.castShadow = true;
      group.add(body);
      
      // Écran
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.8, 0.6),
        new THREE.MeshBasicMaterial({ color: 0x00ff88 })
      );
      screen.position.set(0, 1.6, 0.41);
      group.add(screen);
      
      // Clavier
      const keypad = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.4, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
      );
      keypad.position.set(0, 1.1, 0.41);
      group.add(keypad);
      
      // Fente billets
      const slot = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.05, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x000000 })
      );
      slot.position.set(0, 0.75, 0.41);
      group.add(slot);
      
      // Logo ATM
      const atmCanvas = document.createElement('canvas');
      atmCanvas.width = 256; atmCanvas.height = 128;
      const actx = atmCanvas.getContext('2d');
      actx.fillStyle = '#000';
      actx.fillRect(0, 0, 256, 128);
      actx.fillStyle = '#00ff88';
      actx.font = 'bold 80px Arial';
      actx.textAlign = 'center';
      actx.fillText('ATM', 128, 90);
      const atex = new THREE.CanvasTexture(atmCanvas);
      const atmSign = new THREE.Mesh(
        new THREE.PlaneGeometry(0.9, 0.45),
        new THREE.MeshBasicMaterial({ map: atex })
      );
      atmSign.position.set(0, 2.05, 0.41);
      group.add(atmSign);
      
      // Lumière verte
      const atmLight = new THREE.PointLight(0x00ff88, 0.8, 3);
      atmLight.position.set(0, 2, 1);
      group.add(atmLight);
      
      const zone = new THREE.Mesh(
        new THREE.SphereGeometry(1.8, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      zone.userData = { zoneId: 'atm' };
      zone.position.set(0, 1, 1);
      group.add(zone);
      
      scene.add(group);
      return { zone };
    };
    const atmObj = createATM();

    // ========== ROUE DE LA FORTUNE 3D ==========
    const createWheel = () => {
      const group = new THREE.Group();
      group.position.set(8, 0, 12);
      
      // Support
      const stand = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 2.5, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x8b6914, metalness: 0.7 })
      );
      stand.position.y = 1.25;
      group.add(stand);
      
      // Base
      const wheelBase = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 0.1, 32),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
      );
      wheelBase.rotation.x = Math.PI / 2;
      wheelBase.position.y = 2.5;
      group.add(wheelBase);
      
      // Roue colorée
      const wheelCanvas = document.createElement('canvas');
      wheelCanvas.width = 512; wheelCanvas.height = 512;
      const wctx = wheelCanvas.getContext('2d');
      wctx.translate(256, 256);
      const segmentAngle = (Math.PI * 2) / WHEEL_PRIZES.length;
      WHEEL_PRIZES.forEach((prize, i) => {
        wctx.fillStyle = prize.color;
        wctx.beginPath();
        wctx.moveTo(0, 0);
        wctx.arc(0, 0, 240, i * segmentAngle, (i + 1) * segmentAngle);
        wctx.fill();
        wctx.strokeStyle = '#ffd700';
        wctx.lineWidth = 4;
        wctx.stroke();
        // Label
        wctx.save();
        wctx.rotate(i * segmentAngle + segmentAngle / 2);
        wctx.fillStyle = '#fff';
        wctx.font = 'bold 32px Georgia';
        wctx.textAlign = 'center';
        wctx.fillText(prize.label, 150, 10);
        wctx.restore();
      });
      const wheelTex = new THREE.CanvasTexture(wheelCanvas);
      const wheelDisc = new THREE.Mesh(
        new THREE.CircleGeometry(1.4, 32),
        new THREE.MeshBasicMaterial({ map: wheelTex, side: THREE.DoubleSide })
      );
      wheelDisc.rotation.x = Math.PI / 2;
      wheelDisc.position.y = 2.55;
      group.add(wheelDisc);
      
      // Indicateur (triangle)
      const pointer = new THREE.Mesh(
        new THREE.ConeGeometry(0.15, 0.3, 3),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 })
      );
      pointer.rotation.x = Math.PI;
      pointer.position.y = 4.1;
      group.add(pointer);
      
      // Centre doré
      const center = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 0.12, 16),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 })
      );
      center.rotation.x = Math.PI / 2;
      center.position.y = 2.6;
      group.add(center);
      
      // Ampoules autour
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.06, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xffff00 })
        );
        bulb.position.set(Math.cos(angle) * 1.55, 2.5 + Math.sin(angle) * 0.1, Math.sin(angle) * 1.55);
        bulb.position.y = 2.5;
        bulb.position.x = Math.cos(angle) * 1.55;
        bulb.position.z = Math.sin(angle) * 1.55;
        group.add(bulb);
      }
      
      // Enseigne JACKPOT
      const jpCanvas = document.createElement('canvas');
      jpCanvas.width = 512; jpCanvas.height = 128;
      const jctx = jpCanvas.getContext('2d');
      jctx.fillStyle = '#1a1a1a';
      jctx.fillRect(0, 0, 512, 128);
      jctx.fillStyle = '#ffd700';
      jctx.font = 'bold 70px Georgia';
      jctx.textAlign = 'center';
      jctx.fillText('🎡 JACKPOT', 256, 80);
      const jptex = new THREE.CanvasTexture(jpCanvas);
      const jpSign = new THREE.Mesh(
        new THREE.PlaneGeometry(2.5, 0.6),
        new THREE.MeshBasicMaterial({ map: jptex, transparent: true })
      );
      jpSign.position.y = 5;
      group.add(jpSign);
      
      // Lumière
      const wlight = new THREE.PointLight(0xffd700, 1.5, 6);
      wlight.position.set(0, 3, 1);
      group.add(wlight);
      
      const zone = new THREE.Mesh(
        new THREE.SphereGeometry(2.5, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      zone.userData = { zoneId: 'wheel' };
      zone.position.set(0, 1.5, 1.5);
      group.add(zone);
      
      scene.add(group);
      return { wheelDisc, zone };
    };
    const wheelObj = createWheel();

    // ========== BOUTIQUE D'ARMES ==========
    const createShop = () => {
      const group = new THREE.Group();
      group.position.set(-13, 0, -14);
      group.rotation.y = 0; // face vers +Z

      // ========== MUR ARRIÈRE ROUGE SOMBRE ==========
      const backWall = new THREE.Mesh(
        new THREE.PlaneGeometry(6, 4),
        new THREE.MeshStandardMaterial({ color: 0x2a0505, roughness: 0.9 })
      );
      backWall.position.set(0, 2, -0.5);
      group.add(backWall);

      // Plaque métallique stylisée
      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(5.5, 3.5, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.4 })
      );
      plate.position.set(0, 2, -0.4);
      group.add(plate);

      // Rivets dorés sur la plaque
      for (let r = 0; r < 8; r++) {
        const angle = (r / 8) * Math.PI * 2;
        const rivet = new THREE.Mesh(
          new THREE.SphereGeometry(0.05, 8, 8),
          new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.1 })
        );
        rivet.position.set(
          Math.cos(angle) * 2.5,
          2 + Math.sin(angle) * 1.5,
          -0.35
        );
        group.add(rivet);
      }

      // ========== COMPTOIR / VITRINE ==========
      const counter = new THREE.Mesh(
        new THREE.BoxGeometry(5, 1, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.5, roughness: 0.4 })
      );
      counter.position.set(0, 0.5, 1);
      group.add(counter);

      // Dessus vitré noir
      const counterGlass = new THREE.Mesh(
        new THREE.BoxGeometry(5, 0.05, 1.2),
        new THREE.MeshStandardMaterial({ 
          color: 0x0a0a20, 
          transparent: true, 
          opacity: 0.7,
          metalness: 0.6, 
          roughness: 0.05 
        })
      );
      counterGlass.position.set(0, 1.03, 1);
      group.add(counterGlass);

      // Bordure rouge agressive
      const counterEdge = new THREE.Mesh(
        new THREE.BoxGeometry(5.1, 0.05, 0.03),
        new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x8b0000, emissiveIntensity: 0.5 })
      );
      counterEdge.position.set(0, 1.07, 1.6);
      group.add(counterEdge);

      // ========== 6 ARMES EXPOSÉES SUR LE MUR ==========
      // Chaque arme est représentée par un groupe 3D simple, accroché au mur
      
      const createWeaponDisplay3D = (weaponId) => {
        const wg = new THREE.Group();
        if (weaponId === 'knife') {
          // Lame couteau
          const blade = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.06, 0.015),
            new THREE.MeshStandardMaterial({ color: 0xd0d0d0, metalness: 0.95, roughness: 0.1 })
          );
          wg.add(blade);
          const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 0.2, 8),
            new THREE.MeshStandardMaterial({ color: 0x2a1810, roughness: 0.8 })
          );
          handle.rotation.z = Math.PI / 2;
          handle.position.x = -0.35;
          wg.add(handle);
        } else if (weaponId === 'machete') {
          // Machette plus longue
          const blade = new THREE.Mesh(
            new THREE.BoxGeometry(0.85, 0.12, 0.02),
            new THREE.MeshStandardMaterial({ color: 0xc8c8c8, metalness: 0.9, roughness: 0.15 })
          );
          wg.add(blade);
          const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.06, 0.25, 8),
            new THREE.MeshStandardMaterial({ color: 0x1a0a04, roughness: 0.9 })
          );
          handle.rotation.z = Math.PI / 2;
          handle.position.x = -0.55;
          wg.add(handle);
        } else if (weaponId === 'gun') {
          // Glock stylisé
          const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.55, 0.14, 0.04),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.4 })
          );
          wg.add(body);
          const grip = new THREE.Mesh(
            new THREE.BoxGeometry(0.18, 0.25, 0.06),
            new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.6 })
          );
          grip.position.set(-0.1, -0.18, 0);
          grip.rotation.z = -0.15;
          wg.add(grip);
          const trigger = new THREE.Mesh(
            new THREE.TorusGeometry(0.04, 0.01, 6, 12),
            new THREE.MeshStandardMaterial({ color: 0x333, metalness: 0.7 })
          );
          trigger.position.set(-0.05, -0.08, 0);
          wg.add(trigger);
        } else if (weaponId === 'shotgun') {
          // Fusil long
          const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.035, 0.035, 1, 12),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8 })
          );
          barrel.rotation.z = Math.PI / 2;
          wg.add(barrel);
          const stock = new THREE.Mesh(
            new THREE.BoxGeometry(0.35, 0.15, 0.06),
            new THREE.MeshStandardMaterial({ color: 0x4a2a10, roughness: 0.5 })
          );
          stock.position.set(-0.6, -0.05, 0);
          wg.add(stock);
          const pump = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.1, 0.08),
            new THREE.MeshStandardMaterial({ color: 0x333, roughness: 0.5 })
          );
          pump.position.set(0.1, -0.08, 0);
          wg.add(pump);
        } else if (weaponId === 'bazooka') {
          // Gros tube vert
          const tube = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.15, 1.2, 12),
            new THREE.MeshStandardMaterial({ color: 0x3a4a1a, roughness: 0.7 })
          );
          tube.rotation.z = Math.PI / 2;
          wg.add(tube);
          // Viseur
          const scope = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.15, 0.06),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7 })
          );
          scope.position.set(0.1, 0.2, 0);
          wg.add(scope);
          // Poignée
          const grip = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 0.2, 8),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
          );
          grip.position.set(-0.1, -0.2, 0);
          wg.add(grip);
        } else if (weaponId === 'flamethrower') {
          // Réservoir + canon
          const tank = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.2, 0.5, 12),
            new THREE.MeshStandardMaterial({ color: 0x8a6820, metalness: 0.6, roughness: 0.4 })
          );
          tank.rotation.z = Math.PI / 2;
          tank.position.x = -0.3;
          wg.add(tank);
          const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 0.5, 10),
            new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.7 })
          );
          barrel.rotation.z = Math.PI / 2;
          barrel.position.x = 0.25;
          wg.add(barrel);
          const nozzle = new THREE.Mesh(
            new THREE.ConeGeometry(0.06, 0.12, 8),
            new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 0.6 })
          );
          nozzle.rotation.z = -Math.PI / 2;
          nozzle.position.x = 0.55;
          wg.add(nozzle);
        }
        return wg;
      };

      // Positionner les 6 armes sur le mur (2 lignes de 3)
      const armList = ['knife', 'machete', 'gun', 'shotgun', 'bazooka', 'flamethrower'];
      armList.forEach((id, i) => {
        const weapon = createWeaponDisplay3D(id);
        const col = i % 3;
        const row = Math.floor(i / 3);
        weapon.position.set(-1.8 + col * 1.8, 2.8 - row * 1.4, -0.3);
        group.add(weapon);
        
        // Petit support sous l'arme
        const support = new THREE.Mesh(
          new THREE.BoxGeometry(1.3, 0.05, 0.15),
          new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.7 })
        );
        support.position.set(-1.8 + col * 1.8, 2.55 - row * 1.4, -0.3);
        group.add(support);
        
        // Prix en dessous (texte sur plaque)
        const w = WEAPONS.find(x => x.id === id);
        const priceCanvas = document.createElement('canvas');
        priceCanvas.width = 256; priceCanvas.height = 64;
        const pctx = priceCanvas.getContext('2d');
        pctx.fillStyle = '#000';
        pctx.fillRect(0, 0, 256, 64);
        pctx.strokeStyle = '#ffd700';
        pctx.lineWidth = 3;
        pctx.strokeRect(2, 2, 252, 60);
        pctx.fillStyle = '#ffd700';
        pctx.font = 'bold 20px Georgia';
        pctx.textAlign = 'center';
        pctx.fillText(w ? w.name.split(' ')[0] : '?', 128, 26);
        pctx.font = 'bold 18px Georgia';
        pctx.fillText(w ? `${fmt(w.price)} B` : '', 128, 50);
        const priceTex = new THREE.CanvasTexture(priceCanvas);
        const priceLabel = new THREE.Mesh(
          new THREE.PlaneGeometry(1.2, 0.3),
          new THREE.MeshBasicMaterial({ map: priceTex, transparent: true })
        );
        priceLabel.position.set(-1.8 + col * 1.8, 2.4 - row * 1.4, -0.29);
        group.add(priceLabel);
      });

      // ========== ENSEIGNE ARMURERIE ==========
      const shopCanvas = document.createElement('canvas');
      shopCanvas.width = 1024; shopCanvas.height = 200;
      const sctx = shopCanvas.getContext('2d');
      // Fond noir
      sctx.fillStyle = '#000';
      sctx.fillRect(0, 0, 1024, 200);
      // Bordure rouge
      sctx.strokeStyle = '#ff0000';
      sctx.lineWidth = 8;
      sctx.strokeRect(10, 10, 1004, 180);
      // Texte
      sctx.shadowColor = '#ff0000';
      sctx.shadowBlur = 25;
      sctx.fillStyle = '#ff0000';
      sctx.font = 'bold 90px Georgia, serif';
      sctx.textAlign = 'center';
      sctx.fillText('🏎 BENZ BOUTIQUE', 512, 120);
      sctx.shadowBlur = 0;
      sctx.fillStyle = '#ffd700';
      sctx.font = 'italic 28px Georgia';
      sctx.fillText('« L\'arme qu\'il te faut »', 512, 165);
      const stex = new THREE.CanvasTexture(shopCanvas);
      const shopSign = new THREE.Mesh(
        new THREE.PlaneGeometry(5, 1),
        new THREE.MeshBasicMaterial({ map: stex, transparent: true })
      );
      shopSign.position.set(0, 4.2, -0.2);
      group.add(shopSign);

      // Lumières
      const sLight = new THREE.PointLight(0xff0000, 1.2, 8);
      sLight.position.set(0, 3, 1.5);
      group.add(sLight);
      const sLight2 = new THREE.PointLight(0xffd700, 0.8, 6);
      sLight2.position.set(0, 1.5, 2);
      group.add(sLight2);

      // Zone d'interaction
      const zone = new THREE.Mesh(
        new THREE.SphereGeometry(3, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      zone.userData = { zoneId: 'shop' };
      zone.position.set(0, 1, 2.5);
      group.add(zone);

      scene.add(group);
      return { zone };
    };

    const shopObj = createShop();

    // ========== KIOSQUE BENZBET ==========
    const createBenzBet = () => {
      const group = new THREE.Group();
      group.position.set(13, 0, -14);
      
      // 2 machines BenzBet identiques
      for (let m = 0; m < 2; m++) {
        const machine = new THREE.Group();
        machine.position.set(-1.2 + m * 2.4, 0, 0);
        
        // Corps
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(1, 2.4, 0.8),
          new THREE.MeshStandardMaterial({ color: 0x1a1a2a, metalness: 0.5 })
        );
        body.position.y = 1.2;
        machine.add(body);
        
        // Écran bleu-violet
        const screen = new THREE.Mesh(
          new THREE.PlaneGeometry(0.8, 0.9),
          new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        screen.position.set(0, 1.6, 0.41);
        machine.add(screen);
        
        // Lumière écran
        const screenGlow = new THREE.Mesh(
          new THREE.PlaneGeometry(0.75, 0.85),
          new THREE.MeshBasicMaterial({ color: 0xff00aa })
        );
        screenGlow.position.set(0, 1.6, 0.42);
        machine.add(screenGlow);
        
        // Label BENZBET
        const bbCanvas = document.createElement('canvas');
        bbCanvas.width = 256; bbCanvas.height = 128;
        const bbctx = bbCanvas.getContext('2d');
        bbctx.fillStyle = '#000';
        bbctx.fillRect(0, 0, 256, 128);
        bbctx.fillStyle = '#ff00aa';
        bbctx.font = 'bold 44px Georgia';
        bbctx.textAlign = 'center';
        bbctx.fillText('BENZ', 128, 55);
        bbctx.fillStyle = '#ffd700';
        bbctx.fillText('BET', 128, 100);
        const bbtex = new THREE.CanvasTexture(bbCanvas);
        const bbLabel = new THREE.Mesh(
          new THREE.PlaneGeometry(0.7, 0.4),
          new THREE.MeshBasicMaterial({ map: bbtex, transparent: true })
        );
        bbLabel.position.set(0, 2.2, 0.42);
        machine.add(bbLabel);
        
        // Fente ticket
        const slot = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 0.03, 0.03),
          new THREE.MeshStandardMaterial({ color: 0x000000 })
        );
        slot.position.set(0, 0.6, 0.41);
        machine.add(slot);
        
        // Boutons colorés
        const btnColors = [0xff0000, 0x00ff00, 0xffff00];
        for (let b = 0; b < 3; b++) {
          const btn = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.06, 0.04, 12),
            new THREE.MeshStandardMaterial({ color: btnColors[b], emissive: btnColors[b], emissiveIntensity: 0.5 })
          );
          btn.rotation.x = Math.PI / 2;
          btn.position.set(-0.15 + b * 0.15, 1.05, 0.42);
          machine.add(btn);
        }
        
        group.add(machine);
      }
      
      // Comptoir du bookmaker
      const counter = new THREE.Mesh(
        new THREE.BoxGeometry(4, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0x4a2a4a, roughness: 0.7 })
      );
      counter.position.set(0, 0.5, 2.5);
      group.add(counter);
      
      // Bookmaker 3D
      const bookmaker = createDealer3D({ skin: '#d4a888', hair: '#4a2818', eyes: '#2a1808', beard: false, glasses: true, gender: 'm' });
      bookmaker.position.set(0, 0, 3.3);
      bookmaker.rotation.y = Math.PI;
      group.add(bookmaker);
      
      // Enseigne néon BENZBET géante
      const neonCanvas = document.createElement('canvas');
      neonCanvas.width = 1024; neonCanvas.height = 256;
      const nctx = neonCanvas.getContext('2d');
      nctx.fillStyle = '#000';
      nctx.fillRect(0, 0, 1024, 256);
      nctx.shadowColor = '#ff00aa';
      nctx.shadowBlur = 30;
      nctx.fillStyle = '#ff00aa';
      nctx.font = 'bold 120px Georgia';
      nctx.textAlign = 'center';
      nctx.fillText('BENZ', 360, 160);
      nctx.fillStyle = '#ffd700';
      nctx.fillText('BET', 720, 160);
      nctx.fillStyle = '#fff';
      nctx.font = '30px Georgia';
      nctx.fillText('PARIS SPORTIFS', 512, 220);
      const ntex = new THREE.CanvasTexture(neonCanvas);
      const neonSign = new THREE.Mesh(
        new THREE.PlaneGeometry(5, 1.25),
        new THREE.MeshBasicMaterial({ map: ntex, transparent: true })
      );
      neonSign.position.set(0, 4.2, 0);
      group.add(neonSign);
      
      // Lumières néon
      const nlight1 = new THREE.PointLight(0xff00aa, 1, 6);
      nlight1.position.set(-1, 3, 1);
      group.add(nlight1);
      const nlight2 = new THREE.PointLight(0xffd700, 1, 6);
      nlight2.position.set(1, 3, 1);
      group.add(nlight2);
      
      const zone = new THREE.Mesh(
        new THREE.SphereGeometry(3, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      zone.userData = { zoneId: 'benzbet' };
      zone.position.set(0, 1, 1.5);
      group.add(zone);
      
      scene.add(group);
      return { zone };
    };
    const benzBetObj = createBenzBet();

    // Liste globale des zones d'interaction
    const interactZones = [
      bj.zone, rl.zone, hc.zone, pk.zone,
      barObj.zone, toiletObj.zone, atmObj.zone, wheelObj.zone, shopObj.zone, benzBetObj.zone,
    ];

    // Colonnes décoratives
    [[-10, 10], [10, 10], [-10, -10], [10, -10]].forEach(([x, z]) => {
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.5, 6, 12),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 })
      );
      col.position.set(x, 3, z);
      col.castShadow = true;
      scene.add(col);
      // Cap décoratif
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.4, 0.3, 12),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 })
      );
      cap.position.set(x, 6.1, z);
      scene.add(cap);
    });

    // Bannières du pays sur les murs
    casino.flag.forEach((col, i) => {
      const colInt = parseInt(col.slice(1), 16);
      const banner = new THREE.Mesh(
        new THREE.PlaneGeometry(1.5, 3),
        new THREE.MeshStandardMaterial({ color: colInt, side: THREE.DoubleSide })
      );
      banner.position.set(-19.9, 3, -10 + i * 3);
      banner.rotation.y = Math.PI / 2;
      scene.add(banner);
      const banner2 = banner.clone();
      banner2.position.set(19.9, 3, -10 + i * 3);
      banner2.rotation.y = -Math.PI / 2;
      scene.add(banner2);
    });

    // ========== CONTRÔLES ==========
    const direction = new THREE.Vector3();
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    const SPEED = 0.11;
    const getSpeedMul = () => {
      const v = profile && profile.equippedVehicle;
      const def = VEHICLES.find(x => x.id === v);
      return def ? def.speedMul : 1;
    };
    const ROOM_HALF = 18;
    let isPointerLocked = false;

    const onKeyDown = (e) => {
      switch (e.code) {
        case 'ArrowUp': case 'KeyW': case 'KeyZ': keysRef.current.forward = true; break;
        case 'ArrowDown': case 'KeyS': keysRef.current.backward = true; break;
        case 'ArrowLeft': case 'KeyA': case 'KeyQ': keysRef.current.left = true; break;
        case 'ArrowRight': case 'KeyD': keysRef.current.right = true; break;
        case 'KeyE': case 'Space':
          if (nearZoneRef.current && zoneCallbacksRef.current[nearZoneRef.current]) {
            zoneCallbacksRef.current[nearZoneRef.current]();
          }
          break;
        case 'Escape':
          if (document.pointerLockElement) document.exitPointerLock();
          break;
      }
    };
    const onKeyUp = (e) => {
      switch (e.code) {
        case 'ArrowUp': case 'KeyW': case 'KeyZ': keysRef.current.forward = false; break;
        case 'ArrowDown': case 'KeyS': keysRef.current.backward = false; break;
        case 'ArrowLeft': case 'KeyA': case 'KeyQ': keysRef.current.left = false; break;
        case 'ArrowRight': case 'KeyD': keysRef.current.right = false; break;
      }
    };
    const onMouseMove = (e) => {
      if (!isPointerLocked) return;
      euler.setFromQuaternion(camera.quaternion);
      euler.y -= (e.movementX || 0) * 0.002;
      euler.x -= (e.movementY || 0) * 0.002;
      euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));
      camera.quaternion.setFromEuler(euler);
    };
    const onClick = (e) => {
      // Ne pas lock si on clique sur un bouton HUD
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
      if (!isPointerLocked) renderer.domElement.requestPointerLock();
    };
    const onPointerLockChange = () => {
      isPointerLocked = document.pointerLockElement === renderer.domElement;
      if (isPointerLocked) setShowInstructions(false);
    };

    // Contrôles tactiles : glisser au doigt pour tourner la tête
    let touchLookId = null;
    let lastTouchX = 0, lastTouchY = 0;
    const onTouchStart = (e) => {
      setShowInstructions(false);
      // Ignorer si on touche un bouton
      if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.closest('.hud-control')) return;
      for (const t of e.changedTouches) {
        if (touchLookId === null) {
          touchLookId = t.identifier;
          lastTouchX = t.clientX;
          lastTouchY = t.clientY;
        }
      }
    };
    const onTouchMove = (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.closest('.hud-control')) return;
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === touchLookId) {
          const dx = t.clientX - lastTouchX;
          const dy = t.clientY - lastTouchY;
          lastTouchX = t.clientX;
          lastTouchY = t.clientY;
          euler.setFromQuaternion(camera.quaternion);
          euler.y -= dx * 0.005;
          euler.x -= dy * 0.005;
          euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));
          camera.quaternion.setFromEuler(euler);
        }
      }
    };
    const onTouchEnd = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === touchLookId) touchLookId = null;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onClick);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false });
    renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
    renderer.domElement.addEventListener('touchend', onTouchEnd);

    // LOOP
    let animFrameId;
    let wheelRot = 0;
    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const k = keysRef.current;
      direction.z = Number(k.forward) - Number(k.backward);
      direction.x = Number(k.right) - Number(k.left);
      direction.normalize();

      if (direction.z !== 0 || direction.x !== 0) {
        const cameraDir = new THREE.Vector3();
        camera.getWorldDirection(cameraDir);
        cameraDir.y = 0;
        cameraDir.normalize();
        const right = new THREE.Vector3();
        right.crossVectors(camera.up, cameraDir).normalize();
        const movement = new THREE.Vector3();
        const speedMul = getSpeedMul();
        movement.add(cameraDir.multiplyScalar(direction.z * SPEED * speedMul));
        movement.add(right.multiplyScalar(-direction.x * SPEED * speedMul));
        camera.position.add(movement);
        camera.position.x = Math.max(-ROOM_HALF, Math.min(ROOM_HALF, camera.position.x));
        camera.position.z = Math.max(-ROOM_HALF, Math.min(ROOM_HALF, camera.position.z));
        camera.position.y = 1.7;
      }

      if (rl.wheel) rl.wheel.rotation.y += 0.008;
      if (wheelObj.wheelDisc) wheelObj.wheelDisc.rotation.z += 0.003;
      wheelRot += 0.02;

      // Animation balles en vol
      const nowTime = Date.now();
      
      // Animer les TVs (moins souvent pour perf)
      if (nowTime % 100 < 17) {
        tvTexturesRef.forEach(tv => drawTVFrame(tv, nowTime));
      }
      
      // Animer les PNJ
      npcs.forEach((npcData, i) => {
        const { mesh, path, phase } = npcData;
        // Skip si mort : laisse la position actuelle
        if (mesh.userData.dead) return;
        const t = (Math.sin(nowTime * path.speed * 0.001 + phase) + 1) / 2;
        mesh.position.x = path.x0 + (path.x1 - path.x0) * t;
        mesh.position.z = path.z0 + (path.z1 - path.z0) * t;
        // Direction de marche
        const dx = path.x1 - path.x0;
        const dz = path.z1 - path.z0;
        const dir = Math.cos(nowTime * path.speed * 0.001 + phase);
        mesh.rotation.y = Math.atan2(dir > 0 ? dx : -dx, dir > 0 ? dz : -dz);
        // Petit bop de marche
        mesh.position.y = Math.abs(Math.sin(nowTime * 0.008 + i)) * 0.05;
      });
      
      bulletsRef.current = bulletsRef.current.filter(b => {
        const elapsed = nowTime - b.startTime;
        const t = Math.min(elapsed / b.duration, 1);
        b.mesh.position.lerpVectors(b.startPos, b.endPos, t);
        if (t >= 1) {
          scene.remove(b.mesh);
          return false;
        }
        return true;
      });

      // Animation flammes (lance-flammes)
      flamesRef.current.forEach(f => {
        const elapsed = nowTime - f.startTime;
        // Récupérer la position actuelle de la caméra (suit le joueur)
        const camPos = new THREE.Vector3();
        f.camera.getWorldPosition(camPos);
        const camDir = new THREE.Vector3();
        f.camera.getWorldDirection(camDir);
        const right = new THREE.Vector3().crossVectors(camDir, f.camera.up).normalize();
        const muzzlePos = camPos.clone()
          .add(camDir.clone().multiplyScalar(0.6))
          .add(right.clone().multiplyScalar(0.25))
          .add(new THREE.Vector3(0, -0.25, 0));
        
        f.particles.forEach(p => {
          const localElapsed = elapsed - p.startDelay;
          if (localElapsed < 0) {
            p.mesh.visible = false;
            return;
          }
          if (localElapsed > p.life || elapsed > f.duration + 500) {
            p.mesh.visible = false;
            return;
          }
          p.mesh.visible = true;
          // Position : va dans la direction de la caméra, de 0 à 3m
          const progress = localElapsed / p.life;
          const distance = progress * 3;
          const pos = muzzlePos.clone()
            .add(camDir.clone().multiplyScalar(distance))
            .add(right.clone().multiplyScalar(p.offsetX))
            .add(new THREE.Vector3(0, p.offsetY, 0));
          p.mesh.position.copy(pos);
          // Grossir puis rétrécir
          const scale = 1 + progress * 2;
          p.mesh.scale.set(scale, scale, scale);
          // Fade
          p.mesh.material.opacity = 0.9 * (1 - progress);
        });
      });

      // Animation sang (gravité)
      bloodRef.current.forEach(b => {
        const elapsed = nowTime - b.startTime;
        const dt = 0.016;
        b.drops.forEach(d => {
          if (!d.landed) {
            d.mesh.position.x += d.vx * dt;
            d.mesh.position.y += d.vy * dt;
            d.mesh.position.z += d.vz * dt;
            d.vy -= 9.8 * dt; // gravité
            if (d.mesh.position.y < -1.6) {
              d.mesh.position.y = -1.6;
              d.vx *= 0.3;
              d.vz *= 0.3;
              d.vy = 0;
              d.landed = true;
              d.mesh.scale.y = 0.2; // aplatir au sol
            }
          }
        });
      });

      // FOV dynamique pour visée 1ère personne
      const targetFov = isAimingRef.current ? 40 : 75;
      if (Math.abs(camera.fov - targetFov) > 0.5) {
        camera.fov += (targetFov - camera.fov) * 0.2;
        camera.updateProjectionMatrix();
      }

      // Proximité zones
      let closest = null;
      let closestDist = 3;
      interactZones.forEach((zone) => {
        const worldPos = new THREE.Vector3();
        zone.getWorldPosition(worldPos);
        const dist = camera.position.distanceTo(worldPos);
        if (dist < closestDist) {
          closestDist = dist;
          closest = zone.userData.zoneId;
        }
      });
      if (closest !== nearZoneRef.current) {
        nearZoneRef.current = closest;
        setNearZone(closest);
      }

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      width = mount.clientWidth;
      height = mount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      window.removeEventListener('resize', onResize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const zoneLabels = {
    blackjack: { icon: '🃏', name: 'BLACKJACK' },
    roulette: { icon: '🎡', name: 'ROULETTE' },
    highcard: { icon: '🎴', name: 'CARTE HAUTE' },
    poker: { icon: '♠', name: 'POKER HOLDEM' },
    bar: { icon: '🍸', name: 'BAR' },
    toilet: { icon: '🚻', name: 'TOILETTES' },
    atm: { icon: '🏧', name: 'DISTRIBUTEUR' },
    wheel: { icon: '🎡', name: 'ROUE FORTUNE' },
    shop: { icon: '🏎', name: 'BENZ BOUTIQUE' },
    benzbet: { icon: '🎟️', name: 'BENZBET' },
  };

  // Gestion tactile des flèches (hold-to-move)
  const setKey = (key, value) => {
    keysRef.current[key] = value;
  };

  // Refs pour le tir
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const allDealersRef = useRef([]);
  const allNpcsRef = useRef([]); // PNJ tuables
  const bulletsRef = useRef([]); // balles en vol
  const casingsRef = useRef([]); // douilles au sol
  const bloodRef = useRef([]); // particules de sang
  const flamesRef = useRef([]); // particules de flammes
  const [slashActive, setSlashActive] = useState(false); // animation slash armes blanches
  const [isAiming, setIsAiming] = useState(false); // visée 1ère personne
  const isAimingRef = useRef(false);
  useEffect(() => { isAimingRef.current = isAiming; }, [isAiming]);

  // Créer une balle qui vole de l'arme vers l'impact
  const createBullet = (fromPos, toPos, weaponType) => {
    const scene = sceneRef.current;
    if (!scene) return;
    
    // Taille de la balle selon le type d'arme
    let bulletGeom, bulletMat;
    if (weaponType === 'rocket') {
      bulletGeom = new THREE.ConeGeometry(0.1, 0.4, 8);
      bulletMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
    } else if (weaponType === 'flame') {
      bulletGeom = new THREE.SphereGeometry(0.15, 8, 8);
      bulletMat = new THREE.MeshBasicMaterial({ color: 0xff4400 });
    } else {
      bulletGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.08, 6);
      bulletMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    }
    const bullet = new THREE.Mesh(bulletGeom, bulletMat);
    bullet.position.copy(fromPos);
    
    // Trainée de lumière pour balle
    if (weaponType !== 'flame' && weaponType !== 'rocket') {
      const trail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6),
        new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.6 })
      );
      bullet.add(trail);
    }
    
    scene.add(bullet);
    
    const startTime = Date.now();
    const duration = weaponType === 'rocket' ? 300 : weaponType === 'flame' ? 200 : 150;
    const startPos = fromPos.clone();
    const endPos = toPos.clone();
    
    // Orienter la balle vers la cible
    bullet.lookAt(endPos);
    bullet.rotateX(Math.PI / 2);
    
    bulletsRef.current.push({ mesh: bullet, startTime, duration, startPos, endPos, weaponType });
  };
  
  // Créer une douille qui reste 20s
  const createCasing = (pos, weaponType) => {
    if (weaponType === 'rocket' || weaponType === 'flame' || weaponType === 'melee') return;
    const scene = sceneRef.current;
    if (!scene) return;
    
    const casingGroup = new THREE.Group();
    // Cylindre doré (douille)
    const casing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.05, 6),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.3 })
    );
    casingGroup.add(casing);
    
    casingGroup.position.copy(pos);
    casingGroup.position.y = 0.02; // au sol
    casingGroup.rotation.z = Math.PI / 2; // couché
    casingGroup.rotation.y = Math.random() * Math.PI * 2;
    
    scene.add(casingGroup);
    
    const createdAt = Date.now();
    casingsRef.current.push({ mesh: casingGroup, createdAt, scene });
    
    // Retirer après 20s
    setTimeout(() => {
      scene.remove(casingGroup);
      casingsRef.current = casingsRef.current.filter(c => c.mesh !== casingGroup);
    }, 20000);
  };
  
  // Créer particules de sang qui giclent
  const createBloodSplash = (pos) => {
    const scene = sceneRef.current;
    if (!scene) return;
    
    const bloodGroup = new THREE.Group();
    bloodGroup.position.copy(pos);
    scene.add(bloodGroup);
    
    // 15 gouttes de sang
    const drops = [];
    for (let i = 0; i < 15; i++) {
      const drop = new THREE.Mesh(
        new THREE.SphereGeometry(0.04 + Math.random() * 0.05, 6, 6),
        new THREE.MeshStandardMaterial({ 
          color: 0x8b0000, 
          emissive: 0x4a0000,
          emissiveIntensity: 0.3,
        })
      );
      // Vélocité aléatoire pour gicler
      const vx = (Math.random() - 0.5) * 4;
      const vy = 2 + Math.random() * 3;
      const vz = (Math.random() - 0.5) * 4;
      bloodGroup.add(drop);
      drops.push({ mesh: drop, vx, vy, vz, landed: false });
    }
    
    const startTime = Date.now();
    bloodRef.current.push({ group: bloodGroup, drops, startTime, duration: 1500 });
    
    // Retirer après 5s
    setTimeout(() => {
      scene.remove(bloodGroup);
      bloodRef.current = bloodRef.current.filter(b => b.group !== bloodGroup);
    }, 5000);
  };

  // Tir avec effets visuels complets
  const doShoot = () => {
    if (!selectedWeapon) return;
    // Do not block on `shooting` state while in auto-fire mode
    onShoot && onShoot();
    
    const camera = cameraRef.current;
    const dealers = allDealersRef.current;
    const npcs = allNpcsRef.current || [];
    const targets = [...dealers, ...npcs]; // tout ce qui est tuable
    
    if (!camera) { return; }
    
    const weaponDef = WEAPONS.find(w => w.id === selectedWeapon);
    const weaponType = weaponDef?.type || 'gun';
    
    const cameraPos = new THREE.Vector3();
    camera.getWorldPosition(cameraPos);
    const cameraDir = new THREE.Vector3();
    camera.getWorldDirection(cameraDir);
    
    // ====== ARMES BLANCHES (couteau, machette) ======
    if (weaponType === 'melee') {
      setSlashActive(true);
      setTimeout(() => setSlashActive(false), 1000);
      
      // Trouver cible proche (3m)
      let hitTarget = null;
      let bestDist = 3;
      for (const t of targets) {
        if (t.userData.dead) continue;
        const tp = new THREE.Vector3();
        t.getWorldPosition(tp);
        const distance = cameraPos.distanceTo(tp);
        if (distance > bestDist) continue;
        const toT = new THREE.Vector3().subVectors(tp, cameraPos).normalize();
        const dot = cameraDir.dot(toT);
        if (dot > 0.4) {
          hitTarget = t;
          bestDist = distance;
        }
      }
      
      if (hitTarget) {
        setTimeout(() => {
          const bp = new THREE.Vector3();
          hitTarget.getWorldPosition(bp);
          bp.y += 1.6;
          createBloodSplash(bp);
          if (!hitTarget.userData.dead) killTarget(hitTarget);
        }, 400);
      }
      
      setTimeout(() => setSlashActive(false), 700);
      return;
    }
    
    // ====== LANCE-FLAMMES ======
    if (weaponType === 'flame') {
      // Créer des flammes qui jaillissent pendant 2s
      createFlameStream(cameraPos, cameraDir, camera);
      
      // Touche tous les ennemis dans un cône de 3m
      targets.forEach(t => {
        if (t.userData.dead) return;
        const tp = new THREE.Vector3();
        t.getWorldPosition(tp);
        const distance = cameraPos.distanceTo(tp);
        if (distance > 3.5) return;
        const toT = new THREE.Vector3().subVectors(tp, cameraPos).normalize();
        const dot = cameraDir.dot(toT);
        if (dot > 0.5) { // cône large
          setTimeout(() => {
            const bp = new THREE.Vector3();
            t.getWorldPosition(bp);
            bp.y += 1.6;
            createBloodSplash(bp);
            if (!t.userData.dead) killTarget(t);
          }, 500);
        }
      });
      
      // flame duration handled by flameStream lifecycle
      return;
    }
    
    // ====== ARMES À FEU (pistolet, fusil, bazooka) ======
    const right = new THREE.Vector3().crossVectors(cameraDir, camera.up).normalize();
    const gunPos = cameraPos.clone()
      .add(cameraDir.clone().multiplyScalar(0.5))
      .add(right.clone().multiplyScalar(0.3))
      .add(new THREE.Vector3(0, -0.3, 0));
    
    let targetPos = null;
    let hitTarget = null;
    
    for (const t of targets) {
      if (t.userData.dead) continue;
      const tp = new THREE.Vector3();
      t.getWorldPosition(tp);
      
      const distance = cameraPos.distanceTo(tp);
      if (distance > 25) continue;
      
      const toT = new THREE.Vector3().subVectors(tp, cameraPos).normalize();
      const dot = cameraDir.dot(toT);
      const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
      
      const toleranceBase = isAiming ? 0.08 : 0.2;
      const tolerance = Math.max(toleranceBase, 1.0 / distance);
      if (angle < tolerance) {
        targetPos = tp.clone();
        targetPos.y += 1.7;
        hitTarget = t;
        break;
      }
    }
    
    if (!targetPos) {
      targetPos = cameraPos.clone().add(cameraDir.clone().multiplyScalar(15));
    }
    
    createBullet(gunPos, targetPos, weaponType);
    
    // Éjecter douille
    setTimeout(() => {
      const casingPos = cameraPos.clone()
        .add(right.clone().multiplyScalar(0.5));
      casingPos.y = 0.05;
      createCasing(casingPos, weaponType);
    }, 100);
    
    if (hitTarget) {
      const flightTime = weaponType === 'rocket' ? 300 : 150;
      setTimeout(() => {
        if (!hitTarget.userData.dead) {
          const bloodPos = new THREE.Vector3();
          hitTarget.getWorldPosition(bloodPos);
          bloodPos.y += 1.6;
          createBloodSplash(bloodPos);
          killTarget(hitTarget);
        }
      }, flightTime);
    }
    
    // shooting state controlled by fire button press/release
  };
  
  // Créer un flux de flammes devant le joueur (lance-flammes)
  const createFlameStream = (origin, direction, camera) => {
    const scene = sceneRef.current;
    if (!scene) return;
    
    const flameGroup = new THREE.Group();
    const flameCount = 30;
    const startTime = Date.now();
    const duration = 2000;
    
    const particles = [];
    for (let i = 0; i < flameCount; i++) {
      const flame = new THREE.Mesh(
        new THREE.SphereGeometry(0.12 + Math.random() * 0.1, 8, 8),
        new THREE.MeshBasicMaterial({ 
          color: Math.random() < 0.5 ? 0xff4400 : 0xffaa00,
          transparent: true,
          opacity: 0.8,
        })
      );
      flameGroup.add(flame);
      particles.push({
        mesh: flame,
        startDelay: (i / flameCount) * 500,
        offsetX: (Math.random() - 0.5) * 0.3,
        offsetY: (Math.random() - 0.5) * 0.3,
        life: 800 + Math.random() * 400,
      });
    }
    
    scene.add(flameGroup);
    flamesRef.current.push({
      group: flameGroup,
      particles,
      startTime,
      duration,
      origin: origin.clone(),
      direction: direction.clone(),
      camera,
    });
    
    // Retirer après durée + life max
    setTimeout(() => {
      scene.remove(flameGroup);
      flamesRef.current = flamesRef.current.filter(f => f.group !== flameGroup);
    }, duration + 1500);
  };
  
  const killTarget = (target) => {
    target.userData.dead = true;
    const originalRotation = target.rotation.z;
    const originalPosY = target.position.y;
    
    const startTime = Date.now();
    const fallDuration = 600;
    const fallAnim = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / fallDuration, 1);
      const eased = 1 - Math.pow(1 - t, 2);
      target.rotation.z = originalRotation + (Math.PI / 2) * eased;
      target.position.y = originalPosY - 0.8 * eased;
      if (t < 1) requestAnimationFrame(fallAnim);
    };
    fallAnim();
    
    setTimeout(() => {
      const respawnStart = Date.now();
      const respawnDuration = 500;
      const respawnAnim = () => {
        const elapsed = Date.now() - respawnStart;
        const t = Math.min(elapsed / respawnDuration, 1);
        target.rotation.z = originalRotation + (Math.PI / 2) * (1 - t);
        target.position.y = originalPosY - 0.8 * (1 - t);
        if (t < 1) requestAnimationFrame(respawnAnim);
        else {
          target.rotation.z = originalRotation;
          target.position.y = originalPosY;
          target.userData.dead = false;
        }
      };
      respawnAnim();
    }, 10000);
  };


  const nextTrophy = TROPHIES.find(t => t.threshold > profile.totalWinnings);
  const earned = TROPHIES.filter(t => profile.totalWinnings >= t.threshold);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#000', touchAction: 'none' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* HUD Haut */}
      <div className="hud-control" style={{
        position: 'absolute', top: 10, left: 10, right: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        pointerEvents: 'none', fontFamily: 'Georgia, serif', zIndex: 10,
      }}>
        <div style={{
          background: 'rgba(0,0,0,0.75)',
          border: `1px solid ${casino.primary}`,
          borderRadius: 8, padding: 8,
          color: '#fff', pointerEvents: 'auto', fontSize: 12,
        }}>
          <div style={{ color: '#cca366', fontSize: 10 }}>{profile.name} • {casino.country}</div>
          <div style={{ fontSize: 18, color: '#ffd700', fontWeight: 'bold' }}>{fmt(balance)} B</div>
        </div>
        <button onClick={() => setShowMenu(true)}
          style={{
            background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
            border: `1px solid ${casino.secondary}`,
            color: '#fff', borderRadius: 8, padding: '8px 14px',
            cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold',
            pointerEvents: 'auto', fontSize: 13,
          }}>☰ MENU</button>
      </div>

      {/* CONTRÔLES MOBILE/HUD - Flèches en bas à gauche */}
      <div className="hud-control" style={{
        position: 'absolute', bottom: 20, left: 20,
        display: 'grid',
        gridTemplateColumns: '50px 50px 50px',
        gridTemplateRows: '50px 50px 50px',
        gap: 4, zIndex: 20, pointerEvents: 'auto',
      }}>
        <div />
        <ArrowButton dir="↑" onPress={(v) => setKey('forward', v)} />
        <div />
        <ArrowButton dir="←" onPress={(v) => setKey('left', v)} />
        <div />
        <ArrowButton dir="→" onPress={(v) => setKey('right', v)} />
        <div />
        <ArrowButton dir="↓" onPress={(v) => setKey('backward', v)} />
        <div />
      </div>

      {/* BOUTONS ACTION - Inventaire + Tir */}
      <div className="hud-control" style={{
        position: 'absolute', bottom: 20, right: 20,
        display: 'flex', flexDirection: 'column', gap: 10,
        zIndex: 20, pointerEvents: 'auto',
      }}>
        {/* Bouton basculer vue 1ère / 3ème personne (au-dessus de l'inventaire) */}
        <button
          onClick={() => setViewMode(v => v === 'first' ? 'third' : 'first')}
          data-testid="view-toggle-btn"
          style={{
            width: 60, height: 44, borderRadius: 22,
            background: 'rgba(0,0,0,0.75)',
            border: `2px solid ${casino.secondary}`,
            color: casino.secondary,
            fontSize: 11, fontWeight: 'bold', cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
          }}>
          {viewMode === 'first' ? '👁️ 1P' : '🧍 3P'}
        </button>
        <button onClick={() => setShowInventory(true)} style={{
          width: 60, height: 60, borderRadius: '50%',
          background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
          border: `2px solid ${casino.secondary}`,
          color: '#fff', fontSize: 28, cursor: 'pointer',
          boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
        }}>🎒</button>
        {selectedWeapon && (
          <button onClick={() => setIsAiming(a => !a)} style={{
            width: 60, height: 60, borderRadius: '50%',
            background: isAiming 
              ? 'radial-gradient(circle, #ffd700, #8b6914)'
              : 'rgba(0,0,0,0.7)',
            border: `2px solid ${isAiming ? '#fff' : '#ffd700'}`,
            color: isAiming ? '#000' : '#ffd700',
            fontSize: 11, fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: isAiming ? '0 0 20px #ffd700' : '0 4px 10px rgba(0,0,0,0.6)',
          }}>
            <div style={{ fontSize: 22 }}>🎯</div>
            <div style={{ fontSize: 8 }}>{isAiming ? 'VISE' : 'VISER'}</div>
          </button>
        )}
        <button
          data-testid="lobby-fire-btn"
          onPointerDown={(e) => {
            e.preventDefault();
            if (!selectedWeapon) return;
            firingRef.current = true;
            setShooting(true);
            // Auto-fire loop
            const weaponDef = WEAPONS.find(w => w.id === selectedWeapon);
            const rpm = weaponDef?.type === 'gun' ? (selectedWeapon === 'shotgun' ? 90 : 300)
                      : weaponDef?.type === 'rocket' ? 40
                      : weaponDef?.type === 'flame' ? 600
                      : 180;
            const interval = Math.max(60, Math.floor(60000 / rpm));
            const fireOnce = () => {
              if (!firingRef.current) return;
              doShoot();
              // Spawn a visible bullet overlay (only while firing)
              const id = Date.now() + Math.random();
              setMuzzleKey(k => k + 1);
              setVisibleBullets(bs => [...bs, { id, startTime: Date.now() }]);
              setTimeout(() => setVisibleBullets(bs => bs.filter(b => b.id !== id)), 500);
            };
            fireOnce();
            const t = setInterval(fireOnce, interval);
            // Store interval on ref so we can clear
            firingRef.currentInterval = t;
          }}
          onPointerUp={() => {
            firingRef.current = false;
            if (firingRef.currentInterval) clearInterval(firingRef.currentInterval);
            firingRef.currentInterval = null;
            setShooting(false);
          }}
          onPointerLeave={() => {
            firingRef.current = false;
            if (firingRef.currentInterval) clearInterval(firingRef.currentInterval);
            firingRef.currentInterval = null;
            setShooting(false);
          }}
          onPointerCancel={() => {
            firingRef.current = false;
            if (firingRef.currentInterval) clearInterval(firingRef.currentInterval);
            firingRef.currentInterval = null;
            setShooting(false);
          }}
          disabled={!selectedWeapon}
          style={{
            width: 70, height: 70, borderRadius: '50%',
            background: selectedWeapon
              ? `radial-gradient(circle, #ff4444, #8b0000)`
              : '#555',
            border: '3px solid #ffd700',
            color: '#fff', fontSize: 14, fontWeight: 'bold',
            cursor: selectedWeapon ? 'pointer' : 'not-allowed',
            boxShadow: shooting ? '0 0 30px #ff8800' : (selectedWeapon ? '0 0 20px #ff4444' : 'none'),
            opacity: selectedWeapon ? 1 : 0.5,
            animation: shooting ? 'shootRecoil 0.12s infinite' : 'none',
            touchAction: 'none', userSelect: 'none',
          }}>
          <div style={{ fontSize: 22 }}>💥</div>
          <div style={{ fontSize: 9 }}>TIRER</div>
        </button>
        {selectedWeapon && (
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            border: `1px solid ${casino.secondary}`,
            borderRadius: 6, padding: 6,
            textAlign: 'center', fontSize: 10, color: '#fff',
            fontFamily: 'Georgia, serif',
          }}>
            <WeaponIcon id={selectedWeapon} size={32} />
            <div>{WEAPONS.find(w => w.id === selectedWeapon)?.name.split(' ')[0]}</div>
          </div>
        )}
      </div>

      {/* Réticule de visée au centre */}
      {selectedWeapon && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          pointerEvents: 'none', zIndex: 10,
        }}>
          <div style={{
            width: isAiming ? 40 : 20,
            height: isAiming ? 40 : 20,
            border: `2px solid ${isAiming ? '#ff4444' : 'rgba(255,255,255,0.6)'}`,
            borderRadius: '50%',
            transition: 'all 0.3s',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              width: isAiming ? 4 : 3, height: isAiming ? 4 : 3,
              background: isAiming ? '#ff4444' : '#fff',
              borderRadius: '50%',
              transform: 'translate(-50%,-50%)',
            }} />
            {isAiming && (
              <>
                <div style={{
                  position: 'absolute', top: -10, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 1, height: 8, background: '#ff4444',
                }} />
                <div style={{
                  position: 'absolute', bottom: -10, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 1, height: 8, background: '#ff4444',
                }} />
                <div style={{
                  position: 'absolute', top: '50%', left: -10,
                  transform: 'translateY(-50%)',
                  width: 8, height: 1, background: '#ff4444',
                }} />
                <div style={{
                  position: 'absolute', top: '50%', right: -10,
                  transform: 'translateY(-50%)',
                  width: 8, height: 1, background: '#ff4444',
                }} />
              </>
            )}
          </div>
        </div>
      )}

      {/* Overlay vignette quand on vise (effet de lunette) */}
      {isAiming && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)',
          pointerEvents: 'none', zIndex: 9,
        }} />
      )}

      {/* ====== ARME EN MAIN (1ère personne) ====== */}
      {selectedWeapon && viewMode === 'first' && (
        <div style={{
          position: 'absolute', right: '12%', bottom: -20,
          width: 360, pointerEvents: 'none', zIndex: 11,
          filter: 'drop-shadow(0 10px 20px rgba(0,0,0,.6))',
          animation: shooting ? 'recoilAnim 0.12s infinite' : 'none',
        }}>
          <FPWeaponView id={selectedWeapon} />
        </div>
      )}

      {/* ====== VÉHICULE SOUS LES PIEDS (1ère personne) ====== */}
      {profile && profile.equippedVehicle && viewMode === 'first' && (
        <div style={{
          position: 'absolute', left: '50%', bottom: -40,
          transform: 'translateX(-50%)',
          width: 260, pointerEvents: 'none', zIndex: 11,
          filter: 'drop-shadow(0 6px 14px rgba(0,0,0,.7))',
          opacity: 0.95,
        }}>
          <VehicleGraphic id={profile.equippedVehicle} />
        </div>
      )}

      {/* ====== PERSONNAGE (3ème personne) ====== */}
      {viewMode === 'third' && (
        <div style={{
          position: 'absolute', left: '50%', bottom: 80,
          transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 11,
        }}>
          <TPPlayerView
            profile={profile}
            selectedWeapon={selectedWeapon}
            firing={shooting}
          />
        </div>
      )}

      {/* ====== BALLES VISIBLES (uniquement pendant le tir) ====== */}
      {visibleBullets.map(b => (
        <div key={b.id} style={{
          position: 'absolute',
          right: '20%',     // start position near weapon muzzle
          bottom: '25%',
          width: 8, height: 18,
          background: 'linear-gradient(180deg, #fffbe5, #ffae00)',
          borderRadius: 4,
          boxShadow: '0 0 12px #ffcd3c, 0 0 24px #ffae00',
          zIndex: 12, pointerEvents: 'none',
          animation: 'bulletFlyOverlay 0.5s linear forwards',
        }} />
      ))}

      {/* ====== MUZZLE FLASH ====== */}
      {shooting && selectedWeapon && viewMode === 'first' && (
        <div key={muzzleKey} style={{
          position: 'absolute',
          right: '22%', bottom: '28%',
          width: 100, height: 100,
          background: 'radial-gradient(circle, #fff8c0 0%, #ffb636 35%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none', zIndex: 13,
          mixBlendMode: 'screen',
          animation: 'muzzleFlashAnim 0.1s ease-out',
        }} />
      )}

      {/* Animation SLASH pour couteau/machette (trait blanc de G à D) */}
      {slashActive && (
        <div style={{
          position: 'absolute', inset: 0,
          pointerEvents: 'none', zIndex: 16,
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: '30%', left: '-20%',
            width: '140%', height: '40%',
            background: 'linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.95) 45%, rgba(255,255,255,0.95) 55%, transparent 80%)',
            transform: 'skewY(-8deg)',
            animation: 'slashAnim 1s ease-out forwards',
            filter: 'blur(2px)',
          }} />
          {/* Trait net au-dessus */}
          <div style={{
            position: 'absolute',
            top: '45%', left: '-10%',
            width: '120%', height: 4,
            background: 'linear-gradient(90deg, transparent 15%, rgba(255,255,255,1) 50%, transparent 85%)',
            transform: 'rotate(-8deg)',
            animation: 'slashAnim 1s ease-out forwards',
            boxShadow: '0 0 20px rgba(255,255,255,0.9)',
          }} />
        </div>
      )}

      {/* Flash de tir */}
      {shooting && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 85% 80%, rgba(255,200,0,0.4), transparent 40%)',
          pointerEvents: 'none', zIndex: 15,
          animation: 'muzzleFlash 0.3s ease-out',
        }} />
      )}

      {/* Indicateur proximité */}
      {nearZone && zoneLabels[nearZone] && (
        <div className="hud-control" style={{
          position: 'absolute', top: '40%', left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.85)',
          border: `2px solid ${casino.secondary}`,
          borderRadius: 12, padding: '10px 20px',
          color: '#fff', fontFamily: 'Georgia, serif',
          textAlign: 'center', zIndex: 20,
          animation: 'pulseGlow 1.5s ease-in-out infinite',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ fontSize: 16, color: casino.secondary, marginBottom: 4 }}>
            {zoneLabels[nearZone].icon} {zoneLabels[nearZone].name}
          </div>
          <button onClick={() => zoneCallbacksRef.current[nearZone] && zoneCallbacksRef.current[nearZone]()}
            style={{
              padding: '8px 18px',
              background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
              border: 'none', borderRadius: 6, color: '#fff',
              fontFamily: 'inherit', cursor: 'pointer', fontWeight: 'bold',
              fontSize: 14,
            }}>ENTRER</button>
        </div>
      )}

      {/* Instructions démarrage */}
      {showInstructions && (
        <div className="hud-control" style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          background: 'rgba(0,0,0,0.92)',
          border: `2px solid ${casino.secondary}`,
          borderRadius: 12, padding: 20,
          color: '#fff', fontFamily: 'Georgia, serif',
          textAlign: 'center', maxWidth: 360, zIndex: 30,
        }}>
          <div style={{ fontSize: 20, color: casino.secondary, marginBottom: 10, letterSpacing: 2 }}>
            BIENVENUE
          </div>
          <div style={{ fontSize: 13, color: '#cca366', marginBottom: 12, fontStyle: 'italic' }}>
            {casino.name} • {casino.tagline}
          </div>
          <div style={{ textAlign: 'left', fontSize: 13, lineHeight: 1.6 }}>
            <div>📱 <strong>Mobile :</strong></div>
            <div>• Flèches en bas à gauche = déplacement</div>
            <div>• Glisser au doigt = tourner la tête</div>
            <div>• 🎒 = inventaire armes</div>
            <div>• 🎯 = tirer avec l'arme sélectionnée</div>
            <br/>
            <div>💻 <strong>PC :</strong></div>
            <div>• ZQSD/WASD/Flèches = déplacement</div>
            <div>• Clic pour verrouiller la souris</div>
            <div>• E ou Espace = interagir</div>
          </div>
          <button onClick={() => setShowInstructions(false)}
            style={{
              marginTop: 16, padding: '10px 28px',
              background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
              border: 'none', borderRadius: 8, color: '#fff',
              fontFamily: 'inherit', fontSize: 15, fontWeight: 'bold',
              cursor: 'pointer', letterSpacing: 2,
            }}>ENTRER</button>
        </div>
      )}

      {/* INVENTAIRE */}
      {showInventory && (
        <div className="hud-control" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
          zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, fontFamily: 'Georgia, serif',
        }}>
          <div style={{
            background: `linear-gradient(145deg, #1a0a0a, #0a0503)`,
            border: `2px solid ${casino.primary}`, borderRadius: 14,
            maxWidth: 500, width: '100%', padding: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ color: casino.secondary, margin: 0, letterSpacing: 2 }}>🎒 INVENTAIRE</h3>
              <button onClick={() => setShowInventory(false)} style={{
                background: 'transparent', border: `1px solid ${casino.secondary}`,
                color: casino.secondary, padding: '6px 12px', borderRadius: 6,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>✕</button>
            </div>
            {weapons.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#888', padding: 30 }}>
                Pas d'arme dans l'inventaire. Visite l'armurerie !
              </div>
            ) : (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: 10,
              }}>
                {weapons.map(wId => {
                  const w = WEAPONS.find(x => x.id === wId);
                  const isSelected = selectedWeapon === wId;
                  return (
                    <button key={wId}
                      onClick={() => { setSelectedWeapon(wId); setShowInventory(false); }}
                      style={{
                        padding: 12,
                        background: isSelected 
                          ? `linear-gradient(135deg, ${casino.secondary}33, ${casino.primary}33)` 
                          : 'rgba(0,0,0,0.4)',
                        border: `2px solid ${isSelected ? casino.secondary : '#444'}`,
                        borderRadius: 10, color: '#fff',
                        cursor: 'pointer', fontFamily: 'inherit',
                        textAlign: 'center',
                      }}>
                      <WeaponIcon id={wId} size={50} />
                      <div style={{ fontSize: 11, fontWeight: 'bold', marginTop: 4 }}>{w.name}</div>
                      <div style={{ fontSize: 9, color: '#cca366' }}>{w.damage}</div>
                      {isSelected && (
                        <div style={{
                          fontSize: 10, color: casino.secondary, fontWeight: 'bold', marginTop: 4,
                        }}>✓ ÉQUIPÉE</div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {selectedWeapon && (
              <button onClick={() => { setSelectedWeapon(null); }}
                style={{
                  width: '100%', marginTop: 12, padding: 10,
                  background: 'transparent', border: '1px solid #888',
                  color: '#888', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                }}>Déséquiper</button>
            )}
          </div>
        </div>
      )}

      {/* MENU */}
      {showMenu && (
        <div className="hud-control" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
          zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, overflowY: 'auto', fontFamily: 'Georgia, serif',
        }}>
          <div style={{
            background: `linear-gradient(145deg, #1a0a0a, #0a0503)`,
            border: `2px solid ${casino.primary}`, borderRadius: 14,
            maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{
              padding: '14px 20px', borderBottom: `1px solid ${casino.primary}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'rgba(0,0,0,0.4)',
            }}>
              <div style={{ color: casino.secondary, fontSize: 18, fontWeight: 'bold' }}>
                {casino.country} {casino.name}
              </div>
              <button onClick={() => setShowMenu(false)} style={{
                background: 'transparent', border: `1px solid ${casino.secondary}`,
                color: casino.secondary, padding: '6px 12px', borderRadius: 6,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>✕</button>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: 8, marginBottom: 16,
              }}>
                <StatCard label="Solde" value={fmt(balance) + ' B'} color="#ffd700" />
                <StatCard label="Gains cum." value={fmt(profile.totalWinnings) + ' B'} color="#00ff88" />
                <StatCard label="Trophées" value={`${earned.length}/${TROPHIES.length}`} color="#ff6b9d" />
                <StatCard label="Armes" value={weapons.length} color={casino.primary} />
              </div>

              {nextTrophy && (
                <div style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: `1px solid ${nextTrophy.color}`,
                  borderRadius: 8, padding: 10, marginBottom: 12,
                }}>
                  <div style={{ color: nextTrophy.color, fontSize: 11, marginBottom: 4 }}>
                    Prochain : {nextTrophy.icon} {nextTrophy.name}
                  </div>
                  <div style={{ background: '#333', height: 5, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(100, (profile.totalWinnings / nextTrophy.threshold) * 100)}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${nextTrophy.color}, #fff)`,
                    }} />
                  </div>
                </div>
              )}

              <div style={{ color: '#cca366', fontSize: 12, marginBottom: 10, textAlign: 'center', fontStyle: 'italic' }}>
                💡 Déplace-toi dans le casino pour accéder aux jeux, bar, WC, ATM, roue, boutique et BenzBet
              </div>

              <button onClick={() => { setShowMenu(false); onOpenTrophies(); }} style={menuBtnStyle('#ff6b9d')}>
                🏆 Voir tous les trophées
              </button>

              <button onClick={() => { setShowMenu(false); onOpenCharacter && onOpenCharacter(); }}
                data-testid="menu-character-btn"
                style={{ ...menuBtnStyle('#b48cff'), marginTop: 10 }}>
                👤 Personnaliser le personnage
              </button>

              <button onClick={() => { setShowMenu(false); onChangeCasino && onChangeCasino(); }} style={{
                ...menuBtnStyle(casino.accent),
                marginTop: 10,
              }}>
                🌍 Changer de casino
              </button>

              <button onClick={() => { setShowMenu(false); onLogout(); }} style={{
                width: '100%', marginTop: 10, padding: 10,
                background: 'rgba(180,40,40,0.3)',
                border: '1px solid #aa3030', color: '#ff7777',
                borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
              }}>Déconnexion</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(255,215,0,0.6); }
          50% { box-shadow: 0 0 40px rgba(255,215,0,0.9); }
        }
        @keyframes shootRecoil {
          0% { transform: scale(1); }
          50% { transform: scale(0.85); }
          100% { transform: scale(1); }
        }
        @keyframes muzzleFlash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes recoilAnim {
          0% { transform: translate(0,0) rotate(0); }
          50% { transform: translate(-10px, 8px) rotate(-3deg); }
          100% { transform: translate(0,0) rotate(0); }
        }
        @keyframes muzzleFlashAnim {
          0% { opacity: 1; transform: scale(0.6); }
          100% { opacity: 0; transform: scale(1.4); }
        }
        @keyframes bulletFlyOverlay {
          0% { right: 22%; bottom: 28%; opacity: 1; transform: scale(1); }
          100% { right: 50%; bottom: 50%; opacity: 0; transform: scale(0.3); }
        }
      `}</style>
    </div>
  );
};

// Bouton fléché avec press/hold support
const ArrowButton = ({ dir, onPress }) => {
  const handleDown = (e) => { e.preventDefault(); onPress(true); };
  const handleUp = (e) => { e.preventDefault(); onPress(false); };
  return (
    <button
      onTouchStart={handleDown}
      onTouchEnd={handleUp}
      onTouchCancel={handleUp}
      onMouseDown={handleDown}
      onMouseUp={handleUp}
      onMouseLeave={handleUp}
      style={{
        width: 50, height: 50,
        background: 'rgba(0,0,0,0.7)',
        border: '2px solid rgba(255,215,0,0.7)',
        borderRadius: 10, color: '#ffd700',
        fontSize: 24, cursor: 'pointer',
        userSelect: 'none',
        fontFamily: 'Georgia, serif',
        boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
      }}>{dir}</button>
  );
};

const menuBtnStyle = (color) => ({
  padding: '12px 14px',
  background: `linear-gradient(135deg, ${color}, ${color}99)`,
  border: `1px solid ${color}`,
  color: '#fff', borderRadius: 8, cursor: 'pointer',
  fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 'bold',
});

const StatCard = ({ label, value, color, onClick }) => (
  <div onClick={onClick}
    style={{
      background: 'rgba(0,0,0,0.6)', border: `1px solid ${color}44`,
      borderRadius: 8, padding: 12,
      cursor: onClick ? 'pointer' : 'default',
      backdropFilter: 'blur(4px)',
    }}>
    <div style={{ color: '#888', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ color, fontSize: 18, fontWeight: 'bold', marginTop: 2 }}>{value}</div>
  </div>
);

// ============== BLACKJACK AMÉLIORÉ ==============
const BlackjackGame = ({ balance, setBalance, minBet, onExit, casino, chooseWeapon, dealerProfile, dealerSplats, flyingProjectile, bloodStreams, dealerDead, dealerShot, onKillDealer, onProjectile, weapons }) => {
  const [deck, setDeck] = useState(createDeck());
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [chipBets, setChipBets] = useState({}); // { 25: 2, 100: 1 }
  const [phase, setPhase] = useState('bet'); // bet | player | dealer | result
  const [message, setMessage] = useState('');
  const [messageColor, setMessageColor] = useState('#ffd700');
  const [canDouble, setCanDouble] = useState(false);
  const [showWeaponMenu, setShowWeaponMenu] = useState(false);
  // Split state
  const [splitHands, setSplitHands] = useState(null); // if not null: array of hands
  const [activeHand, setActiveHand] = useState(0);
  const [splitBets, setSplitBets] = useState([0, 0]);

  const maxBet = Math.min(balance, minBet * 1000);
  // Chips pour classique, PLAQUETTES VIP pour les tables VIP
  const chipValues = minBet >= 1000000 ? [100000, 500000, 1000000, 5000000, 10000000]
                   : minBet >= 100000 ? [50000, 100000, 500000, 1000000, 5000000]
                   : minBet >= 30000 ? [10000, 50000, 100000, 500000, 1000000]
                   : minBet >= 5000 ? [5000, 10000, 50000, 100000, 500000]
                   : [5, 10, 25, 100, 500];

  const totalBet = Object.entries(chipBets).reduce((s, [v, q]) => s + parseInt(v) * q, 0);
  const isVIP = minBet >= 5000;

  const addChip = (value) => {
    if (totalBet + value > balance) return;
    setChipBets({ ...chipBets, [value]: (chipBets[value] || 0) + 1 });
  };

  const clearBet = () => setChipBets({});

  const drawCard = (d) => {
    if (d.length === 0) d = createDeck();
    const newDeck = [...d];
    const card = newDeck.pop();
    return { card, deck: newDeck };
  };

  const startRound = () => {
    if (totalBet < minBet) {
      setMessage(`Mise minimum : ${fmt(minBet)} B`);
      setMessageColor('#ff4444');
      return;
    }
    setBalance(balance - totalBet);
    let d = deck.length < 15 ? createDeck() : [...deck];
    const p1 = drawCard(d); d = p1.deck;
    const dl1 = drawCard(d); d = dl1.deck;
    const p2 = drawCard(d); d = p2.deck;
    const dl2 = drawCard(d); d = dl2.deck;

    setPlayerHand([p1.card, p2.card]);
    setDealerHand([dl1.card, dl2.card]);
    setDeck(d);
    setPhase('player');
    setMessage('');
    setCanDouble(balance - totalBet >= totalBet);

    const pv = handValue([p1.card, p2.card]);
    const dv = handValue([dl1.card, dl2.card]);
    const playerBJ = pv === 21;
    const dealerBJ = dv === 21;

    // Traitement immédiat des blackjacks naturels
    if (playerBJ || dealerBJ) {
      setTimeout(() => {
        if (playerBJ && dealerBJ) {
          setBalance((b) => b + totalBet);
          setMessage('Égalité des blackjacks');
          setMessageColor('#ffd700');
        } else if (playerBJ) {
          // Blackjack 3:2 : récupère la mise + 1.5x
          const win = Math.floor(totalBet * 2.5);
          setBalance((b) => b + win);
          setMessage(`BLACKJACK ! +${fmt(Math.floor(totalBet * 1.5))} B`);
          setMessageColor('#00ff88');
        } else {
          // Croupier BJ - perte immédiate
          setMessage(`Blackjack croupier · -${fmt(totalBet)} B`);
          setMessageColor('#ff4444');
        }
        setPhase('result');
      }, 800);
    }
  };

  const hit = () => {
    const { card, deck: newDeck } = drawCard(deck);
    const newHand = [...playerHand, card];
    setPlayerHand(newHand); setDeck(newDeck); setCanDouble(false);
    if (splitHands) {
      // Update the active hand in splitHands array
      const next = [...splitHands];
      next[activeHand] = newHand;
      setSplitHands(next);
    }
    if (handValue(newHand) > 21) {
      // Bust: si split, passer à la main suivante, sinon terminer
      if (splitHands && activeHand === 0) {
        setTimeout(() => switchToSecondHand(), 400);
      } else {
        setMessage(`BUST ! -${fmt(splitHands ? splitBets[activeHand] : totalBet)} B`);
        setMessageColor('#ff4444');
        if (splitHands && activeHand === 1) {
          setTimeout(() => playDealerForSplit(), 500);
        } else {
          setPhase('result');
        }
      }
    } else if (handValue(newHand) === 21) {
      if (splitHands && activeHand === 0) {
        setTimeout(() => switchToSecondHand(), 400);
      } else {
        stand(newHand);
      }
    }
  };

  const switchToSecondHand = () => {
    setActiveHand(1);
    setPlayerHand(splitHands[1]);
    setCanDouble(balance >= splitBets[1]);
    setMessage('Main 2 · à toi');
  };

  const playDealerForSplit = () => {
    // Si les deux mains ont busté, on ne joue pas le croupier
    const h1Bust = handValue(splitHands[0]) > 21;
    const h2Bust = handValue(splitHands[1]) > 21;
    if (h1Bust && h2Bust) {
      setPhase('result');
      setMessage(`Les deux mains bust · -${fmt(splitBets[0] + splitBets[1])} B`);
      setMessageColor('#ff4444');
      return;
    }
    // Faire jouer le croupier
    setPhase('dealer');
    let d = [...deck]; let dh = [...dealerHand];
    setTimeout(() => {
      while (handValue(dh) < 17) {
        const { card, deck: newD } = drawCard(d);
        dh.push(card); d = newD;
      }
      setDealerHand([...dh]); setDeck(d);
      const dv = handValue(dh);
      const dealerBust = dv > 21;
      let total = 0;
      [0, 1].forEach((i) => {
        const pv = handValue(splitHands[i]);
        if (pv > 21) return; // bust, perdu
        if (dealerBust || pv > dv) total += splitBets[i] * 2;
        else if (pv === dv) total += splitBets[i];
      });
      setBalance((b) => b + total);
      setMessage(`Split terminé · Gains: ${fmt(total)} B`);
      setMessageColor(total > splitBets[0] + splitBets[1] ? '#00ff88' : total === splitBets[0] + splitBets[1] ? '#ffd700' : '#ff4444');
      setPhase('result');
    }, 800);
  };

  const stand = (handOverride) => {
    const pHand = handOverride || playerHand;
    // Si split et main 1, passer à la main 2
    if (splitHands && activeHand === 0) {
      const next = [...splitHands];
      next[0] = pHand;
      setSplitHands(next);
      setTimeout(() => switchToSecondHand(), 300);
      return;
    }
    if (splitHands && activeHand === 1) {
      const next = [...splitHands];
      next[1] = pHand;
      setSplitHands(next);
      setTimeout(() => playDealerForSplit(), 300);
      return;
    }
    setPhase('dealer');
    let d = [...deck];
    let dh = [...dealerHand];

    setTimeout(() => {
      while (handValue(dh) < 17) {
        const { card, deck: newD } = drawCard(d);
        dh.push(card); d = newD;
      }
      setDealerHand([...dh]); setDeck(d);

      const pv = handValue(pHand);
      const dv = handValue(dh);

      setTimeout(() => {
        if (dv > 21 || pv > dv) {
          setBalance((b) => b + totalBet * 2);
          setMessage(`GAGNÉ ! +${fmt(totalBet)} B`);
          setMessageColor('#00ff88');
        } else if (pv === dv) {
          setBalance((b) => b + totalBet);
          setMessage('Égalité');
          setMessageColor('#ffd700');
        } else {
          setMessage(`PERDU ! -${fmt(totalBet)} B`);
          setMessageColor('#ff4444');
        }
        setPhase('result');
      }, 500);
    }, 600);
  };

  const doubleDown = () => {
    if (balance < totalBet) return;
    setBalance(balance - totalBet);
    const prev = totalBet;
    setChipBets((prev) => {
      const doubled = {};
      Object.entries(prev).forEach(([k, v]) => { doubled[k] = v * 2; });
      return doubled;
    });
    const { card, deck: newDeck } = drawCard(deck);
    const newHand = [...playerHand, card];
    setPlayerHand(newHand); setDeck(newDeck);
    setTimeout(() => {
      if (handValue(newHand) > 21) {
        setMessage(`BUST ! -${fmt(prev * 2)} B`);
        setMessageColor('#ff4444');
        setPhase('result');
      } else { stand(newHand); }
    }, 400);
  };

  const nextRound = () => {
    setPlayerHand([]); setDealerHand([]);
    setPhase('bet'); setMessage(''); setChipBets({});
    setSplitHands(null); setActiveHand(0); setSplitBets([0, 0]);
  };

  // ============== SPLIT ==============
  const canSplit = () => {
    if (!playerHand || playerHand.length !== 2) return false;
    if (splitHands) return false; // already split
    // Cards must have same value (including 10-J-Q-K all = 10)
    const v1 = playerHand[0].value === 1 ? 1 : Math.min(10, playerHand[0].value);
    const v2 = playerHand[1].value === 1 ? 1 : Math.min(10, playerHand[1].value);
    return v1 === v2 && balance >= totalBet;
  };

  const split = () => {
    if (!canSplit()) return;
    setBalance(balance - totalBet);
    const d = [...deck];
    const r1 = drawCard(d);
    const r2 = drawCard(r1.deck);
    const h1 = [playerHand[0], r1.card];
    const h2 = [playerHand[1], r2.card];
    setSplitHands([h1, h2]);
    setSplitBets([totalBet, totalBet]);
    setPlayerHand(h1);
    setActiveHand(0);
    setDeck(r2.deck);
    setCanDouble(balance - totalBet >= totalBet);
    setMessage('Main 1 · joue d\'abord');
  };

  // Surrender: récupère moitié de la mise et termine la main
  const surrender = () => {
    if (!playerHand || playerHand.length !== 2 || splitHands) return;
    setBalance((b) => b + Math.floor(totalBet / 2));
    setMessage(`Abandon · récupération de ${fmt(Math.floor(totalBet/2))} B`);
    setMessageColor('#ffaa00');
    setPhase('result');
  };

  const lost = phase === 'result' && (message.includes('PERDU') || message.includes('BUST'));
  const canAfford = balance >= minBet || totalBet >= minBet;

  return (
    <div style={{
      minHeight: '100vh', background: casino.bg,
      fontFamily: 'Georgia, serif', color: '#fff', paddingBottom: 40,
    }}>
      <GameHeader casino={casino} isVIP={isVIP} balance={balance} onExit={onExit} title={`BLACKJACK - Min ${fmt(minBet)} B`} />

      <div style={{ padding: 16, maxWidth: 1000, margin: '0 auto' }}>
        {/* Table de blackjack avec vue immersive */}
        <div style={{
          background: `radial-gradient(ellipse at center, #0a4020 0%, #051e0f 70%, #020a06 100%)`,
          border: `4px solid ${casino.primary}`,
          borderRadius: '50% 50% 20px 20px / 40% 40% 20px 20px',
          padding: '30px 20px 20px',
          position: 'relative',
          marginBottom: 20,
          boxShadow: `0 0 40px ${casino.primary}44, inset 0 0 60px rgba(0,0,0,0.8)`,
        }}>
          {/* Logo centre de table */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            fontSize: 70, opacity: 0.08, pointerEvents: 'none',
            color: casino.secondary,
          }}>♠♥♦♣</div>

          {/* Croupier */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10, position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <Dealer profile={dealerProfile} splats={dealerSplats} dead={dealerDead} shot={dealerShot} bloodStreams={bloodStreams} />
              {flyingProjectile && <FlyingProjectile {...flyingProjectile} />}
            </div>
          </div>

          {/* Cartes du croupier */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,215,0,0.3)',
            borderRadius: 10, padding: 12,
            marginBottom: 16,
            minHeight: 110,
          }}>
            <div style={{ color: '#cca366', fontSize: 11, textAlign: 'center', marginBottom: 4 }}>
              CROUPIER {dealerHand.length > 0 && phase !== 'player' && ` - ${handValue(dealerHand)}`}
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
              {dealerHand.map((c, i) => (
                <Card key={c.id} card={c} hidden={phase === 'player' && i === 1} delay={i * 0.2} />
              ))}
            </div>
          </div>

          {/* Zone de mise centrale */}
          <div style={{
            display: 'flex', justifyContent: 'center', marginBottom: 16,
          }}>
            <div style={{
              width: 140, height: 90,
              border: `2px dashed ${casino.secondary}`,
              borderRadius: '50%',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.3)',
              position: 'relative',
            }}>
              <div style={{ fontSize: 10, color: '#cca366' }}>MISE</div>
              <div style={{ fontSize: 20, color: '#ffd700', fontWeight: 'bold' }}>
                {fmt(totalBet)}
              </div>
              {/* Affichage visuel des jetons misés */}
              {totalBet > 0 && (
                <div style={{
                  position: 'absolute', bottom: -25, left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex', gap: 2,
                }}>
                  {Object.entries(chipBets).filter(([_, q]) => q > 0).slice(0, 4).map(([v, q]) => (
                    <div key={v} style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: 'radial-gradient(circle, #ffd700, #b8860b)',
                      border: '1px solid #000', fontSize: 8, color: '#000',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 'bold',
                    }}>{q}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cartes du joueur */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,215,0,0.3)',
            borderRadius: 10, padding: 12,
            minHeight: 110, marginTop: 30,
          }}>
            <div style={{ color: '#cca366', fontSize: 11, textAlign: 'center', marginBottom: 4 }}>
              TA MAIN {playerHand.length > 0 && `- ${handValue(playerHand)}`}
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
              {playerHand.map((c, i) => <Card key={c.id} card={c} delay={i * 0.15} />)}
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            textAlign: 'center', fontSize: 24, fontWeight: 'bold',
            color: messageColor, marginBottom: 16,
            textShadow: `0 0 15px ${messageColor}`,
            animation: 'messagePulse 0.5s ease-out',
          }}>{message}</div>
        )}

        {/* Contrôles selon phase */}
        {phase === 'bet' && (
          <div style={{
            background: 'rgba(0,0,0,0.5)',
            border: `1px solid ${casino.primary}`,
            borderRadius: 10, padding: 16,
          }}>
            <div style={{ textAlign: 'center', color: '#cca366', marginBottom: 12, fontSize: 13 }}>
              Sélectionne tes jetons (min {fmt(minBet)} B)
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
              {chipValues.map(v => (
                <Chip key={v} value={v} onClick={() => addChip(v)} 
                  disabled={totalBet + v > balance} size={58} />
              ))}
            </div>
            <div style={{ textAlign: 'center' }}>
              <button onClick={clearBet} disabled={totalBet === 0}
                style={{...btnStyle('#aa4400', totalBet === 0), marginRight: 8}}>EFFACER</button>
              <button onClick={startRound} disabled={totalBet < minBet}
                style={btnStyle(casino.secondary, totalBet < minBet)}>DISTRIBUER</button>
            </div>
          </div>
        )}

        {phase === 'player' && (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={hit} data-testid="bj-hit" style={btnStyle('#00aa44')}>TIRER</button>
            <button onClick={() => stand()} data-testid="bj-stand" style={btnStyle('#aa4400')}>RESTER</button>
            {canDouble && <button onClick={doubleDown} data-testid="bj-double" style={btnStyle('#aa00aa')}>DOUBLER</button>}
            {canSplit() && <button onClick={split} data-testid="bj-split" style={btnStyle('#0077aa')}>SPLIT</button>}
            {!splitHands && playerHand && playerHand.length === 2 && (
              <button onClick={surrender} data-testid="bj-surrender" style={btnStyle('#666')}>ABANDON</button>
            )}
          </div>
        )}

        {phase === 'result' && (
          <div style={{ textAlign: 'center' }}>
            {lost && !dealerDead && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: '#cca366', fontSize: 12, marginBottom: 8 }}>
                  Frustré ? Défoule-toi sur le croupier :
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button onClick={() => onProjectile('tomato')} style={btnStyle('#c93030')}>🍅 Tomate</button>
                  <button onClick={() => onProjectile('beer')} style={btnStyle('#8b6914')}>🍺 Bière</button>
                  {weapons.length > 0 && (
                    <button onClick={() => setShowWeaponMenu(true)} style={btnStyle('#660000')}>
                      ⚔️ Arme
                    </button>
                  )}
                </div>
              </div>
            )}
            <button onClick={nextRound} disabled={!canAfford}
              style={btnStyle(casino.secondary, !canAfford)}>
              {!canAfford ? 'FONDS INSUFFISANTS' : 'NOUVELLE PARTIE'}
            </button>
          </div>
        )}

        {showWeaponMenu && (
          <WeaponMenu 
            weapons={weapons} 
            onClose={() => setShowWeaponMenu(false)}
            onUse={(w) => {
              setShowWeaponMenu(false);
              chooseWeapon(w);
            }}
          />
        )}
      </div>
    </div>
  );
};

const GameHeader = ({ casino, isVIP, balance, onExit, title }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between',
    padding: 14, background: 'rgba(0,0,0,0.7)',
    borderBottom: `1px solid ${casino.primary}`,
    alignItems: 'center',
    position: 'sticky', top: 0, zIndex: 100,
    backdropFilter: 'blur(8px)',
  }}>
    <button onClick={onExit} style={{
      background: 'transparent', border: `1px solid ${casino.secondary}`,
      color: casino.secondary, padding: '8px 16px', borderRadius: 6,
      cursor: 'pointer', fontFamily: 'Georgia, serif',
    }}>← Lobby</button>
    <div style={{ textAlign: 'center' }}>
      <div style={{ color: isVIP ? casino.accent : casino.secondary, fontSize: 12 }}>
        {isVIP ? '💎 TABLE VIP' : '🎰 TABLE'} 
      </div>
      <div style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>{title}</div>
    </div>
    <div style={{ textAlign: 'right' }}>
      <div style={{ color: '#cca366', fontSize: 11 }}>SOLDE</div>
      <div style={{ color: '#ffd700', fontSize: 20, fontWeight: 'bold' }}>{fmt(balance)} B</div>
    </div>
  </div>
);

const btnStyle = (color, disabled) => ({
  padding: '12px 26px',
  background: disabled ? '#444' : `linear-gradient(135deg, ${color}, ${color}cc)`,
  color: color === '#ffd700' || color === '#f1bf00' ? '#000' : '#fff',
  border: 'none', borderRadius: 8,
  fontSize: 14, fontWeight: 'bold',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontFamily: 'Georgia, serif',
  boxShadow: disabled ? 'none' : `0 4px 12px ${color}44`,
  margin: 2, letterSpacing: 1,
});

// ============== WEAPON MENU ==============
const WeaponMenu = ({ weapons, onClose, onUse }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 500, padding: 20,
  }}>
    <div style={{
      background: 'linear-gradient(145deg, #1a0a0a, #0a0503)',
      border: '2px solid #8b0000', borderRadius: 12, padding: 24,
      maxWidth: 500, width: '100%', fontFamily: 'Georgia, serif',
    }}>
      <h3 style={{ color: '#ff4444', margin: 0, marginBottom: 16, textAlign: 'center' }}>
        ⚔️ Choisis ton arme
      </h3>
      {weapons.map(w => {
        const def = WEAPONS.find(x => x.id === w);
        return (
          <button key={w} onClick={() => onUse(w)}
            style={{
              width: '100%', padding: 14, marginBottom: 8,
              background: 'rgba(139,0,0,0.2)', border: '1px solid #8b0000',
              borderRadius: 8, color: '#fff', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 15, textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
            <WeaponIcon id={w} size={36} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold' }}>{def.name}</div>
              <div style={{ fontSize: 11, color: '#cca366' }}>Dégâts : {def.damage}</div>
            </div>
          </button>
        );
      })}
      <button onClick={onClose} style={{
        width: '100%', marginTop: 8, padding: 10,
        background: 'transparent', border: '1px solid #888',
        color: '#888', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
      }}>Annuler</button>
    </div>
  </div>
);

// ============== ROULETTE AMÉLIORÉE AVEC BILLE ==============
const RouletteGame = ({ balance, setBalance, minBet, onExit, casino, chooseWeapon, dealerProfile, dealerSplats, flyingProjectile, bloodStreams, dealerDead, dealerShot, onProjectile, weapons }) => {
  const [bets, setBets] = useState({});
  const [chipValue, setChipValue] = useState(minBet);
  const [spinning, setSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [ballAngle, setBallAngle] = useState(0);
  const [ballRadius, setBallRadius] = useState(150);
  const [ballDropped, setBallDropped] = useState(false);
  const [message, setMessage] = useState('');
  const [messageColor, setMessageColor] = useState('#ffd700');
  const [lastResults, setLastResults] = useState([]);
  const [showWeaponMenu, setShowWeaponMenu] = useState(false);
  const animRef = useRef();

  const chipOptions = minBet >= 1000000 ? [100000, 500000, 1000000, 5000000, 10000000]
                    : minBet >= 100000 ? [50000, 100000, 500000, 1000000, 5000000]
                    : minBet >= 30000 ? [10000, 50000, 100000, 500000, 1000000]
                    : minBet >= 5000 ? [5000, 10000, 50000, 100000, 500000]
                    : [5, 10, 25, 100, 500];

  const totalBet = Object.values(bets).reduce((s, v) => s + v, 0);
  const isVIP = minBet >= 5000;

  const placeBet = (key) => {
    if (balance - totalBet < chipValue) return;
    setBets({ ...bets, [key]: (bets[key] || 0) + chipValue });
  };

  const removeBet = (key, e) => {
    e.stopPropagation();
    const current = bets[key] || 0;
    if (current <= chipValue) {
      const { [key]: _, ...rest } = bets;
      setBets(rest);
    } else {
      setBets({ ...bets, [key]: current - chipValue });
    }
  };

  const clearBets = () => setBets({});

  const spin = () => {
    if (totalBet === 0 || spinning || totalBet < minBet) return;
    
    // Capture SNAPSHOT des valeurs actuelles (évite les closures obsolètes)
    const betsSnapshot = { ...bets };
    const totalBetSnapshot = totalBet;
    
    setSpinning(true);
    setBalance(b => b - totalBetSnapshot);
    setMessage('');
    setBallDropped(false);
    
    const winNum = ROULETTE_NUMBERS[Math.floor(Math.random() * ROULETTE_NUMBERS.length)];
    const idx = ROULETTE_NUMBERS.indexOf(winNum);
    const segmentAngle = 360 / ROULETTE_NUMBERS.length;
    
    // Roue tourne dans un sens, bille dans l'autre
    const wheelSpinTurns = 4 + Math.random() * 2; // 4-6 tours pour la roue
    const wheelTarget = 360 * wheelSpinTurns;
    setWheelRotation(prev => prev + wheelTarget);
    
    // Animation de la bille : au MOINS 6 tours dans le sens inverse
    const ballStart = Date.now();
    const duration = 7000; // 7 secondes pour une bille qui roule vraiment
    const ballTurns = 6 + Math.random() * 2; // 6-8 tours
    // Angle final dans le repère monde : doit pointer le numéro gagnant (vers le haut, -90)
    // Mais comme la roue tourne aussi, on calcule l'angle que la bille doit avoir dans le repère terre
    // quand le numéro aura atteint le haut
    const ballFinalAngle = -90 - (idx * segmentAngle + segmentAngle / 2) + wheelTarget;
    const totalBallRotation = -360 * ballTurns + ballFinalAngle;
    
    const animate = () => {
      const elapsed = Date.now() - ballStart;
      const progress = Math.min(elapsed / duration, 1);
      // Easing plus prononcé - la bille ralentit progressivement
      const eased = 1 - Math.pow(1 - progress, 4);
      
      const currentAngle = totalBallRotation * eased;
      
      // Petits rebonds sur les déflecteurs en fin d'animation
      let bumpOffset = 0;
      if (progress > 0.85) {
        const bumpPhase = (progress - 0.85) / 0.15;
        bumpOffset = Math.sin(bumpPhase * Math.PI * 8) * (1 - bumpPhase) * 2;
      }
      setBallAngle(currentAngle + bumpOffset);
      
      // Rayon: la bille descend en spirale - du bord (180) au numéro (130)
      // Avec de petits soubresauts en fin
      let radius = 180 - (180 - 130) * eased;
      if (progress > 0.85) {
        const bumpPhase = (progress - 0.85) / 0.15;
        radius += Math.sin(bumpPhase * Math.PI * 6) * (1 - bumpPhase) * 4;
      }
      setBallRadius(radius);
      
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setWinningNumber(winNum);
        setLastResults(prev => [winNum, ...prev].slice(0, 8));
        
        let win = 0;
        const color = getColor(winNum);
        Object.entries(betsSnapshot).forEach(([key, amount]) => {
          if (key === `num-${winNum}`) win += amount * 36;
          else if (key === 'red' && color === 'red') win += amount * 2;
          else if (key === 'black' && color === 'black') win += amount * 2;
          else if (key === 'even' && winNum !== 0 && winNum % 2 === 0) win += amount * 2;
          else if (key === 'odd' && winNum % 2 === 1) win += amount * 2;
          else if (key === 'low' && winNum >= 1 && winNum <= 18) win += amount * 2;
          else if (key === 'high' && winNum >= 19 && winNum <= 36) win += amount * 2;
          else if (key === 'dozen1' && winNum >= 1 && winNum <= 12) win += amount * 3;
          else if (key === 'dozen2' && winNum >= 13 && winNum <= 24) win += amount * 3;
          else if (key === 'dozen3' && winNum >= 25 && winNum <= 36) win += amount * 3;
        });
        
        if (win > 0) {
          setBalance(b => b + win);
        }
        
        const net = win - totalBetSnapshot;
        if (net > 0) {
          setMessage(`GAGNÉ ! +${fmt(net)} B (${winNum} ${color === 'red' ? '🔴' : color === 'black' ? '⚫' : '🟢'})`);
          setMessageColor('#00ff88');
        } else if (net === 0) {
          setMessage(`Équilibre (${winNum})`);
          setMessageColor('#ffd700');
        } else {
          setMessage(`PERDU ${fmt(-net)} B (${winNum} ${color === 'red' ? '🔴' : color === 'black' ? '⚫' : '🟢'})`);
          setMessageColor('#ff4444');
        }
        setSpinning(false);
        setBets({}); // Clear le stack visuel
      }
    };
    
    animRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const nextSpin = () => {
    setWinningNumber(null); setMessage('');
    setBallRadius(180);
  };

  const lost = winningNumber !== null && message.includes('PERDU');
  const canBet = winningNumber === null && !spinning;

  const numberGrid = [];
  for (let row = 0; row < 3; row++) {
    const rowNums = [];
    for (let col = 0; col < 12; col++) rowNums.push(3 - row + col * 3);
    numberGrid.push(rowNums);
  }

  // Position bille en coordonnées
  const ballX = 160 + ballRadius * Math.cos((ballAngle - 90) * Math.PI / 180);
  const ballY = 160 + ballRadius * Math.sin((ballAngle - 90) * Math.PI / 180);

  return (
    <div style={{
      minHeight: '100vh', background: casino.bg,
      fontFamily: 'Georgia, serif', color: '#fff', paddingBottom: 40,
    }}>
      <GameHeader casino={casino} isVIP={isVIP} balance={balance} onExit={onExit} 
        title={`ROULETTE - Min ${fmt(minBet)} B`} />

      <div style={{ padding: 16, maxWidth: 1100, margin: '0 auto' }}>
        {/* Table de jeu */}
        <div style={{
          background: `radial-gradient(ellipse at center, #0a0510 0%, #050208 80%)`,
          border: `3px solid ${casino.primary}`,
          borderRadius: 16, padding: 20, marginBottom: 16,
          display: 'flex', gap: 20, alignItems: 'flex-start',
          flexWrap: 'wrap', justifyContent: 'center',
          boxShadow: `0 0 40px ${casino.primary}44, inset 0 0 40px rgba(0,0,0,0.7)`,
        }}>
          {/* Croupier */}
          <div style={{ position: 'relative' }}>
            <Dealer profile={dealerProfile} splats={dealerSplats} dead={dealerDead} shot={dealerShot} bloodStreams={bloodStreams} />
            {flyingProjectile && <FlyingProjectile {...flyingProjectile} />}
          </div>
          
          {/* Roue de roulette avec bille */}
          <div style={{ position: 'relative', width: 320, height: 320 }}>
            {/* Base en bois */}
            <div style={{
              position: 'absolute', inset: -15,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #4a2a0a 0%, #1a0f04 80%)',
              boxShadow: '0 15px 30px rgba(0,0,0,0.8)',
            }} />
            
            {/* Marqueur fixe (pointeur) */}
            <div style={{
              position: 'absolute', top: -5, left: '50%',
              transform: 'translateX(-50%)',
              width: 0, height: 0,
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderTop: '18px solid #ffd700',
              zIndex: 20,
            }} />
            
            {/* Cuvette fixe (anneau extérieur avec déflecteurs) */}
            <div style={{
              position: 'absolute', inset: 5,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 50% 30%, #2a1a0a 0%, #0a0502 70%)',
              border: '4px solid #8b6914',
              boxShadow: 'inset 0 0 30px rgba(0,0,0,0.9)',
              zIndex: 2,
            }}>
              {/* Déflecteurs */}
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  top: '50%', left: '50%',
                  width: 12, height: 4,
                  background: '#8b6914',
                  borderRadius: 2,
                  transform: `translate(-50%,-50%) rotate(${i * 45}deg) translateX(125px)`,
                  boxShadow: '0 0 4px rgba(0,0,0,0.8)',
                }} />
              ))}
            </div>
            
            {/* La roue tournante */}
            <div style={{
              position: 'absolute', inset: 30,
              transform: `rotate(${wheelRotation}deg)`,
              transition: spinning ? 'transform 7s cubic-bezier(0.17, 0.67, 0.15, 0.99)' : 'none',
              zIndex: 3,
            }}>
              <svg viewBox="0 0 260 260" style={{ width: '100%', height: '100%' }}>
                <defs>
                  <radialGradient id="wheelInner" cx="50%" cy="50%">
                    <stop offset="0%" stopColor="#ffd700" />
                    <stop offset="50%" stopColor="#b8860b" />
                    <stop offset="100%" stopColor="#4a2a00" />
                  </radialGradient>
                </defs>
                {ROULETTE_NUMBERS.map((n, i) => {
                  const angle = 360 / ROULETTE_NUMBERS.length;
                  const startAngle = i * angle - 90;
                  const endAngle = (i + 1) * angle - 90;
                  const x1 = 130 + 125 * Math.cos((startAngle * Math.PI) / 180);
                  const y1 = 130 + 125 * Math.sin((startAngle * Math.PI) / 180);
                  const x2 = 130 + 125 * Math.cos((endAngle * Math.PI) / 180);
                  const y2 = 130 + 125 * Math.sin((endAngle * Math.PI) / 180);
                  const textAngle = startAngle + angle / 2;
                  const tx = 130 + 105 * Math.cos((textAngle * Math.PI) / 180);
                  const ty = 130 + 105 * Math.sin((textAngle * Math.PI) / 180);
                  const color = getColor(n);
                  const fill = color === 'red' ? '#c00000' : color === 'black' ? '#1a1a1a' : '#0a7a0a';
                  return (
                    <g key={i}>
                      <path
                        d={`M 130 130 L ${x1} ${y1} A 125 125 0 0 1 ${x2} ${y2} Z`}
                        fill={fill} stroke="#ffd700" strokeWidth="1"
                      />
                      <text x={tx} y={ty} fill="white" fontSize="11" fontWeight="bold"
                        textAnchor="middle" dominantBaseline="middle"
                        transform={`rotate(${textAngle + 90} ${tx} ${ty})`}>
                        {n}
                      </text>
                    </g>
                  );
                })}
                <circle cx="130" cy="130" r="35" fill="url(#wheelInner)" stroke="#8b6914" strokeWidth="2" />
                <circle cx="130" cy="130" r="28" fill="#1a1a1a" />
                <circle cx="130" cy="130" r="22" fill="url(#wheelInner)" />
                <circle cx="130" cy="130" r="8" fill="#4a2a00" />
              </svg>
            </div>
            
            {/* Bille */}
            {spinning && (
              <div style={{
                position: 'absolute',
                left: ballX, top: ballY,
                width: 14, height: 14,
                marginLeft: -7, marginTop: -7,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, #fff, #ccc 50%, #888)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.8), inset -2px -2px 3px rgba(0,0,0,0.4)',
                zIndex: 10,
                transition: 'left 0.05s linear, top 0.05s linear',
              }} />
            )}
            
            {/* Bille finale (posée sur le numéro) */}
            {winningNumber !== null && !spinning && (
              <div style={{
                position: 'absolute',
                left: 160 + 130 * Math.cos((ROULETTE_NUMBERS.indexOf(winningNumber) * (360/37) - 90 + wheelRotation) * Math.PI / 180),
                top: 160 + 130 * Math.sin((ROULETTE_NUMBERS.indexOf(winningNumber) * (360/37) - 90 + wheelRotation) * Math.PI / 180),
                width: 14, height: 14,
                marginLeft: -7, marginTop: -7,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, #fff, #ccc 50%, #888)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.8)',
                zIndex: 10,
              }} />
            )}
          </div>

          {/* Derniers résultats */}
          <div style={{ minWidth: 60 }}>
            <div style={{ color: '#cca366', fontSize: 11, marginBottom: 6, textAlign: 'center' }}>
              DERNIERS
            </div>
            {lastResults.slice(0, 7).map((n, i) => {
              const c = getColor(n);
              return (
                <div key={i} style={{
                  width: 30, height: 30,
                  background: c === 'red' ? '#c00' : c === 'black' ? '#1a1a1a' : '#060',
                  color: '#fff', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', fontSize: 12,
                  margin: '3px auto',
                  border: '1px solid ' + casino.secondary,
                  opacity: 1 - i * 0.12,
                }}>{n}</div>
              );
            })}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            textAlign: 'center', fontSize: 22, fontWeight: 'bold',
            color: messageColor, marginBottom: 16,
            textShadow: `0 0 15px ${messageColor}`,
            animation: 'messagePulse 0.5s ease-out',
          }}>{message}</div>
        )}

        {/* Table de mise */}
        <div style={{
          background: 'linear-gradient(180deg, #0a4020 0%, #052010 100%)',
          border: `2px solid ${casino.secondary}`,
          borderRadius: 8, padding: 10, marginBottom: 16,
          overflowX: 'auto',
        }}>
          <div style={{ display: 'flex', gap: 3, minWidth: 680 }}>
            <div
              onClick={() => canBet && placeBet('num-0')}
              onContextMenu={(e) => { e.preventDefault(); removeBet('num-0', e); }}
              style={{
                ...numStyle('#060'), width: 38, height: 120,
                cursor: canBet ? 'pointer' : 'default', position: 'relative',
              }}>
              0
              {bets['num-0'] && <ChipStack amount={bets['num-0']} />}
            </div>
            <div>
              {numberGrid.map((row, ri) => (
                <div key={ri} style={{ display: 'flex', gap: 2, marginBottom: 2 }}>
                  {row.map((n) => {
                    const c = getColor(n);
                    const key = `num-${n}`;
                    return (
                      <div key={n}
                        onClick={() => canBet && placeBet(key)}
                        onContextMenu={(e) => { e.preventDefault(); removeBet(key, e); }}
                        style={{
                          ...numStyle(c === 'red' ? '#c00' : '#1a1a1a'),
                          width: 38, height: 38,
                          cursor: canBet ? 'pointer' : 'default',
                          position: 'relative',
                        }}>
                        {n}
                        {bets[key] && <ChipStack amount={bets[key]} />}
                      </div>
                    );
                  })}
                </div>
              ))}
              <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
                {['dozen1', 'dozen2', 'dozen3'].map((k, i) => (
                  <div key={k}
                    onClick={() => canBet && placeBet(k)}
                    onContextMenu={(e) => { e.preventDefault(); removeBet(k, e); }}
                    style={{
                      ...numStyle('#1a4a1a'),
                      flex: 1, height: 32, fontSize: 12,
                      cursor: canBet ? 'pointer' : 'default', position: 'relative',
                    }}>
                    {['1-12', '13-24', '25-36'][i]}
                    {bets[k] && <ChipStack amount={bets[k]} />}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                {[
                  { k: 'low', l: '1-18' },
                  { k: 'even', l: 'PAIR' },
                  { k: 'red', l: 'ROUGE', color: '#c00' },
                  { k: 'black', l: 'NOIR', color: '#1a1a1a' },
                  { k: 'odd', l: 'IMPAIR' },
                  { k: 'high', l: '19-36' },
                ].map(({ k, l, color }) => (
                  <div key={k}
                    onClick={() => canBet && placeBet(k)}
                    onContextMenu={(e) => { e.preventDefault(); removeBet(k, e); }}
                    style={{
                      ...numStyle(color || '#1a4a1a'),
                      flex: 1, height: 32, fontSize: 11,
                      cursor: canBet ? 'pointer' : 'default', position: 'relative',
                    }}>
                    {l}
                    {bets[k] && <ChipStack amount={bets[k]} />}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center', color: '#888', fontSize: 10, marginTop: 6, fontStyle: 'italic' }}>
            Clic : miser • Clic droit : retirer
          </div>
        </div>

        {/* Jetons */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          {chipOptions.map((v) => (
            <Chip key={v} value={v} onClick={() => setChipValue(v)}
              selected={chipValue === v} disabled={!canBet || v > balance - totalBet} size={56} />
          ))}
        </div>

        <div style={{ textAlign: 'center', marginBottom: 16, color: '#cca366' }}>
          Mise totale : <strong style={{color: casino.secondary}}>{fmt(totalBet)} B</strong>
          {totalBet < minBet && totalBet > 0 && (
            <span style={{ color: '#ff4444', marginLeft: 8, fontSize: 12 }}>
              (min {fmt(minBet)})
            </span>
          )}
        </div>

        {/* Actions */}
        <div style={{ textAlign: 'center' }}>
          {canBet && (
            <>
              <button onClick={clearBets} disabled={totalBet === 0}
                style={{...btnStyle('#aa4400', totalBet === 0), marginRight: 8}}>EFFACER</button>
              <button onClick={spin} disabled={totalBet < minBet}
                style={btnStyle('#00aa44', totalBet < minBet)}>LANCER LA BILLE</button>
            </>
          )}
          {winningNumber !== null && !spinning && (
            <div>
              {lost && !dealerDead && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: '#cca366', fontSize: 12, marginBottom: 8 }}>
                    Défoule-toi sur le croupier :
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => onProjectile('tomato')} style={btnStyle('#c93030')}>🍅 Tomate</button>
                    <button onClick={() => onProjectile('beer')} style={btnStyle('#8b6914')}>🍺 Bière</button>
                    {weapons.length > 0 && (
                      <button onClick={() => setShowWeaponMenu(true)} style={btnStyle('#660000')}>
                        ⚔️ Arme
                      </button>
                    )}
                  </div>
                </div>
              )}
              <button onClick={nextSpin} style={btnStyle(casino.secondary)}>NOUVELLE MISE</button>
            </div>
          )}
        </div>

        {showWeaponMenu && (
          <WeaponMenu weapons={weapons} onClose={() => setShowWeaponMenu(false)}
            onUse={(w) => { setShowWeaponMenu(false); chooseWeapon(w); }} />
        )}
      </div>
    </div>
  );
};

const numStyle = (bg) => ({
  background: bg, color: '#fff', fontWeight: 'bold',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  border: '1px solid #ffd700', borderRadius: 3, fontSize: 13,
  userSelect: 'none',
});

// ============== JEU CARTE HAUTE ==============
const HighCardGame = ({ balance, setBalance, minBet, onExit, casino, chooseWeapon, dealerProfile, dealerSplats, flyingProjectile, bloodStreams, dealerDead, dealerShot, onProjectile, weapons }) => {
  const [playerCard, setPlayerCard] = useState(null);
  const [dealerCard, setDealerCard] = useState(null);
  const [chipBets, setChipBets] = useState({});
  const [betOn, setBetOn] = useState(null); // 'player' | 'dealer'
  const [phase, setPhase] = useState('bet'); // bet | reveal | result
  const [message, setMessage] = useState('');
  const [messageColor, setMessageColor] = useState('#ffd700');
  const [showWeaponMenu, setShowWeaponMenu] = useState(false);

  // Chips pour classique, PLAQUETTES VIP pour les tables VIP
  const chipValues = minBet >= 1000000 ? [100000, 500000, 1000000, 5000000, 10000000]
                   : minBet >= 100000 ? [50000, 100000, 500000, 1000000, 5000000]
                   : minBet >= 30000 ? [10000, 50000, 100000, 500000, 1000000]
                   : minBet >= 5000 ? [5000, 10000, 50000, 100000, 500000]
                   : [5, 10, 25, 100, 500];

  const totalBet = Object.entries(chipBets).reduce((s, [v, q]) => s + parseInt(v) * q, 0);
  const isVIP = minBet >= 5000;

  const addChip = (value) => {
    if (totalBet + value > balance) return;
    setChipBets({ ...chipBets, [value]: (chipBets[value] || 0) + 1 });
  };

  const draw = () => {
    if (!betOn || totalBet < minBet) return;
    
    // Capture la mise AVANT les timers asynchrones
    const betSnapshot = totalBet;
    const betOnSnapshot = betOn;
    
    setBalance(b => b - betSnapshot);
    setPhase('reveal');
    
    const deck = createDeck();
    const pc = deck[0];
    const dc = deck[1];
    
    setTimeout(() => {
      setPlayerCard(pc);
      setTimeout(() => {
        setDealerCard(dc);
        const pv = RANK_VALUE[pc.rank];
        const dv = RANK_VALUE[dc.rank];
        
        setTimeout(() => {
          if (pv === dv) {
            setBalance(b => b + betSnapshot);
            setMessage('Égalité - Mise rendue');
            setMessageColor('#ffd700');
          } else {
            const playerWins = pv > dv;
            const betterWins = (playerWins && betOnSnapshot === 'player') || (!playerWins && betOnSnapshot === 'dealer');
            if (betterWins) {
              setBalance(b => b + betSnapshot * 2);
              setMessage(`GAGNÉ ! +${fmt(betSnapshot)} B`);
              setMessageColor('#00ff88');
            } else {
              setMessage(`PERDU ! -${fmt(betSnapshot)} B`);
              setMessageColor('#ff4444');
            }
          }
          setPhase('result');
        }, 600);
      }, 500);
    }, 600);
  };

  const nextRound = () => {
    setPlayerCard(null); setDealerCard(null);
    setChipBets({}); setBetOn(null);
    setPhase('bet'); setMessage('');
  };

  const lost = phase === 'result' && message.includes('PERDU');

  return (
    <div style={{
      minHeight: '100vh', background: casino.bg,
      fontFamily: 'Georgia, serif', color: '#fff', paddingBottom: 40,
    }}>
      <GameHeader casino={casino} isVIP={isVIP} balance={balance} onExit={onExit}
        title={`CARTE HAUTE - Min ${fmt(minBet)} B`} />

      <div style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
        <div style={{
          background: `radial-gradient(ellipse at center, #0a4020 0%, #051e0f 80%)`,
          border: `3px solid ${casino.primary}`,
          borderRadius: 16, padding: 20, marginBottom: 20,
          boxShadow: `0 0 40px ${casino.primary}44, inset 0 0 40px rgba(0,0,0,0.7)`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20, position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <Dealer profile={dealerProfile} splats={dealerSplats} dead={dealerDead} shot={dealerShot} bloodStreams={bloodStreams} />
              {flyingProjectile && <FlyingProjectile {...flyingProjectile} />}
            </div>
          </div>

          {/* Zone des 2 cartes */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 20, marginBottom: 20,
          }}>
            {/* Carte croupier */}
            <div
              onClick={() => phase === 'bet' && setBetOn('dealer')}
              style={{
                padding: 20,
                background: betOn === 'dealer' ? 'rgba(255,215,0,0.2)' : 'rgba(0,0,0,0.4)',
                border: betOn === 'dealer' ? `3px solid ${casino.secondary}` : '2px solid #444',
                borderRadius: 12,
                textAlign: 'center',
                cursor: phase === 'bet' ? 'pointer' : 'default',
                transition: 'all 0.2s',
              }}>
              <div style={{ color: '#cca366', fontSize: 12, marginBottom: 10, letterSpacing: 1 }}>
                CARTE DU CROUPIER
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', minHeight: 110 }}>
                {dealerCard ? (
                  <Card card={dealerCard} />
                ) : (
                  <div style={{
                    width: 70, height: 100,
                    background: 'linear-gradient(135deg, #8b0000, #4a0000)',
                    borderRadius: 6, border: '2px solid #ffd700',
                    opacity: phase === 'bet' ? 0.5 : 1,
                  }} />
                )}
              </div>
              {phase === 'bet' && (
                <div style={{ color: betOn === 'dealer' ? casino.secondary : '#888', fontSize: 13, marginTop: 10 }}>
                  {betOn === 'dealer' ? '✓ Je parie ici' : 'Cliquer pour parier'}
                </div>
              )}
              {dealerCard && phase === 'result' && (
                <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 8 }}>
                  Valeur : {RANK_VALUE[dealerCard.rank]}
                </div>
              )}
            </div>

            {/* Carte joueur */}
            <div
              onClick={() => phase === 'bet' && setBetOn('player')}
              style={{
                padding: 20,
                background: betOn === 'player' ? 'rgba(255,215,0,0.2)' : 'rgba(0,0,0,0.4)',
                border: betOn === 'player' ? `3px solid ${casino.secondary}` : '2px solid #444',
                borderRadius: 12,
                textAlign: 'center',
                cursor: phase === 'bet' ? 'pointer' : 'default',
                transition: 'all 0.2s',
              }}>
              <div style={{ color: '#cca366', fontSize: 12, marginBottom: 10, letterSpacing: 1 }}>
                TA CARTE
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', minHeight: 110 }}>
                {playerCard ? (
                  <Card card={playerCard} />
                ) : (
                  <div style={{
                    width: 70, height: 100,
                    background: 'linear-gradient(135deg, #8b0000, #4a0000)',
                    borderRadius: 6, border: '2px solid #ffd700',
                    opacity: phase === 'bet' ? 0.5 : 1,
                  }} />
                )}
              </div>
              {phase === 'bet' && (
                <div style={{ color: betOn === 'player' ? casino.secondary : '#888', fontSize: 13, marginTop: 10 }}>
                  {betOn === 'player' ? '✓ Je parie ici' : 'Cliquer pour parier'}
                </div>
              )}
              {playerCard && phase === 'result' && (
                <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 8 }}>
                  Valeur : {RANK_VALUE[playerCard.rank]}
                </div>
              )}
            </div>
          </div>

          <div style={{
            textAlign: 'center', color: '#888', fontSize: 11, fontStyle: 'italic',
          }}>
            La carte la plus haute gagne • Gain 1:1 • Valeurs : A (14) &gt; K (13) &gt; Q (12) &gt; J (11) &gt; 10...2
          </div>
        </div>

        {message && (
          <div style={{
            textAlign: 'center', fontSize: 24, fontWeight: 'bold',
            color: messageColor, marginBottom: 16,
            textShadow: `0 0 15px ${messageColor}`,
            animation: 'messagePulse 0.5s ease-out',
          }}>{message}</div>
        )}

        {phase === 'bet' && (
          <div style={{
            background: 'rgba(0,0,0,0.5)',
            border: `1px solid ${casino.primary}`,
            borderRadius: 10, padding: 16,
          }}>
            <div style={{ textAlign: 'center', color: '#cca366', marginBottom: 12, fontSize: 13 }}>
              {betOn ? `Tu paries sur ${betOn === 'player' ? 'TA carte' : 'LA carte DU CROUPIER'}` : '👆 Choisis une carte à parier'}
              <br/>Min {fmt(minBet)} B • Mise : {fmt(totalBet)} B
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
              {chipValues.map(v => (
                <Chip key={v} value={v} onClick={() => addChip(v)} 
                  disabled={totalBet + v > balance} size={56} />
              ))}
            </div>
            <div style={{ textAlign: 'center' }}>
              <button onClick={() => setChipBets({})} disabled={totalBet === 0}
                style={{...btnStyle('#aa4400', totalBet === 0), marginRight: 8}}>EFFACER</button>
              <button onClick={draw} disabled={!betOn || totalBet < minBet}
                style={btnStyle(casino.secondary, !betOn || totalBet < minBet)}>
                TIRER LES CARTES
              </button>
            </div>
          </div>
        )}

        {phase === 'result' && (
          <div style={{ textAlign: 'center' }}>
            {lost && !dealerDead && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: '#cca366', fontSize: 12, marginBottom: 8 }}>
                  Défoule-toi :
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button onClick={() => onProjectile('tomato')} style={btnStyle('#c93030')}>🍅 Tomate</button>
                  <button onClick={() => onProjectile('beer')} style={btnStyle('#8b6914')}>🍺 Bière</button>
                  {weapons.length > 0 && (
                    <button onClick={() => setShowWeaponMenu(true)} style={btnStyle('#660000')}>⚔️ Arme</button>
                  )}
                </div>
              </div>
            )}
            <button onClick={nextRound} disabled={balance < minBet}
              style={btnStyle(casino.secondary, balance < minBet)}>
              {balance < minBet ? 'FONDS INSUFFISANTS' : 'NOUVELLE PARTIE'}
            </button>
          </div>
        )}

        {showWeaponMenu && (
          <WeaponMenu weapons={weapons} onClose={() => setShowWeaponMenu(false)}
            onUse={(w) => { setShowWeaponMenu(false); chooseWeapon(w); }} />
        )}
      </div>
    </div>
  );
};


// ============== HELPERS POKER ==============
// Évalue la meilleure main de 5 cartes à partir de 7 cartes
// Retourne { rank, rankName, tiebreaker: [values sorted] }
const POKER_HAND_NAMES = [
  'Carte haute', 'Paire', 'Double paire', 'Brelan',
  'Quinte', 'Couleur', 'Full', 'Carré', 'Quinte flush', 'Quinte flush royale'
];

const evaluatePokerHand = (cards7) => {
  // Essayer toutes les combinaisons de 5 parmi 7
  let best = { rank: -1, tiebreaker: [] };
  const choose5 = (arr, idx, chosen) => {
    if (chosen.length === 5) {
      const h = evaluateHand5(chosen);
      if (h.rank > best.rank ||
          (h.rank === best.rank && compareTB(h.tiebreaker, best.tiebreaker) > 0)) {
        best = h;
      }
      return;
    }
    if (idx >= arr.length) return;
    choose5(arr, idx + 1, [...chosen, arr[idx]]);
    choose5(arr, idx + 1, chosen);
  };
  choose5(cards7, 0, []);
  best.rankName = POKER_HAND_NAMES[best.rank];
  return best;
};

const compareTB = (a, b) => {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const av = a[i] || 0, bv = b[i] || 0;
    if (av !== bv) return av - bv;
  }
  return 0;
};

const evaluateHand5 = (cards) => {
  const values = cards.map(c => RANK_VALUE[c.rank]).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);
  
  // Compte des valeurs
  const counts = {};
  values.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
  const groups = Object.entries(counts)
    .map(([v, c]) => ({ value: +v, count: c }))
    .sort((a, b) => b.count - a.count || b.value - a.value);
  
  const isFlush = suits.every(s => s === suits[0]);
  
  // Détection quinte (A-2-3-4-5 = quinte basse)
  const uniqVals = [...new Set(values)].sort((a, b) => b - a);
  let isStraight = false;
  let straightHigh = 0;
  if (uniqVals.length === 5) {
    if (uniqVals[0] - uniqVals[4] === 4) {
      isStraight = true;
      straightHigh = uniqVals[0];
    } else if (uniqVals[0] === 14 && uniqVals[1] === 5 && uniqVals[4] === 2) {
      // A-5-4-3-2
      isStraight = true;
      straightHigh = 5;
    }
  }
  
  if (isFlush && isStraight) {
    if (straightHigh === 14) return { rank: 9, tiebreaker: [14] }; // royale
    return { rank: 8, tiebreaker: [straightHigh] };
  }
  if (groups[0].count === 4) {
    return { rank: 7, tiebreaker: [groups[0].value, groups[1].value] };
  }
  if (groups[0].count === 3 && groups[1].count === 2) {
    return { rank: 6, tiebreaker: [groups[0].value, groups[1].value] };
  }
  if (isFlush) {
    return { rank: 5, tiebreaker: values };
  }
  if (isStraight) {
    return { rank: 4, tiebreaker: [straightHigh] };
  }
  if (groups[0].count === 3) {
    const kickers = groups.slice(1).map(g => g.value);
    return { rank: 3, tiebreaker: [groups[0].value, ...kickers] };
  }
  if (groups[0].count === 2 && groups[1].count === 2) {
    return { rank: 2, tiebreaker: [groups[0].value, groups[1].value, groups[2].value] };
  }
  if (groups[0].count === 2) {
    const kickers = groups.slice(1).map(g => g.value);
    return { rank: 1, tiebreaker: [groups[0].value, ...kickers] };
  }
  return { rank: 0, tiebreaker: values };
};

// ============== JEU POKER TEXAS HOLD'EM ==============
const PokerGame = ({ balance, setBalance, minBet, onExit, casino, dealerProfile, weapons, chooseWeapon, dealerDead, dealerShot, onKillDealer }) => {
  const [phase, setPhase] = useState('bet'); // bet | preflop | flop | turn | river | showdown
  const [deck, setDeck] = useState([]);
  const [playerCards, setPlayerCards] = useState([]);
  const [dealerCards, setDealerCards] = useState([]);
  const [board, setBoard] = useState([]);
  const [ante, setAnte] = useState(minBet);
  const [multiplier, setMultiplier] = useState(1); // 1, 2, 3, 4 selon les mises
  const [message, setMessage] = useState('');
  const [showDealerCards, setShowDealerCards] = useState(false);
  const [result, setResult] = useState(null); // win, lose, tie
  const [playerHand, setPlayerHand] = useState(null);
  const [dealerHand, setDealerHand] = useState(null);
  const [showWeaponMenu, setShowWeaponMenu] = useState(false);

  const newHand = () => {
    if (ante > balance || ante < minBet) {
      setMessage(`Mise minimum : ${fmt(minBet)} B`);
      return;
    }
    setBalance(b => b - ante);
    const d = createDeck();
    setPlayerCards([d[0], d[1]]);
    setDealerCards([d[2], d[3]]);
    setBoard([]);
    setDeck(d.slice(4));
    setMultiplier(1);
    setPhase('preflop');
    setShowDealerCards(false);
    setResult(null);
    setPlayerHand(null);
    setDealerHand(null);
    setMessage('Tes cartes ! Tu peux voir le flop ou passer ton tour.');
  };

  const viewFlop = (mul) => {
    // Miser x2, x3 ou x4 pour voir le flop
    const extraCost = ante * (mul - 1);
    if (extraCost > balance) {
      setMessage(`Solde insuffisant pour miser ×${mul}`);
      return;
    }
    if (extraCost > 0) setBalance(b => b - extraCost);
    setMultiplier(mul);
    // Révéler le flop (brûler 1 carte puis 3)
    const flop = [deck[1], deck[2], deck[3]];
    setBoard(flop);
    setDeck(deck.slice(4));
    setPhase('flop');
    setMessage(`Mise ×${mul}. À toi : voir la Turn ou te coucher ?`);
  };

  const fold = () => {
    setMessage(`Tu te couches. Perte : ${fmt(ante * multiplier)} B`);
    setResult('fold');
    setPhase('showdown');
    setShowDealerCards(true);
  };

  const callTurn = () => {
    // Pour voir la turn, on ajoute 1× de plus (facultatif : on peut ajouter une mise)
    // Ici simple : on continue sans ajouter
    const turn = deck[1];
    setBoard([...board, turn]);
    setDeck(deck.slice(2));
    setPhase('turn');
    setMessage('Turn révélée. Tu peux te coucher ou doubler pour voir la River.');
  };

  const doubleTurn = () => {
    const extraCost = ante * multiplier;
    if (extraCost > balance) {
      setMessage('Solde insuffisant pour doubler');
      return;
    }
    setBalance(b => b - extraCost);
    setMultiplier(m => m * 2);
    // Révéler la river
    const river = deck[1];
    setBoard([...board, river]);
    setDeck(deck.slice(2));
    setPhase('river');
    // Puis showdown immédiat
    setTimeout(() => showdown([...board, river]), 800);
  };

  const skipToRiver = () => {
    // Option simple : continuer sans doubler (garde le multiplicateur actuel)
    const river = deck[1];
    setBoard([...board, river]);
    setDeck(deck.slice(2));
    setPhase('river');
    setTimeout(() => showdown([...board, river]), 800);
  };

  const showdown = (finalBoard) => {
    const playerBest = evaluatePokerHand([...playerCards, ...finalBoard]);
    const dealerBest = evaluatePokerHand([...dealerCards, ...finalBoard]);
    setPlayerHand(playerBest);
    setDealerHand(dealerBest);
    setShowDealerCards(true);
    setPhase('showdown');

    let cmp = playerBest.rank - dealerBest.rank;
    if (cmp === 0) cmp = compareTB(playerBest.tiebreaker, dealerBest.tiebreaker);

    const totalMise = ante * multiplier;
    if (cmp > 0) {
      const win = totalMise * 2; // on récupère mise + on gagne équivalent
      setBalance(b => b + win);
      setResult('win');
      setMessage(`🎉 Tu gagnes ${fmt(win)} B avec ${playerBest.rankName} !`);
    } else if (cmp < 0) {
      setResult('lose');
      setMessage(`❌ Perdu : ${dealerBest.rankName} du croupier bat ta ${playerBest.rankName}`);
    } else {
      setBalance(b => b + totalMise); // récup mise
      setResult('tie');
      setMessage(`Égalité : ${playerBest.rankName} de part et d'autre. Mise rendue.`);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: casino.bg,
      color: '#fff', fontFamily: 'Georgia, serif',
      display: 'flex', flexDirection: 'column', zIndex: 500,
    }}>
      {/* Header */}
      <div style={{
        padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(0,0,0,0.5)', borderBottom: `2px solid ${casino.primary}`,
      }}>
        <button onClick={onExit} style={{
          padding: '8px 16px', background: 'rgba(0,0,0,0.5)',
          border: `1px solid ${casino.secondary}`, color: casino.secondary,
          borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
        }}>← Sortir</button>
        <div style={{ color: casino.secondary, fontSize: 18, fontWeight: 'bold', letterSpacing: 2 }}>
          ♠ POKER TEXAS HOLD'EM
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: '#cca366' }}>Solde</div>
          <div style={{ fontSize: 16, color: '#ffd700', fontWeight: 'bold' }}>{fmt(balance)} B</div>
        </div>
      </div>

      {/* Table */}
      <div style={{
        flex: 1, padding: 20,
        background: 'radial-gradient(ellipse, #0a5020 0%, #052010 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'space-between',
        overflowY: 'auto',
      }}>
        {/* Croupier en haut */}
        <div style={{ marginBottom: 10 }}>
          <Dealer profile={dealerProfile || DEALER_PROFILES[0]} splats={[]} dead={dealerDead} shot={dealerShot} bloodStreams={[]} />
        </div>

        {/* Cartes du croupier */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {dealerCards.map((c, i) => (
            <Card key={i} card={c} hidden={!showDealerCards} delay={i * 200} small />
          ))}
          {dealerCards.length === 0 && (
            <>
              <Card card={null} hidden small />
              <Card card={null} hidden small />
            </>
          )}
        </div>
        {showDealerCards && dealerHand && (
          <div style={{ color: '#ffd700', fontSize: 14, marginBottom: 16, fontStyle: 'italic' }}>
            Croupier : {dealerHand.rankName}
          </div>
        )}

        {/* Board (cartes communes) */}
        <div style={{
          padding: 16, background: 'rgba(0,0,0,0.35)', borderRadius: 12,
          border: `2px dashed ${casino.secondary}`,
          marginBottom: 16, minWidth: 300,
        }}>
          <div style={{ color: '#cca366', fontSize: 11, textAlign: 'center', marginBottom: 8 }}>
            TABLE COMMUNE
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {board.map((c, i) => (
              <Card key={i} card={c} delay={i * 150} small />
            ))}
            {[...Array(5 - board.length)].map((_, i) => (
              <div key={i} style={{
                width: 50, height: 72,
                border: '2px dashed #555', borderRadius: 6,
                opacity: 0.3,
              }} />
            ))}
          </div>
        </div>

        {/* Cartes du joueur */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {playerCards.map((c, i) => (
            <Card key={i} card={c} delay={i * 200} />
          ))}
          {playerCards.length === 0 && (
            <>
              <div style={{ width: 80, height: 112, border: '2px dashed #555', borderRadius: 8, opacity: 0.3 }} />
              <div style={{ width: 80, height: 112, border: '2px dashed #555', borderRadius: 8, opacity: 0.3 }} />
            </>
          )}
        </div>
        {playerHand && (
          <div style={{ color: '#00ff88', fontSize: 14, marginBottom: 16, fontWeight: 'bold' }}>
            Toi : {playerHand.rankName}
          </div>
        )}

        {/* Info mise */}
        {multiplier > 1 && phase !== 'bet' && (
          <div style={{ color: '#ffd700', fontSize: 13, marginBottom: 8 }}>
            Mise : {fmt(ante)} × {multiplier} = {fmt(ante * multiplier)} B
          </div>
        )}

        {/* Message */}
        {message && (
          <div style={{
            color: result === 'win' ? '#00ff88' : result === 'lose' || result === 'fold' ? '#ff4444' : '#ffd700',
            fontSize: 14, marginBottom: 12, textAlign: 'center', maxWidth: 400,
          }}>{message}</div>
        )}
      </div>

      {/* HUD bas */}
      <div style={{
        padding: 16, background: 'rgba(0,0,0,0.7)',
        borderTop: `2px solid ${casino.primary}`,
      }}>
        {phase === 'bet' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 10 }}>
              <div style={{ color: '#cca366', fontSize: 12, marginBottom: 4 }}>
                Mise de base (min {fmt(minBet)} B)
              </div>
              <input type="number" value={ante} onChange={e => setAnte(+e.target.value || 0)}
                min={minBet} max={balance}
                style={{
                  padding: 8, background: '#000',
                  border: `1px solid ${casino.secondary}`, color: '#fff',
                  borderRadius: 4, fontFamily: 'inherit', fontSize: 16, width: 120, textAlign: 'center',
                }} />
            </div>
            <button onClick={newHand}
              disabled={ante < minBet || ante > balance}
              style={{
                width: '100%', padding: 14,
                background: (ante >= minBet && ante <= balance)
                  ? `linear-gradient(135deg, ${casino.primary}, ${casino.accent})` : '#444',
                border: 'none', color: '#fff', borderRadius: 8,
                fontSize: 16, fontWeight: 'bold', cursor: 'pointer',
                fontFamily: 'inherit', letterSpacing: 1,
              }}>DISTRIBUER LES CARTES</button>
          </div>
        )}

        {phase === 'preflop' && (
          <div>
            <div style={{ textAlign: 'center', color: '#cca366', fontSize: 12, marginBottom: 10 }}>
              Voir le flop en misant ×2, ×3 ou ×4 ?
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => viewFlop(2)}
                disabled={ante > balance}
                style={pokerBtnStyle(casino)}>×2 ({fmt(ante)} B)</button>
              <button onClick={() => viewFlop(3)}
                disabled={ante * 2 > balance}
                style={pokerBtnStyle(casino)}>×3 ({fmt(ante * 2)} B)</button>
              <button onClick={() => viewFlop(4)}
                disabled={ante * 3 > balance}
                style={pokerBtnStyle(casino)}>×4 ({fmt(ante * 3)} B)</button>
            </div>
            <button onClick={fold} style={{
              width: '100%', marginTop: 8, padding: 10,
              background: 'rgba(180,40,40,0.4)', border: '1px solid #aa3030',
              color: '#ff9999', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
            }}>SE COUCHER</button>
          </div>
        )}

        {phase === 'flop' && (
          <div>
            <div style={{ textAlign: 'center', color: '#cca366', fontSize: 12, marginBottom: 10 }}>
              Voir la Turn ou te coucher ?
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={callTurn} style={{
                flex: 1, padding: 12,
                background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
                color: '#fff', border: 'none', borderRadius: 6,
                fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit',
              }}>VOIR LA TURN</button>
              <button onClick={fold} style={{
                flex: 1, padding: 12,
                background: 'rgba(180,40,40,0.4)', border: '1px solid #aa3030',
                color: '#ff9999', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold',
              }}>SE COUCHER</button>
            </div>
          </div>
        )}

        {phase === 'turn' && (
          <div>
            <div style={{ textAlign: 'center', color: '#cca366', fontSize: 12, marginBottom: 10 }}>
              Doubler la mise (×2) pour la River ou te coucher ?
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={doubleTurn}
                disabled={ante * multiplier > balance}
                style={{
                  flex: 1, padding: 12,
                  background: 'linear-gradient(135deg, #ffd700, #b8860b)',
                  color: '#000', border: 'none', borderRadius: 6,
                  fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit',
                }}>DOUBLER ×2 ({fmt(ante * multiplier)} B)</button>
              <button onClick={skipToRiver} style={{
                flex: 1, padding: 12,
                background: 'rgba(100,100,100,0.4)',
                border: '1px solid #666', color: '#ccc',
                borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold',
              }}>VOIR RIVER</button>
              <button onClick={fold} style={{
                flex: 1, padding: 12,
                background: 'rgba(180,40,40,0.4)', border: '1px solid #aa3030',
                color: '#ff9999', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold',
              }}>SE COUCHER</button>
            </div>
          </div>
        )}

        {phase === 'showdown' && (
          <div>
            {result === 'lose' && weapons && weapons.length > 0 && !dealerDead && (
              <button onClick={() => setShowWeaponMenu(true)} style={{
                width: '100%', marginBottom: 8, padding: 10,
                background: 'linear-gradient(135deg, #8b0000, #4a0000)',
                color: '#fff', border: 'none', borderRadius: 6,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>⚔️ Défoule-toi sur le croupier</button>
            )}
            <button onClick={() => { setPhase('bet'); setPlayerCards([]); setDealerCards([]); setBoard([]); setPlayerHand(null); setDealerHand(null); setShowDealerCards(false); setMessage(''); setResult(null); }}
              style={{
                width: '100%', padding: 14,
                background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
                color: '#fff', border: 'none', borderRadius: 8,
                fontSize: 16, fontWeight: 'bold', cursor: 'pointer',
                fontFamily: 'inherit', letterSpacing: 1,
              }}>NOUVELLE MAIN</button>
          </div>
        )}
      </div>

      {showWeaponMenu && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600,
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #1a0a0a, #0a0503)',
            border: '2px solid #8b0000', borderRadius: 12, padding: 24,
            maxWidth: 400, width: '90%',
          }}>
            <div style={{ color: '#ff4444', textAlign: 'center', fontSize: 18, marginBottom: 16 }}>
              ⚔️ Choisis ton arme
            </div>
            {weapons.map(w => {
              const def = WEAPONS.find(x => x.id === w);
              return (
                <button key={w} onClick={() => { chooseWeapon(w); setShowWeaponMenu(false); onKillDealer && onKillDealer(); }} style={{
                  width: '100%', padding: 14, marginBottom: 8,
                  background: 'rgba(139,0,0,0.3)', border: '1px solid #8b0000',
                  borderRadius: 8, color: '#fff', cursor: 'pointer',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <WeaponIcon id={w} size={40} />
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontWeight: 'bold' }}>{def.name}</div>
                    <div style={{ fontSize: 11, color: '#cca366' }}>Dégâts : {def.damage}</div>
                  </div>
                </button>
              );
            })}
            <button onClick={() => setShowWeaponMenu(false)} style={{
              width: '100%', marginTop: 8, padding: 10,
              background: 'transparent', border: '1px solid #888',
              color: '#888', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
            }}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
};

const pokerBtnStyle = (casino) => ({
  flex: 1, padding: 12,
  background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
  color: '#fff', border: 'none', borderRadius: 6,
  fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit',
  fontSize: 12,
});



// ============== BENZ BOUTIQUE - armes au mur + véhicules en showroom ==============
const Shop = ({ profile, balance, onBuy, onBuyVehicle, onEquipVehicle, onClose, casino }) => {
  const owned = profile.weapons || [];
  const ownedVeh = profile.vehicles || [];
  const equippedVeh = profile.equippedVehicle || null;
  const [tab, setTab] = useState('weapons');

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 500, padding: 20, overflowY: 'auto',
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #120a06, #060302)',
        border: `2px solid ${casino.primary}`, borderRadius: 14,
        padding: 24, maxWidth: 960, width: '100%',
        fontFamily: 'Georgia, serif', maxHeight: '94vh', overflowY: 'auto',
        boxShadow: `0 0 40px ${casino.primary}30`,
      }}>
        <h2 style={{
          color: casino.secondary, textAlign: 'center', margin: 0, marginBottom: 4,
          textShadow: `0 0 18px ${casino.primary}`, letterSpacing: 3, fontSize: 28,
        }}>🏎  BENZ BOUTIQUE  🔫</h2>
        <div style={{ textAlign: 'center', color: '#cca366', marginBottom: 14, fontSize: 12, fontStyle: 'italic' }}>
          Showroom d'exception — Armes de prestige & véhicules de luxe
        </div>
        <div style={{ textAlign: 'center', color: casino.secondary, marginBottom: 16, fontSize: 18 }}>
          Solde : <strong>{fmt(balance)} B</strong>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          {[['weapons','🔫 Armes'],['vehicles','🏎 Véhicules']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)}
              data-testid={`shop-tab-${k}`}
              style={{
                padding: '10px 20px',
                background: tab === k ? `linear-gradient(135deg, ${casino.primary}, ${casino.accent})` : 'rgba(255,255,255,0.05)',
                color: tab === k ? '#fff' : '#cca366',
                border: `1px solid ${tab === k ? casino.secondary : '#333'}`,
                borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold',
              }}>{l}</button>
          ))}
        </div>

        {tab === 'weapons' && (
          <div style={{
            background:
              'repeating-linear-gradient(90deg, #2a1c10 0 4px, #241710 4px 80px)',
            border: '6px solid #1a1108',
            borderRadius: 12,
            padding: 18,
            boxShadow: 'inset 0 0 60px rgba(0,0,0,.8)',
          }}>
            <div style={{ fontSize: 11, color: casino.secondary, letterSpacing: 3, textAlign: 'center', marginBottom: 14 }}>
              • • •  ARMES EXPOSÉES AU MUR  • • •
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {WEAPONS.map(w => {
                const hasIt = owned.includes(w.id);
                const canAfford = balance >= w.price;
                return (
                  <div key={w.id} style={{
                    background: 'linear-gradient(180deg, #2a1e12, #14100a)',
                    border: `1px solid ${hasIt ? '#00aa44' : '#4a3820'}`,
                    borderRadius: 10, padding: 12, textAlign: 'center',
                    boxShadow: '0 4px 10px rgba(0,0,0,.6)',
                  }} data-testid={`shop-weapon-${w.id}`}>
                    <div style={{
                      background: '#0a0705', border: '1px solid #3a2a18',
                      borderRadius: 8, padding: 12, marginBottom: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 70,
                    }}>
                      <WeaponIcon id={w.id} size={56} />
                    </div>
                    <div style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{w.name}</div>
                    <div style={{ color: '#cca366', fontSize: 11, fontStyle: 'italic', margin: '4px 0' }}>{w.desc}</div>
                    <div style={{ color: casino.secondary, fontSize: 12, marginBottom: 8 }}>
                      Dégâts : {w.damage}
                    </div>
                    {hasIt ? (
                      <div style={{ color: '#00ff88', fontWeight: 'bold', fontSize: 12 }}>✓ ACQUIS</div>
                    ) : (
                      <button onClick={() => onBuy(w)} disabled={!canAfford}
                        data-testid={`shop-buy-weapon-${w.id}`}
                        style={{
                          padding: '8px 14px', width: '100%',
                          background: canAfford ? `linear-gradient(135deg, ${casino.primary}, ${casino.accent})` : '#444',
                          color: '#fff', border: 'none', borderRadius: 6,
                          cursor: canAfford ? 'pointer' : 'not-allowed',
                          fontFamily: 'inherit', fontWeight: 'bold', fontSize: 12,
                        }}>
                        {canAfford ? `${fmt(w.price)} B` : 'TROP CHER'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'vehicles' && (
          <div style={{
            background:
              'radial-gradient(ellipse at 50% 20%, rgba(212,175,55,.1), transparent 70%), ' +
              'repeating-linear-gradient(90deg, #1a1a1e 0 2px, #111116 2px 60px), #141418',
            border: `2px solid ${casino.secondary}40`,
            borderRadius: 14,
            padding: 20,
          }}>
            <div style={{ fontSize: 11, color: casino.secondary, letterSpacing: 3, textAlign: 'center', marginBottom: 18 }}>
              • • •  SHOWROOM VÉHICULES  • • •
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {VEHICLES.map(v => {
                const hasIt = ownedVeh.includes(v.id);
                const canAfford = balance >= v.price;
                const isEquipped = equippedVeh === v.id;
                return (
                  <div key={v.id} style={{
                    background: 'linear-gradient(180deg, #1a1a20, #0d0d12)',
                    border: `1px solid ${isEquipped ? casino.secondary : '#2a2a34'}`,
                    borderRadius: 12, padding: 16, textAlign: 'center',
                    boxShadow: isEquipped ? `0 0 20px ${casino.secondary}55` : '0 6px 18px rgba(0,0,0,.55)',
                  }} data-testid={`shop-vehicle-${v.id}`}>
                    {/* Spotlit pedestal */}
                    <div style={{
                      background: 'radial-gradient(ellipse at 50% 90%, rgba(255,240,200,.22), transparent 70%)',
                      padding: '14px 6px 6px', borderRadius: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 100,
                    }}>
                      <VehicleGraphic id={v.id} />
                    </div>
                    <div style={{
                      height: 8,
                      background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,.45), transparent 70%)',
                      marginBottom: 6,
                    }}/>
                    <div style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{v.name}</div>
                    <div style={{ color: '#cca366', fontSize: 11, fontStyle: 'italic', margin: '4px 0' }}>{v.desc}</div>
                    <div style={{ color: casino.secondary, fontSize: 12, marginBottom: 10 }}>
                      Vitesse ×{v.speedMul}
                    </div>
                    {hasIt ? (
                      <button onClick={() => onEquipVehicle(isEquipped ? null : v.id)}
                        data-testid={`shop-equip-vehicle-${v.id}`}
                        style={{
                          padding: '10px 16px', width: '100%',
                          background: isEquipped ? 'linear-gradient(135deg, #00ff88, #00aa44)' : 'rgba(255,255,255,0.08)',
                          color: isEquipped ? '#000' : '#fff',
                          border: `1px solid ${casino.secondary}`, borderRadius: 8,
                          cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold',
                        }}>
                        {isEquipped ? '✓ ÉQUIPÉ' : 'Équiper'}
                      </button>
                    ) : (
                      <button onClick={() => onBuyVehicle(v)} disabled={!canAfford}
                        data-testid={`shop-buy-vehicle-${v.id}`}
                        style={{
                          padding: '10px 16px', width: '100%',
                          background: canAfford ? `linear-gradient(135deg, ${casino.primary}, ${casino.accent})` : '#444',
                          color: '#fff', border: 'none', borderRadius: 8,
                          cursor: canAfford ? 'pointer' : 'not-allowed',
                          fontFamily: 'inherit', fontWeight: 'bold',
                        }}>
                        {canAfford ? `${fmt(v.price)} B` : 'TROP CHER'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ textAlign: 'center', fontSize: 11, color: '#888', marginTop: 14, fontStyle: 'italic' }}>
              Marche = 1× • Skateboard = 2× • Vélo Benz Turbo = 3×
            </div>
          </div>
        )}

        <button onClick={onClose} style={{
          width: '100%', marginTop: 16, padding: 12,
          background: 'transparent', border: `1px solid ${casino.secondary}`,
          color: casino.secondary, borderRadius: 8,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>Fermer</button>
      </div>
    </div>
  );
};

// ============== VEHICLE GRAPHIC ==============
const VehicleGraphic = ({ id }) => {
  if (id === 'skateboard') {
    return (
      <svg viewBox="0 0 200 80" width="200" height="80">
        <ellipse cx="100" cy="65" rx="70" ry="4" fill="rgba(0,0,0,.5)" />
        <rect x="20" y="40" width="160" height="10" rx="5" fill="#d4af37" stroke="#7a5e1a" />
        <circle cx="40" cy="58" r="7" fill="#111" stroke="#555" strokeWidth="2" />
        <circle cx="160" cy="58" r="7" fill="#111" stroke="#555" strokeWidth="2" />
        <rect x="30" y="34" width="30" height="6" fill="#b42a2a" opacity=".8" />
        <text x="100" y="47" textAnchor="middle" fill="#1a1a1a" fontSize="9" fontWeight="700">BENZ</text>
      </svg>
    );
  }
  if (id === 'bike') {
    return (
      <svg viewBox="0 0 220 100" width="220" height="100">
        <ellipse cx="110" cy="85" rx="90" ry="5" fill="rgba(0,0,0,.5)" />
        <circle cx="50" cy="70" r="22" fill="none" stroke="#d4af37" strokeWidth="3" />
        <circle cx="170" cy="70" r="22" fill="none" stroke="#d4af37" strokeWidth="3" />
        <circle cx="50" cy="70" r="5" fill="#d4af37" />
        <circle cx="170" cy="70" r="5" fill="#d4af37" />
        <path d="M50 70 L110 40 L170 70 M110 40 L90 70 Z" stroke="#f4d46b" strokeWidth="3" fill="none" />
        <path d="M110 40 L130 25 L150 25" stroke="#f4d46b" strokeWidth="3" fill="none" />
        <rect x="105" y="35" width="20" height="4" fill="#0b0b0b" />
      </svg>
    );
  }
  return <div style={{ fontSize: 60 }}>🚗</div>;
};

// ============== ATM - 1 retrait max par cycle de 5 min ==============
const ATM = ({ profile, balance, setBalance, saveProfile, setProfile, onClose, casino }) => {
  const [countdown, setCountdown] = useState('');
  const [phase, setPhase] = useState('check');

  const now = Date.now();
  const FIVE_MIN = 5 * 60 * 1000;
  const lastCycleStart = profile.atmCycleStart || 0;
  const withdrawsThisCycle = profile.atmWithdrawsThisCycle || 0;
  const cycleAge = now - lastCycleStart;

  // Si le cycle a plus de 5 min → reset
  let nbLeft, nextAmount, cycleResetIn;
  if (lastCycleStart === 0 || cycleAge >= FIVE_MIN) {
    // Nouveau cycle : 1 retrait possible
    nbLeft = 1;
    nextAmount = 15000;
    cycleResetIn = 0;
  } else {
    nbLeft = Math.max(0, 1 - withdrawsThisCycle);
    nextAmount = 15000;
    cycleResetIn = lastCycleStart + FIVE_MIN - now;
  }

  useEffect(() => {
    if (nbLeft > 0) return;
    const update = () => {
      const remaining = lastCycleStart + FIVE_MIN - Date.now();
      if (remaining <= 0) { setCountdown('Disponible !'); return; }
      const m = Math.floor(remaining / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setCountdown(`${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [nbLeft, lastCycleStart]);

  const handleWithdraw = async () => {
    setPhase('withdrawing');
    const amount = nextAmount;
    const isNewCycle = lastCycleStart === 0 || cycleAge >= FIVE_MIN;
    setTimeout(async () => {
      setBalance(b => b + amount);
      const updated = {
        ...profile,
        balance: balance + amount,
        atmCycleStart: isNewCycle ? Date.now() : lastCycleStart,
        atmWithdrawsThisCycle: isNewCycle ? 1 : withdrawsThisCycle + 1,
      };
      setProfile(updated);
      await saveProfile(updated);
      setPhase('done');
    }, 1500);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20,
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #0a2a0a, #051a05)',
        border: '3px solid #00aa44', borderRadius: 12,
        padding: 24, maxWidth: 440, width: '100%',
        fontFamily: 'Georgia, serif',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>🏧</div>
          <h2 style={{ color: '#00ff88', margin: 0, letterSpacing: 2 }}>DISTRIBUTEUR</h2>
          <div style={{ color: '#cca366', fontSize: 11, fontStyle: 'italic', marginTop: 4 }}>
            1 retrait max par cycle de 5 min
          </div>
        </div>

        {phase === 'check' && (
          <>
            {nbLeft > 0 ? (
              <div style={{
                background: 'rgba(0,0,0,0.5)',
                border: `2px solid ${nextAmount === 40000 ? '#ffd700' : '#00aa44'}`,
                borderRadius: 8, padding: 16, marginBottom: 12, textAlign: 'center',
                boxShadow: nextAmount === 40000 ? '0 0 20px rgba(255,215,0,0.3)' : 'none',
              }}>
                <div style={{ color: nextAmount === 40000 ? '#ffd700' : '#cca366', fontSize: 12, marginBottom: 4 }}>
                  {nextAmount === 40000 ? '💎 2ÈME RETRAIT DU CYCLE' : 'RETRAIT DISPONIBLE'}
                </div>
                <div style={{ color: '#00ff88', fontSize: 30, fontWeight: 'bold' }}>
                  {fmt(nextAmount)} €
                </div>
                <div style={{ color: '#cca366', fontSize: 11, margin: '6px 0' }}>↓ conversion 1:1 ↓</div>
                <div style={{ color: '#ffd700', fontSize: 30, fontWeight: 'bold' }}>
                  {fmt(nextAmount)} B
                </div>
                <button onClick={handleWithdraw} style={{
                  width: '100%', marginTop: 12, padding: 12,
                  background: nextAmount === 40000
                    ? 'linear-gradient(135deg, #ffd700, #b8860b)'
                    : 'linear-gradient(135deg, #00ff88, #00aa44)',
                  color: '#000', border: 'none', borderRadius: 8,
                  fontSize: 16, fontWeight: 'bold', cursor: 'pointer',
                  fontFamily: 'inherit',
                }}>RETIRER {fmt(nextAmount)} B</button>
                <div style={{ fontSize: 10, color: '#888', marginTop: 8, fontStyle: 'italic' }}>
                  {nbLeft} retrait(s) restant(s) dans ce cycle
                  {lastCycleStart > 0 && cycleAge < FIVE_MIN && (
                    <><br/>Cycle se termine dans {Math.ceil((FIVE_MIN - cycleAge) / 60000)} min</>
                  )}
                </div>
              </div>
            ) : (
              <div style={{
                background: 'rgba(0,0,0,0.5)', padding: 16, borderRadius: 8,
                textAlign: 'center', marginBottom: 12,
              }}>
                <div style={{ color: '#cca366', fontSize: 13, marginBottom: 6 }}>
                  Tu as déjà retiré 1 fois dans ce cycle
                </div>
                <div style={{ color: '#cca366', fontSize: 12, marginBottom: 4 }}>
                  Nouveau retrait dans :
                </div>
                <div style={{ color: '#ffd700', fontSize: 28, fontWeight: 'bold' }}>{countdown}</div>
              </div>
            )}
          </>
        )}

        {phase === 'withdrawing' && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💵</div>
            <div style={{ color: '#ffd700', fontSize: 16 }}>Traitement en cours...</div>
            <div style={{ marginTop: 16 }}>
              <div style={{
                width: 200, height: 4, margin: '0 auto',
                background: '#333', borderRadius: 2, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', background: 'linear-gradient(90deg, #00ff88, #ffd700)',
                  animation: 'atmLoad 1.5s linear forwards',
                }} />
              </div>
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>✓</div>
            <div style={{ color: '#00ff88', fontSize: 18, fontWeight: 'bold' }}>
              Retrait effectué !
            </div>
            <div style={{ color: '#cca366', fontSize: 12, marginTop: 8 }}>
              Solde : {fmt(balance)} B
            </div>
          </div>
        )}

        <button onClick={onClose} style={{
          width: '100%', marginTop: 8, padding: 10,
          background: 'transparent', border: '1px solid #888',
          color: '#888', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
        }}>Fermer</button>
      </div>
      <style>{`
        @keyframes atmLoad {
          from { width: 0; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};


// ============== ÉCRAN TROPHÉES COMPLET ==============
const TrophyScreen = ({ profile, casino, onClose }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 20, overflowY: 'auto',
    fontFamily: 'Georgia, serif',
  }}>
    <div style={{
      background: 'linear-gradient(145deg, #1a0f05, #0a0503)',
      border: `3px solid ${casino.secondary}`, borderRadius: 12,
      padding: 24, maxWidth: 500, width: '100%',
      maxHeight: '90vh', overflowY: 'auto',
      boxShadow: `0 0 40px ${casino.secondary}44`,
    }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div>
        <h2 style={{ color: casino.secondary, margin: 0, letterSpacing: 2 }}>
          TES TROPHÉES
        </h2>
        <div style={{ color: '#cca366', fontSize: 12, marginTop: 6, fontStyle: 'italic' }}>
          Gains cumulés : <strong style={{color: '#ffd700'}}>{fmt(profile.totalWinnings)} B</strong>
        </div>
      </div>

      {TROPHIES.map((t) => {
        const earned = profile.totalWinnings >= t.threshold;
        const progress = Math.min(100, (profile.totalWinnings / t.threshold) * 100);
        return (
          <div key={t.name} style={{
            padding: 14, marginBottom: 10,
            background: earned ? `${t.color}22` : 'rgba(255,255,255,0.03)',
            border: `2px solid ${earned ? t.color : '#333'}`,
            borderRadius: 10,
            opacity: earned ? 1 : 0.6,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                fontSize: 36,
                filter: earned ? 'drop-shadow(0 0 10px ' + t.color + ')' : 'grayscale(1)',
              }}>{t.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: earned ? t.color : '#888', fontWeight: 'bold', fontSize: 16 }}>
                  {t.name} {earned && '✓'}
                </div>
                <div style={{ color: '#888', fontSize: 11 }}>
                  {fmt(t.threshold)} B cumulés
                </div>
                <div style={{ color: earned ? '#00ff88' : '#666', fontSize: 11, marginTop: 2 }}>
                  Récompense : +{fmt(t.reward)} B
                </div>
              </div>
            </div>
            {!earned && (
              <div style={{
                background: '#222', height: 6, borderRadius: 3, marginTop: 8, overflow: 'hidden',
              }}>
                <div style={{
                  width: `${progress}%`, height: '100%',
                  background: `linear-gradient(90deg, ${t.color}, #fff)`,
                }} />
              </div>
            )}
          </div>
        );
      })}

      <button onClick={onClose} style={{
        width: '100%', marginTop: 10, padding: 12,
        background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
        color: '#fff', border: 'none', borderRadius: 8,
        fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit',
        fontSize: 14,
      }}>Fermer</button>
    </div>
  </div>
);

// ============== TROPHÉE DÉBLOQUÉ ==============
const TrophyUnlock = ({ trophy, onClose }) => (
  <div onClick={onClose} style={{
    position: 'fixed', top: 20, left: '50%',
    transform: 'translateX(-50%)',
    background: `linear-gradient(135deg, ${trophy.color}, ${trophy.color}88)`,
    border: '2px solid #fff', borderRadius: 12, padding: 16,
    color: '#000', fontFamily: 'Georgia, serif',
    boxShadow: '0 0 40px ' + trophy.color,
    zIndex: 2000, animation: 'trophyPop 0.5s ease-out',
    display: 'flex', alignItems: 'center', gap: 12,
    maxWidth: '90vw', cursor: 'pointer',
  }}>
    <div style={{ fontSize: 40 }}>{trophy.icon}</div>
    <div>
      <div style={{ fontSize: 12, opacity: 0.7 }}>TROPHÉE DÉBLOQUÉ !</div>
      <div style={{ fontSize: 20, fontWeight: 'bold' }}>{trophy.name}</div>
      <div style={{ fontSize: 11 }}>+{fmt(trophy.reward)} B bonus !</div>
    </div>
  </div>
);

// ============== ÉCRAN PERSONNALISATION PERSONNAGE ==============
const CharacterScreen = ({ profile, balance, setBalance, saveProfile, setProfile, onDone, casino }) => {
  const [tab, setTab] = useState('hair');
  const ownedHair = profile.ownedHair || [0, 1, 2];
  const ownedOutfit = profile.ownedOutfit || [0, 1, 2];
  const ownedShoes = profile.ownedShoes || [0, 1, 2];
  const curHair = profile.hair !== undefined ? profile.hair : 0;
  const curOutfit = profile.outfit !== undefined ? profile.outfit : 0;
  const curShoes = profile.shoes !== undefined ? profile.shoes : 0;
  const curSkin = profile.skin || '#e0b48a';

  const cat = tab === 'hair' ? HAIR_CATALOG : tab === 'outfit' ? OUTFIT_CATALOG : SHOES_CATALOG;
  const owned = tab === 'hair' ? ownedHair : tab === 'outfit' ? ownedOutfit : ownedShoes;
  const curIdx = tab === 'hair' ? curHair : tab === 'outfit' ? curOutfit : curShoes;

  const selectItem = async (item) => {
    const isOwned = owned.includes(item.id);
    if (isOwned) {
      // Just equip
      const patch = tab === 'hair' ? { hair: item.id }
                 : tab === 'outfit' ? { outfit: item.id }
                 : { shoes: item.id };
      const p = { ...profile, ...patch };
      setProfile(p); await saveProfile(p);
      return;
    }
    if (balance < item.price) {
      alert('Solde insuffisant');
      return;
    }
    setBalance(balance - item.price);
    const newOwned = [...owned, item.id];
    const patch = tab === 'hair' ? { hair: item.id, ownedHair: newOwned }
               : tab === 'outfit' ? { outfit: item.id, ownedOutfit: newOwned }
               : { shoes: item.id, ownedShoes: newOwned };
    const p = { ...profile, ...patch, balance: balance - item.price };
    setProfile(p); await saveProfile(p);
  };

  const setSkin = async (c) => {
    const p = { ...profile, skin: c };
    setProfile(p); await saveProfile(p);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'linear-gradient(180deg, #1a0a1f 0%, #050105 100%)',
      overflow: 'auto', padding: 16, fontFamily: 'Georgia, serif',
      zIndex: 100, color: '#fff',
    }} data-testid="character-screen">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 12, opacity: .7 }}>Solde : <b>{fmt(balance)} B</b></div>
        <h2 style={{ margin: 0, color: casino.secondary, letterSpacing: 3, fontSize: 22 }}>Personnalisation</h2>
        <button onClick={onDone} data-testid="char-done-btn" style={{
          padding: '10px 20px',
          background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
          color: '#fff', border: 'none', borderRadius: 8,
          cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold',
        }}>Entrer dans le casino →</button>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* Preview */}
        <div style={{
          background: 'rgba(0,0,0,0.5)', border: `1px solid ${casino.secondary}`,
          borderRadius: 12, padding: 20, minWidth: 240, textAlign: 'center',
        }}>
          <div style={{ color: '#cca366', fontSize: 11, letterSpacing: 2, marginBottom: 10 }}>APERÇU</div>
          <AvatarPreview hair={curHair} outfit={curOutfit} shoes={curShoes} skin={curSkin} size={180} />
          <div style={{ fontSize: 14, marginTop: 10, color: casino.secondary, fontWeight: 'bold' }}>
            {profile.name}
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ color: '#cca366', fontSize: 11, marginBottom: 6 }}>Teint</div>
            <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
              {['#f2d3b0', '#e0b48a', '#b98259', '#8a5a35', '#5e3a20', '#3a2310'].map(c => (
                <div key={c}
                  onClick={() => setSkin(c)}
                  data-testid={`char-skin-${c}`}
                  style={{
                    width: 26, height: 26, borderRadius: 13, background: c,
                    cursor: 'pointer',
                    border: curSkin === c ? `2px solid ${casino.secondary}` : '1px solid #444',
                  }} />
              ))}
            </div>
          </div>
        </div>

        {/* Tabs + Grid */}
        <div style={{ flex: 1, minWidth: 320, maxWidth: 720 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {[['hair','Cheveux'],['outfit','Vêtements'],['shoes','Chaussures']].map(([k,l]) => (
              <button key={k}
                onClick={() => setTab(k)}
                data-testid={`char-tab-${k}`}
                style={{
                  padding: '10px 18px',
                  background: tab === k ? `linear-gradient(135deg, ${casino.primary}, ${casino.accent})` : 'rgba(255,255,255,0.05)',
                  color: tab === k ? '#fff' : '#cca366',
                  border: `1px solid ${tab === k ? casino.secondary : '#333'}`,
                  borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold',
                }}>{l}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 10 }}>
            {cat.map(item => {
              const isOwned = owned.includes(item.id);
              const isActive = curIdx === item.id;
              return (
                <div key={item.id}
                  onClick={() => selectItem(item)}
                  data-testid={`char-item-${tab}-${item.id}`}
                  style={{
                    background: 'rgba(0,0,0,0.45)',
                    border: `2px solid ${isActive ? casino.secondary : '#333'}`,
                    borderRadius: 10, padding: 10, textAlign: 'center', cursor: 'pointer',
                    boxShadow: isActive ? `0 0 15px ${casino.secondary}55` : 'none',
                  }}>
                  <div style={{ height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AvatarPreview
                      hair={tab === 'hair' ? item.id : curHair}
                      outfit={tab === 'outfit' ? item.id : curOutfit}
                      shoes={tab === 'shoes' ? item.id : curShoes}
                      skin={curSkin}
                      size={80}
                    />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 'bold', marginTop: 4 }}>{item.name}</div>
                  <div style={{ fontSize: 11, marginTop: 4, opacity: .85 }}>
                    {isOwned
                      ? (isActive ? <span style={{color: casino.secondary}}>✓ Équipé</span> : 'Possédé')
                      : item.price === 0 ? 'Gratuit' : `💰 ${fmt(item.price)}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============== AVATAR PREVIEW (SVG) ==============
const AvatarPreview = ({ hair = 0, outfit = 0, shoes = 0, skin = '#e0b48a', size = 100 }) => {
  const hairItem = HAIR_CATALOG[hair] || HAIR_CATALOG[0];
  const outfitItem = OUTFIT_CATALOG[outfit] || OUTFIT_CATALOG[0];
  const shoesItem = SHOES_CATALOG[shoes] || SHOES_CATALOG[0];
  const w = size; const h = size * 1.5;

  let hairPath;
  switch (hair) {
    case 1: hairPath = <path d="M27 25 Q40 17 53 25 L53 28 Q40 24 27 28 Z" fill={hairItem.color} opacity=".8" />; break;
    case 2: hairPath = <g><circle cx="30" cy="20" r="7" fill={hairItem.color} /><circle cx="40" cy="16" r="8" fill={hairItem.color} /><circle cx="50" cy="20" r="7" fill={hairItem.color} /></g>; break;
    case 3: hairPath = <g><path d="M26 22 Q40 8 54 22 L54 30 Q40 24 26 30 Z" fill={hairItem.color} /><rect x="26" y="28" width="3" height="16" fill={hairItem.color} /><rect x="54" y="28" width="3" height="16" fill={hairItem.color} /></g>; break;
    case 4: hairPath = <g><path d="M26 22 Q40 10 54 22 L54 30 Q40 26 26 30 Z" fill={hairItem.color} /><circle cx="40" cy="14" r="5" fill={hairItem.color} /></g>; break;
    case 5: hairPath = <g><path d="M36 6 L44 6 L46 22 L34 22 Z" fill={hairItem.color} /><path d="M28 22 Q40 18 52 22 L52 28 Q40 26 28 28 Z" fill="#1a1a1a" /></g>; break;
    case 6: hairPath = <path d="M22 24 Q40 6 58 24 L58 34 Q40 26 22 34 Z" fill={hairItem.color} />; break;
    case 7: hairPath = <path d="M24 22 Q40 6 56 22 L58 34 Q40 24 22 34 Z" fill={hairItem.color} />; break;
    case 8: hairPath = <g><path d="M22 24 Q40 4 58 24 L58 34 Q40 26 22 34 Z" fill={hairItem.color} /><circle cx="30" cy="16" r="2" fill="#fff" opacity=".6" /></g>; break;
    case 9: hairPath = <g><path d="M22 24 Q40 4 58 24 L58 34 Q40 24 22 34 Z" fill={hairItem.color} /><circle cx="40" cy="10" r="2" fill="#fff" /></g>; break;
    default: hairPath = <path d="M26 22 Q40 8 54 22 L54 30 Q40 24 26 30 Z" fill={hairItem.color} />;
  }

  return (
    <svg viewBox="0 0 80 120" width={w} height={h}>
      <ellipse cx="40" cy="116" rx="20" ry="3" fill="rgba(0,0,0,.35)" />
      <rect x="28" y="78" width="10" height="30" rx="3" fill={outfitItem.color} />
      <rect x="42" y="78" width="10" height="30" rx="3" fill={outfitItem.color} />
      <rect x="26" y="104" width="14" height="8" rx="3" fill={shoesItem.color} />
      <rect x="40" y="104" width="14" height="8" rx="3" fill={shoesItem.color} />
      <rect x="22" y="46" width="36" height="36" rx="8" fill={outfitItem.color} />
      <rect x="12" y="48" width="10" height="28" rx="5" fill={outfitItem.color} />
      <rect x="58" y="48" width="10" height="28" rx="5" fill={outfitItem.color} />
      <circle cx="17" cy="78" r="5" fill={skin} />
      <circle cx="63" cy="78" r="5" fill={skin} />
      <circle cx="40" cy="30" r="14" fill={skin} />
      {hairPath}
      <circle cx="35" cy="30" r="1.3" fill="#111" />
      <circle cx="45" cy="30" r="1.3" fill="#111" />
      <path d="M35 36 Q40 39 45 36" stroke="#6b2b2b" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  );
};

// ============== APP PRINCIPALE ==============

// ============== CHANGEMENT DE CASINO ==============
const ChangeCasinoScreen = ({ currentCasino, onChoose, onCancel }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1500, padding: 20, overflowY: 'auto',
    fontFamily: 'Georgia, serif',
  }}>
    <div style={{
      background: 'linear-gradient(145deg, #2a1a0a, #0a0503)',
      border: '2px solid #ffd700', borderRadius: 14,
      padding: 24, maxWidth: 700, width: '100%',
      maxHeight: '90vh', overflowY: 'auto',
    }}>
      <h2 style={{
        color: '#ffd700', textAlign: 'center', margin: 0, marginBottom: 8,
        letterSpacing: 3, textShadow: '0 0 15px #ffd700',
      }}>🌍 CHANGER DE CASINO</h2>
      <div style={{ color: '#cca366', fontSize: 13, textAlign: 'center', marginBottom: 20, fontStyle: 'italic' }}>
        Ton solde et ta progression sont conservés
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
      }}>
        {Object.entries(CASINOS).map(([id, c]) => {
          const isCurrent = id === currentCasino;
          return (
            <button key={id}
              onClick={() => !isCurrent && onChoose(id)}
              disabled={isCurrent}
              style={{
                padding: 16,
                background: isCurrent
                  ? 'rgba(100,100,100,0.3)'
                  : `linear-gradient(135deg, ${c.primary}33, ${c.accent}33)`,
                border: isCurrent ? '2px solid #666' : `2px solid ${c.primary}`,
                borderRadius: 10, cursor: isCurrent ? 'not-allowed' : 'pointer',
                color: isCurrent ? '#888' : '#fff',
                fontFamily: 'inherit',
                opacity: isCurrent ? 0.5 : 1,
                transition: 'transform 0.15s',
              }}
              onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.transform = 'scale(1.03)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <div style={{ fontSize: 26, marginBottom: 4 }}>{c.country}</div>
              <div style={{ fontWeight: 'bold', fontSize: 13 }}>{c.name}</div>
              <div style={{ fontSize: 10, opacity: 0.8, fontStyle: 'italic', marginTop: 4 }}>
                {c.tagline}
              </div>
              <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 6 }}>
                {c.flag.map((col, i) => (
                  <div key={i} style={{
                    width: 14, height: 6, background: col,
                    borderRadius: 1, border: '0.5px solid rgba(0,0,0,0.2)',
                  }} />
                ))}
              </div>
              {isCurrent && (
                <div style={{ color: '#ffd700', fontSize: 11, fontWeight: 'bold', marginTop: 8 }}>
                  ✓ Actuel
                </div>
              )}
            </button>
          );
        })}
      </div>

      <button onClick={onCancel} style={{
        width: '100%', marginTop: 16, padding: 10,
        background: 'transparent', border: '1px solid #888',
        color: '#888', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
      }}>Annuler</button>
    </div>
  </div>
);


// ============== SÉLECTEUR DE TABLE VIP ==============
const TableSelector = ({ gameId, balance, casino, onCancel, onChoose }) => {
  const gameName = { blackjack: '🃏 BLACKJACK', roulette: '🎡 ROULETTE', highcard: '🎴 CARTE HAUTE', poker: '♠ POKER HOLDEM' }[gameId];
  const tables = [
    { label: 'Classique', min: 20, color: '#888', chipNote: 'Jetons 5 → 500' },
    { label: 'VIP Silver', min: 5000, color: '#c0c0c0', chipNote: 'Plaquettes 5K → 500K' },
    { label: 'VIP Gold', min: 30000, color: '#ffd700', chipNote: 'Plaquettes 10K → 1M' },
    { label: 'VIP Platinum', min: 100000, color: '#e5e4e2', chipNote: 'Plaquettes 50K → 5M' },
    { label: 'VIP Diamond', min: 1000000, color: '#b9f2ff', chipNote: 'Plaquettes 100K → 10M' },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1500, padding: 20, fontFamily: 'Georgia, serif',
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #1a0a0a, #0a0503)',
        border: `3px solid ${casino.secondary}`, borderRadius: 14,
        padding: 24, maxWidth: 500, width: '100%',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 22, color: casino.secondary, letterSpacing: 2 }}>
            {gameName}
          </div>
          <div style={{ color: '#cca366', fontSize: 12, fontStyle: 'italic', marginTop: 4 }}>
            Choisis ta table — Solde : {fmt(balance)} B
          </div>
        </div>

        {tables.map((t, i) => {
          const canAfford = balance >= t.min;
          return (
            <button key={i}
              onClick={() => canAfford && onChoose(t.min)}
              disabled={!canAfford}
              style={{
                width: '100%', padding: 14, marginBottom: 10,
                background: canAfford
                  ? `linear-gradient(135deg, ${t.color}33, ${t.color}11)`
                  : 'rgba(50,50,50,0.3)',
                border: `2px solid ${canAfford ? t.color : '#444'}`,
                color: '#fff', borderRadius: 10,
                cursor: canAfford ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
                textAlign: 'left', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', gap: 12,
                opacity: canAfford ? 1 : 0.4,
              }}>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: 16, color: canAfford ? t.color : '#888' }}>
                  {t.min >= 5000 && '💎 '}{t.label}
                </div>
                <div style={{ fontSize: 11, color: '#cca366', marginTop: 2 }}>
                  {t.chipNote}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#888' }}>Min.</div>
                <div style={{ fontSize: 15, color: canAfford ? casino.secondary : '#666', fontWeight: 'bold' }}>
                  {fmt(t.min)} B
                </div>
              </div>
            </button>
          );
        })}

        <button onClick={onCancel} style={{
          width: '100%', marginTop: 8, padding: 10,
          background: 'transparent', border: '1px solid #888',
          color: '#888', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
        }}>Annuler</button>
      </div>
    </div>
  );
};


export default function Casino() {
  const [screen, setScreen] = useState('loading');
  const [savedProfiles, setSavedProfiles] = useState([]);
  const [profile, setProfile] = useState(null);
  const [casino, setCasino] = useState(CASINOS.vegas);
  const [balance, setBalance] = useState(500);
  const [minBet, setMinBet] = useState(20);
  const [showWheel, setShowWheel] = useState(false);
  const [showTrophies, setShowTrophies] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showATM, setShowATM] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const [showToilet, setShowToilet] = useState(false);
  const [showBenzBet, setShowBenzBet] = useState(false);
  const [showChangeCasino, setShowChangeCasino] = useState(false);
  const [selectedWeapon, setSelectedWeapon] = useState(null);
  const [unlockedTrophy, setUnlockedTrophy] = useState(null);
  const [dealerSplats, setDealerSplats] = useState([]);
  const [flyingProjectile, setFlyingProjectile] = useState(null);
  const [dealerDead, setDealerDead] = useState(false);
  const [dealerShot, setDealerShot] = useState(false);
  const [bloodStreams, setBloodStreams] = useState([]);
  const [currentDealer, setCurrentDealer] = useState(DEALER_PROFILES[0]);

  // Charger profils
  useEffect(() => {
    (async () => {
      try {
        const profiles = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('profile:')) {
            try {
              const value = localStorage.getItem(key);
              if (value) profiles.push(JSON.parse(value));
            } catch (e) {}
          }
        }
        setSavedProfiles(profiles);
      } catch (e) {}
      setScreen('login');
    })();
  }, []);

  const saveProfile = async (p) => {
    try {
      localStorage.setItem(`profile:${p.name}`, JSON.stringify(p));
    } catch (e) {}
  };

  const handleLogin = async (name, isNew, casinoId) => {
    let p;
    if (isNew) {
      p = {
        name, casino: casinoId,
        balance: 500, totalWinnings: 0, sessions: 0,
        createdAt: Date.now(), unlockedTrophies: [],
        weapons: [],
        vehicles: [], equippedVehicle: null,
        ownedHair: [0,1,2], ownedOutfit: [0,1,2], ownedShoes: [0,1,2],
        hair: 0, outfit: 0, shoes: 0, skin: '#e0b48a',
        customized: false,
        lastWheelSpin: 0, lastWithdraw: 0,
      };
    } else {
      p = savedProfiles.find(s => s.name === name);
    }
    p.sessions = (p.sessions || 0) + 1;
    setCasino(CASINOS[p.casino] || CASINOS.vegas);
    setProfile(p);
    setBalance(p.balance || 500);
    await saveProfile(p);
    // Nouveau joueur non-personnalisé -> écran de personnalisation
    if (isNew || !p.customized) {
      setScreen('character');
    } else {
      setScreen('lobby');
      // Ouvre la roue à la connexion si disponible
      if (canSpinWheel(p)) {
        setTimeout(() => setShowWheel(true), 500);
      }
    }
  };

  const canSpinWheel = (p) => !p.lastWheelSpin || (Date.now() - p.lastWheelSpin >= FOUR_HOURS);
  const canWithdraw = (p) => !p.lastWithdraw || (Date.now() - p.lastWithdraw >= FOUR_HOURS);

  const handleLogout = async () => {
    if (profile) {
      const p = { ...profile, balance };
      await saveProfile(p);
    }
    setProfile(null);
    setScreen('login');
    try {
      const profiles = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('profile:')) {
          try {
            const value = localStorage.getItem(key);
            if (value) profiles.push(JSON.parse(value));
          } catch (e) {}
        }
      }
      setSavedProfiles(profiles);
    } catch (e) {}
  };

  const handleWheelComplete = async (value) => {
    const newBalance = balance + value;
    setBalance(newBalance);
    const newProfile = {
      ...profile,
      balance: newBalance,
      totalWinnings: profile.totalWinnings + value,
      lastWheelSpin: Date.now(),
    };
    if (value > 0) await checkTrophies(newProfile);
    setProfile(newProfile);
    await saveProfile(newProfile);
    setShowWheel(false);
  };

  const handleWithdraw = async () => {
    const newBalance = balance + 15000;
    setBalance(newBalance);
    const newProfile = {
      ...profile,
      balance: newBalance,
      lastWithdraw: Date.now(),
    };
    setProfile(newProfile);
    await saveProfile(newProfile);
    setShowATM(false);
  };

  const handleBuyWeapon = async (weapon) => {
    if (balance < weapon.price) return;
    const newBalance = balance - weapon.price;
    setBalance(newBalance);
    const newProfile = {
      ...profile,
      balance: newBalance,
      weapons: [...(profile.weapons || []), weapon.id],
    };
    setProfile(newProfile);
    await saveProfile(newProfile);
  };

  const handleBuyVehicle = async (vehicle) => {
    if (balance < vehicle.price) return;
    if ((profile.vehicles || []).includes(vehicle.id)) return;
    const newBalance = balance - vehicle.price;
    setBalance(newBalance);
    const newProfile = {
      ...profile,
      balance: newBalance,
      vehicles: [...(profile.vehicles || []), vehicle.id],
      equippedVehicle: vehicle.id, // auto-equip on purchase
    };
    setProfile(newProfile);
    await saveProfile(newProfile);
  };

  const handleEquipVehicle = async (vehicleId) => {
    const newProfile = { ...profile, equippedVehicle: vehicleId };
    setProfile(newProfile);
    await saveProfile(newProfile);
  };

  const checkTrophies = async (p) => {
    const current = p.unlockedTrophies || [];
    for (const t of TROPHIES) {
      if (p.totalWinnings >= t.threshold && !current.includes(t.name)) {
        p.unlockedTrophies = [...current, t.name];
        p.balance = (p.balance || 0) + t.reward;
        p.totalWinnings = p.totalWinnings + t.reward;
        setBalance(p.balance);
        setUnlockedTrophy(t);
        setTimeout(() => setUnlockedTrophy(null), 5000);
        break; // Un à la fois pour ne pas spammer
      }
    }
  };

  const handleBalanceChange = async (newBalOrFn) => {
    const newBal = typeof newBalOrFn === 'function' ? newBalOrFn(balance) : newBalOrFn;
    const diff = newBal - balance;
    setBalance(newBal);
    if (diff > 0 && profile) {
      const newProfile = {
        ...profile,
        balance: newBal,
        totalWinnings: profile.totalWinnings + diff,
      };
      await checkTrophies(newProfile);
      setProfile(newProfile);
      await saveProfile(newProfile);
    } else if (profile) {
      const newProfile = { ...profile, balance: newBal };
      setProfile(newProfile);
      await saveProfile(newProfile);
    }
  };

  // Quand le joueur clique sur une table dans le lobby 3D, on ouvre le modal de choix VIP
  const [pendingGame, setPendingGame] = useState(null);
  
  const handleSelectGame = (game, vip, minBetVal) => {
    // Si on passe juste le game, on ouvre le modal de sélection
    if (vip === undefined && minBetVal === undefined) {
      setPendingGame(game);
      return;
    }
    if (balance < minBetVal) {
      alert(`Solde insuffisant. Minimum requis : ${fmt(minBetVal)} B`);
      return;
    }
    setMinBet(minBetVal);
    setScreen(game);
    resetDealer();
    setPendingGame(null);
  };

  const resetDealer = () => {
    setDealerSplats([]);
    setDealerDead(false);
    setDealerShot(false);
    setBloodStreams([]);
    setCurrentDealer(DEALER_PROFILES[Math.floor(Math.random() * DEALER_PROFILES.length)]);
  };

  const handleExitGame = async () => {
    // Save
    if (profile) {
      const p = { ...profile, balance };
      await saveProfile(p);
      setProfile(p);
    }
    setScreen('lobby');
    resetDealer();
  };

  const handleProjectile = (type) => {
    if (flyingProjectile || dealerDead) return;
    setFlyingProjectile({
      type,
      onComplete: () => {
        const x = 30 + Math.random() * 40;
        const y = 25 + Math.random() * 30;
        setDealerSplats((prev) => [...prev, { id: Date.now() + Math.random(), type, x, y }]);
        // Ajout de gouttes de sang réalistes
        setBloodStreams((prev) => [
          ...prev,
          { x: x - 2 + Math.random() * 4, y: y + 5, width: 3 + Math.random() * 3, height: 30 + Math.random() * 30, duration: 1.5 + Math.random(), delay: 0.2 },
          { x: x + Math.random() * 6, y: y + 8, width: 2 + Math.random() * 3, height: 20 + Math.random() * 25, duration: 1.8, delay: 0.4 },
        ]);
        setFlyingProjectile(null);
      },
    });
  };

  const handleUseWeapon = (weaponId) => {
    if (flyingProjectile || dealerDead) return;
    const projType = weaponId === 'gun' || weaponId === 'shotgun' ? (weaponId === 'shotgun' ? 'shotgun_shot' : 'bullet')
                   : weaponId === 'bazooka' ? 'rocket'
                   : weaponId;
    
    setFlyingProjectile({
      type: projType,
      onComplete: () => {
        setFlyingProjectile(null);
        
        // Impact selon arme
        if (weaponId === 'bazooka') {
          setDealerSplats(prev => [...prev, 
            { id: Date.now(), type: 'explosion', x: 50, y: 50 },
          ]);
        } else {
          setDealerShot(true);
          setDealerSplats(prev => [...prev, 
            { id: Date.now(), type: 'wound', x: 50, y: 38 },
          ]);
        }
        
        // Gros flots de sang
        setBloodStreams([
          { x: 40 + Math.random() * 20, y: 40, width: 5, height: 60, duration: 2, delay: 0.1 },
          { x: 35 + Math.random() * 30, y: 42, width: 4, height: 50, duration: 2.5, delay: 0.3 },
          { x: 45 + Math.random() * 15, y: 45, width: 6, height: 70, duration: 3, delay: 0.5 },
          { x: 38 + Math.random() * 25, y: 48, width: 3, height: 45, duration: 2.2, delay: 0.7 },
        ]);
        
        setDealerDead(true);
        
        // Nouveau croupier après 3s
        setTimeout(() => {
          resetDealer();
        }, 3000);
      },
    });
  };

  if (screen === 'loading') {
    return (
      <div style={{
        minHeight: '100vh', background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#ffd700', fontFamily: 'Georgia, serif', fontSize: 24,
      }}>Chargement du casino...</div>
    );
  }

  const wheelReady = profile && canSpinWheel(profile);
  const withdrawReady = profile && canWithdraw(profile);
  const nextWheelTime = profile ? (profile.lastWheelSpin || 0) + FOUR_HOURS : 0;
  const nextWithdrawTime = profile ? (profile.lastWithdraw || 0) + FOUR_HOURS : 0;

  const gameProps = {
    balance, setBalance: handleBalanceChange, minBet,
    onExit: handleExitGame, casino,
    chooseWeapon: handleUseWeapon,
    dealerProfile: currentDealer,
    dealerSplats, flyingProjectile, bloodStreams,
    dealerDead, dealerShot,
    onProjectile: handleProjectile,
    weapons: profile ? profile.weapons || [] : [],
  };

  return (
    <>
      <style>{`
        @keyframes cardDeal {
          from { transform: translate(-300px, -200px) rotate(-360deg); opacity: 0; }
          to { transform: translate(0,0) rotate(0); opacity: 1; }
        }
        @keyframes throwProjectile {
          0% { bottom: 20px; left: 50%; transform: translateX(-50%) rotate(0deg) scale(1); opacity: 1; }
          50% { bottom: 50%; transform: translateX(-50%) rotate(360deg) scale(1.3); opacity: 1; }
          100% { bottom: 75%; left: 50%; transform: translateX(-50%) rotate(720deg) scale(0.3); opacity: 0; }
        }
        @keyframes bulletFly {
          0% { bottom: 40px; transform: translateX(-50%); opacity: 1; }
          100% { bottom: 70%; transform: translateX(-50%) scale(0.3); opacity: 0; }
        }
        @keyframes rocketFly {
          0% { bottom: 20px; transform: translateX(-50%); opacity: 1; }
          90% { bottom: 65%; transform: translateX(-50%); opacity: 1; }
          100% { bottom: 70%; transform: translateX(-50%) scale(2); opacity: 0; }
        }
        @keyframes knifeFly {
          0% { bottom: 20px; transform: translateX(-50%) rotate(0deg); opacity: 1; }
          100% { bottom: 72%; transform: translateX(-50%) rotate(1080deg) scale(0.3); opacity: 0; }
        }
        @keyframes splatGrow {
          0% { transform: scale(0.2); opacity: 0; }
          60% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes explosion {
          0% { transform: scale(0.1); opacity: 1; }
          50% { transform: scale(2); opacity: 1; }
          100% { transform: scale(3); opacity: 0; }
        }
        @keyframes bloodFlow {
          0% { height: 0; opacity: 1; transform: scaleY(0); transform-origin: top; }
          100% { height: var(--final-height); opacity: 0.85; transform: scaleY(1); }
        }
        @keyframes messagePulse {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes chipDrop {
          from { transform: translateY(-20px) scale(0); }
          to { transform: translateY(0) scale(1); }
        }
        @keyframes prizeReveal {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes trophyPop {
          0% { transform: translateX(-50%) scale(0) rotate(-20deg); }
          70% { transform: translateX(-50%) scale(1.1) rotate(5deg); }
          100% { transform: translateX(-50%) scale(1) rotate(0); }
        }
        @keyframes tableShimmer {
          0% { left: -100%; }
          100% { left: 150%; }
        }
        @keyframes spinLights {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 1; box-shadow: 0 0 15px #ffd700, 0 0 30px #ff8; }
          50% { opacity: 0.6; box-shadow: 0 0 8px #ffd700; }
        }
        @keyframes peeDrop {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(60px); opacity: 0; }
        }
        @keyframes peeStream {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 0.7; }
        }
        @keyframes drinkPose {
          0% { transform: translateX(-50%) rotate(0deg); }
          40% { transform: translateX(-50%) rotate(-40deg); }
          70% { transform: translateX(-50%) rotate(-50deg); }
          100% { transform: translateX(-50%) rotate(-20deg); }
        }
        @keyframes canThrow {
          0% { transform: translateX(0) translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateX(0) translateY(-200px) rotate(720deg); opacity: 0; }
        }
        @keyframes neonPulse {
          0%, 100% { text-shadow: 0 0 20px #ff00aa, 0 0 40px #ff00aa; }
          50% { text-shadow: 0 0 30px #ff00aa, 0 0 60px #ff00aa, 0 0 80px #ff00aa; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes slashAnim {
          0% { transform: translateX(-20%) rotate(-8deg) skewY(-8deg); opacity: 0; }
          15% { opacity: 1; }
          70% { transform: translateX(20%) rotate(-8deg) skewY(-8deg); opacity: 1; }
          100% { transform: translateX(40%) rotate(-8deg) skewY(-8deg); opacity: 0; }
        }
      `}</style>

      {screen === 'login' && (
        <LoginScreen onLogin={handleLogin} savedProfiles={savedProfiles} />
      )}

      {screen === 'character' && profile && (
        <CharacterScreen
          profile={profile}
          balance={balance}
          setBalance={handleBalanceChange}
          saveProfile={saveProfile}
          setProfile={setProfile}
          casino={casino}
          onDone={async () => {
            const p = { ...profile, customized: true };
            setProfile(p);
            await saveProfile(p);
            setScreen('lobby');
            if (canSpinWheel(p)) setTimeout(() => setShowWheel(true), 500);
          }}
        />
      )}

      {pendingGame && (
        <TableSelector
          gameId={pendingGame}
          balance={balance}
          casino={casino}
          onCancel={() => setPendingGame(null)}
          onChoose={(min) => handleSelectGame(pendingGame, min >= 5000, min)}
        />
      )}

      {screen === 'lobby' && profile && (
        <Lobby3D
          profile={profile}
          casino={casino}
          casinoId={profile.casino}
          balance={balance}
          onSelectGame={(tableId) => handleSelectGame(tableId)}
          onLogout={handleLogout}
          onOpenTrophies={() => setShowTrophies(true)}
          onOpenShop={() => setShowShop(true)}
          onOpenATM={() => setShowATM(true)}
          onOpenWheel={() => setShowWheel(true)}
          onOpenBar={() => setShowBar(true)}
          onOpenToilet={() => setShowToilet(true)}
          onOpenBenzBet={() => setShowBenzBet(true)}
          walletReady={withdrawReady}
          wheelReady={wheelReady}
          weapons={profile.weapons || []}
          selectedWeapon={selectedWeapon}
          setSelectedWeapon={setSelectedWeapon}
          onShoot={() => {}}
          onChangeCasino={() => setShowChangeCasino(true)}
          onOpenCharacter={() => setScreen('character')}
          onToggleVehicle={handleEquipVehicle}
        />
      )}

      {screen === 'blackjack' && <BlackjackGame {...gameProps} />}
      {screen === 'roulette' && <RouletteGame {...gameProps} />}
      {screen === 'highcard' && <HighCardGame {...gameProps} />}
      {screen === 'poker' && <PokerGame {...gameProps} />}

      {showWheel && (
        <FortuneWheel3D 
          onComplete={handleWheelComplete} 
          onClose={() => setShowWheel(false)}
          canSpin={wheelReady}
          nextSpinTime={nextWheelTime}
          casino={casino}
        />
      )}

      {showTrophies && profile && (
        <TrophyScreen profile={profile} casino={casino} onClose={() => setShowTrophies(false)} />
      )}

      {showShop && profile && (
        <Shop profile={profile} balance={balance} casino={casino}
          onBuy={handleBuyWeapon}
          onBuyVehicle={handleBuyVehicle}
          onEquipVehicle={handleEquipVehicle}
          onClose={() => setShowShop(false)} />
      )}

      {showATM && profile && (
        <ATM profile={profile} balance={balance} setBalance={handleBalanceChange}
          saveProfile={saveProfile} setProfile={setProfile}
          casino={casino} onClose={() => setShowATM(false)} />
      )}

      {showBar && profile && (
        <BarScreen balance={balance} setBalance={handleBalanceChange}
          onExit={() => setShowBar(false)} casino={casino} />
      )}

      {showToilet && (
        <ToiletScreen onExit={() => setShowToilet(false)} casino={casino} />
      )}

      {showBenzBet && profile && (
        <BenzBetScreen
          balance={balance}
          setBalance={handleBalanceChange}
          weapons={profile.weapons || []}
          username={profile.name}
          onExit={() => setShowBenzBet(false)}
          casino={casino}
        />
      )}

      {showChangeCasino && profile && (
        <ChangeCasinoScreen
          currentCasino={profile.casino}
          onChoose={async (newCasinoId) => {
            const updated = { ...profile, casino: newCasinoId, balance };
            setProfile(updated);
            setCasino(CASINOS[newCasinoId]);
            await saveProfile(updated);
            setShowChangeCasino(false);
          }}
          onCancel={() => setShowChangeCasino(false)}
        />
      )}

      {unlockedTrophy && (
        <TrophyUnlock trophy={unlockedTrophy} onClose={() => setUnlockedTrophy(null)} />
      )}
    </>
  );
}
