import React, { useState, useEffect, useRef } from 'react';
import { fmt, handValue, createDeck, RED_NUMBERS, ROULETTE_NUMBERS, WHEEL_PRIZES, WEAPONS, VEHICLES, HAIR_CATALOG, OUTFIT_CATALOG, SHOES_CATALOG, TROPHIES, CASINOS, DEALER_PROFILES, CASINO_3D_COLORS, BENZBET_MATCHES, generateMatches, BENZBET_KEY, getColor, bjValue, sportBtnStyle, FOUR_HOURS, POKER_HAND_NAMES, evaluatePokerHand, evaluateHand5, compareTB } from '@/game/constants';
import { Card, Chip, ChipStack, GameHeader, btnStyle, menuBtnStyle, StatCard, ArrowButton, Dealer, WeaponIcon, FlyingProjectile, pokerBtnStyle, numStyle, choiceBtn, VehicleGraphic, WeaponMenu } from '@/game/ui';

// ============== BENZ BOUTIQUE - armes au mur + véhicules en showroom ==============
const Shop = ({ profile, balance, onBuy, onBuyVehicle, onEquipVehicle, onClose, casino }) => {
  const owned = profile.weapons || [];
  const ownedVeh = profile.vehicles || [];
  const equippedVeh = profile.equippedVehicle || null;
  const [tab, setTab] = useState('weapons');

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
        }}>🏎  BENZ BOUTIQUE  🔫</h2>
        <div style={{ textAlign: 'center', color: '#cca366', marginBottom: 14, fontSize: 12, fontStyle: 'italic' }}>
          Showroom d'exception — Armes de prestige & véhicules de luxe
        </div>
        <div style={{ textAlign: 'center', color: casino.secondary, marginBottom: 16, fontSize: 18 }}>
          Solde : <strong>{fmt(balance)} B</strong>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          {[['weapons','🔫 Armes'],['vehicles','🏎 Véhicules']].map(([k,l]) => (
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
                const canAfford = balance >= w.price;
                return (
                  <div key={w.id} style={{
                    background: 'linear-gradient(180deg, #2a1e12, #14100a)',
                    border: `1px solid ${hasIt ? '#00aa44' : '#4a3820'}`,
                    borderRadius: 10, padding: 12, textAlign: 'center',
                    boxShadow: '0 4px 10px rgba(0,0,0,.6)',
                  }} data-testid={`shop-weapon-${w.id}`}>
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
                      <button onClick={() => onBuy(w)} disabled={!canAfford}
                        data-testid={`shop-buy-weapon-${w.id}`}
                        style={{
                          padding: '8px 14px', width: '100%',
                          background: canAfford ? `linear-gradient(135deg, ${casino.primary}, ${casino.accent})` : '#444',
                          color: '#fff', border: 'none', borderRadius: 6,
                          cursor: canAfford ? 'pointer' : 'not-allowed',
                          fontFamily: 'inherit', fontWeight: 'bold', fontSize: 12,
                        }}>
                        {canAfford ? `${fmt(w.price)} B` : 'TROP CHER'}
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
                const canAfford = balance >= v.price;
                const isEquipped = equippedVeh === v.id;
                return (
                  <div key={v.id} style={{
                    background: 'linear-gradient(180deg, #1a1a20, #0d0d12)',
                    border: `1px solid ${isEquipped ? casino.secondary : '#2a2a34'}`,
                    borderRadius: 12, padding: 16, textAlign: 'center',
                    boxShadow: isEquipped ? `0 0 20px ${casino.secondary}55` : '0 6px 18px rgba(0,0,0,.55)',
                  }} data-testid={`shop-vehicle-${v.id}`}>
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
                      <button onClick={() => onBuyVehicle(v)} disabled={!canAfford}
                        data-testid={`shop-buy-vehicle-${v.id}`}
                        style={{
                          padding: '10px 16px', width: '100%',
                          background: canAfford ? `linear-gradient(135deg, ${casino.primary}, ${casino.accent})` : '#444',
                          color: '#fff', border: 'none', borderRadius: 8,
                          cursor: canAfford ? 'pointer' : 'not-allowed',
                          fontFamily: 'inherit', fontWeight: 'bold',
                        }}>
                        {canAfford ? `${fmt(v.price)} B` : 'TROP CHER'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ textAlign: 'center', fontSize: 11, color: '#888', marginTop: 14, fontStyle: 'italic' }}>
              Marche = 1× • Skateboard = 2× • Vélo Benz Turbo = 3×
            </div>
          </div>
        )}

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
