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

## Architecture
- Stack: React (CRA + CRACO) + Three.js
- Storage: localStorage (clé `profile:<name>`)
- Main file: `/app/frontend/src/components/Casino.jsx`
- Lobby: `/app/frontend/src/game/Lobby3D.jsx` (~4260 lignes, à splitter en hooks)
- Entry: `/app/frontend/src/App.js` → `<Casino />`

## Next Tasks / Prioritized Backlog
- **P1** : 🔊 Sons d'armes (bazooka, laser, throwknife) + sons d'ambiance (foule casino, jetons, cartes).
- **P1** : 🎮 Mode Multijoueur Poker local — plusieurs joueurs sur le même appareil, tour-par-tour Hold'em autour de la table 3D (chaises et animations déjà en place).
- **P2** : Découper `Lobby3D.jsx` (>4000 lignes) en hooks : `useMovement`, `useCollisions`, `useSceneSetup`, `useWeapons`, `useRoulette3D`, `useNPCs`.
- **P2** : Exposer `window.__testHooks` (teleport, fire, setNearZone) pour tests automatisés en headless.
- **P2** : Réel feedback visuel de l'AoE bazooka sur les NPCs touchés (actuellement seulement kill animation).
- **P3** : Progression des quêtes hooks dans les actions BenzBet (compter les paris gagnés).
- **P3** : Mode Live (cotes qui évoluent pendant le match).

## Core Requirements (Static)
- Pas d'auth serveur (profils locaux)
- Mobile-first : joystick virtuel, touch fire
- 100 % du contenu en français
- Aucun backend requis

## User Personas
- Joueur casual mobile, téléphone tactile
- Progression via jeux de table + zone de tir + mini-activités
