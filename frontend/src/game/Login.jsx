import React, { useState } from 'react';
import { fmt, HAIR_CATALOG, OUTFIT_CATALOG, SHOES_CATALOG } from '@/game/constants';
import { STAKE } from '@/game/stake/theme';

// =============================================================
// MiniAvatar — preview stylisé du personnage (SVG compact)
// =============================================================
const MiniAvatar = ({ hair = 0, outfit = 0, shoes = 0, skin = '#e0b48a', size = 160 }) => {
  const h = HAIR_CATALOG[hair] || HAIR_CATALOG[0];
  const o = OUTFIT_CATALOG[outfit] || OUTFIT_CATALOG[0];
  const s = SHOES_CATALOG[shoes] || SHOES_CATALOG[0];
  return (
    <svg viewBox="0 0 120 180" width={size} height={size * 1.5}>
      {/* Chaussures */}
      <rect x="38" y="165" width="18" height="10" rx="3" fill={s.color || '#333'} />
      <rect x="64" y="165" width="18" height="10" rx="3" fill={s.color || '#333'} />
      {/* Jambes */}
      <rect x="42" y="128" width="14" height="42" fill="#2a3344" />
      <rect x="64" y="128" width="14" height="42" fill="#2a3344" />
      {/* Torse (outfit) */}
      <rect x="32" y="80" width="56" height="55" rx="8" fill={o.color || '#3b82f6'} />
      <rect x="32" y="80" width="56" height="14" fill={o.accent || '#1d4ed8'} rx="8" />
      {/* Col V */}
      <polygon points="54,80 60,92 66,80" fill={skin} />
      {/* Bras */}
      <rect x="20" y="82" width="14" height="45" rx="6" fill={o.color || '#3b82f6'} />
      <rect x="86" y="82" width="14" height="45" rx="6" fill={o.color || '#3b82f6'} />
      {/* Tête */}
      <ellipse cx="60" cy="50" rx="20" ry="24" fill={skin} />
      {/* Cheveux */}
      {h.style === 'long' && (
        <path d={`M 38 42 Q 40 20 60 20 Q 80 20 82 42 L 82 72 L 78 76 L 78 42 Q 60 36 42 42 L 42 76 L 38 72 Z`} fill={h.color || '#2a1810'} />
      )}
      {h.style === 'short' && (
        <path d="M 38 42 Q 40 26 60 24 Q 80 26 82 42 L 80 48 Q 60 40 40 48 Z" fill={h.color || '#2a1810'} />
      )}
      {h.style === 'curly' && (
        <g fill={h.color || '#2a1810'}>
          <circle cx="42" cy="40" r="10" />
          <circle cx="52" cy="34" r="10" />
          <circle cx="62" cy="32" r="10" />
          <circle cx="72" cy="34" r="10" />
          <circle cx="80" cy="40" r="10" />
        </g>
      )}
      {h.style === 'bald' && (
        <ellipse cx="60" cy="40" rx="18" ry="14" fill={skin} />
      )}
      {h.style === 'mohawk' && (
        <rect x="56" y="20" width="8" height="24" fill={h.color || '#ff0044'} />
      )}
      {/* Yeux */}
      <circle cx="52" cy="52" r="2.2" fill="#111" />
      <circle cx="68" cy="52" r="2.2" fill="#111" />
      {/* Bouche */}
      <path d="M 54 62 Q 60 66 66 62" stroke="#444" strokeWidth="1.5" fill="none" />
    </svg>
  );
};

// =============================================================
// <LoginScreen> — refonte Stake épurée
// Props : onLogin(name, isNew), savedProfiles
// =============================================================
const LoginScreen = ({ onLogin, savedProfiles }) => {
  const [mode, setMode] = useState(savedProfiles.length > 0 ? 'select' : 'new');
  const [name, setName] = useState('');
  const [hair, setHair] = useState(0);
  const [outfit, setOutfit] = useState(0);
  const [shoes, setShoes] = useState(0);

  const containerStyle = {
    position: 'fixed', inset: 0,
    background: `radial-gradient(ellipse at 50% 30%, ${STAKE.feltLight} 0%, ${STAKE.feltMid} 35%, ${STAKE.feltDark} 80%, #081a2c 100%)`,
    color: STAKE.ink,
    fontFamily: '"SF Pro Display", -apple-system, "Segoe UI", Helvetica, Arial, sans-serif',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 20, overflow: 'auto',
  };

  // Noise overlay
  const noiseStyle = {
    position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5,
    backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
    backgroundSize: '3px 3px',
  };

  // Logo "GAMBLELIFE" stylisé
  const Logo = () => (
    <div style={{ textAlign: 'center', marginBottom: 18 }}>
      <div style={{
        fontSize: 48, fontWeight: 900, letterSpacing: 8,
        background: `linear-gradient(135deg, ${STAKE.goldLight}, ${STAKE.gold} 40%, ${STAKE.goldDark})`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        textShadow: '0 4px 20px rgba(212,175,55,0.3)',
        fontFamily: 'Georgia, serif',
      }}>GAMBLELIFE</div>
      <div style={{
        fontSize: 13, color: STAKE.inkSoft, letterSpacing: 3, marginTop: -4,
        textTransform: 'uppercase',
      }}>Casino · Royal</div>
      <div style={{
        width: 60, height: 3, margin: '10px auto 0',
        background: `linear-gradient(90deg, transparent, ${STAKE.gold}, transparent)`,
      }} />
    </div>
  );

  // === Écran 1 : Sélection de profil ===
  if (mode === 'select') {
    return (
      <div data-testid="login-screen" style={containerStyle}>
        <div style={noiseStyle} />
        <div style={{
          position: 'relative', zIndex: 2,
          maxWidth: 440, width: '100%',
        }}>
          <Logo />
          <div style={{
            background: 'rgba(10,20,33,0.75)', borderRadius: 18,
            border: `1px solid rgba(212,175,55,0.25)`, padding: 22,
            boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(12px)',
          }}>
            <div style={{ color: STAKE.inkSoft, fontSize: 11, letterSpacing: 1.5, marginBottom: 12, textTransform: 'uppercase' }}>
              Bienvenue · Choisis ton profil
            </div>
            {savedProfiles.map((p) => (
              <button
                key={p.name}
                data-testid={`profile-${p.name}`}
                onClick={() => onLogin(p.name, false)}
                style={{
                  width: '100%', padding: '12px 14px', marginBottom: 10,
                  background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.04))',
                  border: `1px solid rgba(212,175,55,0.4)`, borderRadius: 12,
                  color: '#fff', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 14,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  gap: 14, transition: 'all .15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = STAKE.gold; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ width: 44, height: 44, flexShrink: 0 }}>
                  <MiniAvatar hair={p.hair || 0} outfit={p.outfit || 0} shoes={p.shoes || 0} skin={p.skin || '#e0b48a'} size={30} />
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 700 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: STAKE.inkSoft }}>
                    💰 {fmt(p.balance || 0)} $ · 🏆 {fmt(p.totalWinnings || 0)} $ · 🔑 {(p.keys || []).length}
                  </div>
                </div>
                <div style={{ color: STAKE.gold, fontSize: 18 }}>→</div>
              </button>
            ))}
            <button
              data-testid="login-new-btn"
              onClick={() => setMode('new')}
              style={{
                width: '100%', padding: 12, marginTop: 4,
                background: 'transparent',
                border: `1px dashed rgba(212,175,55,0.4)`, color: STAKE.goldLight,
                borderRadius: 12, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
              }}
            >+ Créer un nouveau joueur</button>
          </div>
          <div style={{
            textAlign: 'center', marginTop: 20,
            fontSize: 11, color: STAKE.inkSoft, letterSpacing: 1,
          }}>Solo · Mobile Casino · v2.1</div>
        </div>
      </div>
    );
  }

  // === Écran 2 : Nouveau joueur (pseudo + preview avatar) ===
  const canSubmit = name.trim().length >= 2;
  const submit = () => {
    if (!canSubmit) return;
    onLogin(name.trim(), true, { hair, outfit, shoes });
  };

  return (
    <div data-testid="login-new-screen" style={containerStyle}>
      <div style={noiseStyle} />
      <div style={{
        position: 'relative', zIndex: 2,
        maxWidth: 440, width: '100%',
      }}>
        <Logo />
        <div style={{
          background: 'rgba(10,20,33,0.75)', borderRadius: 18,
          border: `1px solid rgba(212,175,55,0.25)`, padding: 22,
          boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(12px)',
        }}>
          {/* Preview personnage */}
          <div style={{
            display: 'flex', justifyContent: 'center',
            padding: '6px 0 12px',
          }}>
            <div style={{
              padding: 8, borderRadius: 16,
              background: `radial-gradient(ellipse at center top, rgba(212,175,55,0.15), transparent 60%)`,
            }}>
              <MiniAvatar hair={hair} outfit={outfit} shoes={shoes} size={130} />
            </div>
          </div>

          {/* Sélecteurs coiffure / tenue / chaussures */}
          <StyleRow
            label="Coiffure" current={hair} total={HAIR_CATALOG.length}
            onPrev={() => setHair((hair - 1 + HAIR_CATALOG.length) % HAIR_CATALOG.length)}
            onNext={() => setHair((hair + 1) % HAIR_CATALOG.length)}
            testId="hair"
          />
          <StyleRow
            label="Tenue" current={outfit} total={OUTFIT_CATALOG.length}
            onPrev={() => setOutfit((outfit - 1 + OUTFIT_CATALOG.length) % OUTFIT_CATALOG.length)}
            onNext={() => setOutfit((outfit + 1) % OUTFIT_CATALOG.length)}
            testId="outfit"
          />
          <StyleRow
            label="Chaussures" current={shoes} total={SHOES_CATALOG.length}
            onPrev={() => setShoes((shoes - 1 + SHOES_CATALOG.length) % SHOES_CATALOG.length)}
            onNext={() => setShoes((shoes + 1) % SHOES_CATALOG.length)}
            testId="shoes"
          />

          <div style={{ height: 10 }} />

          <div style={{ fontSize: 11, color: STAKE.inkSoft, letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>
            Ton pseudo
          </div>
          <input
            data-testid="login-name-input"
            type="text"
            placeholder="Ex. Loki"
            value={name}
            maxLength={18}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            style={{
              width: '100%', padding: '12px 14px',
              background: 'rgba(0,0,0,0.45)',
              border: `1px solid ${canSubmit ? STAKE.gold : 'rgba(212,175,55,0.3)'}`,
              borderRadius: 12, color: '#fff', fontSize: 15,
              fontFamily: 'inherit', boxSizing: 'border-box',
              outline: 'none', transition: 'border-color .15s',
            }}
          />
          <div style={{ height: 14 }} />
          <button
            data-testid="login-submit-btn"
            onClick={submit}
            disabled={!canSubmit}
            style={{
              width: '100%', padding: 14,
              background: canSubmit
                ? `linear-gradient(135deg, ${STAKE.goldDark}, ${STAKE.gold} 50%, ${STAKE.goldLight})`
                : '#333',
              color: canSubmit ? '#111' : '#666', border: 'none', borderRadius: 12,
              fontSize: 14, fontWeight: 900, letterSpacing: 1.5,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              boxShadow: canSubmit ? '0 10px 24px rgba(212,175,55,0.35)' : 'none',
              transition: 'transform .1s',
            }}
            onPointerDown={(e) => { if (canSubmit) e.currentTarget.style.transform = 'scale(0.98)'; }}
            onPointerUp={(e) => { e.currentTarget.style.transform = 'none'; }}
          >COMMENCER L'AVENTURE →</button>
          {savedProfiles.length > 0 && (
            <button
              onClick={() => setMode('select')}
              style={{
                width: '100%', marginTop: 10, padding: 10,
                background: 'transparent', border: 'none',
                color: STAKE.inkSoft, cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 12, letterSpacing: 1,
              }}
            >← Retour aux profils</button>
          )}
        </div>
      </div>
    </div>
  );
};

// Composant ligne sélecteur (flèches + libellé)
const StyleRow = ({ label, current, total, onPrev, onNext, testId }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 4px', borderBottom: `1px solid rgba(212,175,55,0.12)`,
  }}>
    <div style={{ fontSize: 12, color: STAKE.inkSoft, letterSpacing: 1, textTransform: 'uppercase' }}>
      {label}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button
        data-testid={`${testId}-prev`}
        onClick={onPrev}
        style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'rgba(212,175,55,0.1)', border: `1px solid rgba(212,175,55,0.35)`,
          color: STAKE.goldLight, cursor: 'pointer', fontWeight: 800,
        }}
      >‹</button>
      <div style={{
        fontSize: 12, color: STAKE.goldLight, fontWeight: 700, minWidth: 44, textAlign: 'center',
      }}>{current + 1} / {total}</div>
      <button
        data-testid={`${testId}-next`}
        onClick={onNext}
        style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'rgba(212,175,55,0.1)', border: `1px solid rgba(212,175,55,0.35)`,
          color: STAKE.goldLight, cursor: 'pointer', fontWeight: 800,
        }}
      >›</button>
    </div>
  </div>
);

export { MiniAvatar };
export default LoginScreen;
