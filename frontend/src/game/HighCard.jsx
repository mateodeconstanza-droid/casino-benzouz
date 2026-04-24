import React, { useState, useEffect, useRef } from 'react';
import { fmt, handValue, createDeck, RED_NUMBERS, ROULETTE_NUMBERS, WHEEL_PRIZES, WEAPONS, VEHICLES, HAIR_CATALOG, OUTFIT_CATALOG, SHOES_CATALOG, TROPHIES, CASINOS, DEALER_PROFILES, CASINO_3D_COLORS, BENZBET_MATCHES, generateMatches, BENZBET_KEY, getColor, bjValue, sportBtnStyle, FOUR_HOURS, POKER_HAND_NAMES, evaluatePokerHand, evaluateHand5, compareTB } from '@/game/constants';
import { Card, Chip, ChipStack, GameHeader, btnStyle, menuBtnStyle, StatCard, ArrowButton, Dealer, WeaponIcon, FlyingProjectile, pokerBtnStyle, numStyle, choiceBtn, VehicleGraphic, WeaponMenu } from '@/game/ui';

// ============== JEU CARTE HAUTE ==============
const HighCardGame = ({ balance, setBalance, minBet, onExit, casino, chooseWeapon, dealerProfile, dealerSplats, flyingProjectile, bloodStreams, dealerDead, dealerShot, onProjectile, weapons }) => {
  const [playerCard, setPlayerCard] = useState(null);
  const [dealerCard, setDealerCard] = useState(null);
  const [chipBets, setChipBets] = useState({});
  const [betOn, setBetOn] = useState(null); // 'player' | 'dealer'
  const [phase, setPhase] = useState('bet'); // bet | reveal | result
  const [message, setMessage] = useState('');
  const [messageColor, setMessageColor] = useState('#ffd700');
  const [showWeaponMenu, setShowWeaponMenu] = useState(false);

  // Chips pour classique, PLAQUETTES VIP pour les tables VIP
  const chipValues = minBet >= 1000000 ? [100000, 500000, 1000000, 5000000, 10000000]
                   : minBet >= 100000 ? [50000, 100000, 500000, 1000000, 5000000]
                   : minBet >= 30000 ? [10000, 50000, 100000, 500000, 1000000]
                   : minBet >= 5000 ? [5000, 10000, 50000, 100000, 500000]
                   : [5, 10, 25, 100, 500];

  const totalBet = Object.entries(chipBets).reduce((s, [v, q]) => s + parseInt(v) * q, 0);
  const isVIP = minBet >= 5000;

  const addChip = (value) => {
    if (totalBet + value > balance) return;
    setChipBets({ ...chipBets, [value]: (chipBets[value] || 0) + 1 });
  };

  const draw = () => {
    if (!betOn || totalBet < minBet) return;
    
    // Capture la mise AVANT les timers asynchrones
    const betSnapshot = totalBet;
    const betOnSnapshot = betOn;
    
    setBalance(b => b - betSnapshot);
    setPhase('reveal');
    
    const deck = createDeck();
    const pc = deck[0];
    const dc = deck[1];
    
    setTimeout(() => {
      setPlayerCard(pc);
      setTimeout(() => {
        setDealerCard(dc);
        const pv = RANK_VALUE[pc.rank];
        const dv = RANK_VALUE[dc.rank];
        
        setTimeout(() => {
          if (pv === dv) {
            setBalance(b => b + betSnapshot);
            setMessage('Égalité - Mise rendue');
            setMessageColor('#ffd700');
          } else {
            const playerWins = pv > dv;
            const betterWins = (playerWins && betOnSnapshot === 'player') || (!playerWins && betOnSnapshot === 'dealer');
            if (betterWins) {
              setBalance(b => b + betSnapshot * 2);
              setMessage(`GAGNÉ ! +${fmt(betSnapshot)} $`);
              setMessageColor('#00ff88');
            } else {
              setMessage(`PERDU ! -${fmt(betSnapshot)} $`);
              setMessageColor('#ff4444');
            }
          }
          setPhase('result');
        }, 600);
      }, 500);
    }, 600);
  };

  const nextRound = () => {
    setPlayerCard(null); setDealerCard(null);
    setChipBets({}); setBetOn(null);
    setPhase('bet'); setMessage('');
  };

  const lost = phase === 'result' && message.includes('PERDU');

  return (
    <div style={{
      minHeight: '100vh', background: casino.bg,
      fontFamily: 'Georgia, serif', color: '#fff', paddingBottom: 40,
    }}>
      <GameHeader casino={casino} isVIP={isVIP} balance={balance} onExit={onExit}
        title={`CARTE HAUTE - Min ${fmt(minBet)} $`} />

      <div style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
        <div style={{
          background: `radial-gradient(ellipse at center, #0a4020 0%, #051e0f 80%)`,
          border: `3px solid ${casino.primary}`,
          borderRadius: 16, padding: 20, marginBottom: 20,
          boxShadow: `0 0 40px ${casino.primary}44, inset 0 0 40px rgba(0,0,0,0.7)`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20, position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <Dealer profile={dealerProfile} splats={dealerSplats} dead={dealerDead} shot={dealerShot} bloodStreams={bloodStreams} />
              {flyingProjectile && <FlyingProjectile {...flyingProjectile} />}
            </div>
          </div>

          {/* Zone des 2 cartes */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 20, marginBottom: 20,
          }}>
            {/* Carte croupier */}
            <div
              onClick={() => phase === 'bet' && setBetOn('dealer')}
              style={{
                padding: 20,
                background: betOn === 'dealer' ? 'rgba(255,215,0,0.2)' : 'rgba(0,0,0,0.4)',
                border: betOn === 'dealer' ? `3px solid ${casino.secondary}` : '2px solid #444',
                borderRadius: 12,
                textAlign: 'center',
                cursor: phase === 'bet' ? 'pointer' : 'default',
                transition: 'all 0.2s',
              }}>
              <div style={{ color: '#cca366', fontSize: 12, marginBottom: 10, letterSpacing: 1 }}>
                CARTE DU CROUPIER
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', minHeight: 110 }}>
                {dealerCard ? (
                  <Card card={dealerCard} />
                ) : (
                  <div style={{
                    width: 70, height: 100,
                    background: 'linear-gradient(135deg, #8b0000, #4a0000)',
                    borderRadius: 6, border: '2px solid #ffd700',
                    opacity: phase === 'bet' ? 0.5 : 1,
                  }} />
                )}
              </div>
              {phase === 'bet' && (
                <div style={{ color: betOn === 'dealer' ? casino.secondary : '#888', fontSize: 13, marginTop: 10 }}>
                  {betOn === 'dealer' ? '✓ Je parie ici' : 'Cliquer pour parier'}
                </div>
              )}
              {dealerCard && phase === 'result' && (
                <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 8 }}>
                  Valeur : {RANK_VALUE[dealerCard.rank]}
                </div>
              )}
            </div>

            {/* Carte joueur */}
            <div
              onClick={() => phase === 'bet' && setBetOn('player')}
              style={{
                padding: 20,
                background: betOn === 'player' ? 'rgba(255,215,0,0.2)' : 'rgba(0,0,0,0.4)',
                border: betOn === 'player' ? `3px solid ${casino.secondary}` : '2px solid #444',
                borderRadius: 12,
                textAlign: 'center',
                cursor: phase === 'bet' ? 'pointer' : 'default',
                transition: 'all 0.2s',
              }}>
              <div style={{ color: '#cca366', fontSize: 12, marginBottom: 10, letterSpacing: 1 }}>
                TA CARTE
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', minHeight: 110 }}>
                {playerCard ? (
                  <Card card={playerCard} />
                ) : (
                  <div style={{
                    width: 70, height: 100,
                    background: 'linear-gradient(135deg, #8b0000, #4a0000)',
                    borderRadius: 6, border: '2px solid #ffd700',
                    opacity: phase === 'bet' ? 0.5 : 1,
                  }} />
                )}
              </div>
              {phase === 'bet' && (
                <div style={{ color: betOn === 'player' ? casino.secondary : '#888', fontSize: 13, marginTop: 10 }}>
                  {betOn === 'player' ? '✓ Je parie ici' : 'Cliquer pour parier'}
                </div>
              )}
              {playerCard && phase === 'result' && (
                <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 8 }}>
                  Valeur : {RANK_VALUE[playerCard.rank]}
                </div>
              )}
            </div>
          </div>

          <div style={{
            textAlign: 'center', color: '#888', fontSize: 11, fontStyle: 'italic',
          }}>
            La carte la plus haute gagne • Gain 1:1 • Valeurs : A (14) &gt; K (13) &gt; Q (12) &gt; J (11) &gt; 10...2
          </div>
        </div>

        {message && (
          <div style={{
            textAlign: 'center', fontSize: 24, fontWeight: 'bold',
            color: messageColor, marginBottom: 16,
            textShadow: `0 0 15px ${messageColor}`,
            animation: 'messagePulse 0.5s ease-out',
          }}>{message}</div>
        )}

        {phase === 'bet' && (
          <div style={{
            background: 'rgba(0,0,0,0.5)',
            border: `1px solid ${casino.primary}`,
            borderRadius: 10, padding: 16,
          }}>
            <div style={{ textAlign: 'center', color: '#cca366', marginBottom: 12, fontSize: 13 }}>
              {betOn ? `Tu paries sur ${betOn === 'player' ? 'TA carte' : 'LA carte DU CROUPIER'}` : '👆 Choisis une carte à parier'}
              <br/>Min {fmt(minBet)} $ • Mise : {fmt(totalBet)} $
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
              {chipValues.map(v => (
                <Chip key={v} value={v} onClick={() => addChip(v)} 
                  disabled={totalBet + v > balance} size={56} />
              ))}
            </div>
            <div style={{ textAlign: 'center' }}>
              <button onClick={() => setChipBets({})} disabled={totalBet === 0}
                style={{...btnStyle('#aa4400', totalBet === 0), marginRight: 8}}>EFFACER</button>
              <button onClick={draw} disabled={!betOn || totalBet < minBet}
                style={btnStyle(casino.secondary, !betOn || totalBet < minBet)}>
                TIRER LES CARTES
              </button>
            </div>
          </div>
        )}

        {phase === 'result' && (
          <div style={{ textAlign: 'center' }}>
            {lost && !dealerDead && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: '#cca366', fontSize: 12, marginBottom: 8 }}>
                  Défoule-toi :
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button onClick={() => onProjectile('tomato')} style={btnStyle('#c93030')}>🍅 Tomate</button>
                  <button onClick={() => onProjectile('beer')} style={btnStyle('#8b6914')}>🍺 Bière</button>
                  {weapons.length > 0 && (
                    <button onClick={() => setShowWeaponMenu(true)} style={btnStyle('#660000')}>⚔️ Arme</button>
                  )}
                </div>
              </div>
            )}
            <button onClick={nextRound} disabled={balance < minBet}
              style={btnStyle(casino.secondary, balance < minBet)}>
              {balance < minBet ? 'FONDS INSUFFISANTS' : 'NOUVELLE PARTIE'}
            </button>
          </div>
        )}

        {showWeaponMenu && (
          <WeaponMenu weapons={weapons} onClose={() => setShowWeaponMenu(false)}
            onUse={(w) => { setShowWeaponMenu(false); chooseWeapon(w); }} />
        )}
      </div>
    </div>
  );
};



export default HighCardGame;
