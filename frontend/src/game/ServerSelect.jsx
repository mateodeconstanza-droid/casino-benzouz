import React, { useEffect, useState } from 'react';
import { fetchServers, MULTIPLAYER_AVAILABLE } from '@/game/multiplayer';

// Écran de sélection de mode : Solo ou l'un des 2 serveurs en ligne.
const ServerSelect = ({ onChoose, casino }) => {
  const [servers, setServers] = useState([
    { id: 'alpha', label: 'Alpha', region: 'EU West', maxPlayers: 50, online: 0 },
    { id: 'beta', label: 'Beta', region: 'US East', maxPlayers: 50, online: 0 },
  ]);
  const [loading, setLoading] = useState(MULTIPLAYER_AVAILABLE);
  const [error, setError] = useState(MULTIPLAYER_AVAILABLE ? null : "Multijoueur indisponible sur cette plateforme (pas de backend). Joue en Solo.");
  const [retrying, setRetrying] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);

  const load = async (isRetry = false) => {
    if (!MULTIPLAYER_AVAILABLE) { setLoading(false); return; }
    if (isRetry) setRetrying(true);
    const res = await fetchServers();
    if (res?.servers) {
      setServers(res.servers);
      setError(null);
      setRetryAttempts(0);
    } else {
      // Cold-start Render = ~50 s avant la 1re réponse ; on rallonge le
      // message pour rassurer l'utilisateur.
      setError("Serveur en sommeil — il met ~50 s à se réveiller (free tier). Réessaye dans une minute.");
      setRetryAttempts((n) => n + 1);
    }
    setLoading(false);
    if (isRetry) setRetrying(false);
  };

  useEffect(() => {
    load();
    if (!MULTIPLAYER_AVAILABLE) return;
    // Refresh fréquence : 5 s normalement, 10 s si on est en erreur (économie)
    const iv = setInterval(() => load(), 5000);
    return () => clearInterval(iv);
  }, []);

  const choose = (mode, serverId = null) => {
    onChoose({ mode, serverId });
  };

  const bg = casino?.bg || '#0a0a1a';
  const gold = '#ffd700';

  return (
    <div
      data-testid="server-select-root"
      style={{
        position: 'fixed', inset: 0, zIndex: 1200,
        background: `radial-gradient(ellipse at center, #1a0822 0%, ${bg} 60%, #000 100%)`,
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Georgia, serif', padding: 20, overflow: 'auto',
      }}
    >
      <div style={{ width: '100%', maxWidth: 780 }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <h1 style={{ fontSize: 40, margin: 0, color: gold, letterSpacing: 2 }}>
            ♠ GAMBLELIFE ♠
          </h1>
          <p style={{ fontSize: 16, opacity: 0.85, margin: '10px 0 0' }}>
            Choisis ton mode de jeu
          </p>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', opacity: 0.7, marginBottom: 16 }}>
            Chargement des serveurs…
          </div>
        )}
        {error && (
          <div style={{
            background: 'rgba(220,60,60,0.15)', border: '1px solid #a33',
            color: '#faa', padding: 12, borderRadius: 8,
            marginBottom: 16, textAlign: 'center', fontSize: 13,
          }}>
            <div>{error}</div>
            {MULTIPLAYER_AVAILABLE && (
              <button
                data-testid="server-retry-btn"
                onClick={() => load(true)}
                disabled={retrying}
                style={{
                  marginTop: 10, padding: '8px 18px', borderRadius: 6,
                  background: retrying ? '#444' : 'linear-gradient(135deg, #b08000, #ffd700)',
                  border: 'none', color: retrying ? '#888' : '#111',
                  cursor: retrying ? 'wait' : 'pointer',
                  fontWeight: 800, fontSize: 12, letterSpacing: 1,
                  fontFamily: 'inherit',
                }}>
                {retrying ? '⟳ TENTATIVE…' : `🔄 RÉESSAYER ${retryAttempts > 0 ? `(${retryAttempts})` : ''}`}
              </button>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {/* Solo */}
          <button
            data-testid="server-choose-solo"
            onClick={() => choose('solo')}
            style={{
              background: 'linear-gradient(180deg, #222 0%, #0a0a0a 100%)',
              border: `2px solid ${gold}`, borderRadius: 12, padding: 20,
              color: '#fff', cursor: 'pointer', textAlign: 'left',
              fontFamily: 'inherit', transition: 'transform .15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: 26, marginBottom: 6 }}>🎮</div>
            <div style={{ color: gold, fontSize: 20, fontWeight: 700, marginBottom: 4 }}>SOLO</div>
            <div style={{ fontSize: 12, opacity: 0.8, lineHeight: 1.5 }}>
              Hors ligne · Progression locale<br />
              NPCs IA uniquement<br />
              Aucune latence
            </div>
          </button>

          {/* Serveurs en ligne */}
          {servers.map((s) => {
            const full = s.online >= s.maxPlayers;
            const disabled = !MULTIPLAYER_AVAILABLE || full;
            return (
              <button
                key={s.id}
                data-testid={`server-choose-${s.id}`}
                onClick={() => !disabled && choose('online', s.id)}
                disabled={disabled}
                style={{
                  background: 'linear-gradient(180deg, #2a0828 0%, #0a0814 100%)',
                  border: `2px solid ${disabled ? '#555' : '#e00e1a'}`,
                  borderRadius: 12, padding: 20, cursor: disabled ? 'not-allowed' : 'pointer',
                  color: '#fff', textAlign: 'left',
                  fontFamily: 'inherit', opacity: disabled ? 0.4 : 1,
                  transition: 'transform .15s',
                }}
                onMouseEnter={(e) => !disabled && (e.currentTarget.style.transform = 'translateY(-3px)')}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: 26, marginBottom: 6 }}>🌐</div>
                <div style={{ color: disabled ? '#888' : '#ff5565', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                  SERVEUR {s.label.toUpperCase()}
                </div>
                <div style={{ fontSize: 12, opacity: 0.8, lineHeight: 1.5 }}>
                  {s.region}<br />
                  {MULTIPLAYER_AVAILABLE ? (
                    <>Joueurs connectés : <b style={{ color: '#7fff7f' }}>{s.online}</b> / {s.maxPlayers}<br /></>
                  ) : (
                    <>Indisponible<br /></>
                  )}
                  {full ? '⚠️ Serveur complet' : MULTIPLAYER_AVAILABLE ? 'PvP activé · Chat public' : 'Nécessite un backend en ligne'}
                </div>
                {MULTIPLAYER_AVAILABLE && !full && (
                  <div style={{
                    marginTop: 10, display: 'inline-block',
                    padding: '3px 10px', background: '#e00e1a', borderRadius: 4,
                    fontSize: 11, fontWeight: 700, letterSpacing: 1,
                  }}>● EN LIGNE</div>
                )}
              </button>
            );
          })}
        </div>

        <div style={{
          marginTop: 28, fontSize: 11, color: '#777', textAlign: 'center', lineHeight: 1.5,
        }}>
          En ligne : les autres joueurs sont visibles en temps réel dans le casino, avec chat public et PvP activé.
          <br />
          Ton solde et ta progression restent locaux (localStorage) quel que soit le mode.
        </div>
      </div>
    </div>
  );
};

export default ServerSelect;
