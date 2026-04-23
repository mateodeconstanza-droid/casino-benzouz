# Benz Casino — PRD

## Problem Statement (original)
Jeu mobile 3D (React + Three.js). Objectifs principaux :
- Poker Texas Hold'em fonctionnel (2+2 cartes, flop/turn/river)
- Roulette avec paiements corrects (rouge/noir = ×2)
- Blackjack haut RTP avec Split/Double/Surrender
- Boutique Benz : armes (mur) + véhicules (showroom, ×2 skateboard, ×3 vélo)
- Personnalisation du personnage (coupe, vêtements, shorts, chaussures)
- Cosmétiques spéciaux : Louis Vuittonz, Costume, Jerseys PSG/Real/Barca
- 5 armes supplémentaires (bazooka AoE 3m, couteau de lancer, arbalète, UZI, laser)
- ATM : 1 retrait / 5 min
- FPS/TPS, balles visibles seulement pendant tir, armes en mains
- Collisions 3D (murs, tables, meubles)
- Table/roulette 3D taille réelle avec bille qui roule
- Animation s'asseoir aux tables de jeu
- Animation 3D des cartes distribuées
- NPCs animés avec mouvements naturels

## Implementation Status

### ✅ Implemented (Jan 2026)
- Refactorisation du Casino.jsx (9000+ → 599 lignes) en modules `/app/frontend/src/game/`
- Poker Texas Hold'em corrigé (distribution sans délai, flop/turn/river)
- Roulette : rouge/noir = ×2, règles du 0 appliquées
- Blackjack : Split + Double + Surrender ajoutés
- 10 coupes + 10 tenues + 10 shorts + 10 chaussures (3 gratuits / 7 payants par catégorie)
- 5 cosmétiques spéciaux (LV tracksuit, Costume, Jerseys PSG/Real/Barca)
- 11 armes au total : couteau, machette, glock, fusil, bazooka, lance-flammes + couteau de lancer, arbalète, UZI, grenade, laser
- ATM : 1 retrait / 5 min (15 000 B)
- FPS + TPS (avatar 3D visible derrière caméra)
- Collisions 3D (AABB contre tables, murs, mobilier)
- 6 NPCs qui se baladent avec balancement bras/jambes
- Bouton "Tirer" press-and-hold avec auto-fire
- Muzzle flash + balles visibles uniquement pendant le press
- Quêtes quotidiennes + Badge VIP
- Benz Boutique (armes mur + véhicules showroom)

### ✅ Implemented (Feb 2026 - current session)
- **Roulette 3D taille réelle** : cuvette, piste, 37 poches rouge/noir/vert, séparateurs argentés, moyeu doré, spokes, pointeur + **bille blanche qui roule** sur la piste externe avec ralentissement/relance cyclique (~12s)
- **Chaises autour des tables** : 3 sièges par table BJ/Poker/Highcard, 4 sièges autour de la roulette
- **Animation s'asseoir** : quand le joueur est proche d'une table de jeu (nearZone), la caméra descend progressivement de 1.7m → 1.05m, avatar 3ème personne plie les jambes
- **Animation 3D cartes distribuées** : cycle permanent de 8s — cartes volent en arc depuis le croupier vers les places des joueurs sur BJ/Poker/Highcard
- **Bazooka AoE 3m** : explosion au point d'impact (flash + boule de feu + onde de choc + lumière ponctuelle) qui tue tous les NPCs/dealers dans un rayon de 3m
- **Couteau de lancer (throwknife)** : projectile 3D (lame + manche) qui vole en arc avec rotation, recherche de cible dans un cône de 15m
- **Grenade** : même logique que throwknife avec AoE 3m à l'impact
- **Fusil laser** : rayon instantané 40m, cylindre de détection pour tout NPC dans la trajectoire
- **Arbalète + UZI** : projectiles visibles, dégâts simples
- **NPCs améliorés** : balancement jambes/bras calé sur la vitesse de déplacement
- **Éclairage renforcé** sur la roulette (SpotLight 5 unités) pour mieux voir les couleurs
- **BenzBet v2 — Refonte complète façon vrai site de paris sportifs** :
  - Chrome de navigateur : boutons ●●●, barre d'URL `https://www.benzbet.fr/paris-sportifs/<sport>` qui change selon le sport actif
  - Thème blanc/rouge (primary #e00e1a)
  - Logo **BENZ[BET]** style vrai bookmaker
  - Nav horizontale 8 sports : Football, Basket NBA, Tennis ATP, MMA/UFC, Hockey NHL, Rugby, Formule 1, Esport
  - 12 matches par sport avec noms réalistes (Real Madrid, Lakers, Sinner, Jon Jones, Panthers, Nouvelle-Zélande, Verstappen, NAVI…)
  - **Moteur de cotes intelligent** basé sur ELO secret par équipe + marge bookmaker 6% + avantage domicile (foot/rugby/hockey). Cotes bornées 1.02 → 50 comme les vrais bookmakers.
  - `resolveMatch()` utilise les VRAIES probabilités (pas les cotes inflées) — aucun bug de paiement
  - **Panier multi-sports** : ajout/retrait de paris, modes Simple / Combiné (switch auto à partir de 2 paris)
  - Cote combinée = produit des cotes
  - Calcul en direct : Mise × Cote totale = Gain potentiel
  - Quick-stake : 100 / 500 / 2k / 10k
  - **Historique persistant** (localStorage) avec statut won/partial/lost + replay du détail
  - Toast résultat animé (vert gain / rouge perte)
  - Panier + historique persistants via localStorage (`benzbet:<user>:slip` et `:history`)
- **BenzBet LIVE** (nouveau) :
  - 3 premiers matchs de chaque sport marqués **🔴 LIVE** avec minute de jeu qui avance en temps réel (tick toutes les 2,5s)
  - **Score qui évolue** (buts/paniers générés selon la proba réelle)
  - **Cotes recalculées en direct** : quand l'équipe qui mène change, ses cotes baissent ; la cote du nul s'érode au fil du temps
  - Filtre "🔴 LIVE uniquement" pour n'afficher que les matchs en cours
  - Animation pulse sur le badge LIVE
  - Match terminé → badge "TERMINÉ" + paris inactivés
- **Sons synthétiques** (Web Audio API, aucun fichier externe) :
  - Armes : gun, shotgun, bazooka (whoosh + explosion basse-fréquence), laser, throwknife (swoosh), knife, flame, grenade, crossbow, uzi
  - Casino : chip, card, win (glissando gagnant), lose, click
  - **Ambiance casino continue** (brouhaha filtré + cloches de slots aléatoires)
  - Démarrage automatique à l'entrée du lobby, arrêt à la sortie
### ✅ Implemented (Feb 2026 - current session — multijoueur)
- **2 Serveurs en ligne** (Alpha EU / Beta US) + mode **Solo** hors ligne au choix
- **Écran `ServerSelect`** avant entrée au casino (après personnalisation si nouveau profil), avec polling du nombre de joueurs connectés
- **Backend WebSocket** FastAPI (`/api/mp/ws/<server>/<username>`) avec :
  - `ConnectionManager` par serveur (mémoire, pas de persistance MongoDB nécessaire pour les sessions live)
  - Boucle de snapshots à 10 Hz (`snapshot_loop`) diffusée à tous les clients
  - Endpoint `/api/mp/servers` qui retourne la liste + `online`
  - Messages gérés : `pos`, `chat`, `shot`, `hit`, `ping`
  - Broadcasts : `welcome`, `snapshot`, `player_joined`, `player_left`, `chat`, `shot`, `damage`, `kill`, `respawn`
- **Client WS** (`multiplayer.js`) avec reconnexion exponentielle (5 tentatives max)
- **Rendu des avatars distants** dans Lobby3D :
  - Avatar Three.js corps/tête/cheveux/bras/jambes avec couleur de peau (du profil)
  - **Sprite canvas** avec le pseudo en lettres dorées flottant 2,3 m au-dessus de la tête
  - Interpolation douce (`lerp 0.2`) pour un mouvement fluide malgré le tick réseau
  - Balancement bras/jambes lorsque l'avatar se déplace
  - Masquage automatique quand HP ≤ 0
- **Envoi de position** throttlée à 10 Hz (toutes les 100 ms)
- **Chat public** : 
  - Touche **T** pour ouvrir, Entrée pour envoyer, Échap pour fermer
  - Bouton 💬 Chat en bas à gauche (mobile)
  - Historique 30 derniers messages, notifications `SYSTÈME` (joueur entre/sort, connexion)
- **PvP activé** :
  - Sur chaque tir, détection automatique des hits sur joueurs distants (cône selon l'arme)
  - Dégâts 25 (gun) / 50 (mêlée) / 60 (laser) / 100 (bazooka)
  - Barre HP visible en haut à gauche (verte/orange/rouge)
  - **Kill feed** en haut à droite (5 derniers kills, auto-dismiss après 5 s)
  - Respawn automatique côté serveur après 4 s avec HP 100
  - Tirs distants matérialisés en balles Three.js jaunes (visibles pour tous)

### Suppression
- `PokerMulti.jsx` retiré (pass-and-play local) — remplacé par le vrai multi réseau
- **__testHooks** exposés globalement :
  - `window.__openBenzBet/__closeBenzBet`, `__openPokerMulti/__closePokerMulti`
  - `__openShop/__openATM/__openWheel/__openQuests/__openTrophies`
  - `__addBalance(n)`, `__getBalance()`, `__getProfile()`
  - Documentés dans `/app/memory/test_credentials.md`

### ✅ Implemented (Feb 2026 - Session courante — suite post-Vercel)
- **Moteur de cotes ELO-based** : chaque sport dispose d'un pool d'équipes/joueurs avec ELO (50..100). Cotes calculées via `probaFromElo()` + marge bookmaker 6 % + avantage domicile 3 (foot/rugby/hockey). Validé par testing_agent : spot-checks réalistes (Real vs Benfica 1.22/50, Real vs Chelsea 1.44/21, Naples vs Atalanta 1.83/7, Man City vs Arsenal 1.74/8.08).
- **BenzBet : onglet "Classements"** : bouton header `data-testid="benzbet-toggle-view"` qui bascule entre vue Paris et vue Classements. `RankingsView` affiche Top 20 par sport (Rang, Équipe/Joueur, Points, Forme 5 derniers V/N/D colorés, Tendance ▲/▼/▬). Couronne 👑 #1, médailles or/argent/bronze #1-3. `getRankings(sportId, 20)` exporté depuis `constants.js`.
- **Classements Esport complet** : ESPORT_TEAMS élargi à 24 équipes (+6 : KT Rolster, DRX, Eternal Fire, paiN Gaming, Furia, GamerLegion) pour tenir la promesse "Top 20".
- **Refonte 3D BenzBet dans Lobby3D.jsx (`createBenzBet`)** : 4 totems modernes rouge/blanc (base rouge laquée 1,1 m + plateau incliné + tige blanche + écran LED haut avec texture animée "cotes LIVE") disposés sur un podium rouge 9×5,5 m avec liseré blanc. Comptoir bookmaker blanc avec bande LED rouge. Enseigne suspendue BENZBET grand format. 4 barres LED rouge/blanche au sol, 3 lumières d'ambiance (rouge, blanc, or). Zone d'interaction élargie (rayon 4,5 m).
- **Forme récente déterministe** : `computeForm(sportId, entity)` basé sur hash32 du nom + ELO normalisé — pas de flickering entre reloads.

## Architecture
- Stack: React (CRA + CRACO) + Three.js
- Storage: localStorage (clé `profile:<name>`)
- Main file: `/app/frontend/src/components/Casino.jsx`
- Lobby: `/app/frontend/src/game/Lobby3D.jsx` (~4260 lignes, à splitter en hooks)
- Entry: `/app/frontend/src/App.js` → `<Casino />`

## Next Tasks / Prioritized Backlog
- **P2** : Découper `Lobby3D.jsx` (>4500 lignes) en hooks : `useMovement`, `useCollisions`, `useSceneSetup`, `useWeapons`, `useRoulette3D`, `useNPCs`, `useMultiplayer`.
- **P2** : Persister kills/deaths par profil (leaderboard serveur dans MongoDB).
- **P2** : Mode "jouer ensemble" aux tables (Poker/Blackjack avec vrais joueurs humains) — tour par tour synchronisé via WS.
- **P3** : Chat commandes slash (`/w <user>` whisper, `/kick` admin…).
- **P3** : Anti-cheat rudimentaire côté serveur (rate limit shots, distance checks).
- **P3** : Mode Live BenzBet (cotes qui évoluent pendant le match) — déjà fait, rien à ajouter mais on peut étendre à plus de sports.

## Core Requirements (Static)
- Pas d'auth serveur (profils locaux)
- Mobile-first : joystick virtuel, touch fire
- 100 % du contenu en français
- Aucun backend requis

## User Personas
- Joueur casual mobile, téléphone tactile
- Progression via jeux de table + zone de tir + mini-activités
