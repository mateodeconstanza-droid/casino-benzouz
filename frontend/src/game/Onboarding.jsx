import React, { useEffect, useState } from 'react';
import { STAKE } from '@/game/stake/theme';

// =============================================================
// <Onboarding> — tutoriel contextuel (10s max par étape)
// Affiché une seule fois par joueur (persisté dans profile.onboardedAt).
// Props: active (bool), onFinish()
// =============================================================
const STEPS = [
  {
    id: 'street',
    title: 'Bienvenue dans BENZ Casino 👋',
    text: "Tu es dans la rue principale. À gauche et à droite, les propriétés à acheter. Au centre, le casino.",
    anchor: { top: '20%', left: '50%' },
    showArrowDown: false,
  },
  {
    id: 'houses',
    title: '🏠 Achète ta première propriété',
    text: "Clique sur une maison (5-100M B) pour l'acheter. Ta clé apparaîtra dans ton inventaire.",
    anchor: { top: '55%', left: '15%' },
    showArrowDown: false,
  },
  {
    id: 'casino',
    title: '🎰 Entre dans le casino',
    text: "Clique sur le bâtiment CASINO au centre pour déclencher la vérification d'identité (5s).",
    anchor: { top: '42%', left: '50%' },
    showArrowDown: true,
  },
  {
    id: 'hall',
    title: '🌍 Choisis ta salle',
    text: "Après le scan, tu atterriras dans le hall : 6 casinos au choix (Vegas, Malta, Monaco…).",
    anchor: { top: '45%', left: '50%' },
    showArrowDown: false,
  },
  {
    id: 'finish',
    title: '🎲 Bonne chance !',
    text: "Tu peux relancer ce tutoriel depuis le menu du casino à tout moment. Allez, bonne partie !",
    anchor: { top: '45%', left: '50%' },
    showArrowDown: false,
  },
];

const Onboarding = ({ active, onFinish }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) setStep(0);
  }, [active]);

  if (!active) return null;
  const s = STEPS[step];
  const isLast = step >= STEPS.length - 1;

  const skip = () => {
    onFinish?.();
  };
  const next = () => {
    if (isLast) onFinish?.();
    else setStep(step + 1);
  };

  return (
    <div
      data-testid="onboarding-overlay"
      style={{
        position: 'fixed', inset: 0, zIndex: 9000, pointerEvents: 'auto',
        background: 'rgba(5,10,18,0.35)', backdropFilter: 'blur(1.5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'ob-fade-in .3s ease-out',
      }}
    >
      {/* Carte du tutoriel */}
      <div
        data-testid={`onboarding-step-${s.id}`}
        style={{
          position: 'absolute',
          top: s.anchor.top, left: s.anchor.left,
          transform: 'translate(-50%, 0)',
          maxWidth: 360, width: '88%',
          background: 'linear-gradient(135deg, #0f2a42, #1d4a79)',
          border: `2px solid ${STAKE.gold}`, borderRadius: 16,
          padding: 18, color: '#fff',
          boxShadow: '0 20px 50px rgba(0,0,0,0.55), 0 0 25px rgba(212,175,55,0.3)',
          animation: 'ob-pop .35s cubic-bezier(.2,.9,.25,1.2)',
        }}
      >
        <div style={{
          fontSize: 10, color: STAKE.goldLight, letterSpacing: 1.5,
          textTransform: 'uppercase', marginBottom: 6,
        }}>
          Étape {step + 1} / {STEPS.length}
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>{s.title}</div>
        <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.5, marginBottom: 16 }}>
          {s.text}
        </div>
        {/* Barre de progression */}
        <div style={{
          height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginBottom: 12,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${((step + 1) / STEPS.length) * 100}%`,
            background: `linear-gradient(90deg, ${STAKE.gold}, ${STAKE.goldLight})`,
            transition: 'width .35s ease',
          }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            data-testid="onboarding-skip"
            onClick={skip}
            style={{
              flex: 1, padding: 10, borderRadius: 10,
              background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
              color: '#ccc', cursor: 'pointer', fontSize: 12, fontWeight: 700,
              fontFamily: 'inherit',
            }}
          >Passer</button>
          <button
            data-testid="onboarding-next"
            onClick={next}
            style={{
              flex: 2, padding: 10, borderRadius: 10,
              background: `linear-gradient(135deg, ${STAKE.goldDark}, ${STAKE.gold})`,
              border: 'none', color: '#111', fontWeight: 900, cursor: 'pointer',
              fontSize: 13, letterSpacing: 1, fontFamily: 'inherit',
            }}
          >{isLast ? 'C\'EST PARTI →' : 'SUIVANT →'}</button>
        </div>
      </div>

      {/* Flèche animée pointant vers la cible */}
      {s.showArrowDown && (
        <div style={{
          position: 'absolute',
          top: 'calc(50% + 10px)', left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 60, color: STAKE.gold,
          textShadow: `0 0 18px ${STAKE.gold}`,
          animation: 'ob-bounce 1s ease-in-out infinite',
        }}>
          ↓
        </div>
      )}

      <style>{`
        @keyframes ob-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ob-pop {
          0% { transform: translate(-50%, -10px) scale(0.95); opacity: 0; }
          100% { transform: translate(-50%, 0) scale(1); opacity: 1; }
        }
        @keyframes ob-bounce {
          0%,100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(12px); }
        }
      `}</style>
    </div>
  );
};

export default Onboarding;
