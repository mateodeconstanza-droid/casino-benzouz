import React, { useState, useEffect, useRef } from 'react';
import { fmt, handValue, createDeck, RED_NUMBERS, ROULETTE_NUMBERS, WHEEL_PRIZES, WEAPONS, VEHICLES, HAIR_CATALOG, OUTFIT_CATALOG, SHOES_CATALOG, TROPHIES, CASINOS, DEALER_PROFILES, CASINO_3D_COLORS, BENZBET_MATCHES, generateMatches, BENZBET_KEY, getColor, bjValue, sportBtnStyle, FOUR_HOURS, POKER_HAND_NAMES, evaluatePokerHand, evaluateHand5, compareTB } from '@/game/constants';
import { Card, Chip, ChipStack, GameHeader, btnStyle, menuBtnStyle, StatCard, ArrowButton, Dealer, WeaponIcon, FlyingProjectile, pokerBtnStyle, numStyle, choiceBtn, VehicleGraphic, WeaponMenu } from '@/game/ui';

// ============== ROULETTE AMÉLIORÉE AVEC BILLE ==============
const RouletteGame = ({ balance, setBalance, minBet, onExit, casino, chooseWeapon, dealerProfile, dealerSplats, flyingProjectile, bloodStreams, dealerDead, dealerShot, onProjectile, weapons }) => {
  const [bets, setBets] = useState({});
  const [chipValue, setChipValue] = useState(minBet);
  const [spinning, setSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [ballAngle, setBallAngle] = useState(0);
  const [ballRadius, setBallRadius] = useState(150);
  const [ballDropped, setBallDropped] = useState(false);
  const [message, setMessage] = useState('');
  const [messageColor, setMessageColor] = useState('#ffd700');
  const [lastResults, setLastResults] = useState([]);
  const [showWeaponMenu, setShowWeaponMenu] = useState(false);
  const animRef = useRef();

  const chipOptions = minBet >= 1000000 ? [100000, 500000, 1000000, 5000000, 10000000]
                    : minBet >= 100000 ? [50000, 100000, 500000, 1000000, 5000000]
                    : minBet >= 30000 ? [10000, 50000, 100000, 500000, 1000000]
                    : minBet >= 5000 ? [5000, 10000, 50000, 100000, 500000]
                    : [5, 10, 25, 100, 500];

  const totalBet = Object.values(bets).reduce((s, v) => s + v, 0);
  const isVIP = minBet >= 5000;

  const placeBet = (key) => {
    if (balance - totalBet < chipValue) return;
    setBets({ ...bets, [key]: (bets[key] || 0) + chipValue });
  };

  const removeBet = (key, e) => {
    e.stopPropagation();
    const current = bets[key] || 0;
    if (current <= chipValue) {
      const { [key]: _, ...rest } = bets;
      setBets(rest);
    } else {
      setBets({ ...bets, [key]: current - chipValue });
    }
  };

  const clearBets = () => setBets({});

  const spin = () => {
    if (totalBet === 0 || spinning || totalBet < minBet) return;
    
    // Capture SNAPSHOT des valeurs actuelles (évite les closures obsolètes)
    const betsSnapshot = { ...bets };
    const totalBetSnapshot = totalBet;
    
    setSpinning(true);
    setBalance(b => b - totalBetSnapshot);
    setMessage('');
    setBallDropped(false);
    
    const winNum = ROULETTE_NUMBERS[Math.floor(Math.random() * ROULETTE_NUMBERS.length)];
    const idx = ROULETTE_NUMBERS.indexOf(winNum);
    const segmentAngle = 360 / ROULETTE_NUMBERS.length;
    
    // Roue tourne dans un sens, bille dans l'autre
    const wheelSpinTurns = 4 + Math.random() * 2; // 4-6 tours pour la roue
    const wheelTarget = 360 * wheelSpinTurns;
    setWheelRotation(prev => prev + wheelTarget);
    
    // Animation de la bille : au MOINS 6 tours dans le sens inverse
    const ballStart = Date.now();
    const duration = 7000; // 7 secondes pour une bille qui roule vraiment
    const ballTurns = 6 + Math.random() * 2; // 6-8 tours
    // Angle final dans le repère monde : doit pointer le numéro gagnant (vers le haut, -90)
    // Mais comme la roue tourne aussi, on calcule l'angle que la bille doit avoir dans le repère terre
    // quand le numéro aura atteint le haut
    const ballFinalAngle = -90 - (idx * segmentAngle + segmentAngle / 2) + wheelTarget;
    const totalBallRotation = -360 * ballTurns + ballFinalAngle;
    
    const animate = () => {
      const elapsed = Date.now() - ballStart;
      const progress = Math.min(elapsed / duration, 1);
      // Easing plus prononcé - la bille ralentit progressivement
      const eased = 1 - Math.pow(1 - progress, 4);
      
      const currentAngle = totalBallRotation * eased;
      
      // Petits rebonds sur les déflecteurs en fin d'animation
      let bumpOffset = 0;
      if (progress > 0.85) {
        const bumpPhase = (progress - 0.85) / 0.15;
        bumpOffset = Math.sin(bumpPhase * Math.PI * 8) * (1 - bumpPhase) * 2;
      }
      setBallAngle(currentAngle + bumpOffset);
      
      // Rayon: la bille descend en spirale - du bord (180) au numéro (130)
      // Avec de petits soubresauts en fin
      let radius = 180 - (180 - 130) * eased;
      if (progress > 0.85) {
        const bumpPhase = (progress - 0.85) / 0.15;
        radius += Math.sin(bumpPhase * Math.PI * 6) * (1 - bumpPhase) * 4;
      }
      setBallRadius(radius);
      
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setWinningNumber(winNum);
        setLastResults(prev => [winNum, ...prev].slice(0, 8));

        // ============ PAYOUTS ROULETTE EUROPÉENNE (règles réelles) ============
        // Chaque entrée dans `win` inclut la remise de la mise (stake + profit)
        // - Plein (straight up) : 35:1 → retour = mise × 36
        // - Douzaines / colonnes : 2:1 → retour = mise × 3
        // - Chances simples (rouge/noir/pair/impair/manque/passe) : 1:1 → retour = mise × 2
        // - Si le 0 sort : TOUTES les mises extérieures perdent (chances simples, douzaines)
        let win = 0;
        const color = getColor(winNum);
        const isZero = winNum === 0;

        Object.entries(betsSnapshot).forEach(([key, amount]) => {
          // Mise pleine (un numéro précis, y compris le 0) — 35:1
          if (key === `num-${winNum}`) {
            win += amount * 36;
            return;
          }
          // Si 0 sort, toutes les mises suivantes (hors plein) perdent
          if (isZero) return;

          // Chances simples : 1:1 (retour = mise × 2)
          if (key === 'red'  && color === 'red')  win += amount * 2;
          else if (key === 'black' && color === 'black') win += amount * 2;
          else if (key === 'even' && winNum % 2 === 0) win += amount * 2;
          else if (key === 'odd'  && winNum % 2 === 1) win += amount * 2;
          else if (key === 'low'  && winNum >= 1  && winNum <= 18) win += amount * 2;
          else if (key === 'high' && winNum >= 19 && winNum <= 36) win += amount * 2;
          // Douzaines : 2:1 (retour = mise × 3)
          else if (key === 'dozen1' && winNum >= 1  && winNum <= 12) win += amount * 3;
          else if (key === 'dozen2' && winNum >= 13 && winNum <= 24) win += amount * 3;
          else if (key === 'dozen3' && winNum >= 25 && winNum <= 36) win += amount * 3;
        });
        
        if (win > 0) {
          setBalance(b => b + win);
        }
        
        const net = win - totalBetSnapshot;
        if (net > 0) {
          setMessage(`GAGNÉ ! +${fmt(net)} B (${winNum} ${color === 'red' ? '🔴' : color === 'black' ? '⚫' : '🟢'})`);
          setMessageColor('#00ff88');
        } else if (net === 0) {
          setMessage(`Équilibre (${winNum})`);
          setMessageColor('#ffd700');
        } else {
          setMessage(`PERDU ${fmt(-net)} B (${winNum} ${color === 'red' ? '🔴' : color === 'black' ? '⚫' : '🟢'})`);
          setMessageColor('#ff4444');
        }
        setSpinning(false);
        setBets({}); // Clear le stack visuel
      }
    };
    
    animRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const nextSpin = () => {
    setWinningNumber(null); setMessage('');
    setBallRadius(180);
  };

  const lost = winningNumber !== null && message.includes('PERDU');
  const canBet = winningNumber === null && !spinning;

  const numberGrid = [];
  for (let row = 0; row < 3; row++) {
    const rowNums = [];
    for (let col = 0; col < 12; col++) rowNums.push(3 - row + col * 3);
    numberGrid.push(rowNums);
  }

  // Position bille en coordonnées
  const ballX = 160 + ballRadius * Math.cos((ballAngle - 90) * Math.PI / 180);
  const ballY = 160 + ballRadius * Math.sin((ballAngle - 90) * Math.PI / 180);

  return (
    <div style={{
      minHeight: '100vh', background: casino.bg,
      fontFamily: 'Georgia, serif', color: '#fff', paddingBottom: 40,
    }}>
      <GameHeader casino={casino} isVIP={isVIP} balance={balance} onExit={onExit} 
        title={`ROULETTE - Min ${fmt(minBet)} B`} />

      <div style={{ padding: 16, maxWidth: 1100, margin: '0 auto' }}>
        {/* Table de jeu */}
        <div style={{
          background: `radial-gradient(ellipse at center, #0a0510 0%, #050208 80%)`,
          border: `3px solid ${casino.primary}`,
          borderRadius: 16, padding: 20, marginBottom: 16,
          display: 'flex', gap: 20, alignItems: 'flex-start',
          flexWrap: 'wrap', justifyContent: 'center',
          boxShadow: `0 0 40px ${casino.primary}44, inset 0 0 40px rgba(0,0,0,0.7)`,
        }}>
          {/* Croupier */}
          <div style={{ position: 'relative' }}>
            <Dealer profile={dealerProfile} splats={dealerSplats} dead={dealerDead} shot={dealerShot} bloodStreams={bloodStreams} />
            {flyingProjectile && <FlyingProjectile {...flyingProjectile} />}
          </div>
          
          {/* Roue de roulette avec bille */}
          <div style={{ position: 'relative', width: 320, height: 320 }}>
            {/* Base en bois */}
            <div style={{
              position: 'absolute', inset: -15,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #4a2a0a 0%, #1a0f04 80%)',
              boxShadow: '0 15px 30px rgba(0,0,0,0.8)',
            }} />
            
            {/* Marqueur fixe (pointeur) */}
            <div style={{
              position: 'absolute', top: -5, left: '50%',
              transform: 'translateX(-50%)',
              width: 0, height: 0,
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderTop: '18px solid #ffd700',
              zIndex: 20,
            }} />
            
            {/* Cuvette fixe (anneau extérieur avec déflecteurs) */}
            <div style={{
              position: 'absolute', inset: 5,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 50% 30%, #2a1a0a 0%, #0a0502 70%)',
              border: '4px solid #8b6914',
              boxShadow: 'inset 0 0 30px rgba(0,0,0,0.9)',
              zIndex: 2,
            }}>
              {/* Déflecteurs */}
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  top: '50%', left: '50%',
                  width: 12, height: 4,
                  background: '#8b6914',
                  borderRadius: 2,
                  transform: `translate(-50%,-50%) rotate(${i * 45}deg) translateX(125px)`,
                  boxShadow: '0 0 4px rgba(0,0,0,0.8)',
                }} />
              ))}
            </div>
            
            {/* La roue tournante */}
            <div style={{
              position: 'absolute', inset: 30,
              transform: `rotate(${wheelRotation}deg)`,
              transition: spinning ? 'transform 7s cubic-bezier(0.17, 0.67, 0.15, 0.99)' : 'none',
              zIndex: 3,
            }}>
              <svg viewBox="0 0 260 260" style={{ width: '100%', height: '100%' }}>
                <defs>
                  <radialGradient id="wheelInner" cx="50%" cy="50%">
                    <stop offset="0%" stopColor="#ffd700" />
                    <stop offset="50%" stopColor="#b8860b" />
                    <stop offset="100%" stopColor="#4a2a00" />
                  </radialGradient>
                </defs>
                {ROULETTE_NUMBERS.map((n, i) => {
                  const angle = 360 / ROULETTE_NUMBERS.length;
                  const startAngle = i * angle - 90;
                  const endAngle = (i + 1) * angle - 90;
                  const x1 = 130 + 125 * Math.cos((startAngle * Math.PI) / 180);
                  const y1 = 130 + 125 * Math.sin((startAngle * Math.PI) / 180);
                  const x2 = 130 + 125 * Math.cos((endAngle * Math.PI) / 180);
                  const y2 = 130 + 125 * Math.sin((endAngle * Math.PI) / 180);
                  const textAngle = startAngle + angle / 2;
                  const tx = 130 + 105 * Math.cos((textAngle * Math.PI) / 180);
                  const ty = 130 + 105 * Math.sin((textAngle * Math.PI) / 180);
                  const color = getColor(n);
                  const fill = color === 'red' ? '#c00000' : color === 'black' ? '#1a1a1a' : '#0a7a0a';
                  return (
                    <g key={i}>
                      <path
                        d={`M 130 130 L ${x1} ${y1} A 125 125 0 0 1 ${x2} ${y2} Z`}
                        fill={fill} stroke="#ffd700" strokeWidth="1"
                      />
                      <text x={tx} y={ty} fill="white" fontSize="11" fontWeight="bold"
                        textAnchor="middle" dominantBaseline="middle"
                        transform={`rotate(${textAngle + 90} ${tx} ${ty})`}>
                        {n}
                      </text>
                    </g>
                  );
                })}
                <circle cx="130" cy="130" r="35" fill="url(#wheelInner)" stroke="#8b6914" strokeWidth="2" />
                <circle cx="130" cy="130" r="28" fill="#1a1a1a" />
                <circle cx="130" cy="130" r="22" fill="url(#wheelInner)" />
                <circle cx="130" cy="130" r="8" fill="#4a2a00" />
              </svg>
            </div>
            
            {/* Bille */}
            {spinning && (
              <div style={{
                position: 'absolute',
                left: ballX, top: ballY,
                width: 14, height: 14,
                marginLeft: -7, marginTop: -7,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, #fff, #ccc 50%, #888)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.8), inset -2px -2px 3px rgba(0,0,0,0.4)',
                zIndex: 10,
                transition: 'left 0.05s linear, top 0.05s linear',
              }} />
            )}
            
            {/* Bille finale (posée sur le numéro) */}
            {winningNumber !== null && !spinning && (
              <div style={{
                position: 'absolute',
                left: 160 + 130 * Math.cos((ROULETTE_NUMBERS.indexOf(winningNumber) * (360/37) - 90 + wheelRotation) * Math.PI / 180),
                top: 160 + 130 * Math.sin((ROULETTE_NUMBERS.indexOf(winningNumber) * (360/37) - 90 + wheelRotation) * Math.PI / 180),
                width: 14, height: 14,
                marginLeft: -7, marginTop: -7,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, #fff, #ccc 50%, #888)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.8)',
                zIndex: 10,
              }} />
            )}
          </div>

          {/* Derniers résultats */}
          <div style={{ minWidth: 60 }}>
            <div style={{ color: '#cca366', fontSize: 11, marginBottom: 6, textAlign: 'center' }}>
              DERNIERS
            </div>
            {lastResults.slice(0, 7).map((n, i) => {
              const c = getColor(n);
              return (
                <div key={i} style={{
                  width: 30, height: 30,
                  background: c === 'red' ? '#c00' : c === 'black' ? '#1a1a1a' : '#060',
                  color: '#fff', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', fontSize: 12,
                  margin: '3px auto',
                  border: '1px solid ' + casino.secondary,
                  opacity: 1 - i * 0.12,
                }}>{n}</div>
              );
            })}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            textAlign: 'center', fontSize: 22, fontWeight: 'bold',
            color: messageColor, marginBottom: 16,
            textShadow: `0 0 15px ${messageColor}`,
            animation: 'messagePulse 0.5s ease-out',
          }}>{message}</div>
        )}

        {/* Table de mise */}
        <div style={{
          background: 'linear-gradient(180deg, #0a4020 0%, #052010 100%)',
          border: `2px solid ${casino.secondary}`,
          borderRadius: 8, padding: 10, marginBottom: 16,
          overflowX: 'auto',
        }}>
          <div style={{ display: 'flex', gap: 3, minWidth: 680 }}>
            <div
              onClick={() => canBet && placeBet('num-0')}
              onContextMenu={(e) => { e.preventDefault(); removeBet('num-0', e); }}
              style={{
                ...numStyle('#060'), width: 38, height: 120,
                cursor: canBet ? 'pointer' : 'default', position: 'relative',
              }}>
              0
              {bets['num-0'] && <ChipStack amount={bets['num-0']} />}
            </div>
            <div>
              {numberGrid.map((row, ri) => (
                <div key={ri} style={{ display: 'flex', gap: 2, marginBottom: 2 }}>
                  {row.map((n) => {
                    const c = getColor(n);
                    const key = `num-${n}`;
                    return (
                      <div key={n}
                        onClick={() => canBet && placeBet(key)}
                        onContextMenu={(e) => { e.preventDefault(); removeBet(key, e); }}
                        style={{
                          ...numStyle(c === 'red' ? '#c00' : '#1a1a1a'),
                          width: 38, height: 38,
                          cursor: canBet ? 'pointer' : 'default',
                          position: 'relative',
                        }}>
                        {n}
                        {bets[key] && <ChipStack amount={bets[key]} />}
                      </div>
                    );
                  })}
                </div>
              ))}
              <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
                {['dozen1', 'dozen2', 'dozen3'].map((k, i) => (
                  <div key={k}
                    onClick={() => canBet && placeBet(k)}
                    onContextMenu={(e) => { e.preventDefault(); removeBet(k, e); }}
                    style={{
                      ...numStyle('#1a4a1a'),
                      flex: 1, height: 32, fontSize: 12,
                      cursor: canBet ? 'pointer' : 'default', position: 'relative',
                    }}>
                    {['1-12', '13-24', '25-36'][i]}
                    {bets[k] && <ChipStack amount={bets[k]} />}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                {[
                  { k: 'low', l: '1-18' },
                  { k: 'even', l: 'PAIR' },
                  { k: 'red', l: 'ROUGE', color: '#c00' },
                  { k: 'black', l: 'NOIR', color: '#1a1a1a' },
                  { k: 'odd', l: 'IMPAIR' },
                  { k: 'high', l: '19-36' },
                ].map(({ k, l, color }) => (
                  <div key={k}
                    onClick={() => canBet && placeBet(k)}
                    onContextMenu={(e) => { e.preventDefault(); removeBet(k, e); }}
                    style={{
                      ...numStyle(color || '#1a4a1a'),
                      flex: 1, height: 32, fontSize: 11,
                      cursor: canBet ? 'pointer' : 'default', position: 'relative',
                    }}>
                    {l}
                    {bets[k] && <ChipStack amount={bets[k]} />}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center', color: '#888', fontSize: 10, marginTop: 6, fontStyle: 'italic' }}>
            Clic : miser • Clic droit : retirer
          </div>
        </div>

        {/* Jetons */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          {chipOptions.map((v) => (
            <Chip key={v} value={v} onClick={() => setChipValue(v)}
              selected={chipValue === v} disabled={!canBet || v > balance - totalBet} size={56} />
          ))}
        </div>

        <div style={{ textAlign: 'center', marginBottom: 16, color: '#cca366' }}>
          Mise totale : <strong style={{color: casino.secondary}}>{fmt(totalBet)} B</strong>
          {totalBet < minBet && totalBet > 0 && (
            <span style={{ color: '#ff4444', marginLeft: 8, fontSize: 12 }}>
              (min {fmt(minBet)})
            </span>
          )}
        </div>

        {/* Actions */}
        <div style={{ textAlign: 'center' }}>
          {canBet && (
            <>
              <button onClick={clearBets} disabled={totalBet === 0}
                style={{...btnStyle('#aa4400', totalBet === 0), marginRight: 8}}>EFFACER</button>
              <button onClick={spin} disabled={totalBet < minBet}
                style={btnStyle('#00aa44', totalBet < minBet)}>LANCER LA BILLE</button>
            </>
          )}
          {winningNumber !== null && !spinning && (
            <div>
              {lost && !dealerDead && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: '#cca366', fontSize: 12, marginBottom: 8 }}>
                    Défoule-toi sur le croupier :
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => onProjectile('tomato')} style={btnStyle('#c93030')}>🍅 Tomate</button>
                    <button onClick={() => onProjectile('beer')} style={btnStyle('#8b6914')}>🍺 Bière</button>
                    {weapons.length > 0 && (
                      <button onClick={() => setShowWeaponMenu(true)} style={btnStyle('#660000')}>
                        ⚔️ Arme
                      </button>
                    )}
                  </div>
                </div>
              )}
              <button onClick={nextSpin} style={btnStyle(casino.secondary)}>NOUVELLE MISE</button>
            </div>
          )}
        </div>

        {showWeaponMenu && (
          <WeaponMenu weapons={weapons} onClose={() => setShowWeaponMenu(false)}
            onUse={(w) => { setShowWeaponMenu(false); chooseWeapon(w); }} />
        )}
      </div>
    </div>
  );
};


export default RouletteGame;
