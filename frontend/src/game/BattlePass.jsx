import React, { useState } from 'react';
import { fmt, HAIR_CATALOG, OUTFIT_CATALOG, SHOES_CATALOG } from '@/game/constants';
import { Banner, BANNER_CATALOG } from '@/game/Banners';

// =============================================================
// BATTLE PASS — Saison 1 : 25 niveaux, récompenses cumulables.
// XP : 1 point gagné pour chaque 10 000 $ de totalWinnings.
// Niveau N déverrouillé quand XP cumulé >= REQUIRED_XP[N].
// =============================================================
export const SEASON_NUMBER = 1;
export const SEASON_NAME = 'Saison 1 — Les Origines';

// Total XP requis pour atteindre le niveau N (N ∈ [1..25]).
// Courbe douce : niveaux 1-5 rapides, 6-15 modérés, 16-25 prestige.
export const REQUIRED_XP = [
  0,    // niveau 0 (départ)
  10,   // 1
  25,   // 2
  50,   // 3
  85,   // 4
  130,  // 5
  185,  // 6
  250,  // 7
  330,  // 8
  420,  // 9
  525,  // 10
  650,  // 11
  790,  // 12
  945,  // 13
  1115, // 14
  1300, // 15
  1510, // 16
  1740, // 17
  1990, // 18
  2260, // 19
  2550, // 20
  2865, // 21
  3205, // 22
  3570, // 23
  3960, // 24
  4400, // 25
];

// 25 récompenses — mix cash / bannières / cosmétiques
export const SEASON_REWARDS = [
  { level: 1,  type: 'cash',   value: 100000,                  name: '+100K $',           icon: '💵' },
  { level: 2,  type: 'banner', value: 'b-war-camo',            name: 'Bannière Camo',     icon: '🎖️' },
  { level: 3,  type: 'cash',   value: 250000,                  name: '+250K $',           icon: '💵' },
  { level: 4,  type: 'cosmetic',value: { slot: 'hair',   id: 5 }, name: 'Crête punk',     icon: '🎨' },
  { level: 5,  type: 'cash',   value: 500000,                  name: '+500K $',           icon: '💰' },
  { level: 6,  type: 'banner', value: 'b-sea-wave',            name: 'Bannière Vagues',   icon: '🌊' },
  { level: 7,  type: 'cash',   value: 750000,                  name: '+750K $',           icon: '💰' },
  { level: 8,  type: 'banner', value: 'b-war-medal',           name: 'Bannière Médaille', icon: '🏅' },
  { level: 9,  type: 'cosmetic',value: { slot: 'outfit', id: 3 }, name: 'Blouson cuir',   icon: '🧥' },
  { level: 10, type: 'cash',   value: 1500000,                 name: '+1.5M $',           icon: '💎' },
  { level: 11, type: 'banner', value: 'b-galaxy-stars',        name: 'Bannière Étoiles',  icon: '✨' },
  { level: 12, type: 'banner', value: 'b-game-pixel',          name: 'Bannière Retro',    icon: '👾' },
  { level: 13, type: 'cash',   value: 2500000,                 name: '+2.5M $',           icon: '💎' },
  { level: 14, type: 'cosmetic',value: { slot: 'shoes',  id: 5 }, name: 'Sneakers néon',  icon: '👟' },
  { level: 15, type: 'banner', value: 'b-sea-shark',           name: 'Bannière Requin',   icon: '🦈' },
  { level: 16, type: 'cash',   value: 4000000,                 name: '+4M $',             icon: '💎' },
  { level: 17, type: 'cosmetic',value: { slot: 'outfit', id: 6 }, name: 'Survêt or',      icon: '🧥' },
  { level: 18, type: 'banner', value: 'b-mountain-aurora',     name: 'Bannière Aurore',   icon: '🏔️' },
  { level: 19, type: 'cash',   value: 6000000,                 name: '+6M $',             icon: '💎' },
  { level: 20, type: 'banner', value: 'b-galaxy-ufo',          name: 'Bannière OVNI',     icon: '🛸' },
  { level: 21, type: 'cosmetic',value: { slot: 'hair',   id: 9 }, name: 'Cheveux dorés',  icon: '✨' },
  { level: 22, type: 'banner', value: 'b-asia-koi',            name: 'Bannière Koï',      icon: '🐟' },
  { level: 23, type: 'cash',   value: 10000000,                name: '+10M $',            icon: '🏆' },
  { level: 24, type: 'cosmetic',value: { slot: 'shoes',  id: 9 }, name: 'Baskets or',     icon: '👟' },
  { level: 25, type: 'banner', value: 'b-king',                name: 'Bannière Couronne', icon: '👑' },
];

// XP gagné par dollar de totalWinnings (1 XP / 10 000 $).
// Si le joueur a le Battle Pass premium, son multiplicateur s'applique
// (×2 par défaut quand l'item est acheté en boutique).
export const xpFromWinnings = (totalWinnings, multiplier = 1) =>
  Math.floor(((totalWinnings || 0) / 10000) * multiplier);

// Niveau actuel : plus grand N tel que xp >= REQUIRED_XP[N]
export const computeLevel = (xp) => {
  let lvl = 0;
  for (let n = 1; n <= 25; n++) {
    if (xp >= REQUIRED_XP[n]) lvl = n; else break;
  }
  return lvl;
};

// Progression vers le prochain niveau (0..1)
export const progressToNext = (xp) => {
  const lvl = computeLevel(xp);
  if (lvl >= 25) return 1;
  const base = REQUIRED_XP[lvl];
  const next = REQUIRED_XP[lvl + 1];
  return Math.max(0, Math.min(1, (xp - base) / (next - base)));
};

// =============================================================
// <BattlePass> — UI du pass de combat
// Props : profile, onClose, onClaimReward(reward)
// =============================================================
export const BattlePass = ({ profile, onClose, onClaimReward }) => {
  const totalWinnings = profile?.totalWinnings || 0;
  const xpMul = profile?.battlePassXpMultiplier || 1;
  const xp = xpFromWinnings(totalWinnings, xpMul);
  const isPremium = !!profile?.battlePassPremium;
  const level = computeLevel(xp);
  const progress = progressToNext(xp);
  const claimed = profile?.claimedPassRewards || [];

  return (
    <div
      data-testid="battlepass-modal"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 600,
        background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 18, fontFamily: 'Georgia, serif',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg, #1a0e25, #060310)',
          border: '2px solid #d4af37', borderRadius: 16,
          maxWidth: 820, width: '100%', maxHeight: '94vh', overflowY: 'auto',
          color: '#fff', padding: 22,
          boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 40px rgba(212,175,55,0.2)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: '#cca366', letterSpacing: 2 }}>BATTLE PASS</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#ffd700', letterSpacing: 1.2 }}>
              ⚔️ {SEASON_NAME}
            </div>
            <div style={{ fontSize: 12, color: '#9aa3b0', marginTop: 2 }}>
              Niveau {level}/25 · {xp} XP · {xpMul > 1 ? `×${xpMul} ` : ''}1 XP par 10 000 $
            </div>
            {isPremium && (
              <div style={{
                marginTop: 4, display: 'inline-block',
                padding: '2px 10px', borderRadius: 4,
                background: 'linear-gradient(135deg, #b08000, #ffd700)',
                color: '#111', fontWeight: 900, fontSize: 10, letterSpacing: 1,
              }}>★ PREMIUM ACTIF</div>
            )}
          </div>
          <button onClick={onClose} style={{
            padding: '8px 16px', borderRadius: 8,
            background: 'transparent', border: '1px solid #d4af37',
            color: '#d4af37', cursor: 'pointer', fontWeight: 800,
            fontFamily: 'inherit',
          }}>✕ FERMER</button>
        </div>

        {/* Progress bar global */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18,
          padding: 14, borderRadius: 10,
          background: 'rgba(212,175,55,0.06)',
          border: '1px solid rgba(212,175,55,0.25)',
        }}>
          <div style={{
            fontSize: 28, fontWeight: 900,
            background: 'linear-gradient(135deg, #ffd700, #b08000)',
            color: '#111', width: 56, height: 56, borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(212,175,55,0.5)',
          }}>{level}</div>
          <div style={{ flex: 1 }}>
            {level < 25 ? (
              <>
                <div style={{ fontSize: 12, color: '#cca366', marginBottom: 6 }}>
                  Vers le niveau {level + 1} · {xp} / {REQUIRED_XP[level + 1]} XP
                </div>
                <div style={{
                  height: 12, background: 'rgba(0,0,0,0.45)', borderRadius: 6,
                  overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{
                    width: `${progress * 100}%`, height: '100%',
                    background: 'linear-gradient(90deg, #b08000, #ffd700)',
                    boxShadow: '0 0 12px rgba(255,215,0,0.6)',
                    transition: 'width .3s ease',
                  }} />
                </div>
              </>
            ) : (
              <div style={{ color: '#ffd700', fontWeight: 800 }}>
                🏆 Saison maxée ! Toutes les récompenses sont à toi.
              </div>
            )}
          </div>
        </div>

        {/* Track des récompenses */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10,
        }}>
          {SEASON_REWARDS.map((r) => {
            const isUnlocked = level >= r.level;
            const isClaimed = claimed.includes(r.level);
            const canClaim = isUnlocked && !isClaimed;
            return (
              <div
                key={r.level}
                data-testid={`pass-tier-${r.level}`}
                style={{
                  position: 'relative',
                  padding: 10, borderRadius: 10,
                  background: isClaimed
                    ? 'rgba(20,195,86,0.10)'
                    : isUnlocked
                      ? 'linear-gradient(160deg, rgba(212,175,55,0.18), rgba(212,175,55,0.04))'
                      : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isClaimed ? '#14c356' : isUnlocked ? '#ffd700' : 'rgba(255,255,255,0.08)'}`,
                  opacity: isUnlocked ? 1 : 0.55,
                  textAlign: 'center',
                  minHeight: 130,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
                }}>
                {/* Pastille niveau */}
                <div style={{
                  position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                  padding: '2px 10px', borderRadius: 12,
                  background: isClaimed ? '#14c356' : isUnlocked ? '#ffd700' : '#444',
                  color: isUnlocked ? '#111' : '#888',
                  fontWeight: 900, fontSize: 11, letterSpacing: 1,
                  border: '1px solid rgba(0,0,0,0.3)',
                }}>NIV.{r.level}</div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
                  {/* Preview de la récompense */}
                  {r.type === 'banner' ? (
                    <Banner id={r.value} width={100} height={32} showName={false} />
                  ) : (
                    <div style={{ fontSize: 32 }}>{r.icon}</div>
                  )}
                  <div style={{
                    marginTop: 6, fontSize: 11, fontWeight: 700,
                    color: isUnlocked ? '#fff' : '#999',
                    minHeight: 14,
                  }}>{r.name}</div>
                </div>

                {/* Bouton claim */}
                {canClaim && (
                  <button
                    data-testid={`pass-claim-${r.level}`}
                    onClick={() => onClaimReward && onClaimReward(r)}
                    style={{
                      width: '100%', marginTop: 6, padding: '5px 8px',
                      background: 'linear-gradient(135deg, #b08000, #ffd700)',
                      border: 'none', borderRadius: 6,
                      color: '#111', fontWeight: 900, fontSize: 10, letterSpacing: 0.8,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                    RÉCUPÉRER
                  </button>
                )}
                {isClaimed && (
                  <div style={{
                    marginTop: 6, fontSize: 10, color: '#a8e88a', fontWeight: 800,
                  }}>✓ RÉCUPÉRÉ</div>
                )}
                {!isUnlocked && (
                  <div style={{
                    marginTop: 6, fontSize: 9, color: '#888',
                  }}>🔒 {REQUIRED_XP[r.level]} XP requis</div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{
          marginTop: 16, padding: 10,
          background: 'rgba(212,175,55,0.06)',
          border: '1px solid rgba(212,175,55,0.25)', borderRadius: 8,
          fontSize: 11, color: '#cca366', textAlign: 'center', fontStyle: 'italic',
        }}>
          💡 Gagne aux jeux du casino pour gagner de l'XP. Chaque récompense est à récupérer manuellement.
        </div>
      </div>
    </div>
  );
};

// Helper côté Casino.jsx : applique une récompense au profile.
// Retourne le nouveau profile { profile, deltaBalance } à passer à setProfile + setBalance.
export const applyPassReward = (profile, reward) => {
  let next = { ...profile };
  let deltaBalance = 0;
  // Marque comme récupéré
  next.claimedPassRewards = [...(profile.claimedPassRewards || []), reward.level];
  if (reward.type === 'cash') {
    deltaBalance = reward.value;
  } else if (reward.type === 'banner') {
    if (!next.ownedBanners?.includes(reward.value)) {
      next.ownedBanners = [...(next.ownedBanners || []), reward.value];
    }
  } else if (reward.type === 'cosmetic') {
    const { slot, id } = reward.value;
    const key = slot === 'hair' ? 'ownedHair' : slot === 'outfit' ? 'ownedOutfit' : 'ownedShoes';
    if (!next[key]?.includes(id)) {
      next[key] = [...(next[key] || []), id];
    }
  }
  return { profile: next, deltaBalance };
};

export default BattlePass;
