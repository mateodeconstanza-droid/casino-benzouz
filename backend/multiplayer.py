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
    "alpha": {"id": "alpha", "label": "Alpha", "region": "EU West", "maxPlayers": 30},
    "beta": {"id": "beta", "label": "Beta", "region": "US East", "maxPlayers": 30},
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
        dead = []
        msg = json.dumps(payload)
        for pid, ws in list(self.sockets.items()):
            if exclude and pid == exclude:
                continue
            try:
                await ws.send_text(msg)
            except Exception:
                dead.append(pid)
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

    # Pseudo unique : si déjà pris, suffixer
    base = (username or "Anon").strip()[:16] or "Anon"
    pid = base
    i = 2
    while pid in state.players:
        pid = f"{base}{i}"
        i += 1

    await websocket.accept()
    now = time.time()
    me = {
        "id": pid, "name": pid,
        "x": 0.0, "y": 1.7, "z": 0.0, "rotY": 0.0,
        "hp": 100, "kills": 0, "deaths": 0,
        "skin": "#e0b48a", "outfit": 0, "hair": 0,
        "weapon": None,
        "lastSeen": now,
    }
    await state.add(pid, websocket, me)

    # Envoyer welcome + snapshot initial au nouveau
    try:
        await websocket.send_text(json.dumps({
            "type": "welcome",
            "you": me,
            "players": state.snapshot(),
            "chat": state.chat_log[-30:],
            "server": SERVERS[server_id],
        }))
        # Informer les autres qu'un joueur vient d'arriver
        await state.broadcast({"type": "player_joined", "player": me}, exclude=pid)
    except Exception as e:
        logger.error(f"[mp] init broadcast failed: {e}")

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


# Tâche de fond : diffuse un snapshot de tous les joueurs toutes les 120ms
async def snapshot_loop():
    while True:
        await asyncio.sleep(0.12)
        for state in SERVER_STATES.values():
            if not state.sockets:
                continue
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
