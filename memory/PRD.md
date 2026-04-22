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

## Architecture
- Stack: React (CRA + CRACO) + Three.js
- Storage: localStorage (clé `profile:<name>`)
- Main file: `/app/frontend/src/components/Casino.jsx`
- Lobby: `/app/frontend/src/game/Lobby3D.jsx` (~4260 lignes, à splitter en hooks)
- Entry: `/app/frontend/src/App.js` → `<Casino />`

## Next Tasks / Prioritized Backlog
- **P2** : Découper `Lobby3D.jsx` (>4000 lignes) en hooks : `useMovement`, `useCollisions`, `useSceneSetup`, `useWeapons`, `useRoulette3D`, `useNPCs`.
- **P2** : Exposer `window.__testHooks = { teleportTo, setNearZone, fireAt, triggerExplosionAt }` pour permettre la vérification programmatique des animations 3D en headless.
- **P2** : Réel feedback visuel de l'AoE bazooka sur les NPCs touchés (actuellement seulement kill animation).
- **P3** : Effets de son pour les armes (bazooka, laser, throwknife).
- **P3** : Progression des quêtes hooks dans les actions principales (déjà partiellement fait).

## Core Requirements (Static)
- Pas d'auth serveur (profils locaux)
- Mobile-first : joystick virtuel, touch fire
- 100 % du contenu en français
- Aucun backend requis

## User Personas
- Joueur casual mobile, téléphone tactile
- Progression via jeux de table + zone de tir + mini-activités
