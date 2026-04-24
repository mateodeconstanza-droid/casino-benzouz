// =============================================================
// DAILY EVENTS — événements GambleLife selon le jour de la semaine
// =============================================================
// Permet d'animer la ville et le casino avec des événements changeants.
// Chaque événement a : un id, label, description, jours actifs (0=dim, 1=lun..6=sam),
// heures actives, et un effet (discount, spawn DJ, etc).

export const DAILY_EVENTS = [
  {
    id: 'dj-friday',
    label: '🎧 DJ Set Friday Night',
    desc: 'Vendredi soir : foule devant le casino, lights, DJ booth.',
    days: [5],         // vendredi
    hours: [18, 19, 20, 21, 22, 23, 0, 1, 2, 3], // 18h → 03h
    effect: 'dj',
    color: '#ff2ad4',
  },
  {
    id: 'sunday-market',
    label: '🛍 Dimanche · Marché aux Armes -50%',
    desc: 'Toutes les armes du store sont à 50% le dimanche.',
    days: [0],
    hours: Array.from({ length: 24 }, (_, i) => i),
    effect: 'shop_weapon_discount',
    discount: 0.5,
    color: '#1aa34a',
  },
  {
    id: 'wednesday-roulette',
    label: '🎡 Mercredi · Roue × 2 Gain',
    desc: 'Tous les gains de la roue de la fortune sont doublés.',
    days: [3],
    hours: Array.from({ length: 24 }, (_, i) => i),
    effect: 'wheel_x2',
    color: '#ffd700',
  },
  {
    id: 'saturday-casino',
    label: '🎰 Samedi · Casino Bonus +20% gains',
    desc: 'Le samedi, tous les gains des jeux de table sont +20%.',
    days: [6],
    hours: Array.from({ length: 24 }, (_, i) => i),
    effect: 'casino_bonus',
    bonus: 0.2,
    color: '#d4af37',
  },
  {
    id: 'monday-vehicle',
    label: '🏎 Lundi · Véhicules -30%',
    desc: 'Lundi : tous les véhicules du store sont remisés 30%.',
    days: [1],
    hours: Array.from({ length: 24 }, (_, i) => i),
    effect: 'shop_vehicle_discount',
    discount: 0.3,
    color: '#1aa3d4',
  },
];

// Renvoie la liste des événements actifs maintenant
export const getActiveEvents = () => {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  return DAILY_EVENTS.filter(e =>
    e.days.includes(day) && e.hours.includes(hour)
  );
};

// Helper : applique une remise éventuelle au prix d'un item
export const applyEventDiscount = (price, item, type /* 'weapon'|'vehicle' */) => {
  const events = getActiveEvents();
  let p = price;
  for (const e of events) {
    if (type === 'weapon' && e.effect === 'shop_weapon_discount') {
      p = Math.round(p * (1 - e.discount));
    }
    if (type === 'vehicle' && e.effect === 'shop_vehicle_discount') {
      p = Math.round(p * (1 - e.discount));
    }
  }
  return p;
};

// Multiplicateur sur les gains casino actuels
export const getCasinoMultiplier = () => {
  const events = getActiveEvents();
  let m = 1;
  for (const e of events) {
    if (e.effect === 'casino_bonus') m *= (1 + e.bonus);
    if (e.effect === 'wheel_x2')     m *= 2; // pour la roue uniquement, autre helper
  }
  return m;
};

// Multiplicateur sur la roue uniquement
export const getWheelMultiplier = () => {
  const events = getActiveEvents();
  return events.some(e => e.effect === 'wheel_x2') ? 2 : 1;
};
