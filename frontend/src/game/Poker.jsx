import React, { useState, useEffect, useRef } from 'react';
import { fmt, handValue, createDeck, RED_NUMBERS, ROULETTE_NUMBERS, WHEEL_PRIZES, WEAPONS, VEHICLES, HAIR_CATALOG, OUTFIT_CATALOG, SHOES_CATALOG, TROPHIES, CASINOS, DEALER_PROFILES, CASINO_3D_COLORS, BENZBET_MATCHES, generateMatches, BENZBET_KEY, getColor, bjValue, sportBtnStyle, FOUR_HOURS, POKER_HAND_NAMES, evaluatePokerHand, evaluateHand5, compareTB } from '@/game/constants';
import { Card, Chip, ChipStack, GameHeader, btnStyle, menuBtnStyle, StatCard, ArrowButton, Dealer, WeaponIcon, FlyingProjectile, pokerBtnStyle, numStyle, choiceBtn, VehicleGraphic, WeaponMenu } from '@/game/ui';

// ============== JEU POKER TEXAS HOLD'EM ==============
const PokerGame = ({ balance, setBalance, minBet, onExit, casino, dealerProfile, weapons, chooseWeapon, dealerDead, dealerShot, onKillDealer }) => {
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
      setMessage(`Mise minimum : ${fmt(minBet)} B`);
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
  };

  const fold = () => {
    setMessage(`Tu te couches. Perte : ${fmt(ante * multiplier)} B`);
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
    setMessage('Turn révélée. Tu peux te coucher ou doubler pour voir la River.');
  };

  const doubleTurn = () => {
    const extraCost = ante * multiplier;
    if (extraCost > balance) {
      setMessage('Solde insuffisant pour doubler');
      return;
    }
    setBalance(b => b - extraCost);
    setMultiplier(m => m * 2);
    // Révéler la river
    const river = deck[1];
    setBoard([...board, river]);
    setDeck(deck.slice(2));
    setPhase('river');
    // Puis showdown immédiat
    setTimeout(() => showdown([...board, river]), 800);
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
      setMessage(`🎉 Tu gagnes ${fmt(win)} B avec ${playerBest.rankName} !`);
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
    <div style={{
      position: 'fixed', inset: 0, background: casino.bg,
      color: '#fff', fontFamily: 'Georgia, serif',
      display: 'flex', flexDirection: 'column', zIndex: 500,
    }}>
      {/* Header */}
      <div style={{
        padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(0,0,0,0.5)', borderBottom: `2px solid ${casino.primary}`,
      }}>
        <button onClick={onExit} style={{
          padding: '8px 16px', background: 'rgba(0,0,0,0.5)',
          border: `1px solid ${casino.secondary}`, color: casino.secondary,
          borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
        }}>← Sortir</button>
        <div style={{ color: casino.secondary, fontSize: 18, fontWeight: 'bold', letterSpacing: 2 }}>
          ♠ POKER TEXAS HOLD'EM
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: '#cca366' }}>Solde</div>
          <div style={{ fontSize: 16, color: '#ffd700', fontWeight: 'bold' }}>{fmt(balance)} B</div>
        </div>
      </div>

      {/* Table */}
      <div style={{
        flex: 1, padding: 20,
        background: 'radial-gradient(ellipse, #0a5020 0%, #052010 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'space-between',
        overflowY: 'auto',
      }}>
        {/* Croupier en haut */}
        <div style={{ marginBottom: 10 }}>
          <Dealer profile={dealerProfile || DEALER_PROFILES[0]} splats={[]} dead={dealerDead} shot={dealerShot} bloodStreams={[]} />
        </div>

        {/* Cartes du croupier */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {dealerCards.map((c, i) => (
            <Card key={i} card={c} hidden={!showDealerCards} delay={i * 200} small />
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
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {board.map((c, i) => (
              <Card key={i} card={c} delay={i * 150} small />
            ))}
            {[...Array(5 - board.length)].map((_, i) => (
              <div key={i} style={{
                width: 50, height: 72,
                border: '2px dashed #555', borderRadius: 6,
                opacity: 0.3,
              }} />
            ))}
          </div>
        </div>

        {/* Cartes du joueur */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {playerCards.map((c, i) => (
            <Card key={i} card={c} delay={i * 200} />
          ))}
          {playerCards.length === 0 && (
            <>
              <div style={{ width: 80, height: 112, border: '2px dashed #555', borderRadius: 8, opacity: 0.3 }} />
              <div style={{ width: 80, height: 112, border: '2px dashed #555', borderRadius: 8, opacity: 0.3 }} />
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
            Mise : {fmt(ante)} × {multiplier} = {fmt(ante * multiplier)} B
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
                Mise de base (min {fmt(minBet)} B)
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
              style={{
                width: '100%', padding: 14,
                background: (ante >= minBet && ante <= balance)
                  ? `linear-gradient(135deg, ${casino.primary}, ${casino.accent})` : '#444',
                border: 'none', color: '#fff', borderRadius: 8,
                fontSize: 16, fontWeight: 'bold', cursor: 'pointer',
                fontFamily: 'inherit', letterSpacing: 1,
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
                style={pokerBtnStyle(casino)}>×2 ({fmt(ante)} B)</button>
              <button onClick={() => viewFlop(3)}
                disabled={ante * 2 > balance}
                style={pokerBtnStyle(casino)}>×3 ({fmt(ante * 2)} B)</button>
              <button onClick={() => viewFlop(4)}
                disabled={ante * 3 > balance}
                style={pokerBtnStyle(casino)}>×4 ({fmt(ante * 3)} B)</button>
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
              <button onClick={callTurn} style={{
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
              <button onClick={doubleTurn}
                disabled={ante * multiplier > balance}
                style={{
                  flex: 1, padding: 12,
                  background: 'linear-gradient(135deg, #ffd700, #b8860b)',
                  color: '#000', border: 'none', borderRadius: 6,
                  fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit',
                }}>DOUBLER ×2 ({fmt(ante * multiplier)} B)</button>
              <button onClick={skipToRiver} style={{
                flex: 1, padding: 12,
                background: 'rgba(100,100,100,0.4)',
                border: '1px solid #666', color: '#ccc',
                borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold',
              }}>VOIR RIVER</button>
              <button onClick={fold} style={{
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
    </div>
  );
};


export default PokerGame;
