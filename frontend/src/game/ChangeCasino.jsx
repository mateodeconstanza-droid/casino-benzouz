import React, { useState } from 'react';
import { fmt, CASINOS } from '@/game/constants';
// ============== CHANGEMENT DE CASINO ==============
const ChangeCasinoScreen = ({ currentCasino, onChoose, onCancel }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1500, padding: 20, overflowY: 'auto',
    fontFamily: 'Georgia, serif',
  }}>
    <div style={{
      background: 'linear-gradient(145deg, #2a1a0a, #0a0503)',
      border: '2px solid #ffd700', borderRadius: 14,
      padding: 24, maxWidth: 700, width: '100%',
      maxHeight: '90vh', overflowY: 'auto',
    }}>
      <h2 style={{
        color: '#ffd700', textAlign: 'center', margin: 0, marginBottom: 8,
        letterSpacing: 3, textShadow: '0 0 15px #ffd700',
      }}>🌍 CHANGER DE CASINO</h2>
      <div style={{ color: '#cca366', fontSize: 13, textAlign: 'center', marginBottom: 20, fontStyle: 'italic' }}>
        Ton solde et ta progression sont conservés
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
      }}>
        {Object.entries(CASINOS).map(([id, c]) => {
          const isCurrent = id === currentCasino;
          return (
            <button key={id}
              onClick={() => !isCurrent && onChoose(id)}
              disabled={isCurrent}
              style={{
                padding: 16,
                background: isCurrent
                  ? 'rgba(100,100,100,0.3)'
                  : `linear-gradient(135deg, ${c.primary}33, ${c.accent}33)`,
                border: isCurrent ? '2px solid #666' : `2px solid ${c.primary}`,
                borderRadius: 10, cursor: isCurrent ? 'not-allowed' : 'pointer',
                color: isCurrent ? '#888' : '#fff',
                fontFamily: 'inherit',
                opacity: isCurrent ? 0.5 : 1,
                transition: 'transform 0.15s',
              }}
              onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.transform = 'scale(1.03)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <div style={{ fontSize: 26, marginBottom: 4 }}>{c.country}</div>
              <div style={{ fontWeight: 'bold', fontSize: 13 }}>{c.name}</div>
              <div style={{ fontSize: 10, opacity: 0.8, fontStyle: 'italic', marginTop: 4 }}>
                {c.tagline}
              </div>
              <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 6 }}>
                {c.flag.map((col, i) => (
                  <div key={i} style={{
                    width: 14, height: 6, background: col,
                    borderRadius: 1, border: '0.5px solid rgba(0,0,0,0.2)',
                  }} />
                ))}
              </div>
              {isCurrent && (
                <div style={{ color: '#ffd700', fontSize: 11, fontWeight: 'bold', marginTop: 8 }}>
                  ✓ Actuel
                </div>
              )}
            </button>
          );
        })}
      </div>

      <button onClick={onCancel} style={{
        width: '100%', marginTop: 16, padding: 10,
        background: 'transparent', border: '1px solid #888',
        color: '#888', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
      }}>Annuler</button>
    </div>
  </div>
);


// ============== SÉLECTEUR DE TABLE VIP ==============
const TableSelector = ({ gameId, balance, casino, onCancel, onChoose }) => {
  const gameName = { blackjack: '🃏 BLACKJACK', roulette: '🎡 ROULETTE', highcard: '🎴 CARTE HAUTE', poker: '♠ POKER HOLDEM' }[gameId];
  const tables = [
    { label: 'Classique', min: 20, color: '#888', chipNote: 'Jetons 5 → 500' },
    { label: 'VIP Silver', min: 5000, color: '#c0c0c0', chipNote: 'Plaquettes 5K → 500K' },
    { label: 'VIP Gold', min: 30000, color: '#ffd700', chipNote: 'Plaquettes 10K → 1M' },
    { label: 'VIP Platinum', min: 100000, color: '#e5e4e2', chipNote: 'Plaquettes 50K → 5M' },
    { label: 'VIP Diamond', min: 1000000, color: '#b9f2ff', chipNote: 'Plaquettes 100K → 10M' },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1500, padding: 20, fontFamily: 'Georgia, serif',
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #1a0a0a, #0a0503)',
        border: `3px solid ${casino.secondary}`, borderRadius: 14,
        padding: 24, maxWidth: 500, width: '100%',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 22, color: casino.secondary, letterSpacing: 2 }}>
            {gameName}
          </div>
          <div style={{ color: '#cca366', fontSize: 12, fontStyle: 'italic', marginTop: 4 }}>
            Choisis ta table — Solde : {fmt(balance)} B
          </div>
        </div>

        {tables.map((t, i) => {
          const canAfford = balance >= t.min;
          return (
            <button key={i}
              onClick={() => canAfford && onChoose(t.min)}
              disabled={!canAfford}
              style={{
                width: '100%', padding: 14, marginBottom: 10,
                background: canAfford
                  ? `linear-gradient(135deg, ${t.color}33, ${t.color}11)`
                  : 'rgba(50,50,50,0.3)',
                border: `2px solid ${canAfford ? t.color : '#444'}`,
                color: '#fff', borderRadius: 10,
                cursor: canAfford ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
                textAlign: 'left', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', gap: 12,
                opacity: canAfford ? 1 : 0.4,
              }}>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: 16, color: canAfford ? t.color : '#888' }}>
                  {t.min >= 5000 && '💎 '}{t.label}
                </div>
                <div style={{ fontSize: 11, color: '#cca366', marginTop: 2 }}>
                  {t.chipNote}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#888' }}>Min.</div>
                <div style={{ fontSize: 15, color: canAfford ? casino.secondary : '#666', fontWeight: 'bold' }}>
                  {fmt(t.min)} B
                </div>
              </div>
            </button>
          );
        })}

        <button onClick={onCancel} style={{
          width: '100%', marginTop: 8, padding: 10,
          background: 'transparent', border: '1px solid #888',
          color: '#888', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
        }}>Annuler</button>
      </div>
    </div>
  );
};



export { ChangeCasinoScreen, TableSelector };
