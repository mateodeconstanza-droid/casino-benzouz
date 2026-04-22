import React, { useState, useEffect, useRef } from 'react';
import { fmt, handValue, createDeck, RED_NUMBERS, ROULETTE_NUMBERS, WHEEL_PRIZES, WEAPONS, VEHICLES, HAIR_CATALOG, OUTFIT_CATALOG, SHOES_CATALOG, TROPHIES, CASINOS, DEALER_PROFILES, CASINO_3D_COLORS, BENZBET_MATCHES, generateMatches, BENZBET_KEY, getColor, bjValue, sportBtnStyle, FOUR_HOURS, POKER_HAND_NAMES, evaluatePokerHand, evaluateHand5, compareTB } from '@/game/constants';
import { Card, Chip, ChipStack, GameHeader, btnStyle, menuBtnStyle, StatCard, ArrowButton, Dealer, WeaponIcon, FlyingProjectile, pokerBtnStyle, numStyle, choiceBtn, VehicleGraphic, WeaponMenu } from '@/game/ui';

const BenzBetScreen = ({ balance, setBalance, weapons, username, onExit, casino }) => {
  const [phase, setPhase] = useState('menu');
  const [match, setMatch] = useState(null);
  const [choice, setChoice] = useState(null);
  const [betAmount, setBetAmount] = useState(100);
  const [startTime, setStartTime] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [result, setResult] = useState(null);
  const [dealerDead, setDealerDead] = useState(false);
  const [showWeapons, setShowWeapons] = useState(false);
  const [matchScore, setMatchScore] = useState({ h: 0, a: 0 });
  const [machineSlot, setMachineSlot] = useState(null); // 1 or 2

  // Clock
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Charger pari en cours au montage
  useEffect(() => {
    if (!username) return;
    try {
      const stored = localStorage.getItem(BENZBET_KEY(username));
      if (stored) {
        const bet = JSON.parse(stored);
        setMatch(bet.match);
        setChoice(bet.choice);
        setBetAmount(bet.betAmount);
        setStartTime(bet.startTime);
        setMachineSlot(bet.machineSlot || 1);
        // Deterministic result basé sur startTime + match
        const total = (1/bet.match.oddsH) + (1/bet.match.oddsN) + (1/bet.match.oddsA);
        const pH = (1/bet.match.oddsH) / total;
        const pN = (1/bet.match.oddsN) / total;
        // Utiliser le startTime comme seed pour avoir un résultat reproductible
        const seed = (bet.startTime % 10000) / 10000;
        let winner = 'A';
        if (seed < pH) winner = 'H';
        else if (seed < pH + pN) winner = 'N';
        const seedScore = (bet.startTime % 1000) / 1000;
        let score = { h: 0, a: 0 };
        if (winner === 'H') score = { h: 1 + Math.floor(seedScore * 3), a: 0 };
        else if (winner === 'A') score = { h: 0, a: 1 + Math.floor(seedScore * 3) };
        else score = { h: 1, a: 1 };

        const elapsed = Date.now() - bet.startTime;
        if (elapsed < 5000) {
          setPhase('waiting');
        } else if (elapsed < 5000 + 180000) {
          setPhase('playing');
          // Score progressif
          const matchProgress = (elapsed - 5000) / 180000;
          setMatchScore({
            h: Math.floor(score.h * matchProgress),
            a: Math.floor(score.a * matchProgress),
          });
        } else {
          // Match terminé
          setMatchScore(score);
          const won = winner === bet.choice;
          const odds = bet.choice === 'H' ? bet.match.oddsH : bet.choice === 'N' ? bet.match.oddsN : bet.match.oddsA;
          const payout = won ? Math.floor(bet.betAmount * odds) : 0;
          setResult({ winner, won, payout });
          setPhase('result');
        }
      }
    } catch (e) {}
  }, [username]);

  // Mettre à jour le score en temps réel pendant le match
  useEffect(() => {
    if (phase !== 'playing' || !match || !startTime) return;
    const elapsed = now - startTime;
    const matchProgress = Math.min(1, Math.max(0, (elapsed - 5000) / 180000));

    // Résultat deterministic
    const total = (1/match.oddsH) + (1/match.oddsN) + (1/match.oddsA);
    const pH = (1/match.oddsH) / total;
    const pN = (1/match.oddsN) / total;
    const seed = (startTime % 10000) / 10000;
    let winner = 'A';
    if (seed < pH) winner = 'H';
    else if (seed < pH + pN) winner = 'N';
    const seedScore = (startTime % 1000) / 1000;
    const seedScore2 = ((startTime / 1000) % 1000) / 1000;
    
    // Score selon le sport
    let finalScore = { h: 0, a: 0 };
    const sport = match.sport || '';
    
    if (sport.includes('Football')) {
      // Foot : scores faibles 0-4
      if (winner === 'H') finalScore = { h: 1 + Math.floor(seedScore * 3), a: Math.floor(seedScore2 * 2) };
      else if (winner === 'A') finalScore = { h: Math.floor(seedScore2 * 2), a: 1 + Math.floor(seedScore * 3) };
      else finalScore = { h: 1 + Math.floor(seedScore * 2), a: 1 + Math.floor(seedScore * 2) };
    } else if (sport.includes('Basket')) {
      // Basket : scores élevés 60-120
      const base = 75 + Math.floor(seedScore * 25);
      const diff = 5 + Math.floor(seedScore2 * 15);
      if (winner === 'H') finalScore = { h: base + diff, a: base };
      else if (winner === 'A') finalScore = { h: base, a: base + diff };
      else finalScore = { h: base + 10, a: base + 10 }; // très rare au basket
    } else if (sport.includes('Tennis')) {
      // Tennis : sets au meilleur des 3, format "X-Y X-Y" stocké dans h/a
      // On encode : h = set1H*100 + set2H, a = set1A*100 + set2A (max 7-6)
      const set1H = winner === 'H' ? 6 : Math.floor(seedScore * 5) + 1;
      const set1A = winner === 'H' ? Math.floor(seedScore2 * 5) : 6;
      const set2H = winner === 'H' ? 6 : Math.floor(seedScore2 * 5);
      const set2A = winner === 'H' ? Math.floor(seedScore * 5) : 6;
      finalScore = { 
        h: set1H * 100 + set2H, 
        a: set1A * 100 + set2A,
        isTennis: true,
        set1H, set1A, set2H, set2A,
      };
    }

    // Progression du score
    if (sport.includes('Tennis')) {
      // Pour le tennis, progression par set
      if (matchProgress < 0.5) {
        const setP = matchProgress * 2;
        setMatchScore({
          h: Math.floor(finalScore.set1H * setP) * 100,
          a: Math.floor(finalScore.set1A * setP) * 100,
          isTennis: true,
          set1H: Math.floor(finalScore.set1H * setP),
          set1A: Math.floor(finalScore.set1A * setP),
          set2H: 0, set2A: 0,
        });
      } else {
        const setP = (matchProgress - 0.5) * 2;
        setMatchScore({
          h: finalScore.set1H * 100 + Math.floor(finalScore.set2H * setP),
          a: finalScore.set1A * 100 + Math.floor(finalScore.set2A * setP),
          isTennis: true,
          set1H: finalScore.set1H,
          set1A: finalScore.set1A,
          set2H: Math.floor(finalScore.set2H * setP),
          set2A: Math.floor(finalScore.set2A * setP),
        });
      }
    } else {
      setMatchScore({
        h: Math.floor(finalScore.h * matchProgress),
        a: Math.floor(finalScore.a * matchProgress),
      });
    }

    if (elapsed >= 5000 + 180000) {
      setMatchScore(finalScore);
      const won = winner === choice;
      const odds = choice === 'H' ? match.oddsH : choice === 'N' ? match.oddsN : match.oddsA;
      const payout = won ? Math.floor(betAmount * odds) : 0;
      setResult({ winner, won, payout });
      setPhase('result');
    }
  }, [now, phase, match, startTime, choice, betAmount]);

  // Transition waiting -> playing
  useEffect(() => {
    if (phase !== 'waiting' || !startTime) return;
    const elapsed = now - startTime;
    if (elapsed >= 5000) {
      setPhase('playing');
    }
  }, [now, phase, startTime]);

  const pickMatch = (slot) => {
    setMachineSlot(slot);
    setPhase('sport_select');
  };

  const [availableMatches, setAvailableMatches] = useState([]);

  const chooseSport = (sport) => {
    setAvailableMatches(generateMatches(sport));
    setPhase('match_select');
  };

  const chooseMatch = (m) => {
    setMatch(m);
    setPhase('betting');
  };

  const placeBet = () => {
    if (betAmount > balance || betAmount <= 0) return;
    setBalance(b => b - betAmount);
    const st = Date.now();
    setStartTime(st);
    setPhase('waiting');
    // Sauvegarder dans localStorage
    if (username) {
      try {
        localStorage.setItem(BENZBET_KEY(username), JSON.stringify({
          match, choice, betAmount, startTime: st, machineSlot,
        }));
      } catch (e) {}
    }
  };

  const collectTicket = () => setPhase('ticket');

  const clearStoredBet = () => {
    if (username) {
      try { localStorage.removeItem(BENZBET_KEY(username)); } catch (e) {}
    }
  };

  const giveTicket = () => {
    setBalance(b => b + result.payout);
    clearStoredBet();
    setPhase('menu');
    setMatch(null); setChoice(null); setResult(null); setStartTime(0);
  };

  const resetFromLoss = () => {
    clearStoredBet();
    setPhase('menu');
    setMatch(null); setChoice(null); setResult(null); setStartTime(0);
  };

  const useWeaponOnDealer = (weaponId) => {
    setShowWeapons(false);
    setDealerDead(true);
    setTimeout(() => {
      setDealerDead(false);
      resetFromLoss();
    }, 10000);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(180deg, #1a0a1a 0%, #0a0505 100%)',
      fontFamily: 'Georgia, serif', color: '#fff', zIndex: 1000,
      display: 'flex', flexDirection: 'column', overflow: 'auto',
    }}>
      {/* Bouton SORTIR permanent */}
      <button onClick={onExit} style={{
        position: 'absolute', top: 20, right: 20, zIndex: 100,
        padding: '10px 20px',
        background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
        color: '#fff', border: '2px solid ' + casino.secondary,
        borderRadius: 8, cursor: 'pointer',
        fontFamily: 'inherit', fontWeight: 'bold', fontSize: 14,
        boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
      }}>← Sortir</button>

      <div style={{ flex: 1, position: 'relative', padding: 20, minHeight: 400 }}>
        <div style={{
          textAlign: 'center', marginBottom: 20,
          color: '#ff00aa', fontSize: 28, fontWeight: 'bold',
          letterSpacing: 4, textShadow: '0 0 20px #ff00aa',
          animation: 'neonPulse 2s ease-in-out infinite',
        }}>BENZ<span style={{color:'#ffd700'}}>BET</span></div>

        {/* Comptoir bookmaker */}
        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', marginBottom: 20 }}>
          <div style={{
            width: 200, height: 140, position: 'relative',
            transform: dealerDead ? 'rotate(-25deg) translateY(30px)' : 'none',
            transition: 'transform 0.5s', filter: dealerDead ? 'grayscale(1) brightness(0.5)' : 'none',
          }}>
            <svg viewBox="0 0 200 140" style={{ width: '100%', height: '100%' }}>
              <rect x="65" y="50" width="70" height="80" fill="#4a2a4a" rx="4" />
              <rect x="75" y="58" width="50" height="30" fill="#fff" />
              <path d="M 95 60 L 105 60 L 108 90 L 100 100 L 92 90 Z" fill="#ff00aa" />
              <ellipse cx="100" cy="30" rx="22" ry="26" fill="#d4a888" />
              <path d="M 78 20 Q 80 5 100 3 Q 120 5 122 20 L 118 15 Q 100 8 82 15 Z" fill="#4a2818" />
              <ellipse cx="92" cy="30" rx="3" ry="2" fill="#fff" />
              <ellipse cx="108" cy="30" rx="3" ry="2" fill="#fff" />
              <circle cx="92" cy="30" r="1.5" fill="#000" />
              <circle cx="108" cy="30" r="1.5" fill="#000" />
              {dealerDead && (
                <>
                  <line x1="87" y1="26" x2="97" y2="34" stroke="#000" strokeWidth="1.5" />
                  <line x1="97" y1="26" x2="87" y2="34" stroke="#000" strokeWidth="1.5" />
                  <line x1="103" y1="26" x2="113" y2="34" stroke="#000" strokeWidth="1.5" />
                  <line x1="113" y1="26" x2="103" y2="34" stroke="#000" strokeWidth="1.5" />
                  <circle cx="100" cy="30" r="3" fill="#8b0000" />
                </>
              )}
              <path d="M 95 42 Q 100 44 105 42" stroke="#333" strokeWidth="1.5" fill="none" />
            </svg>
            <div style={{
              textAlign: 'center', color: '#ff00aa', fontSize: 11, fontStyle: 'italic', marginTop: -5,
            }}>~ Rafael le bookmaker ~</div>
          </div>
        </div>

        <div style={{
          width: '100%', height: 20,
          background: 'linear-gradient(180deg, #4a2a10, #2a1608)',
          borderTop: '3px solid #ffd700', marginBottom: 20,
        }} />

        {phase === 'menu' && (
          <div style={{
            display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap',
          }}>
            {[1, 2].map(n => (
              <div key={n}
                onClick={() => pickMatch(n)}
                style={{
                  width: 160, height: 220,
                  background: 'linear-gradient(180deg, #1a1a2a, #0a0a15)',
                  border: '3px solid #ff00aa', borderRadius: 10,
                  padding: 12, cursor: 'pointer',
                  position: 'relative',
                  boxShadow: '0 0 20px #ff00aa66',
                }}>
                <div style={{ color: '#ff00aa', fontSize: 10, textAlign: 'center', letterSpacing: 2 }}>
                  BENZBET {n}
                </div>
                <div style={{
                  marginTop: 8, padding: 8,
                  background: '#000', border: '1px solid #ff00aa',
                  borderRadius: 4, minHeight: 80,
                  color: '#0f0', fontFamily: 'monospace', fontSize: 11,
                }}>
                  <div>&gt; FOOT / BASKET</div>
                  <div>&gt; TENNIS</div>
                  <div style={{ marginTop: 8, color: '#ff0' }}>&gt; MISEZ_</div>
                </div>
                <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: '#cca366' }}>
                  Cliquer pour miser
                </div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'radial-gradient(circle, #f00, #800)' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'radial-gradient(circle, #0f0, #080)' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'radial-gradient(circle, #ff0, #880)' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {phase === 'sport_select' && (
          <div style={{
            maxWidth: 500, margin: '0 auto',
            background: 'rgba(0,0,0,0.75)', border: '2px solid #ff00aa',
            borderRadius: 10, padding: 20,
          }}>
            <div style={{ textAlign: 'center', color: '#ffd700', fontSize: 18, marginBottom: 16, letterSpacing: 2 }}>
              BORNE {machineSlot} • CHOISIS TON SPORT
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => chooseSport('foot')} style={sportBtnStyle('#00aa44')}>
                <div style={{ fontSize: 32 }}>⚽</div>
                <div style={{ fontSize: 16, fontWeight: 'bold' }}>FOOTBALL</div>
                <div style={{ fontSize: 11, color: '#cca366' }}>Top 20 clubs européens</div>
              </button>
              <button onClick={() => chooseSport('nba')} style={sportBtnStyle('#ff6600')}>
                <div style={{ fontSize: 32 }}>🏀</div>
                <div style={{ fontSize: 16, fontWeight: 'bold' }}>BASKET NBA</div>
                <div style={{ fontSize: 11, color: '#cca366' }}>30 équipes NBA</div>
              </button>
              <button onClick={() => chooseSport('tennis')} style={sportBtnStyle('#ffd700')}>
                <div style={{ fontSize: 32 }}>🎾</div>
                <div style={{ fontSize: 16, fontWeight: 'bold' }}>TENNIS</div>
                <div style={{ fontSize: 11, color: '#cca366' }}>Top 50 mondial ATP</div>
              </button>
            </div>
            <button onClick={() => setPhase('menu')} style={{
              width: '100%', marginTop: 12, padding: 8,
              background: 'transparent', border: '1px solid #888',
              color: '#888', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
            }}>Retour</button>
          </div>
        )}

        {phase === 'match_select' && availableMatches.length > 0 && (
          <div style={{
            maxWidth: 560, margin: '0 auto',
            background: 'rgba(0,0,0,0.75)', border: '2px solid #ff00aa',
            borderRadius: 10, padding: 16,
          }}>
            <div style={{ textAlign: 'center', color: '#ffd700', fontSize: 15, marginBottom: 12, letterSpacing: 1 }}>
              {availableMatches[0].sport} • 8 matchs à parier
            </div>
            <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
              {availableMatches.map((m, i) => (
                <button key={i} onClick={() => chooseMatch(m)} style={{
                  width: '100%', padding: 12, marginBottom: 8,
                  background: 'rgba(40,10,40,0.6)',
                  border: '1px solid #ff00aa',
                  borderRadius: 8, color: '#fff',
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  gap: 8,
                }}>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 'bold' }}>
                      {m.home} <span style={{ color: '#ff00aa' }}>vs</span> {m.away}
                    </div>
                    <div style={{ fontSize: 10, color: '#cca366', marginTop: 2 }}>
                      1 : ×{m.oddsH} • N : ×{m.oddsN} • 2 : ×{m.oddsA}
                    </div>
                  </div>
                  <div style={{ color: '#ffd700', fontSize: 13 }}>→</div>
                </button>
              ))}
            </div>
            <button onClick={() => setPhase('sport_select')} style={{
              width: '100%', marginTop: 8, padding: 8,
              background: 'transparent', border: '1px solid #888',
              color: '#888', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
            }}>Changer de sport</button>
          </div>
        )}

        {phase === 'betting' && match && (
          <div style={{
            maxWidth: 500, margin: '0 auto',
            background: 'rgba(0,0,0,0.7)', border: '2px solid #ff00aa',
            borderRadius: 10, padding: 20,
          }}>
            <div style={{ textAlign: 'center', color: '#ffd700', fontSize: 16, marginBottom: 10 }}>
              BORNE {machineSlot} • {match.sport}
            </div>
            <div style={{ textAlign: 'center', fontSize: 20, marginBottom: 16 }}>
              {match.home} <span style={{ color: '#ff00aa' }}>VS</span> {match.away}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button onClick={() => setChoice('H')} style={choiceBtn(choice === 'H')}>
                <div>1 (Victoire)</div>
                <div style={{ fontSize: 18, color: '#ffd700' }}>×{match.oddsH}</div>
                <div style={{ fontSize: 10 }}>{match.home}</div>
              </button>
              <button onClick={() => setChoice('N')} style={choiceBtn(choice === 'N')}>
                <div>N (Nul)</div>
                <div style={{ fontSize: 18, color: '#ffd700' }}>×{match.oddsN}</div>
                <div style={{ fontSize: 10 }}>Égalité</div>
              </button>
              <button onClick={() => setChoice('A')} style={choiceBtn(choice === 'A')}>
                <div>2 (Défaite)</div>
                <div style={{ fontSize: 18, color: '#ffd700' }}>×{match.oddsA}</div>
                <div style={{ fontSize: 10 }}>{match.away}</div>
              </button>
            </div>
            <div style={{ marginBottom: 10, color: '#cca366', fontSize: 13 }}>
              Mise (solde: {fmt(balance)} B) :
            </div>
            <input type="number" value={betAmount} onChange={e => setBetAmount(parseInt(e.target.value) || 0)}
              min="10" max={balance}
              style={{
                width: '100%', padding: 10, background: '#000',
                border: '1px solid #ff00aa', color: '#fff', fontSize: 16, borderRadius: 4,
                fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 10,
              }} />
            <div style={{ color: '#00ff88', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>
              {choice && `Gain potentiel : ${fmt(Math.floor(betAmount * (choice === 'H' ? match.oddsH : choice === 'N' ? match.oddsN : match.oddsA)))} B`}
            </div>
            <button onClick={placeBet} disabled={!choice || betAmount <= 0 || betAmount > balance}
              style={{
                width: '100%', padding: 12,
                background: (choice && betAmount > 0 && betAmount <= balance)
                  ? 'linear-gradient(135deg, #ff00aa, #aa0055)' : '#444',
                color: '#fff', border: 'none', borderRadius: 6,
                fontSize: 16, fontWeight: 'bold', cursor: 'pointer',
                fontFamily: 'inherit', letterSpacing: 1,
              }}>VALIDER LE PARI</button>
            <button onClick={() => setPhase('menu')} style={{
              width: '100%', marginTop: 8, padding: 8,
              background: 'transparent', border: '1px solid #888',
              color: '#888', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
            }}>Annuler</button>
          </div>
        )}

        {phase === 'waiting' && startTime > 0 && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ color: '#ffd700', fontSize: 20 }}>Le match commence dans...</div>
            <div style={{ color: '#ff00aa', fontSize: 72, fontWeight: 'bold', margin: 20 }}>
              {Math.max(0, Math.ceil((5000 - (now - startTime)) / 1000))}
            </div>
            <div style={{ color: '#cca366', fontSize: 12, fontStyle: 'italic' }}>
              Tu peux sortir et revenir plus tard, le match jouera sans toi
            </div>
          </div>
        )}

        {phase === 'playing' && match && startTime > 0 && (
          <div style={{
            maxWidth: 500, margin: '0 auto',
            background: 'rgba(0,0,0,0.8)', border: '3px solid #00ff88',
            borderRadius: 10, padding: 20, textAlign: 'center',
          }}>
            <div style={{ color: '#00ff88', fontSize: 12, marginBottom: 8, animation: 'blink 1s infinite' }}>
              ● EN DIRECT • BORNE {machineSlot}
            </div>
            <div style={{ fontSize: 14, color: '#cca366', marginBottom: 12 }}>{match.sport}</div>

            {/* Terrain simulé */}
            <div style={{
              background: '#0a4020', border: '2px solid #0f0',
              borderRadius: 8, padding: 8, marginBottom: 12,
              position: 'relative', height: 80,
              backgroundImage: `
                linear-gradient(90deg, transparent 49.5%, #fff 49.5%, #fff 50.5%, transparent 50.5%),
                repeating-linear-gradient(90deg, #0a4020, #0a4020 20%, #084018 20%, #084018 40%)
              `,
            }}>
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                width: 40, height: 40, border: '2px solid #fff', borderRadius: '50%',
              }} />
              {/* Ballons animés */}
              <div style={{
                position: 'absolute', top: '40%',
                left: `${20 + ((now - startTime) / 200) % 60}%`,
                width: 10, height: 10,
                background: 'radial-gradient(circle, #fff, #888)',
                borderRadius: '50%',
                transition: 'left 0.5s',
              }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ flex: 1, textAlign: 'right', fontSize: 16 }}>{match.home}</div>
              <div style={{ fontSize: matchScore.isTennis ? 20 : 32, color: '#ffd700', fontWeight: 'bold', margin: '0 20px' }}>
                {matchScore.isTennis
                  ? `${matchScore.set1H}-${matchScore.set1A}  ${matchScore.set2H}-${matchScore.set2A}`
                  : `${matchScore.h} - ${matchScore.a}`}
              </div>
              <div style={{ flex: 1, textAlign: 'left', fontSize: 16 }}>{match.away}</div>
            </div>
            <div style={{ color: '#cca366', fontSize: 14 }}>
              Temps : <strong style={{color: '#ffd700'}}>
                {Math.max(0, Math.floor((180000 - (now - startTime - 5000)) / 60000))}:
                {String(Math.max(0, Math.floor(((180000 - (now - startTime - 5000)) % 60000) / 1000))).padStart(2, '0')}
              </strong>
            </div>
            <div style={{ marginTop: 12, color: '#888', fontSize: 11, fontStyle: 'italic' }}>
              Ton pari : {choice === 'H' ? match.home : choice === 'N' ? 'Nul' : match.away} • {fmt(betAmount)} B
            </div>
            <div style={{ marginTop: 8, color: '#cca366', fontSize: 11, fontStyle: 'italic' }}>
              💡 Tu peux sortir et revenir à ta borne pour voir le résultat
            </div>
          </div>
        )}

        {phase === 'result' && result && match && (
          <div style={{
            maxWidth: 500, margin: '0 auto',
            background: 'rgba(0,0,0,0.8)',
            border: `3px solid ${result.won ? '#00ff88' : '#ff4444'}`,
            borderRadius: 10, padding: 20, textAlign: 'center',
          }}>
            <div style={{
              fontSize: 32, fontWeight: 'bold', marginBottom: 16,
              color: result.won ? '#00ff88' : '#ff4444',
              textShadow: `0 0 20px ${result.won ? '#00ff88' : '#ff4444'}`,
            }}>
              {result.won ? '🎉 GAGNÉ !' : '❌ PERDU'}
            </div>
            <div style={{ fontSize: 18, marginBottom: 8 }}>
              Score final : {matchScore.isTennis
                ? `${matchScore.set1H}-${matchScore.set1A}, ${matchScore.set2H}-${matchScore.set2A}`
                : `${matchScore.h} - ${matchScore.a}`}
            </div>
            <div style={{ color: '#cca366', marginBottom: 16 }}>
              {result.winner === 'H' ? `Victoire de ${match.home}` :
               result.winner === 'A' ? `Victoire de ${match.away}` : 'Match nul'}
            </div>
            {result.won ? (
              <>
                <div style={{ fontSize: 24, color: '#ffd700', marginBottom: 16 }}>
                  +{fmt(result.payout)} B
                </div>
                <button onClick={collectTicket} style={{
                  padding: '12px 28px',
                  background: 'linear-gradient(135deg, #ffd700, #b8860b)',
                  color: '#000', border: 'none', borderRadius: 8,
                  fontSize: 16, fontWeight: 'bold', cursor: 'pointer',
                  fontFamily: 'inherit',
                }}>🎟️ Récupérer le ticket</button>
              </>
            ) : (
              <>
                <div style={{ color: '#ff4444', marginBottom: 16 }}>-{fmt(betAmount)} B</div>
                {!dealerDead && weapons.length > 0 && (
                  <button onClick={() => setShowWeapons(true)} style={{
                    padding: '10px 24px', marginRight: 8,
                    background: 'linear-gradient(135deg, #8b0000, #4a0000)',
                    color: '#fff', border: 'none', borderRadius: 6,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>⚔️ Défoule-toi</button>
                )}
                <button onClick={resetFromLoss} style={{
                  padding: '10px 24px',
                  background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
                  color: '#fff', border: 'none', borderRadius: 6,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>Nouveau pari</button>
              </>
            )}
          </div>
        )}

        {phase === 'ticket' && result && (
          <div style={{
            maxWidth: 500, margin: '0 auto',
            background: 'linear-gradient(135deg, #fff 0%, #f4e8b0 100%)',
            border: '4px double #b8860b',
            borderRadius: 10, padding: 24, color: '#1a1a1a',
            boxShadow: '0 0 40px rgba(255,215,0,0.6)',
            textAlign: 'center',
          }}>
            <div style={{ color: '#b8860b', fontSize: 12, letterSpacing: 3, marginBottom: 8 }}>
              ✦ TICKET GAGNANT ✦
            </div>
            <div style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 8 }}>
              BENZ<span style={{color: '#b8860b'}}>BET</span>
            </div>
            <div style={{ borderTop: '2px dashed #b8860b', borderBottom: '2px dashed #b8860b', padding: '12px 0', margin: '12px 0' }}>
              <div style={{ fontSize: 14, marginBottom: 4 }}>{match.sport} • {match.home} vs {match.away}</div>
              <div style={{ fontSize: 12, color: '#666' }}>Pari : {choice === 'H' ? '1' : choice === 'N' ? 'N' : '2'} • Mise : {fmt(betAmount)} B</div>
              <div style={{ fontSize: 28, color: '#b8860b', fontWeight: 'bold', marginTop: 8 }}>
                GAIN : {fmt(result.payout)} B
              </div>
            </div>
            <div style={{ fontSize: 10, color: '#888', fontStyle: 'italic' }}>
              Borne {machineSlot} • Ticket n° BB-{String(startTime).slice(-7)}
            </div>
            <button onClick={giveTicket} style={{
              marginTop: 16, padding: '12px 28px',
              background: 'linear-gradient(135deg, #b8860b, #8b6914)',
              color: '#fff', border: 'none', borderRadius: 8,
              fontSize: 15, fontWeight: 'bold', cursor: 'pointer',
              fontFamily: 'inherit',
            }}>Donner au bookmaker</button>
          </div>
        )}
      </div>

      {showWeapons && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10,
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #1a0a0a, #0a0503)',
            border: '2px solid #8b0000', borderRadius: 12, padding: 24,
            maxWidth: 400, width: '90%',
          }}>
            <div style={{ color: '#ff4444', textAlign: 'center', fontSize: 18, marginBottom: 16 }}>
              ⚔️ Tire sur le bookmaker
            </div>
            {weapons.map(w => {
              const def = WEAPONS.find(x => x.id === w);
              return (
                <button key={w} onClick={() => { useWeaponOnDealer(w); /* eslint-disable-line react-hooks/rules-of-hooks */ }}
                  style={{
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
            <button onClick={() => setShowWeapons(false)} style={{
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



export default BenzBetScreen;
