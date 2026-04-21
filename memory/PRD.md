# Benz Casino — PRD

## Problem Statement (original)
Reprend le code du jeu mobile et applique les modifications:
- Poker: 2 cartes joueur + 2 cartes croupier + 3 flop + 1 turn + 1 river, jouable sans bug
- Roue de la fortune: droite (flat) et recto-verso (numéros lisibles dans tous les sens)
- Animation de tir: balles visibles, partent de l'arme
- Quand une arme est sélectionnée, visible dans les mains en 1ère personne
- Animation de tir uniquement pendant le press du bouton Tirer
- ATM: 1 retrait max par cycle de 5 minutes
- Remplacer "Armurerie" par "Benz Boutique" avec armes (au mur) + véhicules en showroom
- Catégorie véhicule: Skateboard (1 000 000 B, ×2) et Vélo Benz Turbo (5 000 000 B, ×3)
- Vitesses: marche ×1, skateboard ×2, vélo ×3
- Personnalisation du personnage avant d'entrer au casino: 10 coupes, 10 vêtements, 10 chaussures (3 gratuits par catégorie, 7 payants)
- Option vue 1ère / 3ème personne avec bouton au-dessus de l'inventaire
- Amélioration RTP Blackjack (règles casino standards)

## Implementation Status

### ✅ Implemented (Jan 2026)
- ATM: 1 retrait par cycle de 5 min (nextAmount = 15000)
- Benz Boutique: 2 onglets (Armes au mur, Showroom véhicules) avec SVG de véhicules
- Véhicules: Skateboard 1M ×2, Vélo Benz Turbo 5M ×3, équipement / déséquipement
- Vitesse en lobby 3D appliquée selon `equippedVehicle`
- CharacterScreen: 10 coupes + 10 vêtements + 10 chaussures + skin + preview SVG avatar
- Flow: nouveau profil → écran personnalisation → lobby
- Bouton menu "Personnaliser le personnage" pour y revenir
- Bouton 1ère/3ème personne au-dessus de l'inventaire (👁️ 1P / 🧍 3P)
- Overlay arme en main (1ère personne) en SVG selon selectedWeapon (knife/machete/gun/shotgun/bazooka/flamethrower)
- Overlay personnage 3ème personne avec arme collée à la main
- Bouton TIRER press-and-hold (onPointerDown/Up) avec auto-fire selon cadence arme
- Balles visibles uniquement pendant le press, animation `bulletFlyOverlay`
- Muzzle flash visible au moment du tir
- Roue de la fortune: SVG 2D flat avec numéros counter-rotatés (lisibles recto-verso)
- Blackjack: traitement immédiat des blackjacks naturels (joueur et croupier), pay 3:2, dealer BJ affiché

## Architecture
- Stack: React (CRA + CRACO) + Three.js pour le lobby 3D
- Storage: localStorage (clé `profile:<name>`)
- Main file: `/app/frontend/src/components/Casino.jsx`
- Entry: `/app/frontend/src/App.js` → `<Casino />`
- Aucun backend requis pour cette version; `/api/*` prêt mais non utilisé ici

## Core Requirements (Static)
- Pas d'auth serveur (profils locaux)
- Mobile-first: joystick virtuel, touch fire
- Tout le contenu en français

## User Personas
- Joueur casual mobile, utilise téléphone tactile
- Progression via jeux de table + zone de tir + mini-activités

## Prioritized Backlog
- P1: Améliorer la vue 3ème personne (camera derrière un avatar 3D réel dans le lobby Three.js)
- P1: Ajouter split + insurance au Blackjack pour RTP complet ~99.5%
- P2: Barre d'énergie / HP pour le joueur en zone de tir
- P2: Faire monter / descendre visuellement le véhicule dans la scène 3D (actuellement uniquement boost de vitesse)
- P2: Ajouter achievements spécifiques pour personnalisation

## Next Tasks
- Tester toutes les mécaniques via testing agent
- Recueillir retours utilisateur sur les changements
