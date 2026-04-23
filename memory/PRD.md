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

### ✅ Implemented (Feb 2026 — LOT 1 fixes)
- **Menu in-game fix (écran noir)** : `profile.totalWinnings` gardé par `|| 0` et `weapons.length` par `(weapons || []).length` dans `Lobby3D.jsx` L4066 + JSX du menu. Évite le crash React quand le profil est partiellement chargé.
- **Explosions bazooka/grenades — fuite GPU corrigée** : `createExplosion()` dispose désormais les geometries/materials (flashGeo, fireGeo, shockGeo + leurs materials) une fois l'animation terminée. Garde-fou setTimeout pour nettoyer même si rAF est bloqué. Géométries allégées (sphere 16→10 segments, ring 32→20). `createBloodSplash()` : 15→8 gouttes et dispose() explicite. Plus de freeze après X explosions.
- **BenzBet — résolution différée** : les paris ne sont plus résolus à la volée. Un pari placé est poussé dans `BENZBET_PENDING_KEY(user)` avec un `readyAt` = durée simulée du plus long match (1 min = 2 s). Le combiné n'est donc plus évalué avant la fin des matchs.
- **Notification 5s globale** : un ticker dans `Casino.jsx` (2 s polling) résout les paris pending dont `readyAt <= now`, crédite le `balance` + `profile.totalWinnings`, et déclenche un toast plein écran 5 s (vert/orange/rouge selon won/partial/lost). Fonctionne **même si le joueur n'est pas sur la machine BenzBet** (écran lobby, jeu de table, shop, etc.).
- **Historique enrichi** : nouvelle section "⏳ En cours" en haut de la modal Historique dans BenzBet, avec countdown et gain potentiel. Auto-refresh toutes les 2 s.
- **Tennis / MMA pas de nul** : déjà coché dans `constants.js` (`draw: false` pour `tennis` et `mma`) ✓
- **Roulette payouts officiels** : déjà corrects dans `Roulette.jsx` L125-155 (straight ×36, red/black/even/odd/low/high ×2, douzaines ×3). Commentés explicitement.

### ✅ Implemented (Feb 2026 — Refonte Login + Hall Casino + Personnalisation in-game)
- **`Login.jsx` entièrement refait** (style Stake épuré) : fond navy gradient + noise overlay, logo BENZ doré dégradé, sous-titre "CASINO · ROYAL" avec liseré or, glass-morphism card, preview avatar SVG stylisé (`MiniAvatar`) avec sélecteurs ‹ › sur Coiffure / Tenue / Chaussures, input pseudo, bouton or "COMMENCER L'AVENTURE →". Liste de profils existants en cartes avec mini-avatar + solde + gains + compteur clés.
- **Suppression du choix de casino à l'inscription** : le nouveau joueur démarre avec casino par défaut. Le `handleLogin` signature change : `(name, isNew, appearance)` (au lieu de `casinoId`).
- **Personnalisation depuis le menu in-game** : le bouton "👤 Personnaliser le personnage" du menu (`Lobby3D.jsx`) repasse maintenant par l'écran `CharacterScreen` complet (pause le jeu). Nouveau state `characterReturnTo` ('serverSelect' pour première fois / 'lobby' quand ouvert depuis le menu) qui ramène au bon écran après "Valider".
- **Nouveau composant `CasinoHall.jsx`** : hall d'accueil Stake-style affiché **après le scan d'identité** à la porte. Panel latéral gauche avec la liste des casinos (Vegas, Malta, Barcelona, Prague, Monaco, Jonzac, etc.) avec drapeaux + taglines + badge "ACTUEL" or, preview central avec drapeau emoji géant, nom doré, tagline, 3 stats badges (Tables / Machines / Mise min), bouton "ENTRER DANS {CASINO}" dégradé aux couleurs du casino.
- **Intégration flow** : ServerSelect → Street3D → clic casino → scan 5s → **`casinoHall`** → Lobby3D du casino choisi. Le bouton "🌍 Changer de casino" du menu in-game renvoie aussi au hall.
- **`handlePickCasino`** persiste le casino choisi dans `profile.casino` et met à jour la palette `casino` utilisée par Lobby3D.

### ✅ Implemented (Feb 2026 — LOT 4 Session 2 : Intérieurs customisables + Mur Trophées)
- **Nouveau composant `/app/frontend/src/game/HomeInterior3D.jsx`** : intérieur first-person Three.js (1 pièce ouverte avec 3 zones : salon + cuisine + chambre) dont la taille dépend du type (appart 14×10, maison 18×12, villa 22×14).
- **5 thèmes décoratifs** (`HOME_THEMES`) : Cosy / Moderne / Luxueux / Néon / Classique. Chaque thème configure murs, sol, canapé, lit, table, couleur d'accent (avec pointlight dynamique au plafond + lampes d'ambiance).
- **Meubles 3D inclus** :
  - Salon : canapé avec dossier + accoudoirs, table basse, meuble TV + écran TV émissif couleur accent, lampe d'ambiance avec pointlight
  - Cuisine : plan de travail en L blanc marbré, 3 placards hauts, évier inox, plaques de cuisson émissives
  - Chambre : lit avec matelas blanc + oreiller + tête de lit, table de nuit + lampe émissive avec pointlight
  - Horloge murale déco (cuisine)
- **Mur Trophées** (canvas 1024×640 texturé sur plane 6×3,75 m) : cadre doré + titre 🏆 + 6 statistiques auto-calculées depuis `profile.totalWinnings` et l'historique BenzBet (Gains cumulés, Plus gros gain, Meilleure streak, Cote max, Paris placés, Propriétés). **Cliquable** → modal détaillé avec grille 2×3.
- **Persistance** : le thème choisi est sauvegardé dans `profile.ownedHouses[].customizations.theme` et repersistant entre sessions via `saveProfile()`.
- **Intégration flow** : Street3D modal → "ENTRER CHEZ MOI" (si possédée) → screen `'home'` avec `HomeInterior3D` → bouton "← Sortir" revient en street.
- **Caméra vivante** : léger balancement gauche-droite + haut-bas pour rendre l'immersion first-person naturelle.

### ✅ Implemented (Feb 2026 — LOT 4 Session 1 : Quartier extérieur 3D)
- **Nouveau composant `/app/frontend/src/game/Street3D.jsx`** : scène Three.js outdoor avec ciel bleu + soleil + fog, 10 nuages qui dérivent en continu, 4 oiseaux qui volent en cercle avec battement d'ailes, route asphaltée + lignes blanches, trottoir, pelouse verte.
- **Bâtiments 3D** :
  - **Casino "BENZ ROYAL"** : corps beige 14×8×10 + toit rouge terracotta + enseigne dorée "CASINO" + entrée marron encadrée or + 2 piliers dorés + tapis rouge + 6 fenêtres éclairées
  - **Immeuble "Les Résidences"** (5 appartements) : 8×14×7 avec 15 fenêtres (5 étages × 3), balcons dorés, étiquette "5 APPARTEMENTS · 5M B"
  - **3 maisons** (bleue / beige / rouge) : corps 5,5×4×5, toit prisme 4 faces, porte + 2 fenêtres, pelouse, label prix flottant "10M B"
  - **2 villas** (Marina / Palmier) : base 9×6×7 + étage supérieur 6,5×3×5, toit terracotta, porte dorée + 6 grandes fenêtres, palmier décoratif, label "100M B"
- **Barricades** : 50+ bornes rouges à bande blanche formant un U périmètre (arrière + 2 côtés + front)
- **Arbres décoratifs** : 6 arbres entre les bâtiments
- **Système d'achat** : raycaster au clic, modal d'achat avec label, type, prix, bouton ACHETER (disabled si solde insuffisant), toast de confirmation. Houses possédées → porte + fenêtres dorées, label "★ À VOUS ★".
- **Scan d'identité casino** : clic sur casino → overlay plein écran pendant 5 s avec conic-gradient progression + scan bar cyan animé + pastille "🪪 VÉRIFICATION D'IDENTITÉ" → puis entrée dans le Lobby3D.
- **Profil étendu** : `profile.keys: []` (liste des houseIds possédées) + `profile.ownedHouses: [{id, boughtAt, customizations}]`.
- **Flow intégré dans `Casino.jsx`** : après ServerSelect → screen `'street'` → clic casino → scan 5s → screen `'lobby'`. Menu du lobby a un nouveau bouton doré "🚪 Sortir (voir la rue)" qui revient en `'street'`.
- **HUD street** : badge solde + compteur clés 🔑 en haut à droite, bouton Déconnexion en haut à gauche, instruction au bas de l'écran.

### ✅ Implemented (Feb 2026 — LOT 3 Roulette 3D Three.js)
- **Nouveau composant `/app/frontend/src/game/Roulette3DWheel.jsx`** : roue 3D complète en Three.js avec cuvette bois, anneau doré extérieur, disque central rotatif, 37 poches rouge/noir/vert (ordre européen officiel) avec numéros texturés sur face supérieure, frets dorés séparateurs, dôme doré central type moyeu + 8 branches, bille sphérique blanche physique, pointeur doré en haut, éclairage directional + ambient + point light (ton doré).
- **Physique bille** : animation en 3 phases — (1) piste haute 3,6 m avec léger rebond sinusoïdal, (2) descente spiralée 3,6 → 2,65 m avec rebonds, (3) atterrissage dans la poche cible après 6,5 s. La roue décélère de 2,2 à 0,3 rad/s et se cale pour que le numéro gagnant passe exactement sous le pointeur.
- **Intégration dans `Roulette.jsx`** : ancien SVG 2D remplacé par `<Roulette3DWheel>`. `spin()` capture un `winNum`, push un `spin3DSignal++` et passe `onBallLanded` callback qui exécute les payouts officiels (×36 plein, ×3 douzaines, ×2 chances simples). Cleanup WebGL complet au dé-mount.
- **Idle state** : la roue tourne lentement en continu hors spin pour un rendu vivant.
- **Fix mémoire** : dispose automatique des geometries/materials/textures au unmount.

### ✅ Implemented (Feb 2026 — LOT 2 Refonte UI style Stake)
- **Design system partagé** : `/app/frontend/src/game/stake/theme.js` (palette feutre navy + or + cyan live + 9 dénominations jetons) et `/app/frontend/src/game/stake/StakeUI.jsx` (`<StakeShell>`, `<Chip3D>`, `<ChipRack>`, `<RoundBtn>`, `<PlacedStack>`).
- **Roulette refaite** en `StakeShell` : feutre bleu navy avec gradient radial, liseré or, 7 jetons 3D cliquables (1/5/25/100/500/1K/5K), boutons ronds EFFACER (orange) + TOUR (or XL) + NOUVEAU, mises visibles en piles `<PlacedStack>` sur les cases. Badge "EN DIRECT" cyan pulsant en haut à droite.
- **Blackjack refait** : table arquée (border-radius 50%/50% 20px/20px) feutre navy + liseré or + clubs/coeurs en watermark, jetons 3D Chip3D inline, boutons ronds TIRER/RESTER/DOUBLER/SPLIT/ABANDON et ENCHAÎNER. Spot mise central dashed doré.
- **Poker refait** : table ovale bordée or avec fond radial bleu sombre, dos de cartes visibles sur le dealer, slot cartes communes/joueur en pointillés, bouton "DISTRIBUER LES CARTES" dégradé or.
- **Hooks dev ajoutés** dans `Casino.jsx` : `window.__openRoulette()`, `__openBlackjack()`, `__openPoker()`, `__openLobby()` pour faciliter les campagnes de tests.

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
