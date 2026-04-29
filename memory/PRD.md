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

### ✅ Implemented (Feb 2026 — Mini-radar Street3D)
- **Canvas radar 120×120px** en haut à droite de Street3D (sous le HUD solde/clés). Dessin via `radarRef` mis à jour à chaque frame dans la boucle Three.js.
- **Contenu du radar** :
  - Fond dégradé radial navy + liseré doré + croisillon axes
  - **Joueur** : point cyan au centre + cône de vision cyan clair reflétant `player.rotY`
  - **Casino** : carré or (plus gros, avec glow)
  - **Maisons** : carrés rose pastel
  - **Immeuble** : carré violet
  - **NPCs** : petits cercles oranges (positions mises à jour live)
  - **Voiture** : cercle rouge
  - Clipping : les points hors rayon utile (48 m) sont coupés
- **Légende compacte** sous le radar avec les couleurs des catégories.

### ✅ Implemented (Feb 2026 — Système de déplacement FPS Street3D)
- **Vue first-person** : caméra à hauteur 2,6 m, position du joueur stockée dans `stateRef.current.player = {x, z, rotY}`, initialisée à `(0, 12, 0)` (face au casino).
- **Contrôles clavier** : ZQSD / WASD / flèches directionnelles pour avancer-reculer-strafe. A = rotation gauche (optionnelle). E = interagir avec l'objet le plus proche.
- **Joystick tactile** (`<DpadBtn>`) : D-pad 4 flèches en bas à gauche (▲ ◀ ▶ ▼) + 2 boutons rotation ↺ ↻ en bas à droite. Utilise `onPointerDown/Up/Leave/Cancel` pour reset fiable (plus de stuck après touch).
- **Collisions AABB** : 7 obstacles (casino, immeuble, 3 maisons, 2 villas) avec slide sur l'axe libre. Rayon joueur 0,45 m. Limites de l'arène 46×30 m.
- **Détection de proximité** (12×/s) : balaye les 7 `interactables` et met à jour `nearbyPrompt` dès que le joueur entre dans un rayon (8 m maison/villa/immeuble, 12 m casino). Déclenche un prompt visuel animé.
- **Prompt d'interaction animé** : bulle navy/or au centre avec titre contextuel ("🎰 Entrée du casino", "🏠 Acheter cette propriété", "🔑 Ta propriété", "🏢 Les Résidences — Choisir un appart") + bouton "APPUIE · E" qui déclenche l'action.
- **Modal Apartment picker** : cliquer sur l'immeuble ouvre un modal listant les 5 appartements (étages 1-5) avec statut (possédé / achetable 5M B).
- **Click-raycaster conservé** en bonus pour desktop mais proximité = mode principal.

### ✅ Implemented (Feb 2026 — LOT 4 Session 3 + Onboarding tutoriel)
- **NPCs piétons** (3) qui marchent le long du trottoir dans Street3D, avec corps BoxGeometry + jambes + bras + tête sphère + cheveux dômes, et **animation réaliste** de balancement bras/jambes via `Math.sin(phase)` sur `legL.rotation.x` et `armL.rotation.x`. Direction switch automatique aux bornes (-40/+40 m). 3 couleurs distinctes (rouge/bleu/jaune).
- **Voiture rouge** qui traverse la route en continu (phares émissifs avant, 4 roues, cabine bleu nuit).
- **Barrière d'accès au casino** : 2 piliers dorés + barre rouge/blanche à 5 segments alternés, positionnée devant l'entrée. Se lève en douceur (lerp 0 → π/2.2) pendant les 5 s du scan d'identité et redescend après. Géré via `stateRef.current.gateOpen` activé/désactivé dans `onCasinoClick`.
- **Nouveau composant `Onboarding.jsx`** : tutoriel 5 étapes affichable par-dessus la scène Street3D (Bienvenue → Maisons → Casino → Hall → Finish) avec carte navy + barre de progression or + boutons "Passer" / "SUIVANT →" + flèche animée bouncing pointant vers la cible.
- **Persistance** : `profile.onboardedAt` enregistré après le tutoriel. Bouton "❔ Revoir le tutoriel" dans le menu lobby qui reset `onboardedAt` et renvoie sur Street pour rejouer.
- **Trigger auto** : `<Onboarding active={!profile.onboardedAt} onFinish={...} />` wrappé autour de Street3D — ne s'affiche qu'aux nouveaux joueurs.

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

### ✅ Implemented (Feb 2026 — SPRINT 2 : Ville massive × 10 + Écrans pub + Roue moderne)
- **Zone de jeu × 10** : sol 1000×1000 m (vs 200×200), fog 150→550 (vs 50→130), camera far 900 (vs 200). Play zone étendue x/z ∈ [-400, 400], death barrier à ±440.
- **Ville procédurale urbaine** : ~280 bâtiments générés via `tryPlaceBuilding()` avec semence déterministe. Grille urbaine complète : rues principales tous les 80 m (Est-Ouest + Nord-Sud) avec lignes jaunes. Sol passé d'herbe verte 100% → asphalte gris (park central 110×65 seulement). Buildings de 6 à 44 m de haut avec fenêtres émissives or/cyan, toits plats, évitent les routes et zone protégée.
- **4 écrans publicitaires 3D** dans la ville : positions NO/NE/SO/SE (×140 m) avec pylônes métalliques + cadre or émissif + écran canvas 1024×512 (dégradé rouge→or + étoiles + titre en néon + sous-titre + CTA cyan). Messages : "GAMBLELIFE CASINO" · "CHASSE À LA PRIME" · "ROUE DE LA FORTUNE — Gagne une VILLA gratuite" · "GAMBLEBET SPORT".
- **Roue de la fortune modernisée** (`Wheel.jsx` réécrit) : **16 cases** (vs 6), taille × 1.6 (min(540, 95vw) vs 340px), nouveaux gains : `SOLDE × 2` / `SOLDE × 5` / `ARME gratuite` / `VÉHICULE gratuit` / **`★ MAISON ★` gratuite (weight 0.05)** / `JACKPOT` 10 M / 1 M / 500 K etc. 24 LED pulsantes, double anneau, centre avec logo GambleLife. `handleWheelComplete` gère tous les nouveaux types (débloque arme/véhicule/maison aléatoire, ou x2/x5 solde).

### ✅ Implemented (Feb 2026 — SPRINT 3 : Rang plus dur + Meubles Sims + Villa piscine)
- **Rang plus dur × 5 et récompenses × 10** : nouveaux paliers dans `TROPHIES` → Bronze à 50 000 (vs 10 000), Mythique à 75 000 000 (vs 15 000 000), ajout de **Titanium** (200 M), **Cosmique** (500 M), **GambleGod** (1 Md). Récompenses scalées : Bronze 5 000 $, Mythique 7.5 M $, GambleGod 250 M $.
- **Catalogue meubles Sims** : `FURNITURE_CATALOG` avec 17 items × 5 catégories (salon / cuisine / chambre / salle jeux / déco). Piano à queue (1.5 M), Jacuzzi (2 M), Billard (600 K), Tableau Picasso (3 M), Statue Or (5 M), TV 8K (800 K), etc.
- **Machine Ameublement 3D dans chaque logement** : bouton 🛍 AMEUBLEMENT (`data-testid="home-furn-btn"`) en haut droite de `HomeInterior3D`. Ouvre modal avec 5 tabs catégorie + grille achetable. Meubles achetés persistés dans `profile.ownedHouses[].customizations.furniture[]`.
- **Rendu 3D des meubles achetés** : chaque meuble possédé apparaît dans le logement avec un box coloré + emoji sprite au-dessus. Placement automatique par catégorie (4 slots/catégorie).
- **Villa = piscine + chaises longues + palmier** : pour les maisons `type: 'villa'` on ajoute une piscine 5×3 avec matériau émissif bleu + bordure blanche + 2 chaises longues beige + 1 palmier décoratif (tronc cylindre + feuilles sphère verte).
- **Hook dev `window.__openHome(houseId)`** ajouté pour les tests E2E (bypass du parcours Street → porte).

### ✅ Implemented (Feb 2026 — SPRINT 1 : Rebrand GambleLife + Fixes critiques)
- **Rebrand total** : `Benz Casino` / `BENZ` / `Benz Royal` / `BenzBet` / `Benz Boutique` / `Benzouz` / `BenzCoins` → **GambleLife** / **GAMBLELIFE** / **GambleBet** / **GambleLife Store** / **$** / **Dollars**. 90+ occurrences réécrites via sed (textes UI, produits "Skateboard GambleLife", armes "UZI GambleLife Or", etc.).
- **Monnaie unifiée en dollars** : `} B` → `} $` partout (83 occurrences en JSX). Les fmt numériques restent (pas de conversion de taux — c'est juste un relabel symbolique).
- **Fix bug menu écran noir (P0)** : root cause `StatCard is not defined` dans `Lobby3D.jsx`. Ajout de `StatCard` à l'import depuis `@/game/ui`. Menu s'affiche désormais correctement avec stats cartes, trophées, boutons.
- **Fix spawn joueur** : la caméra du Lobby3D apparaît désormais au centre du casino (`z=5`) au lieu d'être collée à la porte de sortie (`z=14`). Plus de conflit spawn/porte-de-sortie.
- **Cartes Poker/Blackjack plus grosses** : largeur 70→100, hauteur 100→140 (dimensions par défaut). `small` prop passée de 50×72 → 68×98. Meilleure lisibilité.
- **Blackjack — flip 3 s sur dernière carte croupier** : nouvelle prop `flipDuration` sur `<Card>`. Anime la carte de dos vers face sur 3 secondes avec `rotateY 180°→0°` (keyframes : 0%→180°, 50%→100° scale 1.08, 85%→10°, 100%→0°). Suspense pro. Déclenché automatiquement sur l'index de la dernière carte tirée par le croupier après `stand()`.
- **Boutique : 5 onglets** : 🔫 Armes, 🏎 Véhicules, 💇 **Cheveux** (nouveau), 👕 **Vêtements** (nouveau), 👟 **Chaussures** (nouveau). Toutes les cosmétiques des 3 catalogues (`HAIR_CATALOG`, `OUTFIT_CATALOG`, `SHOES_CATALOG`) sont désormais achetables. Achat auto-équipe l'item. Bouton "Équiper" séparé pour items possédés. Props `onBuyCosmetic(slot, item)` + `onEquipCosmetic(slot, itemId)` gérées dans Casino.jsx.
- **Ambiance casino améliorée** : `StakeShell` (cadre commun des tables Blackjack/Poker/Roulette) reçoit désormais **2 halos de chandelier** (doré + cyan) + **particules scintillantes animées** (5 points dispersés, animation CSS `stakeTwinkle` 6s). Donne une atmosphère salle feutrée chic.
- **★ 3 propriétés Créateur ByJaze à 1 $** : `bj-apt` (Appart étage 2), `bj-house` (Maison ByJaze 5.5×4×5m style noir/or luxe), `bj-villa` (Villa 2 niveaux + piscine, cadres dorés + fenêtres cyan émissives). Rendues dans le Street3D avec label flottant "★ CRÉATEUR ByJaze ★" + emplacement distinct du reste du catalogue. Réservées au créateur (mais achetables par n'importe qui à 1 $).

### ✅ Implemented (Feb 2026 — Sprint C/D/E, validated iteration_7)
- **Sprint C — Bazooka/grenade crash fix** : nettoyage des projectiles + explosions dans `Lobby3D.jsx` pour éviter les fuites mémoire / freeze à l'impact.
- **Sprint C — Chips VIP rectangulaires** : 5M / 10M / 50M ajoutés dans `ui.jsx` (`Chip3D`) avec son distinct dans `sfx.js` (`vip_chip`).
- **Sprint D — GambleBet refactor** : cotes ELO réalistes (1.20 → 5.00 par sélection), anti-doublon (impossible de placer deux paris sur la même équipe simultanément), paris combinés qui échouent entièrement si une jambe perd, historique persisté avec détails par leg.
- **Sprint D — 30+ maisons achetables** : ajout de `sh-21..sh-50` autour du casino (rangées avant + arrière + côtés), label visible, intégration dans Street3D.
- **Sprint E — FortniteLobby** : nouvel écran `/app/frontend/src/game/FortniteLobby.jsx` (~290 LOC) injecté dans `Casino.jsx` entre `serverSelect` et `street`/`casinoHall`. 4 CTA (VILLE, CASINO, BOUTIQUE, PROFIL) + bouton déconnexion. Animation halo rotative + personnage stylisé.
- **Sprint E — Cercle bleu Personnaliser dans HomeInterior3D** : disque bleu transparent au sol + anneau pulsant + pilier holographique + sprite "🛋 PERSONNALISER". Click 3D (raycast `userData.interaction = 'customize'`) ouvre la modal `home-furn-modal` (5 onglets : Salon / Cuisine / Chambre / Salle jeux / Déco). Bug fix : `stateRef.current.onCustomizeClick = () => setShowFurnStore(true)` ajouté ligne 814.
- **Sprint E — Maisons par défaut overhaul** : zone Salon (canapé+TV+lampe), Cuisine (plan de travail en L + placards + frigo), Chambre, escalier pour villas 2 étages, palmiers/piscine décoratifs.
- **Hooks de test étendus** : `__openBlackjack(minBet)` / `__openPoker(minBet)` / `__openRoulette(minBet)` acceptent désormais un paramètre pour tester les chips VIP.
- **GambleBet badge Historique** : compte désormais `history.length + pending.length` pour refléter immédiatement les paris placés.

### ✅ Implemented (Feb 2026 — Sprint F1/F2/F3/F4, validated iteration_8)
- **Sprint F1 — Plage + Mer + Décorations ville** (`Street3D.jsx` lignes 1485-1825) :
  - Plage de sable de 40×400 m côté Est (x: 80→120) avec patches de couleur variée
  - Mer animée 380×600 m avec vagues sinusoïdales (vertex displacement) et écume pulsante
  - Pont en bois s'avançant 14m dans la mer (deck + pilotis + garde-corps)
  - 6 parasols + serviettes colorées + 5 palmiers répartis sur la plage
  - Death barrière mer (x > 124, soit 3-4m dans l'eau) + lateral plage (|z| > 200)
  - Place piétonne pavée (20×12m) entre garage/boutique + fontaine animée + 4 pots de plantes + 4 bancs + 6 lampadaires + 12 pots/buissons devant le casino
- **Sprint F2 — Garage + Boutique** :
  - **Garage** (-22, 0, 30) : bâtiment 16×6×9m, toit, 3 portes de garage (rouleau métal avec lignes horizontales effet rideau), enseigne lumineuse "🚗 GARAGE", 2 voitures d'exposition. Interactable type='garage' → ouvre [data-testid=garage-modal] avec liste des véhicules (acheter/équiper).
  - **Boutique** (22, 0, 30) : bâtiment 12×5.5×8m, 2 vitrines verre teinté avec mannequins stylisés, porte centrale, enseigne "★ BOUTIQUE ★" rose néon. Interactable type='shopfront' → ouvre la Shop existante via prop `onOpenShop`.
- **Sprint F3 — Animation d'arrivée casino 4s** (`Lobby3D.jsx`) :
  - Nouveau state `arriving` (true durant 4000ms à l'entrée), refs `arrivingRef` + `arrivalStartRef`
  - Caméra cinématique 3ème personne pendant l'arrivée : orbite autour du joueur (distance 6→3.5m, hauteur 5.5→3m, arc 0→90°)
  - Avatar joueur visible (TPS forcé) avec léger bob "chargement de matière"
  - Overlay [data-testid=casino-arrival-overlay] (z-index 9999) : flash blanc radial + 2 anneaux qui montent + texte "GAMBLELIFE ★ ENTRÉE EN MATIÈRE ★" qui apparaît/disparaît
- **Sprint F4 — FortniteLobby AAA + HomeInterior3D mouvement** :
  - **FortniteLobby** (`FortniteLobby.jsx` réécrit ~440 LOC) : skyline ville GTA-like en CSS (3 couches parallax : silhouettes lointaines + bâtiments avec fenêtres lumineuses + sol/route), coucher de soleil multi-stop, néons cyan/rose accents, lune/soleil radial. Personnage stylisé `<PlayerAvatar>` avec cheveux/torse/bras/jambes/chaussures qui réagissent **dynamiquement** aux cosmétiques équipés (HAIR_CATALOG/OUTFIT_CATALOG/SHOES_CATALOG). Carrousel cosmétiques [data-testid=lobby-cosm-{hair|outfit|shoes}-{prev|next}] : changer la tenue **directement depuis le lobby** persiste via `setProfile`. 4 CTAs (lobby-btn-city/casino/shop/profile) + bouton déconnexion. Halo doré + plateforme rotative sous le perso.
  - **HomeInterior3D** (`HomeInterior3D.jsx` lignes 763-925) : déplacement WASD/ZQSD + flèches + drag-to-look (pointer events). 6 boutons D-pad mobiles [data-testid=home-dpad-{fwd|back|left|right|rotL|rotR}]. Détection auto-proximité au cercle bleu : ouvre la modal customize sans clic. Collision murs (margin 0.5m).
- **Hooks de test étendus** : `window.__streetTeleport(x,z)`, `window.__openGarage()`, `window.__getStreetPos()` exposés depuis Street3D pour validation E2E déterministe.

### ✅ Implemented (Feb 2026 — Sprint G1/G2/G3/G4, validated iteration_9)
- **Sprint G1 — Adaptation Mobile/PC** : nouvel écran `DeviceSelect.jsx` entre ServerSelect et FortniteLobby. Auto-détection touch/screen, choix sauvegardé dans `localStorage.gamblelife_device`. Cartes PC/Mobile avec features distinctes. `deviceType` propagé à FortniteLobby/Street3D/Lobby3D pour adaptation des contrôles.
- **Sprint G2 — Map cleanup + Ciel** :
  - **Soleil** : grand disque émissif (28m radius) + 2 halos dorés/orangés à (380, 90, -20)
  - **14 nuages volumétriques** (sphères blanches groupées) qui dérivent à 55-80m d'altitude
  - **Allée de palmiers 10m** : ~62 palmiers (côté terrestre x=78 et côté mer x=112) tous les 12m sur z=-180→180, avec couronne de 8 feuilles + 3-5 noix de coco
  - **Bâtiments procéduraux exclus** de la zone plage/mer (x > 75)
  - **Lampadaires/barrières/arbres** également exclus de x > 75
  - **Death barrière périmètre** : poteaux rouge/jaune avec bandes alternées qui ceinturent toute la ville (x ∈ [-410, 75], z ∈ [-410, 410]) et se relient aux limites de la plage (z = ±200) puis à la death barrière mer (x = 124)
- **Sprint G3 — Animation arrivée + Menu universel + Trophées** :
  - **Animation d'arrivée maison** ajoutée dans `HomeInterior3D.jsx` : `[data-testid=home-arrival-overlay]` similaire au casino, durée 4s, affiche le nom de la propriété + flash blanc + anneau doré + texte "★ BIENVENUE ★"
  - **UniversalMenu** (`/app/frontend/src/game/UniversalMenu.jsx`) : bouton flottant `[data-testid=universal-menu-btn]` accessible depuis FortniteLobby, Street3D, Lobby3D, HomeInterior3D. Drawer avec : Trophées, Quêtes, Boutique, Choix appareil. Header avec niveau + solde.
  - **Z-index Onboarding** réduit (9000 → 250) pour ne plus bloquer les modals (Garage, Shop)
- **Sprint G4 — Boutique casino + GambleLife Store + Quads** :
  - **Chichas** : nouvelle catégorie `HOOKAHS` dans constants.js (3 modèles : Classique 1M$, Or VIP 5M$, Platine 12M$). Onglet `[data-testid=shop-tab-hookahs]` dans Shop.jsx avec illustrations 3D-style (base + tube + embout + fumée animée CSS). `handleBuyCosmetic` étendu pour gérer le slot 'hookah' (stockage dans `profile.hookahs[]` + `equippedHookah`).
  - **Quads** : 2 nouveaux véhicules ajoutés à VEHICLES (`quad` 8M$ speedMul 3.6× et `quad-pro` 18M$ speedMul 4.5×, plus rapides que le vélo à 3×). Apparaissent automatiquement dans le Garage modal.
  - **GambleLife Store agrandi** : building 18×8×11m (vs 12×5.5×8 avant), 4 grandes vitrines avec mannequins multicolores, cadres dorés épais, porte centrale + tapis rouge, 2 piliers d'entrée dorés + boules lumineuses, enseigne "★ GAMBLELIFE STORE ★" 13×2.7m avec sous-titre "Armes · Véhicules · Cosmétiques", 2 néons cyan latéraux, corniche dorée sur le toit. Position (28, 0, 30).
  - **Garage + Store orientés vers le casino** : `garage.rotation.y = Math.PI` et `shopFr.rotation.y = Math.PI` — les façades sont maintenant face au casino (-Z).

### ✅ Implemented (Feb 2026 — Sprint G ext., self-tested)
- **Trophées plus difficiles** : seuils multipliés ×3-5 dans `constants.js` TROPHIES (Bronze 50K→150K, Argent 250K→750K, Or 750K→2.5M, ..., GambleGod 1B→5B). Récompenses augmentées en proportion (×1.6-2). Progression beaucoup plus lente vers les rangs supérieurs.
- **Animation Chicha en main + fumée** (`FPWeapon.jsx` + `Lobby3D.jsx`) :
  - Nouveau composant `<FPHookahView hookahId isUsing>` exporté depuis FPWeapon.jsx
  - Quand profile.equippedHookah est défini et viewMode=='first' dans le casino, la chicha (base + tube + foyer + main qui tient) s'affiche en bas-droite
  - Bouton `[data-testid=lobby-hookah-btn]` apparaît dans la barre de tir si chicha équipée
  - Au clic : animation 3s "tube vers la bouche" (translate + rotate -12°) PUIS 4s "grosse fumée blanche" (8 puffs radial-gradient avec scale 0.4→2.5, drift -180px, blur 8px)
  - Couleurs adaptées selon modèle : Classique blanc, Or doré, Platine bleu glacé

### ✅ Implemented (Feb 2026 — Sprint G ext.2, validated iteration_10)
- **Chicha étendue à Street3D + HomeInterior3D** : boutons `[data-testid=street-hookah-btn]` (ville) et `[data-testid=home-hookah-btn]` (maisons). FPHookahView rendu en bas-droite avec tube animé + fumée 4s. Le pattern useHookah() identique dans 3 fichiers (à extraire en hook custom plus tard).
- **RankBadge** (`/app/frontend/src/game/RankBadge.jsx` — 89 LOC) : nouveau composant qui calcule le rang actuel basé sur `profile.totalWinnings` et le compare aux seuils TROPHIES.
  - Variant **compact** (`[data-testid=rank-badge]`) : badge inline icône + nom + couleur du rang
  - Variant **full** (`[data-testid=rank-badge-full]`) : carte complète avec icône grandiose + nom rang + barre de progression vers le prochain palier + pourcentage
  - Intégré dans **FortniteLobby HUD** (top-right sous le nom du joueur, variant compact) et **UniversalMenu drawer** (variant full, remplace l'ancien "Niveau X")
  - Fallback "RECRUE" pour les joueurs en dessous du premier seuil (150K)

## Architecture
- **Roulette 3D sync corrigée** : `Roulette3DWheel.jsx` — correction du bug mathématique de rotation (worldAngle = pocketAngle − wheelAngle, pas +). Pré-calcul de `wheelFinalAngle` au spin start avec 4-5 tours complets + lerp ease-out cubic pour atterrir précisément sous le pointeur. La bille se verrouille sur `POINTER_WORLD_ANGLE = −π/2` au dernier quart de l'animation. Numéros lisibles sur chaque poche via CanvasTexture.
- **Porte de sortie 3D dans le casino** : ajout d'une porte en bois + cadre doré + enseigne cyan "SORTIE" + anneau cyan au sol, à (0, 0, 17.5) dans `Lobby3D.jsx`. Zone d'interaction `zoneId: 'exit'` avec callback `onExitCasino()`. Testids `lobby-exit-label` / `lobby-exit-action-btn`.
- **Véhicules 3D fonctionnels** : `VehicleRig.js` intégré à `Street3D.jsx`. Toggle "MONTER/DESCENDRE" dans le HUD bas. Sélecteur d'emoji 🛹/🚴/🛸 si plusieurs possédés. Multiplicateur de vitesse appliqué (×2/×3/×4.2). Le rig suit la position/rotation du joueur et anime roues + rider via `animateVehicleRig(rig, speed, t)`. Persistance dans `profile.equippedVehicle`.
- **Street3D combat** : ajout de `bullets[]` + `bloodBursts[]` avec physique simple. Bouton "🔫 TIRER" apparaît quand une arme est sélectionnée. Les NPCs ont `health`/`alive` ; à 0 ils tombent au sol. Compteur "☠ Kills" en HUD.
- **Street3D expansion** : NPCs passés de 3 → 8 (couleurs variées). **30 maisons achetables au total** (5 appart + 3 maisons + 2 villas + 20 lofts latéraux `sh-1..sh-20` répartis sur 3 rangées arrière z=-30/-33/-36). 22 bâtiments fake en arrière-plan avec fenêtres émissives. 5 voitures garées. Barrière de mort à x±55 / z<−45 / z>22 avec écran "HORS ZONE" + respawn automatique.
- **🎯 Système de chasse à la prime** : 4 NPCs sur 8 sont flagged `isWanted` avec une prime (25 000 → 500 000 B). Ils affichent un **halo rouge pulsant** au sol + un **panneau "WANTED +XXX B"** billboard face caméra au-dessus de la tête. Éliminer un NPC wanted crédite la prime + affiche un toast "★ PRIME ENCAISSÉE ★" (`street-bounty-toast`).
- **Poker double at Turn fix** : bouton `DOUBLER ×2` amélioré (grisé si solde insuffisant, cursor "not-allowed", message d'erreur clair). Testids ajoutés : `poker-double-btn`, `poker-see-river-btn`, `poker-fold-turn-btn`, `poker-see-turn-btn`. SFX au doubling.
- **Testids additionnels** : `roulette-result` (message fin de spin), `lobby-exit-label`, `lobby-exit-action-btn`, `lobby-zone-<id>` / `lobby-zone-action-<id>` génériques, `street-bounty-toast`.

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
