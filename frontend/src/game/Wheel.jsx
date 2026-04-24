import React, { useState, useEffect } from 'react';
import { fmt, WHEEL_PRIZES } from '@/game/constants';

// ============== ROUE DE LA FORTUNE GAMBLELIFE — VERSION MODERNE 16 CASES ==============
// - 16 prix (dont "MAISON GRATUITE" ultra rare)
// - Taille × 1.6 (min(540, 95vw))
// - Double anneau LED pulsant, cercle central avec logo GambleLife
// - Appel onComplete(prize) avec l'objet complet (pas juste value)
const FortuneWheel3D = ({ onComplete, onClose, canSpin, nextSpinTime, casino }) => {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (canSpin) return;
    const update = () => {
      const remaining = nextSpinTime - Date.now();
      if (remaining <= 0) { setCountdown('Disponible !'); return; }
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setCountdown(`${h}h ${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [canSpin, nextSpinTime]);

  const spin = () => {
    if (spinning || !canSpin) return;
    setSpinning(true);
    const totalWeight = WHEEL_PRIZES.reduce((s, p) => s + p.weight, 0);
    let r = Math.random() * totalWeight;
    let selectedIdx = 0;
    for (let i = 0; i < WHEEL_PRIZES.length; i++) {
      r -= WHEEL_PRIZES[i].weight;
      if (r <= 0) { selectedIdx = i; break; }
    }
    const segAng = 360 / WHEEL_PRIZES.length;
    const targetAngle = 360 - (selectedIdx * segAng + segAng / 2);
    const extraSpins = 7 + Math.floor(Math.random() * 3);
    const newRot = rotation - (rotation % 360) + extraSpins * 360 + targetAngle;
    setRotation(newRot);
    setTimeout(() => {
      setResult(WHEEL_PRIZES[selectedIdx]);
      setSpinning(false);
    }, 6200);
  };

  const segAngle = 360 / WHEEL_PRIZES.length;
  const RADIUS = 220;
  const INNER_RADIUS = 80;

  // Libellé court pour SVG (taille dynamique selon longueur)
  const fmtPrize = (p) => {
    if (p.value === 'HOUSE')   return ['★ MAISON', 'GRATUITE ★'];
    if (p.value === 'WEAPON')  return ['ARME', 'GRATUITE'];
    if (p.value === 'VEHICLE') return ['VÉHICULE', 'GRATUIT'];
    if (p.value === 'DOUBLE')  return ['SOLDE', '× 2'];
    if (p.value === 'QUINT')   return ['SOLDE', '× 5'];
    if (p.value === 0)         return ['RIEN', ''];
    return [p.label, ''];
  };

  // Texte résultat
  const prizeMessage = (p) => {
    if (!p) return '';
    if (p.value === 'HOUSE')   return '🏠 MAISON GRATUITE DÉBLOQUÉE !';
    if (p.value === 'WEAPON')  return '🔫 ARME SURPRISE DÉBLOQUÉE !';
    if (p.value === 'VEHICLE') return '🏎 VÉHICULE SURPRISE DÉBLOQUÉ !';
    if (p.value === 'DOUBLE')  return '💥 SOLDE × 2 !';
    if (p.value === 'QUINT')   return '🚀 SOLDE × 5 !';
    if (p.value === 0)         return 'Dommage ! Reviens dans 4h.';
    return `+ ${fmt(p.value)} $`;
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: `
        radial-gradient(ellipse at center, #2a1a14 0%, #0a0503 100%),
        repeating-linear-gradient(0deg, rgba(212,175,55,0.03) 0 2px, transparent 2px 6px)
      `,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 1500, padding: 16, overflow: 'hidden',
    }} data-testid="wheel-modal">
      {/* Effet particules dorées ambiantes */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.55,
        background: `
          radial-gradient(3px 3px at 12% 22%, rgba(255,215,0,0.8), transparent 70%),
          radial-gradient(2px 2px at 82% 38%, rgba(255,215,0,0.6), transparent 70%),
          radial-gradient(2px 2px at 46% 62%, rgba(255,255,255,0.5), transparent 70%),
          radial-gradient(3px 3px at 92% 82%, rgba(63,230,255,0.55), transparent 70%),
          radial-gradient(2px 2px at 25% 85%, rgba(212,175,55,0.7), transparent 70%)
        `,
        animation: 'wheelTwinkle 5s ease-in-out infinite',
      }} />
      <style>{`
        @keyframes wheelTwinkle { 0%,100%{opacity:.4} 50%{opacity:.85} }
        @keyframes wheelPulse   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        @keyframes wheelBulb    { 0%,100%{filter:drop-shadow(0 0 4px #ffd700)} 50%{filter:drop-shadow(0 0 14px #ffd700)} }
        @keyframes prizeReveal  { 0%{transform:scale(.6);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes neonPulse    { 0%,100%{text-shadow:0 0 30px #ffd700,0 0 60px #ff8800} 50%{text-shadow:0 0 50px #ffd700,0 0 90px #ff8800} }
      `}</style>

      <button onClick={onClose} style={{
        position: 'absolute', top: 18, right: 18, zIndex: 20,
        padding: '10px 18px',
        background: 'rgba(0,0,0,0.7)', border: '2px solid #ffd700',
        color: '#ffd700', borderRadius: 8, cursor: 'pointer',
        fontFamily: 'Georgia, serif', fontWeight: 700, letterSpacing: 1,
      }} data-testid="wheel-close">FERMER ✕</button>

      {/* Titre néon */}
      <h2 style={{
        color: '#ffd700', fontFamily: 'Georgia, serif',
        fontSize: 'clamp(24px, 4.5vw, 40px)', margin: '0 0 6px', textAlign: 'center',
        letterSpacing: 6, textShadow: '0 0 30px #ffd700, 0 0 60px #ff8800',
        animation: 'neonPulse 2s ease-in-out infinite',
      }}>ROUE DE LA FORTUNE</h2>
      <div style={{
        color: '#cca366', fontSize: 14, letterSpacing: 4, marginBottom: 10, fontStyle: 'italic',
      }}>★ GambleLife Royal — 16 cases · 1 maison gratuite à gagner ★</div>

      {!canSpin && !result && (
        <div style={{
          background: 'rgba(0,0,0,0.75)',
          border: `2px solid ${casino?.primary || '#ffd700'}`,
          borderRadius: 12, padding: '10px 22px', marginBottom: 14,
          textAlign: 'center', color: '#fff',
          boxShadow: `0 0 20px ${casino?.primary || '#ffd700'}55`,
        }}>
          <div style={{ fontSize: 12, marginBottom: 4, letterSpacing: 2, color: '#cca366' }}>
            PROCHAINE ROTATION DANS
          </div>
          <div style={{ color: '#ffd700', fontSize: 26, fontWeight: 'bold' }} data-testid="wheel-countdown">
            {countdown}
          </div>
        </div>
      )}

      {/* === Roue 2D modernisée === */}
      <div style={{
        position: 'relative',
        width: 'min(540px, 95vw)', height: 'min(540px, 95vw)', maxHeight: '60vh',
      }}>
        {/* Pointeur diamant */}
        <div style={{
          position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
          width: 0, height: 0,
          borderLeft: '22px solid transparent', borderRight: '22px solid transparent',
          borderTop: '34px solid #ff1a1a', zIndex: 10,
          filter: 'drop-shadow(0 4px 10px rgba(0,0,0,.8)) drop-shadow(0 0 16px #ff6a6a)',
        }} />
        {/* Glow extérieur */}
        <div style={{
          position: 'absolute', inset: -20, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.4), transparent 70%)',
          animation: 'wheelPulse 2.5s ease-in-out infinite',
          pointerEvents: 'none',
        }} />

        <svg viewBox="-260 -260 520 520" width="100%" height="100%"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 6s cubic-bezier(.12,.65,.25,1)' : 'transform 0.4s',
            filter: 'drop-shadow(0 12px 40px rgba(255,215,0,.5))',
          }}
          data-testid="wheel-svg">
          {/* Double anneau doré */}
          <circle r="256" fill="#2a1a0a" stroke="#ffd700" strokeWidth="5" />
          <circle r="243" fill="none" stroke="#8b6914" strokeWidth="1" />
          {WHEEL_PRIZES.map((prize, i) => {
            const startA = (i * segAngle - 90 - segAngle / 2) * Math.PI / 180;
            const endA = ((i + 1) * segAngle - 90 - segAngle / 2) * Math.PI / 180;
            const x1 = Math.cos(startA) * RADIUS, y1 = Math.sin(startA) * RADIUS;
            const x2 = Math.cos(endA) * RADIUS, y2 = Math.sin(endA) * RADIUS;
            const x3 = Math.cos(endA) * INNER_RADIUS, y3 = Math.sin(endA) * INNER_RADIUS;
            const x4 = Math.cos(startA) * INNER_RADIUS, y4 = Math.sin(startA) * INNER_RADIUS;
            const midA = ((i * segAngle + segAngle / 2) - 90 - segAngle / 2) * Math.PI / 180;
            const tx = Math.cos(midA) * ((RADIUS + INNER_RADIUS) / 2);
            const ty = Math.sin(midA) * ((RADIUS + INNER_RADIUS) / 2);
            const [l1, l2] = fmtPrize(prize);
            const isJackpot = prize.value === 10000000 || prize.value === 'HOUSE';
            return (
              <g key={i}>
                <path d={`M${x1},${y1} L${x2},${y2} L${x3},${y3} L${x4},${y4} Z`}
                  fill={prize.color} stroke="#ffd700" strokeWidth="2.5" />
                {isJackpot && (
                  <path d={`M${x1},${y1} L${x2},${y2} L${x3},${y3} L${x4},${y4} Z`}
                    fill="url(#jackpotGlow)" opacity="0.6" />
                )}
                <g transform={`translate(${tx} ${ty}) rotate(${-rotation})`}>
                  <text x="0" y={l2 ? -10 : 0} fill="#fff"
                    fontSize={Math.max(12, 26 - l1.length * 1)}
                    fontWeight="900" textAnchor="middle" dominantBaseline="central"
                    fontFamily="Georgia, serif"
                    style={{ paintOrder: 'stroke', stroke: '#000', strokeWidth: 3 }}>
                    {l1}
                  </text>
                  {l2 && (
                    <text x="0" y="14" fill="#fff"
                      fontSize={Math.max(11, 22 - l2.length * 1)}
                      fontWeight="900" textAnchor="middle" dominantBaseline="central"
                      fontFamily="Georgia, serif"
                      style={{ paintOrder: 'stroke', stroke: '#000', strokeWidth: 3 }}>
                      {l2}
                    </text>
                  )}
                </g>
              </g>
            );
          })}
          <defs>
            <radialGradient id="jackpotGlow">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ffd700" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* Centre disque GambleLife */}
          <circle r={INNER_RADIUS} fill="#1a1a1a" stroke="#ffd700" strokeWidth="4" />
          <circle r={INNER_RADIUS - 10} fill="#0f0f14" stroke="#8b6914" strokeWidth="1.5" />
          <circle r="22" fill="#ffd700" />
          <circle r="22" fill="url(#centerShine)" />
          <defs>
            <radialGradient id="centerShine" cx="35%" cy="25%">
              <stop offset="0%" stopColor="#fff8cc" />
              <stop offset="100%" stopColor="#b8860b" />
            </radialGradient>
          </defs>
          <text x="0" y={-INNER_RADIUS / 2 - 6} fill="#ffd700"
            fontSize="13" textAnchor="middle" dominantBaseline="central"
            fontFamily="Georgia, serif" fontWeight="900" letterSpacing="2"
            transform={`rotate(${-rotation})`}>
            ★ GAMBLELIFE ★
          </text>
          {/* 24 Bulbs autour de l'anneau extérieur */}
          {Array.from({ length: 24 }).map((_, i) => {
            const a = (i / 24) * Math.PI * 2;
            return (
              <circle key={i}
                cx={Math.cos(a) * 248} cy={Math.sin(a) * 248} r="5"
                fill={i % 2 === 0 ? '#fff8a0' : '#ffe0a0'}
                stroke="#b8860b" strokeWidth="1"
                style={{ animation: `wheelBulb ${1.2 + (i % 3) * 0.3}s ease-in-out infinite` }}
              />
            );
          })}
        </svg>
      </div>

      {/* Bouton / résultat */}
      <div style={{ marginTop: 18, minHeight: 64, textAlign: 'center' }}>
        {!result && canSpin && (
          <button onClick={spin} disabled={spinning}
            data-testid="wheel-spin-btn"
            style={{
              padding: '18px 56px', fontSize: 22,
              background: spinning ? '#555' : 'linear-gradient(135deg, #ffd700, #b8860b)',
              color: '#1a1a1a', border: '3px solid #fff', borderRadius: 12,
              cursor: spinning ? 'not-allowed' : 'pointer',
              fontWeight: 'bold', fontFamily: 'Georgia, serif',
              boxShadow: '0 10px 30px rgba(255,215,0,0.7)',
              letterSpacing: 3,
            }}>
            {spinning ? 'TOURNE…' : 'TOURNER LA ROUE'}
          </button>
        )}
        {result && (
          <div style={{ animation: 'prizeReveal 0.6s ease-out' }}>
            <div style={{
              fontSize: (result.value === 10000000 || result.value === 'HOUSE') ? 36 : 28,
              color: (result.value === 10000000 || result.value === 'HOUSE') ? '#ff0080' : '#ffd700',
              fontWeight: 'bold', fontFamily: 'Georgia, serif',
              textShadow: `0 0 40px ${(result.value === 10000000 || result.value === 'HOUSE') ? '#ff0080' : '#ffd700'}`,
              marginBottom: 18,
            }}>{prizeMessage(result)}</div>
            <button onClick={() => onComplete(result)}
              data-testid="wheel-claim-btn"
              style={{
                padding: '14px 44px', fontSize: 18,
                background: 'linear-gradient(135deg, #ffd700, #b8860b)',
                color: '#1a1a1a', border: 'none', borderRadius: 10,
                cursor: 'pointer', fontWeight: 'bold',
                fontFamily: 'Georgia, serif', letterSpacing: 2,
                boxShadow: '0 6px 18px rgba(255,215,0,0.5)',
              }}>RÉCUPÉRER</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FortuneWheel3D;
