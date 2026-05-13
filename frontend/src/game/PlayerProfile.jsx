import React, { useState } from 'react';
import { fmt, HAIR_CATALOG, OUTFIT_CATALOG, SHOES_CATALOG } from '@/game/constants';
import { Avatar3D } from '@/game/Avatar3D';
import { Banner, BANNER_CATALOG } from '@/game/Banners';

// =============================================================
// <PlayerProfile> — fiche modale d'un joueur.
//
// 2 modes :
//  - props.editable = true : son propre profil → l'utilisateur peut
//    changer la bannière équipée parmi ses bannières débloquées.
//  - props.editable = false : profil d'un autre joueur (lecture seule).
//
// Props : profile, isMine, onClose, onEquipBanner(bannerId)
// =============================================================
export const PlayerProfile = ({ profile, isMine = false, onClose, onEquipBanner }) => {
  const [showBannerPicker, setShowBannerPicker] = useState(false);

  const owned = profile?.ownedBanners || ['b-default'];
  const equipped = profile?.equippedBanner || 'b-default';

  return (
    <div
      data-testid="player-profile-modal"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 600,
        background: 'rgba(0,0,0,0.86)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, fontFamily: 'Georgia, serif',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg, #16101a, #08050a)',
          border: '2px solid #d4af37', borderRadius: 16,
          maxWidth: 540, width: '100%', maxHeight: '92vh', overflowY: 'auto',
          color: '#fff', position: 'relative',
        }}
      >
        {/* Bannière en haut */}
        <Banner id={equipped} width="100%" height={140} showName={false} />
        {/* Pseudo + édit bannière */}
        <div style={{
          position: 'absolute', top: 90, left: 18,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
          padding: '6px 14px', borderRadius: 10,
          border: '1px solid rgba(212,175,55,0.45)',
        }}>
          <div style={{ color: '#cca366', fontSize: 10, letterSpacing: 2 }}>
            {isMine ? 'MON PROFIL' : 'PROFIL JOUEUR'}
          </div>
          <div style={{ color: '#ffd700', fontSize: 22, fontWeight: 900, letterSpacing: 1 }}>
            {profile?.name || '???'}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 12, right: 12,
            padding: '6px 12px', borderRadius: 8,
            background: 'rgba(0,0,0,0.55)', border: '1px solid #d4af37',
            color: '#d4af37', cursor: 'pointer', fontWeight: 800,
            fontFamily: 'inherit', fontSize: 12,
          }}
        >✕ FERMER</button>
        {isMine && (
          <button
            onClick={() => setShowBannerPicker((s) => !s)}
            data-testid="profile-banner-edit"
            style={{
              position: 'absolute', top: 12, right: 110,
              padding: '6px 12px', borderRadius: 8,
              background: 'linear-gradient(135deg, #b08000, #ffd700)',
              border: 'none', color: '#111', cursor: 'pointer',
              fontWeight: 800, fontFamily: 'inherit', fontSize: 12,
            }}
          >🎨 BANNIÈRE</button>
        )}

        {/* Contenu principal */}
        <div style={{ padding: 18, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {/* Avatar 3D */}
          <div style={{ flex: '0 0 auto' }}>
            <Avatar3D
              hair={profile?.hair ?? 0}
              outfit={profile?.outfit ?? 0}
              shoes={profile?.shoes ?? 0}
              short={profile?.short ?? null}
              skin={profile?.skin || '#e0b48a'}
              size={170}
            />
          </div>

          {/* Stats */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <Section title="Stats">
              <Row label="Solde" value={`${fmt(profile?.balance || 0)} $`} color="#ffd700" />
              <Row label="Gains cumulés" value={`${fmt(profile?.totalWinnings || 0)} $`} color="#00ff88" />
              <Row label="Trophées" value={`${(profile?.unlockedTrophies || []).length}`} color="#ff6b9d" />
              <Row label="Maisons" value={`${(profile?.ownedHouses || []).length}`} color="#b48cff" />
              <Row label="Sessions" value={`${profile?.sessions || 0}`} color="#3fe6ff" />
            </Section>
            <Section title="Apparence">
              <Row label="Coiffure" value={HAIR_CATALOG[profile?.hair ?? 0]?.name || '—'} />
              <Row label="Tenue" value={OUTFIT_CATALOG[profile?.outfit ?? 0]?.name || '—'} />
              <Row label="Chaussures" value={SHOES_CATALOG[profile?.shoes ?? 0]?.name || '—'} />
            </Section>
          </div>
        </div>

        {/* Sélecteur de bannière (uniquement si c'est mon profil) */}
        {isMine && showBannerPicker && (
          <div style={{
            padding: 18, borderTop: '1px solid rgba(212,175,55,0.3)',
            background: 'rgba(0,0,0,0.4)',
          }}>
            <div style={{
              fontSize: 11, color: '#cca366', letterSpacing: 2,
              textTransform: 'uppercase', marginBottom: 10,
            }}>Choisis ta bannière ({owned.length}/{BANNER_CATALOG.length} débloquées)</div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 10, maxHeight: 320, overflowY: 'auto',
            }}>
              {BANNER_CATALOG.map((b) => {
                const isOwned = owned.includes(b.id);
                const isEquipped = equipped === b.id;
                return (
                  <button
                    key={b.id}
                    disabled={!isOwned}
                    onClick={() => {
                      if (isOwned) {
                        onEquipBanner && onEquipBanner(b.id);
                        setShowBannerPicker(false);
                      }
                    }}
                    data-testid={`banner-pick-${b.id}`}
                    style={{
                      padding: 6, borderRadius: 8,
                      background: isEquipped ? 'rgba(212,175,55,0.18)' : 'rgba(0,0,0,0.45)',
                      border: `2px solid ${isEquipped ? '#ffd700' : (isOwned ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.05)')}`,
                      cursor: isOwned ? 'pointer' : 'not-allowed',
                      opacity: isOwned ? 1 : 0.4,
                      position: 'relative',
                      fontFamily: 'inherit',
                    }}
                  >
                    <Banner id={b.id} width={140} height={45} showName={false} />
                    <div style={{
                      fontSize: 10, fontWeight: 800, color: '#fff',
                      marginTop: 4, letterSpacing: 0.5,
                    }}>{b.name}</div>
                    {!isOwned && (
                      <div style={{
                        fontSize: 9, color: '#888', marginTop: 2,
                      }}>
                        {b.unlockSource === 'shop' ? `🛒 ${fmt(b.price)} $` : `🎯 Passe niveau ${b.unlockSource.replace('pass-','')}`}
                      </div>
                    )}
                    {isEquipped && (
                      <div style={{
                        position: 'absolute', top: -6, right: -6,
                        padding: '2px 8px', borderRadius: 10,
                        background: '#14c356', color: '#fff', fontWeight: 900, fontSize: 9,
                        border: '1px solid #0d9344',
                      }}>✓</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{
      fontSize: 10, color: '#cca366', letterSpacing: 1.5,
      textTransform: 'uppercase', marginBottom: 6,
      borderBottom: '1px solid rgba(212,175,55,0.25)', paddingBottom: 3,
    }}>{title}</div>
    {children}
  </div>
);

const Row = ({ label, value, color }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between',
    padding: '3px 4px', fontSize: 12,
  }}>
    <span style={{ color: '#bbb' }}>{label}</span>
    <span style={{ color: color || '#fff', fontWeight: 700 }}>{value}</span>
  </div>
);

export default PlayerProfile;
