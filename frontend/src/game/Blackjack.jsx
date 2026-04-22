import React, { useState, useEffect, useRef } from 'react';
import { fmt, handValue, createDeck, RED_NUMBERS, ROULETTE_NUMBERS, WHEEL_PRIZES, WEAPONS, VEHICLES, HAIR_CATALOG, OUTFIT_CATALOG, SHOES_CATALOG, TROPHIES, CASINOS, DEALER_PROFILES, CASINO_3D_COLORS, BENZBET_MATCHES, generateMatches, BENZBET_KEY, getColor, bjValue, sportBtnStyle, FOUR_HOURS, POKER_HAND_NAMES, evaluatePokerHand, evaluateHand5, compareTB } from '@/game/constants';
import { Card, Chip, ChipStack, GameHeader, btnStyle, menuBtnStyle, StatCard, ArrowButton, Dealer, WeaponIcon, FlyingProjectile, pokerBtnStyle, numStyle, choiceBtn, VehicleGraphic, WeaponMenu } from '@/game/ui';

// ============== BLACKJACK AMÉLIORÉ ==============
const BlackjackGame = ({ balance, setBalance, minBet, onExit, casino, chooseWeapon, dealerProfile, dealerSplats, flyingProjectile, bloodStreams, dealerDead, dealerShot, onKillDealer, onProjectile, weapons }) => {
  const [deck, setDeck] = useState(createDeck());
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [chipBets, setChipBets] = useState({}); // { 25: 2, 100: 1 }
  const [phase, setPhase] = useState('bet'); // bet | player | dealer | result
  const [message, setMessage] = useState('');
  const [messageColor, setMessageColor] = useState('#ffd700');
  const [canDouble, setCanDouble] = useState(false);
  const [showWeaponMenu, setShowWeaponMenu] = useState(false);
  // Split state
  const [splitHands, setSplitHands] = useState(null); // if not null: array of hands
  const [activeHand, setActiveHand] = useState(0);
  const [splitBets, setSplitBets] = useState([0, 0]);

  const maxBet = Math.min(balance, minBet * 1000);
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

  const clearBet = () => setChipBets({});

  const drawCard = (d) => {
    if (d.length === 0) d = createDeck();
    const newDeck = [...d];
    const card = newDeck.pop();
    return { card, deck: newDeck };
  };

  const startRound = () => {
    if (totalBet < minBet) {
      setMessage(`Mise minimum : ${fmt(minBet)} B`);
      setMessageColor('#ff4444');
      return;
    }
    setBalance(balance - totalBet);
    let d = deck.length < 15 ? createDeck() : [...deck];
    const p1 = drawCard(d); d = p1.deck;
    const dl1 = drawCard(d); d = dl1.deck;
    const p2 = drawCard(d); d = p2.deck;
    const dl2 = drawCard(d); d = dl2.deck;

    setPlayerHand([p1.card, p2.card]);
    setDealerHand([dl1.card, dl2.card]);
    setDeck(d);
    setPhase('player');
    setMessage('');
    setCanDouble(balance - totalBet >= totalBet);

    const pv = handValue([p1.card, p2.card]);
    const dv = handValue([dl1.card, dl2.card]);
    const playerBJ = pv === 21;
    const dealerBJ = dv === 21;

    // Traitement immédiat des blackjacks naturels
    if (playerBJ || dealerBJ) {
      setTimeout(() => {
        if (playerBJ && dealerBJ) {
          setBalance((b) => b + totalBet);
          setMessage('Égalité des blackjacks');
          setMessageColor('#ffd700');
        } else if (playerBJ) {
          // Blackjack 3:2 : récupère la mise + 1.5x
          const win = Math.floor(totalBet * 2.5);
          setBalance((b) => b + win);
          setMessage(`BLACKJACK ! +${fmt(Math.floor(totalBet * 1.5))} B`);
          setMessageColor('#00ff88');
        } else {
          // Croupier BJ - perte immédiate
          setMessage(`Blackjack croupier · -${fmt(totalBet)} B`);
          setMessageColor('#ff4444');
        }
        setPhase('result');
      }, 800);
    }
  };

  const hit = () => {
    const { card, deck: newDeck } = drawCard(deck);
    const newHand = [...playerHand, card];
    setPlayerHand(newHand); setDeck(newDeck); setCanDouble(false);
    if (splitHands) {
      // Update the active hand in splitHands array
      const next = [...splitHands];
      next[activeHand] = newHand;
      setSplitHands(next);
    }
    if (handValue(newHand) > 21) {
      // Bust: si split, passer à la main suivante, sinon terminer
      if (splitHands && activeHand === 0) {
        setTimeout(() => switchToSecondHand(), 400);
      } else {
        setMessage(`BUST ! -${fmt(splitHands ? splitBets[activeHand] : totalBet)} B`);
        setMessageColor('#ff4444');
        if (splitHands && activeHand === 1) {
          setTimeout(() => playDealerForSplit(), 500);
        } else {
          setPhase('result');
        }
      }
    } else if (handValue(newHand) === 21) {
      if (splitHands && activeHand === 0) {
        setTimeout(() => switchToSecondHand(), 400);
      } else {
        stand(newHand);
      }
    }
  };

  const switchToSecondHand = () => {
    setActiveHand(1);
    setPlayerHand(splitHands[1]);
    setCanDouble(balance >= splitBets[1]);
    setMessage('Main 2 · à toi');
  };

  const playDealerForSplit = () => {
    // Si les deux mains ont busté, on ne joue pas le croupier
    const h1Bust = handValue(splitHands[0]) > 21;
    const h2Bust = handValue(splitHands[1]) > 21;
    if (h1Bust && h2Bust) {
      setPhase('result');
      setMessage(`Les deux mains bust · -${fmt(splitBets[0] + splitBets[1])} B`);
      setMessageColor('#ff4444');
      return;
    }
    // Faire jouer le croupier
    setPhase('dealer');
    let d = [...deck]; let dh = [...dealerHand];
    setTimeout(() => {
      while (handValue(dh) < 17) {
        const { card, deck: newD } = drawCard(d);
        dh.push(card); d = newD;
      }
      setDealerHand([...dh]); setDeck(d);
      const dv = handValue(dh);
      const dealerBust = dv > 21;
      let total = 0;
      [0, 1].forEach((i) => {
        const pv = handValue(splitHands[i]);
        if (pv > 21) return; // bust, perdu
        if (dealerBust || pv > dv) total += splitBets[i] * 2;
        else if (pv === dv) total += splitBets[i];
      });
      setBalance((b) => b + total);
      setMessage(`Split terminé · Gains: ${fmt(total)} B`);
      setMessageColor(total > splitBets[0] + splitBets[1] ? '#00ff88' : total === splitBets[0] + splitBets[1] ? '#ffd700' : '#ff4444');
      setPhase('result');
    }, 800);
  };

  const stand = (handOverride) => {
    const pHand = handOverride || playerHand;
    // Si split et main 1, passer à la main 2
    if (splitHands && activeHand === 0) {
      const next = [...splitHands];
      next[0] = pHand;
      setSplitHands(next);
      setTimeout(() => switchToSecondHand(), 300);
      return;
    }
    if (splitHands && activeHand === 1) {
      const next = [...splitHands];
      next[1] = pHand;
      setSplitHands(next);
      setTimeout(() => playDealerForSplit(), 300);
      return;
    }
    setPhase('dealer');
    let d = [...deck];
    let dh = [...dealerHand];

    setTimeout(() => {
      while (handValue(dh) < 17) {
        const { card, deck: newD } = drawCard(d);
        dh.push(card); d = newD;
      }
      setDealerHand([...dh]); setDeck(d);

      const pv = handValue(pHand);
      const dv = handValue(dh);

      setTimeout(() => {
        if (dv > 21 || pv > dv) {
          setBalance((b) => b + totalBet * 2);
          setMessage(`GAGNÉ ! +${fmt(totalBet)} B`);
          setMessageColor('#00ff88');
        } else if (pv === dv) {
          setBalance((b) => b + totalBet);
          setMessage('Égalité');
          setMessageColor('#ffd700');
        } else {
          setMessage(`PERDU ! -${fmt(totalBet)} B`);
          setMessageColor('#ff4444');
        }
        setPhase('result');
      }, 500);
    }, 600);
  };

  const doubleDown = () => {
    if (balance < totalBet) return;
    setBalance(balance - totalBet);
    const prev = totalBet;
    setChipBets((prev) => {
      const doubled = {};
      Object.entries(prev).forEach(([k, v]) => { doubled[k] = v * 2; });
      return doubled;
    });
    const { card, deck: newDeck } = drawCard(deck);
    const newHand = [...playerHand, card];
    setPlayerHand(newHand); setDeck(newDeck);
    setTimeout(() => {
      if (handValue(newHand) > 21) {
        setMessage(`BUST ! -${fmt(prev * 2)} B`);
        setMessageColor('#ff4444');
        setPhase('result');
      } else { stand(newHand); }
    }, 400);
  };

  const nextRound = () => {
    setPlayerHand([]); setDealerHand([]);
    setPhase('bet'); setMessage(''); setChipBets({});
    setSplitHands(null); setActiveHand(0); setSplitBets([0, 0]);
  };

  // ============== SPLIT ==============
  const canSplit = () => {
    if (!playerHand || playerHand.length !== 2) return false;
    if (splitHands) return false; // already split
    // Cards must have same value (including 10-J-Q-K all = 10)
    const v1 = playerHand[0].value === 1 ? 1 : Math.min(10, playerHand[0].value);
    const v2 = playerHand[1].value === 1 ? 1 : Math.min(10, playerHand[1].value);
    return v1 === v2 && balance >= totalBet;
  };

  const split = () => {
    if (!canSplit()) return;
    setBalance(balance - totalBet);
    const d = [...deck];
    const r1 = drawCard(d);
    const r2 = drawCard(r1.deck);
    const h1 = [playerHand[0], r1.card];
    const h2 = [playerHand[1], r2.card];
    setSplitHands([h1, h2]);
    setSplitBets([totalBet, totalBet]);
    setPlayerHand(h1);
    setActiveHand(0);
    setDeck(r2.deck);
    setCanDouble(balance - totalBet >= totalBet);
    setMessage('Main 1 · joue d\'abord');
  };

  // Surrender: récupère moitié de la mise et termine la main
  const surrender = () => {
    if (!playerHand || playerHand.length !== 2 || splitHands) return;
    setBalance((b) => b + Math.floor(totalBet / 2));
    setMessage(`Abandon · récupération de ${fmt(Math.floor(totalBet/2))} B`);
    setMessageColor('#ffaa00');
    setPhase('result');
  };

  const lost = phase === 'result' && (message.includes('PERDU') || message.includes('BUST'));
  const canAfford = balance >= minBet || totalBet >= minBet;

  return (
    <div style={{
      minHeight: '100vh', background: casino.bg,
      fontFamily: 'Georgia, serif', color: '#fff', paddingBottom: 40,
    }}>
      <GameHeader casino={casino} isVIP={isVIP} balance={balance} onExit={onExit} title={`BLACKJACK - Min ${fmt(minBet)} B`} />

      <div style={{ padding: 16, maxWidth: 1000, margin: '0 auto' }}>
        {/* Table de blackjack avec vue immersive */}
        <div style={{
          background: `radial-gradient(ellipse at center, #0a4020 0%, #051e0f 70%, #020a06 100%)`,
          border: `4px solid ${casino.primary}`,
          borderRadius: '50% 50% 20px 20px / 40% 40% 20px 20px',
          padding: '30px 20px 20px',
          position: 'relative',
          marginBottom: 20,
          boxShadow: `0 0 40px ${casino.primary}44, inset 0 0 60px rgba(0,0,0,0.8)`,
        }}>
          {/* Logo centre de table */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            fontSize: 70, opacity: 0.08, pointerEvents: 'none',
            color: casino.secondary,
          }}>♠♥♦♣</div>

          {/* Croupier */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10, position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <Dealer profile={dealerProfile} splats={dealerSplats} dead={dealerDead} shot={dealerShot} bloodStreams={bloodStreams} />
              {flyingProjectile && <FlyingProjectile {...flyingProjectile} />}
            </div>
          </div>

          {/* Cartes du croupier */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,215,0,0.3)',
            borderRadius: 10, padding: 12,
            marginBottom: 16,
            minHeight: 110,
          }}>
            <div style={{ color: '#cca366', fontSize: 11, textAlign: 'center', marginBottom: 4 }}>
              CROUPIER {dealerHand.length > 0 && phase !== 'player' && ` - ${handValue(dealerHand)}`}
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
              {dealerHand.map((c, i) => (
                <Card key={c.id} card={c} hidden={phase === 'player' && i === 1} delay={i * 0.2} />
              ))}
            </div>
          </div>

          {/* Zone de mise centrale */}
          <div style={{
            display: 'flex', justifyContent: 'center', marginBottom: 16,
          }}>
            <div style={{
              width: 140, height: 90,
              border: `2px dashed ${casino.secondary}`,
              borderRadius: '50%',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.3)',
              position: 'relative',
            }}>
              <div style={{ fontSize: 10, color: '#cca366' }}>MISE</div>
              <div style={{ fontSize: 20, color: '#ffd700', fontWeight: 'bold' }}>
                {fmt(totalBet)}
              </div>
              {/* Affichage visuel des jetons misés */}
              {totalBet > 0 && (
                <div style={{
                  position: 'absolute', bottom: -25, left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex', gap: 2,
                }}>
                  {Object.entries(chipBets).filter(([_, q]) => q > 0).slice(0, 4).map(([v, q]) => (
                    <div key={v} style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: 'radial-gradient(circle, #ffd700, #b8860b)',
                      border: '1px solid #000', fontSize: 8, color: '#000',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 'bold',
                    }}>{q}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cartes du joueur */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,215,0,0.3)',
            borderRadius: 10, padding: 12,
            minHeight: 110, marginTop: 30,
          }}>
            <div style={{ color: '#cca366', fontSize: 11, textAlign: 'center', marginBottom: 4 }}>
              TA MAIN {playerHand.length > 0 && `- ${handValue(playerHand)}`}
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
              {playerHand.map((c, i) => <Card key={c.id} card={c} delay={i * 0.15} />)}
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            textAlign: 'center', fontSize: 24, fontWeight: 'bold',
            color: messageColor, marginBottom: 16,
            textShadow: `0 0 15px ${messageColor}`,
            animation: 'messagePulse 0.5s ease-out',
          }}>{message}</div>
        )}

        {/* Contrôles selon phase */}
        {phase === 'bet' && (
          <div style={{
            background: 'rgba(0,0,0,0.5)',
            border: `1px solid ${casino.primary}`,
            borderRadius: 10, padding: 16,
          }}>
            <div style={{ textAlign: 'center', color: '#cca366', marginBottom: 12, fontSize: 13 }}>
              Sélectionne tes jetons (min {fmt(minBet)} B)
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
              {chipValues.map(v => (
                <Chip key={v} value={v} onClick={() => addChip(v)} 
                  disabled={totalBet + v > balance} size={58} />
              ))}
            </div>
            <div style={{ textAlign: 'center' }}>
              <button onClick={clearBet} disabled={totalBet === 0}
                style={{...btnStyle('#aa4400', totalBet === 0), marginRight: 8}}>EFFACER</button>
              <button onClick={startRound} disabled={totalBet < minBet}
                style={btnStyle(casino.secondary, totalBet < minBet)}>DISTRIBUER</button>
            </div>
          </div>
        )}

        {phase === 'player' && (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={hit} data-testid="bj-hit" style={btnStyle('#00aa44')}>TIRER</button>
            <button onClick={() => stand()} data-testid="bj-stand" style={btnStyle('#aa4400')}>RESTER</button>
            {canDouble && <button onClick={doubleDown} data-testid="bj-double" style={btnStyle('#aa00aa')}>DOUBLER</button>}
            {canSplit() && <button onClick={split} data-testid="bj-split" style={btnStyle('#0077aa')}>SPLIT</button>}
            {!splitHands && playerHand && playerHand.length === 2 && (
              <button onClick={surrender} data-testid="bj-surrender" style={btnStyle('#666')}>ABANDON</button>
            )}
          </div>
        )}

        {phase === 'result' && (
          <div style={{ textAlign: 'center' }}>
            {lost && !dealerDead && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: '#cca366', fontSize: 12, marginBottom: 8 }}>
                  Frustré ? Défoule-toi sur le croupier :
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
            <button onClick={nextRound} disabled={!canAfford}
              style={btnStyle(casino.secondary, !canAfford)}>
              {!canAfford ? 'FONDS INSUFFISANTS' : 'NOUVELLE PARTIE'}
            </button>
          </div>
        )}

        {showWeaponMenu && (
          <WeaponMenu 
            weapons={weapons} 
            onClose={() => setShowWeaponMenu(false)}
            onUse={(w) => {
              setShowWeaponMenu(false);
              chooseWeapon(w);
            }}
          />
        )}
      </div>
    </div>
  );
};


export default BlackjackGame;
