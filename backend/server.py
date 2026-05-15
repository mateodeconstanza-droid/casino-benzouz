from fastapi import FastAPI, APIRouter, HTTPException, Header
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import re
import bcrypt
import secrets
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from multiplayer import mp_router, start_snapshot_loop


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)

    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])

    return status_checks


# ============================================================
# AUTH — création de compte par email + pseudo unique
# ============================================================
PSEUDO_RE = re.compile(r"^[A-Za-z0-9_-]{3,20}$")


class RegisterIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: EmailStr
    pseudo: str
    password: str


class LoginIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: EmailStr
    password: str


class CheckPseudoIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    pseudo: str
    email: Optional[str] = None


def _norm_pseudo(p: str) -> str:
    return (p or "").strip()


def _hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt(rounds=10)).decode("utf-8")


def _verify_pw(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


# Pseudos réservés : seul le créateur du jeu (email spécifique) peut
# revendiquer ces noms. Mapping pseudo_lower → email autorisé.
RESERVED_PSEUDOS = {
    "byjaze": "mateodeconstanza@gmail.com",
}


def _is_reserved_pseudo(pseudo_lower: str, email: Optional[str]) -> bool:
    """Retourne True si le pseudo est réservé ET l'email fourni n'est pas
    celui du propriétaire autorisé (donc on doit bloquer)."""
    owner = RESERVED_PSEUDOS.get(pseudo_lower)
    if owner is None:
        return False  # pas réservé
    if not email:
        return True   # réservé et pas d'email → bloquer
    return email.strip().lower() != owner.lower()


@api_router.post("/auth/check-pseudo")
async def check_pseudo(payload: CheckPseudoIn):
    """Vérifie qu'un pseudo est disponible (avant submit du formulaire).
    Si payload.email correspond au propriétaire autorisé d'un pseudo
    réservé, on retourne `available: true` (à condition qu'il ne soit
    pas déjà créé)."""
    p = _norm_pseudo(payload.pseudo)
    if not PSEUDO_RE.match(p):
        return {"available": False, "reason": "format"}
    if _is_reserved_pseudo(p.lower(), payload.email):
        return {"available": False, "reason": "reserved"}
    existing = await db.users.find_one({"pseudo_lower": p.lower()})
    return {"available": existing is None, "reason": None if existing is None else "taken"}


def _new_session_token() -> str:
    """Token cryptographiquement sécurisé pour authentifier les requêtes profil."""
    return secrets.token_urlsafe(32)


async def _issue_token(user_doc: dict) -> str:
    """Génère un token + le persiste sur le user (multi-token possible : on garde
    une liste pour permettre la connexion simultanée sur plusieurs appareils)."""
    token = _new_session_token()
    sessions = user_doc.get("sessions_tokens") or []
    sessions.append({
        "token": token,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    })
    # Cap à 5 tokens (5 appareils max). On expire les plus anciens.
    sessions = sessions[-5:]
    await db.users.update_one(
        {"_id": user_doc.get("_id")} if user_doc.get("_id") else {"email_lower": user_doc["email_lower"]},
        {"$set": {"sessions_tokens": sessions}},
    )
    return token


async def _user_from_token(authorization: Optional[str]) -> dict:
    """Récupère l'utilisateur à partir d'un Authorization: Bearer <token>."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token manquant")
    token = authorization[len("Bearer "):].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Token invalide")
    user = await db.users.find_one({"sessions_tokens.token": token})
    if not user:
        raise HTTPException(status_code=401, detail="Session expirée ou invalide")
    return user


@api_router.post("/auth/register")
async def register(payload: RegisterIn):
    p = _norm_pseudo(payload.pseudo)
    if not PSEUDO_RE.match(p):
        raise HTTPException(status_code=400, detail="Pseudo invalide (3-20 caractères alphanumériques)")
    if _is_reserved_pseudo(p.lower(), payload.email):
        raise HTTPException(status_code=403, detail="Pseudo réservé au créateur du jeu")
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Mot de passe trop court (min. 6 caractères)")
    email_lower = payload.email.lower()
    # Pseudo et email uniques
    if await db.users.find_one({"$or": [{"pseudo_lower": p.lower()}, {"email_lower": email_lower}]}):
        raise HTTPException(status_code=409, detail="Email ou pseudo déjà utilisé")
    doc = {
        "id": str(uuid.uuid4()),
        "email": payload.email,
        "email_lower": email_lower,
        "pseudo": p,
        "pseudo_lower": p.lower(),
        "password_hash": _hash_pw(payload.password),
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "sessions_tokens": [],
        "profile": None,  # synchronisé au premier save
    }
    res = await db.users.insert_one(doc)
    doc["_id"] = res.inserted_id
    token = await _issue_token(doc)
    return {"ok": True, "pseudo": p, "email": payload.email, "token": token}


@api_router.post("/auth/login")
async def login(payload: LoginIn):
    email_lower = payload.email.lower()
    user = await db.users.find_one({"email_lower": email_lower})
    if not user or not _verify_pw(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    token = await _issue_token(user)
    return {"ok": True, "pseudo": user["pseudo"], "email": user["email"], "token": token}


# ============================================================
# PROFIL — GET / PUT pour synchroniser entre appareils
# ============================================================
class ProfileIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    profile: Dict[str, Any]


@api_router.get("/profile")
async def get_profile(authorization: Optional[str] = Header(None)):
    user = await _user_from_token(authorization)
    return {
        "ok": True,
        "pseudo": user["pseudo"],
        "email": user["email"],
        "profile": user.get("profile"),
        "updatedAt": user.get("profile_updatedAt"),
    }


@api_router.put("/profile")
async def put_profile(payload: ProfileIn, authorization: Optional[str] = Header(None)):
    user = await _user_from_token(authorization)
    # On limite la taille du profil pour éviter les abus (1 Mo max)
    import json as _json
    blob = _json.dumps(payload.profile)
    if len(blob) > 1024 * 1024:
        raise HTTPException(status_code=413, detail="Profil trop volumineux")
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {
            "profile": payload.profile,
            "profile_updatedAt": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return {"ok": True}


@api_router.post("/auth/logout")
async def logout(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        return {"ok": True}  # idempotent
    token = authorization[len("Bearer "):].strip()
    # Retire le token spécifique
    await db.users.update_one(
        {"sessions_tokens.token": token},
        {"$pull": {"sessions_tokens": {"token": token}}},
    )
    return {"ok": True}


# ============================================================
# GOOGLE OAUTH — connexion via compte Google (Google Identity Services)
# Le frontend envoie l'ID token reçu de Google, on le vérifie côté serveur
# avec la lib google-auth et on crée/connecte l'utilisateur.
# Pour activer : définir GOOGLE_CLIENT_ID dans .env, et pip install google-auth
# ============================================================
class GoogleAuthIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    credential: str          # ID token JWT renvoyé par Google
    pseudo: Optional[str] = None  # requis si premier login (création de compte)


GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "").strip()


@api_router.post("/auth/google")
async def auth_google(payload: GoogleAuthIn):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google login non configuré (GOOGLE_CLIENT_ID manquant)")
    # Vérification du JWT Google
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as ga_requests
    except ImportError:
        raise HTTPException(status_code=503, detail="Module google-auth non installé sur le serveur")
    try:
        info = id_token.verify_oauth2_token(
            payload.credential,
            ga_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except Exception as e:
        logging.warning("Google token verification failed: %s", e)
        raise HTTPException(status_code=401, detail="Token Google invalide")

    email = info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email manquant dans le token Google")
    email_lower = email.lower()

    # Existe déjà ?
    user = await db.users.find_one({"email_lower": email_lower})
    if user:
        token = await _issue_token(user)
        return {"ok": True, "pseudo": user["pseudo"], "email": user["email"], "isNew": False, "token": token}

    # Premier login Google → on a besoin d'un pseudo
    p = _norm_pseudo(payload.pseudo or "")
    if not PSEUDO_RE.match(p):
        # Suggestion automatique à partir de la partie locale du mail
        suggestion = re.sub(r"[^A-Za-z0-9_-]", "", email.split("@")[0])[:18]
        raise HTTPException(
            status_code=400,
            detail=f"Pseudo manquant ou invalide. Suggestion : {suggestion or 'Joueur'}",
        )
    if _is_reserved_pseudo(p.lower(), email):
        raise HTTPException(status_code=403, detail="Pseudo réservé au créateur du jeu")
    if await db.users.find_one({"pseudo_lower": p.lower()}):
        raise HTTPException(status_code=409, detail="Pseudo déjà utilisé")

    doc = {
        "id": str(uuid.uuid4()),
        "email": email,
        "email_lower": email_lower,
        "pseudo": p,
        "pseudo_lower": p.lower(),
        "password_hash": "",     # pas de password pour les comptes Google
        "provider": "google",
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "sessions_tokens": [],
        "profile": None,
    }
    res = await db.users.insert_one(doc)
    doc["_id"] = res.inserted_id
    token = await _issue_token(doc)
    return {"ok": True, "pseudo": p, "email": email, "isNew": True, "token": token}


# ============================================================
# LEADERBOARD — top joueurs par totalWinnings
# ============================================================
class LeaderboardEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    country: str = "XX"  # ISO 2 lettres
    totalWinnings: int = 0
    equippedBanner: str = "b-default"
    sessions: int = 0
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


@api_router.post("/leaderboard/submit")
async def submit_leaderboard(entry: LeaderboardEntry):
    """Upsert le score d'un joueur. Appelé périodiquement par le frontend."""
    doc = entry.model_dump()
    doc['updatedAt'] = doc['updatedAt'].isoformat()
    await db.leaderboard.update_one(
        {"name": entry.name},
        {"$set": doc, "$max": {"totalWinnings": entry.totalWinnings}},
        upsert=True,
    )
    return {"ok": True}


@api_router.get("/leaderboard")
async def get_leaderboard(country: str = "", limit: int = 50):
    """
    Top joueurs par totalWinnings.
    - country='' → classement mondial
    - country='FR' (2 lettres) → classement national
    """
    query = {}
    if country:
        query["country"] = country.upper()
    cursor = db.leaderboard.find(query, {"_id": 0}).sort("totalWinnings", -1).limit(max(1, min(200, limit)))
    rows = await cursor.to_list(length=limit)
    # Strip updatedAt pour réduire le payload
    for r in rows:
        r.pop('updatedAt', None)
    return {"country": country or "global", "count": len(rows), "entries": rows}

# Include the router in the main app
app.include_router(api_router)
app.include_router(mp_router)

@app.on_event("startup")
async def startup_mp():
    start_snapshot_loop()
    # Index uniques pour l'auth (pseudo + email)
    try:
        await db.users.create_index("pseudo_lower", unique=True)
        await db.users.create_index("email_lower", unique=True)
    except Exception as e:
        logging.warning("Could not create user indexes: %s", e)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


# --- Serve frontend build (SPA) for production single-site deployment ---
FRONTEND_BUILD_DIR = Path(os.environ.get(
    'FRONTEND_BUILD_DIR',
    str(ROOT_DIR.parent / 'frontend' / 'build'),
))

if FRONTEND_BUILD_DIR.is_dir():
    app.mount(
        "/static",
        StaticFiles(directory=FRONTEND_BUILD_DIR / "static"),
        name="static",
    )

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str):
        # Serve hashed assets directly if they exist at the build root
        candidate = FRONTEND_BUILD_DIR / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        # SPA fallback — let React Router handle the route
        return FileResponse(FRONTEND_BUILD_DIR / "index.html")
else:
    logger.warning(
        "Frontend build directory not found at %s — backend will only serve /api",
        FRONTEND_BUILD_DIR,
    )