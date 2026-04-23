import React, { useState } from 'react';
import { fmt, CASINOS } from '@/game/constants';
import { STAKE } from '@/game/stake/theme';

// =============================================================
// <CasinoHall>
// Hall d'entrée du casino — affiche les salles de jeu disponibles
// dans un panel latéral style Stake. Le joueur choisit le casino
// et entre dans le Lobby3D correspondant.
// Props: profile, balance, currentCasinoId, onEnter(casinoId), onExit()
// =============================================================
const CasinoHall = ({ profile, balance, currentCasinoId, onEnter, onExit }) => {
  const [selected, setSelected] = useState(currentCasinoId || 'vegas');
  const c = CASINOS[selected] || CASINOS.vegas;

  return (
    <div
      data-testid="casino-hall"
      style={{
        position: 'fixed', inset: 0,
        background: `radial-gradient(ellipse at 50% 30%, ${STAKE.feltLight} 0%, ${STAKE.feltMid} 35%, ${STAKE.feltDark} 80%, #081a2c 100%)`,
        color: STAKE.ink,
        fontFamily: '"SF Pro Display", -apple-system, "Segoe UI", Helvetica, Arial, sans-serif',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}
    >
      {/* Noise overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '3px 3px',
      }} />

      {/* HEADER */}
      <div style={{
        position: 'relative', zIndex: 2,
        padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid rgba(212,175,55,0.15)',
      }}>
        <button
          data-testid="hall-exit-btn"
          onClick={onExit}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, #3a2a10, #1a1204)',
            border: `2px solid ${STAKE.gold}`,
            color: STAKE.goldLight, fontSize: 16, fontWeight: 800, cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
          }}
        >←</button>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 11, color: STAKE.inkSoft, letterSpacing: 1.5, textTransform: 'uppercase',
          }}>Hall d'accueil</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: STAKE.ink, letterSpacing: 1 }}>
            Choisis ta salle de jeu
          </div>
        </div>
        <div style={{
          padding: '8px 14px', borderRadius: 18,
          background: 'rgba(0,0,0,0.4)', border: `1px solid rgba(212,175,55,0.3)`,
          color: STAKE.goldLight, fontSize: 13, fontWeight: 800,
        }}>💰 {fmt(balance)} B</div>
      </div>

      {/* CONTENU : panel latéral + preview */}
      <div style={{
        position: 'relative', zIndex: 2, flex: 1,
        display: 'flex', overflow: 'hidden', flexWrap: 'wrap',
      }}>
        {/* Panel latéral : liste des casinos */}
        <div
          data-testid="hall-list"
          style={{
            width: 300, maxWidth: '100%', flex: '0 0 300px',
            background: 'rgba(5,12,22,0.65)',
            borderRight: '1px solid rgba(212,175,55,0.2)',
            overflow: 'auto', padding: '12px 10px',
            backdropFilter: 'blur(8px)',
          }}
        >
          {Object.entries(CASINOS).map(([id, cas]) => {
            const isSelected = selected === id;
            const isCurrent = currentCasinoId === id;
            return (
              <button
                key={id}
                data-testid={`hall-casino-${id}`}
                onClick={() => setSelected(id)}
                style={{
                  width: '100%', padding: 12, marginBottom: 8,
                  background: isSelected
                    ? `linear-gradient(135deg, ${cas.primary}33, ${cas.accent}22)`
                    : 'rgba(0,0,0,0.3)',
                  border: `1px solid ${isSelected ? cas.primary : 'rgba(212,175,55,0.2)'}`,
                  borderRadius: 10, color: '#fff', cursor: 'pointer',
                  display: 'flex', gap: 10, alignItems: 'center',
                  fontFamily: 'inherit', textAlign: 'left',
                  transition: 'all .15s ease',
                  boxShadow: isSelected ? `0 0 20px ${cas.primary}55` : 'none',
                  transform: isSelected ? 'translateX(2px)' : 'none',
                }}
              >
                <div style={{ fontSize: 28 }}>{cas.country}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{cas.name}</div>
                  <div style={{ fontSize: 10, color: STAKE.inkSoft, fontStyle: 'italic' }}>{cas.tagline}</div>
                </div>
                {isCurrent && (
                  <div style={{
                    fontSize: 9, fontWeight: 800, padding: '3px 6px',
                    borderRadius: 4, background: STAKE.gold, color: '#111', letterSpacing: 0.5,
                  }}>ACTUEL</div>
                )}
              </button>
            );
          })}
        </div>

        {/* Preview du casino sélectionné */}
        <div style={{
          flex: 1, minWidth: 280, padding: 18,
          display: 'flex', flexDirection: 'column',
          background: `radial-gradient(ellipse at 50% 0%, ${c.primary}22 0%, transparent 60%)`,
        }}>
          <div
            data-testid="hall-preview"
            style={{
              flex: 1, borderRadius: 16, padding: 20,
              background: `linear-gradient(160deg, ${c.primary}18, ${c.accent}08)`,
              border: `2px solid ${c.primary}`,
              boxShadow: `0 0 35px ${c.primary}33, inset 0 0 40px rgba(0,0,0,0.5)`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden', minHeight: 260,
            }}
          >
            {/* Motifs déco */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 6,
              background: `linear-gradient(90deg, ${c.flag.map(x => x).join(', ')})`,
            }} />
            <div style={{ fontSize: 90, marginBottom: 6 }}>{c.country}</div>
            <div style={{
              fontSize: 28, fontWeight: 900, letterSpacing: 2,
              color: c.secondary || '#fff', marginBottom: 4,
              fontFamily: 'Georgia, serif',
              textShadow: `0 0 18px ${c.primary}`,
            }}>{c.name}</div>
            <div style={{
              fontSize: 13, color: STAKE.inkSoft, fontStyle: 'italic',
              marginBottom: 18, textAlign: 'center',
            }}>« {c.tagline} »</div>
            <div style={{ display: 'flex', gap: 18, marginBottom: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
              <StatBadge label="Tables" value="12" color={c.primary} />
              <StatBadge label="Machines" value="48" color={c.secondary} />
              <StatBadge label="Mise min" value="10 B" color={c.accent} />
            </div>
            <button
              data-testid="hall-enter-btn"
              onClick={() => onEnter(selected)}
              style={{
                padding: '14px 36px', borderRadius: 30,
                background: `linear-gradient(135deg, ${c.primary}, ${c.accent})`,
                border: `2px solid ${c.secondary}`,
                color: '#fff', fontSize: 14, fontWeight: 900, letterSpacing: 2,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: `0 10px 30px ${c.primary}66`,
                transition: 'transform .12s',
              }}
              onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(0.96)'; }}
              onPointerUp={(e) => { e.currentTarget.style.transform = 'none'; }}
              onPointerLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
            >ENTRER DANS {c.name.toUpperCase()} →</button>
          </div>

          {/* Info joueur */}
          <div style={{
            marginTop: 14, padding: '10px 14px',
            background: 'rgba(0,0,0,0.35)', borderRadius: 10,
            border: '1px solid rgba(212,175,55,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: 11, color: STAKE.inkSoft,
          }}>
            <span>Connecté en tant que <b style={{ color: STAKE.goldLight }}>{profile?.name}</b></span>
            <span>🏆 {fmt(profile?.totalWinnings || 0)} B de gains cum.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatBadge = ({ label, value, color }) => (
  <div style={{
    padding: '8px 16px', borderRadius: 10,
    background: 'rgba(0,0,0,0.4)',
    border: `1px solid ${color}66`,
    textAlign: 'center', minWidth: 80,
  }}>
    <div style={{ fontSize: 10, color: STAKE.inkSoft, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</div>
    <div style={{ fontSize: 18, color: color || '#fff', fontWeight: 800 }}>{value}</div>
  </div>
);

export default CasinoHall;
