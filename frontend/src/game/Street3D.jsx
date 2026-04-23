import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { fmt } from '@/game/constants';
import { STAKE } from '@/game/stake/theme';

// =============================================================
// HOUSE CATALOG — 10 propriétés (5 appart / 3 maisons / 2 villas)
// =============================================================
export const HOUSES = [
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
];

// =============================================================
// Composant Street3D — Scène extérieure
// Props : profile, balance, setBalance, onEnterCasino(), onBuyHouse(houseId), onExitGame()
// =============================================================
const Street3D = ({ profile, balance, setBalance, onEnterCasino, onBuyHouse, onExitGame, onOpenHome }) => {
  const mountRef = useRef(null);
  const stateRef = useRef({});
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [toast, setToast] = useState(null);
  const [nearbyPrompt, setNearbyPrompt] = useState(null);
  const [aptPickerOpen, setAptPickerOpen] = useState(false);

  const ownedKeys = profile?.keys || [];
  const ownedHouses = profile?.ownedHouses || [];

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ----- Scene / Camera / Renderer -----
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9fd7ff); // bleu ciel clair
    scene.fog = new THREE.Fog(0x9fd7ff, 50, 130);

    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
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

    // ----- Sol (route + herbe) -----
    const groundGrass = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: 0x4a8f3a, roughness: 0.95 })
    );
    groundGrass.rotation.x = -Math.PI / 2;
    groundGrass.receiveShadow = true;
    scene.add(groundGrass);

    // Route asphalte devant les bâtiments
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 10),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.85 })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.01, -4);
    road.receiveShadow = true;
    scene.add(road);

    // Lignes blanches discontinues
    for (let i = -38; i <= 38; i += 4) {
      const line = new THREE.Mesh(
        new THREE.PlaneGeometry(2.2, 0.25),
        new THREE.MeshStandardMaterial({ color: 0xfff6b8 })
      );
      line.rotation.x = -Math.PI / 2;
      line.position.set(i, 0.02, -4);
      scene.add(line);
    }

    // Trottoir
    const sidewalkFront = new THREE.Mesh(
      new THREE.BoxGeometry(80, 0.15, 2),
      new THREE.MeshStandardMaterial({ color: 0xb0b4b7, roughness: 0.9 })
    );
    sidewalkFront.position.set(0, 0.07, -8);
    sidewalkFront.receiveShadow = true;
    scene.add(sidewalkFront);

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
    sctx.fillText('★ BENZ ROYAL ★', 512, 220);
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
    blctx.fillText('5 APPARTEMENTS · 5M B', 256, 90);
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
      lcx.fillText(owned ? '★ À VOUS ★' : '10 000 000 B', 256, 92);
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
      lcx.fillText(owned ? '★ À VOUS ★' : '100 000 000 B', 256, 92);
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
    // Ligne arrière derrière bâtiments (z = -34)
    for (let x = -48; x <= 48; x += 4) addPost(x, -34);
    // Lignes latérales
    for (let z = -34; z <= 8; z += 4) { addPost(-48, z); addPost(48, z); }
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

    // === OBSTACLES (AABB simples pour collision) ===
    // Format : { minX, maxX, minZ, maxZ }
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

    // ----- NPCs piétons (3) qui marchent sur le trottoir -----
    const npcs = new THREE.Group();
    const npcColors = [
      { skin: 0xe0b48a, shirt: 0xc93a3a, pants: 0x1a2a3a },
      { skin: 0xb88866, shirt: 0x3a8aa0, pants: 0x2a1a1a },
      { skin: 0xd0a080, shirt: 0xe8c058, pants: 0x1a1a1a },
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

      // Trajectoire : va et vient le long du trottoir
      npc.position.set(-25 + i * 20, 0, -8);
      npc.userData = {
        parts: { legL, legR, armL, armR },
        speed: 0.035 + Math.random() * 0.015,
        direction: i % 2 === 0 ? 1 : -1,
        phase: Math.random() * Math.PI * 2,
      };
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

    // ----- État FPS du joueur -----
    stateRef.current = {
      scene, camera, renderer, clouds, birds, npcs, car, gateBar, disposed: false,
      // Position/rotation du joueur (FPS)
      player: { x: 0, z: 12, rotY: 0 }, // rotY=0 → caméra regarde -Z (vers casino)
      // État des entrées (clavier + joystick mobile)
      input: { fwd: 0, back: 0, left: 0, right: 0, rotL: 0, rotR: 0 },
      interactables,
      collidesAt,
      // Callbacks live injectés plus bas
      onCasinoClick: null, onHouseClick: null,
      // Prompt de proximité
      nearby: null,
    };

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
      }
    };
    const kd = keyHandler(true);
    const ku = keyHandler(false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    let rafId = 0;
    let proxCheck = 0;
    const loop = () => {
      if (stateRef.current.disposed) return;
      // ===== Déplacement FPS =====
      const st = stateRef.current;
      const p = st.player;
      const i = st.input;
      const SPEED = 0.16;
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
      if (dx !== 0 || dz !== 0) {
        const len = Math.hypot(dx, dz);
        dx = (dx / len) * SPEED;
        dz = (dz / len) * SPEED;
        // Tente déplacement, slide sur l'axe libre si collision
        const nx = p.x + dx;
        const nz = p.z + dz;
        if (!st.collidesAt(nx, p.z)) p.x = nx;
        if (!st.collidesAt(p.x, nz)) p.z = nz;
        // Limites arène
        p.x = Math.max(-46, Math.min(46, p.x));
        p.z = Math.max(-30, Math.min(14,  p.z));
      }
      // Applique à la caméra
      camera.position.set(p.x, 2.6, p.z);
      camera.rotation.y = p.rotY;

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
      });
      if (st.car) {
        st.car.position.x += st.car.userData.speed;
        if (st.car.position.x > 50) st.car.position.x = -50;
      }
      if (st.gateBar) {
        const target = st.gateOpen ? Math.PI / 2.2 : 0;
        st.gateBar.rotation.z = THREE.MathUtils.lerp(st.gateBar.rotation.z, target, 0.05);
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
    stateRef.current.onNearbyChange = (nb) => {
      setNearbyPrompt(nb);
    };
  }, [scanning, onEnterCasino]);

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
      setToast(`❌ Solde insuffisant (il manque ${fmt(house.price - balance)} B)`);
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
          💰 {fmt(balance)} B &nbsp;·&nbsp; 🔑 {ownedKeys.length}
        </div>
      </div>

      {/* Prompt de proximité + bouton E */}
      {nearbyPrompt && !scanning && !selectedHouse && !aptPickerOpen && (
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

      {/* Joystick rotation (droite) */}
      {!scanning && !selectedHouse && !aptPickerOpen && (
        <div style={{
          position: 'absolute', bottom: 24, right: 14, zIndex: 20,
          display: 'flex', gap: 6, userSelect: 'none',
        }}>
          <DpadBtn testId="rot-left"  label="↺" onDown={() => setInput('rotL', 1)} onUp={() => setInput('rotL', 0)} />
          <DpadBtn testId="rot-right" label="↻" onDown={() => setInput('rotR', 1)} onUp={() => setInput('rotR', 0)} />
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
                  {fmt(house.price)} B
                </div>
                <div style={{ fontSize: 11, color: balance >= house.price ? '#1aa34a' : '#dc2626', marginTop: 4 }}>
                  {balance >= house.price ? '✓ Achetable' : `✗ Manque ${fmt(house.price - balance)} B`}
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
                      {own ? 'À VOUS' : fmt(h.price) + ' B'}
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
