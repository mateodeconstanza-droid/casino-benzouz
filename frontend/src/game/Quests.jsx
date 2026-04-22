import React, { useEffect, useState } from 'react';
import { fmt } from '@/game/constants';

// ============== QUÊTES QUOTIDIENNES ==============
// Rotations journalières, fenêtre 24h. Chaque quête donne une récompense en Benzouz.
// Les progrès sont stockés dans profile.dailyQuests = { date: 'YYYY-MM-DD', items: [{id, progress, claimed}] }

const TEMPLATES = [
  { id: 'bj_wins',     label: 'Gagner 3 mains de Blackjack',     target: 3,  reward: 15000,  cat: 'table' },
  { id: 'poker_show',  label: 'Terminer 2 parties de Poker',      target: 2,  reward: 20000,  cat: 'table' },
  { id: 'roulette_bet',label: 'Placer 10 mises à la Roulette',    target: 10, reward: 12000,  cat: 'table' },
  { id: 'high_card',   label: 'Gagner 5 fois à Carte Haute',      target: 5,  reward: 10000,  cat: 'table' },
  { id: 'shop_buy',    label: 'Acheter 1 article à la Boutique',  target: 1,  reward: 25000,  cat: 'shop'  },
  { id: 'cosmetic_try',label: 'Équiper un cosmétique différent',  target: 1,  reward: 8000,   cat: 'shop'  },
  { id: 'wheel_spin',  label: 'Tourner la roue de la fortune',    target: 1,  reward: 15000,  cat: 'misc'  },
  { id: 'kill_dealer', label: 'Abattre 1 croupier',               target: 1,  reward: 50000,  cat: 'combat'},
  { id: 'bar_order',   label: 'Commander au bar',                 target: 1,  reward: 5000,   cat: 'misc'  },
  { id: 'sport_bet',   label: 'Poser un pari BenzBet',            target: 1,  reward: 30000,  cat: 'misc'  },
];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function rollDailyQuests(existing) {
  const today = todayKey();
  if (existing && existing.date === today && existing.items) return existing;
  // Pick 3 deterministic quests for the day (using date hash)
  const seed = today.split('-').join('');
  const hash = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0xffffffff, 0);
  const shuffled = TEMPLATES.slice().sort((a, b) => ((a.id.charCodeAt(0) + hash) % 7) - ((b.id.charCodeAt(0) + hash) % 7));
  const picked = shuffled.slice(0, 3);
  return { date: today, items: picked.map(p => ({ id: p.id, progress: 0, claimed: false })) };
}

export function progressQuest(profile, questId, delta = 1) {
  const dq = rollDailyQuests(profile.dailyQuests);
  const items = dq.items.map(it => it.id === questId ? { ...it, progress: it.progress + delta } : it);
  return { ...profile, dailyQuests: { ...dq, items } };
}

export function QuestScreen({ profile, balance, setBalance, saveProfile, setProfile, onClose, casino }) {
  const [dq, setDq] = useState(() => rollDailyQuests(profile.dailyQuests));

  useEffect(() => {
    // Sync roll into profile if new day
    if (!profile.dailyQuests || profile.dailyQuests.date !== dq.date) {
      const p = { ...profile, dailyQuests: dq };
      setProfile(p); saveProfile(p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tplById = (id) => TEMPLATES.find(t => t.id === id);

  const claim = async (item) => {
    const tpl = tplById(item.id);
    if (!tpl) return;
    if (item.progress < tpl.target || item.claimed) return;
    const newItems = dq.items.map(it => it.id === item.id ? { ...it, claimed: true } : it);
    const newDq = { ...dq, items: newItems };
    setDq(newDq);
    setBalance(balance + tpl.reward);
    const p = { ...profile, dailyQuests: newDq, balance: balance + tpl.reward };
    setProfile(p); await saveProfile(p);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 500, padding: 20,
    }} data-testid="quest-screen">
      <div style={{
        background: 'linear-gradient(180deg, #140a0a, #080404)',
        border: `2px solid ${casino.primary}`, borderRadius: 14,
        padding: 24, maxWidth: 560, width: '100%', color: '#fff',
        fontFamily: 'Georgia, serif', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: `0 0 40px ${casino.primary}30`,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 12, letterSpacing: 3, color: '#cca366' }}>• • • QUÊTES DU JOUR • • •</div>
          <h2 style={{ color: casino.secondary, margin: '6px 0 2px', fontSize: 26 }}>🎯 Daily Quests</h2>
          <div style={{ fontSize: 12, color: '#cca366' }}>Nouvelles quêtes chaque jour à minuit</div>
        </div>

        <div style={{ margin: '18px 0', display: 'grid', gap: 10 }}>
          {dq.items.map(item => {
            const tpl = tplById(item.id);
            if (!tpl) return null;
            const pct = Math.min(100, (item.progress / tpl.target) * 100);
            const ready = item.progress >= tpl.target && !item.claimed;
            return (
              <div key={item.id}
                data-testid={`quest-${item.id}`}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${item.claimed ? '#2a2a2a' : ready ? casino.secondary : '#3a2a18'}`,
                  borderRadius: 10, padding: 14,
                  opacity: item.claimed ? .5 : 1,
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: 14 }}>{tpl.label}</div>
                    <div style={{ fontSize: 11, color: '#cca366', marginTop: 2 }}>
                      Récompense : <span style={{ color: casino.secondary }}>{fmt(tpl.reward)} B</span>
                    </div>
                  </div>
                  <button
                    onClick={() => claim(item)}
                    disabled={!ready}
                    data-testid={`quest-claim-${item.id}`}
                    style={{
                      padding: '8px 14px', fontSize: 12, whiteSpace: 'nowrap',
                      background: item.claimed ? '#1a1a1a' : ready ? `linear-gradient(135deg, ${casino.primary}, ${casino.accent})` : '#333',
                      color: '#fff', border: 'none', borderRadius: 6,
                      cursor: ready ? 'pointer' : 'not-allowed',
                      fontFamily: 'inherit', fontWeight: 'bold',
                    }}>
                    {item.claimed ? '✓ PRIS' : ready ? 'RÉCLAMER' : `${item.progress}/${tpl.target}`}
                  </button>
                </div>
                <div style={{
                  marginTop: 8, height: 4, background: 'rgba(255,255,255,0.08)',
                  borderRadius: 2, overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    background: `linear-gradient(90deg, ${casino.primary}, ${casino.secondary})`,
                    transition: 'width .3s',
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={onClose} style={{
          width: '100%', padding: 12,
          background: 'transparent', border: `1px solid ${casino.secondary}`,
          color: casino.secondary, borderRadius: 8,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>Fermer</button>
      </div>
    </div>
  );
}

export default QuestScreen;
