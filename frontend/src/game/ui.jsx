import React, { useState, useEffect } from 'react';
import { fmt, RED_NUMBERS } from '@/game/constants';

export const Dealer = ({ profile, splats, dead, shot, bloodStreams }) => {
  const p = profile || DEALER_PROFILES[0];
  
  return (
    <div style={{
      position: 'relative', width: 200, height: 260,
      transition: 'all 0.3s',
      filter: dead ? 'saturate(0.5) brightness(0.6)' : 'none',
      transform: dead ? 'rotate(25deg) translateY(30px)' : 'none',
    }}>
      <svg viewBox="0 0 200 260" style={{ width: '100%', height: '100%' }}>
        <defs>
          <radialGradient id={`skin-${p.id}`} cx="45%" cy="35%">
            <stop offset="0%" stopColor={lighten(p.skin, 15)} />
            <stop offset="70%" stopColor={p.skin} />
            <stop offset="100%" stopColor={darken(p.skin, 20)} />
          </radialGradient>
          <radialGradient id={`skinShade-${p.id}`} cx="50%" cy="50%">
            <stop offset="0%" stopColor={p.skin} />
            <stop offset="100%" stopColor={darken(p.skin, 30)} />
          </radialGradient>
          <linearGradient id={`suit-${p.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a1a2e" />
            <stop offset="50%" stopColor="#0a0a1a" />
            <stop offset="100%" stopColor="#000" />
          </linearGradient>
          <filter id={`shadow-${p.id}`}>
            <feGaussianBlur stdDeviation="1" />
          </filter>
        </defs>

        {/* Épaules / corps */}
        <path d="M 30 200 L 70 170 L 100 180 L 130 170 L 170 200 L 175 260 L 25 260 Z" 
          fill={`url(#suit-${p.id})`} stroke="#000" strokeWidth="0.5" />
        
        {/* Col chemise */}
        <path d="M 75 175 L 100 195 L 125 175 L 115 170 L 100 180 L 85 170 Z" fill="#f5f5f5" />
        <path d="M 75 175 L 85 170 L 100 180 Z" fill="#e8e8e8" />
        
        {/* Cravate/noeud papillon */}
        {p.gender === 'm' ? (
          <>
            <path d="M 95 182 L 105 182 L 107 200 L 108 235 L 100 245 L 92 235 L 93 200 Z" 
              fill="#8b0000" />
            <path d="M 93 200 L 107 200 L 108 235 L 92 235 Z" fill="#6a0000" opacity="0.4" />
          </>
        ) : (
          <>
            <ellipse cx="100" cy="188" rx="14" ry="6" fill="#8b0000" />
            <ellipse cx="100" cy="188" rx="3" ry="4" fill="#4a0000" />
          </>
        )}

        {/* Cou */}
        <path d="M 85 155 L 85 180 L 115 180 L 115 155 Z" fill={`url(#skin-${p.id})`} />
        <path d="M 85 170 L 115 170" stroke={darken(p.skin, 25)} strokeWidth="1" opacity="0.6" />
        <path d="M 90 175 L 110 175" stroke={darken(p.skin, 30)} strokeWidth="0.5" opacity="0.4" />

        {/* Tête - forme plus réaliste */}
        <path d="M 65 90 Q 62 60 80 45 Q 100 38 120 45 Q 138 60 135 90 Q 138 115 130 135 Q 120 155 100 158 Q 80 155 70 135 Q 62 115 65 90 Z" 
          fill={`url(#skin-${p.id})`} />

        {/* Ombrages faciaux (joues, temples) */}
        <path d="M 68 95 Q 65 115 72 130" stroke={darken(p.skin, 25)} strokeWidth="1.2" fill="none" opacity="0.4" />
        <path d="M 132 95 Q 135 115 128 130" stroke={darken(p.skin, 25)} strokeWidth="1.2" fill="none" opacity="0.4" />
        <ellipse cx="75" cy="120" rx="8" ry="12" fill={darken(p.skin, 15)} opacity="0.2" />
        <ellipse cx="125" cy="120" rx="8" ry="12" fill={darken(p.skin, 15)} opacity="0.2" />

        {/* Cheveux selon profil */}
        {renderHair(p)}

        {/* Oreilles */}
        <ellipse cx="62" cy="100" rx="6" ry="10" fill={`url(#skin-${p.id})`} />
        <ellipse cx="138" cy="100" rx="6" ry="10" fill={`url(#skin-${p.id})`} />
        <path d="M 60 98 Q 63 102 60 108" stroke={darken(p.skin, 30)} strokeWidth="0.8" fill="none" />
        <path d="M 140 98 Q 137 102 140 108" stroke={darken(p.skin, 30)} strokeWidth="0.8" fill="none" />

        {/* Sourcils */}
        <path d="M 76 88 Q 84 83 92 87" stroke={darken(p.hair, 10)} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M 108 87 Q 116 83 124 88" stroke={darken(p.hair, 10)} strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* Yeux */}
        <ellipse cx="84" cy="97" rx="5" ry="3.5" fill="white" />
        <ellipse cx="116" cy="97" rx="5" ry="3.5" fill="white" />
        <circle cx={dead ? 82 : 84} cy="97" r="2.5" fill={p.eyes} />
        <circle cx={dead ? 114 : 116} cy="97" r="2.5" fill={p.eyes} />
        <circle cx={dead ? 82.5 : 84.5} cy="96.5" r="0.7" fill="white" />
        <circle cx={dead ? 114.5 : 116.5} cy="96.5" r="0.7" fill="white" />
        
        {/* X morts */}
        {dead && (
          <>
            <line x1="79" y1="92" x2="89" y2="102" stroke="#000" strokeWidth="2" />
            <line x1="89" y1="92" x2="79" y2="102" stroke="#000" strokeWidth="2" />
            <line x1="111" y1="92" x2="121" y2="102" stroke="#000" strokeWidth="2" />
            <line x1="121" y1="92" x2="111" y2="102" stroke="#000" strokeWidth="2" />
          </>
        )}

        {/* Cernes */}
        <path d="M 78 103 Q 84 106 90 103" stroke={darken(p.skin, 20)} strokeWidth="0.6" fill="none" opacity="0.5" />
        <path d="M 110 103 Q 116 106 122 103" stroke={darken(p.skin, 20)} strokeWidth="0.6" fill="none" opacity="0.5" />

        {/* Lunettes */}
        {p.glasses && (
          <g>
            <circle cx="84" cy="97" r="9" fill="none" stroke="#1a1a1a" strokeWidth="1.5" />
            <circle cx="116" cy="97" r="9" fill="none" stroke="#1a1a1a" strokeWidth="1.5" />
            <line x1="93" y1="97" x2="107" y2="97" stroke="#1a1a1a" strokeWidth="1.5" />
            <circle cx="84" cy="97" r="9" fill="rgba(200,220,240,0.15)" />
            <circle cx="116" cy="97" r="9" fill="rgba(200,220,240,0.15)" />
          </g>
        )}

        {/* Nez - plus détaillé */}
        <path d="M 100 100 L 94 125 Q 100 130 106 125 Z" 
          fill={darken(p.skin, 8)} filter={`url(#shadow-${p.id})`} />
        <path d="M 100 105 L 96 122" stroke={darken(p.skin, 20)} strokeWidth="0.5" opacity="0.6" />
        <ellipse cx="96" cy="127" rx="1.5" ry="1" fill={darken(p.skin, 35)} />
        <ellipse cx="104" cy="127" rx="1.5" ry="1" fill={darken(p.skin, 35)} />
        <path d="M 98 128 Q 100 130 102 128" stroke={darken(p.skin, 25)} strokeWidth="0.5" fill="none" />

        {/* Bouche - expression selon état */}
        {dead ? (
          <path d="M 90 142 Q 100 138 110 142" stroke="#4a1818" strokeWidth="2" fill="#3a0a0a" strokeLinecap="round" />
        ) : (
          <>
            <path d="M 90 140 Q 100 144 110 140" stroke="#5a2818" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M 91 141 Q 100 143 109 141" fill="#c96b5a" opacity="0.7" />
            {p.gender === 'f' && (
              <path d="M 91 141 Q 100 143 109 141" fill="#d14848" opacity="0.4" />
            )}
          </>
        )}

        {/* Barbe */}
        {p.beard && (
          <>
            <ellipse cx="100" cy="148" rx="22" ry="10" fill={p.hair} opacity="0.3" />
            <ellipse cx="100" cy="145" rx="18" ry="6" fill={p.hair} opacity="0.4" />
          </>
        )}

        {/* Grain / texture peau */}
        <ellipse cx="82" cy="110" rx="1" ry="1" fill={darken(p.skin, 25)} opacity="0.3" />
        <ellipse cx="115" cy="115" rx="0.8" ry="0.8" fill={darken(p.skin, 25)} opacity="0.3" />
        <ellipse cx="95" cy="135" rx="0.6" ry="0.6" fill={darken(p.skin, 25)} opacity="0.3" />

        {/* Trou de balle si shot */}
        {shot && (
          <g>
            <circle cx="100" cy="97" r="5" fill="#1a0000" />
            <circle cx="100" cy="97" r="3.5" fill="#4a0000" />
            <circle cx="100" cy="97" r="2" fill="#000" />
            {/* Sang qui sort */}
            <path d="M 100 97 Q 100 110 95 130" stroke="#8b0000" strokeWidth="3" fill="none" />
            <path d="M 100 97 Q 102 115 108 135" stroke="#6a0000" strokeWidth="2.5" fill="none" />
          </g>
        )}
      </svg>

      {/* Nom du croupier */}
      {!dead && (
        <div style={{
          position: 'absolute', bottom: -5, left: 0, right: 0,
          textAlign: 'center', color: '#ffd700', fontSize: 11,
          fontFamily: 'Georgia, serif', fontStyle: 'italic',
          textShadow: '1px 1px 2px #000',
        }}>
          ~ {p.name} ~
        </div>
      )}

      {/* Splats */}
      {splats.map((splat) => (
        <div key={splat.id} style={{
          position: 'absolute',
          left: `${splat.x}%`, top: `${splat.y}%`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none', zIndex: 10,
        }}>
          {renderSplat(splat)}
        </div>
      ))}

      {/* Flots de sang réalistes */}
      {bloodStreams && bloodStreams.map((b, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${b.x}%`, top: `${b.y}%`,
          width: b.width, 
          height: b.height,
          background: `linear-gradient(to bottom, #8b0000 0%, #6a0000 50%, #4a0000 100%)`,
          borderRadius: '40% 40% 50% 50% / 10% 10% 90% 90%',
          animation: `bloodFlow ${b.duration}s ease-in forwards`,
          animationDelay: `${b.delay}s`,
          boxShadow: '0 0 4px rgba(139,0,0,0.8)',
          transformOrigin: 'top',
          zIndex: 9,
        }} />
      ))}
    </div>
  );
};

// Helpers couleurs
function lighten(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `rgb(${r},${g},${b})`;
}
function darken(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `rgb(${r},${g},${b})`;
}

function renderHair(p) {
  if (p.gender === 'f') {
    return (
      <>
        <path d={`M 60 80 Q 55 40 100 30 Q 145 40 140 80 Q 155 100 150 140 Q 145 155 135 160 Q 132 130 130 100 Q 120 85 100 83 Q 80 85 70 100 Q 68 130 65 160 Q 55 155 50 140 Q 45 100 60 80 Z`}
          fill={p.hair} />
        <path d={`M 65 75 Q 75 55 100 50 Q 125 55 135 75`} stroke={lighten(p.hair, 10)} strokeWidth="1" fill="none" opacity="0.6" />
      </>
    );
  }
  return (
    <>
      <path d={`M 62 78 Q 65 48 100 42 Q 135 48 138 78 Q 138 65 125 60 Q 110 58 100 60 Q 90 58 75 60 Q 62 65 62 78 Z`}
        fill={p.hair} />
      <path d={`M 65 72 Q 80 55 100 55 Q 120 55 135 72 L 133 65 Q 115 58 100 60 Q 85 58 67 65 Z`}
        fill={darken(p.hair.slice(1) === '0a0603' ? '#0a0603' : p.hair, 5)} />
    </>
  );
}

function renderSplat(splat) {
  if (splat.type === 'tomato') {
    return (
      <div style={{
        width: 80, height: 80,
        background: 'radial-gradient(circle at 30% 30%, #ff4444, #8b0000 60%, #4a0000)',
        borderRadius: '50% 40% 60% 45% / 45% 55% 40% 60%',
        boxShadow: '0 0 10px rgba(139,0,0,0.8), inset -6px -6px 12px rgba(0,0,0,0.4)',
        animation: 'splatGrow 0.3s ease-out',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: -6, left: -10,
          width: 28, height: 18, background: '#c93030',
          borderRadius: '50%', transform: 'rotate(-30deg)',
        }} />
        <div style={{
          position: 'absolute', bottom: -10, right: -12,
          width: 22, height: 14, background: '#a02020',
          borderRadius: '50%', transform: 'rotate(45deg)',
        }} />
        <div style={{
          position: 'absolute', top: '30%', left: -15,
          width: 10, height: 6, background: '#8b0000',
          borderRadius: '50%',
        }} />
      </div>
    );
  }
  if (splat.type === 'beer') {
    return (
      <div style={{
        width: 90, height: 70,
        background: 'radial-gradient(ellipse at 40% 30%, rgba(245,200,80,0.9), rgba(180,120,30,0.7) 70%)',
        borderRadius: '40% 60% 50% 50% / 60% 40% 60% 40%',
        boxShadow: '0 0 12px rgba(245,200,80,0.6), inset -4px -4px 10px rgba(80,40,0,0.4)',
        animation: 'splatGrow 0.3s ease-out',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 5, right: 10,
          width: 10, height: 14, background: 'rgba(150,200,220,0.7)',
          clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
          transform: 'rotate(25deg)',
        }} />
        <div style={{
          position: 'absolute', bottom: 10, left: 15,
          width: 8, height: 10, background: 'rgba(150,200,220,0.7)',
          clipPath: 'polygon(0% 0%, 100% 50%, 50% 100%)',
        }} />
        <div style={{
          position: 'absolute', top: -6, left: 20,
          width: 35, height: 12, background: 'rgba(255,250,240,0.9)',
          borderRadius: '50%',
        }} />
      </div>
    );
  }
  if (splat.type === 'bullet' || splat.type === 'wound') {
    return (
      <div style={{
        width: 50, height: 50,
        background: 'radial-gradient(circle at 50% 50%, #8b0000 0%, #5a0000 40%, transparent 70%)',
        borderRadius: '50%',
        animation: 'splatGrow 0.3s ease-out',
      }}>
        <div style={{
          width: 10, height: 10, background: '#1a0000',
          borderRadius: '50%',
          margin: '20px auto',
          boxShadow: '0 0 8px #000',
        }} />
      </div>
    );
  }
  if (splat.type === 'explosion') {
    return (
      <div style={{
        width: 120, height: 120,
        background: 'radial-gradient(circle, #ff0 0%, #f80 30%, #800 60%, transparent 80%)',
        borderRadius: '50%',
        animation: 'explosion 0.6s ease-out',
      }} />
    );
  }
  return null;
}

// ============== PROJECTILE EN VOL ==============
export const FlyingProjectile = ({ type, onComplete }) => {
  const [phase, setPhase] = useState('fly');
  useEffect(() => {
    const flyDur = type === 'bullet' || type === 'shotgun_shot' || type === 'laser' ? 200
                 : type === 'rocket' ? 650
                 : type === 'grenade' ? 750
                 : type === 'bolt' ? 350
                 : type === 'blade' ? 420
                 : 600;
    const hasExplosion = type === 'rocket' || type === 'grenade';
    const explodeDur = 480;
    let t1, t2;
    if (hasExplosion) {
      t1 = setTimeout(() => setPhase('explode'), flyDur);
      t2 = setTimeout(onComplete, flyDur + explodeDur);
    } else {
      t1 = setTimeout(onComplete, flyDur);
    }
    return () => { clearTimeout(t1); if (t2) clearTimeout(t2); };
  }, [onComplete, type]);

  // ============== EXPLOSIONS (bazooka & grenade) ==============
  if (phase === 'explode') {
    return (
      <div style={{
        position: 'absolute', bottom: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: 240, height: 240,
        zIndex: 101, pointerEvents: 'none',
      }}>
        {/* Flash central */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle, #fff8c0 0%, #ffb636 25%, #ff4400 45%, #5a0000 70%, transparent 85%)',
          borderRadius: '50%',
          animation: 'explosionPulse 0.48s ease-out forwards',
          mixBlendMode: 'screen',
          filter: 'blur(1px)',
        }} />
        {/* Onde de choc (rayon 3m simulé) */}
        <div style={{
          position: 'absolute', inset: 0,
          border: '3px solid rgba(255,200,100,0.7)',
          borderRadius: '50%',
          animation: 'shockWave 0.48s ease-out forwards',
        }} />
        {/* Fragments */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute', top: '50%', left: '50%',
            width: 6, height: 6,
            background: '#ffae00',
            borderRadius: '50%',
            boxShadow: '0 0 6px #ff4400',
            animation: `frag${i} 0.48s ease-out forwards`,
          }} />
        ))}
        <style>{`
          @keyframes explosionPulse {
            0% { transform: scale(0.15); opacity: 0; }
            30% { transform: scale(1.05); opacity: 1; }
            100% { transform: scale(1.6); opacity: 0; }
          }
          @keyframes shockWave {
            0% { transform: scale(0.1); opacity: 0.9; }
            100% { transform: scale(2.2); opacity: 0; }
          }
          ${Array.from({ length: 8 }).map((_, i) => {
            const ang = (i / 8) * Math.PI * 2;
            const dx = Math.cos(ang) * 110;
            const dy = Math.sin(ang) * 110;
            return `@keyframes frag${i} {
              0% { transform: translate(-50%, -50%); opacity: 1; }
              100% { transform: translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)); opacity: 0; }
            }`;
          }).join('\n')}
        `}</style>
      </div>
    );
  }

  if (type === 'laser') {
    return (
      <div style={{
        position: 'absolute', bottom: 120, left: '50%',
        transform: 'translateX(-50%)',
        width: '60%', height: 4,
        background: 'linear-gradient(to right, transparent, #00ffee, #fff, #00ffee, transparent)',
        boxShadow: '0 0 20px #00ffee, 0 0 40px #00ffee',
        zIndex: 100, pointerEvents: 'none',
        animation: 'laserFade 0.2s ease-out forwards',
      }}>
        <style>{`@keyframes laserFade { 0%{opacity:1;transform:translateX(-50%) scaleY(1);} 100%{opacity:0;transform:translateX(-50%) scaleY(0.2);} }`}</style>
      </div>
    );
  }

  if (type === 'bullet' || type === 'shotgun_shot') {
    return (
      <div style={{
        position: 'absolute', bottom: 40, left: '50%',
        width: 30, height: 6,
        animation: 'bulletFly 0.3s linear forwards',
        zIndex: 100, pointerEvents: 'none',
      }}>
        <div style={{
          width: '100%', height: '100%',
          background: 'linear-gradient(to right, transparent, #ff0, #f80)',
          borderRadius: 3,
          boxShadow: '0 0 20px #ff0, 0 0 40px #f80',
        }} />
      </div>
    );
  }
  if (type === 'rocket') {
    return (
      <div style={{
        position: 'absolute', bottom: 20, left: '50%',
        width: 40, height: 12,
        animation: 'rocketFly 0.65s ease-in forwards',
        zIndex: 100, pointerEvents: 'none',
      }}>
        <div style={{
          width: '100%', height: '100%',
          background: 'linear-gradient(to right, #333, #666, #aaa)',
          borderRadius: '3px 6px 6px 3px',
          boxShadow: '0 0 15px #f80',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', left: -30, top: 0, height: '100%', width: 30,
            background: 'linear-gradient(to right, transparent, #f80, #ff0)',
            filter: 'blur(2px)',
          }} />
        </div>
      </div>
    );
  }
  if (type === 'grenade') {
    return (
      <div style={{
        position: 'absolute', bottom: 20, left: '50%',
        width: 24, height: 24,
        animation: 'grenadeFly 0.75s ease-in forwards',
        zIndex: 100, pointerEvents: 'none',
      }}>
        <div style={{
          width: '100%', height: '100%',
          background: 'radial-gradient(circle at 30% 30%, #6a7a3a, #2a3a1a)',
          borderRadius: '50%',
          boxShadow: '0 0 8px rgba(0,0,0,0.7)',
        }} />
        <style>{`@keyframes grenadeFly { 0%{transform:translate(-50%,0) rotate(0);} 50%{transform:translate(-50%,-260px) rotate(540deg);} 100%{transform:translate(-50%,0) rotate(1080deg);} }`}</style>
      </div>
    );
  }
  if (type === 'bolt') {
    return (
      <div style={{
        position: 'absolute', bottom: 60, left: '50%',
        width: 70, height: 4,
        animation: 'boltFly 0.35s linear forwards',
        zIndex: 100, pointerEvents: 'none',
      }}>
        <div style={{
          width: '100%', height: '100%',
          background: 'linear-gradient(to right, #888, #fff, #aaa)',
          clipPath: 'polygon(0% 50%, 85% 0%, 100% 50%, 85% 100%)',
          boxShadow: '0 0 6px rgba(255,255,255,0.5)',
        }} />
      </div>
    );
  }
  if (type === 'blade') {
    return (
      <div style={{
        position: 'absolute', bottom: 30, left: '50%',
        width: 50, height: 14,
        animation: 'bladeFly 0.42s linear forwards',
        zIndex: 100, pointerEvents: 'none',
      }}>
        <div style={{
          width: '100%', height: '100%',
          background: 'linear-gradient(to right, #333, #ccc 20%, #fff 50%, #ccc 80%, #333)',
          clipPath: 'polygon(0% 30%, 75% 0%, 100% 50%, 75% 100%, 0% 70%)',
          boxShadow: '0 0 8px rgba(255,255,255,0.5)',
        }} />
        <style>{`@keyframes bladeFly { 0%{transform:translate(-50%,0) rotate(0);} 100%{transform:translate(-50%,-220px) rotate(720deg);} }`}</style>
      </div>
    );
  }
  if (type === 'knife' || type === 'machete') {
    return (
      <div style={{
        position: 'absolute', bottom: 20, left: '50%',
        width: 50, height: 10,
        animation: 'knifeFly 0.5s linear forwards',
        zIndex: 100, pointerEvents: 'none',
      }}>
        <div style={{
          width: '100%', height: '100%',
          background: 'linear-gradient(to right, #666, #ccc 20%, #fff 50%, #ccc 80%, #333)',
          clipPath: type === 'machete' ? 'polygon(0% 30%, 80% 0%, 100% 50%, 80% 100%, 0% 70%)' : 'polygon(0% 30%, 70% 0%, 100% 50%, 70% 100%, 0% 70%)',
          boxShadow: '0 0 10px rgba(255,255,255,0.5)',
        }} />
      </div>
    );
  }
  return (
    <div style={{
      position: 'absolute', bottom: 20, left: '50%',
      width: 40, height: 40,
      animation: 'throwProjectile 0.6s ease-in forwards',
      zIndex: 100, pointerEvents: 'none',
    }}>
      {type === 'tomato' ? (
        <div style={{
          width: '100%', height: '100%',
          background: 'radial-gradient(circle at 30% 30%, #ff4444, #8b0000)',
          borderRadius: '50%',
          boxShadow: '0 0 15px rgba(255,0,0,0.6)',
        }} />
      ) : (
        <div style={{
          width: 30, height: 45,
          background: 'linear-gradient(to bottom, #8b6914, #5a4510)',
          borderRadius: '5px 5px 8px 8px',
          margin: '0 auto',
          boxShadow: '0 0 10px rgba(0,0,0,0.5)',
        }} />
      )}
    </div>
  );
};

// ============== CARTE ==============
export const Card = ({ card, hidden, delay = 0, small = false }) => {
  const w = small ? 50 : 70;
  const h = small ? 72 : 100;
  if (hidden) {
    return (
      <div style={{
        width: w, height: h,
        background: 'linear-gradient(135deg, #8b0000, #4a0000)',
        borderRadius: 6, border: '2px solid #ffd700',
        animation: `cardDeal 0.4s ease-out ${delay}s both`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', inset: 4,
          border: '1px solid #ffd700', borderRadius: 3,
          background: 'repeating-linear-gradient(45deg, #8b0000, #8b0000 4px, #6a0000 4px, #6a0000 8px)',
        }} />
      </div>
    );
  }
  const isRed = card.suit === '♥' || card.suit === '♦';
  return (
    <div style={{
      width: w, height: h,
      background: 'linear-gradient(145deg, #fff, #e8e8e8)',
      borderRadius: 6, border: '1px solid #aaa',
      padding: small ? 3 : 5,
      position: 'relative',
      animation: `cardDeal 0.4s ease-out ${delay}s both`,
      boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
      fontFamily: 'Georgia, serif',
    }}>
      <div style={{ color: isRed ? '#c00' : '#000', fontWeight: 'bold', fontSize: small ? 11 : 15, lineHeight: 1 }}>
        <div>{card.rank}</div>
        <div style={{ fontSize: small ? 13 : 17 }}>{card.suit}</div>
      </div>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        fontSize: small ? 26 : 36, color: isRed ? '#c00' : '#000' }}>
        {card.suit}
      </div>
      <div style={{ position: 'absolute', bottom: small ? 3 : 5, right: small ? 3 : 5,
        color: isRed ? '#c00' : '#000', fontWeight: 'bold', fontSize: small ? 11 : 15,
        transform: 'rotate(180deg)', lineHeight: 1 }}>
        <div>{card.rank}</div>
        <div style={{ fontSize: small ? 13 : 17 }}>{card.suit}</div>
      </div>
    </div>
  );
};

// ============== JETON ==============
export const Chip = ({ value, onClick, selected, disabled, size = 60 }) => {
  const colors = {
    5: ['#fff', '#ccc', '#000'],
    10: ['#1a1a8a', '#0a0a5a', '#fff'],
    25: ['#0a6a0a', '#054a05', '#fff'],
    100: ['#1a1a1a', '#000', '#fff'],
    500: ['#8b008b', '#5a005a', '#fff'],
    1000: ['#ffd700', '#b8860b', '#000'],
    5000: ['#ff0080', '#a00050', '#fff'],
    10000: ['#00d4ff', '#0080a0', '#000'],
    50000: ['#00ff88', '#00aa44', '#000'],
    100000: ['#ff00ff', '#aa00aa', '#fff'],
    500000: ['#9400d3', '#4b0082', '#fff'],
    1000000: ['#ff1493', '#8b008b', '#fff'],
    5000000: ['#ffd700', '#ff8c00', '#000'],
    10000000: ['#000000', '#ffd700', '#ffd700'],
  };
  const [main, dark, text] = colors[value] || colors[5];
  const isPlaque = value >= 50000; // Plaquette rectangulaire pour VIP
  
  if (isPlaque) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          width: size * 1.3, height: size * 0.65,
          borderRadius: 6,
          border: selected ? '3px solid #ffd700' : `1px solid ${text}`,
          background: `linear-gradient(135deg, ${main} 0%, ${dark} 50%, ${main} 100%)`,
          color: text,
          fontWeight: 'bold',
          fontSize: size < 50 ? 11 : 14,
          letterSpacing: 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.4 : 1,
          fontFamily: 'Georgia, serif',
          position: 'relative',
          boxShadow: selected
            ? `0 0 25px #ffd700, 0 4px 10px rgba(0,0,0,0.7)`
            : `0 4px 8px rgba(0,0,0,0.7), inset 0 0 10px rgba(255,255,255,0.15)`,
          transition: 'transform 0.15s',
          transform: selected ? 'translateY(-4px)' : 'translateY(0)',
          backgroundImage: `linear-gradient(135deg, ${main} 0%, ${dark} 50%, ${main} 100%), repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(255,215,0,0.15) 4px, rgba(255,215,0,0.15) 5px)`,
        }}
      >
        {value >= 1000000 ? `${value/1000000}M` : `${value/1000}K`}
      </button>
    );
  }
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: size, height: size,
        borderRadius: '50%',
        border: selected ? '3px solid #ffd700' : `2px dashed ${text}`,
        background: `radial-gradient(circle at 30% 30%, ${main}, ${dark})`,
        color: text,
        fontWeight: 'bold',
        fontSize: size < 50 ? 10 : 12,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        fontFamily: 'Georgia, serif',
        position: 'relative',
        boxShadow: selected 
          ? `0 0 20px #ffd700, 0 4px 8px rgba(0,0,0,0.6), inset 0 0 8px rgba(0,0,0,0.3)`
          : `0 4px 8px rgba(0,0,0,0.6), inset 0 0 8px rgba(0,0,0,0.3)`,
        transition: 'transform 0.15s',
        transform: selected ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      {value >= 1000000 ? `${value/1000000}M` : value >= 1000 ? `${value/1000}K` : value}
    </button>
  );
};

export const ChipStack = ({ amount, size = 'small' }) => {
  if (!amount) return null;
  const stackHeight = Math.min(6, Math.ceil(amount / 1000));
  const w = size === 'small' ? 24 : 36;
  return (
    <div style={{
      position: 'absolute',
      bottom: size === 'small' ? -6 : -4, right: size === 'small' ? -6 : -4,
      width: w, height: stackHeight * 3 + 8,
      animation: 'chipDrop 0.3s ease-out',
    }}>
      {[...Array(stackHeight)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          bottom: i * 3, left: 0, right: 0,
          height: w, 
          borderRadius: '50%',
          background: `radial-gradient(circle, #ffd700, #b8860b)`,
          border: '1px solid #000',
          boxShadow: '0 1px 2px rgba(0,0,0,0.6)',
        }} />
      ))}
      <div style={{
        position: 'absolute', top: -18, left: 0, right: 0,
        textAlign: 'center', color: '#ffd700', fontSize: 10, fontWeight: 'bold',
        textShadow: '1px 1px 2px #000',
      }}>
        {amount >= 1000000 ? `${(amount/1000000).toFixed(amount % 1000000 === 0 ? 0 : 1)}M` : amount >= 1000 ? `${(amount/1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K` : amount}
      </div>
    </div>
  );
};

// ============== LOBBY 3D ==============
// ============== ICÔNES D'ARMES SVG RÉALISTES ==============
export const WeaponIcon = ({ id, size = 60 }) => {
  const s = size;
  if (id === 'knife') return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      <defs>
        <linearGradient id="bladeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8e8e8" />
          <stop offset="50%" stopColor="#c0c0c0" />
          <stop offset="100%" stopColor="#666" />
        </linearGradient>
      </defs>
      <polygon points="15,45 75,40 80,50 75,55 15,52" fill="url(#bladeGrad)" stroke="#444" strokeWidth="0.5" />
      <polygon points="15,45 15,52 5,55 5,42" fill="#2a1810" />
      <rect x="0" y="44" width="15" height="12" fill="#4a2810" rx="2" />
      <line x1="3" y1="47" x2="12" y2="47" stroke="#2a1810" strokeWidth="0.5" />
      <line x1="3" y1="50" x2="12" y2="50" stroke="#2a1810" strokeWidth="0.5" />
      <line x1="3" y1="53" x2="12" y2="53" stroke="#2a1810" strokeWidth="0.5" />
      <polygon points="75,42 80,45 78,50 75,48" fill="#888" />
    </svg>
  );
  if (id === 'machete') return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      <defs>
        <linearGradient id="machGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d0d0d0" />
          <stop offset="100%" stopColor="#555" />
        </linearGradient>
      </defs>
      <path d="M 10 50 L 85 38 L 90 45 L 88 55 L 15 58 Z" fill="url(#machGrad)" stroke="#333" strokeWidth="0.5" />
      <rect x="0" y="46" width="15" height="16" fill="#1a0a04" rx="2" />
      <circle cx="3" cy="50" r="0.8" fill="#ffd700" />
      <circle cx="7" cy="50" r="0.8" fill="#ffd700" />
      <circle cx="11" cy="50" r="0.8" fill="#ffd700" />
    </svg>
  );
  if (id === 'gun') return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      <defs>
        <linearGradient id="gunGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a3a3a" />
          <stop offset="50%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>
      </defs>
      <rect x="20" y="42" width="55" height="12" fill="url(#gunGrad)" rx="1" />
      <rect x="75" y="44" width="8" height="8" fill="#000" />
      <rect x="18" y="52" width="20" height="20" fill="url(#gunGrad)" rx="2" />
      <polygon points="22,52 35,52 30,72 22,72" fill="#1a1a1a" />
      <rect x="30" y="54" width="6" height="10" fill="#444" />
      <circle cx="33" cy="59" r="2" fill="#000" />
      <rect x="22" y="44" width="3" height="8" fill="#666" />
      <rect x="72" y="40" width="4" height="3" fill="#666" />
    </svg>
  );
  if (id === 'shotgun') return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      <defs>
        <linearGradient id="shotGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a2810" />
          <stop offset="100%" stopColor="#2a1a0a" />
        </linearGradient>
      </defs>
      <rect x="5" y="47" width="70" height="6" fill="#1a1a1a" />
      <rect x="75" y="45" width="20" height="10" fill="url(#shotGrad)" rx="1" />
      <polygon points="2,48 5,47 5,53 2,52" fill="#666" />
      <circle cx="3" cy="50" r="1.5" fill="#000" />
      <rect x="40" y="53" width="15" height="4" fill="#333" />
      <rect x="55" y="55" width="8" height="3" fill="#666" />
    </svg>
  );
  if (id === 'bazooka') return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      <defs>
        <linearGradient id="bazGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a5a2a" />
          <stop offset="100%" stopColor="#1a2a0a" />
        </linearGradient>
      </defs>
      <rect x="10" y="42" width="70" height="14" fill="url(#bazGrad)" rx="3" />
      <circle cx="10" cy="49" r="7" fill="#1a1a1a" stroke="#333" strokeWidth="1" />
      <circle cx="10" cy="49" r="5" fill="#000" />
      <rect x="80" y="44" width="12" height="10" fill="#2a3a0a" rx="2" />
      <rect x="35" y="56" width="10" height="6" fill="#333" />
      <circle cx="25" cy="42" r="2" fill="#ff4" />
      <text x="50" y="51" fill="#ff0" fontSize="5" fontWeight="bold">RPG</text>
    </svg>
  );
  if (id === 'flamethrower') return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      <defs>
        <linearGradient id="flameGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a6820" />
          <stop offset="100%" stopColor="#4a3810" />
        </linearGradient>
        <radialGradient id="fireJet">
          <stop offset="0%" stopColor="#ffff00" />
          <stop offset="50%" stopColor="#ff8800" />
          <stop offset="100%" stopColor="#ff0000" stopOpacity="0.5" />
        </radialGradient>
      </defs>
      <ellipse cx="20" cy="50" rx="12" ry="18" fill="url(#flameGrad)" />
      <rect x="28" y="46" width="40" height="8" fill="#2a2a2a" rx="1" />
      <circle cx="70" cy="50" r="4" fill="#1a1a1a" stroke="#666" strokeWidth="1" />
      <circle cx="70" cy="50" r="2" fill="#000" />
      <ellipse cx="82" cy="50" rx="12" ry="6" fill="url(#fireJet)" opacity="0.9" />
      <ellipse cx="88" cy="50" rx="8" ry="3" fill="#ff0" opacity="0.7" />
      <rect x="38" y="54" width="8" height="5" fill="#444" />
      <rect x="18" y="32" width="4" height="8" fill="#666" />
    </svg>
  );
  // ============== NOUVELLES ARMES ==============
  if (id === 'throwknife') return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      <polygon points="15,50 70,42 80,50 70,58" fill="#d4d4d4" stroke="#333" strokeWidth="0.6" />
      <rect x="5" y="46" width="12" height="8" fill="#1a1a1a" />
      <circle cx="11" cy="50" r="1.5" fill="#d4af37" />
      <polygon points="20,30 28,45 24,48" fill="#c0c0c0" opacity=".6" />
      <polygon points="60,70 68,55 72,58" fill="#c0c0c0" opacity=".6" />
    </svg>
  );
  if (id === 'crossbow') return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      <path d="M20 30 Q6 50 20 70" stroke="#5a3a18" strokeWidth="4" fill="none" />
      <rect x="20" y="47" width="55" height="6" fill="#1a1a1a" />
      <line x1="20" y1="36" x2="80" y2="50" stroke="#aaa" strokeWidth="0.8" />
      <polygon points="80,48 90,50 80,52" fill="#c0c0c0" />
      <rect x="32" y="53" width="14" height="14" fill="#3a2010" />
    </svg>
  );
  if (id === 'uzi') return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      <defs>
        <linearGradient id="uziGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4d46b" />
          <stop offset="100%" stopColor="#7a5e1a" />
        </linearGradient>
      </defs>
      <rect x="20" y="43" width="50" height="14" fill="url(#uziGrad)" />
      <rect x="36" y="57" width="12" height="24" fill="#2a2a2a" />
      <rect x="70" y="40" width="16" height="20" rx="2" fill="url(#uziGrad)" />
      <rect x="28" y="38" width="20" height="5" fill="#1a1a1a" />
    </svg>
  );
  if (id === 'grenade') return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      <circle cx="50" cy="58" r="22" fill="#4a5a2a" stroke="#333" strokeWidth="1" />
      <path d="M36 42 Q40 38 44 42 M50 38 Q54 34 58 38 M62 42 Q66 38 70 42" stroke="#2a2a2a" strokeWidth="1" fill="none" />
      <rect x="45" y="30" width="10" height="10" fill="#d4af37" />
      <rect x="48" y="22" width="4" height="12" fill="#888" />
      <path d="M55 26 Q70 20 75 36" stroke="#888" fill="none" strokeWidth="2" />
    </svg>
  );
  if (id === 'laserrifle') return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      <defs>
        <linearGradient id="lasGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a3a4a" />
          <stop offset="100%" stopColor="#0a0a14" />
        </linearGradient>
      </defs>
      <rect x="15" y="45" width="65" height="10" fill="url(#lasGrad)" />
      <rect x="80" y="44" width="6" height="12" fill="#00ffee" />
      <circle cx="89" cy="50" r="4" fill="#00ffee" />
      <rect x="25" y="55" width="12" height="16" fill="#2a2a3a" />
      <rect x="20" y="38" width="25" height="7" rx="2" fill="#3a3a4a" />
      <path d="M86 50 Q92 48 96 50" stroke="#00ffee" strokeWidth="1" opacity=".5" />
    </svg>
  );
  return <div style={{fontSize: s * 0.7}}>⚔️</div>;
};

export const ArrowButton = ({ dir, onPress }) => {
  const handleDown = (e) => { e.preventDefault(); onPress(true); };
  const handleUp = (e) => { e.preventDefault(); onPress(false); };
  return (
    <button
      onTouchStart={handleDown}
      onTouchEnd={handleUp}
      onTouchCancel={handleUp}
      onMouseDown={handleDown}
      onMouseUp={handleUp}
      onMouseLeave={handleUp}
      style={{
        width: 50, height: 50,
        background: 'rgba(0,0,0,0.7)',
        border: '2px solid rgba(255,215,0,0.7)',
        borderRadius: 10, color: '#ffd700',
        fontSize: 24, cursor: 'pointer',
        userSelect: 'none',
        fontFamily: 'Georgia, serif',
        boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
      }}>{dir}</button>
  );
};

export const menuBtnStyle = (color) => ({
  padding: '12px 14px',
  background: `linear-gradient(135deg, ${color}, ${color}99)`,
  border: `1px solid ${color}`,
  color: '#fff', borderRadius: 8, cursor: 'pointer',
  fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 'bold',
});

export const StatCard = ({ label, value, color, onClick }) => (
  <div onClick={onClick}
    style={{
      background: 'rgba(0,0,0,0.6)', border: `1px solid ${color}44`,
      borderRadius: 8, padding: 12,
      cursor: onClick ? 'pointer' : 'default',
      backdropFilter: 'blur(4px)',
    }}>
    <div style={{ color: '#888', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ color, fontSize: 18, fontWeight: 'bold', marginTop: 2 }}>{value}</div>
  </div>
);

export const GameHeader = ({ casino, isVIP, balance, onExit, title }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between',
    padding: 14, background: 'rgba(0,0,0,0.7)',
    borderBottom: `1px solid ${casino.primary}`,
    alignItems: 'center',
    position: 'sticky', top: 0, zIndex: 100,
    backdropFilter: 'blur(8px)',
  }}>
    <button onClick={onExit} style={{
      background: 'transparent', border: `1px solid ${casino.secondary}`,
      color: casino.secondary, padding: '8px 16px', borderRadius: 6,
      cursor: 'pointer', fontFamily: 'Georgia, serif',
    }}>← Lobby</button>
    <div style={{ textAlign: 'center' }}>
      <div style={{ color: isVIP ? casino.accent : casino.secondary, fontSize: 12 }}>
        {isVIP ? '💎 TABLE VIP' : '🎰 TABLE'} 
      </div>
      <div style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>{title}</div>
    </div>
    <div style={{ textAlign: 'right' }}>
      <div style={{ color: '#cca366', fontSize: 11 }}>SOLDE</div>
      <div style={{ color: '#ffd700', fontSize: 20, fontWeight: 'bold' }}>{fmt(balance)} B</div>
    </div>
  </div>
);

export const btnStyle = (color, disabled) => ({
  padding: '12px 26px',
  background: disabled ? '#444' : `linear-gradient(135deg, ${color}, ${color}cc)`,
  color: color === '#ffd700' || color === '#f1bf00' ? '#000' : '#fff',
  border: 'none', borderRadius: 8,
  fontSize: 14, fontWeight: 'bold',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontFamily: 'Georgia, serif',
  boxShadow: disabled ? 'none' : `0 4px 12px ${color}44`,
  margin: 2, letterSpacing: 1,
});

// ============== WEAPON MENU ==============
export const WeaponMenu = ({ weapons, onClose, onUse }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 500, padding: 20,
  }}>
    <div style={{
      background: 'linear-gradient(145deg, #1a0a0a, #0a0503)',
      border: '2px solid #8b0000', borderRadius: 12, padding: 24,
      maxWidth: 500, width: '100%', fontFamily: 'Georgia, serif',
    }}>
      <h3 style={{ color: '#ff4444', margin: 0, marginBottom: 16, textAlign: 'center' }}>
        ⚔️ Choisis ton arme
      </h3>
      {weapons.map(w => {
        const def = WEAPONS.find(x => x.id === w);
        return (
          <button key={w} onClick={() => onUse(w)}
            style={{
              width: '100%', padding: 14, marginBottom: 8,
              background: 'rgba(139,0,0,0.2)', border: '1px solid #8b0000',
              borderRadius: 8, color: '#fff', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 15, textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
            <WeaponIcon id={w} size={36} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold' }}>{def.name}</div>
              <div style={{ fontSize: 11, color: '#cca366' }}>Dégâts : {def.damage}</div>
            </div>
          </button>
        );
      })}
      <button onClick={onClose} style={{
        width: '100%', marginTop: 8, padding: 10,
        background: 'transparent', border: '1px solid #888',
        color: '#888', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
      }}>Annuler</button>
    </div>
  </div>
);

export const numStyle = (bg) => ({
  background: bg, color: '#fff', fontWeight: 'bold',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  border: '1px solid #ffd700', borderRadius: 3, fontSize: 13,
  userSelect: 'none',
});

export const choiceBtn = (selected) => ({
  flex: 1, padding: 12,
  background: selected ? 'linear-gradient(135deg, #ff00aa, #aa0055)' : 'rgba(0,0,0,0.4)',
  border: `2px solid ${selected ? '#ffd700' : '#ff00aa'}`,
  color: '#fff', borderRadius: 8, cursor: 'pointer',
  fontFamily: 'Georgia, serif', fontSize: 12,
  textAlign: 'center',
});

export const pokerBtnStyle = (casino) => ({
  flex: 1, padding: 12,
  background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
  color: '#fff', border: 'none', borderRadius: 6,
  fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit',
  fontSize: 12,
});



// ============== VEHICLE GRAPHIC ==============
export const VehicleGraphic = ({ id }) => {
  if (id === 'skateboard') {
    return (
      <svg viewBox="0 0 200 80" width="200" height="80">
        <ellipse cx="100" cy="65" rx="70" ry="4" fill="rgba(0,0,0,.5)" />
        <rect x="20" y="40" width="160" height="10" rx="5" fill="#d4af37" stroke="#7a5e1a" />
        <circle cx="40" cy="58" r="7" fill="#111" stroke="#555" strokeWidth="2" />
        <circle cx="160" cy="58" r="7" fill="#111" stroke="#555" strokeWidth="2" />
        <rect x="30" y="34" width="30" height="6" fill="#b42a2a" opacity=".8" />
        <text x="100" y="47" textAnchor="middle" fill="#1a1a1a" fontSize="9" fontWeight="700">BENZ</text>
      </svg>
    );
  }
  if (id === 'bike') {
    return (
      <svg viewBox="0 0 220 100" width="220" height="100">
        <ellipse cx="110" cy="85" rx="90" ry="5" fill="rgba(0,0,0,.5)" />
        <circle cx="50" cy="70" r="22" fill="none" stroke="#d4af37" strokeWidth="3" />
        <circle cx="170" cy="70" r="22" fill="none" stroke="#d4af37" strokeWidth="3" />
        <circle cx="50" cy="70" r="5" fill="#d4af37" />
        <circle cx="170" cy="70" r="5" fill="#d4af37" />
        <path d="M50 70 L110 40 L170 70 M110 40 L90 70 Z" stroke="#f4d46b" strokeWidth="3" fill="none" />
        <path d="M110 40 L130 25 L150 25" stroke="#f4d46b" strokeWidth="3" fill="none" />
        <rect x="105" y="35" width="20" height="4" fill="#0b0b0b" />
      </svg>
    );
  }
  return <div style={{ fontSize: 60 }}>🚗</div>;
};

