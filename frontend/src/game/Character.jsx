import React, { useState } from 'react';
import { fmt, HAIR_CATALOG, OUTFIT_CATALOG, SHOES_CATALOG, SHORT_CATALOG } from '@/game/constants';
// ============== ÉCRAN PERSONNALISATION PERSONNAGE ==============
const CharacterScreen = ({ profile, balance, setBalance, saveProfile, setProfile, onDone, casino }) => {
  const [tab, setTab] = useState('hair');
  const ownedHair = profile.ownedHair || [0, 1, 2];
  const ownedOutfit = profile.ownedOutfit || [0, 1, 2];
  const ownedShoes = profile.ownedShoes || [0, 1, 2];
  const ownedShort = profile.ownedShort || [];
  const curHair = profile.hair !== undefined ? profile.hair : 0;
  const curOutfit = profile.outfit !== undefined ? profile.outfit : 0;
  const curShoes = profile.shoes !== undefined ? profile.shoes : 0;
  const curShort = profile.short !== undefined ? profile.short : null; // null = pas de short (pantalon)
  const curSkin = profile.skin || '#e0b48a';

  const cat = tab === 'hair' ? HAIR_CATALOG
           : tab === 'outfit' ? OUTFIT_CATALOG
           : tab === 'shoes' ? SHOES_CATALOG
           : SHORT_CATALOG;
  const owned = tab === 'hair' ? ownedHair
              : tab === 'outfit' ? ownedOutfit
              : tab === 'shoes' ? ownedShoes
              : ownedShort;
  const curIdx = tab === 'hair' ? curHair
              : tab === 'outfit' ? curOutfit
              : tab === 'shoes' ? curShoes
              : curShort;

  const selectItem = async (item) => {
    const isOwned = owned.includes(item.id);
    if (isOwned) {
      // Just equip
      const patch = tab === 'hair' ? { hair: item.id }
                 : tab === 'outfit' ? { outfit: item.id }
                 : tab === 'shoes' ? { shoes: item.id }
                 : { short: item.id };
      const p = { ...profile, ...patch };
      setProfile(p); await saveProfile(p);
      return;
    }
    if (balance < item.price) {
      alert('Solde insuffisant');
      return;
    }
    setBalance(balance - item.price);
    const newOwned = [...owned, item.id];
    const patch = tab === 'hair' ? { hair: item.id, ownedHair: newOwned }
               : tab === 'outfit' ? { outfit: item.id, ownedOutfit: newOwned }
               : tab === 'shoes' ? { shoes: item.id, ownedShoes: newOwned }
               : { short: item.id, ownedShort: newOwned };
    const p = { ...profile, ...patch, balance: balance - item.price };
    setProfile(p); await saveProfile(p);
  };

  const setSkin = async (c) => {
    const p = { ...profile, skin: c };
    setProfile(p); await saveProfile(p);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'linear-gradient(180deg, #1a0a1f 0%, #050105 100%)',
      overflow: 'auto', padding: 16, fontFamily: 'Georgia, serif',
      zIndex: 100, color: '#fff',
    }} data-testid="character-screen">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 12, opacity: .7 }}>Solde : <b>{fmt(balance)} B</b></div>
        <h2 style={{ margin: 0, color: casino.secondary, letterSpacing: 3, fontSize: 22 }}>Personnalisation</h2>
        <button onClick={onDone} data-testid="char-done-btn" style={{
          padding: '10px 20px',
          background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
          color: '#fff', border: 'none', borderRadius: 8,
          cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold',
        }}>Entrer dans le casino →</button>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* Preview */}
        <div style={{
          background: 'rgba(0,0,0,0.5)', border: `1px solid ${casino.secondary}`,
          borderRadius: 12, padding: 20, minWidth: 240, textAlign: 'center',
        }}>
          <div style={{ color: '#cca366', fontSize: 11, letterSpacing: 2, marginBottom: 10 }}>APERÇU</div>
          <AvatarPreview hair={curHair} outfit={curOutfit} shoes={curShoes} short={curShort} skin={curSkin} size={180} />
          <div style={{ fontSize: 14, marginTop: 10, color: casino.secondary, fontWeight: 'bold' }}>
            {profile.name}
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ color: '#cca366', fontSize: 11, marginBottom: 6 }}>Teint</div>
            <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
              {['#f2d3b0', '#e0b48a', '#b98259', '#8a5a35', '#5e3a20', '#3a2310'].map(c => (
                <div key={c}
                  onClick={() => setSkin(c)}
                  data-testid={`char-skin-${c}`}
                  style={{
                    width: 26, height: 26, borderRadius: 13, background: c,
                    cursor: 'pointer',
                    border: curSkin === c ? `2px solid ${casino.secondary}` : '1px solid #444',
                  }} />
              ))}
            </div>
          </div>
        </div>

        {/* Tabs + Grid */}
        <div style={{ flex: 1, minWidth: 320, maxWidth: 720 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {[['hair','Cheveux'],['outfit','Vêtements'],['short','Shorts'],['shoes','Chaussures']].map(([k,l]) => (
              <button key={k}
                onClick={() => setTab(k)}
                data-testid={`char-tab-${k}`}
                style={{
                  padding: '10px 18px',
                  background: tab === k ? `linear-gradient(135deg, ${casino.primary}, ${casino.accent})` : 'rgba(255,255,255,0.05)',
                  color: tab === k ? '#fff' : '#cca366',
                  border: `1px solid ${tab === k ? casino.secondary : '#333'}`,
                  borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold',
                }}>{l}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 10 }}>
            {cat.map(item => {
              const isOwned = owned.includes(item.id);
              const isActive = curIdx === item.id;
              return (
                <div key={item.id}
                  onClick={() => selectItem(item)}
                  data-testid={`char-item-${tab}-${item.id}`}
                  style={{
                    background: 'rgba(0,0,0,0.45)',
                    border: `2px solid ${isActive ? casino.secondary : '#333'}`,
                    borderRadius: 10, padding: 10, textAlign: 'center', cursor: 'pointer',
                    boxShadow: isActive ? `0 0 15px ${casino.secondary}55` : 'none',
                  }}>
                  <div style={{ height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AvatarPreview
                      hair={tab === 'hair' ? item.id : curHair}
                      outfit={tab === 'outfit' ? item.id : curOutfit}
                      shoes={tab === 'shoes' ? item.id : curShoes}
                      short={tab === 'short' ? item.id : curShort}
                      skin={curSkin}
                      size={80}
                    />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 'bold', marginTop: 4 }}>{item.name}</div>
                  <div style={{ fontSize: 11, marginTop: 4, opacity: .85 }}>
                    {isOwned
                      ? (isActive ? <span style={{color: casino.secondary}}>✓ Équipé</span> : 'Possédé')
                      : item.price === 0 ? 'Gratuit' : `💰 ${fmt(item.price)}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============== AVATAR PREVIEW (SVG) ==============
const AvatarPreview = ({ hair = 0, outfit = 0, shoes = 0, short = null, skin = '#e0b48a', size = 100 }) => {
  const hairItem = HAIR_CATALOG[hair] || HAIR_CATALOG[0];
  const outfitItem = OUTFIT_CATALOG[outfit] || OUTFIT_CATALOG[0];
  const shoesItem = SHOES_CATALOG[shoes] || SHOES_CATALOG[0];
  const w = size; const h = size * 1.5;

  let hairPath;
  switch (hair) {
    case 1: hairPath = <path d="M27 25 Q40 17 53 25 L53 28 Q40 24 27 28 Z" fill={hairItem.color} opacity=".8" />; break;
    case 2: hairPath = <g><circle cx="30" cy="20" r="7" fill={hairItem.color} /><circle cx="40" cy="16" r="8" fill={hairItem.color} /><circle cx="50" cy="20" r="7" fill={hairItem.color} /></g>; break;
    case 3: hairPath = <g><path d="M26 22 Q40 8 54 22 L54 30 Q40 24 26 30 Z" fill={hairItem.color} /><rect x="26" y="28" width="3" height="16" fill={hairItem.color} /><rect x="54" y="28" width="3" height="16" fill={hairItem.color} /></g>; break;
    case 4: hairPath = <g><path d="M26 22 Q40 10 54 22 L54 30 Q40 26 26 30 Z" fill={hairItem.color} /><circle cx="40" cy="14" r="5" fill={hairItem.color} /></g>; break;
    case 5: hairPath = <g><path d="M36 6 L44 6 L46 22 L34 22 Z" fill={hairItem.color} /><path d="M28 22 Q40 18 52 22 L52 28 Q40 26 28 28 Z" fill="#1a1a1a" /></g>; break;
    case 6: hairPath = <path d="M22 24 Q40 6 58 24 L58 34 Q40 26 22 34 Z" fill={hairItem.color} />; break;
    case 7: hairPath = <path d="M24 22 Q40 6 56 22 L58 34 Q40 24 22 34 Z" fill={hairItem.color} />; break;
    case 8: hairPath = <g><path d="M22 24 Q40 4 58 24 L58 34 Q40 26 22 34 Z" fill={hairItem.color} /><circle cx="30" cy="16" r="2" fill="#fff" opacity=".6" /></g>; break;
    case 9: hairPath = <g><path d="M22 24 Q40 4 58 24 L58 34 Q40 24 22 34 Z" fill={hairItem.color} /><circle cx="40" cy="10" r="2" fill="#fff" /></g>; break;
    default: hairPath = <path d="M26 22 Q40 8 54 22 L54 30 Q40 24 26 30 Z" fill={hairItem.color} />;
  }

  return (
    <svg viewBox="0 0 80 120" width={w} height={h}>
      <ellipse cx="40" cy="116" rx="20" ry="3" fill="rgba(0,0,0,.35)" />
      {/* Jambes : pantalon long (outfit) OU short si sélectionné */}
      {short !== null && short !== undefined ? (
        <g>
          {/* Short (plus court) */}
          <rect x="28" y="78" width="10" height="16" rx="3" fill={(SHORT_CATALOG[short] || {}).color || '#2a2a2a'} />
          <rect x="42" y="78" width="10" height="16" rx="3" fill={(SHORT_CATALOG[short] || {}).color || '#2a2a2a'} />
          {(SHORT_CATALOG[short] || {}).accent && (
            <g>
              <rect x="28" y="90" width="10" height="4" fill={SHORT_CATALOG[short].accent} />
              <rect x="42" y="90" width="10" height="4" fill={SHORT_CATALOG[short].accent} />
            </g>
          )}
          {/* Jambes nues sous le short */}
          <rect x="30" y="94" width="6" height="16" rx="2" fill={skin} />
          <rect x="44" y="94" width="6" height="16" rx="2" fill={skin} />
        </g>
      ) : (
        <g>
          <rect x="28" y="78" width="10" height="30" rx="3" fill={outfitItem.color} />
          <rect x="42" y="78" width="10" height="30" rx="3" fill={outfitItem.color} />
        </g>
      )}
      {/* Chaussures */}
      <rect x="26" y="104" width="14" height="8" rx="3" fill={shoesItem.color} />
      <rect x="40" y="104" width="14" height="8" rx="3" fill={shoesItem.color} />
      {/* Haut / torse */}
      <rect x="22" y="46" width="36" height="36" rx="8" fill={outfitItem.color} />
      {/* Manches */}
      <rect x="12" y="48" width="10" height="28" rx="5" fill={outfitItem.color} />
      <rect x="58" y="48" width="10" height="28" rx="5" fill={outfitItem.color} />

      {/* ===== Accents selon le skin ===== */}
      {outfit === 10 && (
        /* Louis Vuittonz — motif LV sur le haut + bandes latérales dorées */
        <g>
          <text x="40" y="66" textAnchor="middle" fill={outfitItem.accent || '#d4af37'}
            fontSize="9" fontWeight="800" letterSpacing="1">LV</text>
          <rect x="38" y="78" width="2" height="30" fill={outfitItem.accent || '#d4af37'} />
          <rect x="42" y="78" width="2" height="30" fill={outfitItem.accent || '#d4af37'} />
        </g>
      )}
      {outfit === 11 && (
        /* Costume cravate — plastron + cravate */
        <g>
          <rect x="32" y="46" width="16" height="18" fill="#f5f5f5" />
          <polygon points="38,46 42,46 40,62 40,70 38,58" fill={outfitItem.accent || '#8b1a2e'} />
        </g>
      )}
      {(outfit === 12 || outfit === 13 || outfit === 14) && (
        /* Maillots de foot — bandes horizontales de l'équipe + numéro 10 */
        <g>
          {outfit === 12 && <rect x="22" y="58" width="36" height="6" fill={outfitItem.accent} />}
          {outfit === 13 && <rect x="22" y="50" width="36" height="4" fill={outfitItem.accent} />}
          {outfit === 14 && (
            <g>
              <rect x="22" y="50" width="36" height="6" fill={outfitItem.accent} />
              <rect x="22" y="66" width="36" height="6" fill={outfitItem.accent} />
            </g>
          )}
          <text x="40" y="74" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="800">10</text>
        </g>
      )}

      {/* Mains */}
      <circle cx="17" cy="78" r="5" fill={skin} />
      <circle cx="63" cy="78" r="5" fill={skin} />
      {/* Tête */}
      <circle cx="40" cy="30" r="14" fill={skin} />
      {hairPath}
      <circle cx="35" cy="30" r="1.3" fill="#111" />
      <circle cx="45" cy="30" r="1.3" fill="#111" />
      <path d="M35 36 Q40 39 45 36" stroke="#6b2b2b" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  );
};


export default CharacterScreen;
export { AvatarPreview };
;
