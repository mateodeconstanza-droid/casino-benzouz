import React, { useEffect, useRef, useState } from 'react';
import { fmt } from '@/game/constants';
// ============== ÉCRAN BAR - BOISSONS ==============
const BarScreen = ({ balance, setBalance, onExit, casino }) => {
  const [phase, setPhase] = useState('menu'); // menu | drinking | throwing | done
  const [selectedDrink, setSelectedDrink] = useState(null);
  const [liquidLevel, setLiquidLevel] = useState(100);
  const [serverHit, setServerHit] = useState(false);
  
  const drinks = [
    { id: 'water', name: 'Eau', price: 25, color: '#a0d8f0', can: '#e8f4f8', liquidColor: '#a0d8f0' },
    { id: 'alcohol', name: 'Bière / Alcool', price: 50, color: '#d4a017', can: '#2a4a1a', liquidColor: '#e8b820' },
    { id: 'redbull', name: 'Red Bull', price: 100, color: '#1a4b8a', can: '#1a4b8a', liquidColor: '#f4d030' },
  ];
  
  const buyDrink = (drink) => {
    if (balance < drink.price) return;
    setBalance(b => b - drink.price);
    setSelectedDrink(drink);
    setPhase('drinking');
    setLiquidLevel(100);
    
    // Animation de boire - 2.5s
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setLiquidLevel(100 - (step * 8));
      if (step >= 12) {
        clearInterval(interval);
        setPhase('throwing');
        // Lancer canette - arrive à 1.5s
        setTimeout(() => {
          setServerHit(true);
          setTimeout(() => setPhase('done'), 2500);
        }, 1500);
      }
    }, 200);
  };
  
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: `linear-gradient(180deg, ${casino.bg.includes('gradient') ? '#1a0a0a' : '#1a0a0a'} 0%, #0a0503 100%)`,
      fontFamily: 'Georgia, serif', color: '#fff',
      zIndex: 1000, display: 'flex', flexDirection: 'column',
    }}>
      {/* Bouton SORTIR PERMANENT */}
      <button onClick={onExit} style={{
        position: 'absolute', top: 20, right: 20, zIndex: 100,
        padding: '10px 20px',
        background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
        color: '#fff', border: '2px solid ' + casino.secondary,
        borderRadius: 8, cursor: 'pointer',
        fontFamily: 'inherit', fontWeight: 'bold', fontSize: 14,
        boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
      }}>← Sortir</button>
      
      {/* Mur du bar */}
      <div style={{
        flex: 1, position: 'relative',
        background: `linear-gradient(180deg, #2a1a0a 0%, #1a0f05 40%, #0f0803 100%)`,
        overflow: 'hidden',
      }}>
        {/* Étagères avec bouteilles */}
        <div style={{
          position: 'absolute', top: 60, left: 40, right: 40, height: 120,
          background: 'linear-gradient(180deg, #3a2010, #2a1608)',
          border: '2px solid #8b6914',
          borderRadius: 4,
          display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end',
          padding: 8,
        }}>
          {[...Array(12)].map((_, i) => {
            const colors = ['#8b4513', '#d4af37', '#2a4a1a', '#7a0a0a', '#1a4b8a', '#e8a020'];
            return (
              <div key={i} style={{
                width: 16, height: 80 + (i % 3) * 10,
                background: `linear-gradient(90deg, ${colors[i % 6]}, ${colors[(i+1) % 6]})`,
                borderRadius: '50% 50% 10% 10% / 20% 20% 10% 10%',
                border: '1px solid #000',
                boxShadow: '0 2px 4px rgba(0,0,0,0.6)',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)',
                  width: 6, height: 12, background: '#000', borderRadius: 2,
                }} />
              </div>
            );
          })}
        </div>
        
        {/* Serveur */}
        <div style={{
          position: 'absolute', top: 180, left: '50%',
          transform: `translateX(-50%) ${serverHit ? 'rotate(-20deg) translateY(20px)' : ''}`,
          transition: 'transform 0.5s',
          width: 140, height: 200,
        }}>
          <svg viewBox="0 0 140 200" style={{ width: '100%', height: '100%' }}>
            {/* Corps */}
            <rect x="45" y="90" width="50" height="80" fill="#1a1a2e" rx="4" />
            <rect x="50" y="95" width="40" height="50" fill="#fff" />
            {/* Noeud papillon */}
            <path d="M 60 100 L 80 100 L 78 108 L 82 112 L 58 112 L 62 108 Z" fill="#8b0000" />
            {/* Tête */}
            <ellipse cx="70" cy="70" rx="22" ry="26" fill="#e8b896" />
            <path d="M 48 60 Q 50 42 70 40 Q 90 42 92 60 L 88 50 Q 70 45 52 50 Z" fill="#2a1810" />
            {/* Yeux */}
            <ellipse cx="62" cy="70" rx="3" ry="2" fill="#fff" />
            <ellipse cx="78" cy="70" rx="3" ry="2" fill="#fff" />
            <circle cx={serverHit ? 60 : 62} cy="70" r="1.5" fill="#000" />
            <circle cx={serverHit ? 76 : 78} cy="70" r="1.5" fill="#000" />
            {serverHit && (
              <>
                <line x1="57" y1="66" x2="67" y2="74" stroke="#000" strokeWidth="1.5" />
                <line x1="67" y1="66" x2="57" y2="74" stroke="#000" strokeWidth="1.5" />
                <line x1="73" y1="66" x2="83" y2="74" stroke="#000" strokeWidth="1.5" />
                <line x1="83" y1="66" x2="73" y2="74" stroke="#000" strokeWidth="1.5" />
              </>
            )}
            {/* Bouche */}
            {serverHit ? (
              <ellipse cx="70" cy="84" rx="5" ry="3" fill="#2a0000" />
            ) : (
              <path d="M 65 82 Q 70 85 75 82" stroke="#333" strokeWidth="1.5" fill="none" />
            )}
            {/* Bras */}
            <rect x="30" y="95" width="15" height="50" fill="#1a1a2e" rx="2" />
            <rect x="95" y="95" width="15" height="50" fill="#1a1a2e" rx="2" />
            
            {/* Bosse si frappé */}
            {serverHit && (
              <circle cx="55" cy="55" r="6" fill="#8b0000" />
            )}
          </svg>
          <div style={{
            textAlign: 'center', color: '#ffd700', fontSize: 12, fontStyle: 'italic',
            textShadow: '1px 1px 2px #000', marginTop: -5,
          }}>~ Fabio le barman ~</div>
        </div>
        
        {/* Comptoir */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
          background: 'linear-gradient(180deg, #4a2a10 0%, #2a1808 100%)',
          borderTop: '4px solid #ffd700',
          boxShadow: '0 -10px 20px rgba(0,0,0,0.6)',
        }}>
          <div style={{
            position: 'absolute', top: 8, left: '10%', right: '10%', height: 4,
            background: 'linear-gradient(90deg, transparent, #ffd700, transparent)',
          }} />
        </div>
        
        {/* Canette en animation (boisson) */}
        {phase === 'drinking' && selectedDrink && (
          <div style={{
            position: 'absolute', bottom: 100, left: '50%',
            transform: 'translateX(-50%) rotate(-30deg)',
            animation: 'drinkPose 2.5s ease-in-out',
          }}>
            <svg viewBox="0 0 60 140" width="80" height="180">
              {/* Canette */}
              <rect x="15" y="20" width="30" height="100" fill={selectedDrink.can} stroke="#333" strokeWidth="1" rx="2" />
              <rect x="15" y="20" width="30" height="8" fill="#888" />
              <ellipse cx="30" cy="20" rx="15" ry="4" fill="#aaa" />
              <ellipse cx="30" cy="25" rx="15" ry="4" fill={selectedDrink.can} />
              <circle cx="26" cy="24" r="1.5" fill="#666" />
              {/* Étiquette */}
              <rect x="18" y="45" width="24" height="40" fill="rgba(255,255,255,0.2)" />
              <text x="30" y="67" fill="#fff" fontSize="6" fontWeight="bold" textAnchor="middle">
                {selectedDrink.name.split(' ')[0]}
              </text>
              {/* Niveau de liquide (vu par transparence) */}
              <rect x="16" y={28 + (100 - liquidLevel) * 0.9} width="28" height={liquidLevel * 0.9} 
                fill={selectedDrink.liquidColor} opacity="0.6" />
              {/* Liquide qui sort */}
              {liquidLevel < 90 && (
                <>
                  <path d={`M 30 22 Q 25 -10 15 -40`} stroke={selectedDrink.liquidColor} strokeWidth="3" fill="none" />
                  <circle cx="20" cy="-30" r="3" fill={selectedDrink.liquidColor} />
                  <circle cx="17" cy="-20" r="2" fill={selectedDrink.liquidColor} />
                  <circle cx="22" cy="-10" r="2.5" fill={selectedDrink.liquidColor} />
                </>
              )}
            </svg>
          </div>
        )}
        
        {/* Canette qui vole vers le serveur */}
        {phase === 'throwing' && selectedDrink && !serverHit && (
          <div style={{
            position: 'absolute', bottom: 60, left: '50%',
            animation: 'canThrow 1.5s ease-in forwards',
          }}>
            <svg viewBox="0 0 30 100" width="30" height="80">
              <rect x="2" y="5" width="26" height="85" fill={selectedDrink.can} stroke="#333" strokeWidth="1" rx="2" />
              <rect x="2" y="5" width="26" height="5" fill="#888" />
            </svg>
          </div>
        )}
        
        {/* Canette bosselée sur le sol après impact */}
        {phase === 'done' && selectedDrink && (
          <div style={{
            position: 'absolute', top: 300, left: '50%', transform: 'translateX(-20px) rotate(70deg)',
          }}>
            <svg viewBox="0 0 30 100" width="30" height="70">
              <path d="M 2 5 L 28 5 L 28 90 Q 15 95 2 90 Z" fill={selectedDrink.can} stroke="#333" strokeWidth="1" />
              <rect x="2" y="5" width="26" height="5" fill="#888" />
              <path d="M 10 40 Q 15 35 20 42" stroke="#000" strokeWidth="1" fill="none" />
            </svg>
          </div>
        )}
      </div>
      
      {/* HUD */}
      <div style={{
        padding: 16, background: 'rgba(0,0,0,0.85)',
        borderTop: `2px solid ${casino.primary}`,
      }}>
        {phase === 'menu' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ color: casino.secondary, fontSize: 20, letterSpacing: 2, marginBottom: 4 }}>
                🍸 LE BAR
              </div>
              <div style={{ color: '#cca366', fontSize: 12, fontStyle: 'italic' }}>
                Solde : {fmt(balance)} B
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {drinks.map(d => (
                <button key={d.id} onClick={() => buyDrink(d)}
                  disabled={balance < d.price}
                  style={{
                    padding: 12, minWidth: 110,
                    background: balance >= d.price ? `linear-gradient(135deg, ${d.color}, ${d.color}88)` : '#444',
                    border: `2px solid ${casino.secondary}`,
                    color: '#fff', borderRadius: 8,
                    cursor: balance >= d.price ? 'pointer' : 'not-allowed',
                    fontFamily: 'inherit', fontSize: 13,
                  }}>
                  <div style={{ fontWeight: 'bold' }}>{d.name}</div>
                  <div style={{ fontSize: 11, opacity: 0.9 }}>{d.price} B</div>
                </button>
              ))}
            </div>
            <button onClick={onExit} style={{
              width: '100%', marginTop: 12, padding: 10,
              background: 'transparent', border: `1px solid ${casino.secondary}`,
              color: casino.secondary, borderRadius: 6,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>Sortir du bar</button>
          </>
        )}
        {phase === 'drinking' && (
          <div style={{ textAlign: 'center', color: '#ffd700', fontSize: 16 }}>
            🍺 Tu bois ta {selectedDrink?.name}... gluglu
          </div>
        )}
        {phase === 'throwing' && (
          <div style={{ textAlign: 'center', color: '#ff6600', fontSize: 16 }}>
            💢 Tu balances la canette sur le serveur !
          </div>
        )}
        {phase === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#ff4444', marginBottom: 8 }}>✓ Serveur assommé !</div>
            <button onClick={onExit} style={{
              padding: '10px 24px',
              background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
              color: '#fff', border: 'none', borderRadius: 8,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>Sortir du bar</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============== ÉCRAN TOILETTES - ANIMATION PIPI ==============
const ToiletScreen = ({ onExit, casino }) => {
  const [phase, setPhase] = useState('start');
  const [drops, setDrops] = useState([]);
  const [streamHeight, setStreamHeight] = useState(0);
  
  useEffect(() => {
    if (phase !== 'peeing') return;
    const id = setInterval(() => {
      setDrops(prev => [...prev, { id: Date.now() + Math.random(), x: Math.random() * 10 - 5 }].slice(-15));
    }, 80);
    // Animation du jet qui grossit
    const streamAnim = setInterval(() => {
      setStreamHeight(h => Math.min(100, h + 5));
    }, 50);
    const end = setTimeout(() => setPhase('done'), 4000);
    return () => { clearInterval(id); clearInterval(streamAnim); clearTimeout(end); };
  }, [phase]);
  
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(180deg, #d4d4d0 0%, #b0b0a8 50%, #888880 100%)',
      fontFamily: 'Georgia, serif', color: '#333',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20,
    }}>
      {/* Mur carrelage */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(0,0,0,0.08) 40px, rgba(0,0,0,0.08) 42px),
          repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,0,0,0.08) 40px, rgba(0,0,0,0.08) 42px)
        `,
      }} />
      
      {/* Bouton SORTIR PERMANENT en haut à droite */}
      <button onClick={onExit} style={{
        position: 'absolute', top: 20, right: 20, zIndex: 100,
        padding: '10px 20px',
        background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
        color: '#fff', border: '2px solid ' + casino.secondary,
        borderRadius: 8, cursor: 'pointer',
        fontFamily: 'inherit', fontWeight: 'bold', fontSize: 14,
        boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
      }}>← Sortir</button>
      
      {/* Urinoir */}
      <div style={{
        position: 'relative', width: 200, height: 300,
        background: 'linear-gradient(180deg, #fff 0%, #e8e8e8 50%, #c0c0c0 100%)',
        borderRadius: '50% 50% 20% 20% / 40% 40% 10% 10%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset -10px -10px 20px rgba(0,0,0,0.15)',
        border: '2px solid #999',
      }}>
        <div style={{
          position: 'absolute', top: 30, left: '50%', transform: 'translateX(-50%)',
          width: 40, height: 10, background: '#888', borderRadius: '50%',
        }} />
        {/* Flaque */}
        <div style={{
          position: 'absolute', bottom: 20, left: '20%', right: '20%',
          height: phase === 'peeing' || phase === 'done' ? 40 : 0,
          background: 'radial-gradient(ellipse, #f0d040aa, #b09020aa)',
          borderRadius: '50%',
          transition: 'height 4s linear',
          boxShadow: '0 0 10px rgba(240,200,64,0.4)',
        }} />
        
        {/* Jet continu */}
        {phase === 'peeing' && (
          <div style={{
            position: 'absolute', top: 100, left: '50%',
            transform: 'translateX(-50%)',
            width: 6,
            height: streamHeight + '%',
            background: 'linear-gradient(180deg, transparent 0%, #ffef60 30%, #f0d040 100%)',
            borderRadius: 3,
            opacity: 0.9,
          }} />
        )}
        
        {/* Éclaboussures */}
        {phase === 'peeing' && drops.map(d => (
          <div key={d.id} style={{
            position: 'absolute',
            bottom: 40 + Math.random() * 20,
            left: `calc(50% + ${d.x * 3}px)`,
            width: 3, height: 8,
            background: '#f0d040',
            borderRadius: '50%',
            opacity: 0.8,
            boxShadow: '0 0 3px rgba(240,200,64,0.6)',
          }} />
        ))}
      </div>
      
      <div style={{
        marginTop: 30, padding: 16,
        background: 'rgba(0,0,0,0.85)', borderRadius: 10,
        color: '#fff', textAlign: 'center', minWidth: 280,
        zIndex: 10,
      }}>
        {phase === 'start' && (
          <>
            <div style={{ fontSize: 18, marginBottom: 12 }}>🚻 Toilettes</div>
            <button onClick={() => setPhase('peeing')}
              style={{
                padding: '12px 28px',
                background: 'linear-gradient(135deg, #ffd700, #b8860b)',
                color: '#000', border: 'none', borderRadius: 8,
                fontSize: 16, fontWeight: 'bold', cursor: 'pointer',
                fontFamily: 'inherit',
              }}>💧 Faire pipi</button>
          </>
        )}
        {phase === 'peeing' && (
          <div style={{ fontSize: 20, color: '#ffd700' }}>
            💧 En cours... Ahhhh 💧
          </div>
        )}
        {phase === 'done' && (
          <>
            <div style={{ fontSize: 18, color: '#00ff88', marginBottom: 12 }}>✓ Soulagé !</div>
            <button onClick={onExit}
              style={{
                padding: '10px 24px',
                background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
                color: '#fff', border: 'none', borderRadius: 8,
                cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold',
              }}>Retour au casino</button>
          </>
        )}
      </div>
    </div>
  );
};


export { BarScreen, ToiletScreen };
