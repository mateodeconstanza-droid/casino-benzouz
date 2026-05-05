# Déploiement — un seul site, solo + multijoueur

Architecture choisie : **un seul container Docker** (FastAPI sert l'API, les WebSockets ET le build React) déployé sur **Render.com**, avec MongoDB sur **MongoDB Atlas** (free tier).

Une seule URL pour tout. Multijoueur avec WebSockets natifs.

---

## 1. MongoDB Atlas (gratuit, ~5 min)

1. Crée un compte sur https://www.mongodb.com/cloud/atlas/register
2. Crée un cluster **M0 (Free)** — région la plus proche de Frankfurt (eu-central-1)
3. **Database Access** → "Add New Database User" → user/password (note-les)
4. **Network Access** → "Add IP Address" → **Allow Access from Anywhere** (`0.0.0.0/0`)
   *Render n'a pas d'IPs fixes en free tier ; on resserrera plus tard si besoin.*
5. **Database** → "Connect" → "Drivers" → copie la **connection string** :
   `mongodb+srv://USER:PASS@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority`
   Remplace `<password>` par le mot de passe créé à l'étape 3.

## 2. Push le repo sur GitHub

Tes nouvelles modifs (Dockerfile, render.yaml, code unified) doivent être pushées :

```bash
cd /Users/mateodeconstanza/GambleLife/casino-benzouz
git add Dockerfile .dockerignore render.yaml DEPLOY.md backend/server.py backend/requirements.txt frontend/src/game/multiplayer.js
git commit -m "Unified deploy: backend serves frontend + WS multiplayer"
git push
```

## 3. Déploiement Render (~5 min)

1. Crée un compte sur https://dashboard.render.com (gratuit, login GitHub)
2. **New +** → **Blueprint** → connecte ton repo `mateodeconstanza-droid/casino-benzouz`
   Render détecte automatiquement `render.yaml`.
3. Dans la modale, renseigne la valeur de `MONGO_URL` (la connection string Atlas de l'étape 1).
4. **Apply** → Render build le Dockerfile (~5–8 min la première fois) puis lance le service.
5. URL finale : `https://gamblelife.onrender.com` (ou nom équivalent).

## 4. Vérification

Sur l'URL Render :
- `/` → l'app React se charge
- `/api/` → `{"message":"Hello World"}`
- `/api/mp/servers` → liste Alpha + Beta
- Le multijoueur (WebSocket) doit se connecter automatiquement quand tu cliques "Multijoueur" dans l'app

## ⚠️ À savoir sur le free tier Render

- **Spin-down après 15 min d'inactivité** → premier accès ensuite : ~30s de cold start
- **750h/mois compute gratuit** → largement assez pour un site perso
- Pour always-on : passer en plan Starter ($7/mois)

## Lancer en local (toujours pareil qu'avant)

Trois processus à démarrer :

```bash
# 1. MongoDB local
~/.local/mongodb/bin/mongod --dbpath ~/.local/mongodb-data \
  --logpath ~/.local/mongodb-log/mongod.log --bind_ip 127.0.0.1 --port 27017 &

# 2. Backend
cd backend && source .venv/bin/activate
uvicorn server:app --reload --host 127.0.0.1 --port 8000

# 3. Frontend (dans un autre terminal)
cd frontend && yarn start   # → http://localhost:3000
```

**Ou** mode "prod-like" en local : un seul process qui sert tout (comme en prod) :

```bash
cd frontend && yarn build
cd ../backend && source .venv/bin/activate && uvicorn server:app --port 8000
# → http://localhost:8000  (tout sur un seul port)
```

## Et l'ancien Vercel ?

Tu peux garder le projet Vercel (il sert le frontend en static — sans le multi). Ou simplement le supprimer pour éviter la confusion : avec Render, tu n'en as plus besoin.

Si tu veux pointer un domaine custom (ex: `gamblelife.fr`), Render le permet en free.
