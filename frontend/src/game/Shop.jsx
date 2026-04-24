import React, { useState, useEffect, useRef } from 'react';
import { fmt, handValue, createDeck, RED_NUMBERS, ROULETTE_NUMBERS, WHEEL_PRIZES, WEAPONS, VEHICLES, HAIR_CATALOG, OUTFIT_CATALOG, SHOES_CATALOG, TROPHIES, CASINOS, DEALER_PROFILES, CASINO_3D_COLORS, BENZBET_MATCHES, generateMatches, BENZBET_KEY, getColor, bjValue, sportBtnStyle, FOUR_HOURS, POKER_HAND_NAMES, evaluatePokerHand, evaluateHand5, compareTB } from '@/game/constants';
import { Card, Chip, ChipStack, GameHeader, btnStyle, menuBtnStyle, StatCard, ArrowButton, Dealer, WeaponIcon, FlyingProjectile, pokerBtnStyle, numStyle, choiceBtn, VehicleGraphic, WeaponMenu } from '@/game/ui';
import { applyEventDiscount, getActiveEvents } from '@/game/dailyEvents';

// ============== GAMBLELIFE STORE - armes au mur + véhicules en showroom ==============
const Shop = ({ profile, balance, onBuy, onBuyVehicle, onEquipVehicle, onBuyCosmetic, onEquipCosmetic, onClose, casino }) => {
  const owned = profile.weapons || [];
  const ownedVeh = profile.vehicles || [];
  const equippedVeh = profile.equippedVehicle || null;
  const ownedHair = profile.ownedHair || [0, 1, 2];
  const ownedOutfit = profile.ownedOutfit || [0, 1, 2];
  const ownedShoes = profile.ownedShoes || [0, 1, 2];
  const [tab, setTab] = useState('weapons');
  const activeEvents = getActiveEvents();

  // --- Rendu générique d'un catalogue cosmétique ---
  const renderCosmetics = (catalog, ownedList, cosmeticKey, labelSlot, equippedId) => (
    <div style={{
      background: 'linear-gradient(180deg, #1a1520, #0d0a14)',
      border: `2px solid ${casino.secondary}40`,
      borderRadius: 14, padding: 20,
    }}>
      <div style={{ fontSize: 11, color: casino.secondary, letterSpacing: 3, textAlign: 'center', marginBottom: 18 }}>
        • • •  VESTIAIRE {labelSlot.toUpperCase()}  • • •
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        {catalog.map(item => {
          const hasIt = ownedList.includes(item.id);
          const canAfford = balance >= item.price;
          const isEquipped = equippedId === item.id;
          return (
            <div key={item.id} style={{
              background: 'linear-gradient(180deg, #1e1a28, #10081a)',
              border: `1px solid ${isEquipped ? casino.secondary : (hasIt ? '#00aa44' : '#3a2838')}`,
              borderRadius: 10, padding: 12, textAlign: 'center',
              boxShadow: isEquipped ? `0 0 18px ${casino.secondary}55` : '0 4px 10px rgba(0,0,0,.55)',
            }} data-testid={`shop-${cosmeticKey}-${item.id}`}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: `radial-gradient(circle at 35% 25%, ${item.color}, #0a0a10)`,
                border: item.accent ? `3px solid ${item.accent}` : '2px solid #2a1a2a',
                margin: '0 auto 10px',
                boxShadow: `inset 0 -10px 18px rgba(0,0,0,.5), 0 4px 10px rgba(0,0,0,.5)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 900, fontSize: 14,
              }}>{item.pattern || ''}</div>
              <div style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>{item.name}</div>
              {item.tag && (
                <div style={{ display: 'inline-block', marginTop: 3, padding: '2px 6px',
                  background: 'rgba(212,175,55,0.2)', border: '1px solid #8a6a20',
                  color: '#ffd700', fontSize: 9, borderRadius: 3, letterSpacing: 1 }}>
                  {item.tag}
                </div>
              )}
              <div style={{ marginTop: 8 }}>
                {hasIt ? (
                  <button onClick={() => onEquipCosmetic && onEquipCosmetic(cosmeticKey, item.id)}
                    data-testid={`shop-equip-${cosmeticKey}-${item.id}`}
                    style={{
                      width: '100%', padding: '7px 10px',
                      background: isEquipped ? 'linear-gradient(135deg, #00ff88, #00aa44)' : 'rgba(255,255,255,0.08)',
                      color: isEquipped ? '#000' : '#fff',
                      border: `1px solid ${casino.secondary}`, borderRadius: 6,
                      cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', fontSize: 11,
                    }}>
                    {isEquipped ? '✓ ÉQUIPÉ' : 'Équiper'}
                  </button>
                ) : (
                  <button onClick={() => canAfford && onBuyCosmetic && onBuyCosmetic(cosmeticKey, item)}
                    disabled={!canAfford}
                    data-testid={`shop-buy-${cosmeticKey}-${item.id}`}
                    style={{
                      width: '100%', padding: '7px 10px',
                      background: canAfford ? `linear-gradient(135deg, ${casino.primary}, ${casino.accent})` : '#444',
                      color: '#fff', border: 'none', borderRadius: 6,
                      cursor: canAfford ? 'pointer' : 'not-allowed',
                      fontFamily: 'inherit', fontWeight: 'bold', fontSize: 11,
                    }}>
                    {canAfford ? `${fmt(item.price)} $` : 'TROP CHER'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 500, padding: 20, overflowY: 'auto',
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #120a06, #060302)',
        border: `2px solid ${casino.primary}`, borderRadius: 14,
        padding: 24, maxWidth: 960, width: '100%',
        fontFamily: 'Georgia, serif', maxHeight: '94vh', overflowY: 'auto',
        boxShadow: `0 0 40px ${casino.primary}30`,
      }}>
        <h2 style={{
          color: casino.secondary, textAlign: 'center', margin: 0, marginBottom: 4,
          textShadow: `0 0 18px ${casino.primary}`, letterSpacing: 3, fontSize: 28,
        }}>🏎  GAMBLELIFE STORE  🔫</h2>
        <div style={{ textAlign: 'center', color: '#cca366', marginBottom: 14, fontSize: 12, fontStyle: 'italic' }}>
          Showroom d'exception — Armes de prestige & véhicules de luxe
        </div>

        {/* Bandeau d'événements actifs visible dans le shop */}
        {activeEvents.length > 0 && (
          <div data-testid="shop-events-banner" style={{
            display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center',
            marginBottom: 12, padding: 10, borderRadius: 10,
            background: 'rgba(255,215,0,0.08)', border: '1px dashed rgba(255,215,0,0.4)',
          }}>
            {activeEvents.map(ev => (
              <div key={ev.id} style={{
                padding: '6px 12px', borderRadius: 8,
                background: `linear-gradient(135deg, ${ev.color}cc, ${ev.color}77)`,
                color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: 0.4,
                border: `1px solid ${ev.color}`,
              }}>{ev.label}</div>
            ))}
          </div>
        )}
        <div style={{ textAlign: 'center', color: casino.secondary, marginBottom: 16, fontSize: 18 }}>
          Solde : <strong>{fmt(balance)} $</strong>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          {[
            ['weapons',   '🔫 Armes'],
            ['vehicles',  '🏎 Véhicules'],
            ['hair',      '💇 Cheveux'],
            ['outfit',    '👕 Vêtements'],
            ['shoes',     '👟 Chaussures'],
          ].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)}
              data-testid={`shop-tab-${k}`}
              style={{
                padding: '10px 20px',
                background: tab === k ? `linear-gradient(135deg, ${casino.primary}, ${casino.accent})` : 'rgba(255,255,255,0.05)',
                color: tab === k ? '#fff' : '#cca366',
                border: `1px solid ${tab === k ? casino.secondary : '#333'}`,
                borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold',
              }}>{l}</button>
          ))}
        </div>

        {tab === 'weapons' && (
          <div style={{
            background:
              'repeating-linear-gradient(90deg, #2a1c10 0 4px, #241710 4px 80px)',
            border: '6px solid #1a1108',
            borderRadius: 12,
            padding: 18,
            boxShadow: 'inset 0 0 60px rgba(0,0,0,.8)',
          }}>
            <div style={{ fontSize: 11, color: casino.secondary, letterSpacing: 3, textAlign: 'center', marginBottom: 14 }}>
              • • •  ARMES EXPOSÉES AU MUR  • • •
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {WEAPONS.map(w => {
                const hasIt = owned.includes(w.id);
                const effectivePrice = applyEventDiscount(w.price, w, 'weapon');
                const discounted = effectivePrice < w.price;
                const canAfford = balance >= effectivePrice;
                return (
                  <div key={w.id} style={{
                    background: 'linear-gradient(180deg, #2a1e12, #14100a)',
                    border: `1px solid ${hasIt ? '#00aa44' : (discounted ? '#1aa34a' : '#4a3820')}`,
                    borderRadius: 10, padding: 12, textAlign: 'center',
                    boxShadow: '0 4px 10px rgba(0,0,0,.6)',
                    position: 'relative',
                  }} data-testid={`shop-weapon-${w.id}`}>
                    {discounted && !hasIt && (
                      <div style={{
                        position: 'absolute', top: -10, right: -10,
                        background: 'linear-gradient(135deg, #1aa34a, #0a6a1a)',
                        border: '2px solid #ffd700', borderRadius: 999,
                        padding: '4px 10px', fontSize: 10, fontWeight: 900, letterSpacing: 1,
                        color: '#fff', boxShadow: '0 4px 12px rgba(26,163,74,0.6)',
                        transform: 'rotate(8deg)',
                      }}>-50%</div>
                    )}
                    <div style={{
                      background: '#0a0705', border: '1px solid #3a2a18',
                      borderRadius: 8, padding: 12, marginBottom: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 70,
                    }}>
                      <WeaponIcon id={w.id} size={56} />
                    </div>
                    <div style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{w.name}</div>
                    <div style={{ color: '#cca366', fontSize: 11, fontStyle: 'italic', margin: '4px 0' }}>{w.desc}</div>
                    <div style={{ color: casino.secondary, fontSize: 12, marginBottom: 8 }}>
                      Dégâts : {w.damage}
                    </div>
                    {hasIt ? (
                      <div style={{ color: '#00ff88', fontWeight: 'bold', fontSize: 12 }}>✓ ACQUIS</div>
                    ) : (
                      <button onClick={() => onBuy({ ...w, price: effectivePrice })} disabled={!canAfford}
                        data-testid={`shop-buy-weapon-${w.id}`}
                        style={{
                          padding: '8px 14px', width: '100%',
                          background: canAfford ? `linear-gradient(135deg, ${casino.primary}, ${casino.accent})` : '#444',
                          color: '#fff', border: 'none', borderRadius: 6,
                          cursor: canAfford ? 'pointer' : 'not-allowed',
                          fontFamily: 'inherit', fontWeight: 'bold', fontSize: 12,
                        }}>
                        {canAfford
                          ? (discounted
                              ? <>{fmt(effectivePrice)} $ <span style={{ textDecoration: 'line-through', opacity: 0.6, marginLeft: 4, fontSize: 10 }}>{fmt(w.price)}</span></>
                              : `${fmt(effectivePrice)} $`)
                          : 'TROP CHER'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'vehicles' && (
          <div style={{
            background:
              'radial-gradient(ellipse at 50% 20%, rgba(212,175,55,.1), transparent 70%), ' +
              'repeating-linear-gradient(90deg, #1a1a1e 0 2px, #111116 2px 60px), #141418',
            border: `2px solid ${casino.secondary}40`,
            borderRadius: 14,
            padding: 20,
          }}>
            <div style={{ fontSize: 11, color: casino.secondary, letterSpacing: 3, textAlign: 'center', marginBottom: 18 }}>
              • • •  SHOWROOM VÉHICULES  • • •
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {VEHICLES.map(v => {
                const hasIt = ownedVeh.includes(v.id);
                const effectivePrice = applyEventDiscount(v.price, v, 'vehicle');
                const discounted = effectivePrice < v.price;
                const canAfford = balance >= effectivePrice;
                const isEquipped = equippedVeh === v.id;
                return (
                  <div key={v.id} style={{
                    background: 'linear-gradient(180deg, #1a1a20, #0d0d12)',
                    border: `1px solid ${isEquipped ? casino.secondary : (discounted ? '#1aa34a' : '#2a2a34')}`,
                    borderRadius: 12, padding: 16, textAlign: 'center',
                    boxShadow: isEquipped ? `0 0 20px ${casino.secondary}55` : '0 6px 18px rgba(0,0,0,.55)',
                    position: 'relative',
                  }} data-testid={`shop-vehicle-${v.id}`}>
                    {discounted && !hasIt && (
                      <div style={{
                        position: 'absolute', top: -10, right: -10,
                        background: 'linear-gradient(135deg, #1aa3d4, #0a6aa8)',
                        border: '2px solid #ffd700', borderRadius: 999,
                        padding: '4px 10px', fontSize: 10, fontWeight: 900, letterSpacing: 1,
                        color: '#fff', boxShadow: '0 4px 12px rgba(26,163,212,0.6)',
                        transform: 'rotate(8deg)',
                      }}>-30%</div>
                    )}
                    {/* Spotlit pedestal */}
                    <div style={{
                      background: 'radial-gradient(ellipse at 50% 90%, rgba(255,240,200,.22), transparent 70%)',
                      padding: '14px 6px 6px', borderRadius: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 100,
                    }}>
                      <VehicleGraphic id={v.id} />
                    </div>
                    <div style={{
                      height: 8,
                      background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,.45), transparent 70%)',
                      marginBottom: 6,
                    }}/>
                    <div style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{v.name}</div>
                    <div style={{ color: '#cca366', fontSize: 11, fontStyle: 'italic', margin: '4px 0' }}>{v.desc}</div>
                    <div style={{ color: casino.secondary, fontSize: 12, marginBottom: 10 }}>
                      Vitesse ×{v.speedMul}
                    </div>
                    {hasIt ? (
                      <button onClick={() => onEquipVehicle(isEquipped ? null : v.id)}
                        data-testid={`shop-equip-vehicle-${v.id}`}
                        style={{
                          padding: '10px 16px', width: '100%',
                          background: isEquipped ? 'linear-gradient(135deg, #00ff88, #00aa44)' : 'rgba(255,255,255,0.08)',
                          color: isEquipped ? '#000' : '#fff',
                          border: `1px solid ${casino.secondary}`, borderRadius: 8,
                          cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold',
                        }}>
                        {isEquipped ? '✓ ÉQUIPÉ' : 'Équiper'}
                      </button>
                    ) : (
                      <button onClick={() => onBuyVehicle({ ...v, price: effectivePrice })} disabled={!canAfford}
                        data-testid={`shop-buy-vehicle-${v.id}`}
                        style={{
                          padding: '10px 16px', width: '100%',
                          background: canAfford ? `linear-gradient(135deg, ${casino.primary}, ${casino.accent})` : '#444',
                          color: '#fff', border: 'none', borderRadius: 8,
                          cursor: canAfford ? 'pointer' : 'not-allowed',
                          fontFamily: 'inherit', fontWeight: 'bold',
                        }}>
                        {canAfford
                          ? (discounted
                              ? <>{fmt(effectivePrice)} $ <span style={{ textDecoration: 'line-through', opacity: 0.6, marginLeft: 4, fontSize: 10 }}>{fmt(v.price)}</span></>
                              : `${fmt(effectivePrice)} $`)
                          : 'TROP CHER'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ textAlign: 'center', fontSize: 11, color: '#888', marginTop: 14, fontStyle: 'italic' }}>
              Marche = 1× • Skateboard = 2× • Vélo Turbo GambleLife = 3×
            </div>
          </div>
        )}

        {tab === 'hair'   && renderCosmetics(HAIR_CATALOG,   ownedHair,   'hair',   'coiffures', profile.hair)}
        {tab === 'outfit' && renderCosmetics(OUTFIT_CATALOG, ownedOutfit, 'outfit', 'vêtements', profile.outfit)}
        {tab === 'shoes'  && renderCosmetics(SHOES_CATALOG,  ownedShoes,  'shoes',  'chaussures', profile.shoes)}

        <button onClick={onClose} style={{
          width: '100%', marginTop: 16, padding: 12,
          background: 'transparent', border: `1px solid ${casino.secondary}`,
          color: casino.secondary, borderRadius: 8,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>Fermer</button>
      </div>
    </div>
  );
};


export default Shop;
