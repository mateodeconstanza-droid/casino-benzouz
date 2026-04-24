import React from 'react';
import { STAKE, STAKE_CHIPS, chipsForMin } from './theme';
import { fmt } from '@/game/constants';

// =============================================================
// <StakeShell> — cadre commun aux jeux (Blackjack/Roulette/Poker)
// Fournit :
//  - Feutre bleu en background
//  - Barre du haut (menu + refresh + logo EN DIRECT)
//  - Zone centrale (children)
//  - Barre du bas (Mise totale + Solde + titre jeu)
// =============================================================
export const StakeShell = ({
  title, balance, totalBet = 0, minBet, maxBet,
  onExit, onMenu, onRefresh, onHistory,
  children, liveLabel = 'EN DIRECT',
}) => {
  return (
    <div
      data-testid="stake-shell"
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: `radial-gradient(ellipse at 50% 30%, ${STAKE.feltLight} 0%, ${STAKE.feltMid} 35%, ${STAKE.feltDark} 80%, #081a2c 100%)`,
        color: STAKE.ink,
        fontFamily: '"SF Pro Display", -apple-system, "Segoe UI", Helvetica, Arial, sans-serif',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}
    >
      {/* Feutre noise overlay léger */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '3px 3px', opacity: 0.5,
      }} />

      {/* Halos lumineux ambiance casino — 2 spots de chandelier */}
      <div style={{
        position: 'absolute', top: -140, left: '18%',
        width: 360, height: 360, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,210,120,0.22), transparent 65%)',
        pointerEvents: 'none', filter: 'blur(8px)',
      }} />
      <div style={{
        position: 'absolute', top: -120, right: '15%',
        width: 320, height: 320, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(63,230,255,0.15), transparent 60%)',
        pointerEvents: 'none', filter: 'blur(6px)',
      }} />
      {/* Particules scintillantes ambiantes (CSS only) */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5,
        background: `
          radial-gradient(2px 2px at 10% 20%, rgba(255,215,0,0.55), transparent 70%),
          radial-gradient(2px 2px at 80% 35%, rgba(255,215,0,0.4),  transparent 70%),
          radial-gradient(1.5px 1.5px at 45% 60%, rgba(255,255,255,0.35), transparent 70%),
          radial-gradient(2px 2px at 90% 80%, rgba(63,230,255,0.35), transparent 70%),
          radial-gradient(1.5px 1.5px at 25% 85%, rgba(212,175,55,0.45), transparent 70%)
        `,
        animation: 'stakeTwinkle 6s ease-in-out infinite',
      }} />
      <style>{`
        @keyframes stakeTwinkle {
          0%,100% { opacity: 0.35; }
          50%     { opacity: 0.75; }
        }
      `}</style>

      {/* Barre du haut */}
      <div style={{
        position: 'relative', zIndex: 3,
        padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <StakeIconBtn data-testid="stake-menu-btn" onClick={onMenu || onExit} label="☰" />
        {onRefresh && <StakeIconBtn data-testid="stake-refresh-btn" onClick={onRefresh} label="↻" />}
        {onHistory && <StakeIconBtn data-testid="stake-history-btn" onClick={onHistory} label="◉" />}
        <div style={{ flex: 1 }} />
        <LiveBadge label={liveLabel} />
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, position: 'relative', zIndex: 2, overflow: 'auto' }}>
        {children}
      </div>

      {/* Footer (Mise / Solde / Titre) */}
      <div style={{
        position: 'relative', zIndex: 3,
        background: 'rgba(5,12,22,0.85)', backdropFilter: 'blur(10px)',
        borderTop: `1px solid rgba(212,175,55,0.2)`,
        padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 14, fontWeight: 500,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 11, color: STAKE.inkSoft, letterSpacing: 0.5 }}>
            Mise totale <span style={{ color: STAKE.gold, fontWeight: 800, fontSize: 14 }}>{fmt(totalBet)} $</span>
          </div>
          <div style={{ fontSize: 11, color: STAKE.inkSoft, letterSpacing: 0.5 }}>
            Solde <span style={{ color: STAKE.goldLight, fontWeight: 800, fontSize: 14 }}>{fmt(balance)} $</span>
          </div>
        </div>
        <div style={{ fontSize: 12, color: STAKE.inkSoft, textAlign: 'right' }}>
          <div style={{ fontWeight: 700, color: STAKE.ink, letterSpacing: 1 }}>{title}</div>
          {minBet != null && (
            <div style={{ color: STAKE.gold, fontSize: 11 }}>
              {fmt(minBet)}{maxBet ? ` – ${fmt(maxBet)}` : ''} $
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StakeIconBtn = ({ onClick, label, ...rest }) => (
  <button
    onClick={onClick}
    {...rest}
    style={{
      width: 42, height: 42, borderRadius: '50%',
      background: 'linear-gradient(135deg, #3a2a10, #1a1204)',
      border: `2px solid ${STAKE.gold}`,
      color: STAKE.goldLight, fontSize: 18, fontWeight: 700,
      cursor: 'pointer',
      boxShadow: '0 4px 10px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
  >{label}</button>
);

const LiveBadge = ({ label }) => (
  <div
    data-testid="stake-live-badge"
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 14px', borderRadius: 22,
      border: `2px solid ${STAKE.liveCyan}`,
      color: STAKE.liveCyan, fontWeight: 800, fontSize: 11, letterSpacing: 1.5,
      background: 'rgba(63,230,255,0.08)',
    }}
  >
    <span style={{
      width: 7, height: 7, borderRadius: '50%', background: STAKE.liveCyan,
      boxShadow: `0 0 8px ${STAKE.liveCyan}`,
      animation: 'stake-pulse 1.2s ease-in-out infinite',
    }} />
    {label}
    <style>{`@keyframes stake-pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }`}</style>
  </div>
);

// =============================================================
// <Chip3D> — jeton "cylindre empilé" en CSS pur (effet 3D)
// =============================================================
export const Chip3D = ({ value, size = 60, selected = false, onClick }) => {
  const def = STAKE_CHIPS.find(c => c.v === value) || STAKE_CHIPS[0];
  return (
    <button
      data-testid={`stake-chip-${value}`}
      onClick={onClick}
      style={{
        position: 'relative',
        width: size, height: size,
        border: 'none', background: 'transparent', padding: 0, cursor: 'pointer',
        filter: selected ? 'brightness(1.15) drop-shadow(0 0 8px rgba(255,215,0,0.9))' : 'none',
        transform: selected ? 'translateY(-4px)' : 'none',
        transition: 'transform .15s ease, filter .15s ease',
      }}
    >
      {/* Pile de 4 "tranches" empilées pour l'effet 3D */}
      {[0, 1, 2, 3].map(i => (
        <div key={i}
          style={{
            position: 'absolute', bottom: i * 3, left: 0,
            width: size, height: size,
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, #fff 0%, ${def.color} 18%, ${def.color} 75%, #000 100%)`,
            boxShadow: `0 2px 3px rgba(0,0,0,${0.3 + i * 0.05}), inset 0 -3px 4px rgba(0,0,0,0.25)`,
          }}
        />
      ))}
      {/* Face supérieure avec motifs */}
      <div style={{
        position: 'absolute', bottom: 12, left: 0,
        width: size, height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle at 30% 30%, ${def.color} 0%, ${def.color} 60%, ${shade(def.color, -0.25)} 100%)`,
        border: `3px dashed ${def.accent}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: size * 0.62, height: size * 0.62, borderRadius: '50%',
          background: `${def.color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `2px solid ${def.accent}`,
          boxShadow: 'inset 0 2px 3px rgba(255,255,255,0.25)',
        }}>
          <span style={{
            color: def.ink, fontWeight: 900, fontSize: size * 0.26,
            fontFamily: 'Georgia, serif', letterSpacing: -0.5,
            textShadow: '0 1px 1px rgba(0,0,0,0.3)',
          }}>{def.text}</span>
        </div>
      </div>
    </button>
  );
};

// =============================================================
// <ChipRack> — colonne verticale de jetons sélectionnables
// =============================================================
export const ChipRack = ({ value, setValue, minBet = 1, vertical = true }) => {
  const chips = chipsForMin(minBet);
  return (
    <div style={{
      display: 'flex', flexDirection: vertical ? 'column' : 'row',
      gap: 8, alignItems: 'center', padding: '6px 4px',
    }}>
      {chips.map(c => (
        <Chip3D key={c.v} value={c.v} selected={value === c.v} onClick={() => setValue(c.v)} />
      ))}
    </div>
  );
};

// =============================================================
// <RoundBtn> — bouton circulaire doré type Stake (Donner/×2/Undo/Tour)
// =============================================================
export const RoundBtn = ({ label, subLabel, onClick, disabled, size = 74, color = STAKE.gold, testId }) => (
  <button
    data-testid={testId}
    onClick={onClick} disabled={disabled}
    style={{
      width: size, height: size, borderRadius: '50%',
      background: disabled ? 'rgba(30,35,50,0.6)' : 'linear-gradient(145deg, #1a1a1f 0%, #0a0a0f 100%)',
      border: `3px solid ${disabled ? '#444' : color}`,
      color: disabled ? '#666' : '#fff',
      cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: disabled
        ? 'none'
        : `0 6px 14px rgba(0,0,0,0.5), 0 0 0 2px rgba(212,175,55,0.2), inset 0 2px 4px rgba(255,255,255,0.08)`,
      fontFamily: 'inherit', fontWeight: 800, fontSize: 13,
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      letterSpacing: 0.5, transition: 'transform .12s ease',
    }}
    onPointerDown={(e) => { if (!disabled) e.currentTarget.style.transform = 'scale(0.94)'; }}
    onPointerUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    onPointerLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
  >
    <span style={{ fontSize: size * 0.32, lineHeight: 1 }}>{label}</span>
    {subLabel && <span style={{ fontSize: 9, color: disabled ? '#888' : color, marginTop: 2 }}>{subLabel}</span>}
  </button>
);

// =============================================================
// <PlacedStack> — petite pile de jetons déposée sur le tapis
// (affichée par-dessus les cases de roulette / spots de blackjack)
// =============================================================
export const PlacedStack = ({ amount, size = 32 }) => {
  if (!amount) return null;
  // Choisit le jeton le plus grand <= amount
  const best = [...STAKE_CHIPS].reverse().find(c => c.v <= amount) || STAKE_CHIPS[0];
  return (
    <div style={{ position: 'relative', width: size, height: size * 0.9 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          position: 'absolute', bottom: i * 2, left: 0,
          width: size, height: size * 0.42, borderRadius: '50%',
          background: `radial-gradient(ellipse at 30% 30%, #fff 0%, ${best.color} 18%, ${shade(best.color, -0.3)} 100%)`,
          border: `1.5px dashed ${best.accent}`,
          boxShadow: '0 2px 3px rgba(0,0,0,0.45)',
        }} />
      ))}
      <div style={{
        position: 'absolute', top: -12, left: 0, right: 0, textAlign: 'center',
        fontSize: 11, fontWeight: 800, color: STAKE.goldLight,
        textShadow: '0 1px 2px #000, 0 0 3px #000',
      }}>
        {fmt(amount)}
      </div>
    </div>
  );
};

// ---------- helpers ----------
function shade(hex, pct) {
  // Assombrit/éclaircit un hex de pct (-1..1)
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const f = pct < 0 ? 0 : 255;
  const t = Math.abs(pct);
  const c = (x) => Math.round((f - x) * t + x).toString(16).padStart(2, '0');
  return '#' + c(r) + c(g) + c(b);
}
