import React, { useState, useEffect, useRef } from 'react';
import { fmt, handValue, createDeck, RED_NUMBERS, ROULETTE_NUMBERS, WHEEL_PRIZES, WEAPONS, VEHICLES, HAIR_CATALOG, OUTFIT_CATALOG, SHOES_CATALOG, TROPHIES, CASINOS, DEALER_PROFILES, CASINO_3D_COLORS, BENZBET_MATCHES, generateMatches, BENZBET_KEY, getColor, bjValue, sportBtnStyle, FOUR_HOURS, POKER_HAND_NAMES, evaluatePokerHand, evaluateHand5, compareTB } from '@/game/constants';
import { Card, Chip, ChipStack, GameHeader, btnStyle, menuBtnStyle, StatCard, ArrowButton, Dealer, WeaponIcon, FlyingProjectile, pokerBtnStyle, numStyle, choiceBtn, VehicleGraphic, WeaponMenu } from '@/game/ui';

// ============== ATM - 1 retrait max par cycle de 5 min ==============
const ATM = ({ profile, balance, setBalance, saveProfile, setProfile, onClose, casino }) => {
  const [countdown, setCountdown] = useState('');
  const [phase, setPhase] = useState('check');

  const now = Date.now();
  const FIVE_MIN = 5 * 60 * 1000;
  const lastCycleStart = profile.atmCycleStart || 0;
  const withdrawsThisCycle = profile.atmWithdrawsThisCycle || 0;
  const cycleAge = now - lastCycleStart;

  // Si le cycle a plus de 5 min → reset
  let nbLeft, nextAmount, cycleResetIn;
  if (lastCycleStart === 0 || cycleAge >= FIVE_MIN) {
    // Nouveau cycle : 1 retrait possible
    nbLeft = 1;
    nextAmount = 15000;
    cycleResetIn = 0;
  } else {
    nbLeft = Math.max(0, 1 - withdrawsThisCycle);
    nextAmount = 15000;
    cycleResetIn = lastCycleStart + FIVE_MIN - now;
  }

  useEffect(() => {
    if (nbLeft > 0) return;
    const update = () => {
      const remaining = lastCycleStart + FIVE_MIN - Date.now();
      if (remaining <= 0) { setCountdown('Disponible !'); return; }
      const m = Math.floor(remaining / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setCountdown(`${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [nbLeft, lastCycleStart]);

  const handleWithdraw = async () => {
    setPhase('withdrawing');
    const amount = nextAmount;
    const isNewCycle = lastCycleStart === 0 || cycleAge >= FIVE_MIN;
    setTimeout(async () => {
      setBalance(b => b + amount);
      const updated = {
        ...profile,
        balance: balance + amount,
        atmCycleStart: isNewCycle ? Date.now() : lastCycleStart,
        atmWithdrawsThisCycle: isNewCycle ? 1 : withdrawsThisCycle + 1,
      };
      setProfile(updated);
      await saveProfile(updated);
      setPhase('done');
    }, 1500);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20,
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #0a2a0a, #051a05)',
        border: '3px solid #00aa44', borderRadius: 12,
        padding: 24, maxWidth: 440, width: '100%',
        fontFamily: 'Georgia, serif',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>🏧</div>
          <h2 style={{ color: '#00ff88', margin: 0, letterSpacing: 2 }}>DISTRIBUTEUR</h2>
          <div style={{ color: '#cca366', fontSize: 11, fontStyle: 'italic', marginTop: 4 }}>
            1 retrait max par cycle de 5 min
          </div>
        </div>

        {phase === 'check' && (
          <>
            {nbLeft > 0 ? (
              <div style={{
                background: 'rgba(0,0,0,0.5)',
                border: `2px solid ${nextAmount === 40000 ? '#ffd700' : '#00aa44'}`,
                borderRadius: 8, padding: 16, marginBottom: 12, textAlign: 'center',
                boxShadow: nextAmount === 40000 ? '0 0 20px rgba(255,215,0,0.3)' : 'none',
              }}>
                <div style={{ color: nextAmount === 40000 ? '#ffd700' : '#cca366', fontSize: 12, marginBottom: 4 }}>
                  {nextAmount === 40000 ? '💎 2ÈME RETRAIT DU CYCLE' : 'RETRAIT DISPONIBLE'}
                </div>
                <div style={{ color: '#00ff88', fontSize: 30, fontWeight: 'bold' }}>
                  {fmt(nextAmount)} €
                </div>
                <div style={{ color: '#cca366', fontSize: 11, margin: '6px 0' }}>↓ conversion 1:1 ↓</div>
                <div style={{ color: '#ffd700', fontSize: 30, fontWeight: 'bold' }}>
                  {fmt(nextAmount)} B
                </div>
                <button onClick={handleWithdraw} style={{
                  width: '100%', marginTop: 12, padding: 12,
                  background: nextAmount === 40000
                    ? 'linear-gradient(135deg, #ffd700, #b8860b)'
                    : 'linear-gradient(135deg, #00ff88, #00aa44)',
                  color: '#000', border: 'none', borderRadius: 8,
                  fontSize: 16, fontWeight: 'bold', cursor: 'pointer',
                  fontFamily: 'inherit',
                }}>RETIRER {fmt(nextAmount)} B</button>
                <div style={{ fontSize: 10, color: '#888', marginTop: 8, fontStyle: 'italic' }}>
                  {nbLeft} retrait(s) restant(s) dans ce cycle
                  {lastCycleStart > 0 && cycleAge < FIVE_MIN && (
                    <><br/>Cycle se termine dans {Math.ceil((FIVE_MIN - cycleAge) / 60000)} min</>
                  )}
                </div>
              </div>
            ) : (
              <div style={{
                background: 'rgba(0,0,0,0.5)', padding: 16, borderRadius: 8,
                textAlign: 'center', marginBottom: 12,
              }}>
                <div style={{ color: '#cca366', fontSize: 13, marginBottom: 6 }}>
                  Tu as déjà retiré 1 fois dans ce cycle
                </div>
                <div style={{ color: '#cca366', fontSize: 12, marginBottom: 4 }}>
                  Nouveau retrait dans :
                </div>
                <div style={{ color: '#ffd700', fontSize: 28, fontWeight: 'bold' }}>{countdown}</div>
              </div>
            )}
          </>
        )}

        {phase === 'withdrawing' && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💵</div>
            <div style={{ color: '#ffd700', fontSize: 16 }}>Traitement en cours...</div>
            <div style={{ marginTop: 16 }}>
              <div style={{
                width: 200, height: 4, margin: '0 auto',
                background: '#333', borderRadius: 2, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', background: 'linear-gradient(90deg, #00ff88, #ffd700)',
                  animation: 'atmLoad 1.5s linear forwards',
                }} />
              </div>
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>✓</div>
            <div style={{ color: '#00ff88', fontSize: 18, fontWeight: 'bold' }}>
              Retrait effectué !
            </div>
            <div style={{ color: '#cca366', fontSize: 12, marginTop: 8 }}>
              Solde : {fmt(balance)} B
            </div>
          </div>
        )}

        <button onClick={onClose} style={{
          width: '100%', marginTop: 8, padding: 10,
          background: 'transparent', border: '1px solid #888',
          color: '#888', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
        }}>Fermer</button>
      </div>
      <style>{`
        @keyframes atmLoad {
          from { width: 0; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};



export default ATM;
