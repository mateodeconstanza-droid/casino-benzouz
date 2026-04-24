import React, { useState, useEffect, useRef } from 'react';
import { fmt, handValue, createDeck, RED_NUMBERS, ROULETTE_NUMBERS, WHEEL_PRIZES, WEAPONS, VEHICLES, HAIR_CATALOG, OUTFIT_CATALOG, SHOES_CATALOG, TROPHIES, CASINOS, DEALER_PROFILES, CASINO_3D_COLORS, BENZBET_MATCHES, generateMatches, BENZBET_KEY, getColor, bjValue, sportBtnStyle, FOUR_HOURS, POKER_HAND_NAMES, evaluatePokerHand, evaluateHand5, compareTB } from '@/game/constants';
import { Card, Chip, ChipStack, GameHeader, btnStyle, menuBtnStyle, StatCard, ArrowButton, Dealer, WeaponIcon, FlyingProjectile, pokerBtnStyle, numStyle, choiceBtn, VehicleGraphic, WeaponMenu } from '@/game/ui';

// ============== ROUE DE LA FORTUNE - 2D FLAT (droite, recto-verso) ==============
const FortuneWheel3D = ({ onComplete, onClose, canSpin, nextSpinTime, casino }) => {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [countdown, setCountdown] = useState("");
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (canSpin) return;
    const update = () => {
      const remaining = nextSpinTime - Date.now();
      if (remaining <= 0) { setCountdown("Disponible !"); return; }
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setCountdown(h+"h "+m+"m "+s+"s");
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
    const extraSpins = 6 + Math.floor(Math.random() * 3);
    const newRot = rotation - (rotation % 360) + extraSpins * 360 + targetAngle;
    setRotation(newRot);

    setTimeout(() => {
      setResult(WHEEL_PRIZES[selectedIdx]);
      setSpinning(false);
    }, 5200);
  };

  const segAngle = 360 / WHEEL_PRIZES.length;
  const radius = 150;
  const innerRadius = 55;

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "radial-gradient(ellipse at center, #2a1010 0%, #000 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      zIndex: 1500, padding: 16,
    }}>
      <button onClick={onClose} style={{
        position: "absolute", top: 20, right: 20,
        padding: "8px 16px",
        background: "rgba(0,0,0,0.6)", border: "1px solid #ffd700",
        color: "#ffd700", borderRadius: 6, cursor: "pointer", fontFamily: "Georgia, serif",
        zIndex: 10,
      }} data-testid="wheel-close">Fermer</button>

      <h2 style={{
        color: "#ffd700", fontFamily: "Georgia, serif",
        fontSize: 26, marginBottom: 12, textAlign: "center",
        letterSpacing: 4, textShadow: "0 0 30px #ffd700, 0 0 60px #ff8800",
        animation: "neonPulse 2s ease-in-out infinite",
      }}>ROUE DE LA FORTUNE</h2>

      {!canSpin && !result && (
        <div style={{
          background: "rgba(0,0,0,0.7)", border: "2px solid " + casino.primary,
          borderRadius: 10, padding: 12, marginBottom: 12,
          textAlign: "center", color: "#fff",
        }}>
          <div style={{ fontSize: 13, marginBottom: 4 }}>Prochaine rotation dans :</div>
          <div style={{ color: "#ffd700", fontSize: 22, fontWeight: "bold" }}>{countdown}</div>
        </div>
      )}

      {/* 2D flat wheel */}
      <div style={{ position: "relative", width: "min(340px, 90vw)", height: "min(340px, 90vw)", maxHeight: "60vh" }}>
        {/* Pointer on top */}
        <div style={{
          position: "absolute", top: -6, left: "50%", transform: "translateX(-50%)",
          width: 0, height: 0,
          borderLeft: "14px solid transparent", borderRight: "14px solid transparent",
          borderTop: "22px solid #ff3030", zIndex: 10,
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,.6))",
        }} />

        <svg viewBox="-170 -170 340 340" width="100%" height="100%"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? "transform 5s cubic-bezier(.12,.65,.25,1)" : "transform 0.4s",
            filter: "drop-shadow(0 10px 30px rgba(255,215,0,.3))",
          }}
          data-testid="wheel-svg">
          {/* Outer ring */}
          <circle r="168" fill="#2a1a0a" stroke="#ffd700" strokeWidth="4" />
          {WHEEL_PRIZES.map((prize, i) => {
            const startA = (i * segAngle - 90 - segAngle/2) * Math.PI / 180;
            const endA = ((i+1) * segAngle - 90 - segAngle/2) * Math.PI / 180;
            const x1 = Math.cos(startA) * radius, y1 = Math.sin(startA) * radius;
            const x2 = Math.cos(endA) * radius, y2 = Math.sin(endA) * radius;
            const x3 = Math.cos(endA) * innerRadius, y3 = Math.sin(endA) * innerRadius;
            const x4 = Math.cos(startA) * innerRadius, y4 = Math.sin(startA) * innerRadius;
            const midA = ((i * segAngle + segAngle/2) - 90 - segAngle/2) * Math.PI / 180;
            const tx = Math.cos(midA) * ((radius + innerRadius) / 2);
            const ty = Math.sin(midA) * ((radius + innerRadius) / 2);
            return (
              <g key={i}>
                <path d={`M${x1},${y1} L${x2},${y2} L${x3},${y3} L${x4},${y4} Z`}
                  fill={prize.color} stroke="#ffd700" strokeWidth="2" />
                {/* Counter-rotate text to keep it upright no matter the wheel rotation (recto-verso readability) */}
                <g transform={`translate(${tx} ${ty}) rotate(${-rotation})`}>
                  <text x="0" y="0" fill="#fff" fontSize={prize.label === "JACKPOT" ? 14 : 18} fontWeight="800"
                    textAnchor="middle" dominantBaseline="central"
                    style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 3 }}>
                    {prize.label}
                  </text>
                </g>
              </g>
            );
          })}
          {/* Center */}
          <circle r={innerRadius} fill="#1a1a1a" stroke="#ffd700" strokeWidth="3" />
          <circle r={innerRadius - 12} fill="#0f0f14" stroke="#8b6914" strokeWidth="1" />
          <circle r="14" fill="#ffd700" />
          {/* Bulbs around rim */}
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <circle key={i} cx={Math.cos(a) * 160} cy={Math.sin(a) * 160} r="5"
              fill="#fff8a0" stroke="#b8860b" strokeWidth="1" />;
          })}
        </svg>
      </div>

      <div style={{ marginTop: 20 }}>
        {!result && canSpin && (
          <button onClick={spin} disabled={spinning}
            data-testid="wheel-spin-btn"
            style={{
              padding: "16px 44px", fontSize: 20,
              background: spinning ? "#555" : "linear-gradient(135deg, #ffd700, #b8860b)",
              color: "#1a1a1a", border: "3px solid #fff", borderRadius: 10,
              cursor: spinning ? "not-allowed" : "pointer",
              fontWeight: "bold", fontFamily: "Georgia, serif",
              boxShadow: "0 8px 25px rgba(255,215,0,0.7)",
              letterSpacing: 2,
            }}>
            {spinning ? "TOURNE..." : "TOURNER"}
          </button>
        )}

        {result && (
          <div style={{ textAlign: "center", animation: "prizeReveal 0.6s ease-out" }}>
            <div style={{
              fontSize: result.label === "JACKPOT" ? 36 : 26,
              color: result.label === "JACKPOT" ? "#ff0080" : "#ffd700",
              fontWeight: "bold", fontFamily: "Georgia, serif",
              textShadow: `0 0 40px ${result.label === "JACKPOT" ? "#ff0080" : "#ffd700"}`,
              marginBottom: 16,
            }}>
              {result.label === "RIEN" ? "Dommage !" :
               result.label === "JACKPOT" ? "JACKPOT ! +1 000 000 $" :
               "+" + fmt(result.value) + " $"}
            </div>
            <button onClick={() => onComplete(result.value)}
              data-testid="wheel-claim-btn"
              style={{
                padding: "14px 40px", fontSize: 18,
                background: "linear-gradient(135deg, #ffd700, #b8860b)",
                color: "#1a1a1a", border: "none", borderRadius: 8,
                cursor: "pointer", fontWeight: "bold", fontFamily: "Georgia, serif",
              }}>Recuperer</button>
          </div>
        )}
      </div>
    </div>
  );
};




export default FortuneWheel3D;
