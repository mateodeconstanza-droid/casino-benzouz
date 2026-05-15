import React, { useState, useEffect, useMemo } from 'react';
import { fmt } from '@/game/constants';
import { STAKE } from '@/game/stake/theme';

// ============================================================
// Wrapper modal arcade (overlay, fermeture ESC, click outside)
// ============================================================
const ArcadeModal = ({ accent, title, emoji, onClose, children }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose && onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.93)',
        zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, backdropFilter: 'blur(10px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(145deg, #0a1020, #050810)',
          border: `2px solid ${accent}`, borderRadius: 18,
          maxWidth: 460, width: '100%', padding: 22, color: '#fff',
          boxShadow: `0 30px 80px rgba(0,0,0,0.75), 0 0 50px ${accent}33`,
        }}
      >
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 14, paddingBottom: 12,
          borderBottom: `1px solid ${accent}33`,
        }}>
          <h3 style={{
            color: accent, margin: 0, letterSpacing: 3,
            fontFamily: 'Georgia, serif', fontSize: 22,
            textShadow: `0 0 12px ${accent}88`,
          }}>{emoji} {title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: `1px solid ${accent}`,
              color: accent, width: 32, height: 32, borderRadius: 8,
              cursor: 'pointer', fontWeight: 800, fontSize: 16,
            }}
          >✕</button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Slider bet (commun aux 3 jeux)
const BetSlider = ({ value, onChange, max, disabled }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{
      fontSize: 11, color: '#aaa', letterSpacing: 1.5, marginBottom: 4,
      display: 'flex', justifyContent: 'space-between',
    }}>
      <span>MISE</span>
      <span style={{ color: STAKE.goldLight, fontWeight: 900 }}>{fmt(value)} $</span>
    </div>
    <input
      type="range"
      min={10}
      max={Math.max(10, Math.min(max, 100000))}
      step={10}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value, 10))}
      disabled={disabled}
      style={{ width: '100%', accentColor: STAKE.gold }}
    />
    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
      {[10, 100, 1000, 10000].map((v) => (
        <button key={v}
          disabled={disabled || v > max}
          onClick={() => onChange(v)}
          style={{
            flex: 1, padding: '5px 0', borderRadius: 6,
            background: value === v ? STAKE.gold : 'rgba(255,255,255,0.05)',
            color: value === v ? '#111' : '#aaa',
            border: `1px solid ${value === v ? STAKE.gold : 'rgba(255,255,255,0.1)'}`,
            cursor: disabled || v > max ? 'not-allowed' : 'pointer',
            fontSize: 11, fontWeight: 800,
          }}
        >{v < 1000 ? v : `${v / 1000}K`}</button>
      ))}
    </div>
  </div>
);

// ============================================================
// 🎲 DICE — High/Low (roll 1-100, parie >50 ou ≤50, gain × 1.95)
// ============================================================
export const ArcadeDice = ({ balance, onResult, onClose }) => {
  const [bet, setBet] = useState(100);
  const [rolling, setRolling] = useState(false);
  const [roll, setRoll] = useState(50);
  const [pick, setPick] = useState(null); // 'high' | 'low'
  const [history, setHistory] = useState([]); // {roll, win}

  const play = (choice) => {
    if (rolling || bet > balance || bet < 10) return;
    setPick(choice);
    setRolling(true);
    onResult(-bet); // débite la mise
    const finalRoll = 1 + Math.floor(Math.random() * 100);
    let frame = 0;
    const total = 25;
    const tick = () => {
      frame++;
      if (frame < total) {
        setRoll(1 + Math.floor(Math.random() * 100));
        setTimeout(tick, 40 + frame * 4);
      } else {
        setRoll(finalRoll);
        const won = (choice === 'high' && finalRoll > 50) || (choice === 'low' && finalRoll <= 50);
        setHistory((h) => [{ roll: finalRoll, win: won }, ...h].slice(0, 8));
        if (won) onResult(Math.floor(bet * 1.95)); // gain net : payout - mise
        setRolling(false);
      }
    };
    tick();
  };

  const rollColor = roll > 50 ? '#3fe6ff' : '#ffd700';
  return (
    <ArcadeModal accent="#ffd700" emoji="🎲" title="DICE — HIGH / LOW" onClose={onClose}>
      <div style={{ textAlign: 'center', padding: '14px 0 18px' }}>
        <div style={{
          fontSize: 72, fontWeight: 900,
          color: rolling ? '#fff' : rollColor,
          textShadow: `0 0 24px ${rollColor}`,
          fontFamily: 'Georgia, serif',
          transition: 'color 0.2s',
        }}>{roll}</div>
        <div style={{ fontSize: 11, color: '#aaa', letterSpacing: 2, marginTop: 4 }}>
          {rolling ? 'LANCEMENT…' : 'PARIE HIGH (>50) OU LOW (≤50)'}
        </div>
      </div>
      <BetSlider value={bet} onChange={setBet} max={balance} disabled={rolling} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          data-testid="dice-low"
          disabled={rolling || bet > balance}
          onClick={() => play('low')}
          style={{
            flex: 1, padding: 14, borderRadius: 10,
            background: pick === 'low' && !rolling
              ? 'linear-gradient(135deg, #ffd700, #c89c00)'
              : 'linear-gradient(135deg, rgba(255,215,0,0.12), rgba(0,0,0,0.4))',
            border: '2px solid #ffd700', color: pick === 'low' ? '#111' : '#ffd700',
            fontSize: 14, fontWeight: 900, letterSpacing: 1.5, cursor: rolling ? 'wait' : 'pointer',
            fontFamily: 'inherit',
          }}
        >▼ LOW (≤50)<br/><span style={{ fontSize: 10, opacity: 0.8 }}>× 1.95</span></button>
        <button
          data-testid="dice-high"
          disabled={rolling || bet > balance}
          onClick={() => play('high')}
          style={{
            flex: 1, padding: 14, borderRadius: 10,
            background: pick === 'high' && !rolling
              ? 'linear-gradient(135deg, #3fe6ff, #0a9ec7)'
              : 'linear-gradient(135deg, rgba(63,230,255,0.12), rgba(0,0,0,0.4))',
            border: '2px solid #3fe6ff', color: pick === 'high' ? '#001828' : '#3fe6ff',
            fontSize: 14, fontWeight: 900, letterSpacing: 1.5, cursor: rolling ? 'wait' : 'pointer',
            fontFamily: 'inherit',
          }}
        >▲ HIGH (&gt;50)<br/><span style={{ fontSize: 10, opacity: 0.8 }}>× 1.95</span></button>
      </div>
      {history.length > 0 && (
        <div style={{
          marginTop: 14, padding: 8, borderRadius: 8,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {history.map((h, i) => (
            <span key={i} style={{
              padding: '3px 8px', borderRadius: 5,
              background: h.win ? '#1a4a2a' : '#4a1a1a',
              border: `1px solid ${h.win ? '#3a8a4a' : '#8a3a3a'}`,
              color: h.win ? '#a8e88a' : '#ff8a9a',
              fontSize: 11, fontWeight: 800,
            }}>{h.roll}</span>
          ))}
        </div>
      )}
    </ArcadeModal>
  );
};

// ============================================================
// 🪙 COIN FLIP — Pile / Face (gain × 1.95)
// ============================================================
export const ArcadeCoinFlip = ({ balance, onResult, onClose }) => {
  const [bet, setBet] = useState(100);
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState(null); // 'pile' | 'face' | null
  const [history, setHistory] = useState([]);

  const flip = (choice) => {
    if (flipping || bet > balance || bet < 10) return;
    setFlipping(true);
    setResult(null);
    onResult(-bet);
    const final = Math.random() < 0.5 ? 'pile' : 'face';
    setTimeout(() => {
      setResult(final);
      const won = choice === final;
      setHistory((h) => [{ result: final, win: won }, ...h].slice(0, 8));
      if (won) onResult(Math.floor(bet * 1.95));
      setFlipping(false);
    }, 1400);
  };

  return (
    <ArcadeModal accent="#ffa500" emoji="🪙" title="PILE OU FACE" onClose={onClose}>
      <div style={{ textAlign: 'center', padding: '24px 0 18px' }}>
        <div
          style={{
            fontSize: 96, lineHeight: 1,
            animation: flipping ? 'flipCoin 0.18s linear infinite' : 'none',
            transformOrigin: 'center',
            display: 'inline-block',
            filter: 'drop-shadow(0 0 24px rgba(255,165,0,0.45))',
          }}
        >🪙</div>
        <div style={{ marginTop: 8, fontSize: 18, fontWeight: 900, letterSpacing: 2,
          color: result === 'pile' ? '#ffd700' : result === 'face' ? '#ffa500' : '#aaa' }}>
          {flipping ? '…' : result ? (result === 'pile' ? 'PILE' : 'FACE') : '—'}
        </div>
      </div>
      <BetSlider value={bet} onChange={setBet} max={balance} disabled={flipping} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          data-testid="coin-pile"
          disabled={flipping || bet > balance}
          onClick={() => flip('pile')}
          style={{
            flex: 1, padding: 14, borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(0,0,0,0.4))',
            border: '2px solid #ffd700', color: '#ffd700',
            fontSize: 14, fontWeight: 900, letterSpacing: 1.5, cursor: flipping ? 'wait' : 'pointer',
            fontFamily: 'inherit',
          }}
        >👑 PILE<br/><span style={{ fontSize: 10, opacity: 0.8 }}>× 1.95</span></button>
        <button
          data-testid="coin-face"
          disabled={flipping || bet > balance}
          onClick={() => flip('face')}
          style={{
            flex: 1, padding: 14, borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(255,165,0,0.15), rgba(0,0,0,0.4))',
            border: '2px solid #ffa500', color: '#ffa500',
            fontSize: 14, fontWeight: 900, letterSpacing: 1.5, cursor: flipping ? 'wait' : 'pointer',
            fontFamily: 'inherit',
          }}
        >🦅 FACE<br/><span style={{ fontSize: 10, opacity: 0.8 }}>× 1.95</span></button>
      </div>
      {history.length > 0 && (
        <div style={{
          marginTop: 14, display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {history.map((h, i) => (
            <span key={i} style={{
              padding: '3px 8px', borderRadius: 5,
              background: h.win ? '#1a4a2a' : '#4a1a1a',
              border: `1px solid ${h.win ? '#3a8a4a' : '#8a3a3a'}`,
              color: h.win ? '#a8e88a' : '#ff8a9a',
              fontSize: 11, fontWeight: 800,
            }}>{h.result === 'pile' ? '👑' : '🦅'}</span>
          ))}
        </div>
      )}
      <style>{`
        @keyframes flipCoin {
          0% { transform: rotateY(0deg); }
          50% { transform: rotateY(180deg) scaleX(-1); }
          100% { transform: rotateY(360deg); }
        }
      `}</style>
    </ArcadeModal>
  );
};

// ============================================================
// 💎 MINES — Grid 5×5, choisis le nombre de bombes (1-12)
// Multiplier croît à chaque case sûre. Cash out à tout moment.
// ============================================================
const minesMultiplier = (revealed, bombs) => {
  // Approximation simple : multiplier = (25 / (25 - bombs)) ** revealed × 0.97 (house edge)
  if (revealed === 0) return 1;
  const safe = 25 - bombs;
  let m = 0.97;
  for (let i = 0; i < revealed; i++) m *= (25 - i) / (safe - i);
  return Math.max(1, m);
};

export const ArcadeMines = ({ balance, onResult, onClose }) => {
  const [bet, setBet] = useState(100);
  const [bombs, setBombs] = useState(3);
  const [grid, setGrid] = useState(() => Array(25).fill(null)); // null | 'safe' | 'bomb'
  const [active, setActive] = useState(false);
  const [bombPositions, setBombPositions] = useState([]);
  const [revealed, setRevealed] = useState(0);
  const currentMul = useMemo(() => minesMultiplier(revealed, bombs), [revealed, bombs]);
  const currentPayout = Math.floor(bet * currentMul);

  const start = () => {
    if (active || bet > balance || bet < 10) return;
    const positions = new Set();
    while (positions.size < bombs) {
      positions.add(Math.floor(Math.random() * 25));
    }
    setBombPositions(Array.from(positions));
    setGrid(Array(25).fill(null));
    setRevealed(0);
    setActive(true);
    onResult(-bet);
  };

  const reveal = (i) => {
    if (!active || grid[i] !== null) return;
    if (bombPositions.includes(i)) {
      // BOOM
      const newGrid = [...grid];
      bombPositions.forEach((p) => { newGrid[p] = 'bomb'; });
      setGrid(newGrid);
      setActive(false);
      // Pas de gain (mise déjà débitée au start)
    } else {
      const newGrid = [...grid];
      newGrid[i] = 'safe';
      setGrid(newGrid);
      setRevealed(revealed + 1);
    }
  };

  const cashOut = () => {
    if (!active || revealed === 0) return;
    onResult(currentPayout); // payout brut (mise déjà débitée)
    setActive(false);
    // Reveal all bombs
    const newGrid = [...grid];
    bombPositions.forEach((p) => { if (newGrid[p] === null) newGrid[p] = 'bomb'; });
    setGrid(newGrid);
  };

  return (
    <ArcadeModal accent="#ff00aa" emoji="💎" title="MINES" onClose={onClose}>
      {!active && (
        <>
          <BetSlider value={bet} onChange={setBet} max={balance} />
          <div style={{
            fontSize: 11, color: '#aaa', letterSpacing: 1.5, marginBottom: 4,
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>BOMBES</span><span style={{ color: '#ff00aa', fontWeight: 900 }}>{bombs}</span>
          </div>
          <input
            type="range" min={1} max={12} value={bombs}
            onChange={(e) => setBombs(parseInt(e.target.value, 10))}
            style={{ width: '100%', accentColor: '#ff00aa' }}
          />
          <button
            data-testid="mines-start"
            disabled={bet > balance}
            onClick={start}
            style={{
              width: '100%', marginTop: 16, padding: 14, borderRadius: 10,
              background: 'linear-gradient(135deg, #ff00aa, #8a0066)',
              color: '#fff', border: 'none',
              fontSize: 14, fontWeight: 900, letterSpacing: 2,
              cursor: bet > balance ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              boxShadow: '0 8px 20px rgba(255,0,170,0.4)',
            }}
          >LANCER 💎</button>
        </>
      )}
      {active && (
        <>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 12px', borderRadius: 8, marginBottom: 12,
            background: 'rgba(255,0,170,0.08)', border: '1px solid rgba(255,0,170,0.3)',
          }}>
            <div style={{ fontSize: 11, color: '#aaa' }}>GAIN POTENTIEL</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#ff00aa' }}>
              {fmt(currentPayout)} $ <span style={{ fontSize: 11, color: '#aaa' }}>× {currentMul.toFixed(2)}</span>
            </div>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6,
            marginBottom: 12,
          }}>
            {grid.map((cell, i) => {
              const isRevealed = cell !== null;
              const isBomb = cell === 'bomb';
              return (
                <button
                  key={i}
                  data-testid={`mines-cell-${i}`}
                  onClick={() => reveal(i)}
                  disabled={isRevealed}
                  style={{
                    aspectRatio: '1', borderRadius: 8,
                    background: isBomb
                      ? 'linear-gradient(135deg, #ff2244, #8a0010)'
                      : isRevealed
                        ? 'linear-gradient(135deg, #2a8a4a, #145a2a)'
                        : 'rgba(255,255,255,0.05)',
                    border: `1.5px solid ${isBomb ? '#ff2244' : isRevealed ? '#3fe6ff' : 'rgba(255,255,255,0.1)'}`,
                    fontSize: 22, cursor: isRevealed ? 'default' : 'pointer',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  {isBomb ? '💣' : isRevealed ? '💎' : ''}
                </button>
              );
            })}
          </div>
          <button
            data-testid="mines-cashout"
            disabled={revealed === 0}
            onClick={cashOut}
            style={{
              width: '100%', padding: 12, borderRadius: 10,
              background: revealed > 0
                ? 'linear-gradient(135deg, #3fe6ff, #0a9ec7)'
                : 'rgba(255,255,255,0.05)',
              color: revealed > 0 ? '#001828' : '#666',
              border: 'none', fontWeight: 900, fontSize: 13, letterSpacing: 1.5,
              cursor: revealed > 0 ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
            }}
          >{revealed > 0 ? `💰 ENCAISSER ${fmt(currentPayout)} $` : 'Révèle au moins 1 case'}</button>
        </>
      )}
      {!active && grid.some((c) => c !== null) && (
        <div style={{
          marginTop: 12, padding: 10, borderRadius: 8,
          background: 'rgba(255,255,255,0.03)', textAlign: 'center',
          fontSize: 12, color: '#aaa',
        }}>
          Partie terminée — relance ci-dessus 🎯
        </div>
      )}
    </ArcadeModal>
  );
};
