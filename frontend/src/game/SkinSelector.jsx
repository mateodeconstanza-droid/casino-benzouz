import React, { useState, useMemo } from 'react';
import { SKINS_CATALOG, SKIN_THEMES, SKIN_RARITY, fmt } from '@/game/constants';
import { Avatar3D } from '@/game/Avatar3D';
import { STAKE } from '@/game/stake/theme';

// =============================================================
// <SkinSelector> — sélecteur de skins style Fortnite
// Grid des skin packs par thème, preview 3D animé du skin sélectionné,
// achat ou équipement direct si déjà possédé.
//
// Props:
//   profile, balance, onPurchase(skinId, price), onEquip(skinId), onClose
// =============================================================
const SkinSelector = ({ profile, balance, onPurchase, onEquip, onClose }) => {
  const ownedSkins = profile?.ownedSkins || ['sk-default'];
  const equippedId = profile?.equippedSkin || 'sk-default';
  const [theme, setTheme] = useState('classic');
  const [pickedId, setPickedId] = useState(equippedId);

  const themedSkins = useMemo(
    () => SKINS_CATALOG.filter((s) => s.theme === theme),
    [theme]
  );
  const picked = SKINS_CATALOG.find((s) => s.id === pickedId) || SKINS_CATALOG[0];
  const pickedRarity = SKIN_RARITY[picked.rarity] || SKIN_RARITY.common;
  const pickedOwned = ownedSkins.includes(picked.id);
  const pickedEquipped = equippedId === picked.id;
  const canAfford = (balance || 0) >= picked.price;

  return (
    <div
      data-testid="skin-selector-modal"
      style={{
        position: 'fixed', inset: 0, background: 'rgba(2,4,10,0.96)',
        zIndex: 600, display: 'flex', flexDirection: 'column',
        backdropFilter: 'blur(8px)',
        fontFamily: '"SF Pro Display", -apple-system, sans-serif',
      }}
    >
      {/* === HEADER === */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 24px', borderBottom: `1px solid ${STAKE.gold}33`,
        background: 'linear-gradient(180deg, rgba(20,15,30,0.9), rgba(0,0,0,0.7))',
      }}>
        <h2 style={{
          color: STAKE.goldLight, margin: 0, letterSpacing: 4,
          fontFamily: 'Georgia, serif', fontSize: 26,
        }}>🎭 PERSONNAGE</h2>
        <button
          data-testid="skin-selector-close"
          onClick={onClose}
          style={{
            background: 'transparent', border: `1.5px solid ${STAKE.gold}`,
            color: STAKE.goldLight, width: 40, height: 40, borderRadius: 10,
            cursor: 'pointer', fontWeight: 800, fontSize: 18,
          }}
        >✕</button>
      </div>

      {/* === BODY : 2 colonnes (preview 3D + grid skins) === */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* COLONNE PREVIEW (gauche) */}
        <div style={{
          width: 380, padding: 24, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'space-between',
          background: `radial-gradient(circle at 50% 30%, ${pickedRarity.color}22 0%, transparent 60%)`,
          borderRight: '1px solid rgba(212,175,55,0.15)',
        }}>
          {/* Preview 3D animé */}
          <div style={{
            width: 320, height: 460, position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: 'translateZ(0)', willChange: 'transform',
          }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50% 50% 0 0',
              background: `radial-gradient(circle at 50% 80%, ${pickedRarity.color}33 0%, transparent 70%)`,
              animation: pickedRarity.glow ? 'pulseRarity 2.5s ease-in-out infinite' : 'none',
            }} />
            <Avatar3D
              hair={picked.hair}
              outfit={picked.outfit}
              shoes={picked.shoes}
              skin={picked.skin}
              size={300}
              interactive={true}
            />
          </div>

          {/* Infos skin + bouton action */}
          <div style={{ width: '100%', textAlign: 'center', marginTop: 12 }}>
            <div style={{
              fontSize: 11, fontWeight: 800, letterSpacing: 2,
              color: pickedRarity.color, marginBottom: 4,
              textShadow: pickedRarity.glow ? `0 0 10px ${pickedRarity.color}` : 'none',
            }}>
              {pickedRarity.label.toUpperCase()}
            </div>
            <div style={{
              fontSize: 24, fontWeight: 900, color: '#fff',
              letterSpacing: 1.5, marginBottom: 8,
              fontFamily: 'Georgia, serif',
            }}>{picked.preview} {picked.name}</div>
            <div style={{
              fontSize: 12, color: '#aaa', marginBottom: 16,
            }}>{SKIN_THEMES.find((t) => t.id === picked.theme)?.label || '—'}</div>

            {pickedEquipped ? (
              <div style={{
                padding: '14px', borderRadius: 12,
                background: 'rgba(168,232,138,0.12)',
                border: '1.5px solid #a8e88a',
                color: '#a8e88a', fontWeight: 900, letterSpacing: 1.5, fontSize: 13,
              }}>
                ✓ ÉQUIPÉ
              </div>
            ) : pickedOwned ? (
              <button
                data-testid="skin-equip-btn"
                onClick={() => onEquip(picked.id)}
                style={{
                  width: '100%', padding: 14, borderRadius: 12,
                  background: `linear-gradient(135deg, ${STAKE.goldDark}, ${STAKE.gold})`,
                  border: 'none', color: '#111', cursor: 'pointer',
                  fontSize: 14, fontWeight: 900, letterSpacing: 2,
                  boxShadow: `0 10px 24px ${STAKE.gold}55`,
                  fontFamily: 'inherit',
                }}
              >ÉQUIPER →</button>
            ) : (
              <button
                data-testid="skin-buy-btn"
                disabled={!canAfford}
                onClick={() => onPurchase(picked.id, picked.price)}
                style={{
                  width: '100%', padding: 14, borderRadius: 12,
                  background: canAfford
                    ? `linear-gradient(135deg, ${pickedRarity.color}, ${pickedRarity.color}cc)`
                    : '#333',
                  border: 'none', color: canAfford ? '#0a0a14' : '#666',
                  cursor: canAfford ? 'pointer' : 'not-allowed',
                  fontSize: 14, fontWeight: 900, letterSpacing: 2,
                  boxShadow: canAfford ? `0 10px 24px ${pickedRarity.color}55` : 'none',
                  fontFamily: 'inherit',
                }}
              >
                {canAfford ? `ACHETER · ${fmt(picked.price)} $` : `MANQUE ${fmt(picked.price - balance)} $`}
              </button>
            )}
          </div>
        </div>

        {/* COLONNE GRID SKINS (droite) */}
        <div style={{ flex: 1, padding: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Onglets thèmes */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {SKIN_THEMES.map((t) => {
              const active = theme === t.id;
              return (
                <button
                  key={t.id}
                  data-testid={`skin-theme-${t.id}`}
                  onClick={() => setTheme(t.id)}
                  style={{
                    padding: '10px 16px', borderRadius: 10,
                    background: active
                      ? `linear-gradient(135deg, ${t.accent}33, ${t.accent}11)`
                      : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${active ? t.accent : 'rgba(255,255,255,0.08)'}`,
                    color: active ? '#fff' : '#aaa',
                    fontSize: 12, fontWeight: 800, letterSpacing: 1.5,
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.18s ease',
                  }}
                >
                  <span style={{ marginRight: 6, fontSize: 14 }}>{t.icon}</span>
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Grid des skins du thème */}
          <div style={{
            flex: 1, overflowY: 'auto',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 12, paddingRight: 6,
          }}>
            {themedSkins.map((s) => {
              const owned = ownedSkins.includes(s.id);
              const equipped = equippedId === s.id;
              const isPicked = s.id === pickedId;
              const r = SKIN_RARITY[s.rarity] || SKIN_RARITY.common;
              return (
                <button
                  key={s.id}
                  data-testid={`skin-card-${s.id}`}
                  onClick={() => setPickedId(s.id)}
                  style={{
                    padding: 12, borderRadius: 12, position: 'relative',
                    background: isPicked
                      ? `linear-gradient(180deg, ${r.color}33, ${r.color}11)`
                      : owned
                        ? 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))'
                        : 'rgba(0,0,0,0.4)',
                    border: `2px solid ${isPicked ? r.color : owned ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'}`,
                    cursor: 'pointer', color: '#fff', textAlign: 'center',
                    fontFamily: 'inherit',
                    boxShadow: isPicked ? `0 8px 20px ${r.color}55` : 'none',
                    transition: 'transform 0.18s ease, border-color 0.18s ease',
                    opacity: owned ? 1 : 0.85,
                  }}
                >
                  {/* Rareté tag */}
                  <div style={{
                    position: 'absolute', top: 6, left: 6,
                    fontSize: 8, fontWeight: 800, letterSpacing: 1,
                    padding: '2px 6px', borderRadius: 4,
                    background: r.color, color: '#0a0a14',
                    textShadow: r.glow ? `0 0 6px ${r.color}` : 'none',
                  }}>{r.label}</div>
                  {/* Locked / Equipped */}
                  {equipped && (
                    <div style={{
                      position: 'absolute', top: 6, right: 6,
                      fontSize: 9, fontWeight: 900, color: '#a8e88a',
                    }}>✓</div>
                  )}
                  {!owned && (
                    <div style={{
                      position: 'absolute', top: 6, right: 6,
                      fontSize: 11, color: '#666',
                    }}>🔒</div>
                  )}
                  {/* Emoji preview */}
                  <div style={{ fontSize: 48, marginTop: 14, marginBottom: 6 }}>{s.preview}</div>
                  {/* Nom */}
                  <div style={{
                    fontSize: 11, fontWeight: 800, letterSpacing: 0.5,
                    color: isPicked ? r.color : '#fff',
                    minHeight: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{s.name}</div>
                  {/* Prix ou statut */}
                  <div style={{
                    fontSize: 10, color: owned ? '#a8e88a' : '#cca366',
                    fontWeight: 700, marginTop: 4,
                  }}>
                    {owned ? (equipped ? 'ÉQUIPÉ' : 'POSSÉDÉ') : s.price === 0 ? 'GRATUIT' : `${fmt(s.price)} $`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulseRarity {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};

export default SkinSelector;
