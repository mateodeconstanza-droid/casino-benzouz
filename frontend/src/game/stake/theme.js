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

// Denominations de jetons standard (valeurs BenzCoins)
// Couleurs inspirées des jetons de casino (white/red/green/black/purple/orange)
export const STAKE_CHIPS = [
  { v: 1,       color: '#f5f5f5', accent: '#555',    text: '1',     ink: '#222' },
  { v: 5,       color: '#d63131', accent: '#fff',    text: '5',     ink: '#fff' },
  { v: 25,      color: '#2aab4e', accent: '#fff',    text: '25',    ink: '#fff' },
  { v: 100,     color: '#1a1a1a', accent: '#8b6914', text: '100',   ink: '#ffd700' },
  { v: 500,     color: '#7a3ac5', accent: '#fff',    text: '500',   ink: '#fff' },
  { v: 1000,    color: '#e68a00', accent: '#fff',    text: '1K',    ink: '#fff' },
  { v: 5000,    color: '#0a6fc2', accent: '#fff',    text: '5K',    ink: '#fff' },
  { v: 25000,   color: '#ff66c4', accent: '#fff',    text: '25K',   ink: '#fff' },
  { v: 100000,  color: '#ffd700', accent: '#8b6914', text: '100K',  ink: '#111' },
];

// Choisit le set de jetons selon la mise minimale (table normale / VIP / high-roller)
export const chipsForMin = (minBet = 1) => {
  if (minBet >= 1000000) return STAKE_CHIPS.filter(c => c.v >= 1000);
  if (minBet >= 100000)  return STAKE_CHIPS.filter(c => c.v >= 100);
  if (minBet >= 5000)    return STAKE_CHIPS.filter(c => c.v >= 25);
  return STAKE_CHIPS.slice(0, 7);
};
