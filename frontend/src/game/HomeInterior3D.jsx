import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { fmt, FURNITURE_CATALOG } from '@/game/constants';
import { STAKE } from '@/game/stake/theme';
import { HOUSES } from '@/game/Street3D';

// =============================================================
// THÈMES (décor complet : murs + sol + accent meubles)
// =============================================================
export const HOME_THEMES = {
  cozy: {
    label: 'Cosy',
    wall: 0xe8d5b7, floor: 0x8b5a3a,
    sofa: 0x6b4423, bed: 0xb98c62, table: 0x4a3222, accent: 0xcc8a3a,
  },
  modern: {
    label: 'Moderne',
    wall: 0xf0f0f2, floor: 0x2a2a30,
    sofa: 0x1a1a1f, bed: 0xfafafa, table: 0x202028, accent: 0x3fe6ff,
  },
  lux: {
    label: 'Luxueux',
    wall: 0x1a0f18, floor: 0x0d060e,
    sofa: 0x3a1218, bed: 0x4a0010, table: 0x0a0508, accent: 0xd4af37,
  },
  neon: {
    label: 'Néon',
    wall: 0x0a1828, floor: 0x05101c,
    sofa: 0x1a2a4a, bed: 0x2a1a4a, table: 0x101828, accent: 0xff2ad4,
  },
  classic: {
    label: 'Classique',
    wall: 0xf4efde, floor: 0xa6774a,
    sofa: 0x5a2a2a, bed: 0xe0c088, table: 0x6a4024, accent: 0x2a4a7a,
  },
};

// Calcul stats "trophy wall" à partir de l'historique GambleBet + gains cumulés
const computeStats = (profile) => {
  if (!profile) return [];
  let biggestBet = 0, longestStreak = 0, biggestOdds = 0, totalBets = 0;
  try {
    const hist = JSON.parse(localStorage.getItem(`benzbet:${profile.name}:history`) || '[]');
    totalBets = hist.length;
    let streak = 0;
    for (const h of hist) {
      if (h.status === 'won') {
        streak++;
        if (streak > longestStreak) longestStreak = streak;
        if (h.payout > biggestBet) biggestBet = h.payout;
        if ((h.totalOdds || 0) > biggestOdds) biggestOdds = h.totalOdds;
      } else streak = 0;
    }
  } catch (_e) { /* noop */ }
  return [
    { icon: '💰', label: 'Gains cumulés', value: fmt(profile.totalWinnings || 0) + ' $' },
    { icon: '🎯', label: 'Plus gros gain GambleBet', value: fmt(biggestBet) + ' $' },
    { icon: '🔥', label: 'Meilleure streak', value: longestStreak + ' V' },
    { icon: '💎', label: 'Cote max gagnée', value: biggestOdds > 0 ? biggestOdds.toFixed(2) : '—' },
    { icon: '🎰', label: 'Paris placés', value: totalBets },
    { icon: '🔑', label: 'Propriétés', value: (profile.keys || []).length + ' / 10' },
  ];
};

// =============================================================
// <HomeInterior3D>
// Intérieur first-person customisable (1 pièce ouverte, 3 zones)
// =============================================================
const HomeInterior3D = ({ profile, setProfile, houseId, onExit }) => {
  const mountRef = useRef(null);
  const stateRef = useRef({});
  const house = HOUSES.find(h => h.id === houseId);
  const owned = (profile?.ownedHouses || []).find(h => h.id === houseId);
  const initialTheme = owned?.customizations?.theme || (house?.type === 'villa' ? 'lux' : house?.type === 'apartment' ? 'modern' : 'cozy');
  const [theme, setTheme] = useState(initialTheme);
  const [showTrophies, setShowTrophies] = useState(false);
  const [showFurnStore, setShowFurnStore] = useState(false);
  const [furnTab, setFurnTab] = useState('salon');

  const t = HOME_THEMES[theme];
  const stats = computeStats(profile);
  // Taille selon type (villa plus grande que appart)
  // Villas = 2 étages : on simule en doublant la hauteur intérieure et en ajoutant un escalier + plateforme.
  const isTwoFloor = house?.type === 'villa';
  const size = isTwoFloor ? { w: 26, d: 16, h: 8 }    // villa 2 étages
            : house?.type === 'house' ? { w: 18, d: 12, h: 3.5 }
            : { w: 14, d: 10, h: 3 };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a10);

    const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 80);
    camera.position.set(0, 2.4, size.d / 2 - 1.5);
    camera.lookAt(0, 1.8, -size.d / 2);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const main = new THREE.DirectionalLight(0xffffff, 1.1);
    main.position.set(4, 7, 3);
    main.castShadow = true;
    scene.add(main);
    const accent = new THREE.PointLight(t.accent, 1.6, 14);
    accent.position.set(0, size.h - 0.3, 0);
    scene.add(accent);

    // Sol
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(size.w, size.d),
      new THREE.MeshStandardMaterial({ color: t.floor, roughness: 0.75, metalness: 0.1 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Plafond
    const ceil = new THREE.Mesh(
      new THREE.PlaneGeometry(size.w, size.d),
      new THREE.MeshStandardMaterial({ color: 0xe8e8ec, roughness: 0.9 })
    );
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = size.h;
    scene.add(ceil);

    // Murs (4)
    const wallMat = new THREE.MeshStandardMaterial({ color: t.wall, roughness: 0.85 });
    const wallBack = new THREE.Mesh(new THREE.PlaneGeometry(size.w, size.h), wallMat);
    wallBack.position.set(0, size.h / 2, -size.d / 2);
    scene.add(wallBack);
    const wallFront = new THREE.Mesh(new THREE.PlaneGeometry(size.w, size.h), wallMat);
    wallFront.position.set(0, size.h / 2, size.d / 2);
    wallFront.rotation.y = Math.PI;
    scene.add(wallFront);
    const wallLeft = new THREE.Mesh(new THREE.PlaneGeometry(size.d, size.h), wallMat);
    wallLeft.rotation.y = Math.PI / 2;
    wallLeft.position.set(-size.w / 2, size.h / 2, 0);
    scene.add(wallLeft);
    const wallRight = new THREE.Mesh(new THREE.PlaneGeometry(size.d, size.h), wallMat);
    wallRight.rotation.y = -Math.PI / 2;
    wallRight.position.set(size.w / 2, size.h / 2, 0);
    scene.add(wallRight);

    // === ZONE SALON (gauche) ===
    const salon = new THREE.Group();
    salon.position.set(-size.w / 3, 0, 1.5);
    // Canapé
    const sofa = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.9, 1.1),
      new THREE.MeshStandardMaterial({ color: t.sofa, roughness: 0.9 })
    );
    sofa.position.set(0, 0.45, 0);
    sofa.castShadow = true;
    salon.add(sofa);
    // Coussins dossier
    const back = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.7, 0.35),
      new THREE.MeshStandardMaterial({ color: t.sofa, roughness: 0.9 })
    );
    back.position.set(0, 1.1, -0.4);
    salon.add(back);
    // Accoudoirs
    for (let sa = -1; sa <= 1; sa += 2) {
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.9, 1.1),
        new THREE.MeshStandardMaterial({ color: t.sofa, roughness: 0.9 })
      );
      arm.position.set(sa * 1.35, 0.7, 0);
      salon.add(arm);
    }
    // Table basse
    const coffee = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.4, 0.8),
      new THREE.MeshStandardMaterial({ color: t.table, metalness: 0.3, roughness: 0.5 })
    );
    coffee.position.set(0, 0.2, 1.4);
    coffee.castShadow = true;
    salon.add(coffee);
    // TV
    const tvStand = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.5, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x111, metalness: 0.4 })
    );
    tvStand.position.set(0, 0.25, -2.2);
    salon.add(tvStand);
    const tv = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 1.1, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x000, emissive: t.accent, emissiveIntensity: 0.55 })
    );
    tv.position.set(0, 1.2, -2.28);
    salon.add(tv);
    // Lampe d'ambiance (point light accent)
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 10),
      new THREE.MeshStandardMaterial({ color: t.accent, emissive: t.accent, emissiveIntensity: 1 })
    );
    lamp.position.set(-2.2, 1.3, 0.5);
    salon.add(lamp);
    const lampLight = new THREE.PointLight(t.accent, 0.8, 5);
    lampLight.position.copy(lamp.position);
    salon.add(lampLight);
    scene.add(salon);

    // === ZONE CUISINE (milieu) ===
    const kitchen = new THREE.Group();
    kitchen.position.set(0, 0, -size.d / 2 + 1.2);
    // Plan de travail en L
    const counter1 = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.9, 0.8),
      new THREE.MeshStandardMaterial({ color: 0xeeeeef, metalness: 0.3, roughness: 0.25 })
    );
    counter1.position.set(0, 0.45, -0.2);
    counter1.castShadow = true;
    kitchen.add(counter1);
    // Meuble bas (base)
    const baseCab = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.82, 0.75),
      new THREE.MeshStandardMaterial({ color: t.table, roughness: 0.5 })
    );
    baseCab.position.set(0, 0.41, -0.2);
    kitchen.add(baseCab);
    // Placards hauts
    for (let c = 0; c < 3; c++) {
      const cab = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 0.8, 0.4),
        new THREE.MeshStandardMaterial({ color: t.table, roughness: 0.5 })
      );
      cab.position.set(-1.4 + c * 1.4, 2.4, -0.4);
      kitchen.add(cab);
    }
    // Évier
    const sink = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.08, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x4a4a50, metalness: 0.9, roughness: 0.2 })
    );
    sink.position.set(1.2, 0.92, -0.2);
    kitchen.add(sink);
    // Plaques de cuisson
    const stove = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.05, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x111, emissive: 0x551a0a, emissiveIntensity: 0.3 })
    );
    stove.position.set(-1.2, 0.92, -0.2);
    kitchen.add(stove);
    scene.add(kitchen);

    // === ZONE CHAMBRE (droite) ===
    const bedroom = new THREE.Group();
    bedroom.position.set(size.w / 3, 0, 1);
    // Lit
    const bedBase = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.35, 3.2),
      new THREE.MeshStandardMaterial({ color: t.table, roughness: 0.6 })
    );
    bedBase.position.set(0, 0.18, 0);
    bedBase.castShadow = true;
    bedroom.add(bedBase);
    const mattress = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 0.35, 3.1),
      new THREE.MeshStandardMaterial({ color: t.bed, roughness: 0.9 })
    );
    mattress.position.set(0, 0.55, 0);
    bedroom.add(mattress);
    const pillow = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.2, 0.6),
      new THREE.MeshStandardMaterial({ color: 0xfafafa })
    );
    pillow.position.set(0, 0.85, -1.15);
    bedroom.add(pillow);
    // Tête de lit
    const headboard = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.3, 0.18),
      new THREE.MeshStandardMaterial({ color: t.sofa, roughness: 0.6 })
    );
    headboard.position.set(0, 1.15, -1.55);
    bedroom.add(headboard);
    // Table de nuit + lampe
    const night = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.8, 0.55),
      new THREE.MeshStandardMaterial({ color: t.table })
    );
    night.position.set(-1.5, 0.4, -1);
    bedroom.add(night);
    const nLamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 10, 8),
      new THREE.MeshStandardMaterial({ color: t.accent, emissive: t.accent, emissiveIntensity: 1 })
    );
    nLamp.position.set(-1.5, 1, -1);
    bedroom.add(nLamp);
    const nLampLight = new THREE.PointLight(t.accent, 0.6, 3);
    nLampLight.position.copy(nLamp.position);
    bedroom.add(nLampLight);
    scene.add(bedroom);

    // === MUR TROPHÉES (au fond, derrière la TV) ===
    const trophyCvs = document.createElement('canvas');
    trophyCvs.width = 1024; trophyCvs.height = 640;
    const tcx = trophyCvs.getContext('2d');
    tcx.fillStyle = '#0d1117'; tcx.fillRect(0, 0, 1024, 640);
    // Cadre doré
    tcx.strokeStyle = '#d4af37'; tcx.lineWidth = 10;
    tcx.strokeRect(20, 20, 984, 600);
    // Titre
    tcx.fillStyle = '#d4af37';
    tcx.font = 'bold 56px Georgia';
    tcx.textAlign = 'center';
    tcx.fillText('🏆 MES TROPHÉES 🏆', 512, 90);
    tcx.fillStyle = '#aaa';
    tcx.font = '24px Georgia';
    tcx.fillText(`— ${profile?.name || 'Joueur'} —`, 512, 130);
    // 6 stats en grille 2×3
    stats.forEach((s, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const x = 80 + col * 470;
      const y = 190 + row * 130;
      tcx.fillStyle = 'rgba(212,175,55,0.1)';
      tcx.fillRect(x, y, 420, 110);
      tcx.strokeStyle = '#d4af37'; tcx.lineWidth = 2;
      tcx.strokeRect(x, y, 420, 110);
      tcx.fillStyle = '#ffe9a3';
      tcx.font = '40px Georgia';
      tcx.textAlign = 'left';
      tcx.fillText(s.icon, x + 20, y + 66);
      tcx.fillStyle = '#fff';
      tcx.font = 'bold 24px Georgia';
      tcx.fillText(s.label, x + 80, y + 48);
      tcx.fillStyle = '#ffd700';
      tcx.font = 'bold 30px Georgia';
      tcx.fillText(String(s.value), x + 80, y + 85);
    });
    const trophyTex = new THREE.CanvasTexture(trophyCvs);
    const trophyWall = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 3.75),
      new THREE.MeshBasicMaterial({ map: trophyTex })
    );
    trophyWall.position.set(-size.w / 3, 2.3, -size.d / 2 + 0.03);
    trophyWall.userData = { interaction: 'trophy' };
    scene.add(trophyWall);

    // Horloge murale déco (zone cuisine)
    const clock = new THREE.Mesh(
      new THREE.CircleGeometry(0.5, 32),
      new THREE.MeshStandardMaterial({ color: 0xfff, emissive: t.accent, emissiveIntensity: 0.2 })
    );
    clock.position.set(0, 3.0, -size.d / 2 + 0.05);
    scene.add(clock);

    // ========== MEUBLES ACHETÉS PAR LE JOUEUR (placés automatiquement) ==========
    // On place chaque meuble acheté à une position libre prédéfinie par catégorie.
    const ownedFurn = ((profile?.ownedHouses || []).find(h => h.id === houseId)?.customizations?.furniture) || [];
    const slotCounts = { salon: 0, cuisine: 0, chambre: 0, jeux: 0, deco: 0 };
    const slotPositions = {
      salon:   [[ -size.w / 2 + 2.5, 0,  size.d / 2 - 2.5], [ -size.w / 2 + 4,   0,  size.d / 2 - 4.5]],
      cuisine: [[  size.w / 2 - 2.5, 0, -size.d / 2 + 2.5], [  size.w / 2 - 4,   0, -size.d / 2 + 4.5]],
      chambre: [[ -size.w / 2 + 2.5, 0, -size.d / 2 + 2.5], [ -size.w / 2 + 4,   0, -size.d / 2 + 4.5]],
      jeux:    [[  size.w / 2 - 2.5, 0,  size.d / 2 - 2.5], [  size.w / 2 - 4,   0,  size.d / 2 - 4.5]],
      deco:    [[ 0, 0,  size.d / 2 - 3.5 ], [ 0, 0, -size.d / 2 + 3.5 ], [ -size.w / 2 + 1, size.h - 1, 0 ]],
    };
    ownedFurn.forEach((furnId) => {
      const def = FURNITURE_CATALOG.find(f => f.id === furnId);
      if (!def) return;
      const slots = slotPositions[def.category] || slotPositions.deco;
      const slotIdx = slotCounts[def.category] % slots.length;
      const [fx, fy, fz] = slots[slotIdx];
      slotCounts[def.category]++;
      // Représentation 3D simple : boîte colorée + emoji en label flottant
      const fg = new THREE.Group();
      fg.position.set(fx, fy, fz);
      // Taille et couleur selon la catégorie/piece
      const dim = def.category === 'deco' ? [0.8, 1.2, 0.3]
                : def.category === 'cuisine' ? [1.5, 1.2, 0.8]
                : def.category === 'chambre' ? [1.8, 0.7, 2.2]
                : def.category === 'jeux'    ? [1.3, 1.3, 0.8]
                : [1.8, 0.9, 1.0]; // salon
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(...dim),
        new THREE.MeshStandardMaterial({
          color: def.color, roughness: 0.55, metalness: 0.3,
          emissive: def.color, emissiveIntensity: 0.08,
        })
      );
      box.position.y = dim[1] / 2;
      box.castShadow = true; box.receiveShadow = true;
      fg.add(box);
      // Label emoji au-dessus
      const ecv = document.createElement('canvas');
      ecv.width = 128; ecv.height = 128;
      const ectx = ecv.getContext('2d');
      ectx.font = '80px sans-serif';
      ectx.textAlign = 'center'; ectx.fillStyle = '#fff';
      ectx.fillText(def.icon, 64, 92);
      const etex = new THREE.CanvasTexture(ecv);
      const esprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: etex, transparent: true }));
      esprite.position.set(0, dim[1] + 0.5, 0);
      esprite.scale.set(0.7, 0.7, 0.7);
      fg.add(esprite);
      scene.add(fg);
    });

    // ========== PISCINE VILLA (zone dédiée au fond du salon) ==========
    if (house?.type === 'villa') {
      // Plateforme 2ème étage + escalier
      const upperFloorY = 4; // hauteur étage 2
      const upperFloor = new THREE.Mesh(
        new THREE.BoxGeometry(size.w, 0.25, size.d * 0.55),
        new THREE.MeshStandardMaterial({ color: t.floor, roughness: 0.7 })
      );
      upperFloor.position.set(0, upperFloorY, -size.d * 0.22);
      upperFloor.receiveShadow = true;
      upperFloor.castShadow = true;
      scene.add(upperFloor);
      // Garde-corps blanc moderne
      for (let s = -1; s <= 1; s += 2) {
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(size.w, 1.0, 0.08),
          new THREE.MeshStandardMaterial({ color: 0xf4f4f4, metalness: 0.3, roughness: 0.5 })
        );
        rail.position.set(0, upperFloorY + 0.5, s * (size.d * 0.55 / 2));
        scene.add(rail);
      }
      // Escalier (10 marches)
      const stairCount = 10;
      const stairW = 1.6, stairD = 0.4, stairH = upperFloorY / stairCount;
      for (let i = 0; i < stairCount; i++) {
        const step = new THREE.Mesh(
          new THREE.BoxGeometry(stairW, stairH, stairD),
          new THREE.MeshStandardMaterial({ color: t.floor, roughness: 0.6 })
        );
        step.position.set(size.w / 2 - 1.5, stairH / 2 + i * stairH, 1.5 - i * stairD);
        step.castShadow = true; step.receiveShadow = true;
        scene.add(step);
      }
      // Lit du 2ème étage (chambre maître)
      const masterBed = new THREE.Mesh(
        new THREE.BoxGeometry(2.6, 0.6, 2.1),
        new THREE.MeshStandardMaterial({ color: t.bed, roughness: 0.6 })
      );
      masterBed.position.set(-size.w * 0.25, upperFloorY + 0.55, -size.d * 0.3);
      masterBed.castShadow = true;
      scene.add(masterBed);
      // Bureau salle de jeux étage 2
      const deskUp = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.8, 1.0),
        new THREE.MeshStandardMaterial({ color: t.table, roughness: 0.5, metalness: 0.4 })
      );
      deskUp.position.set(size.w * 0.25, upperFloorY + 0.65, -size.d * 0.25);
      scene.add(deskUp);

      // Piscine 5x3 + bordures
      const poolWater = new THREE.Mesh(
        new THREE.BoxGeometry(5, 0.15, 3),
        new THREE.MeshStandardMaterial({
          color: 0x1ea0d0, metalness: 0.8, roughness: 0.12,
          emissive: 0x1ea0d0, emissiveIntensity: 0.3, transparent: true, opacity: 0.85,
        })
      );
      poolWater.position.set(size.w / 2 - 3.5, 0.1, size.d * 0.18);
      poolWater.receiveShadow = true;
      scene.add(poolWater);
      const poolBorder = new THREE.Mesh(
        new THREE.BoxGeometry(5.6, 0.3, 3.6),
        new THREE.MeshStandardMaterial({ color: 0xf0f0f2, roughness: 0.7 })
      );
      poolBorder.position.set(size.w / 2 - 3.5, 0.12, size.d * 0.18);
      scene.add(poolBorder);
      // 2 chaises longues
      for (let s = -1; s <= 1; s += 2) {
        const chair = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 0.4, 1.6),
          new THREE.MeshStandardMaterial({ color: 0xf4e4c0, roughness: 0.6 })
        );
        chair.position.set(size.w / 2 - 5.5, 0.2, size.d * 0.18 + s * 1.2);
        chair.castShadow = true;
        scene.add(chair);
      }
      // Palmier décoratif
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.2, 2.4, 8),
        new THREE.MeshStandardMaterial({ color: 0x5a3a18 })
      );
      trunk.position.set(size.w / 2 - 1.5, 1.2, -size.d / 2 + 2);
      scene.add(trunk);
      const leaves = new THREE.Mesh(
        new THREE.SphereGeometry(0.9, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0x2a9a3a })
      );
      leaves.position.set(size.w / 2 - 1.5, 2.7, -size.d / 2 + 2);
      leaves.scale.y = 0.5;
      scene.add(leaves);
    }

    // === Caméra orbit légèrement pour montrer 3D ===
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
        if (obj?.userData?.interaction === 'trophy') {
          stateRef.current.onTrophyClick?.();
          return;
        }
      }
    };
    renderer.domElement.addEventListener('click', handleClick);

    stateRef.current = { scene, camera, renderer, disposed: false };
    let rafId = 0;
    let elapsed = 0;
    const loop = () => {
      if (stateRef.current.disposed) return;
      elapsed += 0.008;
      // Mouvement de caméra : léger balancement gauche/droite pour rendre vivant
      camera.position.x = Math.sin(elapsed * 0.4) * 1.6;
      camera.position.y = 2.4 + Math.sin(elapsed * 0.3) * 0.1;
      camera.lookAt(0, 1.7, -size.d / 2 + 1);
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      stateRef.current.disposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
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
  }, [theme, houseId]);

  useEffect(() => {
    stateRef.current.onTrophyClick = () => setShowTrophies(true);
  }, []);

  const applyTheme = (newTheme) => {
    setTheme(newTheme);
    // Persist dans profile.ownedHouses[].customizations.theme
    const next = {
      ...profile,
      ownedHouses: (profile.ownedHouses || []).map(h =>
        h.id === houseId ? { ...h, customizations: { ...(h.customizations || {}), theme: newTheme } } : h
      ),
    };
    setProfile(next);
  };

  return (
    <div
      data-testid="home-interior"
      style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#000' }}
    >
      <div ref={mountRef} style={{ width: '100vw', height: '100vh' }} />

      {/* HUD top */}
      <div style={{
        position: 'absolute', top: 14, left: 14, right: 14,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        pointerEvents: 'none', zIndex: 10,
      }}>
        <button
          data-testid="home-exit-btn"
          onClick={onExit}
          style={{
            pointerEvents: 'auto',
            padding: '10px 16px', borderRadius: 20,
            background: 'rgba(10,10,15,0.8)', border: `2px solid ${STAKE.gold}`,
            color: STAKE.goldLight, fontWeight: 800, cursor: 'pointer', fontSize: 13,
            backdropFilter: 'blur(8px)',
          }}
        >← Sortir</button>
        <div style={{
          padding: '10px 16px', borderRadius: 20,
          background: 'rgba(10,10,15,0.8)', border: `2px solid ${STAKE.gold}`,
          color: STAKE.goldLight, fontWeight: 800, fontSize: 13,
          backdropFilter: 'blur(8px)', pointerEvents: 'auto',
        }}>
          🏠 {house?.label || 'Chez moi'}
        </div>
      </div>

      {/* Sélecteur de thème en bas */}
      <div style={{
        position: 'absolute', bottom: 20, left: 0, right: 0,
        display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap',
        padding: '0 12px', zIndex: 10,
      }}>
        {Object.entries(HOME_THEMES).map(([key, value]) => (
          <button
            key={key}
            data-testid={`theme-${key}`}
            onClick={() => applyTheme(key)}
            style={{
              padding: '10px 14px', borderRadius: 10,
              background: theme === key
                ? `linear-gradient(135deg, ${STAKE.goldDark}, ${STAKE.gold})`
                : 'rgba(10,10,15,0.8)',
              border: `2px solid ${theme === key ? STAKE.goldLight : 'rgba(212,175,55,0.3)'}`,
              color: '#fff', fontWeight: 800, fontSize: 12,
              cursor: 'pointer', backdropFilter: 'blur(8px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              minWidth: 78,
            }}
          >
            <span style={{
              width: 36, height: 18, borderRadius: 4,
              background: `linear-gradient(90deg, #${value.wall.toString(16).padStart(6,'0')}, #${value.accent.toString(16).padStart(6,'0')})`,
              border: '1px solid rgba(255,255,255,0.2)',
            }} />
            {value.label}
          </button>
        ))}
      </div>

      {/* Tip */}
      <div style={{
        position: 'absolute', top: 72, left: '50%', transform: 'translateX(-50%)',
        padding: '8px 14px', borderRadius: 10, fontSize: 12,
        background: 'rgba(10,10,15,0.7)', color: '#fff',
        border: `1px solid rgba(212,175,55,0.3)`, backdropFilter: 'blur(6px)',
        zIndex: 5,
      }}>
        Clique sur le <b style={{ color: STAKE.gold }}>mur trophées</b> pour voir le détail · Change de thème en bas
      </div>

      {/* Bouton Machine Ameublement (haut droite) */}
      <button
        data-testid="home-furn-btn"
        onClick={() => setShowFurnStore(true)}
        style={{
          position: 'absolute', top: 70, right: 14, zIndex: 20,
          padding: '12px 18px', borderRadius: 14,
          background: `linear-gradient(135deg, ${STAKE.goldDark}, ${STAKE.gold})`,
          border: `2px solid ${STAKE.goldLight}`, color: '#111',
          fontWeight: 900, fontSize: 13, cursor: 'pointer', letterSpacing: 1,
          boxShadow: '0 6px 18px rgba(212,175,55,0.5)',
          backdropFilter: 'blur(8px)',
        }}
      >🛍 AMEUBLEMENT</button>

      {/* Modal Machine Ameublement — catalogue achetable style Sims */}
      {showFurnStore && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.88)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, backdropFilter: 'blur(8px)',
        }} data-testid="home-furn-modal">
          <div style={{
            background: 'linear-gradient(135deg, #1a0f18, #0d060e)',
            border: `2px solid ${STAKE.gold}`, borderRadius: 16,
            padding: 20, maxWidth: 820, width: '94%', maxHeight: '92vh',
            overflowY: 'auto', color: '#fff',
          }}>
            <div style={{
              fontSize: 22, fontWeight: 900, textAlign: 'center',
              color: STAKE.goldLight, letterSpacing: 2, marginBottom: 4,
            }}>🛍 MACHINE AMEUBLEMENT 🛍</div>
            <div style={{ textAlign: 'center', fontSize: 12, color: STAKE.inkSoft, marginBottom: 14 }}>
              Achète des meubles et place-les dans ton logement
            </div>
            {/* Tabs catégorie */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
              {[
                ['salon',  '🛋 Salon'],
                ['cuisine','🍽 Cuisine'],
                ['chambre','🛏 Chambre'],
                ['jeux',   '🎮 Salle jeux'],
                ['deco',   '🎨 Déco'],
              ].map(([k, l]) => (
                <button
                  key={k}
                  data-testid={`furn-tab-${k}`}
                  onClick={() => setFurnTab(k)}
                  style={{
                    padding: '8px 14px', borderRadius: 8,
                    background: furnTab === k
                      ? `linear-gradient(135deg, ${STAKE.goldDark}, ${STAKE.gold})`
                      : 'rgba(255,255,255,0.05)',
                    color: furnTab === k ? '#111' : STAKE.goldLight,
                    border: `1px solid ${STAKE.gold}50`,
                    cursor: 'pointer', fontWeight: 800, fontSize: 12,
                  }}>{l}</button>
              ))}
            </div>
            {/* Grille items */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
              {FURNITURE_CATALOG.filter(f => f.category === furnTab).map(item => {
                const ownedFurniture = ((profile.ownedHouses || [])
                  .find(h => h.id === houseId)?.customizations?.furniture) || [];
                const hasIt = ownedFurniture.includes(item.id);
                const playerBal = profile.balance || 0;
                const canAfford = playerBal >= item.price;
                return (
                  <div key={item.id} style={{
                    padding: 12, borderRadius: 10,
                    background: 'rgba(20,10,20,0.8)',
                    border: `1px solid ${hasIt ? '#00aa44' : 'rgba(212,175,55,0.3)'}`,
                    textAlign: 'center',
                  }} data-testid={`furn-${item.id}`}>
                    <div style={{ fontSize: 38, marginBottom: 6 }}>{item.icon}</div>
                    <div style={{
                      width: 40, height: 8, margin: '0 auto 8px',
                      background: `#${item.color.toString(16).padStart(6,'0')}`,
                      borderRadius: 4, border: '1px solid rgba(255,255,255,0.2)',
                    }} />
                    <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 4 }}>{item.name}</div>
                    {hasIt ? (
                      <div style={{ color: '#00ff88', fontWeight: 900, fontSize: 12 }}>✓ POSSÉDÉ</div>
                    ) : (
                      <button
                        data-testid={`furn-buy-${item.id}`}
                        disabled={!canAfford}
                        onClick={() => {
                          if (!canAfford) return;
                          const newBal = playerBal - item.price;
                          const next = {
                            ...profile,
                            balance: newBal,
                            ownedHouses: (profile.ownedHouses || []).map(h =>
                              h.id === houseId ? {
                                ...h,
                                customizations: {
                                  ...(h.customizations || {}),
                                  furniture: [...(h.customizations?.furniture || []), item.id],
                                },
                              } : h),
                          };
                          setProfile(next);
                        }}
                        style={{
                          width: '100%', padding: '7px 10px',
                          background: canAfford
                            ? `linear-gradient(135deg, ${STAKE.goldDark}, ${STAKE.gold})`
                            : '#444',
                          border: 'none', borderRadius: 6, color: canAfford ? '#111' : '#888',
                          fontWeight: 900, fontSize: 11, letterSpacing: 0.5,
                          cursor: canAfford ? 'pointer' : 'not-allowed',
                        }}>
                        {canAfford ? `${fmt(item.price)} $` : 'TROP CHER'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              data-testid="furn-close"
              onClick={() => setShowFurnStore(false)}
              style={{
                width: '100%', marginTop: 14, padding: 12, borderRadius: 8,
                background: 'rgba(255,255,255,0.08)',
                border: `1px solid ${STAKE.gold}50`, color: STAKE.goldLight,
                fontWeight: 900, cursor: 'pointer', fontSize: 13, letterSpacing: 1,
              }}>FERMER</button>
          </div>
        </div>
      )}

      {/* Modal détail trophées */}
      {showTrophies && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.82)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, backdropFilter: 'blur(8px)',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #0f2a42, #1d4a79)',
            border: `2px solid ${STAKE.gold}`, borderRadius: 16,
            padding: 24, maxWidth: 480, width: '92%',
            color: '#fff', boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          }}>
            <div style={{
              fontSize: 22, fontWeight: 900, marginBottom: 6, textAlign: 'center',
              color: STAKE.goldLight, letterSpacing: 1,
            }}>🏆 MUR DES TROPHÉES 🏆</div>
            <div style={{ fontSize: 12, color: STAKE.inkSoft, textAlign: 'center', marginBottom: 18 }}>
              Statistiques du joueur {profile?.name}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {stats.map(s => (
                <div key={s.label} style={{
                  padding: 12, borderRadius: 8,
                  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212,175,55,0.25)',
                }}>
                  <div style={{ fontSize: 22 }}>{s.icon}</div>
                  <div style={{ fontSize: 10, color: STAKE.inkSoft, textTransform: 'uppercase', marginTop: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: STAKE.goldLight, marginTop: 2 }}>{s.value}</div>
                </div>
              ))}
            </div>
            <button
              data-testid="trophy-close"
              onClick={() => setShowTrophies(false)}
              style={{
                width: '100%', marginTop: 18, padding: 14, borderRadius: 10,
                background: `linear-gradient(135deg, ${STAKE.goldDark}, ${STAKE.gold})`,
                border: 'none', color: '#111', fontWeight: 900, cursor: 'pointer',
                fontSize: 13, letterSpacing: 1,
              }}
            >FERMER</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeInterior3D;
