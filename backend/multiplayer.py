"""
Multijoueur temps réel pour Benz Casino.
2 serveurs (alpha, beta) avec présence + chat + tirs PvP.
Chaque serveur est un ConnectionManager en mémoire (pas de persistance ; les joueurs
se reconnectent si le serveur redémarre).
"""
import json
import asyncio
import logging
import time
from collections import defaultdict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

mp_router = APIRouter(prefix="/api/mp")

# --- Configuration des serveurs ---
SERVERS = {
    "alpha": {"id": "alpha", "label": "Alpha", "region": "EU West", "maxPlayers": 50},
    "beta": {"id": "beta", "label": "Beta", "region": "US East", "maxPlayers": 50},
}

# État en mémoire par serveur
class ServerState:
    def __init__(self, server_id: str):
        self.server_id = server_id
        self.players: dict[str, dict] = {}  # pid -> {name, x, y, z, rotY, hp, kills, deaths, skin, outfit, hair}
        self.sockets: dict[str, WebSocket] = {}  # pid -> ws
        self.chat_log: list[dict] = []
        self.lock = asyncio.Lock()

    async def broadcast(self, payload: dict, exclude: str | None = None):
        """Diffuse en parallèle à tous les clients (jusqu'à 50). Un client lent
        ne bloque pas les autres. Les clients qui plantent sont retirés."""
        msg = json.dumps(payload)
        targets = [(pid, ws) for pid, ws in list(self.sockets.items())
                   if not (exclude and pid == exclude)]
        if not targets:
            return

        async def _send(pid, ws):
            try:
                # timeout 1s pour éviter qu'un socket gelé bloque la boucle snapshot
                await asyncio.wait_for(ws.send_text(msg), timeout=1.0)
                return None
            except Exception:
                return pid

        results = await asyncio.gather(*(_send(pid, ws) for pid, ws in targets), return_exceptions=False)
        dead = [pid for pid in results if pid]
        for pid in dead:
            await self.remove(pid)

    async def add(self, pid: str, ws: WebSocket, player: dict):
        async with self.lock:
            self.sockets[pid] = ws
            self.players[pid] = player

    async def remove(self, pid: str):
        async with self.lock:
            self.sockets.pop(pid, None)
            self.players.pop(pid, None)

    def snapshot(self):
        return list(self.players.values())


SERVER_STATES: dict[str, ServerState] = {sid: ServerState(sid) for sid in SERVERS}


@mp_router.get("/servers")
async def list_servers():
    """Liste les serveurs + nombre de joueurs connectés."""
    return {
        "servers": [
            {**meta, "online": len(SERVER_STATES[sid].players)}
            for sid, meta in SERVERS.items()
        ]
    }


@mp_router.websocket("/ws/{server_id}/{username}")
async def mp_ws(websocket: WebSocket, server_id: str, username: str):
    if server_id not in SERVER_STATES:
        await websocket.close(code=4404, reason="Unknown server")
        return
    state = SERVER_STATES[server_id]

    # Vérifier la capacité serveur (50 max)
    max_players = SERVERS[server_id].get("maxPlayers", 50)
    if len(state.players) >= max_players:
        await websocket.close(code=4403, reason="Server full")
        return

    await websocket.accept()
    now = time.time()
    pid = None
    me = None

    # CRITIQUE : choix du pseudo + insertion atomiques pour éviter:
    # (a) deux clients avec même username qui se voient attribuer le même pid
    # (b) un snapshot_loop qui envoie un snapshot au nouveau socket avant son welcome
    try:
        async with state.lock:
            base = (username or "Anon").strip()[:16] or "Anon"
            pid = base
            i = 2
            while pid in state.players:
                pid = f"{base}{i}"
                i += 1
            me = {
                "id": pid, "name": pid,
                "x": 0.0, "y": 1.7, "z": 0.0, "rotY": 0.0,
                "hp": 100, "kills": 0, "deaths": 0,
                "skin": "#e0b48a", "outfit": 0, "hair": 0,
                "weapon": None,
                "lastSeen": now,
            }
            # Snapshot des autres joueurs AVANT d'ajouter self
            others = list(state.players.values())
            # IMPORTANT: envoyer welcome AVANT d'ajouter le socket à state.sockets,
            # sinon snapshot_loop peut envoyer un snapshot d'abord -> client crash.
            await websocket.send_text(json.dumps({
                "type": "welcome",
                "you": me,
                "players": others + [me],
                "chat": state.chat_log[-30:],
                "server": SERVERS[server_id],
            }))
            # Maintenant on peut publier le socket (snapshot_loop peut l'utiliser)
            state.sockets[pid] = websocket
            state.players[pid] = me
        # Hors du lock : informer les autres qu'un joueur arrive
        await state.broadcast({"type": "player_joined", "player": me}, exclude=pid)
        logger.info(f"[mp] {pid} joined {server_id} ({len(state.players)}/{max_players})")
    except Exception as e:
        logger.error(f"[mp] init failed for {username}@{server_id}: {e}")
        try:
            await websocket.close()
        except Exception:
            pass
        return

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except Exception:
                continue
            mtype = msg.get("type")

            if mtype == "pos":
                p = state.players.get(pid)
                if not p:
                    break
                p["x"] = float(msg.get("x", p["x"]))
                p["y"] = float(msg.get("y", p["y"]))
                p["z"] = float(msg.get("z", p["z"]))
                p["rotY"] = float(msg.get("rotY", p["rotY"]))
                p["weapon"] = msg.get("weapon")
                p["skin"] = msg.get("skin", p.get("skin"))
                p["outfit"] = msg.get("outfit", p.get("outfit"))
                p["hair"] = msg.get("hair", p.get("hair"))
                p["lastSeen"] = time.time()
                # Pas de broadcast par pos individuelle, on enverra un snapshot périodique

            elif mtype == "chat":
                text = (msg.get("text") or "").strip()[:200]
                if not text:
                    continue
                entry = {"from": pid, "text": text, "ts": time.time()}
                state.chat_log.append(entry)
                state.chat_log = state.chat_log[-100:]
                await state.broadcast({"type": "chat", **entry})

            elif mtype == "shot":
                # Broadcast le tir pour que les autres voient
                shot = {
                    "type": "shot", "from": pid,
                    "x": float(msg.get("x", 0)), "y": float(msg.get("y", 1.5)), "z": float(msg.get("z", 0)),
                    "tx": float(msg.get("tx", 0)), "ty": float(msg.get("ty", 1.5)), "tz": float(msg.get("tz", 0)),
                    "weapon": msg.get("weapon", "gun"),
                }
                await state.broadcast(shot, exclude=pid)

            elif mtype == "hit":
                # Signal que `from` a tiré sur `target`
                target_id = msg.get("target")
                weapon = msg.get("weapon", "gun")
                dmg = int(msg.get("dmg", 25))
                target = state.players.get(target_id)
                if not target or target_id == pid:
                    continue
                target["hp"] = max(0, target.get("hp", 100) - dmg)
                if target["hp"] <= 0:
                    # Kill
                    state.players[pid]["kills"] = state.players[pid].get("kills", 0) + 1
                    target["deaths"] = target.get("deaths", 0) + 1
                    await state.broadcast({
                        "type": "kill",
                        "killer": pid, "victim": target_id, "weapon": weapon,
                    })
                    # Respawn après 4s côté serveur
                    async def respawn(tid):
                        await asyncio.sleep(4.0)
                        t = state.players.get(tid)
                        if t:
                            t["hp"] = 100
                            t["x"], t["z"] = 0.0, 0.0
                            await state.broadcast({"type": "respawn", "player": tid})
                    asyncio.create_task(respawn(target_id))
                else:
                    await state.broadcast({
                        "type": "damage", "target": target_id, "attacker": pid,
                        "hp": target["hp"], "weapon": weapon,
                    })

            elif mtype == "ping":
                await websocket.send_text(json.dumps({"type": "pong", "ts": time.time()}))

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"[mp] ws error for {pid}: {e}")
    finally:
        await state.remove(pid)
        try:
            await state.broadcast({"type": "player_left", "id": pid})
        except Exception:
            pass


# Tâche de fond : diffuse un snapshot adaptatif
#   ≤10 joueurs : 120 ms (8.3 Hz) — fluidité max pour petits serveurs
#   11-25      : 180 ms (5.5 Hz)
#   26-50      : 250 ms (4 Hz)   — réduit la charge réseau sur les gros serveurs
#
# Bonus : timeout des joueurs idle (> 30 s sans message). Évite les avatars
# fantômes qui restent sur les autres clients quand un socket meurt sans
# fermeture propre (mobile qui rentre en background trop longtemps).
IDLE_TIMEOUT_S = 30.0


async def snapshot_loop():
    last_idle_check = 0.0
    while True:
        # Sleep dynamique : on prend le serveur le plus chargé comme référence
        max_players = max((len(s.players) for s in SERVER_STATES.values()), default=0)
        if max_players <= 10:
            delay = 0.12
        elif max_players <= 25:
            delay = 0.18
        else:
            delay = 0.25
        await asyncio.sleep(delay)

        now = time.time()
        # Check joueurs idle 1×/s
        check_idle = (now - last_idle_check) > 1.0
        if check_idle:
            last_idle_check = now

        for state in SERVER_STATES.values():
            if not state.sockets:
                continue
            # Timeout idle : déconnecte ceux qui n'ont rien envoyé depuis 30s
            # Ils seront broadcastés "player_left" automatiquement par le finally.
            if check_idle:
                to_kick = []
                for pid, p in list(state.players.items()):
                    if (now - p.get("lastSeen", now)) > IDLE_TIMEOUT_S:
                        to_kick.append(pid)
                for pid in to_kick:
                    ws = state.sockets.get(pid)
                    if ws:
                        try:
                            await ws.close(code=4408, reason="Idle timeout")
                        except Exception:
                            pass
                    # Le close() côté serveur déclenche le finally du ws handler
                    # qui fait state.remove + broadcast player_left.
            try:
                await state.broadcast({
                    "type": "snapshot",
                    "players": state.snapshot(),
                })
            except Exception:
                pass


_snapshot_task = None


def start_snapshot_loop():
    global _snapshot_task
    if _snapshot_task is None:
        loop = asyncio.get_event_loop()
        _snapshot_task = loop.create_task(snapshot_loop())
