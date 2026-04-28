import React, { useState, useEffect, useMemo } from 'react';
import {
  fmt, BENZBET_SPORTS, generateMatches,
  BENZBET_SLIP_KEY, BENZBET_HISTORY_KEY, BENZBET_PENDING_KEY,
  getRankings, legResolveDelayMs,
} from '@/game/constants';
import sfx from '@/game/sfx';

// ============================================================
// GambleBet.fr — Site de paris sportifs façon vraie plateforme
// Thème : blanc & rouge, URL visible, simple + combiné multi-sports,
// cotes intelligentes basées sur ELO + probabilités réelles.
// ============================================================

const PRIMARY = '#e00e1a';       // rouge GambleBet
const DARK = '#0d1117';
const LIGHT = '#f5f6f8';
const BORDER = '#e3e6eb';
const INK = '#1a1f2b';
const INK_SOFT = '#5a6170';

// ---------- Utilitaires cotes / combinés ----------
const oddsLabel = (pick) => pick === 'H' ? '1' : pick === 'N' ? 'N' : '2';
const pickTeam = (match, pick) => pick === 'H' ? match.home : pick === 'A' ? match.away : 'Match nul';
const pickOdds = (match, pick) => pick === 'H' ? match.oddsH : pick === 'N' ? match.oddsN : match.oddsA;
const combinedOdds = (slip) => slip.reduce((acc, s) => acc * s.odds, 1);

// ---------- Composant Match Row ----------
const MatchRow = ({ match, pickForMatch, onPick }) => {
  const currentPick = pickForMatch?.pick;
  const cellBtn = (pick, label, odds) => {
    if (odds == null) return <div style={{ minWidth: 72 }} />;
    const active = currentPick === pick;
    const disabled = !!match.finished;
    return (
      <button
        data-testid={`odds-${match.id}-${pick}`}
        onClick={() => !disabled && onPick(match, pick)}
        disabled={disabled}
        style={{
          minWidth: 72, padding: '10px 12px', margin: '0 4px',
          borderRadius: 8, border: `1px solid ${active ? PRIMARY : BORDER}`,
          background: disabled ? '#eee' : (active ? PRIMARY : '#fff'),
          color: disabled ? '#999' : (active ? '#fff' : INK),
          fontWeight: 700, fontSize: 14, cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all .15s', display: 'flex', flexDirection: 'column', alignItems: 'center',
          boxShadow: active ? '0 2px 8px rgba(224,14,26,0.35)' : '0 1px 2px rgba(0,0,0,0.04)',
        }}
      >
        <span style={{ fontSize: 10, opacity: 0.7, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 15 }}>{odds.toFixed(2)}</span>
      </button>
    );
  };
  return (
    <div
      data-testid={`match-row-${match.id}`}
      style={{
        background: '#fff', borderBottom: `1px solid ${BORDER}`,
        padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'background .15s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = '#fafbfc'}
      onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
          <span style={{
            background: '#ffe9eb', color: PRIMARY, padding: '2px 8px',
            borderRadius: 4, fontSize: 10, fontWeight: 700,
          }}>{match.league}</span>
          {match.live ? (
            <span style={{
              background: PRIMARY, color: '#fff', padding: '2px 8px',
              borderRadius: 4, fontSize: 10, fontWeight: 800,
              animation: 'pulse 1.4s infinite',
            }}>🔴 LIVE · {match.minute}'</span>
          ) : match.finished ? (
            <span style={{
              background: '#444', color: '#fff', padding: '2px 8px',
              borderRadius: 4, fontSize: 10, fontWeight: 700,
            }}>TERMINÉ</span>
          ) : (
            <span style={{ fontSize: 11, color: INK_SOFT }}>⏰ Aujourd'hui {match.kickoff}</span>
          )}
        </div>
        <div style={{ fontSize: 14, color: INK, fontWeight: 600 }}>
          {match.home}
          {match.live || match.finished ? (
            <span style={{
              display: 'inline-block', margin: '0 8px',
              background: PRIMARY, color: '#fff', padding: '1px 8px', borderRadius: 4,
              fontSize: 13, fontWeight: 800,
            }}>{match.scoreH} - {match.scoreA}</span>
          ) : <span style={{ color: INK_SOFT, fontWeight: 400 }}> vs </span>}
          {match.away}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {cellBtn('H', '1', match.oddsH)}
        {match.hasDraw && cellBtn('N', 'N', match.oddsN)}
        {cellBtn('A', '2', match.oddsA)}
      </div>
    </div>
  );
};

// ---------- Composant Classements ----------
const formColors = {
  V: { bg: '#1aa34a', label: 'V', title: 'Victoire' },
  N: { bg: '#d97706', label: 'N', title: 'Match nul' },
  D: { bg: '#dc2626', label: 'D', title: 'Défaite' },
};

const TrendIcon = ({ trend }) => {
  if (trend === 'up')   return <span style={{ color: '#1aa34a', fontWeight: 800 }} title="En forme">▲</span>;
  if (trend === 'down') return <span style={{ color: '#dc2626', fontWeight: 800 }} title="En difficulté">▼</span>;
  return <span style={{ color: INK_SOFT, fontWeight: 800 }} title="Stable">▬</span>;
};

const RankingsView = ({ activeSport }) => {
  const sport = BENZBET_SPORTS.find(s => s.id === activeSport);
  const rows = useMemo(() => getRankings(activeSport, 20), [activeSport]);
  return (
    <div data-testid="benzbet-rankings" style={{ flex: 1, overflow: 'auto', background: LIGHT }}>
      <div style={{
        padding: '18px 24px', background: '#fff', borderBottom: `1px solid ${BORDER}`,
      }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: INK }}>
          {sport?.icon} Classement {sport?.label} — Top 20
        </h2>
        <div style={{ fontSize: 12, color: INK_SOFT, marginTop: 4 }}>
          Rangs actualisés — les cotes des matchs sont calculées à partir de ces valeurs.
        </div>
      </div>
      <div style={{ padding: 18 }}>
        <div style={{
          background: '#fff', borderRadius: 10, border: `1px solid ${BORDER}`,
          overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '60px 1fr 110px 140px 70px',
            gap: 8, padding: '10px 16px',
            background: DARK, color: '#fff',
            fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5,
          }}>
            <div>Rang</div>
            <div>{sport?.entity || 'Équipe'}</div>
            <div style={{ textAlign: 'right' }}>{sport?.pointUnit || 'Points'}</div>
            <div style={{ textAlign: 'center' }}>Forme (5 derniers)</div>
            <div style={{ textAlign: 'center' }}>Tend.</div>
          </div>
          {rows.map((r, i) => (
            <div
              key={r.name}
              data-testid={`rank-row-${activeSport}-${r.rank}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 110px 140px 70px',
                gap: 8, padding: '12px 16px', alignItems: 'center',
                borderTop: i === 0 ? 'none' : `1px solid ${BORDER}`,
                background: r.rank <= 3 ? '#fffaf0' : '#fff',
              }}
            >
              <div style={{
                fontWeight: 900, fontSize: 16,
                color: r.rank === 1 ? '#d4af37' : r.rank === 2 ? '#9a9a9a' : r.rank === 3 ? '#b5651d' : INK_SOFT,
              }}>#{r.rank}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: INK }}>
                {r.rank === 1 ? '👑 ' : ''}{r.name}
              </div>
              <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 14, color: PRIMARY }}>
                {fmt(r.points)}
              </div>
              <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                {r.form.map((f, fi) => {
                  const c = formColors[f];
                  return (
                    <span
                      key={fi}
                      title={c.title}
                      style={{
                        display: 'inline-flex', width: 22, height: 22, borderRadius: 4,
                        background: c.bg, color: '#fff', fontWeight: 800, fontSize: 12,
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >{c.label}</span>
                  );
                })}
              </div>
              <div style={{ textAlign: 'center', fontSize: 16 }}>
                <TrendIcon trend={r.trend} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: INK_SOFT, marginTop: 10, textAlign: 'center' }}>
          Légende forme : <span style={{ background: '#1aa34a', color: '#fff', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>V</span> Victoire ·{' '}
          <span style={{ background: '#d97706', color: '#fff', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>N</span> Nul ·{' '}
          <span style={{ background: '#dc2626', color: '#fff', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>D</span> Défaite
        </div>
      </div>
    </div>
  );
};

// ---------- Composant principal ----------
const GambleBetScreen = ({ balance, setBalance, username, onExit }) => {
  const [activeSport, setActiveSport] = useState('foot');
  const [view, setView] = useState('bets'); // 'bets' | 'rankings'
  const [matchesBySport, setMatchesBySport] = useState({});
  const [slip, setSlip] = useState([]); // [{ matchId, match, pick, odds }]
  const [stake, setStake] = useState(100);
  const [mode, setMode] = useState('simple'); // 'simple' | 'combine'
  const [history, setHistory] = useState([]);
  const [pending, setPending] = useState([]);
  const [toast, setToast] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [liveOnly, setLiveOnly] = useState(false);
  const [slipCollapsed, setSlipCollapsed] = useState(false); // repli du panier

  // Charger historique + slip persistés + pending
  useEffect(() => {
    if (!username) return;
    try {
      const h = JSON.parse(localStorage.getItem(BENZBET_HISTORY_KEY(username)) || '[]');
      setHistory(h);
      const s = JSON.parse(localStorage.getItem(BENZBET_SLIP_KEY(username)) || '[]');
      if (Array.isArray(s)) setSlip(s);
      const p = JSON.parse(localStorage.getItem(BENZBET_PENDING_KEY(username)) || '[]');
      if (Array.isArray(p)) setPending(p);
    } catch (_e) { /* noop */ }
  }, [username]);

  // Rafraîchir pending/history toutes les 2s (synchro avec ticker Casino.jsx)
  useEffect(() => {
    if (!username) return;
    const t = setInterval(() => {
      try {
        const h = JSON.parse(localStorage.getItem(BENZBET_HISTORY_KEY(username)) || '[]');
        setHistory(h);
        const p = JSON.parse(localStorage.getItem(BENZBET_PENDING_KEY(username)) || '[]');
        setPending(p);
      } catch (_e) { /* noop */ }
    }, 2000);
    return () => clearInterval(t);
  }, [username]);

  // Sauvegarder slip
  useEffect(() => {
    if (!username) return;
    try { localStorage.setItem(BENZBET_SLIP_KEY(username), JSON.stringify(slip)); } catch (_e) { /* noop */ }
  }, [slip, username]);

  // Générer les matches pour le sport actif (lazy)
  const currentMatches = useMemo(() => {
    if (matchesBySport[activeSport]) return matchesBySport[activeSport];
    const gen = generateMatches(activeSport);
    // Marquer les 3 premiers comme LIVE avec score initial + temps de jeu
    gen.slice(0, 3).forEach((m, i) => {
      m.live = true;
      m.scoreH = 0;
      m.scoreA = 0;
      m.minute = 5 + i * 10;
      m.startTs = Date.now() - (m.minute * 2000); // ratio 1min = 2s
      m._baseProbH = m.probH;
      m._baseProbA = m.probA;
      m._baseProbN = m.probN;
    });
    setMatchesBySport(prev => ({ ...prev, [activeSport]: gen }));
    return gen;
  }, [activeSport, matchesBySport]);

  // Tick LIVE : met à jour temps/score/cotes toutes les 2 secondes pour les matches marqués live
  useEffect(() => {
    const interval = setInterval(() => {
      setMatchesBySport(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(sportId => {
          const list = next[sportId].map(m => {
            if (!m.live) return m;
            changed = true;
            const matchDuration = m.sportId === 'foot' || m.sportId === 'rugby' ? 90 : m.sportId === 'nba' ? 48 : 60;
            const newMin = Math.min(matchDuration + 5, m.minute + 1);
            // Chance qu'un but/point survienne (~5% par minute foot, plus pour basket)
            let newScoreH = m.scoreH, newScoreA = m.scoreA;
            const goalProb = sportId === 'nba' ? 0.55 : sportId === 'foot' ? 0.08 : 0.15;
            if (Math.random() < goalProb) {
              // Celui qui marque suit la force actuelle
              if (Math.random() < (m._baseProbH / (m._baseProbH + m._baseProbA))) {
                newScoreH = m.scoreH + (sportId === 'nba' ? 2 + Math.floor(Math.random() * 2) : 1);
              } else {
                newScoreA = m.scoreA + (sportId === 'nba' ? 2 + Math.floor(Math.random() * 2) : 1);
              }
            }
            // Recalculer les cotes en fonction du score + temps restant
            const timeLeft = Math.max(0, matchDuration - newMin) / matchDuration;
            const scoreDiff = newScoreH - newScoreA;
            // Boost de proba pour le meneur, réduit quand le temps passe
            const leadFactor = Math.tanh(scoreDiff * 0.4) * (1 - timeLeft * 0.5);
            let newProbH = Math.max(0.02, Math.min(0.96, m._baseProbH + leadFactor * 0.4));
            let newProbA = Math.max(0.02, Math.min(0.96, m._baseProbA - leadFactor * 0.4));
            let newProbN = m.hasDraw ? Math.max(0.05, m._baseProbN * timeLeft) : 0;
            const total = newProbH + newProbA + newProbN;
            newProbH /= total; newProbA /= total; newProbN /= total;
            const margin = 1.06;
            const oddsH = +Math.min(50, Math.max(1.02, margin / newProbH)).toFixed(2);
            const oddsA = +Math.min(50, Math.max(1.02, margin / newProbA)).toFixed(2);
            const oddsN = m.hasDraw ? +Math.min(50, Math.max(1.02, margin / newProbN)).toFixed(2) : null;
            const isOver = newMin >= matchDuration;
            return {
              ...m,
              minute: newMin, scoreH: newScoreH, scoreA: newScoreA,
              probH: newProbH, probA: newProbA, probN: newProbN,
              oddsH, oddsA, oddsN,
              live: !isOver,
              finished: isOver,
            };
          });
          next[sportId] = list;
        });
        return changed ? next : prev;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const pickForMatch = (matchId) => slip.find(s => s.matchId === matchId);

  const onPick = (match, pick) => {
    const existing = slip.find(s => s.matchId === match.id);
    if (existing && existing.pick === pick) {
      // Même pick → retirer du slip (toggle)
      setSlip(slip.filter(s => s.matchId !== match.id));
      return;
    }
    const odds = pickOdds(match, pick);
    if (existing) {
      // Changer le pick du même match
      setSlip(slip.map(s => s.matchId === match.id ? { ...s, pick, odds } : s));
    } else {
      setSlip([...slip, {
        matchId: match.id,
        match: {
          id: match.id, home: match.home, away: match.away,
          league: match.league, sportIcon: match.sportIcon, sportLabel: match.sportLabel,
          kickoff: match.kickoff, hasDraw: match.hasDraw,
          oddsH: match.oddsH, oddsN: match.oddsN, oddsA: match.oddsA,
          probH: match.probH, probN: match.probN, probA: match.probA,
        },
        pick, odds,
      }]);
    }
  };

  const removeFromSlip = (matchId) => setSlip(slip.filter(s => s.matchId !== matchId));

  const effectiveMode = slip.length <= 1 ? 'simple' : mode;
  const totalOdds = effectiveMode === 'combine' ? combinedOdds(slip) : (slip[0]?.odds || 0);
  const potentialPayout = Math.floor(stake * totalOdds);

  const validateBets = () => {
    if (slip.length === 0) return;
    if (stake <= 0 || stake > balance) return;

    // ANTI-DOUBLON : refuse si un match du slip a déjà un pari pending non résolu
    const currentPendingPre = JSON.parse(localStorage.getItem(BENZBET_PENDING_KEY(username)) || '[]');
    const pendingMatchIds = new Set();
    for (const p of currentPendingPre) {
      if (p.status !== 'pending') continue;
      for (const lg of (p.legs || [])) pendingMatchIds.add(lg.matchId);
    }
    const conflict = slip.find(s => pendingMatchIds.has(s.matchId));
    if (conflict) {
      setToast(`❌ Tu as déjà un pari en cours sur ${conflict.match.home} vs ${conflict.match.away}`);
      setTimeout(() => setToast(null), 4000);
      return;
    }

    setBalance(b => b - stake);

    // Chaque leg embarque sa durée simulée restante → resolveAt individuel
    const now = Date.now();
    const legsWithTiming = slip.map(leg => ({
      ...leg,
      match: { ...leg.match, sportId: leg.match.sportId || activeSport },
      resolveAt: now + legResolveDelayMs(leg),
    }));
    // Le pari combiné/simple est "ready" quand le plus tardif des legs est fini
    const readyAt = Math.max(...legsWithTiming.map(l => l.resolveAt));

    const pending = {
      id: `b-${now}-${Math.random().toString(36).slice(2, 6)}`,
      placedAt: now,
      readyAt,
      mode: effectiveMode,
      stake,
      legs: legsWithTiming,
      totalOdds: effectiveMode === 'combine' ? combinedOdds(slip) : (slip[0]?.odds || 0),
      status: 'pending',
    };

    // Persiste en attente : le ticker global (Casino.jsx) résoudra automatiquement
    const currentPending = JSON.parse(localStorage.getItem(BENZBET_PENDING_KEY(username)) || '[]');
    const nextPending = [pending, ...currentPending];
    try { localStorage.setItem(BENZBET_PENDING_KEY(username), JSON.stringify(nextPending)); } catch (_e) { /* noop */ }

    setSlip([]);
    try { sfx.play('chip'); } catch (_e) { /* noop */ }
    const durSec = Math.ceil((readyAt - now) / 1000);
    setToast(`⏳ Pari placé — résultat dans ~${durSec}s (mise ${fmt(stake)} $)`);
    setTimeout(() => setToast(null), 3500);
  };

  const clearSlip = () => setSlip([]);

  const refreshSport = () => {
    const fresh = generateMatches(activeSport);
    setMatchesBySport(prev => ({ ...prev, [activeSport]: fresh }));
    // Retirer du slip les matches qui n'existent plus
    const freshIds = new Set(fresh.map(m => m.id));
    setSlip(slip.filter(s => freshIds.has(s.matchId)));
  };

  const sportMeta = BENZBET_SPORTS.find(s => s.id === activeSport);

  return (
    <div
      data-testid="benzbet-root"
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: LIGHT, color: INK,
        fontFamily: '-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.55;} }
      `}</style>
      {/* ====== Browser chrome : barre d'URL façon navigateur ====== */}
      <div style={{
        background: '#e8eaed', padding: '8px 12px',
        borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
        </div>
        <div style={{ color: INK_SOFT, fontSize: 14 }}>← → ↻</div>
        <div style={{
          flex: 1, background: '#fff', borderRadius: 20, padding: '6px 14px',
          border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 13, color: INK,
        }}>
          <span style={{ color: '#1aa34a', fontSize: 12 }}>🔒</span>
          <span style={{ color: INK_SOFT }}>https://www.</span>
          <span style={{ fontWeight: 700 }}>gamblebet.fr</span>
          <span style={{ color: INK_SOFT }}>/paris-sportifs/{activeSport}</span>
        </div>
        <button
          data-testid="benzbet-close-tab"
          onClick={onExit}
          style={{
            background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 6,
            padding: '4px 10px', cursor: 'pointer', fontSize: 13, color: INK,
          }}
        >✕ Fermer</button>
      </div>

      {/* ====== Header site : logo + balance ====== */}
      <div style={{
        background: '#fff', borderBottom: `1px solid ${BORDER}`,
        padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            background: PRIMARY, color: '#fff', padding: '8px 14px', borderRadius: 6,
            fontWeight: 900, letterSpacing: 1, fontSize: 20,
          }}>
            GAMBLELIFE<span style={{ color: '#fff', background: DARK, padding: '0 6px', marginLeft: 4, borderRadius: 3 }}>BET</span>
          </div>
          <div style={{ fontSize: 12, color: INK_SOFT }}>Paris sportifs 100% légal · Cotes en direct</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            data-testid="benzbet-toggle-view"
            onClick={() => setView(v => v === 'bets' ? 'rankings' : 'bets')}
            style={{
              background: view === 'rankings' ? PRIMARY : 'transparent',
              border: `1px solid ${view === 'rankings' ? PRIMARY : BORDER}`, borderRadius: 6,
              padding: '8px 14px', cursor: 'pointer', fontSize: 13,
              color: view === 'rankings' ? '#fff' : INK, fontWeight: 700,
            }}
          >{view === 'rankings' ? '🎟️ Retour aux paris' : '🏆 Classements'}</button>
          <button
            data-testid="benzbet-show-history"
            onClick={() => setShowHistory(true)}
            style={{
              background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 6,
              padding: '8px 14px', cursor: 'pointer', fontSize: 13, color: INK, fontWeight: 600,
            }}
          >📜 Historique ({history.length})</button>
          <div style={{
            background: PRIMARY, color: '#fff', padding: '10px 16px', borderRadius: 8,
            fontWeight: 800, fontSize: 15,
          }} data-testid="benzbet-balance">
            💰 {fmt(balance)} $
          </div>
        </div>
      </div>

      {/* ====== Nav sports horizontale ====== */}
      <div style={{
        background: DARK, overflowX: 'auto', whiteSpace: 'nowrap',
        borderBottom: `2px solid ${PRIMARY}`,
      }}>
        {BENZBET_SPORTS.map(s => (
          <button
            key={s.id}
            data-testid={`sport-tab-${s.id}`}
            onClick={() => setActiveSport(s.id)}
            style={{
              background: activeSport === s.id ? PRIMARY : 'transparent',
              color: '#fff', border: 'none', padding: '12px 20px',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              borderBottom: activeSport === s.id ? `3px solid #fff` : '3px solid transparent',
            }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* ====== Main content : matches + betslip OU classements ====== */}
      {view === 'bets' ? (
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Liste des matches */}
        <div style={{ flex: 1, overflow: 'auto', background: LIGHT }}>
          <div style={{
            padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#fff', borderBottom: `1px solid ${BORDER}`,
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: INK }}>
                {sportMeta?.icon} {sportMeta?.label}
              </h2>
              <div style={{ fontSize: 12, color: INK_SOFT, marginTop: 2 }}>
                {currentMatches.length} matchs · <span style={{ color: PRIMARY, fontWeight: 700 }}>🔴 {currentMatches.filter(m => m.live).length} en direct</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                data-testid="benzbet-live-filter"
                onClick={() => setLiveOnly(v => !v)}
                style={{
                  background: liveOnly ? PRIMARY : '#fff',
                  color: liveOnly ? '#fff' : INK,
                  border: `1px solid ${liveOnly ? PRIMARY : BORDER}`, borderRadius: 6,
                  padding: '8px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                }}
              >🔴 LIVE uniquement</button>
              <button
                data-testid="benzbet-refresh-matches"
                onClick={refreshSport}
                style={{
                  background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 6,
                  padding: '8px 12px', cursor: 'pointer', fontSize: 12, color: INK_SOFT, fontWeight: 600,
                }}
              >🔄 Actualiser</button>
            </div>
          </div>
          {(liveOnly ? currentMatches.filter(m => m.live) : currentMatches).map(m => (
            <MatchRow key={m.id} match={m} pickForMatch={pickForMatch(m.id)} onPick={onPick} />
          ))}
        </div>

        {/* Betslip panneau de droite */}
        <div style={{
          width: slipCollapsed ? 56 : 340,
          background: '#fff', borderLeft: `1px solid ${BORDER}`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          transition: 'width .25s ease',
        }}>
          <div style={{
            background: DARK, color: '#fff', padding: slipCollapsed ? '12px 8px' : '12px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: slipCollapsed ? 'pointer' : 'default',
          }}
          onClick={slipCollapsed ? () => setSlipCollapsed(false) : undefined}
          >
            {slipCollapsed ? (
              <div
                data-testid="benzbet-slip-expand"
                style={{ width: '100%', textAlign: 'center', fontWeight: 800, fontSize: 14 }}
                title="Agrandir le panier"
              >
                🎟️<br/>
                <span style={{ fontSize: 11, color: '#ffd700' }}>{slip.length}</span>
              </div>
            ) : (
              <>
                <div style={{ fontWeight: 800, fontSize: 15 }}>🎟️ Panier ({slip.length})</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {slip.length > 0 && (
                    <button
                      data-testid="benzbet-clear-slip"
                      onClick={clearSlip}
                      style={{
                        background: 'transparent', color: '#fff', border: '1px solid #fff',
                        borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 11,
                      }}
                    >Vider</button>
                  )}
                  <button
                    data-testid="benzbet-slip-collapse"
                    onClick={() => setSlipCollapsed(true)}
                    title="Réduire le panier"
                    style={{
                      background: 'transparent', color: '#fff', border: '1px solid #fff',
                      borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 11,
                    }}
                  >›</button>
                </div>
              </>
            )}
          </div>

          {/* Contenu du panier, masqué quand réduit */}
          {!slipCollapsed && (<>
          {/* Toggle simple / combiné */}
          {slip.length > 1 && (
            <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}` }}>
              <button
                data-testid="benzbet-mode-simple"
                onClick={() => setMode('simple')}
                style={{
                  flex: 1, padding: 10, border: 'none', cursor: 'pointer',
                  background: mode === 'simple' ? PRIMARY : '#fff',
                  color: mode === 'simple' ? '#fff' : INK, fontWeight: 700, fontSize: 13,
                }}
              >Simple</button>
              <button
                data-testid="benzbet-mode-combine"
                onClick={() => setMode('combine')}
                style={{
                  flex: 1, padding: 10, border: 'none', cursor: 'pointer',
                  background: mode === 'combine' ? PRIMARY : '#fff',
                  color: mode === 'combine' ? '#fff' : INK, fontWeight: 700, fontSize: 13,
                }}
              >Combiné</button>
            </div>
          )}

          {/* Liste des paris */}
          <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
            {slip.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '40px 20px', color: INK_SOFT, fontSize: 13,
              }}>
                Ton panier est vide.
                <br /><br />
                Clique sur une cote à gauche pour ajouter un pari.
              </div>
            ) : (
              slip.map(leg => (
                <div
                  key={leg.matchId}
                  data-testid={`slip-leg-${leg.matchId}`}
                  style={{
                    background: LIGHT, borderRadius: 8, padding: 12, marginBottom: 8,
                    border: `1px solid ${BORDER}`, position: 'relative',
                  }}
                >
                  <button
                    data-testid={`slip-remove-${leg.matchId}`}
                    onClick={() => removeFromSlip(leg.matchId)}
                    style={{
                      position: 'absolute', top: 6, right: 6, border: 'none',
                      background: 'transparent', cursor: 'pointer', color: INK_SOFT,
                      fontSize: 16, lineHeight: 1,
                    }}
                  >×</button>
                  <div style={{ fontSize: 10, color: INK_SOFT, marginBottom: 2 }}>
                    {leg.match.sportIcon} {leg.match.league}
                  </div>
                  <div style={{ fontSize: 12, color: INK, fontWeight: 600, paddingRight: 18 }}>
                    {leg.match.home} vs {leg.match.away}
                  </div>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', marginTop: 6,
                    alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 11, color: PRIMARY, fontWeight: 700 }}>
                      {oddsLabel(leg.pick)} · {pickTeam(leg.match, leg.pick)}
                    </span>
                    <span style={{
                      background: '#fff', border: `1px solid ${PRIMARY}`, color: PRIMARY,
                      borderRadius: 4, padding: '2px 8px', fontWeight: 700, fontSize: 12,
                    }}>{leg.odds.toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer : mise + gain potentiel + bouton */}
          {slip.length > 0 && (
            <div style={{ borderTop: `1px solid ${BORDER}`, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: INK_SOFT }}>
                  {effectiveMode === 'combine' ? 'Cote combinée' : 'Cote'}
                </span>
                <span
                  data-testid="benzbet-total-odds"
                  style={{ fontWeight: 800, color: PRIMARY, fontSize: 15 }}
                >{totalOdds.toFixed(2)}</span>
              </div>
              <label style={{ fontSize: 11, color: INK_SOFT, display: 'block', marginBottom: 4 }}>Mise ($)</label>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <input
                  data-testid="benzbet-stake-input"
                  type="number" min={1} max={balance}
                  value={stake}
                  onChange={(e) => setStake(Math.max(0, Math.min(balance, Math.floor(+e.target.value || 0))))}
                  style={{
                    flex: 1, padding: '10px 12px', borderRadius: 6,
                    border: `1px solid ${BORDER}`, fontSize: 14, fontWeight: 700,
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                {[100, 500, 2000, 10000].map(v => (
                  <button
                    key={v}
                    data-testid={`benzbet-stake-${v}`}
                    onClick={() => setStake(Math.min(balance, v))}
                    style={{
                      flex: 1, padding: '6px 0', borderRadius: 4,
                      border: `1px solid ${BORDER}`, background: '#fff',
                      cursor: 'pointer', fontSize: 11, color: INK_SOFT,
                    }}
                  >{v >= 1000 ? `${v / 1000}k` : v}</button>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: INK_SOFT }}>Gain potentiel</span>
                <span
                  data-testid="benzbet-potential-payout"
                  style={{ fontWeight: 800, color: '#1aa34a', fontSize: 16 }}
                >+{fmt(potentialPayout)} $</span>
              </div>
              <button
                data-testid="benzbet-place-bet"
                onClick={validateBets}
                disabled={stake <= 0 || stake > balance}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 8, border: 'none',
                  background: stake > 0 && stake <= balance ? PRIMARY : '#ccc',
                  color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer',
                  letterSpacing: 0.5,
                }}
              >PLACER LE PARI</button>
            </div>
          )}
          </>)}
        </div>
      </div>
      ) : (
        <RankingsView activeSport={activeSport} />
      )}

      {/* ====== Toast résultat ====== */}
      {toast && (
        <div
          data-testid="benzbet-toast"
          style={{
            position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)',
            background: toast.startsWith('🎉') ? '#1aa34a' : '#dc2626',
            color: '#fff', padding: '14px 24px', borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            fontWeight: 700, fontSize: 14, zIndex: 3000,
          }}
        >{toast}</div>
      )}

      {/* ====== Modal historique ====== */}
      {showHistory && (
        <div
          data-testid="benzbet-history-modal"
          style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2500,
          }}
          onClick={() => setShowHistory(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(700px, 92vw)', maxHeight: '80vh', background: '#fff',
              borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column',
            }}
          >
            <div style={{
              background: DARK, color: '#fff', padding: '14px 20px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>📜 Historique des paris</div>
              <button
                onClick={() => setShowHistory(false)}
                style={{
                  background: 'transparent', color: '#fff', border: '1px solid #fff',
                  borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 12,
                }}
              >Fermer</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
              {pending.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: PRIMARY, marginBottom: 8, textTransform: 'uppercase' }}>
                    ⏳ En cours ({pending.length})
                  </div>
                  {pending.map(p => {
                    const left = Math.max(0, Math.ceil((p.readyAt - Date.now()) / 1000));
                    return (
                      <div
                        key={p.id}
                        data-testid={`pending-bet-${p.id}`}
                        style={{
                          border: `1px dashed ${PRIMARY}`, borderRadius: 8, padding: 12, marginBottom: 10,
                          background: '#fffaf5',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 11, color: INK_SOFT }}>
                            {new Date(p.placedAt).toLocaleTimeString('fr-FR')} · {p.mode === 'combine' ? `Combiné ×${p.legs.length}` : 'Simple'} · Mise {fmt(p.stake)} $
                          </span>
                          <span style={{ fontWeight: 800, fontSize: 12, color: PRIMARY }}>
                            ⏱ ~{left}s
                          </span>
                        </div>
                        {p.legs.map((l, li) => (
                          <div key={li} style={{ fontSize: 12, color: INK, padding: '2px 0' }}>
                            • {l.match.home} vs {l.match.away} —
                            <span style={{ color: PRIMARY, fontWeight: 700 }}> {oddsLabel(l.pick)} {pickTeam(l.match, l.pick)}</span>
                            <span style={{ color: INK_SOFT }}> @ {l.odds.toFixed(2)}</span>
                          </div>
                        ))}
                        <div style={{ fontSize: 11, color: INK_SOFT, marginTop: 4 }}>
                          Gain potentiel : <b style={{ color: '#1aa34a' }}>+{fmt(Math.floor(p.stake * p.totalOdds))} $</b>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {history.length === 0 && pending.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: INK_SOFT }}>
                  Aucun pari enregistré pour l'instant.
                </div>
              ) : history.map(h => (
                <div key={h.id} style={{
                  border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12, marginBottom: 10,
                  background: h.status === 'won' ? '#f0faf3' : h.status === 'partial' ? '#fff8e6' : '#fdf2f3',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: INK_SOFT }}>
                      {new Date(h.ts).toLocaleString('fr-FR')} · {h.mode === 'combine' ? `Combiné ×${h.legs.length}` : 'Simple'}
                    </span>
                    <span style={{
                      fontWeight: 800, fontSize: 13,
                      color: h.status === 'won' ? '#1aa34a' : h.status === 'partial' ? '#d97706' : '#dc2626',
                    }}>
                      {h.status === 'won' ? `✅ +${fmt(h.payout)} $` : h.status === 'partial' ? `⚠️ +${fmt(h.payout)} $` : `❌ −${fmt(h.stake)} $`}
                    </span>
                  </div>
                  {h.legs.map(l => (
                    <div key={l.matchId} style={{ fontSize: 12, color: INK, padding: '2px 0' }}>
                      {l.won ? '✓' : '✗'} {l.match.home} vs {l.match.away} —
                      <span style={{ color: PRIMARY, fontWeight: 700 }}> {oddsLabel(l.pick)} {pickTeam(l.match, l.pick)}</span>
                      <span style={{ color: INK_SOFT }}> @ {l.odds.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ====== Footer légal fictif ====== */}
      <div style={{
        background: DARK, color: '#9aa0aa', padding: '10px 20px',
        fontSize: 10, textAlign: 'center', borderTop: `1px solid ${BORDER}`,
      }}>
        © 2026 GambleBet.fr · Les jeux d'argent présentent des risques · Jouez avec modération · Ce site est 100 % fictif (jeu)
      </div>
    </div>
  );
};

export default GambleBetScreen;
