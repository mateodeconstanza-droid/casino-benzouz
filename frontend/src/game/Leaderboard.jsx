import React, { useEffect, useState } from 'react';
import { fmt } from '@/game/constants';
import { fetchLeaderboard, MULTIPLAYER_AVAILABLE } from '@/game/multiplayer';
import { Banner } from '@/game/Banners';

// =============================================================
// <Leaderboard> — classement mondial / national par totalWinnings.
// 2 onglets : MONDIAL et NATIONAL (utilise navigator.language pour
// déduire le pays ISO).
// =============================================================
const guessCountry = () => {
  if (typeof navigator === 'undefined') return 'FR';
  const raw = (navigator.language || 'fr-FR').toUpperCase();
  const m = raw.match(/[-_]([A-Z]{2})/);
  return m ? m[1] : (raw.length === 2 ? raw : 'FR');
};

export const Leaderboard = ({ profile, onClose }) => {
  const [scope, setScope] = useState('global'); // 'global' | 'national'
  const [country] = useState(profile?.country || guessCountry());
  const [data, setData] = useState({ entries: [], count: 0, country: 'global' });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setErr(null);
      const c = scope === 'global' ? '' : country;
      const res = await fetchLeaderboard({ country: c, limit: 50 });
      if (cancelled) return;
      if (res) setData(res);
      else setErr('Impossible de charger le classement (serveur en sommeil ?)');
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [scope, country]);

  const myRank = data.entries.findIndex((e) => e.name === profile?.name) + 1;

  return (
    <div
      data-testid="leaderboard-modal"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 600,
        background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, fontFamily: 'Georgia, serif',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg, #0f0a18, #050208)',
          border: '2px solid #d4af37', borderRadius: 16,
          maxWidth: 720, width: '100%', maxHeight: '92vh', overflowY: 'auto',
          color: '#fff', padding: 22,
          boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(212,175,55,0.18)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: '#cca366', letterSpacing: 2 }}>CLASSEMENT</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#ffd700', letterSpacing: 1.5 }}>
              🏆 TOP JOUEURS
            </div>
          </div>
          <button onClick={onClose} style={{
            padding: '8px 16px', borderRadius: 8,
            background: 'transparent', border: '1px solid #d4af37',
            color: '#d4af37', cursor: 'pointer', fontWeight: 800,
            fontFamily: 'inherit',
          }}>✕ FERMER</button>
        </div>

        {/* Onglets */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {['global', 'national'].map((k) => (
            <button
              key={k}
              onClick={() => setScope(k)}
              data-testid={`leaderboard-tab-${k}`}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 8,
                background: scope === k
                  ? 'linear-gradient(135deg, #b08000, #ffd700)'
                  : 'rgba(255,255,255,0.05)',
                color: scope === k ? '#111' : '#cca366',
                border: `1px solid ${scope === k ? '#ffd700' : 'rgba(212,175,55,0.3)'}`,
                fontWeight: 900, fontSize: 12, letterSpacing: 1.5,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
              {k === 'global' ? '🌍 MONDIAL' : `🇫🇷 ${country}`}
            </button>
          ))}
        </div>

        {/* Mon rang */}
        {profile && myRank > 0 && (
          <div style={{
            padding: 10, marginBottom: 12, borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(212,175,55,0.18), rgba(212,175,55,0.05))',
            border: '1px solid rgba(212,175,55,0.4)',
            textAlign: 'center', fontSize: 13,
          }}>
            Tu es <b style={{ color: '#ffd700', fontSize: 16 }}>#{myRank}</b> dans le classement {scope === 'global' ? 'mondial' : 'national'}
          </div>
        )}

        {/* Liste */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 30, color: '#cca366' }}>
            ⟳ Chargement…
          </div>
        )}
        {err && (
          <div style={{
            padding: 14, borderRadius: 8,
            background: 'rgba(220,60,60,0.15)', border: '1px solid #a33',
            color: '#faa', textAlign: 'center', fontSize: 13,
          }}>{err}</div>
        )}
        {!loading && !err && data.entries.length === 0 && (
          <div style={{
            padding: 30, textAlign: 'center', color: '#888',
            background: 'rgba(255,255,255,0.03)', borderRadius: 8,
            fontStyle: 'italic',
          }}>
            Aucun joueur classé pour le moment. Joue dans le casino et tes gains seront enregistrés ici !
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {data.entries.map((e, i) => {
            const isMine = profile?.name === e.name;
            const rank = i + 1;
            const rankColor = rank === 1 ? '#ffd700' : rank === 2 ? '#c0c0c0' : rank === 3 ? '#cd7f32' : '#888';
            return (
              <div
                key={e.name}
                data-testid={`leaderboard-row-${rank}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 8,
                  background: isMine ? 'rgba(212,175,55,0.18)' : (rank <= 3 ? 'rgba(255,255,255,0.04)' : 'transparent'),
                  border: `1px solid ${isMine ? '#ffd700' : 'transparent'}`,
                }}>
                {/* Rang */}
                <div style={{
                  width: 36, textAlign: 'center', fontSize: rank <= 3 ? 20 : 14, fontWeight: 900,
                  color: rankColor,
                }}>
                  {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                </div>
                {/* Mini bannière */}
                <div style={{ flex: '0 0 auto' }}>
                  <Banner id={e.equippedBanner || 'b-default'} width={48} height={32} showName={false} />
                </div>
                {/* Nom + drapeau pays */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 800,
                    color: isMine ? '#ffd700' : '#fff',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{e.name} {isMine && <span style={{ color: '#a8e88a', fontSize: 11 }}>(toi)</span>}</div>
                  <div style={{ fontSize: 10, color: '#aaa' }}>
                    🌐 {e.country} · {e.sessions || 0} sessions
                  </div>
                </div>
                {/* Gains */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#00ff88' }}>
                    {fmt(e.totalWinnings || 0)} $
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!MULTIPLAYER_AVAILABLE && (
          <div style={{
            marginTop: 14, padding: 10, borderRadius: 8,
            background: 'rgba(60,60,60,0.3)', border: '1px solid #555',
            color: '#aaa', fontSize: 11, textAlign: 'center', fontStyle: 'italic',
          }}>
            ⚠️ Backend hors ligne — le classement n'est pas mis à jour.
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
