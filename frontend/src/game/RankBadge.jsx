import React from 'react';
import { TROPHIES } from '@/game/constants';

// ============================================================
// RankBadge — badge du rang actuel du joueur basé sur totalWinnings
// Affiche l'icône + nom + barre de progression vers le prochain rang
// ============================================================
export const RankBadge = ({ profile, compact = false }) => {
  const winnings = profile?.totalWinnings || 0;
  // Trouver le rang actuel : le dernier trophée dont le seuil est atteint
  let current = null;
  let next = TROPHIES[0];
  for (let i = 0; i < TROPHIES.length; i++) {
    if (winnings >= TROPHIES[i].threshold) {
      current = TROPHIES[i];
      next = TROPHIES[i + 1] || null;
    } else {
      next = TROPHIES[i];
      break;
    }
  }
  // Progression vers le rang suivant
  const prevThreshold = current?.threshold || 0;
  const nextThreshold = next?.threshold || prevThreshold;
  const progress = nextThreshold > prevThreshold
    ? Math.min(1, (winnings - prevThreshold) / (nextThreshold - prevThreshold))
    : 1;

  const rankColor = current?.color || '#888';
  const rankIcon = current?.icon || '🏅';
  const rankName = current?.name || 'Recrue';

  if (compact) {
    return (
      <div data-testid="rank-badge" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 10px', borderRadius: 8,
        background: `linear-gradient(135deg, ${rankColor}28, ${rankColor}10)`,
        border: `1.5px solid ${rankColor}`,
        boxShadow: `0 0 12px ${rankColor}50`,
      }}>
        <span style={{ fontSize: 16 }}>{rankIcon}</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: rankColor, letterSpacing: 1 }}>{rankName}</span>
      </div>
    );
  }

  return (
    <div data-testid="rank-badge-full" style={{
      padding: '10px 14px', borderRadius: 10,
      background: `linear-gradient(135deg, ${rankColor}25, rgba(0,0,0,0.7))`,
      border: `2px solid ${rankColor}`,
      boxShadow: `0 0 18px ${rankColor}60`,
      backdropFilter: 'blur(8px)',
      minWidth: 200,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: 28, filter: `drop-shadow(0 0 6px ${rankColor})` }}>{rankIcon}</span>
        <div>
          <div style={{ fontSize: 9, color: '#cca366', letterSpacing: 2 }}>RANG ACTUEL</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: rankColor, letterSpacing: 1.5 }}>{rankName.toUpperCase()}</div>
        </div>
      </div>
      {next && (
        <>
          <div style={{
            height: 6, borderRadius: 3,
            background: 'rgba(255,255,255,0.1)',
            overflow: 'hidden', marginTop: 4,
          }}>
            <div style={{
              width: `${progress * 100}%`, height: '100%',
              background: `linear-gradient(90deg, ${rankColor}, #ffd700)`,
              transition: 'width 0.6s ease-out',
              boxShadow: `0 0 6px ${rankColor}`,
            }} />
          </div>
          <div style={{ fontSize: 10, color: '#aaa', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
            <span>{Math.round(progress * 100)}%</span>
            <span>→ {next.icon} {next.name}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default RankBadge;
