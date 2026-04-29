import React, { useEffect, useMemo } from 'react';
import { fmt, TROPHIES } from '@/game/constants';
// ============== ÉCRAN TROPHÉES COMPLET ==============
const TrophyScreen = ({ profile, casino, onClose }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 20, overflowY: 'auto',
    fontFamily: 'Georgia, serif',
  }}>
    <div style={{
      background: 'linear-gradient(145deg, #1a0f05, #0a0503)',
      border: `3px solid ${casino.secondary}`, borderRadius: 12,
      padding: 24, maxWidth: 500, width: '100%',
      maxHeight: '90vh', overflowY: 'auto',
      boxShadow: `0 0 40px ${casino.secondary}44`,
    }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div>
        <h2 style={{ color: casino.secondary, margin: 0, letterSpacing: 2 }}>
          TES TROPHÉES
        </h2>
        <div style={{ color: '#cca366', fontSize: 12, marginTop: 6, fontStyle: 'italic' }}>
          Gains cumulés : <strong style={{color: '#ffd700'}}>{fmt(profile.totalWinnings)} $</strong>
        </div>
      </div>

      {TROPHIES.map((t) => {
        const earned = profile.totalWinnings >= t.threshold;
        const progress = Math.min(100, (profile.totalWinnings / t.threshold) * 100);
        return (
          <div key={t.name} style={{
            padding: 14, marginBottom: 10,
            background: earned ? `${t.color}22` : 'rgba(255,255,255,0.03)',
            border: `2px solid ${earned ? t.color : '#333'}`,
            borderRadius: 10,
            opacity: earned ? 1 : 0.6,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                fontSize: 36,
                filter: earned ? 'drop-shadow(0 0 10px ' + t.color + ')' : 'grayscale(1)',
              }}>{t.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: earned ? t.color : '#888', fontWeight: 'bold', fontSize: 16 }}>
                  {t.name} {earned && '✓'}
                </div>
                <div style={{ color: '#888', fontSize: 11 }}>
                  {fmt(t.threshold)} $ cumulés
                </div>
                <div style={{ color: earned ? '#00ff88' : '#666', fontSize: 11, marginTop: 2 }}>
                  Récompense : +{fmt(t.reward)} $
                </div>
              </div>
            </div>
            {!earned && (
              <div style={{
                background: '#222', height: 6, borderRadius: 3, marginTop: 8, overflow: 'hidden',
              }}>
                <div style={{
                  width: `${progress}%`, height: '100%',
                  background: `linear-gradient(90deg, ${t.color}, #fff)`,
                }} />
              </div>
            )}
          </div>
        );
      })}

      <button onClick={onClose} style={{
        width: '100%', marginTop: 10, padding: 12,
        background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
        color: '#fff', border: 'none', borderRadius: 8,
        fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit',
        fontSize: 14,
      }}>Fermer</button>
    </div>
  </div>
);

// ============== TROPHÉE DÉBLOQUÉ — animation plein écran (paillettes + son) ==============
const TrophyUnlock = ({ trophy, onClose }) => {
  // Joue un son de victoire dès le mount + cleanup audio context
  useEffect(() => {
    let ctx;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Fanfare ascendante : 3 notes (C5, E5, G5) en arpège
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        osc.connect(gain); gain.connect(ctx.destination);
        const start = ctx.currentTime + i * 0.12;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
        osc.start(start);
        osc.stop(start + 0.55);
      });
      // Cymbal final (filtered noise)
      setTimeout(() => {
        if (!ctx || ctx.state === 'closed') return;
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const cgain = ctx.createGain();
        cgain.gain.setValueAtTime(0.12, ctx.currentTime);
        cgain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        src.connect(cgain); cgain.connect(ctx.destination);
        src.start();
      }, 350);
    } catch (_e) { /* noop */ }
    return () => {
      try { if (ctx && ctx.state !== 'closed') ctx.close(); } catch (_e) { /* noop */ }
    };
  }, []);

  // 50 confettis générés une fois (stabilité au re-render)
  const confetti = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 50; i++) {
      const colors = [trophy.color, '#ffd700', '#ff2ad4', '#3fe6ff', '#ffffff', '#ff8a3a'];
      arr.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2 + Math.random() * 1.5,
        color: colors[i % colors.length],
        size: 8 + Math.random() * 10,
        rotate: Math.random() * 360,
      });
    }
    return arr;
  }, [trophy.name, trophy.color]);

  return (
    <div
      data-testid="trophy-unlock-overlay"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 5000,
        background: `radial-gradient(circle at 50% 40%, ${trophy.color}55 0%, rgba(0,0,0,0.85) 70%)`,
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', overflow: 'hidden',
        animation: 'trophy-overlay-in 0.4s ease-out',
      }}
    >
      {/* Confetti */}
      {confetti.map(c => (
        <div key={c.id} style={{
          position: 'absolute',
          left: `${c.left}%`, top: '-30px',
          width: c.size, height: c.size * 0.4,
          background: c.color,
          borderRadius: 2,
          animation: `trophy-confetti ${c.duration}s ${c.delay}s linear forwards`,
          transform: `rotate(${c.rotate}deg)`,
          boxShadow: `0 0 8px ${c.color}80`,
        }} />
      ))}

      {/* Lignes de rayons partant du centre */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: 6, height: '120vh',
        transform: 'translate(-50%,-50%)',
        background: `repeating-conic-gradient(from 0deg, transparent 0deg 8deg, ${trophy.color}40 8deg 16deg)`,
        animation: 'trophy-rays-spin 6s linear infinite',
        pointerEvents: 'none',
      }} />

      {/* Carte centrale */}
      <div style={{
        position: 'relative',
        padding: '36px 50px',
        borderRadius: 20,
        background: `linear-gradient(135deg, rgba(0,0,0,0.85), rgba(20,15,30,0.9))`,
        border: `4px solid ${trophy.color}`,
        boxShadow: `0 0 80px ${trophy.color}, inset 0 0 32px ${trophy.color}40`,
        textAlign: 'center',
        color: '#fff',
        animation: 'trophy-card-in 0.6s cubic-bezier(.2,.9,.25,1.6) forwards',
        transform: 'scale(0)',
        maxWidth: '90vw',
      }}>
        <div style={{
          fontSize: 13, letterSpacing: 6,
          color: trophy.color, marginBottom: 14,
          textTransform: 'uppercase',
          textShadow: `0 0 12px ${trophy.color}`,
        }}>★ NOUVEAU RANG DÉBLOQUÉ ★</div>
        <div style={{
          fontSize: 'clamp(80px, 14vw, 140px)',
          lineHeight: 1, marginBottom: 14,
          filter: `drop-shadow(0 0 30px ${trophy.color})`,
          animation: 'trophy-icon-pop 1s ease-out infinite alternate',
        }}>{trophy.icon}</div>
        <div style={{
          fontSize: 'clamp(36px, 6vw, 64px)',
          fontWeight: 900,
          color: trophy.color,
          letterSpacing: 6,
          textShadow: `0 0 20px ${trophy.color}, 0 0 40px ${trophy.color}80`,
          marginBottom: 12,
        }}>{trophy.name.toUpperCase()}</div>
        <div style={{
          display: 'inline-block',
          padding: '10px 22px',
          background: 'linear-gradient(135deg, #ffd700, #ff8a3a)',
          color: '#1a1a1a', borderRadius: 12,
          fontWeight: 800, fontSize: 18, letterSpacing: 1,
          boxShadow: '0 6px 16px rgba(255,215,0,0.5)',
        }}>+ {fmt(trophy.reward)} $ BONUS</div>

        {/* Bouton partager */}
        <div style={{ marginTop: 18 }}>
          <button
            data-testid="trophy-share-btn"
            onClick={(e) => {
              e.stopPropagation();
              const text = `🎰 Je viens de débloquer le rang ${trophy.icon} ${trophy.name} sur GambleLife ! +${fmt(trophy.reward)}$ bonus 💰`;
              const url = window.location.href;
              if (navigator.share) {
                navigator.share({ title: 'GambleLife — Nouveau rang !', text, url }).catch(() => {});
              } else {
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
              }
            }}
            style={{
              padding: '8px 18px', borderRadius: 8,
              background: 'linear-gradient(135deg, #1da1f2, #0d8ed4)',
              color: '#fff', border: 'none', fontSize: 13, fontWeight: 800,
              letterSpacing: 1, cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(29,161,242,0.5)',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            🚀 Partager mon rang
          </button>
        </div>

        <div style={{
          marginTop: 22, fontSize: 11, color: '#888',
          letterSpacing: 2, opacity: 0.7,
        }}>CLIQUE N'IMPORTE OÙ POUR CONTINUER</div>
      </div>

      <style>{`
        @keyframes trophy-overlay-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes trophy-card-in {
          0% { transform: scale(0) rotate(-15deg); opacity: 0; }
          70% { transform: scale(1.1) rotate(2deg); opacity: 1; }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        @keyframes trophy-icon-pop {
          0% { transform: scale(1); }
          100% { transform: scale(1.06); }
        }
        @keyframes trophy-confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes trophy-rays-spin {
          from { transform: translate(-50%,-50%) rotate(0deg); }
          to   { transform: translate(-50%,-50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
};


export { TrophyScreen, TrophyUnlock };
