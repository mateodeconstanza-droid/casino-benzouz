from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import re
import bcrypt
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
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


def _norm_pseudo(p: str) -> str:
    return (p or "").strip()


def _hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt(rounds=10)).decode("utf-8")


def _verify_pw(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


# Pseudo réservé : seul le créateur du jeu peut prendre "ByJaze".
RESERVED_PSEUDOS = {"byjaze"}


@api_router.post("/auth/check-pseudo")
async def check_pseudo(payload: CheckPseudoIn):
    """Vérifie qu'un pseudo est disponible (avant submit du formulaire)."""
    p = _norm_pseudo(payload.pseudo)
    if not PSEUDO_RE.match(p):
        return {"available": False, "reason": "format"}
    if p.lower() in RESERVED_PSEUDOS:
        return {"available": False, "reason": "reserved"}
    existing = await db.users.find_one({"pseudo_lower": p.lower()})
    return {"available": existing is None, "reason": None if existing is None else "taken"}


@api_router.post("/auth/register")
async def register(payload: RegisterIn):
    p = _norm_pseudo(payload.pseudo)
    if not PSEUDO_RE.match(p):
        raise HTTPException(status_code=400, detail="Pseudo invalide (3-20 caractères alphanumériques)")
    if p.lower() in RESERVED_PSEUDOS:
        raise HTTPException(status_code=403, detail="Pseudo réservé au créateur")
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
    }
    await db.users.insert_one(doc)
    return {"ok": True, "pseudo": p, "email": payload.email}


@api_router.post("/auth/login")
async def login(payload: LoginIn):
    email_lower = payload.email.lower()
    user = await db.users.find_one({"email_lower": email_lower}, {"_id": 0})
    if not user or not _verify_pw(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    return {"ok": True, "pseudo": user["pseudo"], "email": user["email"]}


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