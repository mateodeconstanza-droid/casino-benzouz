import React, { useState, useEffect, useRef } from 'react';
import { fmt, handValue, createDeck, RED_NUMBERS, ROULETTE_NUMBERS, WHEEL_PRIZES, WEAPONS, VEHICLES, HAIR_CATALOG, OUTFIT_CATALOG, SHOES_CATALOG, TROPHIES, CASINOS, DEALER_PROFILES, CASINO_3D_COLORS, BENZBET_MATCHES, generateMatches, BENZBET_KEY, getColor, bjValue, sportBtnStyle, FOUR_HOURS, POKER_HAND_NAMES, evaluatePokerHand, evaluateHand5, compareTB } from '@/game/constants';
import { Card, Chip, ChipStack, GameHeader, btnStyle, menuBtnStyle, StatCard, ArrowButton, Dealer, WeaponIcon, FlyingProjectile, pokerBtnStyle, numStyle, choiceBtn, VehicleGraphic, WeaponMenu } from '@/game/ui';
import { StakeShell, ChipRack, RoundBtn, PlacedStack } from '@/game/stake/StakeUI';
import { STAKE } from '@/game/stake/theme';
import Roulette3DWheel from '@/game/Roulette3DWheel';
import sfx from '@/game/sfx';

// ============== ROULETTE AMÉLIORÉE AVEC BILLE ==============
const RouletteGame = ({ balance, setBalance, minBet, onExit, casino, chooseWeapon, dealerProfile, dealerSplats, flyingProjectile, bloodStreams, dealerDead, dealerShot, onProjectile, weapons }) => {
  const [bets, setBets] = useState({});
  const [chipValue, setChipValue] = useState(minBet);
  const [spinning, setSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState(null);
  const [message, setMessage] = useState('');
  const [messageColor, setMessageColor] = useState('#ffd700');
  const [lastResults, setLastResults] = useState([]);
  const [showWeaponMenu, setShowWeaponMenu] = useState(false);
  // Signaux pour la roue 3D
  const [spin3DSignal, setSpin3DSignal] = useState(0);
  const [pendingWinNum, setPendingWinNum] = useState(null);
  const pendingSnapshotRef = useRef(null);

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

    // Snapshot
    const betsSnapshot = { ...bets };
    const totalBetSnapshot = totalBet;

    setSpinning(true);
    setBalance(b => b - totalBetSnapshot);
    setMessage('');
    try { sfx.play('chip'); } catch (_e) { /* noop */ }

    const winNum = ROULETTE_NUMBERS[Math.floor(Math.random() * ROULETTE_NUMBERS.length)];
    pendingSnapshotRef.current = { betsSnapshot, totalBetSnapshot, winNum };
    setPendingWinNum(winNum);
    setSpin3DSignal(s => s + 1);
  };

  // Callback appelé quand la bille se pose dans la poche (par Roulette3DWheel)
  const onBallLanded = React.useCallback(() => {
    const snap = pendingSnapshotRef.current;
    if (!snap) return;
    const { betsSnapshot, totalBetSnapshot, winNum } = snap;
    pendingSnapshotRef.current = null;

    setWinningNumber(winNum);
    setLastResults(prev => [winNum, ...prev].slice(0, 8));

    // Payouts officiels roulette européenne
    let win = 0;
    const color = getColor(winNum);
    const isZero = winNum === 0;
    Object.entries(betsSnapshot).forEach(([key, amount]) => {
      if (key === `num-${winNum}`) { win += amount * 36; return; }
      if (isZero) return;
      if (key === 'red'  && color === 'red')  win += amount * 2;
      else if (key === 'black' && color === 'black') win += amount * 2;
      else if (key === 'even' && winNum % 2 === 0) win += amount * 2;
      else if (key === 'odd'  && winNum % 2 === 1) win += amount * 2;
      else if (key === 'low'  && winNum >= 1  && winNum <= 18) win += amount * 2;
      else if (key === 'high' && winNum >= 19 && winNum <= 36) win += amount * 2;
      else if (key === 'dozen1' && winNum >= 1  && winNum <= 12) win += amount * 3;
      else if (key === 'dozen2' && winNum >= 13 && winNum <= 24) win += amount * 3;
      else if (key === 'dozen3' && winNum >= 25 && winNum <= 36) win += amount * 3;
    });
    if (win > 0) setBalance(b => b + win);
    const net = win - totalBetSnapshot;
    if (net > 0) {
      setMessage(`GAGNÉ ! +${fmt(net)} $ (${winNum} ${color === 'red' ? '🔴' : color === 'black' ? '⚫' : '🟢'})`);
      setMessageColor('#00ff88');
      try { sfx.play('win'); } catch (_e) { /* noop */ }
    } else if (net === 0) {
      setMessage(`Équilibre (${winNum})`);
      setMessageColor('#ffd700');
    } else {
      setMessage(`PERDU ${fmt(-net)} $ (${winNum} ${color === 'red' ? '🔴' : color === 'black' ? '⚫' : '🟢'})`);
      setMessageColor('#ff4444');
      try { sfx.play('lose'); } catch (_e) { /* noop */ }
    }
    setSpinning(false);
    setBets({});
  }, [setBalance]);

  useEffect(() => () => { /* cleanup */ }, []);

  const nextSpin = () => {
    setWinningNumber(null);
    setMessage('');
  };

  const lost = winningNumber !== null && message.includes('PERDU');
  const canBet = winningNumber === null && !spinning;

  const numberGrid = [];
  for (let row = 0; row < 3; row++) {
    const rowNums = [];
    for (let col = 0; col < 12; col++) rowNums.push(3 - row + col * 3);
    numberGrid.push(rowNums);
  }

  return (
    <StakeShell
      title="FIRST PERSON ROULETTE"
      balance={balance}
      totalBet={totalBet}
      minBet={minBet}
      maxBet={50000000}
      onExit={onExit}
      onMenu={onExit}
    >
      <div style={{ padding: 16, maxWidth: 1100, margin: '0 auto' }}>
        {/* Table de jeu */}
        <div style={{
          background: `linear-gradient(180deg, rgba(10,28,45,0.7), rgba(5,15,25,0.85))`,
          border: `2px solid ${STAKE.gold}`,
          borderRadius: 14, padding: 18, marginBottom: 16,
          display: 'flex', gap: 20, alignItems: 'flex-start',
          flexWrap: 'wrap', justifyContent: 'center',
          boxShadow: `0 0 30px rgba(212,175,55,0.15), inset 0 0 30px rgba(0,0,0,0.5)`,
        }}>
          {/* Croupier */}
          <div style={{ position: 'relative' }}>
            <Dealer profile={dealerProfile} splats={dealerSplats} dead={dealerDead} shot={dealerShot} bloodStreams={bloodStreams} />
            {flyingProjectile && <FlyingProjectile {...flyingProjectile} />}
          </div>
          
          {/* Roue de roulette 3D (Three.js) */}
          <div style={{
            position: 'relative',
            borderRadius: 18,
            padding: 10,
            background: 'radial-gradient(ellipse at 50% 40%, rgba(40,20,6,0.85), rgba(10,5,2,0.95))',
            border: `2px solid ${STAKE.goldDark}`,
            boxShadow: '0 10px 24px rgba(0,0,0,0.6), inset 0 0 20px rgba(0,0,0,0.55)',
          }}>
            <Roulette3DWheel
              size={340}
              winNumber={pendingWinNum}
              spinSignal={spin3DSignal}
              onLanded={onBallLanded}
            />
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
          <div
            data-testid="roulette-result"
            style={{
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
              {bets['num-0'] && <PlacedStack amount={bets['num-0']} />}
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
                        {bets[key] && <PlacedStack amount={bets[key]} />}
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
                    {bets[k] && <PlacedStack amount={bets[k]} />}
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
                    {bets[k] && <PlacedStack amount={bets[k]} />}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center', color: '#888', fontSize: 10, marginTop: 6, fontStyle: 'italic' }}>
            Clic : miser • Clic droit : retirer
          </div>
        </div>

        {/* Jetons 3D sélectionneurs */}
        <div style={{
          background: 'rgba(0,0,0,0.35)', borderRadius: 12,
          padding: '10px 12px', marginBottom: 14,
          border: `1px solid rgba(212,175,55,0.2)`,
          display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap',
        }}>
          <ChipRack value={chipValue} setValue={setChipValue} minBet={minBet} vertical={false} />
        </div>

        <div style={{ textAlign: 'center', marginBottom: 14, color: STAKE.inkSoft, fontSize: 12 }}>
          {totalBet < minBet && totalBet > 0 && (
            <span style={{ color: '#ff4444' }}>
              (min {fmt(minBet)} $)
            </span>
          )}
        </div>

        {/* Actions — boutons ronds style Stake */}
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
          {canBet && (
            <>
              <RoundBtn
                testId="roulette-clear-btn"
                label="↶" subLabel="EFFACER"
                onClick={clearBets} disabled={totalBet === 0} color="#cc6a2a" size={70}
              />
              <RoundBtn
                testId="roulette-spin-btn"
                label="⟳" subLabel="TOUR"
                onClick={spin} disabled={totalBet < minBet} color={STAKE.gold} size={92}
              />
            </>
          )}
          {winningNumber !== null && !spinning && (
            <>
              {lost && !dealerDead && (
                <>
                  <RoundBtn label="🍅" subLabel="Tomate" onClick={() => onProjectile('tomato')} color="#c93030" size={64} />
                  <RoundBtn label="🍺" subLabel="Bière" onClick={() => onProjectile('beer')} color="#8b6914" size={64} />
                  {weapons.length > 0 && (
                    <RoundBtn label="⚔️" subLabel="Arme" onClick={() => setShowWeaponMenu(true)} color="#aa1a2a" size={64} />
                  )}
                </>
              )}
              <RoundBtn testId="roulette-new-spin" label="▶" subLabel="NOUVEAU" onClick={nextSpin} color={STAKE.goldLight} size={82} />
            </>
          )}
        </div>

        {showWeaponMenu && (
          <WeaponMenu weapons={weapons} onClose={() => setShowWeaponMenu(false)}
            onUse={(w) => { setShowWeaponMenu(false); chooseWeapon(w); }} />
        )}
      </div>
    </StakeShell>
  );
};


export default RouletteGame;
