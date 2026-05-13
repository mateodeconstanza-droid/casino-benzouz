import React, { useEffect, useRef, useState } from 'react';
import { fmt } from '@/game/constants';
import sfx from '@/game/sfx';

// =============================================================
// <CrashGame> — mini-jeu Aviator-style.
// La mise multiplie en temps réel (de 1.00x à l'infini, avec décroissance
// pseudo-exponentielle). Le joueur peut CASH OUT à tout moment pour
// gagner mise × multiplicateur. Si la fusée CRASH avant cash-out, mise
// perdue.
//
// Probabilité de crash : tirage géométrique → crash point distribué
// avec house edge ~5%.
// =============================================================
const sampleCrashPoint = () => {
  // crashPoint = (1 - houseEdge) / (1 - rand) clamped à 1.00 minimum
  // Avec houseEdge=0.04 et rand uniforme, on a une distribution
  // exponentielle avec une longue queue (gros payouts rares).
  const r = Math.random();
  const houseEdge = 0.04;
  if (r < houseEdge) return 1.00; // crash instantané (4% des manches)
  return Math.max(1.01, (1 - houseEdge) / (1 - r));
};

const computeMul = (elapsedMs) => {
  // Multiplicateur en fonction du temps. Croissance douce sur 30s pour
  // que le joueur ait le temps de décider.
  // mul = e^(0.0011 * t_ms) → ~3x à 10s, ~9x à 20s, ~27x à 30s
  return Math.exp(0.00011 * elapsedMs);
};

export const CrashGame = ({ profile, balance, setBalance, onWin, onClose }) => {
  const [stake, setStake] = useState(100);
  const [phase, setPhase] = useState('idle'); // idle | flying | cashed | crashed
  const [mul, setMul] = useState(1.00);
  const [crashedAt, setCrashedAt] = useState(null);
  const [cashedAt, setCashedAt] = useState(null);
  const [history, setHistory] = useState([]); // last 10 crash points

  const startRef = useRef(0);
  const crashRef = useRef(0);
  const rafRef = useRef(0);
  const cashedRef = useRef(false);

  const launch = () => {
    if (phase !== 'idle' && phase !== 'cashed' && phase !== 'crashed') return;
    if (stake <= 0 || stake > balance) return;
    setBalance((b) => b - stake);
    cashedRef.current = false;
    setCashedAt(null);
    setCrashedAt(null);
    setMul(1.00);
    setPhase('flying');
    startRef.current = performance.now();
    crashRef.current = sampleCrashPoint();
    try { sfx.play('click'); } catch (_e) { /* noop */ }
    const tick = () => {
      const el = performance.now() - startRef.current;
      const m = computeMul(el);
      setMul(m);
      if (cashedRef.current) {
        // Le joueur a cash-out — arrêter le RAF (le state phase est mis à 'cashed' dans cashOut())
        return;
      }
      if (m >= crashRef.current) {
        // Crash !
        setMul(crashRef.current);
        setCrashedAt(crashRef.current);
        setPhase('crashed');
        setHistory((h) => [crashRef.current, ...h].slice(0, 10));
        try { sfx.play('explosion'); } catch (_e) { /* noop */ }
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const cashOut = () => {
    if (phase !== 'flying' || cashedRef.current) return;
    cashedRef.current = true;
    cancelAnimationFrame(rafRef.current);
    const m = mul;
    const winnings = Math.floor(stake * m);
    setCashedAt(m);
    setBalance((b) => b + winnings);
    setHistory((h) => [m, ...h].slice(0, 10));
    setPhase('cashed');
    onWin && onWin(winnings - stake); // delta net
    try { sfx.play('win'); } catch (_e) { /* noop */ }
  };

  useEffect(() => {
    return () => { cancelAnimationFrame(rafRef.current); };
  }, []);

  const flightHeight = Math.min(0.85, Math.log(mul) / Math.log(50)); // 0..0.85
  const flightX = Math.min(0.9, (mul - 1) / 8); // 0..0.9

  return (
    <div
      data-testid="crash-modal"
      onClick={(e) => { if (e.target === e.currentTarget && phase !== 'flying') onClose && onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, fontFamily: 'Georgia, serif',
      }}
    >
      <div style={{
        background: 'linear-gradient(160deg, #0a0820, #050310)',
        border: '2px solid #d4af37', borderRadius: 16,
        width: '100%', maxWidth: 720, color: '#fff',
        padding: 18, boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: '#cca366', letterSpacing: 2 }}>MINI-JEU</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#ffd700' }}>
              🚀 CRASH
            </div>
          </div>
          <button onClick={onClose} disabled={phase === 'flying'} style={{
            padding: '8px 16px', borderRadius: 8,
            background: 'transparent', border: '1px solid #d4af37',
            color: '#d4af37', cursor: phase === 'flying' ? 'not-allowed' : 'pointer',
            opacity: phase === 'flying' ? 0.4 : 1,
            fontWeight: 800, fontFamily: 'inherit',
          }}>✕ FERMER</button>
        </div>

        {/* Zone de vol */}
        <div style={{
          position: 'relative',
          aspectRatio: '16/9', maxHeight: 260,
          background: phase === 'crashed'
            ? 'linear-gradient(180deg, #2a0808 0%, #08010a 100%)'
            : 'linear-gradient(180deg, #1a0a2a 0%, #4a1648 50%, #ff6a3a 100%)',
          borderRadius: 12, overflow: 'hidden', marginBottom: 12,
          border: '1px solid rgba(212,175,55,0.3)',
        }}>
          {/* Trail */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <path
              d={`M 5 95 Q ${5 + flightX * 90 / 2} ${95 - flightHeight * 90 / 2} ${5 + flightX * 90} ${95 - flightHeight * 90}`}
              stroke={phase === 'crashed' ? '#ff3a55' : '#ffd700'}
              strokeWidth="0.8" fill="none" strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 4px currentColor)' }}
            />
          </svg>
          {/* Fusée */}
          <div style={{
            position: 'absolute',
            left: `${5 + flightX * 90}%`,
            bottom: `${5 + flightHeight * 90}%`,
            transform: 'translate(-50%, 50%) rotate(-25deg)',
            fontSize: 38,
            filter: phase === 'crashed' ? 'grayscale(1) brightness(0.5)' : 'none',
            transition: 'filter .3s',
          }}>
            {phase === 'crashed' ? '💥' : '🚀'}
          </div>
          {/* Multiplicateur central énorme */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <div data-testid="crash-multiplier" style={{
              fontSize: 64, fontWeight: 900, letterSpacing: 2,
              color: phase === 'crashed' ? '#ff3a55' : '#fff',
              textShadow: '0 4px 20px rgba(0,0,0,0.7)',
              fontFamily: 'monospace',
            }}>
              {mul.toFixed(2)}x
            </div>
          </div>
          {phase === 'crashed' && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, 40%)',
              fontSize: 20, fontWeight: 900, color: '#ff3a55',
              letterSpacing: 3,
            }}>
              💥 CRASH @ {crashedAt?.toFixed(2)}x
            </div>
          )}
          {phase === 'cashed' && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, 40%)',
              fontSize: 20, fontWeight: 900, color: '#a8e88a',
              letterSpacing: 3,
            }}>
              ✓ CASH OUT @ {cashedAt?.toFixed(2)}x
            </div>
          )}
        </div>

        {/* Historique des 10 dernières manches */}
        <div style={{
          display: 'flex', gap: 6, marginBottom: 14,
          padding: 8, borderRadius: 8,
          background: 'rgba(0,0,0,0.3)',
          overflowX: 'auto',
        }}>
          <div style={{ fontSize: 9, color: '#777', minWidth: 60, alignSelf: 'center' }}>
            HISTORIQUE
          </div>
          {history.length === 0 && (
            <div style={{ fontSize: 11, color: '#666', fontStyle: 'italic', padding: 4 }}>
              —
            </div>
          )}
          {history.map((h, i) => (
            <div key={i} style={{
              padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 800,
              background: h < 2 ? 'rgba(255,58,85,0.15)' : h < 10 ? 'rgba(212,175,55,0.15)' : 'rgba(20,195,86,0.18)',
              color: h < 2 ? '#ff8a9a' : h < 10 ? '#ffd700' : '#a8e88a',
              border: `1px solid ${h < 2 ? 'rgba(255,58,85,0.4)' : h < 10 ? 'rgba(212,175,55,0.4)' : 'rgba(20,195,86,0.4)'}`,
              whiteSpace: 'nowrap',
            }}>{h.toFixed(2)}x</div>
          ))}
        </div>

        {/* Contrôles */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Stake */}
          <div style={{ flex: '0 0 auto' }}>
            <div style={{ fontSize: 10, color: '#cca366', marginBottom: 4 }}>MISE</div>
            <input
              type="number"
              value={stake}
              onChange={(e) => setStake(Math.max(1, Math.floor(Number(e.target.value) || 0)))}
              disabled={phase === 'flying'}
              data-testid="crash-stake"
              style={{
                width: 130, padding: '10px 12px', borderRadius: 8,
                background: 'rgba(0,0,0,0.6)', border: '1px solid #d4af37',
                color: '#ffd700', fontFamily: 'monospace', fontSize: 16, fontWeight: 800,
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              {[100, 1000, 10000, 100000].map((v) => (
                <button key={v}
                  disabled={phase === 'flying'}
                  onClick={() => setStake(v)}
                  style={{
                    flex: 1, padding: '4px 6px', fontSize: 10,
                    background: 'rgba(212,175,55,0.1)',
                    border: '1px solid rgba(212,175,55,0.3)',
                    color: '#cca366', borderRadius: 4, cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}>{fmt(v)}</button>
              ))}
            </div>
          </div>

          {/* Bouton principal */}
          <div style={{ flex: 1 }}>
            {phase === 'flying' ? (
              <button
                data-testid="crash-cashout-btn"
                onClick={cashOut}
                style={{
                  width: '100%', padding: '20px 14px',
                  background: 'linear-gradient(135deg, #14c356, #086a31)',
                  border: '2px solid #1eea60',
                  color: '#fff', fontSize: 18, fontWeight: 900,
                  letterSpacing: 2, borderRadius: 10, cursor: 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: '0 4px 18px rgba(20,195,86,0.4)',
                  animation: 'crashPulse 0.6s ease-in-out infinite',
                }}
              >
                ✓ ENCAISSER {fmt(Math.floor(stake * mul))} $
              </button>
            ) : (
              <button
                data-testid="crash-launch-btn"
                onClick={launch}
                disabled={stake > balance || stake <= 0}
                style={{
                  width: '100%', padding: '20px 14px',
                  background: stake <= balance
                    ? 'linear-gradient(135deg, #b08000, #ffd700)'
                    : '#444',
                  border: 'none', color: stake <= balance ? '#111' : '#888',
                  fontSize: 18, fontWeight: 900, letterSpacing: 2,
                  borderRadius: 10, cursor: stake <= balance ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                }}
              >
                🚀 LANCER (mise {fmt(stake)} $)
              </button>
            )}
            <div style={{ fontSize: 10, color: '#cca366', textAlign: 'center', marginTop: 4 }}>
              Solde : <b style={{ color: '#ffd700' }}>{fmt(balance)} $</b>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes crashPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default CrashGame;
