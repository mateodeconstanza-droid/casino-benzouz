import React, { useState, useEffect } from 'react';
import { fmt } from '@/game/constants';
import { RankBadge } from '@/game/RankBadge';

// ============================================================
// UniversalMenu — bouton flottant + menu accessible PARTOUT
// (ville, casino, lobby, maison) — affiche : Profil + Trophées +
// Quêtes + Cosmétiques + Choix appareil
// ============================================================
export const UniversalMenu = ({
  profile, balance, onOpenTrophies, onOpenQuests, onOpenShop,
  onChangeDevice, deviceType, position = 'top-right',
}) => {
  const [open, setOpen] = useState(false);
  // Ferme le menu au clic extérieur
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const t = setTimeout(() => window.addEventListener('click', close), 50);
    return () => { clearTimeout(t); window.removeEventListener('click', close); };
  }, [open]);

  const posStyle = position === 'top-right'
    ? { top: 12, right: 12 }
    : position === 'top-left' ? { top: 12, left: 12 }
    : { top: 12, right: 12 };

  return (
    <>
      {/* Bouton flottant Menu (toujours visible) */}
      <button
        data-testid="universal-menu-btn"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        style={{
          position: 'absolute', ...posStyle,
          padding: '8px 14px', borderRadius: 10,
          background: 'linear-gradient(135deg, rgba(20,15,30,0.85), rgba(0,0,0,0.85))',
          border: '2px solid #ffd700', backdropFilter: 'blur(10px)',
          color: '#ffd700', fontSize: 13, fontWeight: 800, letterSpacing: 1,
          cursor: 'pointer', zIndex: 350,
          boxShadow: '0 6px 14px rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}
      >
        <span style={{ fontSize: 16 }}>≡</span> MENU
      </button>

      {/* Drawer du menu */}
      {open && (
        <div
          data-testid="universal-menu-drawer"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute', ...posStyle,
            top: 56, // sous le bouton
            width: 280,
            background: 'linear-gradient(135deg, rgba(20,10,28,0.96), rgba(8,4,14,0.96))',
            border: '2px solid #ffd700', borderRadius: 14,
            padding: 14, color: '#fff', zIndex: 351,
            backdropFilter: 'blur(14px)',
            boxShadow: '0 14px 36px rgba(0,0,0,0.7)',
          }}
        >
          {/* Profil header */}
          <div style={{
            paddingBottom: 12, marginBottom: 12,
            borderBottom: '1px solid rgba(255,215,0,0.25)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#ffd700' }}>
              {profile?.name || 'JOUEUR'}
            </div>
            <div style={{ fontSize: 13, color: '#cca366', marginTop: 4, marginBottom: 10 }}>
              💰 {fmt(balance)} $
            </div>
            <RankBadge profile={profile} compact={false} />
          </div>
          {/* Boutons d'action */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <MenuItem testId="menu-trophies" icon="🏆" label="Trophées & Progression" onClick={() => { setOpen(false); onOpenTrophies?.(); }} />
            <MenuItem testId="menu-quests" icon="📜" label="Quêtes journalières" onClick={() => { setOpen(false); onOpenQuests?.(); }} />
            <MenuItem testId="menu-shop" icon="🛒" label="Boutique" onClick={() => { setOpen(false); onOpenShop?.(); }} />
            <MenuItem testId="menu-device" icon={deviceType === 'mobile' ? '📱' : '🖥️'}
              label={`Appareil : ${deviceType === 'mobile' ? 'Mobile' : 'PC'}`}
              onClick={() => { setOpen(false); onChangeDevice?.(); }} />
          </div>
        </div>
      )}
    </>
  );
};

const MenuItem = ({ testId, icon, label, onClick }) => (
  <button
    data-testid={testId}
    onClick={onClick}
    style={{
      width: '100%', padding: '10px 12px', borderRadius: 8,
      background: 'rgba(255,215,0,0.08)',
      border: '1px solid rgba(255,215,0,0.3)',
      color: '#fff', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 10,
      fontSize: 13, fontWeight: 700, textAlign: 'left',
    }}
  >
    <span style={{ fontSize: 18 }}>{icon}</span>
    <span style={{ flex: 1 }}>{label}</span>
    <span style={{ opacity: 0.5 }}>→</span>
  </button>
);

export default UniversalMenu;
