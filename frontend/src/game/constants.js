// Centralised game constants. Data-only, no React.

// ============== CASINOS THÉMATIQUES ==============
export const CASINOS = {
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
export const TROPHIES = [
  { threshold: 10000, name: 'Bronze', icon: '🥉', color: '#cd7f32', reward: 500 },
  { threshold: 50000, name: 'Argent', icon: '🥈', color: '#c0c0c0', reward: 2500 },
  { threshold: 150000, name: 'Or', icon: '🥇', color: '#ffd700', reward: 7500 },
  { threshold: 500000, name: 'Platine', icon: '💎', color: '#e5e4e2', reward: 25000 },
  { threshold: 1500000, name: 'Diamant', icon: '💠', color: '#b9f2ff', reward: 75000 },
  { threshold: 5000000, name: 'Légende', icon: '👑', color: '#ff6b9d', reward: 250000 },
  { threshold: 15000000, name: 'Mythique', icon: '🏆', color: '#ff0080', reward: 750000 },
];

// ============== ARMES ==============
export const WEAPONS = [
  { id: 'knife',        name: 'Couteau tactique',       price: 20000,   damage: 'léger',       desc: 'Lame Ka-Bar affûtée',                    type: 'melee' },
  { id: 'machete',      name: 'Machette',               price: 40000,   damage: 'moyen',       desc: 'Lame lourde 45cm',                       type: 'melee' },
  { id: 'gun',          name: 'Pistolet 9mm',           price: 60000,   damage: 'fort',        desc: 'Glock 17, 17 coups',                     type: 'gun' },
  { id: 'shotgun',      name: 'Fusil à pompe',          price: 80000,   damage: 'très fort',   desc: 'Remington 870 cal.12',                   type: 'gun' },
  { id: 'bazooka',      name: 'Bazooka RPG',            price: 100000,  damage: 'massif',      desc: 'Lance-roquettes RPG-7 (explosion 3m)',   type: 'rocket' },
  { id: 'flamethrower', name: 'Lance-flammes',          price: 2500000, damage: 'dévastateur', desc: 'M2 avec 5L de napalm',                   type: 'flame' },
  // ===== 5 NOUVELLES ARMES =====
  { id: 'throwknife',   name: 'Couteau de lancer',      price: 75000,   damage: 'moyen',       desc: 'Set de 6 lames à lancer — silencieux',   type: 'throwable',  projectile: 'blade' },
  { id: 'crossbow',     name: 'Arbalète tactique',      price: 220000,  damage: 'fort',        desc: 'Carreaux d\'acier, portée 30m',          type: 'projectile', projectile: 'bolt' },
  { id: 'uzi',          name: 'UZI Benz Or',            price: 400000,  damage: 'fort',        desc: 'Auto 950 rpm, chargeur 32 coups',        type: 'auto',       projectile: 'bullet' },
  { id: 'grenade',      name: 'Grenades frag',          price: 600000,  damage: 'massif',      desc: 'M67 — explosion 3m, fragments',          type: 'throwable',  projectile: 'grenade' },
  { id: 'laserrifle',   name: 'Fusil laser prototype',  price: 3500000, damage: 'dévastateur', desc: 'Rayon instantané, traverse tout',        type: 'laser',      projectile: 'laser' },
];

// ============== VÉHICULES ==============
// Marche = 1x, Skateboard = 2x, Vélo = 3x
export const VEHICLES = [
  { id: 'skateboard', name: 'Skateboard Benz', price: 1000000,  speedMul: 2,   emoji: '🛹', desc: 'Plateau carbone, roues uréthane – 2× plus rapide qu\'à pied' },
  { id: 'bike',       name: 'Vélo Benz Turbo',  price: 5000000,  speedMul: 3,   emoji: '🚴', desc: 'Cadre titane, assistance secrète – 3× plus rapide qu\'à pied' },
  { id: 'hoverboard', name: 'Overboard Benz',   price: 25000000, speedMul: 4.2, emoji: '🛸', desc: 'Lévitation magnétique, propulseurs LED – 4× plus rapide qu\'à pied' },
];

// ============== CATALOGUE PERSONNALISATION PERSONNAGE ==============
// 10 coupes de cheveux (3 gratuits + 7 payants)
export const HAIR_CATALOG = [
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
// Vêtements — catalogue étendu avec tenues de marque et maillots de foot
export const OUTFIT_CATALOG = [
  { id: 0,  name: 'T-shirt blanc',       price: 0,        color: '#f1ead0' },
  { id: 1,  name: 'Survêt noir',          price: 0,        color: '#1a1a1a' },
  { id: 2,  name: 'Jean & chemise',       price: 0,        color: '#2a3a68' },
  { id: 3,  name: 'Blouson cuir',         price: 30000,    color: '#1c1c1e' },
  { id: 4,  name: 'Costume business',     price: 120000,   color: '#14141a' },
  { id: 5,  name: 'Smoking casino',       price: 250000,   color: '#0b0b0b' },
  { id: 6,  name: 'Survêt or',            price: 180000,   color: '#d4af37' },
  { id: 7,  name: 'Veste militaire',      price: 60000,    color: '#425c2a' },
  { id: 8,  name: 'Kimono urbain',        price: 90000,    color: '#8b1f2b' },
  { id: 9,  name: 'Manteau fourrure',     price: 900000,   color: '#3a2a18' },
  // Nouveaux skins demandés
  { id: 10, name: 'Louis Vuittonz',       price: 10000000, color: '#5a3a1e', accent: '#d4af37', pattern: 'LV', tag: 'LUXE' },
  { id: 11, name: 'Costume cravate',       price: 300000,   color: '#181820', accent: '#8b1a2e', tag: 'ÉLÉGANT' },
  { id: 12, name: 'Maillot PSG',          price: 2000000,  color: '#1e3a8a', accent: '#b01a3c', tag: 'FOOT' },
  { id: 13, name: 'Maillot Real Madrid',  price: 2000000,  color: '#f4f4f4', accent: '#ffd700', tag: 'FOOT' },
  { id: 14, name: 'Maillot FC Barcelone', price: 2000000,  color: '#a41c3b', accent: '#1e3a8a', tag: 'FOOT' },
];
// Nouveaux shorts (3 de football + 2 de ville)
export const SHORT_CATALOG = [
  { id: 0, name: 'Short PSG',           price: 50000, color: '#1e3a8a', accent: '#b01a3c', tag: 'FOOT' },
  { id: 1, name: 'Short Real Madrid',   price: 50000, color: '#f4f4f4', accent: '#ffd700', tag: 'FOOT' },
  { id: 2, name: 'Short FC Barcelone',  price: 50000, color: '#a41c3b', accent: '#1e3a8a', tag: 'FOOT' },
  { id: 3, name: 'Short ville noir',    price: 50000, color: '#1a1a1a', accent: '#cca366' },
  { id: 4, name: 'Short beige',         price: 50000, color: '#c7a97a', accent: '#1a1a1a' },
];
// 10 chaussures (3 gratuites + 7 payantes)
export const SHOES_CATALOG = [
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
export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const RANK_VALUE = { A: 14, K: 13, Q: 12, J: 11, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 };

export const createDeck = () => {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, id: `${rank}${suit}-${Math.random()}` });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

export const bjValue = (card) => {
  if (['J', 'Q', 'K'].includes(card.rank)) return 10;
  if (card.rank === 'A') return 11;
  return parseInt(card.rank);
};

export const handValue = (hand) => {
  let total = hand.reduce((s, c) => s + bjValue(c), 0);
  let aces = hand.filter((c) => c.rank === 'A').length;
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
};

// ============== ROULETTE NUMBERS ==============
export const ROULETTE_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
  16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];
export const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
export const getColor = (n) => (n === 0 ? 'green' : RED_NUMBERS.includes(n) ? 'red' : 'black');

// ============== WHEEL PRIZES ==============
export const WHEEL_PRIZES = [
  { label: '200', value: 200, color: '#2d5016', weight: 40 },
  { label: '5000', value: 5000, color: '#4a7c2e', weight: 25 },
  { label: 'RIEN', value: 0, color: '#1a1a1a', weight: 20 },
  { label: '15000', value: 15000, color: '#8b0000', weight: 10 },
  { label: '100000', value: 100000, color: '#d4af37', weight: 4 },
  { label: 'JACKPOT', value: 1000000, color: '#ff0080', weight: 1 },
];

// ============== HELPERS ==============
export const fmt = (n) => n.toLocaleString('fr-FR');
export const FOUR_HOURS = 4 * 60 * 60 * 1000;

// ============== CROUPIERS VARIÉS ==============
export const DEALER_PROFILES = [
  { id: 'marco', name: 'Marco', skin: '#e8b896', hair: '#2a1810', eyes: '#4a2c1a', beard: true, glasses: false, gender: 'm' },
  { id: 'antonio', name: 'Antonio', skin: '#c9936a', hair: '#1a0e08', eyes: '#2a1808', beard: false, glasses: true, gender: 'm' },
  { id: 'sophia', name: 'Sophia', skin: '#f0c9a6', hair: '#4a2818', eyes: '#3a5828', beard: false, glasses: false, gender: 'f' },
  { id: 'viktor', name: 'Viktor', skin: '#d4a888', hair: '#8a6820', eyes: '#2a3a58', beard: true, glasses: false, gender: 'm' },
  { id: 'elena', name: 'Elena', skin: '#e8c0a0', hair: '#1a0a04', eyes: '#5a3a20', beard: false, glasses: true, gender: 'f' },
  { id: 'jamal', name: 'Jamal', skin: '#8b5a3c', hair: '#0a0603', eyes: '#1a0a04', beard: true, glasses: false, gender: 'm' },
  { id: 'aisha', name: 'Aisha', skin: '#a07858', hair: '#0a0603', eyes: '#3a2010', beard: false, glasses: false, gender: 'f' },
  { id: 'hiroshi', name: 'Hiroshi', skin: '#e8c698', hair: '#0a0603', eyes: '#2a1810', beard: false, glasses: true, gender: 'm' },
];

// ============== COULEURS 3D POUR CHAQUE CASINO ==============
export const CASINO_3D_COLORS = {
  vegas:     { wall: 0x3a0a1a, floor: 0x1a0a0a, ceiling: 0x1a0008, carpet: 0x6a0018, light: 0xff0040 },
  malta:     { wall: 0x3a1010, floor: 0x2a0505, ceiling: 0x180303, carpet: 0x5a0808, light: 0xcf142b },
  barcelona: { wall: 0x3a2010, floor: 0x2a1808, ceiling: 0x1a1004, carpet: 0x6a3010, light: 0xf1bf00 },
  prague:    { wall: 0x0f2040, floor: 0x081428, ceiling: 0x050a1a, carpet: 0x11457e, light: 0x4a7bc0 },
  monaco:    { wall: 0x2a0808, floor: 0x180404, ceiling: 0x0a0202, carpet: 0x4a1010, light: 0xd4af37 },
  jonzac:    { wall: 0x0f2050, floor: 0x0a1530, ceiling: 0x050a20, carpet: 0x0055a4, light: 0xef4135 },
};

// ============== BENZBET - PARIS SPORTIFS ==============
// ============== BASES DE DONNÉES SPORTIVES AVEC FORCES RÉALISTES ==============
// Chaque équipe/joueur a un ELO secret (50..100) utilisé pour calculer les vraies
// probabilités. Les cotes affichées dérivent de ces probas + marge bookmaker 6%.

// FOOTBALL — top clubs européens
export const FOOT_CLUBS = [
  { name: 'Real Madrid', elo: 96 }, { name: 'Man City', elo: 95 }, { name: 'Bayern Munich', elo: 93 },
  { name: 'PSG', elo: 92 }, { name: 'Liverpool', elo: 91 }, { name: 'Arsenal', elo: 90 },
  { name: 'Barcelone', elo: 90 }, { name: 'Inter Milan', elo: 88 }, { name: 'Atlético Madrid', elo: 87 },
  { name: 'Chelsea', elo: 85 }, { name: 'Juventus', elo: 84 }, { name: 'Milan AC', elo: 84 },
  { name: 'Naples', elo: 83 }, { name: 'Leverkusen', elo: 82 }, { name: 'Borussia Dortmund', elo: 82 },
  { name: 'Tottenham', elo: 81 }, { name: 'Atalanta', elo: 79 }, { name: 'Benfica', elo: 78 },
  { name: 'Porto', elo: 77 }, { name: 'Aston Villa', elo: 76 }, { name: 'Man United', elo: 78 },
  { name: 'Newcastle', elo: 76 }, { name: 'AS Roma', elo: 76 }, { name: 'OM', elo: 74 },
  { name: 'Lyon', elo: 72 }, { name: 'Monaco', elo: 73 }, { name: 'Lille', elo: 71 },
  { name: 'Lazio', elo: 73 }, { name: 'Feyenoord', elo: 72 }, { name: 'RB Leipzig', elo: 79 },
];

// BASKETBALL — équipes NBA avec ELO (champions récents > milieu de tableau)
export const NBA_TEAMS = [
  { name: 'Celtics', elo: 93 }, { name: 'Nuggets', elo: 91 }, { name: 'Thunder', elo: 90 },
  { name: 'Mavericks', elo: 88 }, { name: 'Timberwolves', elo: 88 }, { name: 'Bucks', elo: 86 },
  { name: 'Suns', elo: 84 }, { name: 'Knicks', elo: 85 }, { name: '76ers', elo: 84 },
  { name: 'Heat', elo: 82 }, { name: 'Warriors', elo: 82 }, { name: 'Lakers', elo: 80 },
  { name: 'Clippers', elo: 81 }, { name: 'Kings', elo: 78 }, { name: 'Pacers', elo: 82 },
  { name: 'Cavaliers', elo: 85 }, { name: 'Pelicans', elo: 76 }, { name: 'Grizzlies', elo: 75 },
  { name: 'Bulls', elo: 70 }, { name: 'Hawks', elo: 72 }, { name: 'Magic', elo: 77 },
  { name: 'Rockets', elo: 76 }, { name: 'Nets', elo: 68 }, { name: 'Raptors', elo: 69 },
  { name: 'Jazz', elo: 66 }, { name: 'Spurs', elo: 68 }, { name: 'Blazers', elo: 64 },
  { name: 'Pistons', elo: 62 }, { name: 'Hornets', elo: 63 }, { name: 'Wizards', elo: 60 },
];

// TENNIS — Top 40 ATP avec ELO
export const TENNIS_PLAYERS = [
  { name: 'Sinner', elo: 95 }, { name: 'Alcaraz', elo: 94 }, { name: 'Djokovic', elo: 91 },
  { name: 'Zverev', elo: 88 }, { name: 'Medvedev', elo: 85 }, { name: 'Fritz', elo: 84 },
  { name: 'De Minaur', elo: 81 }, { name: 'Rublev', elo: 82 }, { name: 'Ruud', elo: 82 },
  { name: 'Dimitrov', elo: 80 }, { name: 'Hurkacz', elo: 80 }, { name: 'Tsitsipas', elo: 79 },
  { name: 'Rune', elo: 78 }, { name: 'Paul', elo: 77 }, { name: 'Musetti', elo: 77 },
  { name: 'Shelton', elo: 76 }, { name: 'Humbert', elo: 74 }, { name: 'Khachanov', elo: 73 },
  { name: 'Tiafoe', elo: 75 }, { name: 'Popyrin', elo: 72 }, { name: 'Mensik', elo: 71 },
  { name: 'Berrettini', elo: 76 }, { name: 'Korda', elo: 72 }, { name: 'Bublik', elo: 71 },
  { name: 'Auger-Aliassime', elo: 75 }, { name: 'Fils', elo: 73 }, { name: 'Cobolli', elo: 70 },
  { name: 'Shapovalov', elo: 71 }, { name: 'Cerundolo', elo: 70 }, { name: 'Baez', elo: 69 },
  { name: 'Lehecka', elo: 72 }, { name: 'Nakashima', elo: 69 }, { name: 'Monfils', elo: 68 },
];

// MMA — fighters UFC
export const MMA_FIGHTERS = [
  { name: 'Jon Jones', elo: 96 }, { name: 'Islam Makhachev', elo: 94 }, { name: 'Alex Pereira', elo: 91 },
  { name: 'Ilia Topuria', elo: 90 }, { name: 'Leon Edwards', elo: 87 }, { name: 'Dricus du Plessis', elo: 88 },
  { name: 'Tom Aspinall', elo: 89 }, { name: 'Merab Dvalishvili', elo: 87 }, { name: 'Alexandre Pantoja', elo: 85 },
  { name: 'Max Holloway', elo: 85 }, { name: 'Charles Oliveira', elo: 83 }, { name: 'Sean O\'Malley', elo: 82 },
  { name: 'Dustin Poirier', elo: 80 }, { name: 'Khamzat Chimaev', elo: 88 }, { name: 'Belal Muhammad', elo: 82 },
  { name: 'Justin Gaethje', elo: 81 }, { name: 'Kamaru Usman', elo: 83 }, { name: 'Robert Whittaker', elo: 82 },
  { name: 'Ciryl Gane', elo: 82 }, { name: 'Alex Volkanovski', elo: 84 }, { name: 'Conor McGregor', elo: 78 },
  { name: 'Paulo Costa', elo: 76 }, { name: 'Sean Strickland', elo: 80 }, { name: 'Stipe Miocic', elo: 75 },
];

// HOCKEY — équipes NHL
export const NHL_TEAMS = [
  { name: 'Panthers', elo: 93 }, { name: 'Oilers', elo: 91 }, { name: 'Rangers', elo: 90 },
  { name: 'Stars', elo: 89 }, { name: 'Avalanche', elo: 88 }, { name: 'Maple Leafs', elo: 86 },
  { name: 'Canucks', elo: 85 }, { name: 'Hurricanes', elo: 86 }, { name: 'Bruins', elo: 84 },
  { name: 'Golden Knights', elo: 83 }, { name: 'Jets', elo: 87 }, { name: 'Lightning', elo: 84 },
  { name: 'Kings', elo: 80 }, { name: 'Capitals', elo: 81 }, { name: 'Predators', elo: 76 },
  { name: 'Wild', elo: 75 }, { name: 'Devils', elo: 76 }, { name: 'Islanders', elo: 74 },
  { name: 'Flyers', elo: 70 }, { name: 'Senators', elo: 73 }, { name: 'Sabres', elo: 70 },
  { name: 'Penguins', elo: 75 }, { name: 'Red Wings', elo: 73 }, { name: 'Canadiens', elo: 70 },
  { name: 'Ducks', elo: 66 }, { name: 'Sharks', elo: 62 }, { name: 'Blackhawks', elo: 64 },
  { name: 'Coyotes', elo: 66 }, { name: 'Blues', elo: 72 }, { name: 'Flames', elo: 71 },
];

// RUGBY — nations & clubs
export const RUGBY_TEAMS = [
  { name: 'Nouvelle-Zélande', elo: 95 }, { name: 'Afrique du Sud', elo: 94 }, { name: 'Irlande', elo: 93 },
  { name: 'France', elo: 92 }, { name: 'Angleterre', elo: 88 }, { name: 'Australie', elo: 86 },
  { name: 'Écosse', elo: 84 }, { name: 'Argentine', elo: 84 }, { name: 'Fidji', elo: 82 },
  { name: 'Italie', elo: 75 }, { name: 'Pays de Galles', elo: 80 }, { name: 'Géorgie', elo: 74 },
  { name: 'Toulouse', elo: 91 }, { name: 'Leinster', elo: 90 }, { name: 'La Rochelle', elo: 88 },
  { name: 'Bordeaux', elo: 86 }, { name: 'Racing 92', elo: 85 }, { name: 'Stade Français', elo: 82 },
  { name: 'Clermont', elo: 80 }, { name: 'Lyon LOU', elo: 79 },
];

// FORMULE 1 — pilotes
export const F1_DRIVERS = [
  { name: 'Verstappen', elo: 96 }, { name: 'Lando Norris', elo: 91 }, { name: 'Charles Leclerc', elo: 90 },
  { name: 'Oscar Piastri', elo: 89 }, { name: 'Carlos Sainz', elo: 86 }, { name: 'George Russell', elo: 85 },
  { name: 'Lewis Hamilton', elo: 86 }, { name: 'Fernando Alonso', elo: 82 }, { name: 'Sergio Pérez', elo: 78 },
  { name: 'Pierre Gasly', elo: 74 }, { name: 'Nico Hülkenberg', elo: 73 }, { name: 'Esteban Ocon', elo: 72 },
  { name: 'Yuki Tsunoda', elo: 72 }, { name: 'Alex Albon', elo: 71 }, { name: 'Daniel Ricciardo', elo: 69 },
  { name: 'Lance Stroll', elo: 68 }, { name: 'Kevin Magnussen', elo: 67 }, { name: 'Logan Sargeant', elo: 58 },
  { name: 'Zhou Guanyu', elo: 63 }, { name: 'Valtteri Bottas', elo: 66 },
];

// ESPORTS — équipes CS2 / LoL
export const ESPORT_TEAMS = [
  { name: 'NAVI', elo: 93 }, { name: 'FaZe Clan', elo: 91 }, { name: 'Vitality', elo: 92 },
  { name: 'G2 Esports', elo: 90 }, { name: 'Team Spirit', elo: 89 }, { name: 'MOUZ', elo: 86 },
  { name: 'Complexity', elo: 78 }, { name: 'Astralis', elo: 82 }, { name: 'Heroic', elo: 80 },
  { name: 'Liquid', elo: 78 }, { name: 'T1', elo: 95 }, { name: 'Gen.G', elo: 90 },
  { name: 'JDG', elo: 89 }, { name: 'BLG', elo: 88 }, { name: 'Hanwha Life', elo: 86 },
  { name: 'Fnatic', elo: 84 }, { name: 'Cloud9', elo: 76 }, { name: '100 Thieves', elo: 72 },
  { name: 'KT Rolster', elo: 81 }, { name: 'DRX', elo: 79 }, { name: 'Eternal Fire', elo: 77 },
  { name: 'paiN Gaming', elo: 74 }, { name: 'Furia', elo: 82 }, { name: 'GamerLegion', elo: 75 },
];

export const BENZBET_SPORTS = [
  { id: 'foot', label: 'Football', icon: '⚽', pool: FOOT_CLUBS, draw: true, leagues: ['Ligue des Champions', 'Premier League', 'Liga', 'Serie A', 'Bundesliga', 'Ligue 1'], entity: 'Club', pointUnit: 'pts' },
  { id: 'nba', label: 'Basket NBA', icon: '🏀', pool: NBA_TEAMS, draw: false, leagues: ['NBA Regular Season', 'NBA Playoffs'], entity: 'Équipe', pointUnit: 'pts' },
  { id: 'tennis', label: 'Tennis ATP', icon: '🎾', pool: TENNIS_PLAYERS, draw: false, leagues: ['Grand Chelem', 'ATP 1000', 'ATP 500'], entity: 'Joueur', pointUnit: 'pts ATP' },
  { id: 'mma', label: 'MMA / UFC', icon: '🥊', pool: MMA_FIGHTERS, draw: false, leagues: ['UFC PPV', 'UFC Fight Night'], entity: 'Combattant', pointUnit: 'pts UFC' },
  { id: 'hockey', label: 'Hockey NHL', icon: '🏒', pool: NHL_TEAMS, draw: false, leagues: ['NHL Regular', 'Stanley Cup'], entity: 'Équipe', pointUnit: 'pts' },
  { id: 'rugby', label: 'Rugby', icon: '🏉', pool: RUGBY_TEAMS, draw: true, leagues: ['Top 14', 'Tournoi des 6 Nations', 'Champions Cup'], entity: 'Équipe', pointUnit: 'pts WR' },
  { id: 'f1', label: 'Formule 1', icon: '🏎️', pool: F1_DRIVERS, draw: false, leagues: ['Grand Prix'], entity: 'Pilote', pointUnit: 'pts championnat' },
  { id: 'esport', label: 'Esport', icon: '🎮', pool: ESPORT_TEAMS, draw: false, leagues: ['CS2 Major', 'LoL Worlds', 'BLAST Premier'], entity: 'Équipe', pointUnit: 'pts HLTV' },
];

// ========= CLASSEMENTS — Top 20 par sport avec forme déterministe =========
// Hash déterministe (même résultat entre rechargements → pas de flickering)
const hash32 = (str) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};
const pseudoRand = (seed, n) => {
  // PRNG mulberry32 basique, déterministe à partir d'un seed + index
  let t = (seed + n * 0x6D2B79F5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Convertit ELO (50..100) en points "réalistes" selon le sport
const eloToPoints = (sportId, elo) => {
  switch (sportId) {
    case 'foot':   return Math.round((elo - 40) * 28);          // 280..1680 pts UEFA-like
    case 'nba':    return Math.round(22 + (elo - 50) * 0.85);   // % victoires ≈ 22..65
    case 'tennis': return Math.round((elo - 50) * 260);         // 0..13000 pts ATP
    case 'mma':    return Math.round((elo - 50) * 120);         // 0..6000 pts UFC fict.
    case 'hockey': return Math.round((elo - 50) * 2.4);         // points saison ~20..120
    case 'rugby':  return +((elo - 40) * 1.2).toFixed(2);       // pts World Rugby
    case 'f1':     return Math.round((elo - 50) * 14);          // 0..700 pts championnat
    case 'esport': return Math.round(600 + (elo - 50) * 22);    // pts HLTV 600..1700
    default:       return elo;
  }
};

// Génère une forme réaliste (5 derniers) : V/N/D (ou V/D selon sport)
// Plus l'ELO est élevé → plus de V ; seed stable sur le nom pour éviter les changements.
const computeForm = (sportId, entity) => {
  const seed = hash32(sportId + '|' + entity.name);
  const winProb = Math.max(0.15, Math.min(0.92, (entity.elo - 50) / 50));
  const drawAllowed = sportId === 'foot' || sportId === 'rugby' || sportId === 'hockey';
  const drawProb = drawAllowed ? 0.18 : 0;
  const out = [];
  for (let i = 0; i < 5; i++) {
    const r = pseudoRand(seed, i);
    if (drawAllowed && r < drawProb) out.push('N');
    else if (r < drawProb + winProb * (1 - drawProb)) out.push('V');
    else out.push('D');
  }
  return out;
};

// Top N trié par ELO avec rang, points, forme, tendance (↑/→/↓)
export const getRankings = (sportId, topN = 20) => {
  const sport = BENZBET_SPORTS.find(s => s.id === sportId);
  if (!sport) return [];
  const sorted = [...sport.pool].sort((a, b) => b.elo - a.elo).slice(0, topN);
  return sorted.map((e, i) => {
    const form = computeForm(sportId, e);
    const wins = form.filter(f => f === 'V').length;
    const trend = wins >= 4 ? 'up' : wins <= 1 ? 'down' : 'flat';
    return {
      rank: i + 1,
      name: e.name,
      elo: e.elo,
      points: eloToPoints(sportId, e.elo),
      form,        // ['V','V','D','N','V']
      trend,       // 'up' | 'flat' | 'down'
    };
  });
};

// ===== MOTEUR DE COTES INTELLIGENT =====
// Normalise l'ELO en proba, applique l'avantage du terrain (foot/rugby),
// calcule les cotes avec marge bookmaker de 6% (overround).
const BOOKMAKER_MARGIN = 1.06;

const probaFromElo = (eloA, eloB, homeAdvantage = 0) => {
  // Formule ELO classique adaptée : P(A) = 1 / (1 + 10^((eloB - eloA) / 12))
  const ratingA = eloA + homeAdvantage;
  return 1 / (1 + Math.pow(10, (eloB - ratingA) / 12));
};

// Génère 12 matchs réalistes pour un sport donné avec cotes intelligentes
export const generateMatches = (sportId) => {
  const sport = BENZBET_SPORTS.find(s => s.id === sportId);
  if (!sport) return [];
  const pool = sport.pool;
  const out = [];
  const used = new Set();
  for (let i = 0; i < 12; i++) {
    let a, b, tries = 0;
    do {
      a = pool[Math.floor(Math.random() * pool.length)];
      b = pool[Math.floor(Math.random() * pool.length)];
      tries++;
    } while ((a.name === b.name || used.has(`${a.name}|${b.name}`) || used.has(`${b.name}|${a.name}`)) && tries < 50);
    used.add(`${a.name}|${b.name}`);

    const homeAdv = (sport.id === 'foot' || sport.id === 'rugby' || sport.id === 'hockey') ? 3 : 0;
    const probH = probaFromElo(a.elo, b.elo, homeAdv);
    const probA = 1 - probH;

    let pH, pN, pA;
    if (sport.draw) {
      // Foot/Rugby : ~22-28% de nul selon l'écart ELO (plus d'écart = moins de nul)
      const gap = Math.abs(a.elo - b.elo);
      const drawShare = Math.max(0.15, 0.30 - gap * 0.008);
      pN = drawShare;
      pH = probH * (1 - drawShare);
      pA = probA * (1 - drawShare);
    } else {
      pN = 0;
      pH = probH;
      pA = probA;
    }

    // Cote = (1 / proba) × marge bookmaker, bornée entre 1.02 et 50
    const oddsH = +Math.min(50, Math.max(1.02, BOOKMAKER_MARGIN / pH)).toFixed(2);
    const oddsA = +Math.min(50, Math.max(1.02, BOOKMAKER_MARGIN / pA)).toFixed(2);
    const oddsN = sport.draw ? +Math.min(50, Math.max(1.02, BOOKMAKER_MARGIN / pN)).toFixed(2) : null;

    // Horaire fictif entre 14h et 23h aujourd'hui
    const hour = 14 + Math.floor(Math.random() * 9);
    const min = Math.random() < 0.5 ? 0 : 30;
    const kickoff = `${String(hour).padStart(2, '0')}h${String(min).padStart(2, '0')}`;
    const league = sport.leagues[Math.floor(Math.random() * sport.leagues.length)];

    out.push({
      id: `${sport.id}-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sportId: sport.id,
      sportLabel: sport.label,
      sportIcon: sport.icon,
      league,
      kickoff,
      home: a.name, away: b.name,
      homeElo: a.elo, awayElo: b.elo,
      probH, probN: pN, probA,
      oddsH, oddsN, oddsA,
      hasDraw: sport.draw,
    });
  }
  return out;
};

// Résout un match en utilisant les VRAIES probabilités (pas les cotes)
export const resolveMatch = (match) => {
  const r = Math.random();
  if (match.hasDraw) {
    if (r < match.probH) return 'H';
    if (r < match.probH + match.probN) return 'N';
    return 'A';
  }
  return r < match.probH ? 'H' : 'A';
};

// Clé storage : panier (slip) persistant
export const BENZBET_SLIP_KEY = (name) => `benzbet:${name}:slip`;
export const BENZBET_HISTORY_KEY = (name) => `benzbet:${name}:history`;
export const BENZBET_PENDING_KEY = (name) => `benzbet:${name}:pending`;
// Conservé pour compatibilité
export const BENZBET_MATCHES = generateMatches('foot');
export const BENZBET_KEY = (name) => `benzbet:${name}:activeBet`;

// ============== DURÉE SIMULÉE DES MATCHS (ms) ==============
// Ratio simulation : 1 minute de match = 2 s réelles (cohérent avec BenzBet.jsx)
const MATCH_SIM_RATIO = 2000; // ms par minute de match
export const matchTotalDurationMs = (sportId) => {
  const mins = sportId === 'foot' || sportId === 'rugby' ? 90
             : sportId === 'nba' ? 48
             : sportId === 'f1' ? 90
             : sportId === 'tennis' ? 120
             : sportId === 'mma' ? 25
             : 60;
  return mins * MATCH_SIM_RATIO;
};

// Donne une durée restante (ms) à partir du moment présent avant que le match soit fini
export const legResolveDelayMs = (leg) => {
  const base = matchTotalDurationMs(leg.match?.sportId || 'foot');
  // Si le match est déjà live au moment du pari on enlève sa minute déjà écoulée
  const minuteOffset = (leg.match?._liveMinute || 0) * MATCH_SIM_RATIO;
  // +2s de buffer pour simuler l'annonce
  return Math.max(4000, base - minuteOffset + 2000);
};

// Résolution effective d'un pari en attente (pending) : applique le tirage probabiliste
// sur chaque leg, calcule le payout selon le mode (simple / combiné).
export const resolvePendingBet = (pending) => {
  const resolvedLegs = pending.legs.map(leg => {
    const m = leg.match;
    const realOutcome = resolveMatch({
      hasDraw: m.hasDraw,
      probH: m.probH, probN: m.probN, probA: m.probA,
    });
    return { ...leg, realOutcome, won: realOutcome === leg.pick };
  });
  let payout = 0;
  let status = 'lost';
  if (pending.mode === 'combine') {
    const allWon = resolvedLegs.every(l => l.won);
    if (allWon) {
      payout = Math.floor(pending.stake * pending.totalOdds);
      status = 'won';
    }
  } else {
    payout = resolvedLegs.reduce((acc, l) => acc + (l.won ? Math.floor((pending.stake / pending.legs.length) * l.odds) : 0), 0);
    status = payout > 0 ? (payout >= pending.stake ? 'won' : 'partial') : 'lost';
  }
  return { ...pending, legs: resolvedLegs, payout, status, resolvedAt: Date.now() };
};

export const sportBtnStyle = (color) => ({
  padding: 16,
  background: `linear-gradient(135deg, ${color}33, ${color}11)`,
  border: `2px solid ${color}`,
  color: '#fff', borderRadius: 10,
  cursor: 'pointer', fontFamily: 'Georgia, serif',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
});

// ============== HELPERS POKER ==============
// Évalue la meilleure main de 5 cartes à partir de 7 cartes
// Retourne { rank, rankName, tiebreaker: [values sorted] }
export const POKER_HAND_NAMES = [
  'Carte haute', 'Paire', 'Double paire', 'Brelan',
  'Quinte', 'Couleur', 'Full', 'Carré', 'Quinte flush', 'Quinte flush royale'
];

export const evaluatePokerHand = (cards7) => {
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

export const compareTB = (a, b) => {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const av = a[i] || 0, bv = b[i] || 0;
    if (av !== bv) return av - bv;
  }
  return 0;
};

export const evaluateHand5 = (cards) => {
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

