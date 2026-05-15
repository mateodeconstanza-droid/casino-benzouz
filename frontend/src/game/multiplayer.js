// Client WebSocket multijoueur pour GambleLife.
// Connecte à /api/mp/ws/<server>/<username> et expose callbacks.

// Priorité : variable d'env explicite > même domaine que le frontend (déploiement unifié)
const ENV_BACKEND = process.env.REACT_APP_BACKEND_URL || '';
const BACKEND = ENV_BACKEND || (typeof window !== 'undefined' ? window.location.origin : '');
const wsBase = BACKEND.replace(/^http/, 'ws');

// Exporté pour que ServerSelect/Lobby sachent si le multi est disponible
export const MULTIPLAYER_AVAILABLE = !!BACKEND;

export class MPClient {
  constructor({ serverId, username, onMessage, onOpen, onClose }) {
    this.serverId = serverId;
    this.username = username;
    this.onMessage = onMessage;
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.ws = null;
    this.closed = false;
    this.reconnectAttempts = 0;
    this.heartbeatTimer = null;
    this.lastPong = 0;
  }

  _startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.lastPong = Date.now();
    this.heartbeatTimer = setInterval(() => {
      if (!this.ws || this.ws.readyState !== 1) return;
      // Si pas de pong depuis 60s → la connexion est morte, force reconnect
      if (Date.now() - this.lastPong > 60000) {
        try { this.ws.close(); } catch (_e) {}
        return;
      }
      try { this.ws.send(JSON.stringify({ type: 'ping' })); } catch (_e) {}
    }, 25000); // ping toutes les 25s pour éviter le timeout des proxys (Render/Cloudflare ~30s idle)
  }

  _stopHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }

  connect() {
    if (!this.serverId || !this.username) return;
    if (!BACKEND) {
      this.closed = true;
      this.onClose && this.onClose();
      return;
    }
    const url = `${wsBase}/api/mp/ws/${encodeURIComponent(this.serverId)}/${encodeURIComponent(this.username)}`;
    try {
      this.ws = new WebSocket(url);
    } catch (_e) {
      return;
    }
    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this._startHeartbeat();
      this.onOpen && this.onOpen();
    };
    this.ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'pong') {
          this.lastPong = Date.now();
          return; // pong est consommé en interne, pas exposé
        }
        this.onMessage && this.onMessage(msg);
      } catch (_e) { /* noop */ }
    };
    this.ws.onclose = () => {
      this._stopHeartbeat();
      this.onClose && this.onClose();
      if (!this.closed && this.reconnectAttempts < 5) {
        this.reconnectAttempts += 1;
        setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
      }
    };
    this.ws.onerror = () => {
      try { this.ws && this.ws.close(); } catch (_e) { /* noop */ }
    };
  }

  send(obj) {
    if (!this.ws || this.ws.readyState !== 1) return;
    try { this.ws.send(JSON.stringify(obj)); } catch (_e) { /* noop */ }
  }

  sendPos(x, y, z, rotY, weapon, extras = {}) {
    this.send({ type: 'pos', x, y, z, rotY, weapon, ...extras });
  }

  sendChat(text) {
    this.send({ type: 'chat', text });
  }

  sendShot(fromX, fromY, fromZ, tx, ty, tz, weapon) {
    this.send({ type: 'shot', x: fromX, y: fromY, z: fromZ, tx, ty, tz, weapon });
  }

  sendHit(targetId, weapon, dmg = 25) {
    this.send({ type: 'hit', target: targetId, weapon, dmg });
  }

  close() {
    this.closed = true;
    this._stopHeartbeat();
    try { this.ws && this.ws.close(); } catch (_e) { /* noop */ }
  }
}

export const fetchServers = async () => {
  if (!BACKEND) return null;
  try {
    const res = await fetch(`${BACKEND}/api/mp/servers`);
    if (!res.ok) return null;
    return await res.json();
  } catch (_e) {
    return null;
  }
};

// ============================================================
// LEADERBOARD — communication backend
// ============================================================
export const submitLeaderboard = async (entry) => {
  if (!BACKEND) return null;
  try {
    const res = await fetch(`${BACKEND}/api/leaderboard/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    return res.ok ? await res.json() : null;
  } catch (_e) {
    return null;
  }
};

// ============================================================
// AUTH — register / login / check-pseudo
// ============================================================
const authCall = async (path, body) => {
  if (!BACKEND) return { ok: false, error: 'Backend offline' };
  try {
    const res = await fetch(`${BACKEND}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.detail || `HTTP ${res.status}` };
    return { ok: true, ...data };
  } catch (e) {
    return { ok: false, error: 'Réseau indisponible' };
  }
};

export const checkPseudoAvailable = async (pseudo, email = null) =>
  authCall('/api/auth/check-pseudo', { pseudo, email });
export const registerAccount = async ({ email, pseudo, password }) =>
  authCall('/api/auth/register', { email, pseudo, password });
export const loginAccount = async ({ email, password }) =>
  authCall('/api/auth/login', { email, password });
// === Google OAuth — envoie l'ID token JWT reçu de Google au backend ===
export const loginWithGoogle = async ({ credential, pseudo = null }) =>
  authCall('/api/auth/google', { credential, pseudo });

// Côté frontend : client ID Google OAuth.
// Configure REACT_APP_GOOGLE_CLIENT_ID dans .env.local (build time).
// Si vide → le bouton Google est caché automatiquement.
export const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

// ============================================================
// SESSION TOKEN — stocké en localStorage, envoyé en Authorization
// ============================================================
const TOKEN_KEY = 'gamblelife_token';

export const getAuthToken = () => {
  try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (_e) { return ''; }
};

export const setAuthToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch (_e) { /* noop */ }
};

const authedFetch = async (path, options = {}) => {
  if (!BACKEND) return { ok: false, error: 'Backend offline' };
  const token = getAuthToken();
  if (!token) return { ok: false, error: 'Pas de session — reconnecte-toi' };
  try {
    const res = await fetch(`${BACKEND}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) setAuthToken(''); // session morte → nettoie
      return { ok: false, error: data.detail || `HTTP ${res.status}` };
    }
    return { ok: true, ...data };
  } catch (e) {
    return { ok: false, error: 'Réseau indisponible' };
  }
};

// === Profil cloud : GET le profil sauvé serveur (cross-device) ===
export const fetchCloudProfile = async () => authedFetch('/api/profile');

// === Profil cloud : PUT — synchronise le profil local vers le serveur ===
export const syncCloudProfile = async (profile) =>
  authedFetch('/api/profile', { method: 'PUT', body: JSON.stringify({ profile }) });

// Logout côté serveur (révoque le token)
export const serverLogout = async () => authedFetch('/api/auth/logout', { method: 'POST' });

export const fetchLeaderboard = async ({ country = '', limit = 50 } = {}) => {
  if (!BACKEND) return null;
  try {
    const q = new URLSearchParams();
    if (country) q.set('country', country);
    q.set('limit', String(limit));
    const res = await fetch(`${BACKEND}/api/leaderboard?${q.toString()}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (_e) {
    return null;
  }
};
