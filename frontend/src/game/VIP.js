import { OUTFIT_CATALOG, HAIR_CATALOG, SHOES_CATALOG } from '@/game/constants';

// ============== SALLE VIP ==============
// Un skin est "luxe" si son prix dépasse le seuil LUX_PRICE.
// Porter 3 luxe ou plus = accès VIP + multiplicateur de style +1.5x sur les gains.
const LUX_PRICE = 500000;

export function countLuxurySkins(profile) {
  let n = 0;
  const h = HAIR_CATALOG[profile.hair ?? 0];
  const o = OUTFIT_CATALOG[profile.outfit ?? 0];
  const s = SHOES_CATALOG[profile.shoes ?? 0];
  if (h && h.price >= LUX_PRICE) n++;
  if (o && o.price >= LUX_PRICE) n++;
  if (s && s.price >= LUX_PRICE) n++;
  return n;
}

export function isVIP(profile) {
  return countLuxurySkins(profile) >= 3;
}

// Multiplicateur appliqué aux gains dans les jeux VIP.
// 2 luxe = +25%, 3 luxe = +50%, 4+ luxe = +75%
export function styleMultiplier(profile) {
  const n = countLuxurySkins(profile);
  if (n >= 4) return 1.75;
  if (n >= 3) return 1.5;
  if (n >= 2) return 1.25;
  return 1;
}

export function applyStyleBonus(profile, winAmount) {
  const mul = styleMultiplier(profile);
  return Math.floor(winAmount * mul);
}
