import React from 'react';
import { HAIR_CATALOG, OUTFIT_CATALOG, SHOES_CATALOG } from '@/game/constants';
import { VehicleGraphic } from '@/game/ui';
// ============== VUE ARME 1ÈRE PERSONNE (SVG overlay) ==============
const FPWeaponView = ({ id }) => {
  const hands = (
    <g>
      <ellipse cx="60" cy="240" rx="55" ry="24" fill="#d2a27c" stroke="#8a6040" strokeWidth="2" />
      <ellipse cx="210" cy="240" rx="50" ry="20" fill="#d2a27c" stroke="#8a6040" strokeWidth="2" />
    </g>
  );
  if (id === 'knife') {
    return (
      <svg viewBox="0 0 340 260" style={{ width: '100%' }}>
        {hands}
        <g stroke="#d4af37" strokeWidth="2">
          <rect x="140" y="100" width="14" height="120" fill="#1a1a1a" />
          <rect x="136" y="220" width="22" height="24" fill="#3a2010" />
        </g>
      </svg>
    );
  }
  if (id === 'machete') {
    return (
      <svg viewBox="0 0 340 260" style={{ width: '100%' }}>
        {hands}
        <g stroke="#d4af37" strokeWidth="2">
          <path d="M140 90 L160 90 L170 220 L130 220 Z" fill="#c0c0c0" />
          <rect x="130" y="220" width="40" height="20" fill="#3a1a0a" />
        </g>
      </svg>
    );
  }
  if (id === 'gun') {
    return (
      <svg viewBox="0 0 340 260" style={{ width: '100%' }}>
        {hands}
        <g fill="#1a1a1a" stroke="#d4af37" strokeWidth="2">
          <path d="M80 160 L260 160 L260 186 L120 186 L110 230 L80 230 L70 186 L70 160 Z" />
          <rect x="250" y="148" width="30" height="16" rx="3" />
        </g>
      </svg>
    );
  }
  if (id === 'shotgun') {
    return (
      <svg viewBox="0 0 340 260" style={{ width: '100%' }}>
        {hands}
        <g stroke="#d4af37" strokeWidth="2">
          <rect x="30" y="150" width="260" height="14" fill="#1a1a1a" />
          <path d="M30 152 L90 152 L100 195 L80 225 L40 225 L28 195 Z" fill="#5a3a1e" />
          <rect x="290" y="140" width="32" height="28" rx="3" fill="#1a1a1a" />
        </g>
      </svg>
    );
  }
  if (id === 'bazooka') {
    return (
      <svg viewBox="0 0 340 260" style={{ width: '100%' }}>
        {hands}
        <g stroke="#d4af37" strokeWidth="2">
          <rect x="30" y="138" width="280" height="40" rx="10" fill="#3a3a3a" />
          <rect x="20" y="128" width="30" height="60" fill="#111" />
          <circle cx="310" cy="158" r="24" fill="#1a1a1a" stroke="#ffd700" strokeWidth="3" />
        </g>
      </svg>
    );
  }
  if (id === 'flamethrower') {
    return (
      <svg viewBox="0 0 340 260" style={{ width: '100%' }}>
        {hands}
        <g stroke="#d4af37" strokeWidth="2">
          <rect x="60" y="148" width="240" height="16" fill="#2a2a2a" />
          <circle cx="300" cy="156" r="18" fill="#ff6a00" />
          <rect x="110" y="164" width="36" height="34" fill="#3a1a0a" />
          <rect x="60" y="130" width="40" height="60" rx="6" fill="#c00" />
        </g>
      </svg>
    );
  }
  // ============== NOUVELLES ARMES ==============
  if (id === 'throwknife') {
    return (
      <svg viewBox="0 0 340 260" style={{ width: '100%' }}>
        {hands}
        <g stroke="#c0c0c0" strokeWidth="2">
          <polygon points="130,120 160,120 200,220 130,220" fill="#d4d4d4" />
          <rect x="130" y="220" width="70" height="16" fill="#1a1a1a" />
          <circle cx="160" cy="228" r="4" fill="#d4af37" />
        </g>
      </svg>
    );
  }
  if (id === 'crossbow') {
    return (
      <svg viewBox="0 0 340 260" style={{ width: '100%' }}>
        {hands}
        <g stroke="#d4af37" strokeWidth="2" fill="#1a1a1a">
          <rect x="60" y="158" width="220" height="12" />
          <path d="M100 120 Q50 155 100 200" stroke="#8a6040" strokeWidth="4" fill="none" />
          <line x1="100" y1="140" x2="280" y2="168" stroke="#888" strokeWidth="1.5" />
          <polygon points="280,160 310,164 280,168" fill="#c0c0c0" />
          <rect x="130" y="170" width="35" height="30" fill="#3a2010" />
        </g>
      </svg>
    );
  }
  if (id === 'uzi') {
    return (
      <svg viewBox="0 0 340 260" style={{ width: '100%' }}>
        {hands}
        <g stroke="#d4af37" strokeWidth="2" fill="#d4af37">
          <rect x="60" y="148" width="200" height="22" />
          <rect x="130" y="170" width="24" height="50" fill="#2a2a2a" />
          <rect x="260" y="140" width="34" height="38" rx="3" />
          <rect x="85" y="132" width="60" height="6" fill="#1a1a1a" />
        </g>
      </svg>
    );
  }
  if (id === 'grenade') {
    return (
      <svg viewBox="0 0 340 260" style={{ width: '100%' }}>
        {hands}
        <g stroke="#1a1a1a" strokeWidth="2">
          <circle cx="160" cy="180" r="36" fill="#4a5a2a" />
          <rect x="145" y="135" width="30" height="12" fill="#d4af37" />
          <rect x="155" y="110" width="12" height="30" fill="#888" />
          <path d="M170 120 Q200 110 210 135" stroke="#888" fill="none" strokeWidth="3" />
        </g>
      </svg>
    );
  }
  if (id === 'laserrifle') {
    return (
      <svg viewBox="0 0 340 260" style={{ width: '100%' }}>
        {hands}
        <g stroke="#00ffee" strokeWidth="2" fill="#2a2a3a">
          <rect x="40" y="150" width="240" height="18" />
          <rect x="280" y="148" width="10" height="24" fill="#00ffee" />
          <circle cx="295" cy="160" r="6" fill="#00ffee" />
          <rect x="100" y="168" width="30" height="36" />
          <rect x="60" y="135" width="60" height="15" rx="4" fill="#3a3a4a" />
        </g>
      </svg>
    );
  }
  return null;
};

// ============== VUE PERSONNAGE 3ÈME PERSONNE ==============
const TPPlayerView = ({ profile, selectedWeapon, firing }) => {
  const hair = (profile && profile.hair !== undefined) ? profile.hair : 0;
  const outfit = (profile && profile.outfit !== undefined) ? profile.outfit : 0;
  const shoes = (profile && profile.shoes !== undefined) ? profile.shoes : 0;
  const skin = (profile && profile.skin) || '#e0b48a';
  const equippedVeh = profile && profile.equippedVehicle;
  const hairColor = HAIR_CATALOG[hair]?.color || '#3a2817';
  const outfitColor = OUTFIT_CATALOG[outfit]?.color || '#1a1a1a';
  const shoesColor = SHOES_CATALOG[shoes]?.color || '#111';

  return (
    <div style={{
      filter: firing ? 'brightness(1.2)' : 'brightness(1)',
      transform: firing ? 'translate(-4px, 4px)' : 'none',
      transition: 'transform .08s, filter .08s',
      position: 'relative',
    }}>
      <svg viewBox="0 0 80 140" width="140" height="240">
        <ellipse cx="40" cy="136" rx="22" ry="3" fill="rgba(0,0,0,.4)" />
        <rect x="28" y="90" width="10" height="36" rx="3" fill={outfitColor} />
        <rect x="42" y="90" width="10" height="36" rx="3" fill={outfitColor} />
        <rect x="26" y="122" width="14" height="8" rx="3" fill={shoesColor} />
        <rect x="40" y="122" width="14" height="8" rx="3" fill={shoesColor} />
        <rect x="22" y="56" width="36" height="38" rx="8" fill={outfitColor} />
        <rect x="12" y="58" width="10" height="30" rx="5" fill={outfitColor} />
        <rect x="58" y="58" width="10" height="30" rx="5" fill={outfitColor} />
        <circle cx="17" cy="90" r="5" fill={skin} />
        <circle cx="63" cy="90" r="5" fill={skin} />
        <circle cx="40" cy="38" r="14" fill={skin} />
        <path d="M26 30 Q40 14 54 30 L54 38 Q40 32 26 38 Z" fill={hairColor} />
        <circle cx="35" cy="38" r="1.3" fill="#111" />
        <circle cx="45" cy="38" r="1.3" fill="#111" />
      </svg>
      {/* Vehicle under character */}
      {equippedVeh && (
        <div style={{
          position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)',
          zIndex: -1,
        }}>
          <div style={{ width: 160 }}>
            <VehicleGraphic id={equippedVeh} />
          </div>
        </div>
      )}
      {/* Weapon attached to hand */}
      {selectedWeapon && (
        <div style={{
          position: 'absolute', right: -40, top: 110,
          transform: firing ? 'rotate(-8deg)' : 'rotate(0)',
          transition: 'transform .08s',
        }}>
          <div style={{ width: 80 }}>
            <FPWeaponView id={selectedWeapon} />
          </div>
        </div>
      )}
    </div>
  );
};


export { FPWeaponView, TPPlayerView };
