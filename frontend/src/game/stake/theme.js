// Palette commune "Stake-like" pour Blackjack / Roulette / Poker
export const STAKE = {
  // Feutre
  feltDark:   '#0f2a42',
  feltMid:    '#16375a',
  feltLight:  '#1d4a79',
  // Bordures + accents
  gold:       '#d4af37',
  goldLight:  '#f0d26a',
  goldDark:   '#8b6914',
  // Bouton rouge/actions
  accentRed:  '#e00e1a',
  // Texte
  ink:        '#f7f8fb',
  inkSoft:    '#a8b4c5',
  // Backgrounds rack / panneaux
  panel:      '#0a1c2d',
  rail:       '#0a1421',
  // EN DIRECT badge cyan
  liveCyan:   '#3fe6ff',
};

// Denominations de jetons standard (valeurs Dollars)
// Couleurs inspirées des jetons de casino + plaquettes VIP haut de gamme
export const STAKE_CHIPS = [
  { v: 1,        color: '#f5f5f5', accent: '#555',    text: '1',     ink: '#222' },
  { v: 5,        color: '#d63131', accent: '#fff',    text: '5',     ink: '#fff' },
  { v: 25,       color: '#2aab4e', accent: '#fff',    text: '25',    ink: '#fff' },
  { v: 100,      color: '#1a1a1a', accent: '#8b6914', text: '100',   ink: '#ffd700' },
  { v: 500,      color: '#7a3ac5', accent: '#fff',    text: '500',   ink: '#fff' },
  { v: 1000,     color: '#e68a00', accent: '#fff',    text: '1K',    ink: '#fff' },
  { v: 5000,     color: '#0a6fc2', accent: '#fff',    text: '5K',    ink: '#fff' },
  { v: 25000,    color: '#ff66c4', accent: '#fff',    text: '25K',   ink: '#fff' },
  { v: 100000,   color: '#ffd700', accent: '#8b6914', text: '100K',  ink: '#111' },
  { v: 500000,   color: '#3fe6ff', accent: '#0066aa', text: '500K',  ink: '#003355' },
  { v: 1000000,  color: '#ffe9a8', accent: '#8b6914', text: '1M',    ink: '#3a2a05' },
  // ★ PLAQUETTES VIP — design platinium/diamant/onyx
  { v: 5000000,  color: '#e0e6f0', accent: '#3fe6ff', text: '5M',    ink: '#0a1a2a', vip: true },
  { v: 10000000, color: '#cccccc', accent: '#ffd700', text: '10M',   ink: '#0a0a0a', vip: true },
  { v: 50000000, color: '#1a1a1a', accent: '#ffd700', text: '50M',   ink: '#ffd700', vip: true },
];

// Choisit le set de jetons selon la mise minimale (table normale / VIP / high-roller)
export const chipsForMin = (minBet = 1) => {
  if (minBet >= 5000000) return STAKE_CHIPS.filter(c => c.v >= 500000);   // VIP plaquettes
  if (minBet >= 1000000) return STAKE_CHIPS.filter(c => c.v >= 1000 && c.v <= 50000000);
  if (minBet >= 100000)  return STAKE_CHIPS.filter(c => c.v >= 100 && c.v <= 5000000);
  if (minBet >= 5000)    return STAKE_CHIPS.filter(c => c.v >= 25 && c.v <= 1000000);
  return STAKE_CHIPS.slice(0, 7);
};
