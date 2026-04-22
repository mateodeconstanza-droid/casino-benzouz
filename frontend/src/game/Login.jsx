import React, { useState, useEffect, useRef } from 'react';
import { fmt, handValue, createDeck, RED_NUMBERS, ROULETTE_NUMBERS, WHEEL_PRIZES, WEAPONS, VEHICLES, HAIR_CATALOG, OUTFIT_CATALOG, SHOES_CATALOG, TROPHIES, CASINOS, DEALER_PROFILES, CASINO_3D_COLORS, BENZBET_MATCHES, generateMatches, BENZBET_KEY, getColor, bjValue, sportBtnStyle, FOUR_HOURS, POKER_HAND_NAMES, evaluatePokerHand, evaluateHand5, compareTB } from '@/game/constants';
import { Card, Chip, ChipStack, GameHeader, btnStyle, menuBtnStyle, StatCard, ArrowButton, Dealer, WeaponIcon, FlyingProjectile, pokerBtnStyle, numStyle, choiceBtn, VehicleGraphic, WeaponMenu } from '@/game/ui';

// ============== ÉCRAN DE CONNEXION + CASINO ==============
const LoginScreen = ({ onLogin, savedProfiles }) => {
  const [name, setName] = useState('');
  const [selectedCasino, setSelectedCasino] = useState(null);
  const [mode, setMode] = useState('select');

  if (mode === 'select' && savedProfiles.length > 0) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at center, #1a0a0a 0%, #000 70%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, fontFamily: 'Georgia, serif',
      }}>
        <div style={{
          background: 'linear-gradient(145deg, #2a1a0a, #0a0503)',
          border: '2px solid #ffd700', borderRadius: 12, padding: 40,
          maxWidth: 500, width: '100%',
          boxShadow: '0 0 60px rgba(255,215,0,0.3)',
        }}>
          <h1 style={{
            color: '#ffd700', fontSize: 42, textAlign: 'center', margin: 0,
            textShadow: '0 0 20px rgba(255,215,0,0.6)', letterSpacing: 3,
          }}>BENZOUZ</h1>
          <div style={{ textAlign: 'center', color: '#cca366', fontStyle: 'italic', marginBottom: 30 }}>
            ~ Casino Royal ~
          </div>

          <div style={{ color: '#ffd700', marginBottom: 12, fontSize: 14 }}>Profils existants :</div>
          {savedProfiles.map((p) => {
            const c = CASINOS[p.casino] || CASINOS.vegas;
            return (
              <button key={p.name} onClick={() => onLogin(p.name, false)}
                style={{
                  width: '100%', padding: 14, marginBottom: 8,
                  background: `linear-gradient(90deg, ${c.primary}22, transparent)`,
                  border: `1px solid ${c.primary}`, borderRadius: 8, color: '#fff',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 15,
                  textAlign: 'left', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <div>
                  <div>{c.country} {p.name}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{c.name}</div>
                </div>
                <span style={{ color: c.primary, fontSize: 13 }}>{fmt(p.totalWinnings)} B</span>
              </button>
            );
          })}
          <button onClick={() => setMode('new')}
            style={{
              width: '100%', padding: 12, marginTop: 8, background: 'transparent',
              border: '1px dashed #cca366', color: '#cca366',
              borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
            }}>+ Nouveau joueur</button>
        </div>
      </div>
    );
  }

  // Sélection casino + nom
  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at center, #1a0a0a 0%, #000 70%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, fontFamily: 'Georgia, serif',
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #2a1a0a, #0a0503)',
        border: '2px solid #ffd700', borderRadius: 12, padding: 30,
        maxWidth: 700, width: '100%',
        boxShadow: '0 0 60px rgba(255,215,0,0.3)',
      }}>
        <h1 style={{
          color: '#ffd700', fontSize: 42, textAlign: 'center', margin: 0,
          textShadow: '0 0 20px rgba(255,215,0,0.6)', letterSpacing: 3,
        }}>BENZOUZ</h1>
        <div style={{ textAlign: 'center', color: '#cca366', fontStyle: 'italic', marginBottom: 25 }}>
          ~ Choisis ton casino ~
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10, marginBottom: 25,
        }}>
          {Object.entries(CASINOS).map(([id, c]) => (
            <button key={id} onClick={() => setSelectedCasino(id)}
              style={{
                padding: 16,
                background: selectedCasino === id 
                  ? `linear-gradient(135deg, ${c.primary}, ${c.accent})`
                  : 'rgba(0,0,0,0.4)',
                border: selectedCasino === id ? `3px solid ${c.secondary}` : `2px solid ${c.primary}`,
                borderRadius: 10, cursor: 'pointer',
                color: selectedCasino === id ? '#fff' : '#ccc',
                transition: 'all 0.2s', fontFamily: 'inherit',
                transform: selectedCasino === id ? 'scale(1.03)' : 'scale(1)',
                boxShadow: selectedCasino === id ? `0 0 20px ${c.primary}` : 'none',
              }}>
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
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Ton pseudo de joueur"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && name.trim() && selectedCasino) onLogin(name.trim(), true, selectedCasino); }}
          style={{
            width: '100%', padding: 12,
            background: 'rgba(0,0,0,0.5)', border: '1px solid #ffd700',
            borderRadius: 8, color: '#fff', fontSize: 16,
            fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 12,
          }}
        />
        <button
          onClick={() => name.trim() && selectedCasino && onLogin(name.trim(), true, selectedCasino)}
          disabled={!name.trim() || !selectedCasino}
          style={{
            width: '100%', padding: 14,
            background: (!name.trim() || !selectedCasino) ? '#555' : 'linear-gradient(135deg, #ffd700, #b8860b)',
            color: '#1a1a1a', border: 'none', borderRadius: 8,
            fontSize: 16, fontWeight: 'bold',
            cursor: (!name.trim() || !selectedCasino) ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}>ENTRER DANS LE CASINO</button>
        {savedProfiles.length > 0 && (
          <button onClick={() => setMode('select')}
            style={{
              width: '100%', marginTop: 8, padding: 8,
              background: 'transparent', border: 'none',
              color: '#cca366', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
            }}>← Retour aux profils</button>
        )}
      </div>
    </div>
  );
};


export default LoginScreen;
