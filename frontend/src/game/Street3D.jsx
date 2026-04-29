import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { fmt, VEHICLES, WEAPONS } from '@/game/constants';
import { STAKE } from '@/game/stake/theme';
import { buildVehicleRig, animateVehicleRig } from '@/game/VehicleRig';
import { getActiveEvents } from '@/game/dailyEvents';
import { useLookControls } from '@/game/useLookControls';
import { UniversalMenu } from '@/game/UniversalMenu';
import { FPHookahView } from '@/game/FPWeapon';
import { useHookah } from '@/game/useHookah';
import { useAmbientAudio } from '@/game/useAmbientAudio';
import sfx from '@/game/sfx';

// =============================================================
// HOUSE CATALOG — 32 propriétés (5 appart + 3 maisons + 2 villas + 22 maisons étendues)
// =============================================================
// Les "sh-XX" sont en plusieurs rangées derrière la 1ère ligne de maisons + devant le casino.
// Total : 30 nouvelles maisons (en plus des 5 appartements + 3 maisons + 2 villas + 3 ByJaze = 43 logements)
const _sidePositions = (() => {
  const arr = [];
  // === DERRIÈRE le casino (z négatif) ===
  // Rangée 2 (z=-30) — 7 maisons
  for (let i = 0; i < 7; i++) arr.push({ x: -39 + i * 13, z: -30 });
  // Rangée 3 (z=-33) — 7 maisons décalées
  for (let i = 0; i < 7; i++) arr.push({ x: -32 + i * 11, z: -33 });
  // Rangée 4 (z=-36) — 6 maisons
  for (let i = 0; i < 6; i++) arr.push({ x: -30 + i * 12, z: -36 });
  // === DEVANT le casino, derrière le spawn (z positif) ===
  // Rangée 5 (z=22) — 5 maisons devant le spawn
  for (let i = 0; i < 5; i++) arr.push({ x: -32 + i * 16, z: 22 });
  // Rangée 6 (z=28) — 5 maisons plus loin
  for (let i = 0; i < 5; i++) arr.push({ x: -36 + i * 18, z: 28 });
  return arr;
})();

const _sideNames = [
  // 20 maisons arrière (z = -30, -33, -36)
  'Pavillon Azur', 'Loft Doré', 'Cottage Pin', 'Bungalow Sable', 'Maison Rose',
  'Loft Gris', 'Villa Mauve', 'Loft Turquoise', 'Chalet Cèdre', 'Maison Iris',
  'Loft Ouest A', 'Loft Est A', 'Loft Ouest B', 'Loft Est B', 'Loft Ouest C',
  'Loft Est C', 'Loft Ouest D', 'Loft Est D', 'Loft Ouest E', 'Loft Est E',
  // 10 maisons devant le casino (z = 22, 28)
  'Pavillon Front Or', 'Maison Émeraude', 'Loft Onyx', 'Bungalow Saphir', 'Villa Jade',
  'Cottage Marbre', 'Maison Cosmos', 'Loft Nébuleuse', 'Penthouse Royal', 'Manoir Galaxy',
];

export const HOUSES = [
  // ★ PROPRIÉTÉS CRÉATEUR ByJaze — 1 $ chacune, marquées "★ ByJaze"
  { id: 'bj-apt',   label: '★ Appart ByJaze',  type: 'apartment', price: 1, floor: 2,  x: -22, z: -14, creator: true },
  { id: 'bj-house', label: '★ Maison ByJaze',  type: 'house',     price: 1,            x:   0, z: -26, creator: true },
  { id: 'bj-villa', label: '★ Villa ByJaze',   type: 'villa',     price: 1,            x:  42, z:  -6, creator: true },
  // Immeuble avec 5 appartements (mêmes coords, étages différents)
  { id: 'apt-1', label: 'Appartement 1',  type: 'apartment', price:   5000000, floor: 0, x:  -22, z: -14 },
  { id: 'apt-2', label: 'Appartement 2',  type: 'apartment', price:   5000000, floor: 1, x:  -22, z: -14 },
  { id: 'apt-3', label: 'Appartement 3',  type: 'apartment', price:   5000000, floor: 2, x:  -22, z: -14 },
  { id: 'apt-4', label: 'Appartement 4',  type: 'apartment', price:   5000000, floor: 3, x:  -22, z: -14 },
  { id: 'apt-5', label: 'Appartement 5',  type: 'apartment', price:   5000000, floor: 4, x:  -22, z: -14 },
  // 3 maisons standalone
  { id: 'h-1',   label: 'Maison Bleue',   type: 'house',     price:  10000000, x:  -10, z: -18 },
  { id: 'h-2',   label: 'Maison Beige',   type: 'house',     price:  10000000, x:   -2, z: -18 },
  { id: 'h-3',   label: 'Maison Rouge',   type: 'house',     price:  10000000, x:    6, z: -18 },
  // 2 villas
  { id: 'v-1',   label: 'Villa Marina',   type: 'villa',     price: 100000000, x:   18, z: -20 },
  { id: 'v-2',   label: 'Villa Palmier',  type: 'villa',     price: 100000000, x:   28, z: -15 },
  // 30 maisons/lofts (20 latérales arrière + 10 devant le casino) — prix variés selon position et type
  ..._sidePositions.map((pos, i) => ({
    id: `sh-${i + 1}`,
    label: _sideNames[i] || `Maison ${i + 1}`,
    // Front (i >= 20) → mix house/villa luxe ; back (i < 20) → mix
    type: i >= 20 ? (i % 2 === 0 ? 'villa' : 'house')
        : i < 10 ? 'house'
        : (i % 2 === 0 ? 'villa' : 'house'),
    price: i >= 20 ? (i % 2 === 0 ? 120000000 : 25000000) // front bien plus cher
         : i < 10 ? 8000000
         : (i % 2 === 0 ? 80000000 : 15000000),
    x: pos.x,
    z: pos.z,
  })),
];

// =============================================================
// Composant Street3D — Scène extérieure
// Props : profile, balance, setBalance, onEnterCasino(), onBuyHouse(houseId), onExitGame()
// =============================================================
const Street3D = ({ profile, balance, setBalance, onEnterCasino, onBuyHouse, onExitGame, onOpenHome, onOpenShop, onOpenTrophies, onOpenQuests, deviceType, setProfile, spawnHint, onSpawnConsumed }) => {
  const mountRef = useRef(null);
  const radarRef = useRef(null);
  const stateRef = useRef({});
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [toast, setToast] = useState(null);
  const [nearbyPrompt, setNearbyPrompt] = useState(null);
  const [aptPickerOpen, setAptPickerOpen] = useState(false);
  const [garageOpen, setGarageOpen] = useState(false);
  // ====== CHICHA — hook partagé ======
  const { equippedHookah, hasHookah, usingHookah, useHookah: useHookahFn } = useHookah(profile);

  // ====== AMBIANCE SONORE ville (vagues plage, mouettes, klaxons) ======
  useAmbientAudio({
    stateRef,
    layers: [
      // Vagues : volume ramps up à mesure qu'on s'approche de la plage (x > 65)
      { type: 'waves', target: (p) => Math.max(0, Math.min(0.32, (p.x - 65) / 50 * 0.32)) },
      // Mouettes : oneshots aléatoires, volume basé sur proximité plage
      { type: 'seagull', target: (p) => p.x > 60 ? 0.12 : 0, oneshot: true },
      // Klaxons : oneshots aléatoires, volume basé sur centre de la ville (proche du casino)
      { type: 'horn', target: (p) => (Math.abs(p.x) < 60 && Math.abs(p.z) < 100) ? 0.05 : 0, oneshot: true },
    ],
  });
  const [ridingOn, setRidingOn] = useState(!!profile?.equippedVehicle);
  const [aimingWeapon, setAimingWeapon] = useState(null); // weapon id si on vise
  const [hud, setHud] = useState({ npcKilled: 0, health: 100 });
  const [bountyToast, setBountyToast] = useState(null);
  const [respawning, setRespawning] = useState(false);
  const [activeEvents, setActiveEvents] = useState(() => getActiveEvents());
  const [lookHintShown, setLookHintShown] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLookHintShown(false), 4500);
    return () => clearTimeout(t);
  }, []);

  // Hook : tourner la tête à la souris (PC) / drag tactile (mobile)
  // On exclut les boutons HUD pour pas que tap = lock
  useLookControls(mountRef, stateRef, {
    excludeSelectors: ['button', '[data-no-look]', '.hud-control', '[data-testid$="-modal"]', '[data-testid="street-hud-bottom"]', '[data-testid="street-radar"]'],
  });

  useEffect(() => {
    // Recheck active events every minute (jour change)
    const t = setInterval(() => setActiveEvents(getActiveEvents()), 60000);
    return () => clearInterval(t);
  }, []);

  const ownedKeys = profile?.keys || [];
  const ownedHouses = profile?.ownedHouses || [];

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ----- Scene / Camera / Renderer -----
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9fd7ff); // bleu ciel clair
    // Fog plus lointain pour ville étendue x10
    scene.fog = new THREE.Fog(0x9fd7ff, 150, 550);

    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 900);
    // Position FPS du joueur : milieu de la rue, face au casino
    camera.position.set(0, 2.6, 12);
    camera.lookAt(0, 1.8, -10);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // ----- Lights -----
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const sunLight = new THREE.DirectionalLight(0xfff1c7, 1.2);
    sunLight.position.set(20, 28, 15);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.left = -40;
    sunLight.shadow.camera.right = 40;
    sunLight.shadow.camera.top = 40;
    sunLight.shadow.camera.bottom = -40;
    scene.add(sunLight);

    // Soleil visuel
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(2.5, 24, 18),
      new THREE.MeshBasicMaterial({ color: 0xfff4a3 })
    );
    sun.position.set(25, 30, -40);
    scene.add(sun);
    const sunGlow = new THREE.Mesh(
      new THREE.SphereGeometry(4, 24, 18),
      new THREE.MeshBasicMaterial({ color: 0xffffaa, transparent: true, opacity: 0.25 })
    );
    sunGlow.position.copy(sun.position);
    scene.add(sunGlow);

    // ----- Nuages -----
    const clouds = new THREE.Group();
    for (let i = 0; i < 10; i++) {
      const c = new THREE.Group();
      for (let j = 0; j < 4; j++) {
        const puff = new THREE.Mesh(
          new THREE.SphereGeometry(1.4 + Math.random() * 0.6, 12, 8),
          new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 })
        );
        puff.position.set(j * 1.5 - 2, Math.random() * 0.5, Math.random() * 0.8);
        c.add(puff);
      }
      c.position.set(-60 + i * 14, 22 + Math.random() * 4, -30 + Math.random() * 10);
      c.userData.driftSpeed = 0.008 + Math.random() * 0.01;
      clouds.add(c);
    }
    scene.add(clouds);

    // ----- Oiseaux (4 "V" simples) -----
    const birds = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const bg = new THREE.Group();
      const mat = new THREE.MeshBasicMaterial({ color: 0x111 });
      const wing1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.08), mat);
      wing1.position.set(-0.25, 0, 0); wing1.rotation.z = 0.4;
      const wing2 = wing1.clone(); wing2.position.x = 0.25; wing2.rotation.z = -0.4;
      bg.add(wing1); bg.add(wing2);
      bg.position.set(-10 + i * 4, 15 + i * 0.5, -20 + i * 3);
      bg.userData.phase = Math.random() * Math.PI * 2;
      bg.userData.radius = 15 + i * 2;
      birds.add(bg);
    }
    scene.add(birds);

    // ----- Sol : asphalte ville (pas de pelouse verte !) -----
    const groundGrass = new THREE.Mesh(
      new THREE.PlaneGeometry(1000, 1000),
      new THREE.MeshStandardMaterial({ color: 0x3a3a42, roughness: 0.95 })
    );
    groundGrass.rotation.x = -Math.PI / 2;
    groundGrass.receiveShadow = true;
    scene.add(groundGrass);

    // Quartier central — herbe/parc verte uniquement autour du casino (zone centrale)
    const centralPark = new THREE.Mesh(
      new THREE.PlaneGeometry(110, 65),
      new THREE.MeshStandardMaterial({ color: 0x4a8f3a, roughness: 0.95 })
    );
    centralPark.rotation.x = -Math.PI / 2;
    centralPark.position.set(0, 0.005, -12);
    centralPark.receiveShadow = true;
    scene.add(centralPark);

    // Route principale devant les bâtiments (agrandie)
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(800, 10),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.85 })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.01, -4);
    road.receiveShadow = true;
    scene.add(road);

    // Lignes blanches discontinues (sur toute la longueur)
    for (let i = -380; i <= 380; i += 4) {
      const line = new THREE.Mesh(
        new THREE.PlaneGeometry(2.2, 0.25),
        new THREE.MeshStandardMaterial({ color: 0xfff6b8 })
      );
      line.rotation.x = -Math.PI / 2;
      line.position.set(i, 0.02, -4);
      scene.add(line);
    }

    // Rues perpendiculaires (grille urbaine — tous les 80 m)
    for (let rx = -360; rx <= 360; rx += 80) {
      // Route Nord-Sud
      const r = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 800),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.85 })
      );
      r.rotation.x = -Math.PI / 2;
      r.position.set(rx, 0.012, 0);
      scene.add(r);
      // Lignes jaunes
      for (let iz = -390; iz <= 390; iz += 5) {
        const l = new THREE.Mesh(
          new THREE.PlaneGeometry(0.25, 2.2),
          new THREE.MeshStandardMaterial({ color: 0xfff6b8 })
        );
        l.rotation.x = -Math.PI / 2;
        l.position.set(rx, 0.02, iz);
        scene.add(l);
      }
    }
    // Routes Est-Ouest supplémentaires
    for (let rz = -380; rz <= 380; rz += 80) {
      if (rz === -4) continue; // déjà la route principale
      const r = new THREE.Mesh(
        new THREE.PlaneGeometry(800, 10),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.85 })
      );
      r.rotation.x = -Math.PI / 2;
      r.position.set(0, 0.012, rz);
      scene.add(r);
      for (let ix = -390; ix <= 390; ix += 5) {
        const l = new THREE.Mesh(
          new THREE.PlaneGeometry(2.2, 0.25),
          new THREE.MeshStandardMaterial({ color: 0xfff6b8 })
        );
        l.rotation.x = -Math.PI / 2;
        l.position.set(ix, 0.02, rz);
        scene.add(l);
      }
    }

    // Trottoir devant casino
    const sidewalkFront = new THREE.Mesh(
      new THREE.BoxGeometry(80, 0.15, 2),
      new THREE.MeshStandardMaterial({ color: 0xb0b4b7, roughness: 0.9 })
    );
    sidewalkFront.position.set(0, 0.07, -8);
    sidewalkFront.receiveShadow = true;
    scene.add(sidewalkFront);

    // ====== RUES SECONDAIRES INTERNES (entre maisons + autour casino) ======
    // Allée passant devant les villas latérales (z = -12)
    const sideStreet1 = new THREE.Mesh(
      new THREE.PlaneGeometry(110, 6),
      new THREE.MeshStandardMaterial({ color: 0x303034, roughness: 0.9 })
    );
    sideStreet1.rotation.x = -Math.PI / 2;
    sideStreet1.position.set(0, 0.013, -12);
    scene.add(sideStreet1);
    // Lignes pointillées blanches
    for (let i = -52; i <= 52; i += 4) {
      const l = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 0.18),
        new THREE.MeshStandardMaterial({ color: 0xfff6b8 })
      );
      l.rotation.x = -Math.PI / 2;
      l.position.set(i, 0.022, -12);
      scene.add(l);
    }
    // Allée arrière (z = -25) qui relie la rangée arrière de maisons
    const sideStreet2 = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 5),
      new THREE.MeshStandardMaterial({ color: 0x2f2f33, roughness: 0.9 })
    );
    sideStreet2.rotation.x = -Math.PI / 2;
    sideStreet2.position.set(0, 0.013, -25);
    scene.add(sideStreet2);
    // Pavés latéraux faux pavé pour arrière
    for (let i = -56; i <= 56; i += 4) {
      const l = new THREE.Mesh(
        new THREE.PlaneGeometry(1.8, 0.15),
        new THREE.MeshStandardMaterial({ color: 0xd0c8a8 })
      );
      l.rotation.x = -Math.PI / 2;
      l.position.set(i, 0.022, -25);
      scene.add(l);
    }
    // Allée perpendiculaire vers chaque maison (3 rues coupant la rangée principale)
    for (const cx of [-30, 0, 30]) {
      const cross = new THREE.Mesh(
        new THREE.PlaneGeometry(4, 26),
        new THREE.MeshStandardMaterial({ color: 0x303034, roughness: 0.9 })
      );
      cross.rotation.x = -Math.PI / 2;
      cross.position.set(cx, 0.013, -16);
      scene.add(cross);
      // Lignes jaunes pointillées
      for (let iz = -28; iz <= -4; iz += 3) {
        const l = new THREE.Mesh(
          new THREE.PlaneGeometry(0.18, 1.4),
          new THREE.MeshStandardMaterial({ color: 0xfff6b8 })
        );
        l.rotation.x = -Math.PI / 2;
        l.position.set(cx, 0.022, iz);
        scene.add(l);
      }
    }
    // Trottoirs autour du casino (4 côtés)
    const sidewalkBack = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.15, 1.5),
      new THREE.MeshStandardMaterial({ color: 0xb0b4b7, roughness: 0.9 })
    );
    sidewalkBack.position.set(0, 0.07, -16);
    sidewalkBack.receiveShadow = true;
    scene.add(sidewalkBack);
    for (let s = -1; s <= 1; s += 2) {
      const sidewalkSide = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.15, 14),
        new THREE.MeshStandardMaterial({ color: 0xb0b4b7, roughness: 0.9 })
      );
      sidewalkSide.position.set(s * 9.25, 0.07, -10);
      sidewalkSide.receiveShadow = true;
      scene.add(sidewalkSide);
    }

    // ----- Casino (bâtiment central — visible, entrée grande) -----
    const casinoGroup = new THREE.Group();
    casinoGroup.position.set(0, 0, -10);

    // Corps principal casino
    const casinoBody = new THREE.Mesh(
      new THREE.BoxGeometry(14, 8, 10),
      new THREE.MeshStandardMaterial({ color: 0xe8d9a6, roughness: 0.7 })
    );
    casinoBody.position.y = 4;
    casinoBody.castShadow = true;
    casinoBody.receiveShadow = true;
    casinoGroup.add(casinoBody);

    // Toit rouge
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(15, 1.5, 11),
      new THREE.MeshStandardMaterial({ color: 0x8b2020, roughness: 0.6 })
    );
    roof.position.y = 8.75;
    roof.castShadow = true;
    casinoGroup.add(roof);

    // Enseigne néon "CASINO"
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 1024; signCanvas.height = 256;
    const sctx = signCanvas.getContext('2d');
    sctx.fillStyle = '#0d0612'; sctx.fillRect(0, 0, 1024, 256);
    sctx.shadowColor = '#ffd700'; sctx.shadowBlur = 40;
    sctx.fillStyle = '#ffd700'; sctx.font = 'bold 150px Georgia'; sctx.textAlign = 'center';
    sctx.fillText('CASINO', 512, 170);
    sctx.shadowBlur = 0;
    sctx.fillStyle = '#fff'; sctx.font = 'bold 28px Georgia';
    sctx.fillText('★ GAMBLELIFE ROYAL ★', 512, 220);
    const signTex = new THREE.CanvasTexture(signCanvas);
    const signMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 3),
      new THREE.MeshBasicMaterial({ map: signTex })
    );
    signMesh.position.set(0, 10, 5.05);
    casinoGroup.add(signMesh);

    // Entrée (grande porte en arcade)
    const entrance = new THREE.Mesh(
      new THREE.BoxGeometry(4, 5, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x2a1a0a, emissive: 0x4a2a0a, emissiveIntensity: 0.35 })
    );
    entrance.position.set(0, 2.5, 5.05);
    casinoGroup.add(entrance);
    // Encadrement doré
    const entFrame = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 5.4, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 })
    );
    entFrame.position.set(0, 2.7, 5.02);
    casinoGroup.add(entFrame);

    // Fenêtres
    for (let f = 0; f < 6; f++) {
      const win = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.6, 0.15),
        new THREE.MeshStandardMaterial({ color: 0xffd88a, emissive: 0xffbe2a, emissiveIntensity: 0.4 })
      );
      const side = f % 2 === 0 ? -1 : 1;
      const slot = Math.floor(f / 2);
      win.position.set(side * (3.5 + slot * 1.8), 5.2, 5.05);
      casinoGroup.add(win);
    }

    // Tapis rouge devant l'entrée
    const redCarpet = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 5),
      new THREE.MeshStandardMaterial({ color: 0xaa1a24, roughness: 0.7 })
    );
    redCarpet.rotation.x = -Math.PI / 2;
    redCarpet.position.set(0, 0.08, 7.5);
    casinoGroup.add(redCarpet);

    // Deux piliers dorés devant l'entrée
    for (let s = -1; s <= 1; s += 2) {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 3.5, 16),
        new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 })
      );
      pillar.position.set(s * 2.2, 1.75, 5.2);
      pillar.castShadow = true;
      casinoGroup.add(pillar);
      const pTop = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.25, 0.8),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1, roughness: 0.15 })
      );
      pTop.position.set(s * 2.2, 3.6, 5.2);
      casinoGroup.add(pTop);
    }

    // Hitbox casino door → interaction scan
    casinoGroup.userData = { interaction: 'casino' };
    scene.add(casinoGroup);

    // === INTERACTABLES : collecte des positions pour la détection de proximité ===
    // Note : on stocke la position WORLD en se basant sur le groupe parent
    const interactables = [];
    // Casino : point d'interaction sur le tapis rouge devant la barrière
    interactables.push({ type: 'casino', pos: new THREE.Vector3(0, 0, 0), radius: 12 });

    // ----- Immeuble 5 appartements (gauche de la rue) -----
    const buildingGroup = new THREE.Group();
    buildingGroup.position.set(-22, 0, -14);
    const building = new THREE.Mesh(
      new THREE.BoxGeometry(8, 14, 7),
      new THREE.MeshStandardMaterial({ color: 0xc8b394, roughness: 0.85 })
    );
    building.position.y = 7;
    building.castShadow = true;
    building.receiveShadow = true;
    buildingGroup.add(building);
    // Toit plat
    const bRoof = new THREE.Mesh(
      new THREE.BoxGeometry(8.6, 0.4, 7.6),
      new THREE.MeshStandardMaterial({ color: 0x5a3a2a })
    );
    bRoof.position.y = 14.2;
    buildingGroup.add(bRoof);
    // Fenêtres par étage (5 étages × 3 fenêtres)
    for (let fl = 0; fl < 5; fl++) {
      for (let wc = 0; wc < 3; wc++) {
        const owned = ownedKeys.includes(`apt-${fl + 1}`);
        const win = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 1.4, 0.15),
          new THREE.MeshStandardMaterial({
            color: owned ? 0xffd88a : 0x6a7a8a,
            emissive: owned ? 0xffbe2a : 0x000,
            emissiveIntensity: owned ? 0.35 : 0,
            roughness: 0.4,
          })
        );
        win.position.set(-2.4 + wc * 2.4, 2 + fl * 2.5, 3.55);
        buildingGroup.add(win);
      }
      // Balcon étage ≥ 1
      if (fl > 0) {
        const bal = new THREE.Mesh(
          new THREE.BoxGeometry(7, 0.15, 0.8),
          new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.6, roughness: 0.3 })
        );
        bal.position.set(0, 1.5 + fl * 2.5, 3.9);
        buildingGroup.add(bal);
      }
    }
    // Porte immeuble
    const bDoor = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 2.5, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x2a1a0a })
    );
    bDoor.position.set(0, 1.25, 3.55);
    buildingGroup.add(bDoor);
    // Étiquette "IMMEUBLE - 5 APPARTS" au-dessus
    const bLabelCvs = document.createElement('canvas');
    bLabelCvs.width = 512; bLabelCvs.height = 128;
    const blctx = bLabelCvs.getContext('2d');
    blctx.fillStyle = '#0a0a0f'; blctx.fillRect(0, 0, 512, 128);
    blctx.fillStyle = '#ffd700'; blctx.font = 'bold 36px Georgia'; blctx.textAlign = 'center';
    blctx.fillText('LES RÉSIDENCES', 256, 50);
    blctx.fillStyle = '#fff'; blctx.font = '22px Georgia';
    blctx.fillText('5 APPARTEMENTS · 5M $', 256, 90);
    const bLabelTex = new THREE.CanvasTexture(bLabelCvs);
    const bLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 1), new THREE.MeshBasicMaterial({ map: bLabelTex, transparent: true })
    );
    bLabel.position.set(0, 4, 3.6);
    buildingGroup.add(bLabel);
    scene.add(buildingGroup);

    // 3 maisons standalone (positions ajustées pour ne pas être cachées par le casino)
    const houseColors = [
      { wall: 0x6bb6d8, roof: 0x3a5a7a, label: 'Maison Bleue' },
      { wall: 0xe8c58a, roof: 0x8b5a3a, label: 'Maison Beige' },
      { wall: 0xc8586a, roof: 0x5a1a24, label: 'Maison Rouge' },
    ];
    const housePositions = [
      { x: -15, z: -22 },   // entre immeuble et casino (côté gauche)
      { x:  -8, z: -26 },   // plus reculée derrière le casino gauche
      { x:  12, z: -22 },   // entre casino et villas
    ];
    housePositions.forEach((p, i) => {
      const hg = new THREE.Group();
      hg.position.set(p.x, 0, p.z);
      // Corps
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(5.5, 4, 5),
        new THREE.MeshStandardMaterial({ color: houseColors[i].wall, roughness: 0.8 })
      );
      body.position.y = 2;
      body.castShadow = true; body.receiveShadow = true;
      hg.add(body);
      // Toit (prisme via cône à 4 faces)
      const roofM = new THREE.Mesh(
        new THREE.ConeGeometry(4.2, 1.8, 4),
        new THREE.MeshStandardMaterial({ color: houseColors[i].roof })
      );
      roofM.rotation.y = Math.PI / 4;
      roofM.position.y = 4.9;
      hg.add(roofM);
      // Porte
      const owned = ownedKeys.includes(`h-${i + 1}`);
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 2.2, 0.14),
        new THREE.MeshStandardMaterial({
          color: owned ? 0xd4af37 : 0x2a1a0a,
          metalness: owned ? 0.9 : 0, roughness: owned ? 0.2 : 0.8,
        })
      );
      door.position.set(0, 1.1, 2.56);
      hg.add(door);
      // Fenêtres
      for (let w = 0; w < 2; w++) {
        const win = new THREE.Mesh(
          new THREE.BoxGeometry(1.1, 1.2, 0.15),
          new THREE.MeshStandardMaterial({
            color: owned ? 0xffd88a : 0x8faabc,
            emissive: owned ? 0xffbe2a : 0,
            emissiveIntensity: owned ? 0.4 : 0,
          })
        );
        win.position.set(-1.8 + w * 3.6, 2.4, 2.56);
        hg.add(win);
      }
      // Petit jardin + haie
      const lawn = new THREE.Mesh(
        new THREE.PlaneGeometry(6, 2),
        new THREE.MeshStandardMaterial({ color: 0x3e8a3a })
      );
      lawn.rotation.x = -Math.PI / 2;
      lawn.position.set(0, 0.02, 4);
      hg.add(lawn);
      // Label prix flottant
      const lcv = document.createElement('canvas');
      lcv.width = 512; lcv.height = 128;
      const lcx = lcv.getContext('2d');
      lcx.fillStyle = 'rgba(10,10,15,0.9)'; lcx.fillRect(0, 0, 512, 128);
      lcx.fillStyle = owned ? '#1aa34a' : '#ffd700';
      lcx.font = 'bold 34px Georgia'; lcx.textAlign = 'center';
      lcx.fillText(houseColors[i].label, 256, 48);
      lcx.fillStyle = '#fff'; lcx.font = '24px Georgia';
      lcx.fillText(owned ? '★ À VOUS ★' : '10 000 000 $', 256, 92);
      const labelTex = new THREE.CanvasTexture(lcv);
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(4, 1),
        new THREE.MeshBasicMaterial({ map: labelTex, transparent: true })
      );
      label.position.set(0, 6.5, 0);
      label.userData.isLabel = true;
      hg.add(label);
      // Interaction
      hg.userData = { interaction: 'house', houseId: `h-${i + 1}` };
      scene.add(hg);
      interactables.push({ type: 'house', id: `h-${i + 1}`, pos: new THREE.Vector3(p.x, 0, p.z), radius: 8 });
    });

    // ----- 2 villas -----
    const villaPositions = [
      { x: 22, z: -18, id: 'v-1', name: 'Villa Marina' },
      { x: 34, z: -14, id: 'v-2', name: 'Villa Palmier' },
    ];
    villaPositions.forEach((v) => {
      const vg = new THREE.Group();
      vg.position.set(v.x, 0, v.z);
      // Grande base blanche 2 étages
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(9, 6, 7),
        new THREE.MeshStandardMaterial({ color: 0xf5ecd7, roughness: 0.7 })
      );
      base.position.y = 3;
      base.castShadow = true; base.receiveShadow = true;
      vg.add(base);
      // Étage supérieur plus petit (terrasse)
      const upper = new THREE.Mesh(
        new THREE.BoxGeometry(6.5, 3, 5),
        new THREE.MeshStandardMaterial({ color: 0xe8d9a0, roughness: 0.7 })
      );
      upper.position.y = 7.5;
      upper.castShadow = true;
      vg.add(upper);
      // Toit terracotta
      const vRoof = new THREE.Mesh(
        new THREE.ConeGeometry(5, 1.5, 4),
        new THREE.MeshStandardMaterial({ color: 0xcc6a2a })
      );
      vRoof.rotation.y = Math.PI / 4;
      vRoof.position.y = 9.75;
      vg.add(vRoof);
      const owned = ownedKeys.includes(v.id);
      // Porte d'entrée
      const vDoor = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 2.8, 0.16),
        new THREE.MeshStandardMaterial({
          color: owned ? 0xd4af37 : 0x3a2418,
          metalness: owned ? 0.9 : 0.2, roughness: owned ? 0.2 : 0.7,
        })
      );
      vDoor.position.set(0, 1.4, 3.55);
      vg.add(vDoor);
      // Fenêtres grandes
      for (let fl = 0; fl < 2; fl++) {
        for (let w = 0; w < 3; w++) {
          const win = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 1.4, 0.15),
            new THREE.MeshStandardMaterial({
              color: owned ? 0xffd88a : 0x8faabc,
              emissive: owned ? 0xffbe2a : 0,
              emissiveIntensity: owned ? 0.45 : 0,
            })
          );
          win.position.set(-3 + w * 3, 2.5 + fl * 2.6, 3.55);
          vg.add(win);
        }
      }
      // Palmier déco devant
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.2, 3, 8),
        new THREE.MeshStandardMaterial({ color: 0x4a2a0a })
      );
      trunk.position.set(-4, 1.5, 4);
      vg.add(trunk);
      for (let pl = 0; pl < 6; pl++) {
        const leaf = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.06, 1.8),
          new THREE.MeshStandardMaterial({ color: 0x3aaa3a })
        );
        leaf.position.set(-4, 3.2, 4);
        leaf.rotation.y = (pl * Math.PI) / 3;
        leaf.rotation.z = -0.3;
        vg.add(leaf);
      }
      // Label prix
      const lcv = document.createElement('canvas');
      lcv.width = 512; lcv.height = 128;
      const lcx = lcv.getContext('2d');
      lcx.fillStyle = 'rgba(10,10,15,0.9)'; lcx.fillRect(0, 0, 512, 128);
      lcx.fillStyle = owned ? '#1aa34a' : '#ffd700';
      lcx.font = 'bold 34px Georgia'; lcx.textAlign = 'center';
      lcx.fillText(v.name, 256, 48);
      lcx.fillStyle = '#fff'; lcx.font = '24px Georgia';
      lcx.fillText(owned ? '★ À VOUS ★' : '100 000 000 $', 256, 92);
      const labelTex = new THREE.CanvasTexture(lcv);
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(4.5, 1.2),
        new THREE.MeshBasicMaterial({ map: labelTex, transparent: true })
      );
      label.position.set(0, 11, 0);
      vg.add(label);
      vg.userData = { interaction: 'house', houseId: v.id };
      scene.add(vg);
      interactables.push({ type: 'house', id: v.id, pos: new THREE.Vector3(v.x, 0, v.z), radius: 8 });
    });
    // Immeuble 5 apparts — clickable pour choix d'étage
    interactables.push({ type: 'building', id: 'apt-1', pos: new THREE.Vector3(-22, 0, -14), radius: 8 });

    // === OBSTACLES (AABB simples pour collision) — déclaré tôt pour autres pushes ===
    const obstacles = [
      { minX: -7,   maxX: 7,    minZ: -15, maxZ: -5  },   // Casino
      { minX: -26,  maxX: -18,  minZ: -17, maxZ: -10 },   // Immeuble
      { minX: -17,  maxX: -13,  minZ: -24, maxZ: -20 },   // Maison bleue
      { minX: -10,  maxX: -6,   minZ: -28, maxZ: -24 },   // Maison beige
      { minX: 10,   maxX: 14,   minZ: -24, maxZ: -20 },   // Maison rouge
      { minX: 18,   maxX: 26,   minZ: -21, maxZ: -14 },   // Villa Marina
      { minX: 30,   maxX: 38,   minZ: -17, maxZ: -10 },   // Villa Palmier
    ];
    const collidesAt = (x, z) => {
      const r = 0.45;
      return obstacles.some(o => x + r > o.minX && x - r < o.maxX && z + r > o.minZ && z - r < o.maxZ);
    };

    // ===== ★ MAISONS CRÉATEUR ByJaze (bj-*) — 1 $ chacune, style doré distinctif =====
    const creatorProps = HOUSES.filter(h => h.creator && h.type !== 'apartment');
    creatorProps.forEach((bh) => {
      const owned = ownedKeys.includes(bh.id);
      const isVilla = bh.type === 'villa';
      const g = new THREE.Group();
      g.position.set(bh.x, 0, bh.z);
      // Base
      const bodyW = isVilla ? 8 : 5.5;
      const bodyH = isVilla ? 6 : 4;
      const bodyD = isVilla ? 7 : 5;
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(bodyW, bodyH, bodyD),
        new THREE.MeshStandardMaterial({
          color: 0x1a1a1f, metalness: 0.5, roughness: 0.4,
          emissive: 0x2a1f08, emissiveIntensity: 0.3,
        })
      );
      base.position.y = bodyH / 2;
      base.castShadow = true; base.receiveShadow = true;
      g.add(base);
      // Finitions dorées (lisérés lumineux)
      const goldStrip = new THREE.Mesh(
        new THREE.BoxGeometry(bodyW + 0.1, 0.12, bodyD + 0.1),
        new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 1, roughness: 0.15, emissive: 0xd4af37, emissiveIntensity: 0.6 })
      );
      goldStrip.position.y = bodyH - 0.15;
      g.add(goldStrip);
      // Toit
      if (isVilla) {
        // Villa moderne : toit plat + deuxième niveau plus petit
        const upper = new THREE.Mesh(
          new THREE.BoxGeometry(bodyW - 1.5, 2.4, bodyD - 1.5),
          new THREE.MeshStandardMaterial({ color: 0x2a2a2f, metalness: 0.6, roughness: 0.35 })
        );
        upper.position.y = bodyH + 1.2;
        g.add(upper);
      } else {
        const roof = new THREE.Mesh(
          new THREE.ConeGeometry(4.2, 1.8, 4),
          new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 1, roughness: 0.2 })
        );
        roof.rotation.y = Math.PI / 4;
        roof.position.y = bodyH + 0.9;
        g.add(roof);
      }
      // Porte dorée glow
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 2.5, 0.16),
        new THREE.MeshStandardMaterial({
          color: 0xd4af37, metalness: 1, roughness: 0.15,
          emissive: 0xffd700, emissiveIntensity: 0.8,
        })
      );
      door.position.set(0, 1.25, bodyD / 2 + 0.05);
      g.add(door);
      // Fenêtres émissives cyan
      for (let fl = 0; fl < (isVilla ? 2 : 1); fl++) {
        for (let w = 0; w < 3; w++) {
          const win = new THREE.Mesh(
            new THREE.BoxGeometry(1.1, 1.3, 0.14),
            new THREE.MeshStandardMaterial({
              color: 0x3fe6ff, emissive: 0x3fe6ff, emissiveIntensity: 0.9,
            })
          );
          win.position.set(-2.5 + w * 2.5, 2 + fl * 2.5, bodyD / 2 + 0.05);
          g.add(win);
        }
      }
      // Piscine pour villa (bassin bleu devant)
      if (isVilla) {
        const pool = new THREE.Mesh(
          new THREE.BoxGeometry(4, 0.05, 2.5),
          new THREE.MeshStandardMaterial({ color: 0x1ea0d0, emissive: 0x1ea0d0, emissiveIntensity: 0.4, metalness: 0.5, roughness: 0.2 })
        );
        pool.position.set(-bodyW / 2 - 3, 0.08, bodyD / 2 - 1.5);
        g.add(pool);
      }
      // Label flottant doré
      const lcv = document.createElement('canvas');
      lcv.width = 512; lcv.height = 140;
      const lcx = lcv.getContext('2d');
      lcx.fillStyle = 'rgba(10,10,15,0.95)'; lcx.fillRect(0, 0, 512, 140);
      lcx.strokeStyle = '#ffd700'; lcx.lineWidth = 4; lcx.strokeRect(3, 3, 506, 134);
      lcx.fillStyle = '#ffd700'; lcx.font = 'bold 30px Georgia'; lcx.textAlign = 'center';
      lcx.fillText('★ CRÉATEUR ByJaze ★', 256, 48);
      lcx.fillStyle = '#fff'; lcx.font = 'bold 26px Georgia';
      lcx.fillText(bh.label.replace('★ ', ''), 256, 82);
      lcx.fillStyle = owned ? '#1aa34a' : '#ffd700'; lcx.font = 'bold 30px Georgia';
      lcx.fillText(owned ? 'À VOUS' : '1 $', 256, 120);
      const labelTex = new THREE.CanvasTexture(lcv);
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(4, 1.2),
        new THREE.MeshBasicMaterial({ map: labelTex, transparent: true })
      );
      label.position.set(0, bodyH + (isVilla ? 4 : 3), 0);
      g.add(label);
      g.userData = { interaction: 'house', houseId: bh.id };
      scene.add(g);
      interactables.push({ type: 'house', id: bh.id, pos: new THREE.Vector3(bh.x, 0, bh.z), radius: 8 });
      obstacles.push({
        minX: bh.x - bodyW / 2 - 0.3, maxX: bh.x + bodyW / 2 + 0.3,
        minZ: bh.z - bodyD / 2 - 0.3, maxZ: bh.z + bodyD / 2 + 0.3,
      });
    });

    // ----- Barricades périmètre (bornes rouges & blanches) -----
    const barrier = new THREE.Group();
    const addPost = (x, z) => {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 1.4, 8),
        new THREE.MeshStandardMaterial({ color: 0xdd2222, metalness: 0.3, roughness: 0.4 })
      );
      post.position.set(x, 0.7, z);
      barrier.add(post);
      // Bande blanche haut
      const band = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.25, 8),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      band.position.set(x, 1.25, z);
      barrier.add(band);
    };
    // Ligne arrière (z=-38, après les nouvelles maisons)
    for (let x = -48; x <= 48; x += 4) addPost(x, -38);
    // Lignes latérales (étendues jusqu'à z=-38)
    for (let z = -38; z <= 8; z += 4) { addPost(-48, z); addPost(48, z); }
    // Ligne front route (z=8 devant joueur)
    for (let x = -48; x <= 48; x += 4) addPost(x, 8);
    scene.add(barrier);

    // ----- Arbres aléatoires espacés entre les maisons -----
    for (let i = 0; i < 6; i++) {
      const tx = -30 + i * 12;
      const tz = -25;
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.35, 2.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x4a2a0a })
      );
      trunk.position.set(tx, 1.25, tz);
      trunk.castShadow = true;
      scene.add(trunk);
      const foliage = new THREE.Mesh(
        new THREE.SphereGeometry(1.4, 12, 10),
        new THREE.MeshStandardMaterial({ color: 0x2a7a3a })
      );
      foliage.position.set(tx, 3.5, tz);
      foliage.castShadow = true;
      scene.add(foliage);
    }

    // === OBSTACLES (AABB simples pour collision) — déclaré tôt pour autres pushes ===
    // (déplacé plus haut, avant le bloc ByJaze)

    // ----- Maisons supplémentaires décoratives + interactables (étendent la rue) -----
    const extraColors = [
      { wall: 0x7a9ac8, roof: 0x1a2a4a }, { wall: 0xd8a868, roof: 0x6a3018 },
      { wall: 0x8ab06a, roof: 0x3a5a1a }, { wall: 0xe0b4aa, roof: 0x8b2a2a },
      { wall: 0xc0c0c0, roof: 0x3a3a3a }, { wall: 0xa0889a, roof: 0x3a1a3a },
      { wall: 0xb8d4e8, roof: 0x2a5a7a }, { wall: 0xe8ca98, roof: 0x8a5a30 },
    ];
    // On utilise les positions du catalogue HOUSES pour garantir cohérence avec le popup achat
    const sideHouses = HOUSES.filter(h => h.id.startsWith('sh-'));
    sideHouses.forEach((sh, idx) => {
      const c = extraColors[idx % extraColors.length];
      const ownedSh = ownedKeys.includes(sh.id);
      const g = new THREE.Group();
      g.position.set(sh.x, 0, sh.z);
      const bodyW = 4.5 + (idx % 3);
      const bodyH = 3.5 + (idx % 2);
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(bodyW, bodyH, 4),
        new THREE.MeshStandardMaterial({ color: c.wall, roughness: 0.85 })
      );
      body.position.y = bodyH / 2 + ((idx % 2) * 0.25);
      body.castShadow = true; body.receiveShadow = true;
      g.add(body);
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(3.5, 1.5, 4),
        new THREE.MeshStandardMaterial({ color: c.roof })
      );
      roof.rotation.y = Math.PI / 4;
      roof.position.y = bodyH + 0.7 + ((idx % 2) * 0.25);
      g.add(roof);
      // Porte (doré si possédée)
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 1.8, 0.12),
        new THREE.MeshStandardMaterial({
          color: ownedSh ? 0xd4af37 : 0x2a1a0a,
          metalness: ownedSh ? 0.9 : 0, roughness: ownedSh ? 0.2 : 0.7,
        })
      );
      door.position.set(0, 0.9, 2.05);
      g.add(door);
      const winMat = new THREE.MeshStandardMaterial({
        color: ownedSh ? 0xffd88a : 0x8faabc,
        emissive: ownedSh ? 0xffbe2a : 0,
        emissiveIntensity: ownedSh ? 0.4 : 0.1,
      });
      for (let w = 0; w < 2; w++) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1, 0.12), winMat);
        win.position.set(-1.4 + w * 2.8, 2.1, 2.05);
        g.add(win);
      }
      // Label prix flottant — petit
      const lcv = document.createElement('canvas');
      lcv.width = 512; lcv.height = 128;
      const lcx = lcv.getContext('2d');
      lcx.fillStyle = 'rgba(10,10,15,0.9)'; lcx.fillRect(0, 0, 512, 128);
      lcx.fillStyle = ownedSh ? '#1aa34a' : '#ffd700';
      lcx.font = 'bold 30px Georgia'; lcx.textAlign = 'center';
      lcx.fillText(sh.label, 256, 50);
      lcx.fillStyle = '#fff'; lcx.font = '22px Georgia';
      lcx.fillText(ownedSh ? '★ À VOUS ★' : fmt(sh.price) + ' $', 256, 92);
      const labelTex = new THREE.CanvasTexture(lcv);
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(3.2, 0.9),
        new THREE.MeshBasicMaterial({ map: labelTex, transparent: true })
      );
      label.position.set(0, bodyH + 2.5, 0);
      g.add(label);
      g.userData = { interaction: 'house', houseId: sh.id };
      scene.add(g);
      interactables.push({ type: 'house', id: sh.id, pos: new THREE.Vector3(sh.x, 0, sh.z), radius: 6 });
      // Collision AABB
      obstacles.push({
        minX: sh.x - bodyW / 2 - 0.3, maxX: sh.x + bodyW / 2 + 0.3,
        minZ: sh.z - 2.3, maxZ: sh.z + 2.3,
      });
    });

    // Voitures garées (décor)
    for (let i = 0; i < 5; i++) {
      const parked = new THREE.Group();
      const cx = -36 + i * 18;
      const cz = 3.5;
      const pBody = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.55, 1),
        new THREE.MeshStandardMaterial({
          color: [0x3a3a3a, 0xc0c0c0, 0x2a4a8a, 0x6a1a2a, 0xd8a858][i],
          metalness: 0.6, roughness: 0.3,
        })
      );
      pBody.position.y = 0.5;
      parked.add(pBody);
      const pCab = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.45, 0.9),
        new THREE.MeshStandardMaterial({ color: 0x1a2a3a, metalness: 0.7 })
      );
      pCab.position.set(-0.05, 0.95, 0);
      parked.add(pCab);
      for (let wx = -1; wx <= 1; wx += 2) {
        for (let wz = -1; wz <= 1; wz += 2) {
          const w = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.25, 0.18, 10),
            new THREE.MeshStandardMaterial({ color: 0x0a0a0a })
          );
          w.rotation.z = Math.PI / 2;
          w.position.set(wx * 0.8, 0.25, wz * 0.45);
          parked.add(w);
        }
      }
      parked.position.set(cx, 0, cz);
      scene.add(parked);
    }

    // ----- Raycaster pour les clics -----
    const raycaster = new THREE.Raycaster();
    const mouseV = new THREE.Vector2();

    const handleClick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseV.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseV.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouseV, camera);
      const hits = raycaster.intersectObjects(scene.children, true);
      for (const h of hits) {
        let obj = h.object;
        while (obj && !obj.userData?.interaction) obj = obj.parent;
        if (!obj) continue;
        const { interaction, houseId } = obj.userData;
        if (interaction === 'casino') {
          stateRef.current.onCasinoClick?.();
          return;
        }
        if (interaction === 'house' && houseId) {
          stateRef.current.onHouseClick?.(houseId);
          return;
        }
      }
    };
    renderer.domElement.addEventListener('click', handleClick);

    // ----- NPCs piétons (8) qui marchent sur le trottoir -----
    const npcs = new THREE.Group();
    const npcColors = [
      { skin: 0xe0b48a, shirt: 0xc93a3a, pants: 0x1a2a3a },
      { skin: 0xb88866, shirt: 0x3a8aa0, pants: 0x2a1a1a },
      { skin: 0xd0a080, shirt: 0xe8c058, pants: 0x1a1a1a },
      { skin: 0xc89b78, shirt: 0x6a2a8a, pants: 0x1a1a2a },
      { skin: 0xd8b99a, shirt: 0x1aa34a, pants: 0x2a2a1a },
      { skin: 0xa87a5a, shirt: 0xd4af37, pants: 0x1a1a1a },
      { skin: 0xe0b48a, shirt: 0x0a6aa8, pants: 0x3a1a1a },
      { skin: 0xcca080, shirt: 0xcc4a1a, pants: 0x1a2a3a },
    ];
    npcColors.forEach((c, i) => {
      const npc = new THREE.Group();
      // Corps
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.7, 0.3),
        new THREE.MeshStandardMaterial({ color: c.shirt, roughness: 0.9 })
      );
      body.position.y = 1.15;
      body.castShadow = true;
      npc.add(body);
      // Jambes
      const legL = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.8, 0.18),
        new THREE.MeshStandardMaterial({ color: c.pants })
      );
      legL.position.set(-0.1, 0.4, 0);
      npc.add(legL);
      const legR = legL.clone();
      legR.position.x = 0.1;
      npc.add(legR);
      // Bras
      const armL = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.55, 0.14),
        new THREE.MeshStandardMaterial({ color: c.shirt })
      );
      armL.position.set(-0.3, 1.2, 0);
      npc.add(armL);
      const armR = armL.clone();
      armR.position.x = 0.3;
      npc.add(armR);
      // Tête
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 12, 10),
        new THREE.MeshStandardMaterial({ color: c.skin })
      );
      head.position.y = 1.72;
      head.castShadow = true;
      npc.add(head);
      // Cheveux simples (disque)
      const hair = new THREE.Mesh(
        new THREE.SphereGeometry(0.23, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0x2a1a10 })
      );
      hair.position.y = 1.78;
      npc.add(hair);

      // Trajectoire : va et vient le long du trottoir, positions variées
      npc.position.set(-38 + i * 10, 0, -8 + (i % 2 === 0 ? 0 : 16));
      // Bounty : 40 % des NPCs sont "wanted" avec une prime affichée
      const isWanted = i % 5 === 0 || i % 5 === 2; // 4 sur 8 (0, 2, 5, 7)
      const bountyAmount = isWanted ? [25000, 50000, 100000, 250000, 500000][i % 5] : 0;
      npc.userData = {
        parts: { legL, legR, armL, armR },
        speed: 0.035 + Math.random() * 0.025,
        direction: i % 2 === 0 ? 1 : -1,
        phase: Math.random() * Math.PI * 2,
        alive: true,
        health: 100,
        bodyMesh: body,
        isWanted,
        bounty: bountyAmount,
      };
      // Halo + panneau "WANTED" au-dessus
      if (isWanted) {
        // Halo rouge au sol
        const halo = new THREE.Mesh(
          new THREE.RingGeometry(0.7, 1.1, 24),
          new THREE.MeshBasicMaterial({ color: 0xff1a24, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
        );
        halo.rotation.x = -Math.PI / 2;
        halo.position.y = 0.03;
        npc.add(halo);
        npc.userData.halo = halo;
        // Panneau "WANTED" avec prime
        const wcv = document.createElement('canvas');
        wcv.width = 256; wcv.height = 80;
        const wcx = wcv.getContext('2d');
        wcx.fillStyle = 'rgba(40,0,0,0.95)'; wcx.fillRect(0, 0, 256, 80);
        wcx.strokeStyle = '#ffd700'; wcx.lineWidth = 4;
        wcx.strokeRect(2, 2, 252, 76);
        wcx.fillStyle = '#ff3a3a'; wcx.font = 'bold 22px Georgia'; wcx.textAlign = 'center';
        wcx.fillText('WANTED', 128, 30);
        wcx.fillStyle = '#ffd700'; wcx.font = 'bold 28px Georgia';
        wcx.fillText(`+${fmt(bountyAmount)} $`, 128, 62);
        const wtex = new THREE.CanvasTexture(wcv);
        const wsign = new THREE.Mesh(
          new THREE.PlaneGeometry(1.6, 0.6),
          new THREE.MeshBasicMaterial({ map: wtex, transparent: true, depthTest: false })
        );
        wsign.position.y = 2.4;
        // Toujours face à la caméra : on fera billboard dans la boucle via n.userData.sign
        npc.add(wsign);
        npc.userData.sign = wsign;
      }
      npcs.add(npc);
    });
    scene.add(npcs);

    // ----- Voiture qui passe sur la route -----
    const car = new THREE.Group();
    const carBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.6, 1.1),
      new THREE.MeshStandardMaterial({ color: 0xcc0a1a, metalness: 0.6, roughness: 0.25 })
    );
    carBody.position.y = 0.55;
    carBody.castShadow = true;
    car.add(carBody);
    // Cabine
    const cabine = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.5, 1),
      new THREE.MeshStandardMaterial({ color: 0x0a1f3a, metalness: 0.7, roughness: 0.2 })
    );
    cabine.position.set(-0.1, 1.05, 0);
    car.add(cabine);
    // 4 roues
    for (let wx = -1; wx <= 1; wx += 2) {
      for (let wz = -1; wz <= 1; wz += 2) {
        const wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 0.28, 0.2, 12),
          new THREE.MeshStandardMaterial({ color: 0x0a0a0a })
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx * 0.85, 0.28, wz * 0.5);
        car.add(wheel);
      }
    }
    // Phares avant émissifs
    for (let hx = -1; hx <= 1; hx += 2) {
      const headL = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffaa, emissiveIntensity: 1 })
      );
      headL.position.set(1.25, 0.55, hx * 0.4);
      car.add(headL);
    }
    car.position.set(-45, 0, -4);
    car.userData = { speed: 0.15 };
    scene.add(car);

    // ----- Barrière casino (levée pendant le scan) -----
    const gateGroup = new THREE.Group();
    gateGroup.position.set(0, 0, -4.5);
    // 2 piliers
    for (let s = -1; s <= 1; s += 2) {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 1.6, 0.3),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.2 })
      );
      post.position.set(s * 2.5, 0.8, 0);
      gateGroup.add(post);
    }
    // Barre rouge/blanche qui se lève
    const gateBar = new THREE.Group();
    for (let b = 0; b < 5; b++) {
      const seg = new THREE.Mesh(
        new THREE.BoxGeometry(1, 0.18, 0.18),
        new THREE.MeshStandardMaterial({
          color: b % 2 ? 0xffffff : 0xcc1018,
          emissive: b % 2 ? 0xffffff : 0xcc1018,
          emissiveIntensity: 0.25,
        })
      );
      seg.position.set(-2 + b * 1, 0, 0);
      gateBar.add(seg);
    }
    gateBar.position.set(0, 1.4, 0);
    gateGroup.add(gateBar);
    scene.add(gateGroup);

    // ========== FAKE BACKGROUND BUILDINGS (non-interactables, décor urbain massif) ==========
    // Ville procédurale étendue × 10 : grille 800×800 remplie de buildings pour combler tout le vide
    const bgBuildings = new THREE.Group();
    const bgColors = [0x4a5a6a, 0x6a5a4a, 0x5a4a6a, 0x3a4a5a, 0x6a4a3a, 0x4a6a5a, 0x5a5a5a, 0x7a6a5a, 0x8a7a6a, 0x4a3a5a];
    // On génère ~350 bâtiments répartis sur toute la ville (hors zone centrale jouable)
    // Zone jouable centrale étendue : x ∈ [-360, 360], z ∈ [-360, 360] (×~7.5 par axe)
    // Mais on protège le PARK CENTRAL [-55, 55] × [-45, 20] pour les maisons interactives
    const isInCentralProtected = (x, z) => (x > -58 && x < 58 && z > -46 && z < 22);
    // Zone plage/mer protégée (G2) : pas de bâtiments à partir de x>75
    const isInBeachSeaArea = (x) => x > 75;
    // Semence déterministe pour éviter des variations
    let seed = 1337;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    const tryPlaceBuilding = () => {
      // Tire une position dans la grille urbaine, évite les routes (tous les 80m) et la zone protégée
      const bx = Math.round((rand() * 720 - 360) / 16) * 16 + 8;
      const bz = Math.round((rand() * 720 - 360) / 16) * 16 + 8;
      if (isInCentralProtected(bx, bz)) return null;
      if (isInBeachSeaArea(bx)) return null;
      // Évite les routes (bande de ±7m autour des multiples de 80)
      const onRoadX = Math.abs(((bx + 400) % 80) - 40) < 9;
      const onRoadZ = Math.abs(((bz + 400) % 80) - 40) < 9;
      if (onRoadX || onRoadZ) return null;
      return { x: bx, z: bz };
    };
    let placed = 0;
    let attempts = 0;
    while (placed < 280 && attempts < 2000) {
      attempts++;
      const pos = tryPlaceBuilding();
      if (!pos) continue;
      const w = 5 + rand() * 8;
      const h = 6 + rand() * 38; // immeubles jusqu'à ~44m
      const d = 5 + rand() * 8;
      const col = bgColors[Math.floor(rand() * bgColors.length)];
      const bg = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.85 })
      );
      bg.position.set(pos.x, h / 2, pos.z);
      bg.castShadow = true; bg.receiveShadow = true;
      bgBuildings.add(bg);
      // Fenêtres émissives stylisées (2 faces seulement pour perf)
      const rows = Math.floor(h / 2.2);
      const cols = Math.floor(w / 1.6);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (rand() < 0.4) continue;
          const winColor = rand() < 0.15 ? 0x3fe6ff : 0xffd88a;
          const win = new THREE.Mesh(
            new THREE.PlaneGeometry(0.5, 1.2),
            new THREE.MeshBasicMaterial({ color: winColor, transparent: true, opacity: 0.85 })
          );
          win.position.set(
            pos.x - w / 2 + 0.6 + c * 1.4,
            1.4 + r * 2,
            pos.z + d / 2 + 0.02
          );
          bgBuildings.add(win);
        }
      }
      // Toit plat gris
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.3, 0.3, d + 0.3),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
      );
      roof.position.set(pos.x, h + 0.15, pos.z);
      bgBuildings.add(roof);
      placed++;
    }
    scene.add(bgBuildings);

    // ====== MOBILIER URBAIN POUR COMBLER LES VIDES (lampadaires, barrières, arbres) ======
    const streetFurniture = new THREE.Group();
    // Lampadaires alignés le long des routes principales (tous les 30 m)
    for (let s = -1; s <= 1; s += 2) {
      for (let xPos = -380; xPos <= 380; xPos += 30) {
        // Évite la zone centrale où il y a déjà des éléments
        if (Math.abs(xPos) < 50) continue;
        // G2 : pas de lampadaires sur la plage / dans la mer
        if (xPos > 75) continue;
        const lampGroup = new THREE.Group();
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.18, 5, 8),
          new THREE.MeshStandardMaterial({ color: 0x222226, metalness: 0.7, roughness: 0.4 })
        );
        post.position.y = 2.5;
        lampGroup.add(post);
        const arm = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 0.1, 0.1),
          new THREE.MeshStandardMaterial({ color: 0x222226 })
        );
        arm.position.set(0.4 * s, 5, 0);
        lampGroup.add(arm);
        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.22, 10, 8),
          new THREE.MeshStandardMaterial({ color: 0xfff0a0, emissive: 0xffe588, emissiveIntensity: 1.4 })
        );
        bulb.position.set(0.8 * s, 4.95, 0);
        lampGroup.add(bulb);
        lampGroup.position.set(xPos, 0, s * 9.5);
        streetFurniture.add(lampGroup);
      }
    }
    // Barrières blanches devant les bâtiments lointains (pour combler les espaces visuels)
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.7 });
    for (let xPos = -380; xPos <= 380; xPos += 60) {
      if (Math.abs(xPos) < 60) continue;
      // G2 : pas de barrières sur la plage / dans la mer
      if (xPos > 75) continue;
      // 6 piquets formant une barrière
      for (let i = 0; i < 6; i++) {
        const post = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 1.2, 0.1),
          fenceMat
        );
        post.position.set(xPos + i * 1.5, 0.6, -25);
        streetFurniture.add(post);
      }
      // 2 traverses horizontales
      for (let h = 0; h < 2; h++) {
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(8, 0.08, 0.08),
          fenceMat
        );
        rail.position.set(xPos + 3.75, 0.4 + h * 0.5, -25);
        streetFurniture.add(rail);
      }
    }
    // Arbres dispersés pour densifier
    for (let i = 0; i < 50; i++) {
      const tx = (i % 10 - 5) * 80 + (Math.random() - 0.5) * 20;
      const tz = (Math.floor(i / 10) - 2) * 80 + 25 + (Math.random() - 0.5) * 10;
      // Évite zone centrale
      if (Math.abs(tx) < 50 && Math.abs(tz) < 40) continue;
      // G2 : pas d'arbres sur la plage / dans la mer
      if (tx > 75) continue;
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.28, 2.4, 6),
        new THREE.MeshStandardMaterial({ color: 0x4a2a14 })
      );
      trunk.position.set(tx, 1.2, tz);
      streetFurniture.add(trunk);
      const foliage = new THREE.Mesh(
        new THREE.SphereGeometry(1.4, 8, 6),
        new THREE.MeshStandardMaterial({ color: i % 3 === 0 ? 0x2a8a3a : 0x3a9a4a })
      );
      foliage.position.set(tx, 3.4, tz);
      foliage.scale.y = 0.85;
      streetFurniture.add(foliage);
    }
    // Panneaux pub/stop secondaires aux carrefours (tous les 80 m)
    for (let rx = -320; rx <= 320; rx += 80) {
      for (let rz = -320; rz <= 320; rz += 80) {
        if (Math.abs(rx) < 50 && Math.abs(rz) < 50) continue;
        if (Math.random() < 0.5) continue;
        const sg = new THREE.Group();
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.12, 3, 8),
          new THREE.MeshStandardMaterial({ color: 0x444 })
        );
        post.position.y = 1.5;
        sg.add(post);
        const sign = new THREE.Mesh(
          new THREE.PlaneGeometry(1, 1),
          new THREE.MeshStandardMaterial({
            color: 0xff2222, emissive: 0xaa1111, emissiveIntensity: 0.4, side: THREE.DoubleSide,
          })
        );
        sign.position.y = 3;
        sg.add(sign);
        sg.position.set(rx + 6, 0, rz + 6);
        streetFurniture.add(sg);
      }
    }
    // Bornes anti-stationnement le long de la route principale
    for (let xPos = -390; xPos <= 390; xPos += 4) {
      if (Math.abs(xPos) < 12) continue;
      const bollard = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.16, 0.7, 8),
        new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0x331a00, emissiveIntensity: 0.3 })
      );
      bollard.position.set(xPos, 0.35, -8.5);
      streetFurniture.add(bollard);
    }
    scene.add(streetFurniture);

    // ====== 4 ÉCRANS PUBLICITAIRES GAMBLELIFE dans la ville ======
    // Positions : 4 coins autour de la zone centrale, visibles de loin
    const billboardPositions = [
      { x: -140,  z: -60,  rotY: Math.PI / 4 },     // NO
      { x:  140,  z: -60,  rotY: -Math.PI / 4 },    // NE
      { x: -140,  z:  80,  rotY: -Math.PI / 4 },    // SO
      { x:  140,  z:  80,  rotY: Math.PI / 4 },     // SE
    ];
    const bbMessages = [
      { title: 'GAMBLELIFE CASINO', sub: '★ Jackpot 500M $ ★', cta: 'ENTRE MAINTENANT →' },
      { title: 'CHASSE À LA PRIME', sub: '+500K $ par WANTED', cta: 'ÉQUIPE TON ARME' },
      { title: 'ROUE DE LA FORTUNE', sub: 'Gagne une VILLA gratuite', cta: 'VIENS TOURNER' },
      { title: 'GAMBLEBET — SPORT', sub: 'Cotes × 10 sur PSG', cta: 'PARIE LIVE 24/7' },
    ];
    billboardPositions.forEach((pos, bi) => {
      const msg = bbMessages[bi];
      const bb = new THREE.Group();
      bb.position.set(pos.x, 0, pos.z);
      bb.rotation.y = pos.rotY;
      // Pylônes métalliques
      for (let s = -1; s <= 1; s += 2) {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 0.34, 16, 10),
          new THREE.MeshStandardMaterial({ color: 0x3a3a40, metalness: 0.7, roughness: 0.4 })
        );
        pole.position.set(s * 5, 8, 0);
        pole.castShadow = true;
        bb.add(pole);
      }
      // Cadre d'écran
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(14, 8, 0.6),
        new THREE.MeshStandardMaterial({
          color: 0x0a0a12, metalness: 0.5, roughness: 0.35,
          emissive: 0xd4af37, emissiveIntensity: 0.08,
        })
      );
      frame.position.y = 14;
      frame.castShadow = true;
      bb.add(frame);
      // Écran émissif (canvas → texture)
      const bcv = document.createElement('canvas');
      bcv.width = 1024; bcv.height = 512;
      const bcx = bcv.getContext('2d');
      // fond dégradé doré/noir animé (statique mais beau)
      const grad = bcx.createLinearGradient(0, 0, 1024, 512);
      grad.addColorStop(0, '#8b0000');
      grad.addColorStop(0.5, '#1a0a00');
      grad.addColorStop(1, '#d4af37');
      bcx.fillStyle = grad; bcx.fillRect(0, 0, 1024, 512);
      // Logo/étoiles
      bcx.fillStyle = 'rgba(255,215,0,0.45)';
      for (let i = 0; i < 12; i++) {
        bcx.beginPath();
        bcx.arc(50 + i * 80, 50 + (i % 2) * 400, 4 + (i % 3), 0, Math.PI * 2);
        bcx.fill();
      }
      bcx.shadowColor = '#ffd700'; bcx.shadowBlur = 40;
      bcx.fillStyle = '#ffd700';
      bcx.font = 'bold 90px Georgia';
      bcx.textAlign = 'center';
      bcx.fillText(msg.title, 512, 180);
      bcx.shadowBlur = 0;
      bcx.fillStyle = '#fff';
      bcx.font = 'bold 60px Georgia';
      bcx.fillText(msg.sub, 512, 290);
      bcx.fillStyle = '#3fe6ff';
      bcx.font = 'bold 52px Georgia';
      bcx.fillText(msg.cta, 512, 420);
      const bbTex = new THREE.CanvasTexture(bcv);
      const bbScreen = new THREE.Mesh(
        new THREE.PlaneGeometry(13, 7),
        new THREE.MeshBasicMaterial({ map: bbTex })
      );
      bbScreen.position.set(0, 14, 0.35);
      bb.add(bbScreen);
      // Lumière spot devant
      const bbLight = new THREE.PointLight(0xffd700, 1.2, 35);
      bbLight.position.set(0, 14, 5);
      bb.add(bbLight);
      scene.add(bb);
    });

    // ========== G2 — CIEL : SOLEIL + NUAGES ==========
    // Soleil — grand disque émissif au loin (côté Est, au-dessus de la mer)
    const sunGroup = new THREE.Group();
    const sunDisk = new THREE.Mesh(
      new THREE.CircleGeometry(28, 32),
      new THREE.MeshBasicMaterial({
        color: 0xfff2c4, transparent: true, opacity: 0.95,
      })
    );
    sunDisk.position.set(380, 90, -20);
    sunDisk.lookAt(0, 50, 0);
    sunGroup.add(sunDisk);
    // Halo doux autour du soleil
    const sunHalo = new THREE.Mesh(
      new THREE.CircleGeometry(50, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffd060, transparent: true, opacity: 0.35,
      })
    );
    sunHalo.position.copy(sunDisk.position);
    sunHalo.lookAt(0, 50, 0);
    sunGroup.add(sunHalo);
    const sunHalo2 = new THREE.Mesh(
      new THREE.CircleGeometry(80, 32),
      new THREE.MeshBasicMaterial({
        color: 0xff8a3a, transparent: true, opacity: 0.18,
      })
    );
    sunHalo2.position.copy(sunDisk.position);
    sunHalo2.lookAt(0, 50, 0);
    sunGroup.add(sunHalo2);
    scene.add(sunGroup);
    // Lumière directionnelle additionnelle qui suit le soleil pour une ambiance "couchant"
    const sunLightG2 = new THREE.DirectionalLight(0xffd6a8, 0.5);
    sunLightG2.position.set(200, 100, 0);
    scene.add(sunLightG2);

    // Nuages : ~14 nuages volumétriques (sphères blanches groupées)
    const cloudsGroup = new THREE.Group();
    for (let c = 0; c < 14; c++) {
      const cloud = new THREE.Group();
      const cx = (Math.random() - 0.5) * 700;
      const cz = (Math.random() - 0.5) * 700;
      const cy = 55 + Math.random() * 25;
      // 4-6 sphères qui se chevauchent
      const puffs = 4 + Math.floor(Math.random() * 3);
      for (let p = 0; p < puffs; p++) {
        const r = 4 + Math.random() * 4;
        const puff = new THREE.Mesh(
          new THREE.SphereGeometry(r, 12, 8),
          new THREE.MeshStandardMaterial({
            color: 0xffffff, transparent: true, opacity: 0.85,
            roughness: 0.95,
          })
        );
        puff.position.set(p * 5 + (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 3);
        cloud.add(puff);
      }
      cloud.position.set(cx, cy, cz);
      cloud.userData.driftSpeed = 0.02 + Math.random() * 0.04;
      cloudsGroup.add(cloud);
    }
    scene.add(cloudsGroup);

    // ========== G2 — ALLÉE DE PALMIERS 10m AUTOUR DE LA PLAGE ==========
    // Allée parallèle à la plage côté terrestre (x=78) et côté plage interne (x=110), de z=-180 à z=180
    const palmAlley = new THREE.Group();
    const buildPalm = (px, py, pz) => {
      const palm = new THREE.Group();
      // Tronc 10m
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.45, 10, 10),
        new THREE.MeshStandardMaterial({ color: 0x6a4322, roughness: 1 })
      );
      trunk.position.y = 5;
      palm.add(trunk);
      // Base renflée
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.7, 0.6, 10),
        new THREE.MeshStandardMaterial({ color: 0x4a2e15 })
      );
      base.position.y = 0.3;
      palm.add(base);
      // Couronne de feuilles : 8 feuilles arquées
      for (let f = 0; f < 8; f++) {
        const leaf = new THREE.Mesh(
          new THREE.PlaneGeometry(0.5, 4.2, 1, 4),
          new THREE.MeshStandardMaterial({
            color: f % 2 === 0 ? 0x2c8b3a : 0x3aaa48,
            roughness: 0.85, side: THREE.DoubleSide,
          })
        );
        const ang = (f / 8) * Math.PI * 2;
        leaf.position.set(Math.cos(ang) * 1.3, 10.2, Math.sin(ang) * 1.3);
        leaf.rotation.set(-0.4, ang, 0.2);
        palm.add(leaf);
      }
      // Cocotiers : 3-5 noix de coco brunes
      const nCoco = 3 + Math.floor(Math.random() * 3);
      for (let n = 0; n < nCoco; n++) {
        const coco = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 8, 6),
          new THREE.MeshStandardMaterial({ color: 0x4a2010 })
        );
        coco.position.set(
          (Math.random() - 0.5) * 0.7,
          9.6 + Math.random() * 0.4,
          (Math.random() - 0.5) * 0.7
        );
        palm.add(coco);
      }
      palm.position.set(px, py, pz);
      palmAlley.add(palm);
    };
    // Côté terrestre (x=78), tous les 12m
    for (let pz = -180; pz <= 180; pz += 12) buildPalm(78, 0, pz);
    // Côté mer (x=112), tous les 12m, décalés
    for (let pz = -174; pz <= 180; pz += 12) buildPalm(112, 0, pz);
    scene.add(palmAlley);

    // ========== G2 — DEATH BARRIÈRE PÉRIMÈTRE VILLE ==========
    // Une barrière visuelle (poteaux + bandes) entoure la ville jouable.
    // Zone vivante : x ∈ [-400, 75], z ∈ [-400, 400], + plage [75..120, -200..200]
    // Barrière sur 4 côtés : nord/sud/ouest, plus 2 segments pour cadrer la plage côté Est.
    const perimeterFence = new THREE.Group();
    const fenceMatRed = new THREE.MeshStandardMaterial({
      color: 0xff2020, emissive: 0xff2020, emissiveIntensity: 0.35,
    });
    const fenceMatYellow = new THREE.MeshStandardMaterial({
      color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.25,
    });
    const buildFenceSegment = (x1, z1, x2, z2) => {
      const dx = x2 - x1, dz = z2 - z1;
      const len = Math.hypot(dx, dz);
      const steps = Math.ceil(len / 8);
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = x1 + dx * t;
        const pz = z1 + dz * t;
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.15, 0.18, 4, 6),
          i % 2 === 0 ? fenceMatRed : fenceMatYellow
        );
        post.position.set(px, 2, pz);
        perimeterFence.add(post);
      }
      // Bandes alternées (rouge/jaune)
      const ang = Math.atan2(dz, dx);
      for (let h = 0; h < 3; h++) {
        const band = new THREE.Mesh(
          new THREE.BoxGeometry(len, 0.15, 0.05),
          h % 2 === 0 ? fenceMatRed : fenceMatYellow
        );
        band.position.set((x1 + x2) / 2, 0.5 + h * 1.4, (z1 + z2) / 2);
        band.rotation.y = -ang;
        perimeterFence.add(band);
      }
    };
    // Côté Ouest (x=-410)
    buildFenceSegment(-410, -410, -410, 410);
    // Côté Nord (z=-410)
    buildFenceSegment(-410, -410, 75, -410);
    // Côté Sud (z=410)
    buildFenceSegment(-410, 410, 75, 410);
    // Côté Est partie inférieure (en dessous de la plage)
    buildFenceSegment(75, -410, 75, -210);
    // Côté Est partie supérieure (au-dessus de la plage)
    buildFenceSegment(75, 210, 75, 410);
    // Liaison plage → mer (côtés Z de la plage à 500m de chaque côté = z=±200)
    buildFenceSegment(75, -210, 124, -210);
    buildFenceSegment(75, 210, 124, 210);
    scene.add(perimeterFence);


    // ─── 1) PLAGE + MER (côté EST de la map, x > 80) ───────────────────────────
    // Sable : grand rectangle (x: 80..120, z: -200..200)
    const beach = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 400, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0xf5e0a8, roughness: 0.95 })
    );
    beach.rotation.x = -Math.PI / 2;
    beach.position.set(100, 0.02, 0);
    beach.receiveShadow = true;
    scene.add(beach);

    // Pour des grains de sable / variation de couleur, ajout de patches plus foncés
    for (let i = 0; i < 24; i++) {
      const patch = new THREE.Mesh(
        new THREE.CircleGeometry(2 + Math.random() * 3, 12),
        new THREE.MeshStandardMaterial({ color: 0xe6cd8c, roughness: 1, transparent: true, opacity: 0.6 })
      );
      patch.rotation.x = -Math.PI / 2;
      patch.position.set(85 + Math.random() * 30, 0.03, -180 + Math.random() * 360);
      scene.add(patch);
    }

    // Mer : grand plan animé (x > 120 → 500, z: -300..300)
    const seaGeo = new THREE.PlaneGeometry(380, 600, 60, 80);
    const seaMat = new THREE.MeshStandardMaterial({
      color: 0x1c6ea4, roughness: 0.25, metalness: 0.2,
      transparent: true, opacity: 0.92, side: THREE.DoubleSide,
    });
    const sea = new THREE.Mesh(seaGeo, seaMat);
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(310, 0, 0);
    scene.add(sea);

    // Sauvegarde des Y initiaux des vertices pour animer les vagues sans drift
    const seaPos = sea.geometry.attributes.position;
    const seaBaseZ = new Float32Array(seaPos.count);
    for (let v = 0; v < seaPos.count; v++) seaBaseZ[v] = seaPos.getZ(v);

    // Bande d'écume (frontière sable/mer) — animée en opacité dans le loop
    const foam = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 400, 1, 1),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })
    );
    foam.rotation.x = -Math.PI / 2;
    foam.position.set(120.5, 0.05, 0);
    scene.add(foam);

    // ─── 2) DÉCOS PLAGE : parasols, serviettes, pont de bois ──────────────────
    const beachDeco = new THREE.Group();
    // Pont de bois qui s'avance dans la mer (3-4 m max, depuis la plage à z=-30)
    const pier = new THREE.Group();
    pier.position.set(108, 0, -30);
    const pierDeck = new THREE.Mesh(
      new THREE.BoxGeometry(14, 0.25, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.85 })
    );
    pierDeck.position.set(7, 1.0, 0);
    pier.add(pierDeck);
    // Pilotis
    for (let pi = 0; pi <= 6; pi++) {
      const pile = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.14, 1.2, 8),
        new THREE.MeshStandardMaterial({ color: 0x4a2e15 })
      );
      pile.position.set(pi * 2.2, 0.4, -1);
      pier.add(pile);
      const pile2 = pile.clone(); pile2.position.z = 1; pier.add(pile2);
    }
    // Garde-corps
    for (const s of [-1, 1]) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(14, 0.06, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x5a3a1a })
      );
      rail.position.set(7, 1.7, s * 1.1);
      pier.add(rail);
      for (let pp = 0; pp <= 7; pp++) {
        const post = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.7, 0.08),
          new THREE.MeshStandardMaterial({ color: 0x5a3a1a })
        );
        post.position.set(pp * 2, 1.35, s * 1.1);
        pier.add(post);
      }
    }
    beachDeco.add(pier);

    // 6 parasols + serviettes répartis sur la plage
    const towelColors = [0xdc2626, 0xfacc15, 0x10b981, 0xec4899, 0x3fe6ff, 0xf97316];
    for (let i = 0; i < 6; i++) {
      const tx = 86 + (i % 3) * 10 + Math.random() * 4;
      const tz = -120 + (i * 50) + (Math.random() - 0.5) * 20;
      // Serviette
      const towel = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.05, 1.2),
        new THREE.MeshStandardMaterial({ color: towelColors[i], roughness: 0.85 })
      );
      towel.position.set(tx, 0.04, tz);
      beachDeco.add(towel);
      // Parasol mât
      const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 2.6, 8),
        new THREE.MeshStandardMaterial({ color: 0x3a2010 })
      );
      mast.position.set(tx + 0.3, 1.3, tz - 0.4);
      beachDeco.add(mast);
      // Parasol toile
      const para = new THREE.Mesh(
        new THREE.ConeGeometry(1.4, 0.5, 12, 1, true),
        new THREE.MeshStandardMaterial({ color: towelColors[(i + 2) % 6], side: THREE.DoubleSide, roughness: 0.85 })
      );
      para.position.set(tx + 0.3, 2.5, tz - 0.4);
      beachDeco.add(para);
    }
    // Quelques palmiers sur le bord plage
    for (let i = 0; i < 5; i++) {
      const px = 82 + Math.random() * 4;
      const pz = -180 + i * 80 + Math.random() * 20;
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.25, 4, 8),
        new THREE.MeshStandardMaterial({ color: 0x6a4322, roughness: 1 })
      );
      trunk.position.set(px, 2, pz);
      beachDeco.add(trunk);
      const leaves = new THREE.Mesh(
        new THREE.SphereGeometry(1.4, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0x2c8b3a, roughness: 0.8 })
      );
      leaves.position.set(px, 4.2, pz);
      leaves.scale.set(1, 0.5, 1);
      beachDeco.add(leaves);
    }
    scene.add(beachDeco);

    // ─── 3) GARAGE (devant le casino, orienté vers le casino) ───────────────
    const garage = new THREE.Group();
    garage.position.set(-22, 0, 30);
    garage.rotation.y = Math.PI; // G4 — face au casino (-Z)
    // Bâtiment principal — large façade
    const garBld = new THREE.Mesh(
      new THREE.BoxGeometry(16, 6, 9),
      new THREE.MeshStandardMaterial({ color: 0x4a4a52, roughness: 0.7 })
    );
    garBld.position.y = 3;
    garBld.castShadow = true;
    garBld.receiveShadow = true;
    garage.add(garBld);
    // Toit légèrement plus grand
    const garRoof = new THREE.Mesh(
      new THREE.BoxGeometry(16.6, 0.4, 9.6),
      new THREE.MeshStandardMaterial({ color: 0x222228 })
    );
    garRoof.position.y = 6.2;
    garage.add(garRoof);
    // 3 portes de garage (rouleau métal) bien visibles
    for (let g = -1; g <= 1; g++) {
      const door = new THREE.Mesh(
        new THREE.PlaneGeometry(4, 4),
        new THREE.MeshStandardMaterial({ color: 0xc8c8d2, metalness: 0.6, roughness: 0.45 })
      );
      door.position.set(g * 5, 2, 4.51);
      garage.add(door);
      // Lignes horizontales (effet rideau roulé)
      for (let ln = 0; ln < 8; ln++) {
        const line = new THREE.Mesh(
          new THREE.PlaneGeometry(4, 0.05),
          new THREE.MeshBasicMaterial({ color: 0x6a6a7a })
        );
        line.position.set(g * 5, 0.3 + ln * 0.5, 4.52);
        garage.add(line);
      }
      // Cadre noir autour de la porte
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(4.3, 4.3, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x1a1a20 })
      );
      frame.position.set(g * 5, 2, 4.49);
      garage.add(frame);
    }
    // Enseigne lumineuse "GARAGE"
    const garSignCv = document.createElement('canvas');
    garSignCv.width = 512; garSignCv.height = 128;
    const garSignCx = garSignCv.getContext('2d');
    garSignCx.fillStyle = '#000'; garSignCx.fillRect(0, 0, 512, 128);
    garSignCx.fillStyle = '#3fe6ff'; garSignCx.font = 'bold 76px Georgia';
    garSignCx.textAlign = 'center';
    garSignCx.shadowColor = '#3fe6ff'; garSignCx.shadowBlur = 22;
    garSignCx.fillText('🚗 GARAGE', 256, 92);
    const garSign = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 2),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(garSignCv), transparent: true })
    );
    garSign.position.set(0, 5.2, 4.55);
    garage.add(garSign);
    // 2 voitures en exposition devant
    const showcaseColors = [0xdc2626, 0xffd700];
    for (let cI = 0; cI < 2; cI++) {
      const carEx = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.7, 4.4),
        new THREE.MeshStandardMaterial({ color: showcaseColors[cI], metalness: 0.7, roughness: 0.25 })
      );
      body.position.y = 0.7;
      carEx.add(body);
      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 0.6, 2.0),
        new THREE.MeshStandardMaterial({ color: 0x101010, metalness: 0.4, roughness: 0.4 })
      );
      cabin.position.y = 1.35;
      carEx.add(cabin);
      for (const wx of [-1, 1]) for (const wz of [-1.4, 1.4]) {
        const wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.35, 0.3, 12),
          new THREE.MeshStandardMaterial({ color: 0x111 })
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx * 1.1, 0.35, wz);
        carEx.add(wheel);
      }
      carEx.position.set(-3 + cI * 6, 0, 7.5);
      carEx.rotation.y = Math.PI;
      garage.add(carEx);
    }
    scene.add(garage);
    interactables.push({ type: 'garage', id: 'garage', pos: new THREE.Vector3(-22, 0, 30), radius: 7 });

    // ─── 4) GAMBLELIFE STORE — façade premium style casino (G4) ────────────────
    // Plus grand, vitres XL, néons, alignement vers casino
    const shopFr = new THREE.Group();
    shopFr.position.set(28, 0, 30);
    shopFr.rotation.y = Math.PI; // face au casino
    // Bâtiment principal — 18×8×11 m (plus grand qu'avant)
    const shopBld = new THREE.Mesh(
      new THREE.BoxGeometry(18, 8, 11),
      new THREE.MeshStandardMaterial({ color: 0x18101e, roughness: 0.6, metalness: 0.2 })
    );
    shopBld.position.y = 4;
    shopBld.castShadow = true;
    shopBld.receiveShadow = true;
    shopFr.add(shopBld);
    // Toit avec corniche dorée
    const shopRoof = new THREE.Mesh(
      new THREE.BoxGeometry(18.6, 0.6, 11.6),
      new THREE.MeshStandardMaterial({ color: 0x0a0610 })
    );
    shopRoof.position.y = 8.3;
    shopFr.add(shopRoof);
    const shopRoofGold = new THREE.Mesh(
      new THREE.BoxGeometry(18.4, 0.2, 11.4),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 })
    );
    shopRoofGold.position.y = 7.9;
    shopFr.add(shopRoofGold);
    // 4 grandes vitrines avant (verre teinté + cadres dorés)
    for (let s = -1.5; s <= 1.5; s += 1) {
      const window1 = new THREE.Mesh(
        new THREE.PlaneGeometry(3.5, 4.5),
        new THREE.MeshStandardMaterial({
          color: 0x9be0ff, transparent: true, opacity: 0.55,
          metalness: 0.5, roughness: 0.1, emissive: 0xffd700, emissiveIntensity: 0.06,
        })
      );
      window1.position.set(s * 4.2, 3.5, 5.51);
      shopFr.add(window1);
      // Cadre doré épais
      const frame2 = new THREE.Mesh(
        new THREE.BoxGeometry(3.7, 4.7, 0.15),
        new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 })
      );
      frame2.position.set(s * 4.2, 3.5, 5.50);
      shopFr.add(frame2);
      // Mannequin stylisé dans la vitrine
      const mannBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.4, 1.8, 10),
        new THREE.MeshStandardMaterial({
          color: ['#ff2ad4', '#3fe6ff', '#ffd700', '#ff8a3a'][Math.floor((s + 1.5))],
        })
      );
      mannBody.position.set(s * 4.2, 1.3, 5.0);
      shopFr.add(mannBody);
      const mannHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 14, 12),
        new THREE.MeshStandardMaterial({ color: 0xe8d5b7 })
      );
      mannHead.position.set(s * 4.2, 2.5, 5.0);
      shopFr.add(mannHead);
    }
    // Porte centrale double vitrée + tapis rouge
    const shopDoor = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 4.2),
      new THREE.MeshStandardMaterial({ color: 0x1a1a25, metalness: 0.7, roughness: 0.3 })
    );
    shopDoor.position.set(0, 2.1, 5.52);
    shopFr.add(shopDoor);
    const doorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 4.4, 0.15),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 })
    );
    doorFrame.position.set(0, 2.1, 5.51);
    shopFr.add(doorFrame);
    // Tapis rouge devant la porte
    const carpet = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 4),
      new THREE.MeshStandardMaterial({ color: 0xc41e3a, roughness: 0.8 })
    );
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.set(0, 0.04, 7.5);
    shopFr.add(carpet);
    // 2 piliers d'entrée dorés avec lumière
    for (const ps of [-1, 1]) {
      const pil = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.3, 4, 12),
        new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.15 })
      );
      pil.position.set(ps * 2, 2, 5.6);
      shopFr.add(pil);
      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 14, 12),
        new THREE.MeshBasicMaterial({ color: 0xfff4c8 })
      );
      ball.position.set(ps * 2, 4.2, 5.6);
      shopFr.add(ball);
      const bLight = new THREE.PointLight(0xfff4c8, 0.7, 6);
      bLight.position.copy(ball.position);
      shopFr.add(bLight);
    }
    // Enseigne lumineuse principale "★ GAMBLELIFE STORE ★"
    const shopSignCv = document.createElement('canvas');
    shopSignCv.width = 768; shopSignCv.height = 160;
    const sCx = shopSignCv.getContext('2d');
    sCx.fillStyle = '#000'; sCx.fillRect(0, 0, 768, 160);
    sCx.fillStyle = '#ffd700'; sCx.font = 'bold 78px Georgia';
    sCx.textAlign = 'center';
    sCx.shadowColor = '#ffd700'; sCx.shadowBlur = 30;
    sCx.fillText('★ GAMBLELIFE STORE ★', 384, 90);
    sCx.font = 'bold 26px Georgia';
    sCx.fillStyle = '#3fe6ff';
    sCx.shadowColor = '#3fe6ff';
    sCx.fillText('Armes · Véhicules · Cosmétiques', 384, 130);
    const shopSign = new THREE.Mesh(
      new THREE.PlaneGeometry(13, 2.7),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shopSignCv), transparent: true })
    );
    shopSign.position.set(0, 7.0, 5.55);
    shopFr.add(shopSign);
    // Lumière forte au-dessus de l'enseigne
    const shopLight = new THREE.PointLight(0xffd700, 1.4, 22);
    shopLight.position.set(0, 7.2, 8);
    shopFr.add(shopLight);
    // Néons cyan latéraux
    for (const ns of [-1, 1]) {
      const neon = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 7.5, 0.15),
        new THREE.MeshBasicMaterial({ color: 0x3fe6ff })
      );
      neon.position.set(ns * 9.0, 4, 5.55);
      shopFr.add(neon);
      const neonL = new THREE.PointLight(0x3fe6ff, 0.4, 6);
      neonL.position.copy(neon.position);
      shopFr.add(neonL);
    }
    scene.add(shopFr);
    interactables.push({ type: 'shopfront', id: 'shopfront', pos: new THREE.Vector3(28, 0, 30), radius: 8 });

    // ─── 5) DÉCORATIONS VILLE : plantes, bancs, fontaine, place piétonne ──────
    // Place piétonne pavée entre garage et boutique (x=0, z=30)
    const plaza = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 12),
      new THREE.MeshStandardMaterial({ color: 0xc9bfa8, roughness: 0.9 })
    );
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(0, 0.025, 30);
    scene.add(plaza);
    // Lignes de pavés
    for (let r = -2; r <= 2; r++) {
      for (let c = -4; c <= 4; c++) {
        const tile = new THREE.Mesh(
          new THREE.PlaneGeometry(1.9, 1.9),
          new THREE.MeshStandardMaterial({
            color: ((r + c) % 2 === 0 ? 0xaa9d80 : 0xb8ad95), roughness: 0.95,
          })
        );
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(c * 2, 0.03, 28 + r * 2);
        scene.add(tile);
      }
    }
    // Fontaine au centre de la place
    const fountain = new THREE.Group();
    fountain.position.set(0, 0, 30);
    const fountainBase = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.5, 0.8, 24),
      new THREE.MeshStandardMaterial({ color: 0xe8e2d2, roughness: 0.8 })
    );
    fountainBase.position.y = 0.4;
    fountain.add(fountainBase);
    const fountainWater = new THREE.Mesh(
      new THREE.CylinderGeometry(1.9, 1.9, 0.2, 24),
      new THREE.MeshStandardMaterial({ color: 0x3fa8e6, roughness: 0.2, metalness: 0.4, transparent: true, opacity: 0.85 })
    );
    fountainWater.position.y = 0.8;
    fountain.add(fountainWater);
    const fountainSpout = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.2, 1.4, 12),
      new THREE.MeshStandardMaterial({ color: 0xc8b87a, metalness: 0.7, roughness: 0.3 })
    );
    fountainSpout.position.y = 1.4;
    fountain.add(fountainSpout);
    // Jet d'eau (animé via opacité dans le loop pour un effet vivant)
    const fountainJet = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 1.6, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xa5dfff, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    );
    fountainJet.position.y = 2.4;
    fountain.add(fountainJet);
    scene.add(fountain);
    // 4 pots de plantes décoratifs autour de la fontaine
    for (let pp = 0; pp < 4; pp++) {
      const angle = (pp / 4) * Math.PI * 2 + Math.PI / 4;
      const px = Math.cos(angle) * 5;
      const pz = 30 + Math.sin(angle) * 4;
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.4, 0.7, 16),
        new THREE.MeshStandardMaterial({ color: 0x5a3220, roughness: 0.85 })
      );
      pot.position.set(px, 0.35, pz);
      scene.add(pot);
      const plant = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 12, 10),
        new THREE.MeshStandardMaterial({ color: 0x2a8a3a })
      );
      plant.position.set(px, 1.1, pz);
      plant.scale.y = 1.2;
      scene.add(plant);
    }
    // 4 bancs publics + lampadaires
    const benchPos = [
      [-7, 30, 0], [7, 30, 0], [-7, 30, Math.PI], [7, 30, Math.PI],
    ];
    benchPos.forEach(([bx, bz, by]) => {
      const bench = new THREE.Group();
      const seat = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.1, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x6a4322 })
      );
      seat.position.y = 0.5;
      bench.add(seat);
      const back = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.6, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x6a4322 })
      );
      back.position.set(0, 0.85, -0.25);
      bench.add(back);
      for (const lx of [-1.0, 1.0]) {
        const leg = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.5, 0.5),
          new THREE.MeshStandardMaterial({ color: 0x222 })
        );
        leg.position.set(lx, 0.25, 0);
        bench.add(leg);
      }
      bench.position.set(bx, 0, bz);
      bench.rotation.y = by;
      scene.add(bench);
    });
    // 6 lampadaires elegants autour de la place
    for (let lp = 0; lp < 6; lp++) {
      const lx = (lp < 3 ? -10 : 10);
      const lz = 24 + (lp % 3) * 6;
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.12, 4, 8),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1f, metalness: 0.6, roughness: 0.4 })
      );
      post.position.set(lx, 2, lz);
      scene.add(post);
      const lamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 12, 10),
        new THREE.MeshBasicMaterial({ color: 0xfff4c8 })
      );
      lamp.position.set(lx, 4.1, lz);
      scene.add(lamp);
      const lampLight = new THREE.PointLight(0xfff0c0, 0.6, 8);
      lampLight.position.set(lx, 4.1, lz);
      scene.add(lampLight);
    }
    // 12 plantes décoratives le long du trottoir devant le casino
    for (let pp = 0; pp < 12; pp++) {
      const px = -36 + pp * 6.5;
      const pz = 18;
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.35, 0.6, 12),
        new THREE.MeshStandardMaterial({ color: 0x8a4a2a })
      );
      pot.position.set(px, 0.3, pz);
      scene.add(pot);
      const bush = new THREE.Mesh(
        new THREE.SphereGeometry(0.55, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0x2a8a3a })
      );
      bush.position.set(px, 0.95, pz);
      scene.add(bush);
    }

    // ─── 6) Refs sauvegardés pour animation dans le loop ──────────────────────
    const decoRefs = { sea, seaPos, seaBaseZ, foam, fountainJet, clouds: cloudsGroup };

    // ─── 7) DEATH ZONES ÉTENDUES (mer + lateraux plage) ───────────────────────
    // Joueur ne peut entrer que ~3-4 m dans la mer (jusqu'à x ≈ 124).
    // Plage limitée à |z| < 200 ; au-delà = death barrière.
    // ========== BARRIÈRE DE MORT (agrandie × 10) + plage/mer ==========
    // Limites jouables très larges : x ∈ [-400, 400], z ∈ [-400, 400]
    // Death zone classique : hors [-440, 440] sur les 2 axes (~40m de grâce)
    // + Death zone plage/mer : entrer dans la mer (x > 124) ou sortir 500m de chaque côté
    const isInBeachOrSeaDeath = (x, z) => {
      if (x > 124) return true;                          // 3-4 m dans la mer
      if (x > 80 && (z < -200 || z > 200)) return true;  // plage limitée z
      return false;
    };
    const isInDeathZone = (x, z) => {
      if (x < -440 || x > 440 || z < -440 || z > 440) return true;
      if (isInBeachOrSeaDeath(x, z)) return true;
      return false;
    };
    const isNearBarrier = (x, z) => (x < -400 || x > 400 || z < -400 || z > 400);

    // ========== VEHICLE RIG (skateboard/bike/hoverboard) ==========
    let vehicleRig = null;
    const vehicleOffsetY = 0; // ajusté selon le type
    const attachVehicle = (vid) => {
      if (vehicleRig) {
        scene.remove(vehicleRig);
        vehicleRig.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
        });
        vehicleRig = null;
      }
      if (!vid) return;
      vehicleRig = buildVehicleRig(vid);
      scene.add(vehicleRig);
    };

    // ========== BULLETS & PROJECTILES (combat dans la rue) ==========
    const bullets = []; // {mesh, dir(Vec3), speed, ttl, damage}
    const bloodBursts = []; // {mesh, ttl, scaleRate}
    const spawnBullet = (origin, dir, weapon) => {
      const color = weapon === 'bazooka' ? 0xff6600
                  : weapon === 'knife'   ? 0xffffff
                  : 0xffff66;
      const size = weapon === 'bazooka' ? 0.25 : 0.1;
      const bullet = new THREE.Mesh(
        new THREE.SphereGeometry(size, 8, 6),
        new THREE.MeshBasicMaterial({ color })
      );
      bullet.position.copy(origin);
      scene.add(bullet);
      // Ajouter une traîne émissive pour le bazooka
      if (weapon === 'bazooka') {
        const glow = new THREE.PointLight(0xff6600, 1.5, 4);
        bullet.add(glow);
      }
      bullets.push({
        mesh: bullet,
        dir: dir.clone().normalize(),
        speed: weapon === 'bazooka' ? 0.7 : weapon === 'knife' ? 0.5 : 1.1,
        ttl: 80,
        damage: weapon === 'bazooka' ? 200 : weapon === 'shotgun' ? 60 : weapon === 'knife' ? 40 : 45,
        weapon,
      });
    };
    stateRef.current.spawnBulletFromCamera = (weaponId) => {
      const origin = new THREE.Vector3(camera.position.x, 1.7, camera.position.z);
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      origin.addScaledVector(dir, 0.5);
      spawnBullet(origin, dir, weaponId);
      try { sfx.play(weaponId === 'knife' ? 'card' : 'chip'); } catch (_e) { /* noop */ }
    };

    // ----- État FPS du joueur -----
    // Spawn par défaut : milieu de la rue. Si on vient du casino → position devant la porte.
    // Si on sort d'une maison → on spawn juste devant l'entrée de cette maison.
    let initialSpawn = { x: 0, z: 12, rotY: 0 };
    if (spawnHint === 'casino_exit') {
      initialSpawn = { x: 0, z: 12, rotY: Math.PI };
    } else if (typeof spawnHint === 'string' && spawnHint.startsWith('home_exit:')) {
      const houseId = spawnHint.split(':')[1];
      const house = HOUSES.find(h => h.id === houseId);
      if (house && typeof house.x === 'number') {
        // Spawn 3m devant l'entrée de la maison, face à la rue
        initialSpawn = {
          x: house.x,
          z: house.z + 3.5,
          rotY: Math.PI,
        };
      }
    }
    stateRef.current = {
      ...(stateRef.current || {}),
      scene, camera, renderer, clouds, birds, npcs, car, gateBar, disposed: false,
      // Position/rotation du joueur (FPS)
      player: { ...initialSpawn, speedMul: 1, alive: true, health: 100 },
      // État des entrées (clavier + joystick mobile)
      input: { fwd: 0, back: 0, left: 0, right: 0, rotL: 0, rotR: 0, shoot: 0 },
      interactables,
      collidesAt,
      isNearBarrier, isInDeathZone,
      bullets, bloodBursts, bgBuildings, vehicleRig,
      attachVehicle,
      // Callbacks live injectés plus bas
      onCasinoClick: null, onHouseClick: null, onNpcKilled: null, onPlayerDeath: null,
      // Prompt de proximité
      nearby: null,
    };

    // Si le joueur a déjà un véhicule équipé au montage, on l'attache
    if (profile?.equippedVehicle) attachVehicle(profile.equippedVehicle);
    // Consomme l'éventuel spawn hint
    if (spawnHint && onSpawnConsumed) onSpawnConsumed();

    // ----- Clavier -----
    const keyHandler = (down) => (e) => {
      const set = (dir, val) => { stateRef.current.input[dir] = val ? 1 : 0; };
      const k = e.key.toLowerCase();
      if (k === 'z' || k === 'w' || k === 'arrowup')    set('fwd', down);
      else if (k === 's' || k === 'arrowdown')          set('back', down);
      else if (k === 'q' || k === 'arrowleft')          set('left', down);
      else if (k === 'd' || k === 'arrowright')         set('right', down);
      else if (k === 'a')                               set('rotL', down);
      else if (k === 'e' && down) {
        // Tenter d'interagir avec le plus proche
        const nb = stateRef.current.nearby;
        if (nb?.type === 'casino') stateRef.current.onCasinoClick?.();
        else if (nb?.type === 'house') stateRef.current.onHouseClick?.(nb.id);
        else if (nb?.type === 'building') stateRef.current.onBuildingClick?.(nb.id);
        else if (nb?.type === 'garage') stateRef.current.onGarageClick?.();
        else if (nb?.type === 'shopfront') stateRef.current.onShopfrontClick?.();
      }
    };
    const kd = keyHandler(true);
    const ku = keyHandler(false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    let rafId = 0;
    let proxCheck = 0;
    let lastT = performance.now();
    const loop = () => {
      if (stateRef.current.disposed) return;
      const tNow = performance.now();
      const dt = Math.min(0.05, (tNow - lastT) / 1000);
      lastT = tNow;
      // ===== Déplacement FPS =====
      const st = stateRef.current;
      const p = st.player;
      const i = st.input;
      const SPEED = 0.16 * (p.speedMul || 1);
      const ROT_SPEED = 0.035;
      // Rotation caméra (strafe mobile = A)
      if (i.rotL) p.rotY += ROT_SPEED;
      if (i.rotR) p.rotY -= ROT_SPEED;
      // Directions relatives
      const fwdX = -Math.sin(p.rotY);
      const fwdZ = -Math.cos(p.rotY);
      const rightX =  Math.cos(p.rotY);
      const rightZ = -Math.sin(p.rotY);
      let dx = 0, dz = 0;
      if (i.fwd)   { dx += fwdX;   dz += fwdZ; }
      if (i.back)  { dx -= fwdX;   dz -= fwdZ; }
      if (i.left)  { dx -= rightX; dz -= rightZ; }
      if (i.right) { dx += rightX; dz += rightZ; }
      const moving = (dx !== 0 || dz !== 0) && p.alive;
      if (moving) {
        const len = Math.hypot(dx, dz);
        dx = (dx / len) * SPEED;
        dz = (dz / len) * SPEED;
        const nx = p.x + dx;
        const nz = p.z + dz;
        if (!st.collidesAt(nx, p.z)) p.x = nx;
        if (!st.collidesAt(p.x, nz)) p.z = nz;
      }
      // Death zone check (hors jeu prolongé = mort)
      if (p.alive && st.isInDeathZone && st.isInDeathZone(p.x, p.z)) {
        p.alive = false;
        st.onPlayerDeath && st.onPlayerDeath();
      }
      // Applique à la caméra
      camera.position.set(p.x, 2.6, p.z);
      camera.rotation.y = p.rotY;

      // ===== Animation MER : vagues sinusoïdales sur les vertices =====
      if (decoRefs.sea && decoRefs.seaPos) {
        const tWave = tNow * 0.001;
        for (let v = 0; v < decoRefs.seaPos.count; v++) {
          const x = decoRefs.seaPos.getX(v);
          const y = decoRefs.seaPos.getY(v);
          const wave = Math.sin(x * 0.18 + tWave * 1.6) * 0.18
                     + Math.cos(y * 0.22 + tWave * 1.1) * 0.14
                     + Math.sin((x + y) * 0.09 + tWave * 0.6) * 0.10;
          decoRefs.seaPos.setZ(v, decoRefs.seaBaseZ[v] + wave);
        }
        decoRefs.seaPos.needsUpdate = true;
        decoRefs.sea.geometry.computeVertexNormals();
        // Écume qui pulse en opacité (vagues s'échouent)
        if (decoRefs.foam) {
          decoRefs.foam.material.opacity = 0.55 + Math.abs(Math.sin(tWave * 2.5)) * 0.35;
          decoRefs.foam.scale.x = 1 + Math.sin(tWave * 2.5) * 0.4;
        }
        // Jet de la fontaine pulse
        if (decoRefs.fountainJet) {
          decoRefs.fountainJet.scale.y = 1 + Math.abs(Math.sin(tWave * 4)) * 0.3;
          decoRefs.fountainJet.material.opacity = 0.4 + Math.abs(Math.sin(tWave * 4)) * 0.3;
        }
        // Nuages dérivent lentement
        if (decoRefs.clouds) {
          decoRefs.clouds.children.forEach(cl => {
            cl.position.x += cl.userData.driftSpeed || 0.03;
            if (cl.position.x > 400) cl.position.x = -400;
          });
        }
      }

      // ===== Véhicule : suivre le joueur et animer =====
      if (st.vehicleRig) {
        st.vehicleRig.position.set(p.x, 0, p.z);
        st.vehicleRig.rotation.y = p.rotY + Math.PI; // oriente face à la direction caméra
        const speedScalar = moving ? 1 : 0.05;
        animateVehicleRig(st.vehicleRig, speedScalar, tNow / 1000);
      }

      // ===== Bullets =====
      for (let bi = st.bullets.length - 1; bi >= 0; bi--) {
        const b = st.bullets[bi];
        b.mesh.position.addScaledVector(b.dir, b.speed);
        b.ttl--;
        // Hit NPCs
        let hit = false;
        for (const n of npcs.children) {
          if (!n.userData.alive) continue;
          const dx2 = n.position.x - b.mesh.position.x;
          const dz2 = n.position.z - b.mesh.position.z;
          const dy2 = 1.2 - b.mesh.position.y;
          if (dx2 * dx2 + dz2 * dz2 + dy2 * dy2 < 0.9) {
            n.userData.health -= b.damage;
            // Burst de sang
            const burst = new THREE.Mesh(
              new THREE.SphereGeometry(0.12, 8, 6),
              new THREE.MeshBasicMaterial({ color: 0xaa0a14, transparent: true, opacity: 0.9 })
            );
            burst.position.set(n.position.x, 1.4, n.position.z);
            scene.add(burst);
            st.bloodBursts.push({ mesh: burst, ttl: 40, scaleRate: 1.08 });
            hit = true;
            if (n.userData.health <= 0) {
              n.userData.alive = false;
              n.rotation.x = -Math.PI / 2; // tombe au sol
              n.position.y = -0.8;
              // Cache le panneau WANTED et le halo
              if (n.userData.sign) n.userData.sign.visible = false;
              if (n.userData.halo) n.userData.halo.visible = false;
              st.onNpcKilled && st.onNpcKilled(n.userData.bounty || 0, n.userData.isWanted);
            }
            break;
          }
        }
        if (hit || b.ttl <= 0 || b.mesh.position.y < -0.5 || Math.abs(b.mesh.position.x) > 90 || Math.abs(b.mesh.position.z) > 90) {
          scene.remove(b.mesh);
          b.mesh.geometry.dispose();
          b.mesh.material.dispose();
          st.bullets.splice(bi, 1);
        }
      }
      // Fade blood bursts
      for (let bi = st.bloodBursts.length - 1; bi >= 0; bi--) {
        const bb = st.bloodBursts[bi];
        bb.ttl--;
        bb.mesh.scale.multiplyScalar(bb.scaleRate);
        bb.mesh.material.opacity *= 0.95;
        if (bb.ttl <= 0) {
          scene.remove(bb.mesh);
          bb.mesh.geometry.dispose();
          bb.mesh.material.dispose();
          st.bloodBursts.splice(bi, 1);
        }
      }

      // ===== Proximité (5 fois/s suffit) =====
      proxCheck++;
      if (proxCheck % 12 === 0) {
        let nearest = null;
        let minDist = Infinity;
        for (const o of st.interactables) {
          const d = Math.hypot(p.x - o.pos.x, p.z - o.pos.z);
          if (d < o.radius && d < minDist) {
            minDist = d;
            nearest = o;
          }
        }
        const curr = st.nearby;
        if ((nearest && (!curr || curr.type !== nearest.type || curr.id !== nearest.id))
            || (!nearest && curr)) {
          st.nearby = nearest;
          st.onNearbyChange?.(nearest);
        }
      }

      // ===== Ambient =====
      clouds.children.forEach(c => {
        c.position.x += c.userData.driftSpeed;
        if (c.position.x > 60) c.position.x = -60;
      });
      birds.children.forEach((b) => {
        b.userData.phase += 0.02;
        const r = b.userData.radius;
        b.position.x = Math.cos(b.userData.phase) * r;
        b.position.z = -20 + Math.sin(b.userData.phase) * r * 0.4;
        const flap = Math.sin(b.userData.phase * 12) * 0.5;
        b.children[0].rotation.z = 0.4 + flap;
        b.children[1].rotation.z = -0.4 - flap;
        b.rotation.y = -b.userData.phase + Math.PI / 2;
      });
      npcs.children.forEach((n) => {
        const ud = n.userData;
        if (!ud.alive) return; // PNJ mort → reste au sol
        ud.phase += 0.14;
        n.position.x += ud.speed * ud.direction;
        if (n.position.x > 40) ud.direction = -1;
        if (n.position.x < -40) ud.direction = 1;
        n.rotation.y = ud.direction > 0 ? -Math.PI / 2 : Math.PI / 2;
        const swing = Math.sin(ud.phase) * 0.4;
        if (ud.parts) {
          ud.parts.legL.rotation.x =  swing;
          ud.parts.legR.rotation.x = -swing;
          ud.parts.armL.rotation.x = -swing * 0.8;
          ud.parts.armR.rotation.x =  swing * 0.8;
        }
        // Billboard du panneau WANTED : face à la caméra + pulse du halo
        if (ud.sign) {
          // Le NPC a une rotation.y non nulle ; on neutralise en mettant sign.rotation.y à l'inverse
          // de sorte que le panneau regarde toujours la caméra (approximation)
          const camToNpcY = Math.atan2(camera.position.x - n.position.x, camera.position.z - n.position.z);
          ud.sign.rotation.y = camToNpcY - n.rotation.y;
        }
        if (ud.halo) {
          const s = 0.85 + Math.abs(Math.sin(tNow * 0.004)) * 0.35;
          ud.halo.scale.set(s, s, s);
        }
      });
      if (st.car) {
        st.car.position.x += st.car.userData.speed;
        if (st.car.position.x > 50) st.car.position.x = -50;
      }
      if (st.gateBar) {
        const target = st.gateOpen ? Math.PI / 2.2 : 0;
        st.gateBar.rotation.z = THREE.MathUtils.lerp(st.gateBar.rotation.z, target, 0.05);
      }

      // ===== RADAR =====
      if (radarRef.current) {
        const R = 120;
        const HALF = R / 2;
        const SCALE = HALF / 48; // arène ~46m → rayon utile 48
        const ctx = radarRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, R, R);
          // Cercle fond
          const grad = ctx.createRadialGradient(HALF, HALF, 5, HALF, HALF, HALF);
          grad.addColorStop(0, 'rgba(20,40,70,0.85)');
          grad.addColorStop(1, 'rgba(5,15,28,0.95)');
          ctx.fillStyle = grad;
          ctx.beginPath(); ctx.arc(HALF, HALF, HALF - 1, 0, Math.PI * 2); ctx.fill();
          // Liseré doré
          ctx.strokeStyle = 'rgba(212,175,55,0.6)';
          ctx.lineWidth = 2;
          ctx.stroke();
          // Croisillon
          ctx.strokeStyle = 'rgba(212,175,55,0.18)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(HALF, 4); ctx.lineTo(HALF, R - 4);
          ctx.moveTo(4, HALF); ctx.lineTo(R - 4, HALF);
          ctx.stroke();
          // Fonction : world → radar (centré sur le joueur)
          const wr = (wx, wz) => {
            const dx = (wx - p.x) * SCALE;
            const dz = (wz - p.z) * SCALE;
            return { x: HALF + dx, y: HALF + dz };
          };
          // Interactables
          st.interactables.forEach(o => {
            const { x, y } = wr(o.pos.x, o.pos.z);
            if (Math.hypot(x - HALF, y - HALF) > HALF - 4) return;
            let color = '#3fe6ff';
            let sz = 5;
            if (o.type === 'casino')   { color = '#ffd700'; sz = 7; }
            else if (o.type === 'house') { color = '#ff99b0'; sz = 5; }
            else if (o.type === 'building') { color = '#b48cff'; sz = 5; }
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 4;
            ctx.fillRect(x - sz/2, y - sz/2, sz, sz);
            ctx.shadowBlur = 0;
          });
          // NPCs (orange)
          npcs.children.forEach(n => {
            const { x, y } = wr(n.position.x, n.position.z);
            if (Math.hypot(x - HALF, y - HALF) > HALF - 4) return;
            ctx.fillStyle = '#ff8a3a';
            ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
          });
          // Voiture
          if (st.car) {
            const { x, y } = wr(st.car.position.x, st.car.position.z);
            if (Math.hypot(x - HALF, y - HALF) < HALF - 4) {
              ctx.fillStyle = '#e04a50';
              ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
            }
          }
          // Joueur (centre) + cône de vision
          ctx.fillStyle = '#3fe6ff';
          ctx.beginPath(); ctx.arc(HALF, HALF, 4, 0, Math.PI * 2); ctx.fill();
          // Cône devant le joueur
          const coneLen = 14;
          const dirX = -Math.sin(p.rotY);
          const dirZ = -Math.cos(p.rotY);
          ctx.strokeStyle = 'rgba(63,230,255,0.45)';
          ctx.fillStyle = 'rgba(63,230,255,0.15)';
          ctx.beginPath();
          ctx.moveTo(HALF, HALF);
          const spread = 0.55;
          const aL = Math.atan2(dirZ, dirX) - spread;
          const aR = Math.atan2(dirZ, dirX) + spread;
          ctx.lineTo(HALF + Math.cos(aL) * coneLen, HALF + Math.sin(aL) * coneLen);
          ctx.lineTo(HALF + Math.cos(aR) * coneLen, HALF + Math.sin(aR) * coneLen);
          ctx.closePath();
          ctx.fill(); ctx.stroke();
        }
      }

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      stateRef.current.disposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      renderer.domElement.removeEventListener('click', handleClick);
      try { mount.removeChild(renderer.domElement); } catch (_e) { /* noop */ }
      renderer.dispose();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          const m = Array.isArray(o.material) ? o.material : [o.material];
          m.forEach(mat => { if (mat.map) mat.map.dispose(); mat.dispose(); });
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Callbacks live (pas besoin de re-init la scène)
  useEffect(() => {
    stateRef.current.onCasinoClick = () => {
      if (scanning) return;
      setScanning(true);
      setScanProgress(0);
      stateRef.current.gateOpen = true; // lève la barrière
      const step = 50;
      let p = 0;
      const iv = setInterval(() => {
        p += step;
        setScanProgress(p / 5000);
        if (p >= 5000) {
          clearInterval(iv);
          setScanning(false);
          setScanProgress(0);
          stateRef.current.gateOpen = false; // rabaisse
          onEnterCasino?.();
        }
      }, step);
    };
    stateRef.current.onHouseClick = (houseId) => {
      setSelectedHouse(houseId);
    };
    stateRef.current.onBuildingClick = () => {
      setAptPickerOpen(true);
    };
    stateRef.current.onGarageClick = () => {
      setGarageOpen(true);
    };
    stateRef.current.onShopfrontClick = () => {
      onOpenShop ? onOpenShop() : setGarageOpen(true);
    };
    // Hooks de test (dev) — permettent de téléporter / ouvrir directement
    if (typeof window !== 'undefined') {
      window.__streetTeleport = (x, z) => {
        if (stateRef.current.player) {
          stateRef.current.player.x = x;
          stateRef.current.player.z = z;
        }
      };
      window.__openGarage = () => setGarageOpen(true);
      window.__getStreetPos = () => stateRef.current.player ? { x: stateRef.current.player.x, z: stateRef.current.player.z } : null;
    }
    stateRef.current.onNearbyChange = (nb) => {
      setNearbyPrompt(nb);
    };
    stateRef.current.onNpcKilled = (bounty = 0, wasWanted = false) => {
      setHud(h => ({ ...h, npcKilled: h.npcKilled + 1 }));
      if (bounty > 0 && wasWanted) {
        setBalance(b => b + bounty);
        setBountyToast({ amount: bounty });
        setTimeout(() => setBountyToast(null), 3000);
      }
    };
    stateRef.current.onPlayerDeath = () => {
      setRespawning(true);
      setTimeout(() => {
        // Respawn devant le casino (point de spawn safe et logique)
        if (stateRef.current?.player) {
          stateRef.current.player.x = 0;
          stateRef.current.player.z = 12;
          stateRef.current.player.rotY = 0;
          stateRef.current.player.alive = true;
          stateRef.current.player.health = 100;
        }
        setHud(h => ({ ...h, health: 100 }));
        setRespawning(false);
      }, 1500);
    };
  }, [scanning, onEnterCasino]); // eslint-disable-line react-hooks/exhaustive-deps

  // Équiper / retirer le véhicule (persiste dans profile)
  const toggleVehicle = () => {
    if (!profile) return;
    const list = profile.vehicles || [];
    if (list.length === 0) {
      setToast("🛍 Achète un véhicule à la boutique du casino d'abord !");
      setTimeout(() => setToast(null), 2600);
      return;
    }
    if (ridingOn) {
      // Descend
      stateRef.current.attachVehicle && stateRef.current.attachVehicle(null);
      if (stateRef.current.player) stateRef.current.player.speedMul = 1;
      if (setProfile) setProfile({ ...profile, equippedVehicle: null });
      setRidingOn(false);
    } else {
      // Monte : prend le plus rapide équipé
      const best = VEHICLES.filter(v => list.includes(v.id)).sort((a, b) => b.speedMul - a.speedMul)[0];
      if (!best) return;
      stateRef.current.attachVehicle && stateRef.current.attachVehicle(best.id);
      if (stateRef.current.player) stateRef.current.player.speedMul = best.speedMul;
      if (setProfile) setProfile({ ...profile, equippedVehicle: best.id });
      setRidingOn(true);
    }
  };

  // Changer de véhicule directement
  const equipSpecificVehicle = (vid) => {
    if (!profile) return;
    const list = profile.vehicles || [];
    if (!list.includes(vid)) return;
    const def = VEHICLES.find(v => v.id === vid);
    if (!def) return;
    stateRef.current.attachVehicle && stateRef.current.attachVehicle(vid);
    if (stateRef.current.player) stateRef.current.player.speedMul = def.speedMul;
    if (setProfile) setProfile({ ...profile, equippedVehicle: vid });
    setRidingOn(true);
  };

  // Tirer avec une arme (visée)
  const fireWeapon = () => {
    if (!aimingWeapon || !stateRef.current.spawnBulletFromCamera) return;
    stateRef.current.spawnBulletFromCamera(aimingWeapon);
  };

  // Helpers pour driver l'input depuis le joystick tactile
  const setInput = (key, val) => {
    if (stateRef.current?.input) stateRef.current.input[key] = val ? 1 : 0;
  };
  const tapInteract = () => {
    const nb = stateRef.current?.nearby;
    if (!nb) return;
    if (nb.type === 'casino') stateRef.current.onCasinoClick?.();
    else if (nb.type === 'house') stateRef.current.onHouseClick?.(nb.id);
    else if (nb.type === 'building') stateRef.current.onBuildingClick?.(nb.id);
    else if (nb.type === 'garage') stateRef.current.onGarageClick?.();
    else if (nb.type === 'shopfront') stateRef.current.onShopfrontClick?.();
  };

  const house = HOUSES.find(h => h.id === selectedHouse);
  const isOwned = house && ownedKeys.includes(house.id);

  const confirmBuy = () => {
    if (!house) return;
    if (isOwned) {
      onOpenHome?.(house.id);
      setSelectedHouse(null);
      return;
    }
    if (balance < house.price) {
      setToast(`❌ Solde insuffisant (il manque ${fmt(house.price - balance)} $)`);
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setBalance(b => b - house.price);
    onBuyHouse?.(house.id);
    setToast(`🔑 ${house.label} achetée ! Clé ajoutée à ton inventaire.`);
    setTimeout(() => setToast(null), 3500);
    setSelectedHouse(null);
  };

  return (
    <div
      data-testid="street-3d"
      style={{ position: 'fixed', inset: 0, background: '#9fd7ff', overflow: 'hidden' }}
    >
      <div ref={mountRef} style={{ width: '100vw', height: '100vh' }} />

      {/* ====== CHICHA EN MAIN (ville) ====== */}
      {hasHookah && (
        <FPHookahView hookahId={equippedHookah} isUsing={usingHookah} />
      )}
      {hasHookah && (
        <button
          data-testid="street-hookah-btn"
          onClick={useHookahFn}
          disabled={usingHookah}
          style={{
            position: 'absolute', right: 16, bottom: 100,
            width: 56, height: 56, borderRadius: '50%',
            background: usingHookah
              ? 'linear-gradient(135deg, #ff6a3a, #c41e3a)'
              : 'linear-gradient(135deg, rgba(255,215,0,0.9), rgba(200,168,90,0.95))',
            border: `2px solid ${usingHookah ? '#fff' : '#ffd700'}`,
            color: '#000', cursor: usingHookah ? 'wait' : 'pointer',
            fontSize: 11, fontWeight: 800,
            boxShadow: '0 6px 14px rgba(0,0,0,0.6)', zIndex: 30,
          }}>
          <div style={{ fontSize: 22 }}>💨</div>
          <div style={{ fontSize: 8 }}>{usingHookah ? '...' : 'CHICHA'}</div>
        </button>
      )}

      {/* === MENU UNIVERSEL G3 — accessible partout === */}
      <UniversalMenu
        profile={profile}
        balance={balance}
        deviceType={deviceType}
        onOpenTrophies={onOpenTrophies}
        onOpenQuests={onOpenQuests}
        onOpenShop={onOpenShop}
        position="top-right"
      />

      {/* HUD top */}
      <div style={{
        position: 'absolute', top: 14, left: 14, right: 14,
        display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between',
        pointerEvents: 'none', zIndex: 10,
      }}>
        <button
          data-testid="street-logout-btn"
          onClick={onExitGame}
          style={{
            pointerEvents: 'auto',
            padding: '10px 16px', borderRadius: 20,
            background: 'rgba(10,10,15,0.8)', border: `2px solid ${STAKE.gold}`,
            color: STAKE.goldLight, fontWeight: 800, cursor: 'pointer',
            fontSize: 13, backdropFilter: 'blur(8px)',
          }}
        >← Déconnexion</button>
        <div style={{
          padding: '10px 16px', borderRadius: 20,
          background: 'rgba(10,10,15,0.8)', border: `2px solid ${STAKE.gold}`,
          color: STAKE.goldLight, fontWeight: 800, fontSize: 13,
          backdropFilter: 'blur(8px)', pointerEvents: 'auto',
        }}>
          💰 {fmt(balance)} $ &nbsp;·&nbsp; 🔑 {ownedKeys.length}
        </div>
      </div>

      {/* Mini-radar (top right sous le HUD) */}
      <div style={{
        position: 'absolute', top: 70, right: 14, zIndex: 10,
        pointerEvents: 'none',
      }}>
        <canvas
          ref={radarRef}
          data-testid="street-radar"
          width={120}
          height={120}
          style={{
            width: 120, height: 120,
            borderRadius: '50%',
            filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))',
          }}
        />
        {/* Légende compacte */}
        <div style={{
          marginTop: 6, padding: '4px 8px',
          background: 'rgba(10,10,15,0.75)', borderRadius: 8,
          fontSize: 9, color: '#aaa', textAlign: 'center',
          border: '1px solid rgba(212,175,55,0.2)',
          letterSpacing: 0.5,
        }}>
          <span style={{ color: '#ffd700' }}>■</span> Casino ·{' '}
          <span style={{ color: '#ff99b0' }}>■</span> Maison ·{' '}
          <span style={{ color: '#b48cff' }}>■</span> Immeuble
        </div>
      </div>

      {/* Prompt de proximité + bouton E */}
      {nearbyPrompt && !scanning && !selectedHouse && !aptPickerOpen && !garageOpen && (
        <div
          data-testid="interaction-prompt"
          style={{
            position: 'absolute', top: '44%', left: '50%', transform: 'translate(-50%, -50%)',
            padding: '14px 22px', borderRadius: 14,
            background: 'rgba(10,10,15,0.85)', color: '#fff',
            border: `2px solid ${STAKE.gold}`, letterSpacing: 0.5,
            backdropFilter: 'blur(8px)', textAlign: 'center', zIndex: 10,
            boxShadow: `0 0 25px ${STAKE.gold}55`,
            animation: 'prompt-bob 1.6s ease-in-out infinite',
          }}
        >
          <div style={{ fontSize: 13, color: STAKE.goldLight, marginBottom: 6 }}>
            {nearbyPrompt.type === 'casino' ? '🎰 Entrée du casino' :
             nearbyPrompt.type === 'building' ? '🏢 Les Résidences — Choisir un appart' :
             nearbyPrompt.type === 'garage' ? '🚗 Garage — Acheter un véhicule' :
             nearbyPrompt.type === 'shopfront' ? '🛒 Boutique — Armes & cosmétiques' :
             (ownedKeys.includes(nearbyPrompt.id) ? '🔑 Ta propriété' : '🏠 Acheter cette propriété')}
          </div>
          <button
            data-testid="interact-btn"
            onClick={tapInteract}
            style={{
              padding: '10px 22px', borderRadius: 30,
              background: `linear-gradient(135deg, ${STAKE.goldDark}, ${STAKE.gold})`,
              border: 'none', color: '#111', fontWeight: 900, fontSize: 15,
              letterSpacing: 1.5, cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(212,175,55,0.4)',
            }}
          >APPUIE · E</button>
          <style>{`
            @keyframes prompt-bob {
              0%,100% { transform: translate(-50%, -50%); }
              50% { transform: translate(-50%, -56%); }
            }
          `}</style>
        </div>
      )}

      {/* Tutoriel de base quand il n'y a aucun prompt */}
      {!nearbyPrompt && !scanning && (
        <div style={{
          position: 'absolute', top: 76, left: '50%', transform: 'translateX(-50%)',
          padding: '8px 14px', borderRadius: 10,
          background: 'rgba(10,10,15,0.75)', color: '#fff', fontSize: 12,
          border: `1px solid rgba(212,175,55,0.3)`, backdropFilter: 'blur(6px)',
          textAlign: 'center', zIndex: 5,
        }}>
          Déplace-toi avec les <b style={{ color: STAKE.gold }}>flèches</b> en bas · Approche-toi d'un bâtiment pour interagir
        </div>
      )}

      {/* Joystick mobile : D-pad flèches */}
      {!scanning && !selectedHouse && !aptPickerOpen && (
        <div style={{
          position: 'absolute', bottom: 24, left: 14, zIndex: 20,
          display: 'grid', gridTemplateColumns: '48px 48px 48px', gridTemplateRows: '48px 48px 48px', gap: 4,
          userSelect: 'none',
        }}>
          <div />
          <DpadBtn testId="move-fwd"   label="▲" onDown={() => setInput('fwd', 1)}  onUp={() => setInput('fwd', 0)} />
          <div />
          <DpadBtn testId="move-left"  label="◀" onDown={() => setInput('left', 1)} onUp={() => setInput('left', 0)} />
          <div style={{
            background: 'rgba(10,10,15,0.4)', border: `1px solid rgba(212,175,55,0.2)`,
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, color: STAKE.inkSoft,
          }}>MOVE</div>
          <DpadBtn testId="move-right" label="▶" onDown={() => setInput('right', 1)} onUp={() => setInput('right', 0)} />
          <div />
          <DpadBtn testId="move-back"  label="▼" onDown={() => setInput('back', 1)}  onUp={() => setInput('back', 0)} />
          <div />
        </div>
      )}

      {/* (Joystick rotation supprimé : on tourne la tête à la souris/drag tactile) */}

      {/* Hint look controls — fade out après 4.5s */}
      {lookHintShown && !scanning && !selectedHouse && !aptPickerOpen && (
        <div
          data-testid="street-look-hint"
          style={{
            position: 'absolute', bottom: '32%', left: '50%', transform: 'translateX(-50%)',
            zIndex: 30, padding: '10px 18px', borderRadius: 30,
            background: 'rgba(10,10,15,0.85)',
            border: '2px solid rgba(212,175,55,0.5)',
            color: '#ffd700', fontSize: 13, fontWeight: 800, letterSpacing: 1,
            backdropFilter: 'blur(8px)',
            animation: 'lookHintFade 4.5s ease-in-out forwards',
            pointerEvents: 'none', textAlign: 'center',
          }}
        >
          🖱️ Clique pour tourner la tête · 📱 Drag tactile pour mobile
          <style>{`
            @keyframes lookHintFade {
              0%   { opacity: 0; transform: translate(-50%, 10px); }
              10%  { opacity: 1; transform: translate(-50%, 0); }
              80%  { opacity: 1; }
              100% { opacity: 0; transform: translate(-50%, -10px); }
            }
          `}</style>
        </div>
      )}

      {/* Panneau véhicule + combat (bottom-center au-dessus des joysticks) */}
      {!scanning && !selectedHouse && !aptPickerOpen && (
        <div style={{
          position: 'absolute', bottom: 110, left: '50%', transform: 'translateX(-50%)',
          zIndex: 20, display: 'flex', gap: 8, alignItems: 'center',
          pointerEvents: 'auto',
        }}>
          {/* Toggle véhicule */}
          <button
            data-testid="street-vehicle-toggle"
            onClick={toggleVehicle}
            style={{
              padding: '10px 14px', borderRadius: 30, border: `2px solid ${STAKE.gold}`,
              background: ridingOn ? 'linear-gradient(135deg, #0a6aa8, #083a66)' : 'rgba(10,10,15,0.75)',
              color: ridingOn ? '#3fe6ff' : STAKE.goldLight, fontWeight: 900, fontSize: 12,
              cursor: 'pointer', letterSpacing: 0.8, backdropFilter: 'blur(6px)',
              boxShadow: ridingOn ? '0 0 20px rgba(63,230,255,0.5)' : '0 4px 10px rgba(0,0,0,0.4)',
            }}
          >
            {ridingOn ? '🛹 DESCENDRE' : '🛹 MONTER'}
          </button>
          {/* Sélecteur véhicule (si plusieurs possédés) */}
          {(profile?.vehicles || []).length > 1 && ridingOn && (
            <div style={{ display: 'flex', gap: 4 }}>
              {(profile.vehicles).map(vid => {
                const def = VEHICLES.find(v => v.id === vid);
                if (!def) return null;
                const active = profile.equippedVehicle === vid;
                return (
                  <button
                    key={vid}
                    data-testid={`veh-pick-${vid}`}
                    onClick={() => equipSpecificVehicle(vid)}
                    style={{
                      width: 38, height: 38, borderRadius: 19,
                      border: active ? `2px solid ${STAKE.gold}` : '1px solid #555',
                      background: active ? 'rgba(212,175,55,0.25)' : 'rgba(10,10,15,0.7)',
                      color: '#fff', cursor: 'pointer', fontSize: 16,
                    }}
                  >{def.emoji}</button>
                );
              })}
            </div>
          )}
          {/* Sélecteur arme */}
          {(profile?.weapons || []).length > 0 && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {(profile.weapons).slice(0, 4).map(wid => {
                const def = WEAPONS.find(w => w.id === wid);
                if (!def) return null;
                const active = aimingWeapon === wid;
                const iconMap = { knife: '🔪', machete: '🔪', gun: '🔫', shotgun: '🔫', bazooka: '🚀', flamethrower: '🔥', throwknife: '🗡️', crossbow: '🏹', uzi: '🔫', grenade: '💣', laserrifle: '⚡' };
                const ico = iconMap[wid] || '⚔️';
                return (
                  <button
                    key={wid}
                    data-testid={`weapon-pick-${wid}`}
                    onClick={() => setAimingWeapon(active ? null : wid)}
                    style={{
                      width: 40, height: 40, borderRadius: 8,
                      border: active ? '2px solid #ff4444' : '1px solid #555',
                      background: active ? 'rgba(180,40,40,0.35)' : 'rgba(10,10,15,0.7)',
                      color: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 800,
                    }}
                    title={def.name}
                  >{ico}</button>
                );
              })}
              {aimingWeapon && (
                <button
                  data-testid="street-fire-btn"
                  onPointerDown={(e) => { e.preventDefault(); fireWeapon(); }}
                  style={{
                    padding: '10px 16px', borderRadius: 30,
                    background: 'linear-gradient(135deg, #8b0000, #4a0000)',
                    border: '2px solid #ff4444', color: '#fff',
                    fontWeight: 900, fontSize: 13, cursor: 'pointer',
                    boxShadow: '0 0 18px rgba(255,68,68,0.5)',
                  }}
                >🔫 TIRER</button>
              )}
            </div>
          )}
        </div>
      )}

      {/* HUD combat : kills + avertissement barrière */}
      {(hud.npcKilled > 0 || aimingWeapon) && (
        <div
          data-testid="street-combat-hud"
          style={{
            position: 'absolute', top: 70, left: 14, zIndex: 10,
            padding: '6px 12px', borderRadius: 8,
            background: 'rgba(10,10,15,0.8)', border: '1px solid rgba(255,68,68,0.3)',
            color: '#ff9999', fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
          }}
        >
          ☠ Kills : <span style={{ color: '#fff' }}>{hud.npcKilled}</span>
          {aimingWeapon && <span style={{ marginLeft: 10, color: STAKE.goldLight }}>🎯 {WEAPONS.find(w => w.id === aimingWeapon)?.name}</span>}
        </div>
      )}

      {/* Bandeau "ÉVÉNEMENTS GAMBLELIFE" — visible si un event quotidien est actif */}
      {activeEvents.length > 0 && (
        <div
          data-testid="street-events-banner"
          style={{
            position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
            zIndex: 12, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center',
            maxWidth: '80%', pointerEvents: 'none',
          }}
        >
          {activeEvents.map(ev => (
            <div key={ev.id} style={{
              padding: '8px 14px', borderRadius: 12,
              background: `linear-gradient(135deg, ${ev.color}cc, ${ev.color}88)`,
              border: `2px solid ${ev.color}`,
              color: '#fff', fontWeight: 900, fontSize: 12, letterSpacing: 0.5,
              boxShadow: `0 4px 14px ${ev.color}66, inset 0 0 12px rgba(255,255,255,0.1)`,
              backdropFilter: 'blur(6px)',
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              animation: 'eventPulse 2.4s ease-in-out infinite',
            }}>
              {ev.label}
            </div>
          ))}
          <style>{`
            @keyframes eventPulse {
              0%,100% { transform: scale(1); }
              50%     { transform: scale(1.04); }
            }
          `}</style>
        </div>
      )}

      {/* Respawn overlay (mort par sortie de zone) */}
      {respawning && (
        <div
          data-testid="street-respawn"
          style={{
            position: 'absolute', inset: 0, background: 'rgba(40,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 250, backdropFilter: 'blur(10px)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 12 }}>💀</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#ff4444', letterSpacing: 2 }}>
              HORS ZONE
            </div>
            <div style={{ fontSize: 13, color: '#fff', marginTop: 10, opacity: 0.8 }}>
              Respawn au spawn...
            </div>
          </div>
        </div>
      )}

      {/* Bounty toast — récompense après kill d'un NPC WANTED */}
      {bountyToast && (
        <div
          data-testid="street-bounty-toast"
          style={{
            position: 'absolute', top: '28%', left: '50%', transform: 'translateX(-50%)',
            padding: '16px 24px', borderRadius: 14,
            background: 'linear-gradient(135deg, #0a6a1a, #1aa34a)',
            border: `3px solid ${STAKE.gold}`, color: '#fff',
            fontWeight: 900, fontSize: 20, letterSpacing: 1.5,
            zIndex: 400, boxShadow: '0 0 40px rgba(26,163,74,0.65), 0 10px 30px rgba(0,0,0,0.5)',
            textAlign: 'center', animation: 'bounty-pop 0.4s cubic-bezier(.2,.9,.25,1.2)',
          }}
        >
          <div style={{ fontSize: 11, color: STAKE.goldLight, letterSpacing: 2, marginBottom: 4 }}>
            ★ PRIME ENCAISSÉE ★
          </div>
          <div style={{ fontSize: 26 }}>+{fmt(bountyToast.amount)} $</div>
          <style>{`
            @keyframes bounty-pop {
              0% { transform: translate(-50%, 20px); opacity: 0; }
              100% { transform: translate(-50%, 0); opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {/* Scan d'identité */}
      {scanning && (
        <div
          data-testid="scan-identity"
          style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, backdropFilter: 'blur(6px)',
          }}
        >
          <div style={{ color: STAKE.gold, fontSize: 22, fontWeight: 900, marginBottom: 18, letterSpacing: 2 }}>
            VÉRIFICATION D'IDENTITÉ
          </div>
          <div style={{
            width: 320, height: 320, borderRadius: '50%',
            border: `4px solid ${STAKE.gold}`, position: 'relative',
            boxShadow: `0 0 40px ${STAKE.gold}`,
          }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: `conic-gradient(${STAKE.gold} ${scanProgress * 360}deg, transparent 0deg)`,
              opacity: 0.35,
            }} />
            <div style={{
              position: 'absolute', top: '50%', left: 0, right: 0, height: 2,
              background: STAKE.liveCyan,
              transform: `translateY(${Math.sin(Date.now() * 0.005) * 140}px)`,
              boxShadow: `0 0 10px ${STAKE.liveCyan}`,
            }} />
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              fontSize: 72,
            }}>🪪</div>
          </div>
          <div style={{ color: '#fff', fontSize: 14, marginTop: 18, opacity: 0.8 }}>
            Scan en cours… {Math.round(scanProgress * 100)}%
          </div>
        </div>
      )}

      {/* Popup achat maison */}
      {house && !scanning && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50, backdropFilter: 'blur(6px)',
        }}>
          <div
            data-testid="house-buy-modal"
            style={{
              background: 'linear-gradient(135deg, #0f2a42, #1d4a79)',
              border: `2px solid ${STAKE.gold}`, borderRadius: 16,
              padding: 24, maxWidth: 420, width: '88%',
              color: '#fff', boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ fontSize: 11, color: STAKE.goldLight, letterSpacing: 1.5, marginBottom: 6 }}>
              {house.type === 'apartment' ? 'APPARTEMENT' : house.type === 'villa' ? 'VILLA PREMIUM' : 'MAISON'}
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 14 }}>{house.label}</div>
            <div style={{ fontSize: 13, color: STAKE.inkSoft, lineHeight: 1.5, marginBottom: 18 }}>
              {house.type === 'villa' && 'Une demeure de prestige avec palmier, terrasse et finitions or.'}
              {house.type === 'house' && 'Charmante maison individuelle avec jardin privatif.'}
              {house.type === 'apartment' && `Appartement au ${house.floor}${house.floor === 0 ? 'e' : 'e'} étage de l'immeuble "Les Résidences".`}
            </div>
            {!isOwned && (
              <div style={{
                background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 12, marginBottom: 18,
                border: `1px solid rgba(212,175,55,0.25)`,
              }}>
                <div style={{ fontSize: 11, color: STAKE.inkSoft, letterSpacing: 1 }}>PRIX</div>
                <div style={{ fontSize: 28, color: STAKE.goldLight, fontWeight: 900 }}>
                  {fmt(house.price)} $
                </div>
                <div style={{ fontSize: 11, color: balance >= house.price ? '#1aa34a' : '#dc2626', marginTop: 4 }}>
                  {balance >= house.price ? '✓ Achetable' : `✗ Manque ${fmt(house.price - balance)} $`}
                </div>
              </div>
            )}
            {isOwned && (
              <div style={{
                background: 'rgba(26,163,74,0.15)', borderRadius: 8, padding: 14, marginBottom: 18,
                border: `1px solid #1aa34a`, textAlign: 'center',
              }}>
                <div style={{ fontSize: 28 }}>🔑</div>
                <div style={{ color: '#1aa34a', fontWeight: 800 }}>Tu possèdes cette propriété</div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                data-testid="house-cancel"
                onClick={() => setSelectedHouse(null)}
                style={{
                  flex: 1, padding: 14, borderRadius: 10,
                  background: 'transparent', border: '1px solid #888', color: '#aaa',
                  cursor: 'pointer', fontSize: 13, fontWeight: 700,
                }}
              >Fermer</button>
              <button
                data-testid="house-confirm"
                onClick={confirmBuy}
                disabled={!isOwned && balance < house.price}
                style={{
                  flex: 2, padding: 14, borderRadius: 10,
                  background: isOwned
                    ? 'linear-gradient(135deg, #1aa34a, #15803d)'
                    : (balance >= house.price ? `linear-gradient(135deg, ${STAKE.goldDark}, ${STAKE.gold})` : '#333'),
                  border: 'none', color: '#fff', fontWeight: 900,
                  cursor: (isOwned || balance >= house.price) ? 'pointer' : 'not-allowed',
                  fontSize: 14, letterSpacing: 1,
                }}
              >{isOwned ? 'ENTRER CHEZ MOI' : 'ACHETER'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Apartment picker modal (5 appartements dans l'immeuble) */}
      {aptPickerOpen && !scanning && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50, backdropFilter: 'blur(6px)',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #0f2a42, #1d4a79)',
            border: `2px solid ${STAKE.gold}`, borderRadius: 16,
            padding: 20, maxWidth: 420, width: '90%', color: '#fff',
          }}>
            <div style={{ fontSize: 11, color: STAKE.goldLight, letterSpacing: 1.5, marginBottom: 6 }}>
              IMMEUBLE — LES RÉSIDENCES
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 14 }}>Choisis un appartement</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {HOUSES.filter(h => h.type === 'apartment').map(h => {
                const own = ownedKeys.includes(h.id);
                return (
                  <button
                    key={h.id}
                    data-testid={`apt-pick-${h.id}`}
                    onClick={() => { setAptPickerOpen(false); setSelectedHouse(h.id); }}
                    style={{
                      padding: 12, borderRadius: 10,
                      background: own ? 'rgba(26,163,74,0.18)' : 'rgba(0,0,0,0.3)',
                      border: `1px solid ${own ? '#1aa34a' : 'rgba(212,175,55,0.3)'}`,
                      color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>
                      {own ? '🔑 ' : ''}Appartement {h.floor + 1} — étage {h.floor + 1}
                    </span>
                    <span style={{ color: own ? '#1aa34a' : STAKE.goldLight, fontWeight: 800, fontSize: 13 }}>
                      {own ? 'À VOUS' : fmt(h.price) + ' $'}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              data-testid="apt-close"
              onClick={() => setAptPickerOpen(false)}
              style={{
                width: '100%', padding: 12, borderRadius: 10,
                background: 'transparent', border: '1px solid #888',
                color: '#aaa', cursor: 'pointer', fontSize: 13, fontWeight: 700,
              }}
            >Fermer</button>
          </div>
        </div>
      )}

      {toast && (
        <div style={{
          position: 'absolute', top: 90, left: '50%', transform: 'translateX(-50%)',
          padding: '14px 22px', borderRadius: 12,
          background: 'linear-gradient(135deg, #0f2a42, #1d4a79)',
          border: `2px solid ${STAKE.gold}`, color: '#fff',
          fontWeight: 800, fontSize: 13, zIndex: 200, boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        }}>{toast}</div>
      )}

      {/* GARAGE — Concession véhicules */}
      {garageOpen && (
        <div
          data-testid="garage-modal"
          style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 300, backdropFilter: 'blur(8px)', padding: 12,
          }}
          onClick={() => setGarageOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, #1a0f18, #0a0508)',
              border: `2px solid ${STAKE.gold}`, borderRadius: 16,
              padding: 20, maxWidth: 720, width: '100%', maxHeight: '88vh',
              overflowY: 'auto', color: '#fff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: STAKE.goldLight, letterSpacing: 2 }}>
                🚗 GARAGE — VÉHICULES
              </div>
              <button
                data-testid="garage-close"
                onClick={() => setGarageOpen(false)}
                style={{
                  padding: '6px 14px', borderRadius: 8,
                  background: 'transparent', border: `1px solid ${STAKE.gold}`,
                  color: STAKE.goldLight, cursor: 'pointer', fontSize: 13, fontWeight: 700,
                }}
              >✕ Fermer</button>
            </div>
            <div style={{ fontSize: 12, color: '#cca366', marginBottom: 14, textAlign: 'center' }}>
              Solde : <b style={{ color: STAKE.gold }}>{fmt(balance)} $</b>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {VEHICLES.map(v => {
                const owned = (profile?.vehicles || []).includes(v.id);
                const equipped = profile?.equippedVehicle === v.id;
                const canAfford = balance >= v.price;
                return (
                  <div
                    key={v.id}
                    data-testid={`garage-veh-${v.id}`}
                    style={{
                      padding: 12, borderRadius: 10,
                      background: 'rgba(20,10,20,0.85)',
                      border: `1px solid ${owned ? '#00aa44' : 'rgba(212,175,55,0.35)'}`,
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 38, marginBottom: 6 }}>{v.emoji || '🚗'}</div>
                    <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>{v.name}</div>
                    <div style={{ fontSize: 11, color: '#cca366', marginBottom: 6 }}>
                      Vitesse ×{v.speedMul}
                    </div>
                    <div style={{ fontSize: 12, color: STAKE.goldLight, fontWeight: 700, marginBottom: 8 }}>
                      {fmt(v.price)} $
                    </div>
                    {owned ? (
                      equipped ? (
                        <div style={{ color: '#00ff88', fontWeight: 900, fontSize: 12 }}>✓ ÉQUIPÉ</div>
                      ) : (
                        <button
                          data-testid={`garage-equip-${v.id}`}
                          onClick={() => { equipSpecificVehicle(v.id); setGarageOpen(false); }}
                          style={{
                            width: '100%', padding: '8px', borderRadius: 8,
                            background: `linear-gradient(135deg, ${STAKE.goldDark}, ${STAKE.gold})`,
                            border: 'none', color: '#111', fontWeight: 800, cursor: 'pointer', fontSize: 12,
                          }}
                        >Équiper</button>
                      )
                    ) : (
                      <button
                        data-testid={`garage-buy-${v.id}`}
                        disabled={!canAfford}
                        onClick={() => {
                          if (!canAfford) return;
                          const newBal = balance - v.price;
                          setBalance(newBal);
                          if (setProfile && profile) {
                            setProfile({
                              ...profile,
                              vehicles: [...(profile.vehicles || []), v.id],
                              equippedVehicle: v.id,
                              balance: newBal,
                            });
                          }
                          setRidingOn(true);
                          stateRef.current.attachVehicle && stateRef.current.attachVehicle(v.id);
                          if (stateRef.current.player) stateRef.current.player.speedMul = v.speedMul;
                          setToast(`🚗 ${v.name} acheté & équipé !`);
                          setTimeout(() => setToast(null), 2500);
                          setGarageOpen(false);
                        }}
                        style={{
                          width: '100%', padding: '8px', borderRadius: 8,
                          background: canAfford ? `linear-gradient(135deg, ${STAKE.goldDark}, ${STAKE.gold})` : '#333',
                          border: 'none', color: canAfford ? '#111' : '#888',
                          fontWeight: 800, cursor: canAfford ? 'pointer' : 'not-allowed', fontSize: 12,
                        }}
                      >{canAfford ? 'Acheter' : 'Solde insuffisant'}</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Street3D;

// D-pad button — supporte touch + click ET reset fiable au quitter
const DpadBtn = ({ label, onDown, onUp, testId }) => {
  const handleDown = (e) => { e.preventDefault(); onDown(); };
  const handleUp   = (e) => { e.preventDefault(); onUp(); };
  return (
    <button
      data-testid={testId}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerLeave={handleUp}
      onPointerCancel={handleUp}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        width: 48, height: 48, borderRadius: 10,
        background: 'rgba(10,10,15,0.72)', border: `1.5px solid rgba(212,175,55,0.45)`,
        color: '#f0d26a', fontSize: 20, fontWeight: 800, cursor: 'pointer',
        touchAction: 'none', userSelect: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(6px)',
        boxShadow: '0 4px 10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >{label}</button>
  );
};
