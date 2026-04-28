import React, { useState, useEffect, useRef } from 'react';
import { fmt, handValue, createDeck, RED_NUMBERS, ROULETTE_NUMBERS, WHEEL_PRIZES, WEAPONS, VEHICLES, HAIR_CATALOG, OUTFIT_CATALOG, SHOES_CATALOG, TROPHIES, CASINOS, DEALER_PROFILES, CASINO_3D_COLORS, BENZBET_MATCHES, generateMatches, BENZBET_KEY, getColor, bjValue, sportBtnStyle, FOUR_HOURS, POKER_HAND_NAMES, evaluatePokerHand, evaluateHand5, compareTB } from '@/game/constants';
import { Card, Chip, ChipStack, GameHeader, btnStyle, menuBtnStyle, StatCard, ArrowButton, Dealer, WeaponIcon, FlyingProjectile, pokerBtnStyle, numStyle, choiceBtn, VehicleGraphic, WeaponMenu } from '@/game/ui';
import { StakeShell, RoundBtn } from '@/game/stake/StakeUI';
import { STAKE } from '@/game/stake/theme';
import sfx from '@/game/sfx';

// ============== JEU POKER TEXAS HOLD'EM ==============
const PokerGame = ({ balance, setBalance, minBet, onExit, casino, dealerProfile, weapons, chooseWeapon, dealerDead, dealerShot, onKillDealer, onOpenMulti }) => {
  const [phase, setPhase] = useState('bet'); // bet | preflop | flop | turn | river | showdown
  const [deck, setDeck] = useState([]);
  const [playerCards, setPlayerCards] = useState([]);
  const [dealerCards, setDealerCards] = useState([]);
  const [board, setBoard] = useState([]);
  const [ante, setAnte] = useState(minBet);
  const [multiplier, setMultiplier] = useState(1); // 1, 2, 3, 4 selon les mises
  const [message, setMessage] = useState('');
  const [showDealerCards, setShowDealerCards] = useState(false);
  const [result, setResult] = useState(null); // win, lose, tie
  const [playerHand, setPlayerHand] = useState(null);
  const [dealerHand, setDealerHand] = useState(null);
  const [showWeaponMenu, setShowWeaponMenu] = useState(false);

  const newHand = () => {
    if (ante > balance || ante < minBet) {
      setMessage(`Mise minimum : ${fmt(minBet)} $`);
      return;
    }
    setBalance(b => b - ante);
    const d = createDeck();
    setPlayerCards([d[0], d[1]]);
    setDealerCards([d[2], d[3]]);
    setBoard([]);
    setDeck(d.slice(4));
    setMultiplier(1);
    setPhase('preflop');
    setShowDealerCards(false);
    setResult(null);
    setPlayerHand(null);
    setDealerHand(null);
    setMessage('Tes cartes ! Tu peux voir le flop ou passer ton tour.');
    try {
      sfx.play('chip');
      [0, 150, 300, 450].forEach((d) => setTimeout(() => sfx.play('card'), d));
    } catch (_e) { /* noop */ }
  };

  const viewFlop = (mul) => {
    // Miser x2, x3 ou x4 pour voir le flop
    const extraCost = ante * (mul - 1);
    if (extraCost > balance) {
      setMessage(`Solde insuffisant pour miser ×${mul}`);
      return;
    }
    if (extraCost > 0) setBalance(b => b - extraCost);
    setMultiplier(mul);
    // Révéler le flop (brûler 1 carte puis 3)
    const flop = [deck[1], deck[2], deck[3]];
    setBoard(flop);
    setDeck(deck.slice(4));
    setPhase('flop');
    setMessage(`Mise ×${mul}. À toi : voir la Turn ou te coucher ?`);
    try { [0, 150, 300].forEach((d) => setTimeout(() => sfx.play('card'), d)); } catch (_e) { /* noop */ }
  };

  const fold = () => {
    setMessage(`Tu te couches. Perte : ${fmt(ante * multiplier)} $`);
    setResult('fold');
    setPhase('showdown');
    setShowDealerCards(true);
  };

  const callTurn = () => {
    // Pour voir la turn, on ajoute 1× de plus (facultatif : on peut ajouter une mise)
    // Ici simple : on continue sans ajouter
    const turn = deck[1];
    setBoard([...board, turn]);
    setDeck(deck.slice(2));
    setPhase('turn');
    setMessage('Turn révélée. Tu peux voir la River, doubler (×2) pour la River, ou te coucher.');
    try { sfx.play('card'); } catch (_e) { /* noop */ }
  };

  const doubleTurn = () => {
    // Double la mise au Turn → paie ante*multiplier, multiplier *= 2, révèle River et showdown
    const extraCost = ante * multiplier;
    if (extraCost > balance) {
      setMessage(`❌ Solde insuffisant pour doubler (besoin ${fmt(extraCost)} $)`);
      return;
    }
    setBalance(b => b - extraCost);
    const newMul = multiplier * 2;
    setMultiplier(newMul);
    // Révéler la river
    const river = deck[1];
    setBoard([...board, river]);
    setDeck(deck.slice(2));
    setPhase('river');
    setMessage(`💪 Mise doublée → ×${newMul}. River révélée !`);
    try { sfx.play('chip'); } catch (_e) { /* noop */ }
    // Puis showdown après un court délai
    setTimeout(() => showdown([...board, river]), 1000);
  };

  const skipToRiver = () => {
    // Option simple : continuer sans doubler (garde le multiplicateur actuel)
    const river = deck[1];
    setBoard([...board, river]);
    setDeck(deck.slice(2));
    setPhase('river');
    setTimeout(() => showdown([...board, river]), 800);
  };

  const showdown = (finalBoard) => {
    const playerBest = evaluatePokerHand([...playerCards, ...finalBoard]);
    const dealerBest = evaluatePokerHand([...dealerCards, ...finalBoard]);
    setPlayerHand(playerBest);
    setDealerHand(dealerBest);
    setShowDealerCards(true);
    setPhase('showdown');

    let cmp = playerBest.rank - dealerBest.rank;
    if (cmp === 0) cmp = compareTB(playerBest.tiebreaker, dealerBest.tiebreaker);

    const totalMise = ante * multiplier;
    if (cmp > 0) {
      const win = totalMise * 2; // on récupère mise + on gagne équivalent
      setBalance(b => b + win);
      setResult('win');
      setMessage(`🎉 Tu gagnes ${fmt(win)} $ avec ${playerBest.rankName} !`);
    } else if (cmp < 0) {
      setResult('lose');
      setMessage(`❌ Perdu : ${dealerBest.rankName} du croupier bat ta ${playerBest.rankName}`);
    } else {
      setBalance(b => b + totalMise); // récup mise
      setResult('tie');
      setMessage(`Égalité : ${playerBest.rankName} de part et d'autre. Mise rendue.`);
    }
  };

  return (
    <StakeShell
      title="POKER TEXAS HOLD'EM"
      balance={balance}
      totalBet={ante * (multiplier || 1)}
      minBet={minBet}
      onExit={onExit}
      onMenu={onExit}
    >
      {/* Table */}
      <div style={{
        flex: 1, padding: 20,
        background: 'radial-gradient(ellipse at center, rgba(15,42,66,0.8) 0%, rgba(5,20,32,0.95) 70%, rgba(2,10,18,1) 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'space-between',
        overflowY: 'auto', minHeight: '70vh',
        borderRadius: '50% 50% 20px 20px / 35% 35% 20px 20px',
        border: `3px solid ${STAKE.gold}`,
        margin: 12,
        boxShadow: `0 0 30px rgba(212,175,55,0.15), inset 0 0 60px rgba(0,0,0,0.55)`,
      }}>
        {/* Croupier en haut */}
        <div style={{ marginBottom: 10 }}>
          <Dealer profile={dealerProfile || DEALER_PROFILES[0]} splats={[]} dead={dealerDead} shot={dealerShot} bloodStreams={[]} />
        </div>

        {/* Cartes du croupier */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, justifyContent: 'center', flexWrap: 'wrap', maxWidth: '100%' }}>
          {dealerCards.map((c, i) => (
            <Card key={i} card={c} hidden={!showDealerCards} delay={i * 0.2} small />
          ))}
          {dealerCards.length === 0 && (
            <>
              <Card card={null} hidden small />
              <Card card={null} hidden small />
            </>
          )}
        </div>
        {showDealerCards && dealerHand && (
          <div style={{ color: '#ffd700', fontSize: 14, marginBottom: 16, fontStyle: 'italic' }}>
            Croupier : {dealerHand.rankName}
          </div>
        )}

        {/* Board (cartes communes) */}
        <div style={{
          padding: 16, background: 'rgba(0,0,0,0.35)', borderRadius: 12,
          border: `2px dashed ${casino.secondary}`,
          marginBottom: 16, minWidth: 300,
        }}>
          <div style={{ color: '#cca366', fontSize: 11, textAlign: 'center', marginBottom: 8 }}>
            TABLE COMMUNE
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
            {board.map((c, i) => (
              <Card key={i} card={c} delay={i * 0.15} small />
            ))}
            {[...Array(5 - board.length)].map((_, i) => (
              <div key={i} style={{
                width: 'clamp(48px, 14vw, 68px)',
                height: 'clamp(70px, 20vw, 98px)',
                border: '2px dashed #555', borderRadius: 6,
                opacity: 0.3,
              }} />
            ))}
          </div>
        </div>

        {/* Cartes du joueur */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          {playerCards.map((c, i) => (
            <Card key={i} card={c} delay={i * 0.2} />
          ))}
          {playerCards.length === 0 && (
            <>
              <div style={{
                width: 'clamp(78px, 22vw, 100px)',
                height: 'clamp(110px, 32vw, 140px)',
                border: '2px dashed #555', borderRadius: 8, opacity: 0.3,
              }} />
              <div style={{
                width: 'clamp(78px, 22vw, 100px)',
                height: 'clamp(110px, 32vw, 140px)',
                border: '2px dashed #555', borderRadius: 8, opacity: 0.3,
              }} />
            </>
          )}
        </div>
        {playerHand && (
          <div style={{ color: '#00ff88', fontSize: 14, marginBottom: 16, fontWeight: 'bold' }}>
            Toi : {playerHand.rankName}
          </div>
        )}

        {/* Info mise */}
        {multiplier > 1 && phase !== 'bet' && (
          <div style={{ color: '#ffd700', fontSize: 13, marginBottom: 8 }}>
            Mise : {fmt(ante)} × {multiplier} = {fmt(ante * multiplier)} $
          </div>
        )}

        {/* Message */}
        {message && (
          <div style={{
            color: result === 'win' ? '#00ff88' : result === 'lose' || result === 'fold' ? '#ff4444' : '#ffd700',
            fontSize: 14, marginBottom: 12, textAlign: 'center', maxWidth: 400,
          }}>{message}</div>
        )}
      </div>

      {/* HUD bas */}
      <div style={{
        padding: 16, background: 'rgba(0,0,0,0.7)',
        borderTop: `2px solid ${casino.primary}`,
      }}>
        {phase === 'bet' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 10 }}>
              <div style={{ color: '#cca366', fontSize: 12, marginBottom: 4 }}>
                Mise de base (min {fmt(minBet)} $)
              </div>
              <input type="number" value={ante} onChange={e => setAnte(+e.target.value || 0)}
                min={minBet} max={balance}
                style={{
                  padding: 8, background: '#000',
                  border: `1px solid ${casino.secondary}`, color: '#fff',
                  borderRadius: 4, fontFamily: 'inherit', fontSize: 16, width: 120, textAlign: 'center',
                }} />
            </div>
            <button onClick={newHand}
              disabled={ante < minBet || ante > balance}
              data-testid="poker-deal-btn"
              style={{
                width: '100%', padding: 14,
                background: (ante >= minBet && ante <= balance)
                  ? `linear-gradient(135deg, ${STAKE.goldDark}, ${STAKE.gold} 50%, ${STAKE.goldLight})` : '#444',
                border: `1px solid ${STAKE.goldDark}`, color: '#111', borderRadius: 8,
                fontSize: 15, fontWeight: 800, cursor: 'pointer',
                fontFamily: 'inherit', letterSpacing: 1.2,
                boxShadow: (ante >= minBet && ante <= balance) ? '0 6px 18px rgba(212,175,55,0.35)' : 'none',
              }}>DISTRIBUER LES CARTES</button>
          </div>
        )}

        {phase === 'preflop' && (
          <div>
            <div style={{ textAlign: 'center', color: '#cca366', fontSize: 12, marginBottom: 10 }}>
              Voir le flop en misant ×2, ×3 ou ×4 ?
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => viewFlop(2)}
                disabled={ante > balance}
                style={pokerBtnStyle(casino)}>×2 ({fmt(ante)} $)</button>
              <button onClick={() => viewFlop(3)}
                disabled={ante * 2 > balance}
                style={pokerBtnStyle(casino)}>×3 ({fmt(ante * 2)} $)</button>
              <button onClick={() => viewFlop(4)}
                disabled={ante * 3 > balance}
                style={pokerBtnStyle(casino)}>×4 ({fmt(ante * 3)} $)</button>
            </div>
            <button onClick={fold} style={{
              width: '100%', marginTop: 8, padding: 10,
              background: 'rgba(180,40,40,0.4)', border: '1px solid #aa3030',
              color: '#ff9999', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
            }}>SE COUCHER</button>
          </div>
        )}

        {phase === 'flop' && (
          <div>
            <div style={{ textAlign: 'center', color: '#cca366', fontSize: 12, marginBottom: 10 }}>
              Voir la Turn ou te coucher ?
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                data-testid="poker-see-turn-btn"
                onClick={callTurn} style={{
                flex: 1, padding: 12,
                background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
                color: '#fff', border: 'none', borderRadius: 6,
                fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit',
              }}>VOIR LA TURN</button>
              <button onClick={fold} style={{
                flex: 1, padding: 12,
                background: 'rgba(180,40,40,0.4)', border: '1px solid #aa3030',
                color: '#ff9999', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold',
              }}>SE COUCHER</button>
            </div>
          </div>
        )}

        {phase === 'turn' && (
          <div>
            <div style={{ textAlign: 'center', color: '#cca366', fontSize: 12, marginBottom: 10 }}>
              Doubler la mise (×2) pour la River ou te coucher ?
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                data-testid="poker-double-btn"
                onClick={doubleTurn}
                disabled={ante * multiplier > balance}
                style={{
                  flex: 1, padding: 12,
                  background: 'linear-gradient(135deg, #ffd700, #b8860b)',
                  color: '#000', border: 'none', borderRadius: 6,
                  fontWeight: 'bold', cursor: ante * multiplier > balance ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', opacity: ante * multiplier > balance ? 0.55 : 1,
                }}>DOUBLER ×2 ({fmt(ante * multiplier)} $)</button>
              <button
                data-testid="poker-see-river-btn"
                onClick={skipToRiver} style={{
                flex: 1, padding: 12,
                background: 'rgba(100,100,100,0.4)',
                border: '1px solid #666', color: '#ccc',
                borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold',
              }}>VOIR RIVER</button>
              <button
                data-testid="poker-fold-turn-btn"
                onClick={fold} style={{
                flex: 1, padding: 12,
                background: 'rgba(180,40,40,0.4)', border: '1px solid #aa3030',
                color: '#ff9999', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold',
              }}>SE COUCHER</button>
            </div>
          </div>
        )}

        {phase === 'showdown' && (
          <div>
            {result === 'lose' && weapons && weapons.length > 0 && !dealerDead && (
              <button onClick={() => setShowWeaponMenu(true)} style={{
                width: '100%', marginBottom: 8, padding: 10,
                background: 'linear-gradient(135deg, #8b0000, #4a0000)',
                color: '#fff', border: 'none', borderRadius: 6,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>⚔️ Défoule-toi sur le croupier</button>
            )}
            <button onClick={() => { setPhase('bet'); setPlayerCards([]); setDealerCards([]); setBoard([]); setPlayerHand(null); setDealerHand(null); setShowDealerCards(false); setMessage(''); setResult(null); }}
              style={{
                width: '100%', padding: 14,
                background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
                color: '#fff', border: 'none', borderRadius: 8,
                fontSize: 16, fontWeight: 'bold', cursor: 'pointer',
                fontFamily: 'inherit', letterSpacing: 1,
              }}>NOUVELLE MAIN</button>
          </div>
        )}
      </div>

      {showWeaponMenu && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600,
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #1a0a0a, #0a0503)',
            border: '2px solid #8b0000', borderRadius: 12, padding: 24,
            maxWidth: 400, width: '90%',
          }}>
            <div style={{ color: '#ff4444', textAlign: 'center', fontSize: 18, marginBottom: 16 }}>
              ⚔️ Choisis ton arme
            </div>
            {weapons.map(w => {
              const def = WEAPONS.find(x => x.id === w);
              return (
                <button key={w} onClick={() => { chooseWeapon(w); setShowWeaponMenu(false); onKillDealer && onKillDealer(); }} style={{
                  width: '100%', padding: 14, marginBottom: 8,
                  background: 'rgba(139,0,0,0.3)', border: '1px solid #8b0000',
                  borderRadius: 8, color: '#fff', cursor: 'pointer',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <WeaponIcon id={w} size={40} />
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontWeight: 'bold' }}>{def.name}</div>
                    <div style={{ fontSize: 11, color: '#cca366' }}>Dégâts : {def.damage}</div>
                  </div>
                </button>
              );
            })}
            <button onClick={() => setShowWeaponMenu(false)} style={{
              width: '100%', marginTop: 8, padding: 10,
              background: 'transparent', border: '1px solid #888',
              color: '#888', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
            }}>Annuler</button>
          </div>
        </div>
      )}
    </StakeShell>
  );
};


export default PokerGame;
