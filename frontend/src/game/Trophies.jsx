import React from 'react';
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

// ============== TROPHÉE DÉBLOQUÉ ==============
const TrophyUnlock = ({ trophy, onClose }) => (
  <div onClick={onClose} style={{
    position: 'fixed', top: 20, left: '50%',
    transform: 'translateX(-50%)',
    background: `linear-gradient(135deg, ${trophy.color}, ${trophy.color}88)`,
    border: '2px solid #fff', borderRadius: 12, padding: 16,
    color: '#000', fontFamily: 'Georgia, serif',
    boxShadow: '0 0 40px ' + trophy.color,
    zIndex: 2000, animation: 'trophyPop 0.5s ease-out',
    display: 'flex', alignItems: 'center', gap: 12,
    maxWidth: '90vw', cursor: 'pointer',
  }}>
    <div style={{ fontSize: 40 }}>{trophy.icon}</div>
    <div>
      <div style={{ fontSize: 12, opacity: 0.7 }}>TROPHÉE DÉBLOQUÉ !</div>
      <div style={{ fontSize: 20, fontWeight: 'bold' }}>{trophy.name}</div>
      <div style={{ fontSize: 11 }}>+{fmt(trophy.reward)} $ bonus !</div>
    </div>
  </div>
);


export { TrophyScreen, TrophyUnlock };
