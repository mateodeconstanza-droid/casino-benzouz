import React, { useEffect, useState } from 'react';
import { fmt } from '@/game/constants';

// ============================================================
// FortniteLobby — écran d'accueil 3D type Fortnite
// Affiche le personnage du joueur + boutons d'action (VILLE, CASINO, BOUTIQUE, PROFIL).
// Sert de point central avant d'entrer dans la ville/casino.
// ============================================================
const FortniteLobby = ({ profile, balance, onGoCity, onGoCasino, onGoShop, onGoProfile, onLogout }) => {
  const [hovered, setHovered] = useState(null);

  // Animation du personnage : léger swing
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let raf = 0;
    const loop = () => { setTick(t => t + 1); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const charSwing = Math.sin(tick * 0.04) * 4;
  const charBob = Math.abs(Math.sin(tick * 0.04)) * 4;

  return (
    <div data-testid="fortnite-lobby" style={{
      position: 'fixed', inset: 0,
      background: `
        radial-gradient(ellipse at 30% 25%, rgba(63,230,255,0.18), transparent 50%),
        radial-gradient(ellipse at 75% 70%, rgba(255,215,0,0.12), transparent 55%),
        linear-gradient(160deg, #0c1628 0%, #1a0a24 60%, #050309 100%)
      `,
      display: 'flex', overflow: 'hidden',
      color: '#fff', fontFamily: 'Georgia, serif',
    }}>
      {/* Particules ambiantes */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.6,
        background: `
          radial-gradient(2px 2px at 12% 20%, rgba(63,230,255,0.7), transparent 70%),
          radial-gradient(2px 2px at 80% 35%, rgba(255,215,0,0.7), transparent 70%),
          radial-gradient(2px 2px at 45% 75%, rgba(255,255,255,0.55), transparent 70%),
          radial-gradient(3px 3px at 92% 82%, rgba(63,230,255,0.5), transparent 70%)
        `,
        animation: 'lobbyTwinkle 5s ease-in-out infinite',
      }} />

      {/* === COLONNE GAUCHE — Header + boutons === */}
      <div style={{
        flex: '0 0 50%', maxWidth: 560,
        padding: 'clamp(20px, 4vw, 56px)',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', zIndex: 5,
      }}>
        {/* Logo + solde */}
        <div>
          <div style={{
            fontSize: 'clamp(28px, 6vw, 56px)', fontWeight: 900,
            letterSpacing: 4, lineHeight: 1.05,
            background: 'linear-gradient(135deg, #ffd700, #ff8a3a, #ff2ad4)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 0 40px rgba(255,215,0,0.5)',
          }}>GAMBLELIFE</div>
          <div style={{
            fontSize: 13, letterSpacing: 5, color: '#3fe6ff', marginTop: 6, fontWeight: 700,
          }}>★ ROYAL CITY · 2026 ★</div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            marginTop: 22, padding: '10px 18px',
            background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(0,0,0,0.4))',
            border: '2px solid rgba(255,215,0,0.5)', borderRadius: 12,
            backdropFilter: 'blur(8px)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}>
            <span style={{ fontSize: 24 }}>💰</span>
            <div>
              <div style={{ fontSize: 9, color: '#cca366', letterSpacing: 2 }}>SOLDE</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#ffd700' }}>{fmt(balance)} $</div>
            </div>
          </div>
          {profile?.name && (
            <div style={{
              marginTop: 14, fontSize: 13, color: '#9aaab8', letterSpacing: 1.5,
            }}>Salut <span style={{ color: '#3fe6ff', fontWeight: 800 }}>{profile.name}</span> 👋</div>
          )}
        </div>

        {/* Boutons d'action */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 32 }}>
          <LobbyButton
            testId="lobby-btn-city"
            icon="🏙️"
            title="EXPLORER LA VILLE"
            subtitle="Free roam · 43 propriétés · Combat · Véhicules"
            onClick={onGoCity}
            primary
            hovered={hovered === 'city'}
            onHover={(h) => setHovered(h ? 'city' : null)}
          />
          <LobbyButton
            testId="lobby-btn-casino"
            icon="🎰"
            title="ENTRER AU CASINO"
            subtitle="Roulette · Blackjack · Poker · BenzWheel"
            onClick={onGoCasino}
            hovered={hovered === 'casino'}
            onHover={(h) => setHovered(h ? 'casino' : null)}
          />
          <LobbyButton
            testId="lobby-btn-shop"
            icon="🛒"
            title="GAMBLELIFE STORE"
            subtitle="Armes · Véhicules · Cosmétiques"
            onClick={onGoShop}
            hovered={hovered === 'shop'}
            onHover={(h) => setHovered(h ? 'shop' : null)}
          />
          <LobbyButton
            testId="lobby-btn-profile"
            icon="👤"
            title="PROFIL & TROPHÉES"
            subtitle="Stats · Trophées · Personnage"
            onClick={onGoProfile}
            hovered={hovered === 'profile'}
            onHover={(h) => setHovered(h ? 'profile' : null)}
          />
        </div>

        <button
          onClick={onLogout}
          data-testid="lobby-logout-btn"
          style={{
            marginTop: 24, alignSelf: 'flex-start',
            padding: '8px 18px', borderRadius: 8,
            background: 'transparent', border: '1px solid rgba(255,68,68,0.4)',
            color: '#ff8888', cursor: 'pointer',
            fontSize: 12, letterSpacing: 1, fontWeight: 700,
          }}
        >← DÉCONNEXION</button>
      </div>

      {/* === COLONNE DROITE — Personnage 3D faux ===*/}
      <div style={{
        flex: 1, position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Cercle lumineux derrière le personnage */}
        <div style={{
          position: 'absolute', width: 'clamp(280px, 45vw, 480px)', height: 'clamp(280px, 45vw, 480px)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,215,0,0.25), rgba(63,230,255,0.1) 60%, transparent 80%)',
          animation: 'lobbyHaloPulse 3s ease-in-out infinite',
        }} />
        {/* Plateforme rotative sous le perso */}
        <div style={{
          position: 'absolute', bottom: '15%', width: 'clamp(220px, 35vw, 340px)', height: 'clamp(220px, 35vw, 340px)',
          borderRadius: '50%', transform: 'rotateX(75deg)',
          background: `repeating-conic-gradient(from ${tick * 0.4}deg, rgba(255,215,0,0.18) 0deg 12deg, transparent 12deg 24deg)`,
          border: '2px solid rgba(255,215,0,0.45)',
          boxShadow: '0 0 60px rgba(255,215,0,0.3)',
        }} />
        {/* Personnage stylisé (silhouette CSS) */}
        <div style={{
          position: 'relative', zIndex: 4,
          width: 220, height: 380,
          transform: `translateY(${-charBob}px) rotate(${charSwing * 0.1}deg)`,
          transition: 'transform 0.05s linear',
        }}>
          {/* Tête */}
          <div style={{
            position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)',
            width: 80, height: 80, borderRadius: '50%',
            background: `radial-gradient(circle at 35% 30%, ${profile?.skin || '#e0b48a'}, ${shade(profile?.skin || '#e0b48a', -0.2)})`,
            boxShadow: '0 6px 16px rgba(0,0,0,0.5), inset 0 -10px 14px rgba(0,0,0,0.2)',
          }} />
          {/* Corps */}
          <div style={{
            position: 'absolute', left: '50%', top: 78, transform: 'translateX(-50%)',
            width: 130, height: 170, borderRadius: '40px 40px 12px 12px',
            background: 'linear-gradient(180deg, #c92a2a, #6a1a1a)',
            boxShadow: '0 8px 22px rgba(0,0,0,0.6), inset 0 -16px 22px rgba(0,0,0,0.25)',
          }}>
            {/* Logo doré sur le torse */}
            <div style={{
              position: 'absolute', top: 30, left: '50%', transform: 'translateX(-50%)',
              fontSize: 22, color: '#ffd700', fontWeight: 900, letterSpacing: 2,
              textShadow: '0 0 8px #ffd700',
            }}>★</div>
          </div>
          {/* Bras */}
          {[-1, 1].map(s => (
            <div key={s} style={{
              position: 'absolute', top: 90, left: '50%',
              transform: `translateX(${s * 80 - 12}px) rotate(${s * (10 + charSwing * 0.5)}deg)`,
              width: 24, height: 130, borderRadius: 12,
              background: 'linear-gradient(180deg, #c92a2a, #6a1a1a)',
              transformOrigin: 'top center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
            }} />
          ))}
          {/* Jambes */}
          {[-1, 1].map(s => (
            <div key={s} style={{
              position: 'absolute', top: 240, left: '50%',
              transform: `translateX(${s * 28 - 14}px)`,
              width: 32, height: 130, borderRadius: 10,
              background: 'linear-gradient(180deg, #1a1a2a, #0a0a14)',
              boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
            }} />
          ))}
        </div>

        {/* Tag perso flottant */}
        {profile?.name && (
          <div style={{
            position: 'absolute', bottom: 40, right: 60,
            padding: '10px 18px', borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(0,0,0,0.7), rgba(20,15,30,0.7))',
            border: '2px solid #ffd700', backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 22px rgba(255,215,0,0.4)',
          }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: '#cca366' }}>JOUEUR</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#ffd700', letterSpacing: 1 }}>
              {profile.name}
            </div>
            <div style={{ fontSize: 10, color: '#3fe6ff', marginTop: 2 }}>
              ★ Niveau {Math.min(99, Math.floor((profile.totalWinnings || 0) / 100000) + 1)}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes lobbyTwinkle    { 0%,100%{opacity:.4} 50%{opacity:.85} }
        @keyframes lobbyHaloPulse  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
      `}</style>
    </div>
  );
};

const LobbyButton = ({ testId, icon, title, subtitle, onClick, primary, hovered, onHover }) => (
  <button
    data-testid={testId}
    onClick={onClick}
    onMouseEnter={() => onHover(true)}
    onMouseLeave={() => onHover(false)}
    style={{
      display: 'flex', alignItems: 'center', gap: 14,
      width: '100%', padding: '14px 18px', borderRadius: 14,
      background: hovered
        ? (primary
            ? 'linear-gradient(135deg, #ffd700, #ff8a3a)'
            : 'rgba(63,230,255,0.18)')
        : (primary
            ? 'linear-gradient(135deg, rgba(255,215,0,0.85), rgba(255,138,58,0.85))'
            : 'linear-gradient(135deg, rgba(20,15,30,0.7), rgba(10,5,15,0.7))'),
      border: hovered
        ? '2px solid #fff'
        : `2px solid ${primary ? '#ffd700' : 'rgba(63,230,255,0.4)'}`,
      cursor: 'pointer', textAlign: 'left',
      color: primary ? '#1a1a1a' : '#fff',
      transition: 'all 0.2s cubic-bezier(.2,.9,.25,1.2)',
      transform: hovered ? 'translateX(8px)' : 'none',
      boxShadow: hovered
        ? '0 12px 28px rgba(255,215,0,0.4)'
        : '0 6px 14px rgba(0,0,0,0.4)',
      backdropFilter: 'blur(8px)',
    }}
  >
    <span style={{ fontSize: 36 }}>{icon}</span>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 1.5 }}>{title}</div>
      <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2, letterSpacing: 0.5 }}>{subtitle}</div>
    </div>
    <span style={{ fontSize: 22, opacity: hovered ? 1 : 0.6, transition: 'opacity 0.2s' }}>→</span>
  </button>
);

// Petit helper duplicate de stake/theme (évite import circulaire)
const shade = (color, factor) => {
  const hex = (color || '#888').replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const adj = (v) => Math.max(0, Math.min(255, Math.round(v + v * factor)));
  return `#${adj(r).toString(16).padStart(2, '0')}${adj(g).toString(16).padStart(2, '0')}${adj(b).toString(16).padStart(2, '0')}`;
};

export default FortniteLobby;
