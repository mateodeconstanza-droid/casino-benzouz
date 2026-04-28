import React, { useEffect, useState } from 'react';
import { fmt, HAIR_CATALOG, OUTFIT_CATALOG, SHOES_CATALOG } from '@/game/constants';

// ============================================================
// FortniteLobby — écran d'accueil pré-jeu (style Fortnite/AAA)
// - Fond : skyline ville GTA-like (CSS, dégradé crépuscule + bâtiments)
// - Personnage stylisé reflétant les cosmétiques équipés
// - Carrousel cosmétiques (changer coiffure/tenue/chaussures sur place)
// - 4 CTAs : VILLE / CASINO / BOUTIQUE / PROFIL
// ============================================================
const FortniteLobby = ({ profile, balance, onGoCity, onGoCasino, onGoShop, onGoProfile, onLogout, setProfile }) => {
  const [tick, setTick] = useState(0);
  const [selHair, setSelHair] = useState(profile?.hair ?? 0);
  const [selOutfit, setSelOutfit] = useState(profile?.outfit ?? 0);
  const [selShoes, setSelShoes] = useState(profile?.shoes ?? 0);

  useEffect(() => {
    let raf = 0;
    const loop = () => { setTick(t => t + 1); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Persist le changement de cosmétique
  useEffect(() => {
    if (setProfile && profile && (selHair !== profile.hair || selOutfit !== profile.outfit || selShoes !== profile.shoes)) {
      setProfile({ ...profile, hair: selHair, outfit: selOutfit, shoes: selShoes });
    }
    // eslint-disable-next-line
  }, [selHair, selOutfit, selShoes]);

  const cycle = (catalog, current, dir) => (current + dir + catalog.length) % catalog.length;
  const swing = Math.sin(tick * 0.04) * 6;
  const bob = Math.abs(Math.sin(tick * 0.04)) * 4;

  const skin = profile?.skin || '#e0b48a';
  const hairColor = HAIR_CATALOG[selHair]?.color || '#3a2817';
  const outfitColor = OUTFIT_CATALOG[selOutfit]?.color || '#1a1a1a';
  const shoeColor = SHOES_CATALOG[selShoes]?.color || '#0a0a0a';

  return (
    <div data-testid="fortnite-lobby" style={{
      position: 'fixed', inset: 0, overflow: 'hidden',
      color: '#fff', fontFamily: 'Georgia, serif',
      background: `
        linear-gradient(180deg,
          #08081a 0%,
          #1a0a2a 28%,
          #4a1648 45%,
          #a02860 62%,
          #ff6a3a 80%,
          #ffd28a 100%)
      `,
    }}>
      {/* ===== SKYLINE BÂTIMENTS DERRIÈRE — 3 couches parallax ===== */}
      <CitySkyline tick={tick} />

      {/* Particules ambiantes */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        background: `
          radial-gradient(2px 2px at 12% 18%, rgba(255,215,0,0.7), transparent 70%),
          radial-gradient(2px 2px at 28% 32%, rgba(63,230,255,0.6), transparent 70%),
          radial-gradient(3px 3px at 70% 22%, rgba(255,138,58,0.55), transparent 70%),
          radial-gradient(2px 2px at 88% 41%, rgba(255,42,212,0.5), transparent 70%),
          radial-gradient(2px 2px at 45% 65%, rgba(255,255,255,0.45), transparent 70%)
        `,
        animation: 'lobbyTwinkle 5s ease-in-out infinite',
      }} />

      {/* ===== HUD HAUT-GAUCHE : logo + solde ===== */}
      <div style={{ position: 'absolute', top: 20, left: 24, zIndex: 5 }}>
        <div style={{
          fontSize: 'clamp(28px, 4.5vw, 50px)', fontWeight: 900,
          letterSpacing: 4, lineHeight: 1.05,
          background: 'linear-gradient(135deg, #ffd700, #ff8a3a, #ff2ad4)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: '0 0 30px rgba(255,215,0,0.6)',
        }}>GAMBLELIFE</div>
        <div style={{
          fontSize: 12, letterSpacing: 5, color: '#3fe6ff', marginTop: 4, fontWeight: 700,
        }}>★ ROYAL CITY · 2026 ★</div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          marginTop: 14, padding: '8px 16px',
          background: 'linear-gradient(135deg, rgba(255,215,0,0.18), rgba(0,0,0,0.55))',
          border: '2px solid rgba(255,215,0,0.5)', borderRadius: 12,
          backdropFilter: 'blur(10px)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          <span style={{ fontSize: 22 }}>💰</span>
          <div>
            <div style={{ fontSize: 9, color: '#cca366', letterSpacing: 2 }}>SOLDE</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#ffd700' }}>{fmt(balance)} $</div>
          </div>
        </div>
      </div>

      {/* ===== HUD HAUT-DROITE : profil tag ===== */}
      {profile?.name && (
        <div style={{
          position: 'absolute', top: 20, right: 24, zIndex: 5,
          padding: '10px 18px', borderRadius: 10,
          background: 'linear-gradient(135deg, rgba(0,0,0,0.7), rgba(20,15,30,0.7))',
          border: '2px solid #ffd700', backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 22px rgba(255,215,0,0.4)', textAlign: 'right',
        }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: '#cca366' }}>JOUEUR</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#ffd700', letterSpacing: 1 }}>{profile.name}</div>
          <div style={{ fontSize: 10, color: '#3fe6ff', marginTop: 2 }}>
            ★ Niveau {Math.min(99, Math.floor((profile.totalWinnings || 0) / 100000) + 1)}
          </div>
        </div>
      )}

      {/* ===== ZONE PERSONNAGE CENTRAL (avec halo + plateforme rotative) ===== */}
      <div style={{
        position: 'absolute', left: '50%', bottom: 130, transform: 'translateX(-50%)',
        zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {/* Halo doré derrière */}
        <div style={{
          position: 'absolute', bottom: 60, width: 380, height: 380, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,215,0,0.35), rgba(63,230,255,0.18) 50%, transparent 80%)',
          animation: 'lobbyHaloPulse 3s ease-in-out infinite',
          filter: 'blur(8px)',
        }} />
        {/* Plateforme rotative au sol */}
        <div style={{
          position: 'absolute', bottom: 0, width: 260, height: 60,
          borderRadius: '50%',
          background: `repeating-conic-gradient(from ${tick * 0.4}deg, rgba(255,215,0,0.22) 0deg 12deg, transparent 12deg 24deg)`,
          border: '2px solid rgba(255,215,0,0.5)',
          boxShadow: '0 0 60px rgba(255,215,0,0.45)',
          transform: 'rotateX(72deg)',
        }} />
        {/* Personnage */}
        <PlayerAvatar
          skin={skin} hairColor={hairColor} outfitColor={outfitColor} shoeColor={shoeColor}
          swing={swing} bob={bob}
        />
      </div>

      {/* ===== CARROUSEL COSMÉTIQUES (gauche) ===== */}
      <div style={{
        position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 12, zIndex: 5,
      }}>
        <CosmRow
          label="COIFFURE"
          testIdPrev="lobby-cosm-hair-prev" testIdNext="lobby-cosm-hair-next"
          name={HAIR_CATALOG[selHair]?.name || '—'}
          owned={(profile?.ownedHair || [0,1,2]).includes(selHair)}
          onPrev={() => setSelHair(c => cycle(HAIR_CATALOG, c, -1))}
          onNext={() => setSelHair(c => cycle(HAIR_CATALOG, c, +1))}
        />
        <CosmRow
          label="TENUE"
          testIdPrev="lobby-cosm-outfit-prev" testIdNext="lobby-cosm-outfit-next"
          name={OUTFIT_CATALOG[selOutfit]?.name || '—'}
          owned={(profile?.ownedOutfit || [0,1,2]).includes(selOutfit)}
          onPrev={() => setSelOutfit(c => cycle(OUTFIT_CATALOG, c, -1))}
          onNext={() => setSelOutfit(c => cycle(OUTFIT_CATALOG, c, +1))}
        />
        <CosmRow
          label="CHAUSSURES"
          testIdPrev="lobby-cosm-shoes-prev" testIdNext="lobby-cosm-shoes-next"
          name={SHOES_CATALOG[selShoes]?.name || '—'}
          owned={(profile?.ownedShoes || [0,1,2]).includes(selShoes)}
          onPrev={() => setSelShoes(c => cycle(SHOES_CATALOG, c, -1))}
          onNext={() => setSelShoes(c => cycle(SHOES_CATALOG, c, +1))}
        />
      </div>

      {/* ===== BOUTONS D'ACTION (droite) ===== */}
      <div style={{
        position: 'absolute', right: 24, bottom: 100, zIndex: 5,
        display: 'flex', flexDirection: 'column', gap: 12, width: 'min(380px, 42vw)',
      }}>
        <LobbyBtn testId="lobby-btn-city" icon="🏙️" title="EXPLORER LA VILLE"
          subtitle="Free roam · Plage · Garage · Combat" onClick={onGoCity} primary />
        <LobbyBtn testId="lobby-btn-casino" icon="🎰" title="ENTRER AU CASINO"
          subtitle="Roulette · Blackjack · Poker · BenzWheel" onClick={onGoCasino} />
        <LobbyBtn testId="lobby-btn-shop" icon="🛒" title="GAMBLELIFE STORE"
          subtitle="Armes · Véhicules · Cosmétiques" onClick={onGoShop} />
        <LobbyBtn testId="lobby-btn-profile" icon="👤" title="PROFIL & TROPHÉES"
          subtitle="Stats · Trophées · Personnage" onClick={onGoProfile} />
      </div>

      {/* ===== BOUTON DÉCONNEXION (bas-gauche) ===== */}
      <button
        onClick={onLogout}
        data-testid="lobby-logout-btn"
        style={{
          position: 'absolute', left: 24, bottom: 24, zIndex: 5,
          padding: '8px 18px', borderRadius: 8,
          background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,68,68,0.4)',
          color: '#ff8888', cursor: 'pointer',
          fontSize: 12, letterSpacing: 1, fontWeight: 700,
          backdropFilter: 'blur(6px)',
        }}
      >← DÉCONNEXION</button>

      <style>{`
        @keyframes lobbyTwinkle    { 0%,100%{opacity:.4} 50%{opacity:.85} }
        @keyframes lobbyHaloPulse  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
      `}</style>
    </div>
  );
};

// ============== Skyline ville (3 couches parallax CSS) ==============
const CitySkyline = ({ tick }) => {
  // Pré-calcul stable des bâtiments
  const buildings = React.useMemo(() => {
    const arr = [];
    for (let i = 0; i < 28; i++) {
      arr.push({
        w: 4 + Math.random() * 8,
        h: 18 + Math.random() * 38,
        x: i * 4 + Math.random() * 2,
        windows: Math.random() > 0.3,
        wColor: ['#ffd28a', '#ffa040', '#ff80a0', '#80c8ff', '#a0f0c0'][Math.floor(Math.random() * 5)],
      });
    }
    return arr;
  }, []);
  const drift = Math.sin(tick * 0.003) * 6;
  return (
    <>
      {/* Couche LOIN — silhouettes très foncées */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: '20%',
        height: '40%', zIndex: 1, pointerEvents: 'none',
        transform: `translateX(${drift * 0.3}px)`,
      }}>
        <svg viewBox="0 0 600 200" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          <polygon points="0,200 0,140 30,140 35,90 60,95 75,75 95,80 110,60 140,55 145,100 175,105 185,120 220,115 240,90 270,90 285,115 310,110 330,80 360,85 375,110 410,105 425,75 460,80 475,95 510,90 525,115 555,110 575,135 600,135 600,200" fill="rgba(8,4,18,0.92)" />
        </svg>
      </div>
      {/* Couche MILIEU — bâtiments avec fenêtres */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: '12%',
        height: '38%', zIndex: 1, pointerEvents: 'none',
        display: 'flex', alignItems: 'flex-end',
        transform: `translateX(${drift * 0.6}px)`,
      }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 0,
          width: '100%', height: '100%', justifyContent: 'space-around',
        }}>
          {buildings.map((b, i) => (
            <div key={i} style={{
              width: `${b.w}vw`, height: `${b.h}vh`,
              background: 'linear-gradient(180deg, rgba(20,10,30,0.92), rgba(8,2,15,0.96))',
              border: '1px solid rgba(0,0,0,0.6)',
              position: 'relative',
              boxShadow: '0 -2px 6px rgba(0,0,0,0.5)',
            }}>
              {/* Fenêtres */}
              {b.windows && (
                <div style={{
                  position: 'absolute', inset: '8% 12% 4% 12%',
                  backgroundImage: `repeating-linear-gradient(0deg, transparent 0 6px, ${b.wColor}aa 6px 9px), repeating-linear-gradient(90deg, transparent 0 8px, transparent 8px 14px)`,
                  opacity: 0.35,
                }} />
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Couche AVANT — sol/route reflet néon */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        height: '15%', zIndex: 1, pointerEvents: 'none',
        background: `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(10,6,20,0.95) 100%)`,
      }} />
      {/* Néons rouges + cyan accents au loin */}
      <div style={{
        position: 'absolute', bottom: '32%', left: '14%',
        width: 80, height: 4, borderRadius: 4,
        background: '#ff2ad4', boxShadow: '0 0 14px #ff2ad4, 0 0 28px #ff2ad4',
        zIndex: 1,
      }} />
      <div style={{
        position: 'absolute', bottom: '38%', right: '18%',
        width: 100, height: 4, borderRadius: 4,
        background: '#3fe6ff', boxShadow: '0 0 14px #3fe6ff, 0 0 28px #3fe6ff',
        zIndex: 1,
      }} />
      {/* Lune / soleil couchant */}
      <div style={{
        position: 'absolute', top: '14%', right: '15%',
        width: 90, height: 90, borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, #fff7d8, #ffa850 70%, #c84020 100%)',
        boxShadow: '0 0 60px rgba(255,168,80,0.7), 0 0 120px rgba(200,64,32,0.4)',
        zIndex: 1,
      }} />
    </>
  );
};

// ============== Personnage stylisé ==============
const PlayerAvatar = ({ skin, hairColor, outfitColor, shoeColor, swing, bob }) => {
  const shade = (color, factor) => {
    const hex = (color || '#888').replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const adj = (v) => Math.max(0, Math.min(255, Math.round(v + v * factor)));
    return `#${adj(r).toString(16).padStart(2, '0')}${adj(g).toString(16).padStart(2, '0')}${adj(b).toString(16).padStart(2, '0')}`;
  };
  const pantColor = shade(outfitColor, -0.3);
  return (
    <div data-testid="lobby-player-avatar" style={{
      position: 'relative', zIndex: 4,
      width: 220, height: 380,
      transform: `translateY(${-bob}px) rotate(${swing * 0.06}deg)`,
      transition: 'transform 0.05s linear',
      filter: 'drop-shadow(0 12px 20px rgba(0,0,0,0.7))',
    }}>
      {/* Cheveux (cap) — derrière la tête */}
      <div style={{
        position: 'absolute', left: '50%', top: -6, transform: 'translateX(-50%)',
        width: 96, height: 60, borderRadius: '48px 48px 14px 14px',
        background: `radial-gradient(circle at 35% 30%, ${hairColor}, ${shade(hairColor, -0.4)})`,
        zIndex: 1,
      }} />
      {/* Tête */}
      <div style={{
        position: 'absolute', left: '50%', top: 4, transform: 'translateX(-50%)',
        width: 80, height: 80, borderRadius: '50%',
        background: `radial-gradient(circle at 35% 30%, ${skin}, ${shade(skin, -0.3)})`,
        boxShadow: '0 6px 16px rgba(0,0,0,0.5), inset 0 -10px 14px rgba(0,0,0,0.18)',
        zIndex: 2,
      }}>
        {/* Yeux */}
        <div style={{ position: 'absolute', top: 30, left: 22, width: 8, height: 12, borderRadius: '50%', background: '#1a1a25', boxShadow: '0 0 4px #3fe6ff' }} />
        <div style={{ position: 'absolute', top: 30, right: 22, width: 8, height: 12, borderRadius: '50%', background: '#1a1a25', boxShadow: '0 0 4px #3fe6ff' }} />
      </div>
      {/* Torse / vêtement */}
      <div style={{
        position: 'absolute', left: '50%', top: 82, transform: 'translateX(-50%)',
        width: 130, height: 170, borderRadius: '40px 40px 12px 12px',
        background: `linear-gradient(180deg, ${outfitColor}, ${shade(outfitColor, -0.45)})`,
        boxShadow: '0 8px 22px rgba(0,0,0,0.6), inset 0 -16px 22px rgba(0,0,0,0.25)',
        zIndex: 3,
      }}>
        {/* Décoration star au centre */}
        <div style={{
          position: 'absolute', top: 32, left: '50%', transform: 'translateX(-50%)',
          fontSize: 22, color: '#ffd700', fontWeight: 900,
          textShadow: '0 0 10px #ffd700',
        }}>★</div>
      </div>
      {/* Bras */}
      {[-1, 1].map(s => (
        <div key={s} style={{
          position: 'absolute', top: 96, left: '50%',
          transform: `translateX(${s * 80 - 12}px) rotate(${s * (8 + swing * 0.6)}deg)`,
          width: 24, height: 130, borderRadius: 12,
          background: `linear-gradient(180deg, ${outfitColor}, ${shade(outfitColor, -0.45)})`,
          transformOrigin: 'top center',
          boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
          zIndex: 3,
        }} />
      ))}
      {/* Jambes */}
      {[-1, 1].map(s => (
        <div key={s} style={{
          position: 'absolute', top: 250, left: '50%',
          transform: `translateX(${s * 28 - 14}px)`,
          width: 32, height: 110, borderRadius: 10,
          background: `linear-gradient(180deg, ${pantColor}, ${shade(pantColor, -0.5)})`,
          boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
          zIndex: 3,
        }} />
      ))}
      {/* Chaussures */}
      {[-1, 1].map(s => (
        <div key={s} style={{
          position: 'absolute', top: 350, left: '50%',
          transform: `translateX(${s * 28 - 18}px)`,
          width: 40, height: 18, borderRadius: 8,
          background: `linear-gradient(180deg, ${shoeColor}, ${shade(shoeColor, -0.4)})`,
          boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
          zIndex: 4,
        }} />
      ))}
    </div>
  );
};

const CosmRow = ({ label, name, owned, onPrev, onNext, testIdPrev, testIdNext }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 12px', borderRadius: 10,
    background: 'linear-gradient(135deg, rgba(0,0,0,0.65), rgba(20,15,30,0.65))',
    border: `1px solid ${owned ? '#ffd700' : 'rgba(255,255,255,0.12)'}`,
    backdropFilter: 'blur(8px)', minWidth: 240,
    boxShadow: owned ? '0 0 16px rgba(255,215,0,0.18)' : 'none',
  }}>
    <button
      data-testid={testIdPrev}
      onClick={onPrev}
      style={{
        width: 28, height: 28, borderRadius: 6,
        background: 'rgba(255,215,0,0.15)', border: '1px solid #ffd700',
        color: '#ffd700', cursor: 'pointer', fontWeight: 900,
      }}
    >‹</button>
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontSize: 9, color: '#cca366', letterSpacing: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginTop: 2 }}>{name}</div>
      {!owned && <div style={{ fontSize: 9, color: '#ff8888', marginTop: 1 }}>🔒 Verrouillé</div>}
    </div>
    <button
      data-testid={testIdNext}
      onClick={onNext}
      style={{
        width: 28, height: 28, borderRadius: 6,
        background: 'rgba(255,215,0,0.15)', border: '1px solid #ffd700',
        color: '#ffd700', cursor: 'pointer', fontWeight: 900,
      }}
    >›</button>
  </div>
);

const LobbyBtn = ({ testId, icon, title, subtitle, onClick, primary }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        width: '100%', padding: '14px 18px', borderRadius: 14,
        background: hov
          ? (primary ? 'linear-gradient(135deg, #ffd700, #ff8a3a)' : 'rgba(63,230,255,0.18)')
          : (primary
              ? 'linear-gradient(135deg, rgba(255,215,0,0.85), rgba(255,138,58,0.85))'
              : 'linear-gradient(135deg, rgba(20,15,30,0.7), rgba(10,5,15,0.7))'),
        border: hov ? '2px solid #fff' : `2px solid ${primary ? '#ffd700' : 'rgba(63,230,255,0.4)'}`,
        cursor: 'pointer', textAlign: 'left',
        color: primary ? '#1a1a1a' : '#fff',
        transition: 'all 0.2s cubic-bezier(.2,.9,.25,1.2)',
        transform: hov ? 'translateX(-8px)' : 'none',
        boxShadow: hov ? '0 12px 28px rgba(255,215,0,0.4)' : '0 6px 14px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <span style={{ fontSize: 32 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: 1.5 }}>{title}</div>
        <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2, letterSpacing: 0.5 }}>{subtitle}</div>
      </div>
      <span style={{ fontSize: 22, opacity: hov ? 1 : 0.6 }}>→</span>
    </button>
  );
};

export default FortniteLobby;
