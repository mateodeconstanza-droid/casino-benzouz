// Client WebSocket multijoueur pour GambleLife.
// Connecte à /api/mp/ws/<server>/<username> et expose callbacks.

const BACKEND = process.env.REACT_APP_BACKEND_URL || '';
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
  }

  connect() {
    if (!this.serverId || !this.username) return;
    if (!BACKEND) {
      // Pas de backend configuré (déployé sur Vercel sans WS) : abandonner proprement
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
      this.onOpen && this.onOpen();
    };
    this.ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        this.onMessage && this.onMessage(msg);
      } catch (_e) { /* noop */ }
    };
    this.ws.onclose = () => {
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
