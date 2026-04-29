import React, { useEffect, useState } from 'react';
import { fmt } from '@/game/constants';

// ============================================================
// DeviceSelect — choix Mobile / PC avant l'entrée dans le lobby
// Sauvegardé dans localStorage sous 'gamblelife_device'
// Auto-détection en suggestion (mais le joueur peut forcer)
// ============================================================
const DeviceSelect = ({ profile, onChoose }) => {
  const [hover, setHover] = useState(null);
  const [autoDetected, setAutoDetected] = useState('pc');

  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobile = isTouch && window.innerWidth < 1024;
    setAutoDetected(isMobile ? 'mobile' : 'pc');
  }, []);

  const choose = (type) => {
    try { localStorage.setItem('gamblelife_device', type); } catch (_e) { /* noop */ }
    onChoose(type);
  };

  return (
    <div
      data-testid="device-select"
      style={{
        position: 'fixed', inset: 0, overflow: 'hidden',
        background: 'linear-gradient(135deg, #08081a 0%, #1a0a2a 30%, #4a1648 60%, #ff6a3a 100%)',
        color: '#fff', fontFamily: 'Georgia, serif',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(circle at 80% 20%, rgba(255,168,80,0.4), transparent 50%),
                     radial-gradient(circle at 20% 80%, rgba(63,230,255,0.2), transparent 50%)`,
      }} />
      <div style={{ position: 'relative', maxWidth: 880, width: '100%', textAlign: 'center', zIndex: 2 }}>
        <div style={{
          fontSize: 'clamp(28px, 5vw, 50px)', fontWeight: 900, letterSpacing: 4,
          background: 'linear-gradient(135deg, #ffd700, #ff8a3a, #ff2ad4)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 8,
        }}>
          QUEL APPAREIL ?
        </div>
        <div style={{ fontSize: 13, color: '#cca366', letterSpacing: 3, marginBottom: 36 }}>
          Optimisons la jouabilité pour toi · Détection : <b style={{ color: '#3fe6ff' }}>{autoDetected.toUpperCase()}</b>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24,
          maxWidth: 720, margin: '0 auto',
        }}>
          <DeviceCard
            testId="device-pc"
            icon="🖥️"
            title="PC / DESKTOP"
            features={[
              'Clavier ZQSD/WASD + Souris',
              'Visée précise (clic souris)',
              'Tirer en se déplaçant',
              'Performances maximales',
            ]}
            recommended={autoDetected === 'pc'}
            highlighted={hover === 'pc'}
            onMouseEnter={() => setHover('pc')}
            onMouseLeave={() => setHover(null)}
            onClick={() => choose('pc')}
          />
          <DeviceCard
            testId="device-mobile"
            icon="📱"
            title="MOBILE / TABLETTE"
            features={[
              'Joystick virtuel adaptatif',
              'Aim + Tir simultanés',
              'Mode portrait & paysage',
              'Boutons optimisés tactile',
            ]}
            recommended={autoDetected === 'mobile'}
            highlighted={hover === 'mobile'}
            onMouseEnter={() => setHover('mobile')}
            onMouseLeave={() => setHover(null)}
            onClick={() => choose('mobile')}
          />
        </div>

        <div style={{
          marginTop: 28, fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 1,
        }}>
          Tu pourras changer ce choix dans le Menu à tout moment.
        </div>

        {profile?.name && (
          <div style={{
            marginTop: 30, padding: '8px 18px', display: 'inline-block',
            background: 'rgba(0,0,0,0.45)', borderRadius: 10,
            border: '1px solid rgba(255,215,0,0.3)', backdropFilter: 'blur(8px)',
          }}>
            <span style={{ color: '#cca366', fontSize: 11, letterSpacing: 2 }}>SIGNED IN AS </span>
            <b style={{ color: '#ffd700', fontSize: 14 }}>{profile.name}</b>
            <span style={{ color: '#3fe6ff', marginLeft: 14, fontSize: 12 }}>· 💰 {fmt(profile.balance || 500)} $</span>
          </div>
        )}
      </div>
    </div>
  );
};

const DeviceCard = ({ testId, icon, title, features, recommended, highlighted, onMouseEnter, onMouseLeave, onClick }) => (
  <button
    data-testid={testId}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    onClick={onClick}
    style={{
      position: 'relative',
      padding: '28px 22px',
      borderRadius: 18,
      background: highlighted
        ? 'linear-gradient(135deg, rgba(255,215,0,0.95), rgba(255,138,58,0.95))'
        : 'linear-gradient(135deg, rgba(20,15,30,0.85), rgba(10,5,15,0.85))',
      border: `2.5px solid ${highlighted ? '#fff' : (recommended ? '#3fe6ff' : 'rgba(255,215,0,0.4)')}`,
      cursor: 'pointer', textAlign: 'left',
      color: highlighted ? '#1a1a1a' : '#fff',
      transition: 'all 0.25s cubic-bezier(.2,.9,.25,1.2)',
      transform: highlighted ? 'translateY(-6px) scale(1.02)' : 'none',
      boxShadow: highlighted
        ? '0 18px 38px rgba(255,215,0,0.5)'
        : '0 10px 22px rgba(0,0,0,0.5)',
      backdropFilter: 'blur(8px)',
    }}
  >
    {recommended && (
      <div style={{
        position: 'absolute', top: -10, right: 14,
        padding: '4px 12px', borderRadius: 12,
        background: 'linear-gradient(135deg, #3fe6ff, #2196f3)',
        color: '#000', fontSize: 9, letterSpacing: 2, fontWeight: 900,
        boxShadow: '0 4px 10px rgba(63,230,255,0.5)',
      }}>★ RECOMMANDÉ</div>
    )}
    <div style={{ fontSize: 64, marginBottom: 14, textAlign: 'center' }}>{icon}</div>
    <div style={{
      fontSize: 22, fontWeight: 900, letterSpacing: 2, marginBottom: 12, textAlign: 'center',
    }}>{title}</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {features.map((f, i) => (
        <div key={i} style={{ fontSize: 12, opacity: 0.92, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%',
            background: highlighted ? '#1a1a1a' : '#ffd700',
            flexShrink: 0,
          }} />
          {f}
        </div>
      ))}
    </div>
  </button>
);

export default DeviceSelect;
