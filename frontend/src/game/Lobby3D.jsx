import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { WEAPONS, VEHICLES, CASINO_3D_COLORS, HAIR_CATALOG, OUTFIT_CATALOG, SHOES_CATALOG, TROPHIES, DEALER_PROFILES, WHEEL_PRIZES, fmt } from '@/game/constants';
import { ArrowButton, Dealer, WeaponIcon, menuBtnStyle, StatCard } from '@/game/ui';
import { FPWeaponView, TPPlayerView, FPHookahView } from '@/game/FPWeapon';
import { useHookah } from '@/game/useHookah';
import { VehicleGraphic } from '@/game/ui';
import sfx from '@/game/sfx';
import { MPClient } from '@/game/multiplayer';
import { useLookControls } from '@/game/useLookControls';
import { UniversalMenu } from '@/game/UniversalMenu';
// ============== SCÈNE 3D THREE.JS - LOBBY COMPLET V4 ==============
const Lobby3D = ({ profile, casino, casinoId, deviceType, onSelectGame, onLogout, onExitCasino, onReplayTutorial, onOpenTrophies, onOpenShop, onOpenATM, onOpenWheel, walletReady, wheelReady, balance, onOpenBar, onOpenToilet, onOpenGambleBet, weapons, selectedWeapon, setSelectedWeapon, onShoot, onChangeCasino, onOpenCharacter, onToggleVehicle, onOpenQuests, mpMode, mpServerId }) => {
  const mountRef = useRef(null);
  const [nearZone, setNearZone] = useState(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [shooting, setShooting] = useState(false);
  const [viewMode, setViewMode] = useState('first'); // 'first' | 'third'
  const viewModeRef = useRef('first');
  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);
  const firingRef = useRef(false);
  const [visibleBullets, setVisibleBullets] = useState([]);
  const [muzzleKey, setMuzzleKey] = useState(0);
  const nearZoneRef = useRef(null);
  const onSelectRef = useRef(onSelectGame);
  const zoneCallbacksRef = useRef({});
  onSelectRef.current = onSelectGame;
  zoneCallbacksRef.current = {
    blackjack: () => onSelectGame('blackjack'),
    roulette: () => onSelectGame('roulette'),
    highcard: () => onSelectGame('highcard'),
    poker: () => onSelectGame('poker'),
    bar: () => onOpenBar(),
    toilet: () => onOpenToilet(),
    atm: () => onOpenATM(),
    wheel: () => onOpenWheel(),
    shop: () => onOpenShop(),
    benzbet: () => onOpenGambleBet(),
    exit: () => onExitCasino && onExitCasino(),
  };
  
  // État touches pour mobile
  const keysRef = useRef({ forward: false, backward: false, left: false, right: false });

  // ====== MULTIJOUEUR ======
  const mpOnline = mpMode === 'online' && !!mpServerId;
  const mpRef = useRef(null);       // MPClient instance
  const myIdRef = useRef(null);     // ID reçu du serveur
  const remotePlayersRef = useRef({}); // id -> { mesh, data }
  const sceneRefLocal = useRef(null); // accessible via sceneRef plus bas
  const [chatMessages, setChatMessages] = useState([]); // [{from, text, ts}]
  const [chatInput, setChatInput] = useState('');
  const [showChatInput, setShowChatInput] = useState(false);
  const chatInputRef = useRef(null);
  const [killFeed, setKillFeed] = useState([]); // [{killer, victim, weapon, ts}]
  const [myHp, setMyHp] = useState(100);
  const [onlinePlayersCount, setOnlinePlayersCount] = useState(0);

  // ====== ANIMATION D'ARRIVÉE TÉLÉPORTATION (4s, 3ème pers., flash blanc) ======
  // Quand le joueur arrive dans le casino, on joue une cinématique :
  //   - caméra 3ème personne en orbite autour du joueur (point de spawn)
  //   - overlay blanc transparent qui pulse comme une téléportation
  //   - durée totale = 4000 ms, puis retour vue normale (1ère pers.)
  const [arriving, setArriving] = useState(true);
  const arrivingRef = useRef(true);
  const arrivalStartRef = useRef(performance.now());

  // ====== CHICHA — hook partagé ======
  const { equippedHookah, hasHookah, usingHookah, useHookah: useHookahFn } = useHookah(profile);
  useEffect(() => { arrivingRef.current = arriving; }, [arriving]);
  useEffect(() => {
    arrivalStartRef.current = performance.now();
    setArriving(true);
    const t = setTimeout(() => setArriving(false), 4000);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;
    const colors = CASINO_3D_COLORS[casinoId] || CASINO_3D_COLORS.vegas;
    const primaryHex = parseInt(casino.primary.slice(1), 16);
    const secondaryHex = parseInt(casino.secondary.slice(1), 16);
    const accentHex = parseInt(casino.accent.slice(1), 16);
    
    let width = mount.clientWidth;
    let height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1028);
    scene.fog = new THREE.Fog(0x1a1028, 25, 80);
    sceneRef.current = scene;
    sceneRefLocal.current = scene;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
    // Spawn au centre du casino (pas collé à la porte de sortie z=17.5)
    // La porte de sortie étant à z=17.5, on apparaît bien à l'intérieur (z=5)
    camera.position.set(0, 1.7, 5);
    cameraRef.current = camera;

    // ========== AVATAR 3D JOUEUR (vue 3ème personne) ==========
    // Simple personnage stylisé construit avec des primitives Three.js.
    // Couleurs tirées du profil (cheveux, tenue, chaussures, teint).
    const buildPlayerAvatar = () => {
      const av = new THREE.Group();
      const skin = new THREE.Color(profile?.skin || '#e0b48a');
      const hairColor = new THREE.Color(HAIR_CATALOG[profile?.hair ?? 0]?.color || '#3a2817');
      const shirtColor = new THREE.Color(OUTFIT_CATALOG[profile?.outfit ?? 0]?.color || '#1a1a1a');
      const pantColor = shirtColor.clone().multiplyScalar(0.75);
      const shoeColor = new THREE.Color(SHOES_CATALOG[profile?.shoes ?? 0]?.color || '#0a0a0a');

      // Torso
      const torsoMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.6 });
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.28), torsoMat);
      torso.position.y = 1.1;
      av.add(torso);

      // Head
      const headMat = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.75 });
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), headMat);
      head.position.y = 1.58;
      av.add(head);

      // Hair cap
      const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.9 });
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
      hair.position.y = 1.63;
      av.add(hair);

      // Arms
      const armMat = torsoMat.clone();
      const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.55, 8), armMat);
      leftArm.position.set(-0.32, 1.1, 0);
      av.add(leftArm);
      const rightArm = leftArm.clone();
      rightArm.position.x = 0.32;
      av.add(rightArm);

      // Hands
      const handMat = headMat.clone();
      const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), handMat);
      leftHand.position.set(-0.32, 0.8, 0);
      av.add(leftHand);
      const rightHand = leftHand.clone();
      rightHand.position.x = 0.32;
      av.add(rightHand);

      // Legs
      const legMat = new THREE.MeshStandardMaterial({ color: pantColor, roughness: 0.8 });
      const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 8), legMat);
      leftLeg.position.set(-0.12, 0.38, 0);
      av.add(leftLeg);
      const rightLeg = leftLeg.clone();
      rightLeg.position.x = 0.12;
      av.add(rightLeg);

      // Shoes
      const shoeMat = new THREE.MeshStandardMaterial({ color: shoeColor, roughness: 0.5 });
      const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.26), shoeMat);
      leftShoe.position.set(-0.12, 0.02, 0.03);
      av.add(leftShoe);
      const rightShoe = leftShoe.clone();
      rightShoe.position.x = 0.12;
      av.add(rightShoe);

      // Store refs for walk animation
      av.userData = { leftArm, rightArm, leftLeg, rightLeg, leftShoe, rightShoe };
      av.visible = false; // shown only in 3rd person
      return av;
    };
    const playerAvatar = buildPlayerAvatar();
    scene.add(playerAvatar);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = false;
    mount.appendChild(renderer.domElement);

    // ========== SOL MARBRE UNIFORME ==========
    // Texture marbre dessinée en canvas (uniforme partout)
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512; floorCanvas.height = 512;
    const floorCtx = floorCanvas.getContext('2d');
    // Fond crème/beige marbré
    const floorGrad = floorCtx.createRadialGradient(256, 256, 0, 256, 256, 400);
    floorGrad.addColorStop(0, '#f0e8d0');
    floorGrad.addColorStop(0.5, '#d8c898');
    floorGrad.addColorStop(1, '#b8a878');
    floorCtx.fillStyle = floorGrad;
    floorCtx.fillRect(0, 0, 512, 512);
    // Veines du marbre
    for (let i = 0; i < 30; i++) {
      floorCtx.strokeStyle = `rgba(${100 + Math.random() * 60}, ${80 + Math.random() * 40}, ${60 + Math.random() * 40}, 0.3)`;
      floorCtx.lineWidth = 0.5 + Math.random() * 1.5;
      floorCtx.beginPath();
      floorCtx.moveTo(Math.random() * 512, Math.random() * 512);
      for (let j = 0; j < 5; j++) {
        floorCtx.quadraticCurveTo(
          Math.random() * 512, Math.random() * 512,
          Math.random() * 512, Math.random() * 512
        );
      }
      floorCtx.stroke();
    }
    const floorTex = new THREE.CanvasTexture(floorCanvas);
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(8, 8);
    
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ 
        map: floorTex,
        roughness: 0.3, 
        metalness: 0.2,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // ========== TAPIS AUX COULEURS DU PAYS ==========
    // Canvas avec les bandes du drapeau
    const carpetCanvas = document.createElement('canvas');
    carpetCanvas.width = 512; carpetCanvas.height = 256;
    const carpetCtx = carpetCanvas.getContext('2d');
    // Fond sombre pour bords
    carpetCtx.fillStyle = '#1a0a05';
    carpetCtx.fillRect(0, 0, 512, 256);
    // Bandes des couleurs du drapeau (au centre)
    const stripeHeight = 256 - 60; // marges haut/bas
    const stripeY = 30;
    const stripeCount = casino.flag.length;
    const stripeWidth = (512 - 40) / stripeCount;
    casino.flag.forEach((col, i) => {
      carpetCtx.fillStyle = col;
      carpetCtx.fillRect(20 + i * stripeWidth, stripeY, stripeWidth, stripeHeight);
    });
    // Bordure dorée
    carpetCtx.strokeStyle = '#ffd700';
    carpetCtx.lineWidth = 8;
    carpetCtx.strokeRect(20, stripeY, 512 - 40, stripeHeight);
    // Motif central (étoile ou emblème)
    carpetCtx.fillStyle = 'rgba(255,215,0,0.3)';
    carpetCtx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 - 0.5) * Math.PI / 2.5;
      const r = i % 2 === 0 ? 40 : 18;
      const x = 256 + r * Math.cos(angle);
      const y = 130 + r * Math.sin(angle);
      if (i === 0) carpetCtx.moveTo(x, y);
      else carpetCtx.lineTo(x, y);
    }
    carpetCtx.closePath();
    carpetCtx.fill();
    
    const carpetTex = new THREE.CanvasTexture(carpetCanvas);
    const carpet = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 30),
      new THREE.MeshStandardMaterial({ 
        map: carpetTex,
        roughness: 0.95,
      })
    );
    carpet.rotation.x = -Math.PI / 2;
    carpet.rotation.z = Math.PI / 2;
    carpet.position.y = 0.01;
    carpet.receiveShadow = true;
    scene.add(carpet);

    // ========== PLAFOND avec motifs ==========
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ color: colors.ceiling, roughness: 1 })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 6;
    scene.add(ceiling);

    // Moulures dorées au plafond
    for (let i = 0; i < 6; i++) {
      const mold = new THREE.Mesh(
        new THREE.BoxGeometry(56, 0.15, 0.4),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.3 })
      );
      mold.position.set(0, 5.9, -25 + i * 10);
      scene.add(mold);
    }

    // ========== MURS ==========
    const wallMat = new THREE.MeshStandardMaterial({ color: colors.wall, roughness: 0.8 });
    const wallHi = new THREE.MeshStandardMaterial({ color: primaryHex, roughness: 0.7, metalness: 0.3 });
    
    // Mur arrière (30)
    const wallBack = new THREE.Mesh(new THREE.PlaneGeometry(40, 6), wallMat);
    wallBack.position.set(0, 3, -20);
    wallBack.receiveShadow = true;
    scene.add(wallBack);
    // Bande décorative
    const wallBackBand = new THREE.Mesh(new THREE.PlaneGeometry(40, 0.5), wallHi);
    wallBackBand.position.set(0, 4, -19.95);
    scene.add(wallBackBand);
    
    // Mur avant (30) avec porte ouverte
    const wallFrontL = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), wallMat);
    wallFrontL.position.set(-12, 3, 20);
    wallFrontL.rotation.y = Math.PI;
    scene.add(wallFrontL);
    const wallFrontR = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), wallMat);
    wallFrontR.position.set(12, 3, 20);
    wallFrontR.rotation.y = Math.PI;
    scene.add(wallFrontR);
    const wallFrontTop = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.5), wallMat);
    wallFrontTop.position.set(0, 5.25, 20);
    wallFrontTop.rotation.y = Math.PI;
    scene.add(wallFrontTop);
    
    // Murs latéraux
    const wallL = new THREE.Mesh(new THREE.PlaneGeometry(40, 6), wallMat);
    wallL.position.set(-20, 3, 0);
    wallL.rotation.y = Math.PI / 2;
    scene.add(wallL);
    const wallR = new THREE.Mesh(new THREE.PlaneGeometry(40, 6), wallMat);
    wallR.position.set(20, 3, 0);
    wallR.rotation.y = -Math.PI / 2;
    scene.add(wallR);

    // ========== LUMIÈRES ==========
    scene.add(new THREE.AmbientLight(0xfff4dc, 1.0));
    const hemi = new THREE.HemisphereLight(0xfff4dc, 0xffd700, 0.6);
    scene.add(hemi);
    
    // LUSTRES grandiose (6 pièces)
    const chandelierPositions = [[0, 0], [0, -8]];
    chandelierPositions.forEach(([x, z]) => {
      const group = new THREE.Group();
      
      // Chaîne
      const chain = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 1, 8),
        new THREE.MeshStandardMaterial({ color: 0x8b6914, metalness: 0.7 })
      );
      chain.position.set(0, 5.5, 0);
      group.add(chain);
      
      // Support doré
      const support = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.25, 0.3, 8),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.2 })
      );
      support.position.set(0, 5.1, 0);
      group.add(support);
      
      // Structure anneaux
      const ring1 = new THREE.Mesh(
        new THREE.TorusGeometry(0.7, 0.05, 8, 24),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.2 })
      );
      ring1.position.set(0, 4.8, 0);
      group.add(ring1);
      
      const ring2 = new THREE.Mesh(
        new THREE.TorusGeometry(0.5, 0.05, 8, 24),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 })
      );
      ring2.position.set(0, 4.6, 0);
      group.add(ring2);
      
      // Ampoules autour
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 8, 8),
          new THREE.MeshBasicMaterial({ color: colors.light })
        );
        bulb.position.set(Math.cos(angle) * 0.7, 4.8, Math.sin(angle) * 0.7);
        group.add(bulb);
        // Halo
        const halo = new THREE.Mesh(
          new THREE.SphereGeometry(0.25, 8, 8),
          new THREE.MeshBasicMaterial({ color: colors.light, transparent: true, opacity: 0.3 })
        );
        halo.position.copy(bulb.position);
        group.add(halo);
      }
      
      // Lumière réelle
      const light = new THREE.PointLight(0xffe080, 2.2, 22);
      light.position.set(0, 4.8, 0);
      // ombre désactivée pour perf
      group.add(light);
      
      // Pendeloques de cristal
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const crystal = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.08, 0),
          new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, metalness: 0.9, roughness: 0.1 })
        );
        crystal.position.set(Math.cos(angle) * 0.45, 4.4, Math.sin(angle) * 0.45);
        group.add(crystal);
      }
      
      group.position.set(x, 0, z);
      scene.add(group);
    });
    
    // Spots au-dessus des tables (en plus des lustres)
    const createSpot = (x, z, col) => {
      const spot = new THREE.SpotLight(col, 3.5, 18, Math.PI / 5, 0.3, 1);
      spot.position.set(x, 5.5, z);
      spot.target.position.set(x, 0, z);
      scene.add(spot);
      scene.add(spot.target);
    };
    createSpot(0, 5, colors.light);
    createSpot(0, -5, colors.light);
    createSpot(0, -15, colors.light);
    createSpot(-20, 0, 0xffd700);
    createSpot(20, 0, 0xffd700);
    createSpot(-20, -20, colors.light);
    createSpot(20, -20, colors.light);
    // Spot supplémentaire concentré sur la roulette pour la mettre en valeur
    const rouletteSpot = new THREE.SpotLight(0xffffff, 5, 10, Math.PI / 4, 0.2, 1);
    rouletteSpot.position.set(0, 5, -8);
    rouletteSpot.target.position.set(0, 1, -8);
    scene.add(rouletteSpot);
    scene.add(rouletteSpot.target);

    // LEDs murales
    for (let i = 0; i < 12; i++) {
      const led1 = new THREE.PointLight(primaryHex, 0.7, 6);
      led1.position.set(-29, 4, -25 + i * 5);
      scene.add(led1);
      const led2 = new THREE.PointLight(primaryHex, 0.7, 6);
      led2.position.set(29, 4, -25 + i * 5);
      scene.add(led2);
    }

    // ========== ENSEIGNE D'ENTRÉE ==========
    const entranceCanvas = document.createElement('canvas');
    entranceCanvas.width = 1024;
    entranceCanvas.height = 256;
    const ectx = entranceCanvas.getContext('2d');
    // Fond néon
    const grad = ectx.createLinearGradient(0, 0, 1024, 256);
    grad.addColorStop(0, casino.primary);
    grad.addColorStop(0.5, '#000');
    grad.addColorStop(1, casino.secondary);
    ectx.fillStyle = grad;
    ectx.fillRect(0, 0, 1024, 256);
    ectx.fillStyle = '#000';
    ectx.fillRect(10, 10, 1004, 236);
    ectx.strokeStyle = casino.secondary;
    ectx.lineWidth = 6;
    ectx.strokeRect(15, 15, 994, 226);
    ectx.fillStyle = casino.secondary;
    ectx.shadowColor = casino.secondary;
    ectx.shadowBlur = 20;
    ectx.font = 'bold 90px Georgia, serif';
    ectx.textAlign = 'center';
    ectx.fillText(casino.name.toUpperCase(), 512, 110);
    ectx.fillStyle = '#fff';
    ectx.shadowBlur = 10;
    ectx.font = 'italic 40px Georgia, serif';
    ectx.fillText(casino.tagline, 512, 180);
    const etex = new THREE.CanvasTexture(entranceCanvas);
    const entranceSign = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 3),
      new THREE.MeshBasicMaterial({ map: etex, transparent: true })
    );
    entranceSign.position.set(0, 4.8, 19.9);
    entranceSign.rotation.y = Math.PI;
    scene.add(entranceSign);
    // Bordure lumineuse autour
    for (let i = 0; i < 10; i++) {
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xffd700 })
      );
      const angle = i / 20;
      if (i < 10) bulb.position.set(-6 + angle * 12, 3.3, 19.85);
      else bulb.position.set(-6 + (angle - 0.5) * 12, 6.3, 19.85);
      scene.add(bulb);
    }
    
    // Tableaux décoratifs sur les murs
    const createPainting = (x, y, z, rotY, color) => {
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(2, 1.5, 0.1),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8 })
      );
      frame.position.set(x, y, z);
      frame.rotation.y = rotY;
      scene.add(frame);
      const inner = new THREE.Mesh(
        new THREE.PlaneGeometry(1.7, 1.2),
        new THREE.MeshStandardMaterial({ color })
      );
      inner.position.set(x + Math.cos(rotY + Math.PI/2) * 0.06, y, z + Math.sin(rotY + Math.PI/2) * 0.06);
      inner.rotation.y = rotY;
      scene.add(inner);
    };
    createPainting(-19.8, 3, -8, Math.PI / 2, 0x4a2a10);
    createPainting(-19.8, 3, 8, Math.PI / 2, 0x1a4a1a);
    createPainting(19.8, 3, -8, -Math.PI / 2, 0x1a1a4a);
    createPainting(19.8, 3, 8, -Math.PI / 2, 0x4a1a1a);

    // ========== TVs AVEC MATCHS LIVE ==========
    const tvTextures = [];
    const createTV = (x, y, z, rotY, sport) => {
      const tvGroup = new THREE.Group();
      
      // Cadre
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 1.9, 0.15),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.3 })
      );
      tvGroup.add(frame);
      
      // Écran (canvas)
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 180;
      const ctx = canvas.getContext('2d');
      const tex = new THREE.CanvasTexture(canvas);
      tvTextures.push({ canvas, ctx, texture: tex, sport, frame: 0, homeScore: 0, awayScore: 0 });
      
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(2.9, 1.63),
        new THREE.MeshBasicMaterial({ map: tex })
      );
      screen.position.z = 0.08;
      tvGroup.add(screen);
      
      // Support mural
      const bracket = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.2, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 })
      );
      bracket.position.z = -0.15;
      tvGroup.add(bracket);
      
      tvGroup.position.set(x, y, z);
      tvGroup.rotation.y = rotY;
      scene.add(tvGroup);
    };
    
    // 4 TVs autour du casino
    createTV(-19.8, 4.2, -3, Math.PI / 2, 'football');
    createTV(-19.8, 4.2, 3, Math.PI / 2, 'basket');
    createTV(19.8, 4.2, -3, -Math.PI / 2, 'tennis');
    createTV(19.8, 4.2, 3, -Math.PI / 2, 'football2');
    
    // Fonction qui dessine le frame de chaque TV
    const drawTVFrame = (tvData, time) => {
      const { canvas, ctx, texture, sport } = tvData;
      const w = canvas.width, h = canvas.height;
      
      if (sport === 'football' || sport === 'football2') {
        // Terrain de foot vue latérale
        ctx.fillStyle = '#1a5a1a';
        ctx.fillRect(0, 0, w, h);
        // Bandes alternées
        for (let i = 0; i < 6; i++) {
          if (i % 2 === 0) {
            ctx.fillStyle = '#1a6a1a';
            ctx.fillRect(i * (w/6), 0, w/6, h);
          }
        }
        // Lignes
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 40, w - 40, h - 80);
        ctx.beginPath();
        ctx.moveTo(w/2, 40); ctx.lineTo(w/2, h - 40);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(w/2, h/2, 40, 0, Math.PI * 2);
        ctx.stroke();
        
        // Ballon qui se déplace
        const ballX = w/2 + Math.sin(time * 0.002) * (w/3);
        const ballY = h/2 + Math.cos(time * 0.003) * 40;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ballX, ballY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(ballX - 2, ballY - 1, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Joueurs (petits rectangles)
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2 + time * 0.0005;
          const px = w/2 + Math.cos(angle) * 80 + Math.sin(time * 0.003 + i) * 20;
          const py = h/2 + Math.sin(angle) * 50;
          ctx.fillStyle = i < 3 ? '#ff0040' : '#0040ff';
          ctx.fillRect(px - 4, py - 10, 8, 20);
          // Tête
          ctx.fillStyle = '#f4c088';
          ctx.beginPath();
          ctx.arc(px, py - 13, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Bandeau score
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, w, 30);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(sport === 'football' ? 'PSG 2 - 1 OM' : 'REAL 0 - 0 BARCA', 10, 22);
        ctx.fillStyle = '#ff4444';
        ctx.fillText('● LIVE', w - 90, 22);
        
      } else if (sport === 'basket') {
        // Terrain de basket
        ctx.fillStyle = '#c8925a';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 40, w - 40, h - 80);
        ctx.beginPath();
        ctx.arc(w/2, h/2, 35, 0, Math.PI * 2);
        ctx.stroke();
        // Paniers
        ctx.fillStyle = '#222';
        ctx.fillRect(20, h/2 - 25, 8, 50);
        ctx.fillRect(w - 28, h/2 - 25, 8, 50);
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(15, h/2 - 10, 5, 20);
        ctx.fillRect(w - 20, h/2 - 10, 5, 20);
        
        // Ballon
        const bx = w/2 + Math.sin(time * 0.003) * (w/3);
        const by = h/2 + Math.abs(Math.cos(time * 0.004)) * 30;
        ctx.fillStyle = '#e85020';
        ctx.beginPath();
        ctx.arc(bx, by, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx - 7, by); ctx.lineTo(bx + 7, by);
        ctx.moveTo(bx, by - 7); ctx.lineTo(bx, by + 7);
        ctx.stroke();
        
        // Joueurs
        for (let i = 0; i < 10; i++) {
          const angle = (i / 10) * Math.PI * 2 + time * 0.0008;
          const px = w/2 + Math.cos(angle) * 100 + Math.sin(time * 0.002 + i) * 15;
          const py = h/2 + Math.sin(angle) * 60;
          ctx.fillStyle = i < 5 ? '#ffcc00' : '#006600';
          ctx.fillRect(px - 4, py - 11, 8, 22);
          ctx.fillStyle = '#f4c088';
          ctx.beginPath();
          ctx.arc(px, py - 14, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Score
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, w, 30);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Arial';
        ctx.fillText('LAKERS 89 - 84 CELTICS', 10, 22);
        ctx.fillStyle = '#ff4444';
        ctx.fillText('● LIVE Q3', w - 110, 22);
        
      } else if (sport === 'tennis') {
        // Court de tennis
        ctx.fillStyle = '#2a8a3e';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#4aaa5e';
        ctx.fillRect(50, 50, w - 100, h - 100);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, 50, w - 100, h - 100);
        // Filet
        ctx.beginPath();
        ctx.moveTo(w/2, 50); ctx.lineTo(w/2, h - 50);
        ctx.stroke();
        // Lignes de service
        ctx.strokeRect(50, h/2 - 40, w/2 - 50, 80);
        ctx.strokeRect(w/2, h/2 - 40, w/2 - 50, 80);
        
        // Balle
        const tx = w/2 + Math.sin(time * 0.005) * (w/3);
        const ty = h/2 + Math.cos(time * 0.006) * 60;
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(tx, ty, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // 2 joueurs
        const p1x = 150 + Math.sin(time * 0.003) * 30;
        const p2x = w - 150 + Math.cos(time * 0.004) * 30;
        ctx.fillStyle = '#fff';
        ctx.fillRect(p1x - 4, h/2 - 14, 8, 28);
        ctx.fillRect(p2x - 4, h/2 - 14, 8, 28);
        ctx.fillStyle = '#f4c088';
        ctx.beginPath();
        ctx.arc(p1x, h/2 - 18, 4, 0, Math.PI * 2);
        ctx.arc(p2x, h/2 - 18, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Score
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, w, 30);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('DJOKOVIC 6-4 4-3  NADAL', 10, 22);
        ctx.fillStyle = '#ff4444';
        ctx.fillText('● LIVE', w - 90, 22);
      }
      
      texture.needsUpdate = true;
    };

    // ========== AFFICHES / PUBLICITÉS ==========
    const createPoster = (x, y, z, rotY, type) => {
      const canvas = document.createElement('canvas');
      canvas.width = 400; canvas.height = 600;
      const ctx = canvas.getContext('2d');
      
      if (type === 'concert') {
        // Fond dégradé
        const grad = ctx.createLinearGradient(0, 0, 0, 600);
        grad.addColorStop(0, '#ff00aa');
        grad.addColorStop(0.5, '#6a0080');
        grad.addColorStop(1, '#000');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 400, 600);
        // Titre
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 56px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('CONCERT', 200, 100);
        ctx.font = 'bold 42px Georgia';
        ctx.fillStyle = '#fff';
        ctx.fillText('LIVE', 200, 160);
        // Silhouette
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(200, 320, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(160, 350, 80, 160);
        // Info
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 28px Arial';
        ctx.fillText('THIS SATURDAY', 200, 550);
        ctx.font = '20px Arial';
        ctx.fillText('CASINO ARENA', 200, 580);
      } else if (type === 'boxing') {
        ctx.fillStyle = '#1a0000';
        ctx.fillRect(0, 0, 400, 600);
        // Bordure rouge
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 8;
        ctx.strokeRect(10, 10, 380, 580);
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 60px Impact';
        ctx.textAlign = 'center';
        ctx.fillText('BOXING', 200, 100);
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 40px Impact';
        ctx.fillText('NIGHT', 200, 160);
        // VS
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 80px Impact';
        ctx.fillText('VS', 200, 340);
        // Noms
        ctx.font = 'bold 30px Arial';
        ctx.fillText('TYSON', 200, 260);
        ctx.fillText('ALI', 200, 420);
        ctx.fillStyle = '#ff0';
        ctx.font = '22px Arial';
        ctx.fillText('MAIN EVENT', 200, 520);
        ctx.font = '18px Arial';
        ctx.fillText('FRIDAY 10PM', 200, 560);
      } else if (type === 'casino') {
        ctx.fillStyle = '#0a0a20';
        ctx.fillRect(0, 0, 400, 600);
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 72px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('JACKPOT', 200, 120);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px Georgia';
        ctx.fillText('1 000 000', 200, 280);
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 24px Georgia';
        ctx.fillText('BENZOUZ', 200, 320);
        // Cartes
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = '#fff';
          ctx.fillRect(60 + i * 75, 400, 50, 70);
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.strokeRect(60 + i * 75, 400, 50, 70);
          ctx.fillStyle = i % 2 === 0 ? '#000' : '#ff0000';
          ctx.font = 'bold 24px Arial';
          ctx.fillText(['A', 'K', 'Q', 'J'][i], 85 + i * 75, 440);
        }
        ctx.fillStyle = '#ff00aa';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('TENTEZ VOTRE CHANCE', 200, 560);
      }
      
      const tex = new THREE.CanvasTexture(canvas);
      const poster = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 1.8),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true })
      );
      poster.position.set(x, y, z);
      poster.rotation.y = rotY;
      scene.add(poster);
      // Cadre
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 1.9, 0.08),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8 })
      );
      frame.position.copy(poster.position);
      frame.position.x += Math.cos(rotY + Math.PI) * 0.05;
      frame.position.z += Math.sin(rotY + Math.PI) * 0.05;
      frame.rotation.y = rotY;
      scene.add(frame);
    };
    
    createPoster(-19.7, 2.2, -13, Math.PI / 2, 'concert');
    createPoster(-19.7, 2.2, 13, Math.PI / 2, 'boxing');
    createPoster(19.7, 2.2, -13, -Math.PI / 2, 'casino');
    createPoster(19.7, 2.2, 13, -Math.PI / 2, 'concert');

    // ========== PLANTES ==========
    const createPlant = (x, z) => {
      const plantGroup = new THREE.Group();
      // Pot
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.3, 0.6, 12),
        new THREE.MeshStandardMaterial({ color: 0x5a2a10, roughness: 0.8 })
      );
      pot.position.y = 0.3;
      plantGroup.add(pot);
      // Feuilles
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const leaf = new THREE.Mesh(
          new THREE.ConeGeometry(0.15, 1.2, 4),
          new THREE.MeshStandardMaterial({ color: 0x1a5a1a, roughness: 0.9 })
        );
        leaf.position.set(Math.cos(angle) * 0.15, 1.2, Math.sin(angle) * 0.15);
        leaf.rotation.z = Math.cos(angle) * 0.3;
        leaf.rotation.x = Math.sin(angle) * 0.3;
        plantGroup.add(leaf);
      }
      // Tronc/tige central
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 0.8, 8),
        new THREE.MeshStandardMaterial({ color: 0x3a2010 })
      );
      trunk.position.y = 0.9;
      plantGroup.add(trunk);
      plantGroup.position.set(x, 0, z);
      scene.add(plantGroup);
    };
    
    createPlant(-18, -18);
    createPlant(18, -18);
    createPlant(-18, 18);
    createPlant(18, 18);
    createPlant(-5, 18);
    createPlant(5, 18);

    // ========== MIROIRS (grands panneaux réfléchissants simulés) ==========
    const createMirror = (x, y, z, rotY) => {
      const mirror = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 3),
        new THREE.MeshStandardMaterial({ 
          color: 0xe0e0e0, 
          metalness: 0.95, 
          roughness: 0.08,
          envMapIntensity: 2,
        })
      );
      mirror.position.set(x, y, z);
      mirror.rotation.y = rotY;
      scene.add(mirror);
      // Cadre doré
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 3.2, 0.1),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 })
      );
      frame.position.copy(mirror.position);
      frame.position.x += Math.cos(rotY + Math.PI) * 0.03;
      frame.position.z += Math.sin(rotY + Math.PI) * 0.03;
      frame.rotation.y = rotY;
      scene.add(frame);
    };
    
    createMirror(0, 3, -19.85, 0);

    // ========== DRAPEAU GÉANT DU PAYS ==========
    const flagCanvas = document.createElement('canvas');
    flagCanvas.width = 512; flagCanvas.height = 320;
    const fctx = flagCanvas.getContext('2d');
    const bands = casino.flag.length;
    casino.flag.forEach((col, i) => {
      fctx.fillStyle = col;
      fctx.fillRect((i / bands) * 512, 0, 512 / bands, 320);
    });
    const flagTex = new THREE.CanvasTexture(flagCanvas);
    const giantFlag = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 2.5),
      new THREE.MeshStandardMaterial({ map: flagTex, side: THREE.DoubleSide, roughness: 0.8 })
    );
    giantFlag.position.set(-8, 4.3, -19.8);
    scene.add(giantFlag);
    const giantFlag2 = giantFlag.clone();
    giantFlag2.position.set(8, 4.3, -19.8);
    scene.add(giantFlag2);

    // Stocker tvTextures pour animation dans la loop
    const tvTexturesRef = tvTextures;

    // ========== PNJ QUI SE BALADENT ==========
    const createNPC = (startX, startZ, skinHex, shirtHex, pantsHex, hairHex) => {
      const npc = new THREE.Group();
      
      // Jambes
      const pantsMat = new THREE.MeshStandardMaterial({ color: pantsHex });
      const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.8, 8), pantsMat);
      legL.position.set(-0.12, 0.4, 0);
      npc.add(legL);
      const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.8, 8), pantsMat);
      legR.position.set(0.12, 0.4, 0);
      npc.add(legR);
      // Chaussures
      const shoeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
      const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.07, 0.3), shoeMat);
      shoeL.position.set(-0.12, 0.035, 0.08);
      npc.add(shoeL);
      const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.07, 0.3), shoeMat);
      shoeR.position.set(0.12, 0.035, 0.08);
      npc.add(shoeR);
      
      // Torse
      const shirtMat = new THREE.MeshStandardMaterial({ color: shirtHex });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.55, 12), shirtMat);
      body.position.y = 1.15;
      npc.add(body);
      
      // Épaules
      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), shirtMat);
      shoulder.position.set(-0.3, 1.4, 0);
      npc.add(shoulder);
      const shoulderR = shoulder.clone();
      shoulderR.position.x = 0.3;
      npc.add(shoulderR);
      
      // Bras
      const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.65, 8), shirtMat);
      armL.position.set(-0.35, 1.05, 0);
      npc.add(armL);
      const armR = armL.clone();
      armR.position.x = 0.35;
      npc.add(armR);
      
      // Mains
      const handMat = new THREE.MeshStandardMaterial({ color: skinHex });
      const handL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), handMat);
      handL.position.set(-0.38, 0.7, 0);
      npc.add(handL);
      const handR = handL.clone();
      handR.position.x = 0.38;
      npc.add(handR);
      
      // Cou + tête
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.1, 8),
        new THREE.MeshStandardMaterial({ color: skinHex }));
      neck.position.y = 1.48;
      npc.add(neck);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16),
        new THREE.MeshStandardMaterial({ color: skinHex }));
      head.position.y = 1.73;
      head.scale.y = 1.1;
      npc.add(head);
      
      // Cheveux
      const hair = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: hairHex })
      );
      hair.position.y = 1.78;
      npc.add(hair);
      
      // Yeux simples
      const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000 });
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), eyeMat);
      eyeL.position.set(-0.08, 1.78, 0.2);
      npc.add(eyeL);
      const eyeR = eyeL.clone();
      eyeR.position.x = 0.08;
      npc.add(eyeR);
      
      npc.position.set(startX, 0, startZ);
      npc.userData = { isNpc: true, dead: false, legL, legR, armL, armR, noCollide: true };
      scene.add(npc);
      return npc;
    };
    
    // Créer 6 PNJ avec des profils variés
    const npcs = [];
    const npcColors = [
      [0xe8b896, 0x4a2a80, 0x1a1a2a, 0x2a1810], // costume violet
      [0xd4a878, 0x8b0000, 0x2a1a0a, 0x3a1810],
      [0xf0c090, 0x006633, 0x1a1a1a, 0xffd700], // blonde
      [0xc08870, 0xff4500, 0x0a0a0a, 0x1a0a0a],
      [0xe0a078, 0x1a4b8a, 0x0a1020, 0x4a2818],
      [0xf4c088, 0xffd700, 0x2a1a2a, 0x1a1010], // riche doré
    ];
    const npcPaths = [
      { x0: -10, z0: 10, x1: 10, z1: 10, speed: 0.008 },
      { x0: 10, z0: -5, x1: -10, z1: -5, speed: 0.007 },
      { x0: -15, z0: -15, x1: 15, z1: 15, speed: 0.005 },
      { x0: 5, z0: 15, x1: -5, z1: -15, speed: 0.009 },
      { x0: 15, z0: 0, x1: -15, z1: 0, speed: 0.006 },
      { x0: 0, z0: -18, x1: 0, z1: 18, speed: 0.004 },
    ];
    for (let i = 0; i < 6; i++) {
      const [skin, shirt, pants, hair] = npcColors[i];
      const path = npcPaths[i];
      const npc = createNPC(path.x0, path.z0, skin, shirt, pants, hair);
      npcs.push({ mesh: npc, path, phase: Math.random() * Math.PI * 2 });
    }
    allNpcsRef.current = npcs.map(n => n.mesh);

    // ========== FONCTION CRÉATION CROUPIER 3D DÉTAILLÉ ==========
    const createDealer3D = (profileData) => {
      const g = new THREE.Group();
      const skinHex = parseInt(profileData.skin.slice(1), 16);
      const hairHex = parseInt(profileData.hair.slice(1), 16);
      
      // Jambes (pantalon noir) - NOUVEAU, évite de rentrer dans la table
      const pantsMat = new THREE.MeshStandardMaterial({ color: 0x0a0a15, roughness: 0.8 });
      const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.85, 8), pantsMat);
      legL.position.set(-0.13, 0.42, 0);
      g.add(legL);
      const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.85, 8), pantsMat);
      legR.position.set(0.13, 0.42, 0);
      g.add(legR);
      
      // Chaussures noires
      const shoeMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.2, metalness: 0.3 });
      const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.32), shoeMat);
      shoeL.position.set(-0.13, 0.04, 0.08);
      g.add(shoeL);
      const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.32), shoeMat);
      shoeR.position.set(0.13, 0.04, 0.08);
      g.add(shoeR);
      
      // Ceinture
      const belt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.32, 0.08, 12),
        new THREE.MeshStandardMaterial({ color: 0x1a0a05, roughness: 0.5 })
      );
      belt.position.y = 0.88;
      g.add(belt);
      const beltBuckle = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.07, 0.02),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 })
      );
      beltBuckle.position.set(0, 0.88, 0.33);
      g.add(beltBuckle);
      
      // Torse (veste noire)
      const suitMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.7 });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.35, 0.6, 12), suitMat);
      body.position.y = 1.22;
      body.castShadow = true;
      g.add(body);
      
      // Chemise blanche (devant)
      const shirt = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.45, 0.05),
        new THREE.MeshStandardMaterial({ color: 0xf8f8f8, roughness: 0.5 })
      );
      shirt.position.set(0, 1.25, 0.32);
      g.add(shirt);
      
      // Revers de la veste
      const revL = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.35, 0.03),
        new THREE.MeshStandardMaterial({ color: 0x0a0a15, roughness: 0.6 })
      );
      revL.position.set(-0.11, 1.3, 0.32);
      revL.rotation.z = -0.1;
      g.add(revL);
      const revR = revL.clone();
      revR.position.x = 0.11;
      revR.rotation.z = 0.1;
      g.add(revR);
      
      // Noeud papillon
      const bowCenter = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.04, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x6a0000 })
      );
      bowCenter.position.set(0, 1.45, 0.36);
      g.add(bowCenter);
      const bowL = new THREE.Mesh(
        new THREE.ConeGeometry(0.04, 0.08, 4),
        new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.4 })
      );
      bowL.rotation.z = Math.PI / 2;
      bowL.position.set(-0.06, 1.45, 0.36);
      g.add(bowL);
      const bowR = bowL.clone();
      bowR.position.x = 0.06;
      bowR.rotation.z = -Math.PI / 2;
      g.add(bowR);
      
      // Épaulettes
      const shoulderL = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        suitMat
      );
      shoulderL.position.set(-0.33, 1.48, 0);
      g.add(shoulderL);
      const shoulderR = shoulderL.clone();
      shoulderR.position.x = 0.33;
      g.add(shoulderR);
      
      // Cou
      const neck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.12, 0.15, 10),
        new THREE.MeshStandardMaterial({ color: skinHex, roughness: 0.5 })
      );
      neck.position.y = 1.6;
      g.add(neck);
      
      // Tête
      const headMat = new THREE.MeshStandardMaterial({ color: skinHex, roughness: 0.55 });
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 20), headMat);
      head.position.y = 1.86;
      head.scale.y = 1.15; // légèrement allongé
      head.castShadow = true;
      g.add(head);
      
      // Cheveux
      if (profileData.gender === 'f') {
        const hair = new THREE.Mesh(
          new THREE.SphereGeometry(0.28, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.75),
          new THREE.MeshStandardMaterial({ color: hairHex, roughness: 0.9 })
        );
        hair.position.y = 1.88;
        g.add(hair);
        // Queue ou mèches longues
        const pony = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.09, 0.3, 8),
          new THREE.MeshStandardMaterial({ color: hairHex })
        );
        pony.position.set(0, 1.6, -0.22);
        g.add(pony);
      } else {
        const hair = new THREE.Mesh(
          new THREE.SphereGeometry(0.26, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
          new THREE.MeshStandardMaterial({ color: hairHex, roughness: 0.9 })
        );
        hair.position.y = 1.92;
        g.add(hair);
      }
      
      // Oreilles
      const earMat = new THREE.MeshStandardMaterial({ color: skinHex });
      const earL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), earMat);
      earL.position.set(-0.23, 1.86, 0);
      earL.scale.set(0.7, 1.2, 1);
      g.add(earL);
      const earR = earL.clone();
      earR.position.x = 0.23;
      g.add(earR);
      
      // Yeux
      const eyesHex = parseInt(profileData.eyes.slice(1), 16);
      const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const eyeIris = new THREE.MeshStandardMaterial({ color: eyesHex });
      
      const eyeLW = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), eyeWhite);
      eyeLW.position.set(-0.09, 1.9, 0.2);
      eyeLW.scale.set(1, 0.7, 0.5);
      g.add(eyeLW);
      const eyeRW = eyeLW.clone(); eyeRW.position.x = 0.09; g.add(eyeRW);
      
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.023, 8, 8), eyeIris);
      eyeL.position.set(-0.09, 1.9, 0.24);
      g.add(eyeL);
      const eyeR = eyeL.clone(); eyeR.position.x = 0.09; g.add(eyeR);
      
      const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
      const pupL = new THREE.Mesh(new THREE.SphereGeometry(0.01, 6, 6), pupilMat);
      pupL.position.set(-0.09, 1.9, 0.26);
      g.add(pupL);
      const pupR = pupL.clone(); pupR.position.x = 0.09; g.add(pupR);
      
      // Sourcils
      const browMat = new THREE.MeshStandardMaterial({ color: hairHex });
      const browL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.015, 0.02), browMat);
      browL.position.set(-0.09, 1.96, 0.22);
      browL.rotation.z = -0.1;
      g.add(browL);
      const browR = browL.clone();
      browR.position.x = 0.09;
      browR.rotation.z = 0.1;
      g.add(browR);
      
      // Nez
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.1, 6),
        new THREE.MeshStandardMaterial({ color: skinHex }));
      nose.rotation.x = Math.PI / 2;
      nose.position.set(0, 1.85, 0.25);
      g.add(nose);
      
      // Bouche (plus détaillée)
      const mouthMat = new THREE.MeshStandardMaterial({ color: 0x7a3828 });
      const lipUpper = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.01, 0.02), mouthMat);
      lipUpper.position.set(0, 1.76, 0.23);
      g.add(lipUpper);
      const lipLower = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.012, 0.02), 
        new THREE.MeshStandardMaterial({ color: 0x8a4030 }));
      lipLower.position.set(0, 1.745, 0.23);
      g.add(lipLower);
      
      // Barbe
      if (profileData.beard) {
        const beard = new THREE.Mesh(
          new THREE.SphereGeometry(0.22, 12, 12, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.4),
          new THREE.MeshStandardMaterial({ color: hairHex, roughness: 0.95 })
        );
        beard.position.y = 1.76;
        beard.scale.set(1.05, 0.8, 1);
        g.add(beard);
        // Moustache
        const mustache = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.02, 0.03),
          new THREE.MeshStandardMaterial({ color: hairHex })
        );
        mustache.position.set(0, 1.78, 0.23);
        g.add(mustache);
      }
      
      // Lunettes
      if (profileData.glasses) {
        const glassMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.6 });
        const lensL = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.008, 6, 12), glassMat);
        lensL.position.set(-0.09, 1.9, 0.25);
        g.add(lensL);
        const lensR = lensL.clone(); lensR.position.x = 0.09; g.add(lensR);
        const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.008, 0.008), glassMat);
        bridge.position.set(0, 1.9, 0.25);
        g.add(bridge);
        // Branches
        const armL = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.008, 0.14), glassMat);
        armL.position.set(-0.17, 1.9, 0.18);
        g.add(armL);
        const armRB = armL.clone();
        armRB.position.x = 0.17;
        g.add(armRB);
      }
      
      // Bras avec épaules, biceps, avant-bras, mains
      const armUpperL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.1, 0.4, 8), suitMat
      );
      armUpperL.position.set(-0.4, 1.3, 0.05);
      armUpperL.rotation.x = -0.15;
      armUpperL.rotation.z = 0.05;
      g.add(armUpperL);
      const armUpperR = armUpperL.clone();
      armUpperR.position.x = 0.4;
      armUpperR.rotation.z = -0.05;
      g.add(armUpperR);
      
      const armLowerL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.085, 0.09, 0.38, 8), suitMat
      );
      armLowerL.position.set(-0.43, 0.92, 0.18);
      armLowerL.rotation.x = -0.35;
      g.add(armLowerL);
      const armLowerR = armLowerL.clone();
      armLowerR.position.x = 0.43;
      g.add(armLowerR);
      
      // Manchettes blanches qui dépassent
      const cuffMat = new THREE.MeshStandardMaterial({ color: 0xf8f8f8 });
      const cuffL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 8), cuffMat);
      cuffL.position.set(-0.46, 0.74, 0.23);
      g.add(cuffL);
      const cuffR = cuffL.clone();
      cuffR.position.x = 0.46;
      g.add(cuffR);
      
      // Mains
      const handMat = new THREE.MeshStandardMaterial({ color: skinHex });
      const handL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), handMat);
      handL.position.set(-0.47, 0.68, 0.27);
      handL.scale.set(1, 0.85, 1.1);
      g.add(handL);
      const handR = handL.clone(); 
      handR.position.x = 0.47;
      g.add(handR);
      
      return g;
    };


    // ========== TABLES DE JEU ==========
    const createTable = (x, z, label, colHex, id, dealerData) => {
      const group = new THREE.Group();
      group.position.set(x, 0, z);

      // Piétement
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.8, 0.8, 16),
        new THREE.MeshStandardMaterial({ color: 0x2a1608, metalness: 0.4, roughness: 0.6 })
      );
      base.position.y = 0.4;
      base.castShadow = true;
      group.add(base);

      let topGeom;
      if (id === 'roulette') topGeom = new THREE.CylinderGeometry(2, 2, 0.15, 32);
      else {
        topGeom = new THREE.CylinderGeometry(1.8, 1.8, 0.15, 32);
        topGeom.scale(1.4, 1, 1);
      }
      const top = new THREE.Mesh(topGeom,
        new THREE.MeshStandardMaterial({ color: 0x0a4020, roughness: 0.8 }));
      top.position.y = 0.9;
      top.castShadow = true;
      top.receiveShadow = true;
      group.add(top);

      // Bordure dorée
      let borderGeom;
      if (id === 'roulette') borderGeom = new THREE.TorusGeometry(2, 0.08, 8, 32);
      else {
        borderGeom = new THREE.TorusGeometry(1.8, 0.08, 8, 32);
        borderGeom.scale(1.4, 1, 1);
      }
      const border = new THREE.Mesh(borderGeom,
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.2 }));
      border.position.y = 0.98;
      border.rotation.x = Math.PI / 2;
      group.add(border);

      // Eléments spécifiques
      let rouletteWheel = null;
      let rouletteBall = null;
      let animatedCards = null;
      if (id === 'roulette') {
        // ===== ROULETTE 3D TAILLE RÉELLE AVEC BILLE QUI ROULE =====
        // Cuvette externe en bois
        const bowl = new THREE.Mesh(
          new THREE.CylinderGeometry(1.5, 1.5, 0.25, 48),
          new THREE.MeshStandardMaterial({ color: 0x3a1a08, metalness: 0.4, roughness: 0.55 })
        );
        bowl.position.set(0, 1.05, 0);
        group.add(bowl);

        // Piste interne (couronne blanche/beige pour la bille)
        const track = new THREE.Mesh(
          new THREE.CylinderGeometry(1.3, 1.3, 0.12, 48),
          new THREE.MeshStandardMaterial({ color: 0xf0e4c8, metalness: 0.3, roughness: 0.5 })
        );
        track.position.set(0, 1.17, 0);
        group.add(track);

        // Groupe tournant (wheel disc qui tourne)
        rouletteWheel = new THREE.Group();
        rouletteWheel.userData.noCollide = true;
        rouletteWheel.position.set(0, 1.2, 0);
        group.add(rouletteWheel);

        // Disque central
        const disc = new THREE.Mesh(
          new THREE.CylinderGeometry(1.15, 1.15, 0.08, 48),
          new THREE.MeshStandardMaterial({ color: 0x2a1608, metalness: 0.7, roughness: 0.25 })
        );
        disc.position.y = 0;
        rouletteWheel.add(disc);

        // 37 poches colorées (rouge/noir/vert pour le 0)
        const REDS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
        const ORDER = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
        for (let i = 0; i < 37; i++) {
          const num = ORDER[i];
          const pocketColor = num === 0 ? 0x0a8a3a : (REDS.has(num) ? 0xb81a1a : 0x0a0a0a);
          const angle = (i / 37) * Math.PI * 2;
          // Pocket (trapèze)
          const pocket = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.05, 0.12),
            new THREE.MeshStandardMaterial({ color: pocketColor, metalness: 0.3, roughness: 0.6 })
          );
          pocket.position.set(Math.cos(angle) * 1.05, 0.06, Math.sin(angle) * 1.05);
          pocket.rotation.y = -angle;
          rouletteWheel.add(pocket);
          // Séparateur argenté
          const sep = new THREE.Mesh(
            new THREE.BoxGeometry(0.02, 0.09, 0.22),
            new THREE.MeshStandardMaterial({ color: 0xd4d4d4, metalness: 0.9, roughness: 0.2 })
          );
          const sAngle = angle + Math.PI / 37;
          sep.position.set(Math.cos(sAngle) * 1.05, 0.08, Math.sin(sAngle) * 1.05);
          sep.rotation.y = -sAngle;
          rouletteWheel.add(sep);
        }

        // Moyeu central doré
        const hub = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.45, 0.18, 24),
          new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.1 })
        );
        hub.position.y = 0.14;
        rouletteWheel.add(hub);

        // Croix centrale
        for (let i = 0; i < 4; i++) {
          const spoke = new THREE.Mesh(
            new THREE.BoxGeometry(1.0, 0.04, 0.08),
            new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 })
          );
          spoke.position.y = 0.1;
          spoke.rotation.y = (i / 4) * Math.PI * 2;
          rouletteWheel.add(spoke);
        }

        // Pointeur au-dessus (fixe)
        const pointer = new THREE.Mesh(
          new THREE.ConeGeometry(0.06, 0.18, 4),
          new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 })
        );
        pointer.position.set(0, 1.45, -1.2);
        pointer.rotation.x = Math.PI;
        group.add(pointer);

        // Bille (blanche, métallique) sur la piste externe
        rouletteBall = new THREE.Mesh(
          new THREE.SphereGeometry(0.07, 14, 14),
          new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.6, roughness: 0.2 })
        );
        rouletteBall.position.set(1.25, 1.27, 0);
        rouletteBall.userData = { angle: 0, radius: 1.25, ballSpeed: 0.035, noCollide: true };
        group.add(rouletteBall);

      } else if (id === 'blackjack' || id === 'poker' || id === 'highcard') {
        // ===== ANIMATION 3D DES CARTES DISTRIBUÉES =====
        // Cartes animées qui s'envolent du croupier vers les places des joueurs.
        animatedCards = new THREE.Group();
        animatedCards.userData.noCollide = true;
        group.add(animatedCards);
        const cardCount = id === 'poker' ? 7 : id === 'blackjack' ? 5 : 2;
        for (let i = 0; i < cardCount; i++) {
          const card = new THREE.Mesh(
            new THREE.BoxGeometry(0.22, 0.02, 0.32),
            new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 })
          );
          // Dos rouge (décoratif)
          const back = new THREE.Mesh(
            new THREE.PlaneGeometry(0.2, 0.3),
            new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.4 })
          );
          back.rotation.x = -Math.PI / 2;
          back.position.y = 0.011;
          card.add(back);
          // Position cible : étalées en éventail devant les sièges
          const angleFan = (i - (cardCount - 1) / 2) * 0.35;
          const tx = Math.sin(angleFan) * 0.9;
          const tz = 0.3 + Math.cos(angleFan) * 0.9;
          card.userData = {
            startPos: new THREE.Vector3(0, 1.05, -2.3),
            endPos: new THREE.Vector3(tx, 1.0, tz),
            delay: i * 400,
            duration: 600,
          };
          card.position.copy(card.userData.startPos);
          card.rotation.y = angleFan;
          animatedCards.add(card);
        }
        animatedCards.userData = { cycleStart: Date.now(), noCollide: true };
      }

      // ===== CHAISES AUTOUR DE LA TABLE =====
      // 3 à 4 sièges positionnés autour de la table (rayon 2.4m, exclusion côté croupier -Z)
      const chairCount = id === 'roulette' ? 4 : 3;
      const chairs = [];
      for (let i = 0; i < chairCount; i++) {
        // Répartition en demi-cercle du côté joueur (vers +Z)
        const spread = id === 'roulette' ? Math.PI * 1.2 : Math.PI * 0.85;
        const angle = -spread / 2 + (i / Math.max(1, chairCount - 1)) * spread + Math.PI / 2;
        const radius = 2.6;
        const cx = Math.cos(angle) * radius;
        const cz = Math.sin(angle) * radius;
        const chair = new THREE.Group();
        // Assise
        const seat = new THREE.Mesh(
          new THREE.BoxGeometry(0.55, 0.1, 0.5),
          new THREE.MeshStandardMaterial({ color: 0x6a1a1a, roughness: 0.55 })
        );
        seat.position.y = 0.5;
        chair.add(seat);
        // Dossier
        const back = new THREE.Mesh(
          new THREE.BoxGeometry(0.55, 0.7, 0.08),
          new THREE.MeshStandardMaterial({ color: 0x7a2020, roughness: 0.55 })
        );
        back.position.set(0, 0.85, -0.21);
        chair.add(back);
        // Pied central doré
        const leg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.12, 0.5, 8),
          new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.3 })
        );
        leg.position.y = 0.22;
        chair.add(leg);
        chair.position.set(cx, 0, cz);
        chair.rotation.y = Math.atan2(-cx, -cz); // face à la table
        chair.userData.noCollide = true; // Les chaises ne bloquent pas l'approche
        group.add(chair);
        chairs.push({
          mesh: chair,
          worldPos: new THREE.Vector3(x + cx, 0, z + cz),
          faceAngle: chair.rotation.y,
        });
      }

      // Jetons décoratifs
      for (let i = 0; i < 5; i++) {
        const chipColors = [0xff0000, 0x0000ff, 0x00ff00, 0x000000, 0xffd700];
        const chip = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.1, 0.04, 16),
          new THREE.MeshStandardMaterial({ color: chipColors[i % 5] })
        );
        chip.position.set(Math.cos(i) * 1.3, 1.0 + (i * 0.04), Math.sin(i) * 1.3);
        group.add(chip);
      }

      // Croupier 3D détaillé
      const dealer = createDealer3D(dealerData);
      dealer.position.set(0, 0, -2.8);
      dealer.userData = { isDealer: true, dead: false, noCollide: true };
      group.add(dealer);

      // Panneau lumineux
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.8, 0.05),
        new THREE.MeshBasicMaterial({ color: colHex })
      );
      sign.position.set(0, 3.8, -2.5);
      group.add(sign);

      const canvas = document.createElement('canvas');
      canvas.width = 512; canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 512, 128);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 60px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 256, 64);
      const tex = new THREE.CanvasTexture(canvas);
      const text = new THREE.Mesh(
        new THREE.PlaneGeometry(3, 0.7),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true })
      );
      text.position.set(0, 3.8, -2.47);
      group.add(text);

      const zone = new THREE.Mesh(
        new THREE.SphereGeometry(3, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      zone.userData = { zoneId: id };
      group.add(zone);

      scene.add(group);
      return { wheel: rouletteWheel, ball: rouletteBall, cards: animatedCards, zone, dealer, chairs, tableX: x, tableZ: z, id };
    };

    // Tables avec croupiers uniques
    const bjDealer = DEALER_PROFILES[Math.floor(Math.random() * DEALER_PROFILES.length)];
    const rlDealer = DEALER_PROFILES[Math.floor(Math.random() * DEALER_PROFILES.length)];
    const hcDealer = DEALER_PROFILES[Math.floor(Math.random() * DEALER_PROFILES.length)];
    
    const bj = createTable(-6, -2, 'BLACKJACK', secondaryHex, 'blackjack', bjDealer);
    const rl = createTable(0, -8, 'ROULETTE', 0xff0040, 'roulette', rlDealer);
    const hc = createTable(6, -2, 'CARTE HAUTE', 0x00d4ff, 'highcard', hcDealer);
    const pkDealer = DEALER_PROFILES[Math.floor(Math.random() * DEALER_PROFILES.length)];
    const pk = createTable(0, 4, 'POKER', 0x00aa66, 'poker', pkDealer);

    // Regrouper infos tables pour la logique de mouvement (s'asseoir)
    const allTables = [bj, rl, hc, pk];

    // Liste de tous les croupiers pour le tir visé
    allDealersRef.current = [bj.dealer, rl.dealer, hc.dealer, pk.dealer].filter(Boolean);

    // ========== BAR ==========
    const createBar = () => {
      const group = new THREE.Group();
      group.position.set(-13, 0, 5);
      group.rotation.y = Math.PI / 2; // face vers l'intérieur

      // ========== COMPTOIR EN L ==========
      // Comptoir principal (5m de long)
      const counter = new THREE.Mesh(
        new THREE.BoxGeometry(5, 1.1, 0.9),
        new THREE.MeshStandardMaterial({ color: 0x3a2010, roughness: 0.4, metalness: 0.2 })
      );
      counter.position.set(0, 0.55, 0.8);
      group.add(counter);

      // Dessus du comptoir en marbre
      const counterTop = new THREE.Mesh(
        new THREE.BoxGeometry(5.1, 0.1, 1),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.1, metalness: 0.4 })
      );
      counterTop.position.set(0, 1.15, 0.8);
      group.add(counterTop);

      // Bordure dorée sur le bord du comptoir
      const counterEdge = new THREE.Mesh(
        new THREE.BoxGeometry(5.1, 0.03, 0.03),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.1 })
      );
      counterEdge.position.set(0, 1.21, 1.29);
      group.add(counterEdge);

      // Face avant du comptoir avec panneaux
      for (let i = 0; i < 5; i++) {
        const panel = new THREE.Mesh(
          new THREE.BoxGeometry(0.85, 0.9, 0.04),
          new THREE.MeshStandardMaterial({ color: 0x2a1608, roughness: 0.5 })
        );
        panel.position.set(-2 + i, 0.55, 1.27);
        group.add(panel);
        // Petit filet doré
        const filet = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 0.02, 0.03),
          new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 })
        );
        filet.position.set(-2 + i, 0.55, 1.29);
        group.add(filet);
      }

      // ========== TABOURETS DE BAR (3) ==========
      for (let i = -1; i <= 1; i++) {
        const stool = new THREE.Group();
        // Siège rouge
        const seat = new THREE.Mesh(
          new THREE.CylinderGeometry(0.25, 0.25, 0.08, 16),
          new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.7 })
        );
        seat.position.y = 0.85;
        stool.add(seat);
        // Pied chromé
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.05, 0.8, 8),
          new THREE.MeshStandardMaterial({ color: 0x888, metalness: 0.9, roughness: 0.2 })
        );
        pole.position.y = 0.4;
        stool.add(pole);
        // Base
        const base = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 0.35, 0.05, 16),
          new THREE.MeshStandardMaterial({ color: 0x333, metalness: 0.7 })
        );
        base.position.y = 0.025;
        stool.add(base);
        stool.position.set(i * 1.5, 0, 1.7);
        group.add(stool);
      }

      // ========== MUR DU FOND + ÉTAGÈRES ==========
      const backWall = new THREE.Mesh(
        new THREE.PlaneGeometry(5.5, 3),
        new THREE.MeshStandardMaterial({ color: 0x1a0a05, roughness: 0.8 })
      );
      backWall.position.set(0, 2, -0.4);
      group.add(backWall);

      // Grande étagère centrale en bois
      const shelfMain = new THREE.Mesh(
        new THREE.BoxGeometry(5, 2.2, 0.35),
        new THREE.MeshStandardMaterial({ color: 0x2a1608, roughness: 0.5 })
      );
      shelfMain.position.set(0, 2.3, -0.25);
      group.add(shelfMain);

      // 3 étagères horizontales pour les bouteilles
      for (let s = 0; s < 3; s++) {
        const shelf = new THREE.Mesh(
          new THREE.BoxGeometry(4.8, 0.05, 0.4),
          new THREE.MeshStandardMaterial({ color: 0x4a2a10, roughness: 0.3, metalness: 0.2 })
        );
        shelf.position.set(0, 1.6 + s * 0.7, -0.1);
        group.add(shelf);
      }

      // Bouteilles sur chaque étagère (différentes couleurs)
      const bottleColors = [
        0x8b4513, // whisky ambre
        0xd4af37, // or
        0x2a4a1a, // vert foncé
        0x7a0a0a, // vin rouge
        0x1a4b8a, // bleu
        0xf0a040, // rhum
        0xe8e8e8, // gin clair
        0x3a0a3a, // liqueur violette
      ];
      for (let s = 0; s < 3; s++) {
        for (let b = 0; b < 10; b++) {
          const color = bottleColors[b % bottleColors.length];
          // Corps de la bouteille
          const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.07, 0.08, 0.35, 10),
            new THREE.MeshStandardMaterial({ 
              color, 
              transparent: true, 
              opacity: 0.7,
              roughness: 0.05,
              metalness: 0.3,
            })
          );
          body.position.set(-2.3 + b * 0.5, 1.85 + s * 0.7, -0.1);
          group.add(body);
          // Goulot
          const neck = new THREE.Mesh(
            new THREE.CylinderGeometry(0.025, 0.035, 0.12, 8),
            new THREE.MeshStandardMaterial({ color })
          );
          neck.position.set(-2.3 + b * 0.5, 2.08 + s * 0.7, -0.1);
          group.add(neck);
          // Bouchon
          const cap = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 0.04, 8),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
          );
          cap.position.set(-2.3 + b * 0.5, 2.16 + s * 0.7, -0.1);
          group.add(cap);
        }
      }

      // ========== VERRES EN RÉSERVE ==========
      for (let g = 0; g < 6; g++) {
        const glass = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.04, 0.1, 8),
          new THREE.MeshStandardMaterial({ 
            color: 0xccddff, 
            transparent: true, 
            opacity: 0.4,
            roughness: 0.05,
          })
        );
        glass.position.set(-1.2 + g * 0.15, 1.22, 0.4);
        group.add(glass);
      }

      // ========== BARMAN 3D DÉTAILLÉ ==========
      const barman = createDealer3D({ 
        skin: '#e8b896', hair: '#2a1810', eyes: '#4a2c1a', 
        beard: true, glasses: false, gender: 'm' 
      });
      // Le barman est debout derrière le comptoir
      barman.position.set(0, 0, 0);
      // Il tient un shaker ? on simule avec un petit cylindre dans la main
      const shaker = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.05, 0.25, 10),
        new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.15 })
      );
      shaker.position.set(0.55, 0.75, 0.2);
      barman.add(shaker);
      group.add(barman);

      // ========== ENSEIGNE BAR NÉON ==========
      const barCanvas = document.createElement('canvas');
      barCanvas.width = 512; barCanvas.height = 128;
      const bctx = barCanvas.getContext('2d');
      bctx.fillStyle = '#000';
      bctx.fillRect(0, 0, 512, 128);
      bctx.shadowColor = '#ffd700';
      bctx.shadowBlur = 20;
      bctx.fillStyle = '#ffd700';
      bctx.font = 'bold 70px Georgia, serif';
      bctx.textAlign = 'center';
      bctx.fillText('🍸 BAR', 256, 80);
      bctx.shadowBlur = 0;
      bctx.fillStyle = '#ff00aa';
      bctx.font = 'italic 24px Georgia';
      bctx.fillText('Cocktails • Bières • Spiritueux', 256, 115);
      const btex = new THREE.CanvasTexture(barCanvas);
      const barSign = new THREE.Mesh(
        new THREE.PlaneGeometry(3.5, 0.9),
        new THREE.MeshBasicMaterial({ map: btex, transparent: true })
      );
      barSign.position.set(0, 4.1, -0.3);
      group.add(barSign);

      // ========== LUMIÈRE SOUS COMPTOIR (effet pub) ==========
      const underLight = new THREE.PointLight(0xffaa00, 1.5, 5);
      underLight.position.set(0, 0.3, 1);
      group.add(underLight);

      // Lumière derrière le bar pour éclairer les bouteilles
      const backLight1 = new THREE.PointLight(0xff00aa, 0.8, 4);
      backLight1.position.set(-1.5, 2.5, 0.3);
      group.add(backLight1);
      const backLight2 = new THREE.PointLight(0x00ffff, 0.8, 4);
      backLight2.position.set(1.5, 2.5, 0.3);
      group.add(backLight2);

      // Zone d'interaction
      const zone = new THREE.Mesh(
        new THREE.SphereGeometry(3, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      zone.userData = { zoneId: 'bar' };
      zone.position.set(0, 1, 2.5);
      group.add(zone);

      scene.add(group);
      return { zone };
    };

    const barObj = createBar();

    // ========== TOILETTES ==========
    const createToilet = () => {
      const group = new THREE.Group();
      group.position.set(13, 0, 5);
      
      // Cabine
      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(3, 4, 2.5),
        new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.7 })
      );
      cabin.position.set(0, 2, -0.5);
      group.add(cabin);
      
      // Porte
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 2.4, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x4a2a10, roughness: 0.8 })
      );
      door.position.set(0, 1.2, 0.74);
      group.add(door);
      
      // Poignée
      const handle = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 })
      );
      handle.position.set(0.4, 1.2, 0.78);
      group.add(handle);
      
      // Panneau WC
      const wcCanvas = document.createElement('canvas');
      wcCanvas.width = 256; wcCanvas.height = 256;
      const wctx = wcCanvas.getContext('2d');
      wctx.fillStyle = '#fff';
      wctx.fillRect(0, 0, 256, 256);
      wctx.fillStyle = '#000';
      wctx.font = 'bold 150px sans-serif';
      wctx.textAlign = 'center';
      wctx.fillText('🚻', 128, 180);
      const wcTex = new THREE.CanvasTexture(wcCanvas);
      const wcSign = new THREE.Mesh(
        new THREE.PlaneGeometry(0.6, 0.6),
        new THREE.MeshBasicMaterial({ map: wcTex })
      );
      wcSign.position.set(0, 2.7, 0.78);
      group.add(wcSign);
      
      const zone = new THREE.Mesh(
        new THREE.SphereGeometry(2, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      zone.userData = { zoneId: 'toilet' };
      zone.position.set(0, 1, 1);
      group.add(zone);
      
      scene.add(group);
      return { zone };
    };
    const toiletObj = createToilet();

    // ========== ATM ==========
    const createATM = () => {
      const group = new THREE.Group();
      group.position.set(-8, 0, 12);
      
      // Corps de l'ATM
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 2.2, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x1a3a4a, metalness: 0.6, roughness: 0.4 })
      );
      body.position.y = 1.1;
      body.castShadow = true;
      group.add(body);
      
      // Écran
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.8, 0.6),
        new THREE.MeshBasicMaterial({ color: 0x00ff88 })
      );
      screen.position.set(0, 1.6, 0.41);
      group.add(screen);
      
      // Clavier
      const keypad = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.4, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
      );
      keypad.position.set(0, 1.1, 0.41);
      group.add(keypad);
      
      // Fente billets
      const slot = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.05, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x000000 })
      );
      slot.position.set(0, 0.75, 0.41);
      group.add(slot);
      
      // Logo ATM
      const atmCanvas = document.createElement('canvas');
      atmCanvas.width = 256; atmCanvas.height = 128;
      const actx = atmCanvas.getContext('2d');
      actx.fillStyle = '#000';
      actx.fillRect(0, 0, 256, 128);
      actx.fillStyle = '#00ff88';
      actx.font = 'bold 80px Arial';
      actx.textAlign = 'center';
      actx.fillText('ATM', 128, 90);
      const atex = new THREE.CanvasTexture(atmCanvas);
      const atmSign = new THREE.Mesh(
        new THREE.PlaneGeometry(0.9, 0.45),
        new THREE.MeshBasicMaterial({ map: atex })
      );
      atmSign.position.set(0, 2.05, 0.41);
      group.add(atmSign);
      
      // Lumière verte
      const atmLight = new THREE.PointLight(0x00ff88, 0.8, 3);
      atmLight.position.set(0, 2, 1);
      group.add(atmLight);
      
      const zone = new THREE.Mesh(
        new THREE.SphereGeometry(1.8, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      zone.userData = { zoneId: 'atm' };
      zone.position.set(0, 1, 1);
      group.add(zone);
      
      scene.add(group);
      return { zone };
    };
    const atmObj = createATM();

    // ========== ROUE DE LA FORTUNE 3D ==========
    const createWheel = () => {
      const group = new THREE.Group();
      group.position.set(8, 0, 12);
      
      // Support
      const stand = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 2.5, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x8b6914, metalness: 0.7 })
      );
      stand.position.y = 1.25;
      group.add(stand);
      
      // Base
      const wheelBase = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 0.1, 32),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
      );
      wheelBase.rotation.x = Math.PI / 2;
      wheelBase.position.y = 2.5;
      group.add(wheelBase);
      
      // Roue colorée
      const wheelCanvas = document.createElement('canvas');
      wheelCanvas.width = 512; wheelCanvas.height = 512;
      const wctx = wheelCanvas.getContext('2d');
      wctx.translate(256, 256);
      const segmentAngle = (Math.PI * 2) / WHEEL_PRIZES.length;
      WHEEL_PRIZES.forEach((prize, i) => {
        wctx.fillStyle = prize.color;
        wctx.beginPath();
        wctx.moveTo(0, 0);
        wctx.arc(0, 0, 240, i * segmentAngle, (i + 1) * segmentAngle);
        wctx.fill();
        wctx.strokeStyle = '#ffd700';
        wctx.lineWidth = 4;
        wctx.stroke();
        // Label
        wctx.save();
        wctx.rotate(i * segmentAngle + segmentAngle / 2);
        wctx.fillStyle = '#fff';
        wctx.font = 'bold 32px Georgia';
        wctx.textAlign = 'center';
        wctx.fillText(prize.label, 150, 10);
        wctx.restore();
      });
      const wheelTex = new THREE.CanvasTexture(wheelCanvas);
      const wheelDisc = new THREE.Mesh(
        new THREE.CircleGeometry(1.4, 32),
        new THREE.MeshBasicMaterial({ map: wheelTex, side: THREE.DoubleSide })
      );
      wheelDisc.rotation.x = Math.PI / 2;
      wheelDisc.position.y = 2.55;
      group.add(wheelDisc);
      
      // Indicateur (triangle)
      const pointer = new THREE.Mesh(
        new THREE.ConeGeometry(0.15, 0.3, 3),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 })
      );
      pointer.rotation.x = Math.PI;
      pointer.position.y = 4.1;
      group.add(pointer);
      
      // Centre doré
      const center = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 0.12, 16),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 })
      );
      center.rotation.x = Math.PI / 2;
      center.position.y = 2.6;
      group.add(center);
      
      // Ampoules autour
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.06, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xffff00 })
        );
        bulb.position.set(Math.cos(angle) * 1.55, 2.5 + Math.sin(angle) * 0.1, Math.sin(angle) * 1.55);
        bulb.position.y = 2.5;
        bulb.position.x = Math.cos(angle) * 1.55;
        bulb.position.z = Math.sin(angle) * 1.55;
        group.add(bulb);
      }
      
      // Enseigne JACKPOT
      const jpCanvas = document.createElement('canvas');
      jpCanvas.width = 512; jpCanvas.height = 128;
      const jctx = jpCanvas.getContext('2d');
      jctx.fillStyle = '#1a1a1a';
      jctx.fillRect(0, 0, 512, 128);
      jctx.fillStyle = '#ffd700';
      jctx.font = 'bold 70px Georgia';
      jctx.textAlign = 'center';
      jctx.fillText('🎡 JACKPOT', 256, 80);
      const jptex = new THREE.CanvasTexture(jpCanvas);
      const jpSign = new THREE.Mesh(
        new THREE.PlaneGeometry(2.5, 0.6),
        new THREE.MeshBasicMaterial({ map: jptex, transparent: true })
      );
      jpSign.position.y = 5;
      group.add(jpSign);
      
      // Lumière
      const wlight = new THREE.PointLight(0xffd700, 1.5, 6);
      wlight.position.set(0, 3, 1);
      group.add(wlight);
      
      const zone = new THREE.Mesh(
        new THREE.SphereGeometry(2.5, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      zone.userData = { zoneId: 'wheel' };
      zone.position.set(0, 1.5, 1.5);
      group.add(zone);
      
      scene.add(group);
      return { wheelDisc, zone };
    };
    const wheelObj = createWheel();

    // ========== BOUTIQUE D'ARMES ==========
    const createShop = () => {
      const group = new THREE.Group();
      group.position.set(-13, 0, -14);
      group.rotation.y = 0; // face vers +Z

      // ========== MUR ARRIÈRE ROUGE SOMBRE ==========
      const backWall = new THREE.Mesh(
        new THREE.PlaneGeometry(6, 4),
        new THREE.MeshStandardMaterial({ color: 0x2a0505, roughness: 0.9 })
      );
      backWall.position.set(0, 2, -0.5);
      group.add(backWall);

      // Plaque métallique stylisée
      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(5.5, 3.5, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.4 })
      );
      plate.position.set(0, 2, -0.4);
      group.add(plate);

      // Rivets dorés sur la plaque
      for (let r = 0; r < 8; r++) {
        const angle = (r / 8) * Math.PI * 2;
        const rivet = new THREE.Mesh(
          new THREE.SphereGeometry(0.05, 8, 8),
          new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.1 })
        );
        rivet.position.set(
          Math.cos(angle) * 2.5,
          2 + Math.sin(angle) * 1.5,
          -0.35
        );
        group.add(rivet);
      }

      // ========== COMPTOIR / VITRINE ==========
      const counter = new THREE.Mesh(
        new THREE.BoxGeometry(5, 1, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.5, roughness: 0.4 })
      );
      counter.position.set(0, 0.5, 1);
      group.add(counter);

      // Dessus vitré noir
      const counterGlass = new THREE.Mesh(
        new THREE.BoxGeometry(5, 0.05, 1.2),
        new THREE.MeshStandardMaterial({ 
          color: 0x0a0a20, 
          transparent: true, 
          opacity: 0.7,
          metalness: 0.6, 
          roughness: 0.05 
        })
      );
      counterGlass.position.set(0, 1.03, 1);
      group.add(counterGlass);

      // Bordure rouge agressive
      const counterEdge = new THREE.Mesh(
        new THREE.BoxGeometry(5.1, 0.05, 0.03),
        new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x8b0000, emissiveIntensity: 0.5 })
      );
      counterEdge.position.set(0, 1.07, 1.6);
      group.add(counterEdge);

      // ========== 6 ARMES EXPOSÉES SUR LE MUR ==========
      // Chaque arme est représentée par un groupe 3D simple, accroché au mur
      
      const createWeaponDisplay3D = (weaponId) => {
        const wg = new THREE.Group();
        if (weaponId === 'knife') {
          // Lame couteau
          const blade = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.06, 0.015),
            new THREE.MeshStandardMaterial({ color: 0xd0d0d0, metalness: 0.95, roughness: 0.1 })
          );
          wg.add(blade);
          const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 0.2, 8),
            new THREE.MeshStandardMaterial({ color: 0x2a1810, roughness: 0.8 })
          );
          handle.rotation.z = Math.PI / 2;
          handle.position.x = -0.35;
          wg.add(handle);
        } else if (weaponId === 'machete') {
          // Machette plus longue
          const blade = new THREE.Mesh(
            new THREE.BoxGeometry(0.85, 0.12, 0.02),
            new THREE.MeshStandardMaterial({ color: 0xc8c8c8, metalness: 0.9, roughness: 0.15 })
          );
          wg.add(blade);
          const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.06, 0.25, 8),
            new THREE.MeshStandardMaterial({ color: 0x1a0a04, roughness: 0.9 })
          );
          handle.rotation.z = Math.PI / 2;
          handle.position.x = -0.55;
          wg.add(handle);
        } else if (weaponId === 'gun') {
          // Glock stylisé
          const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.55, 0.14, 0.04),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.4 })
          );
          wg.add(body);
          const grip = new THREE.Mesh(
            new THREE.BoxGeometry(0.18, 0.25, 0.06),
            new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.6 })
          );
          grip.position.set(-0.1, -0.18, 0);
          grip.rotation.z = -0.15;
          wg.add(grip);
          const trigger = new THREE.Mesh(
            new THREE.TorusGeometry(0.04, 0.01, 6, 12),
            new THREE.MeshStandardMaterial({ color: 0x333, metalness: 0.7 })
          );
          trigger.position.set(-0.05, -0.08, 0);
          wg.add(trigger);
        } else if (weaponId === 'shotgun') {
          // Fusil long
          const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.035, 0.035, 1, 12),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8 })
          );
          barrel.rotation.z = Math.PI / 2;
          wg.add(barrel);
          const stock = new THREE.Mesh(
            new THREE.BoxGeometry(0.35, 0.15, 0.06),
            new THREE.MeshStandardMaterial({ color: 0x4a2a10, roughness: 0.5 })
          );
          stock.position.set(-0.6, -0.05, 0);
          wg.add(stock);
          const pump = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.1, 0.08),
            new THREE.MeshStandardMaterial({ color: 0x333, roughness: 0.5 })
          );
          pump.position.set(0.1, -0.08, 0);
          wg.add(pump);
        } else if (weaponId === 'bazooka') {
          // Gros tube vert
          const tube = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.15, 1.2, 12),
            new THREE.MeshStandardMaterial({ color: 0x3a4a1a, roughness: 0.7 })
          );
          tube.rotation.z = Math.PI / 2;
          wg.add(tube);
          // Viseur
          const scope = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.15, 0.06),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7 })
          );
          scope.position.set(0.1, 0.2, 0);
          wg.add(scope);
          // Poignée
          const grip = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 0.2, 8),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
          );
          grip.position.set(-0.1, -0.2, 0);
          wg.add(grip);
        } else if (weaponId === 'flamethrower') {
          // Réservoir + canon
          const tank = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.2, 0.5, 12),
            new THREE.MeshStandardMaterial({ color: 0x8a6820, metalness: 0.6, roughness: 0.4 })
          );
          tank.rotation.z = Math.PI / 2;
          tank.position.x = -0.3;
          wg.add(tank);
          const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 0.5, 10),
            new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.7 })
          );
          barrel.rotation.z = Math.PI / 2;
          barrel.position.x = 0.25;
          wg.add(barrel);
          const nozzle = new THREE.Mesh(
            new THREE.ConeGeometry(0.06, 0.12, 8),
            new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 0.6 })
          );
          nozzle.rotation.z = -Math.PI / 2;
          nozzle.position.x = 0.55;
          wg.add(nozzle);
        }
        return wg;
      };

      // Positionner les 6 armes sur le mur (2 lignes de 3)
      const armList = ['knife', 'machete', 'gun', 'shotgun', 'bazooka', 'flamethrower'];
      armList.forEach((id, i) => {
        const weapon = createWeaponDisplay3D(id);
        const col = i % 3;
        const row = Math.floor(i / 3);
        weapon.position.set(-1.8 + col * 1.8, 2.8 - row * 1.4, -0.3);
        group.add(weapon);
        
        // Petit support sous l'arme
        const support = new THREE.Mesh(
          new THREE.BoxGeometry(1.3, 0.05, 0.15),
          new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.7 })
        );
        support.position.set(-1.8 + col * 1.8, 2.55 - row * 1.4, -0.3);
        group.add(support);
        
        // Prix en dessous (texte sur plaque)
        const w = WEAPONS.find(x => x.id === id);
        const priceCanvas = document.createElement('canvas');
        priceCanvas.width = 256; priceCanvas.height = 64;
        const pctx = priceCanvas.getContext('2d');
        pctx.fillStyle = '#000';
        pctx.fillRect(0, 0, 256, 64);
        pctx.strokeStyle = '#ffd700';
        pctx.lineWidth = 3;
        pctx.strokeRect(2, 2, 252, 60);
        pctx.fillStyle = '#ffd700';
        pctx.font = 'bold 20px Georgia';
        pctx.textAlign = 'center';
        pctx.fillText(w ? w.name.split(' ')[0] : '?', 128, 26);
        pctx.font = 'bold 18px Georgia';
        pctx.fillText(w ? `${fmt(w.price)} $` : '', 128, 50);
        const priceTex = new THREE.CanvasTexture(priceCanvas);
        const priceLabel = new THREE.Mesh(
          new THREE.PlaneGeometry(1.2, 0.3),
          new THREE.MeshBasicMaterial({ map: priceTex, transparent: true })
        );
        priceLabel.position.set(-1.8 + col * 1.8, 2.4 - row * 1.4, -0.29);
        group.add(priceLabel);
      });

      // ========== ENSEIGNE ARMURERIE ==========
      const shopCanvas = document.createElement('canvas');
      shopCanvas.width = 1024; shopCanvas.height = 200;
      const sctx = shopCanvas.getContext('2d');
      // Fond noir
      sctx.fillStyle = '#000';
      sctx.fillRect(0, 0, 1024, 200);
      // Bordure rouge
      sctx.strokeStyle = '#ff0000';
      sctx.lineWidth = 8;
      sctx.strokeRect(10, 10, 1004, 180);
      // Texte
      sctx.shadowColor = '#ff0000';
      sctx.shadowBlur = 25;
      sctx.fillStyle = '#ff0000';
      sctx.font = 'bold 90px Georgia, serif';
      sctx.textAlign = 'center';
      sctx.fillText('🏎 GAMBLELIFE STORE', 512, 120);
      sctx.shadowBlur = 0;
      sctx.fillStyle = '#ffd700';
      sctx.font = 'italic 28px Georgia';
      sctx.fillText('« L\'arme qu\'il te faut »', 512, 165);
      const stex = new THREE.CanvasTexture(shopCanvas);
      const shopSign = new THREE.Mesh(
        new THREE.PlaneGeometry(5, 1),
        new THREE.MeshBasicMaterial({ map: stex, transparent: true })
      );
      shopSign.position.set(0, 4.2, -0.2);
      group.add(shopSign);

      // Lumières
      const sLight = new THREE.PointLight(0xff0000, 1.2, 8);
      sLight.position.set(0, 3, 1.5);
      group.add(sLight);
      const sLight2 = new THREE.PointLight(0xffd700, 0.8, 6);
      sLight2.position.set(0, 1.5, 2);
      group.add(sLight2);

      // Zone d'interaction
      const zone = new THREE.Mesh(
        new THREE.SphereGeometry(3, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      zone.userData = { zoneId: 'shop' };
      zone.position.set(0, 1, 2.5);
      group.add(zone);

      scene.add(group);
      return { zone };
    };

    const shopObj = createShop();

    // ========== ESPACE BENZBET MODERNE (4 totems rouge & blanc) ==========
    const createGambleBet = () => {
      const group = new THREE.Group();
      group.position.set(13, 0, -14);

      // Podium / dalle rouge laquée marquant la zone
      const podium = new THREE.Mesh(
        new THREE.BoxGeometry(9, 0.12, 5.5),
        new THREE.MeshStandardMaterial({ color: 0xe00e1a, metalness: 0.3, roughness: 0.25 })
      );
      podium.position.set(0, 0.06, 0);
      podium.receiveShadow = true;
      group.add(podium);

      // Bord blanc sur le podium (liseré)
      const podiumEdge = new THREE.Mesh(
        new THREE.BoxGeometry(9.2, 0.04, 5.7),
        new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.35 })
      );
      podiumEdge.position.set(0, 0.02, 0);
      group.add(podiumEdge);

      // Création d'un totem "haut écran LED, base rouge laquée" moderne
      const makeTotem = (x) => {
        const machine = new THREE.Group();
        machine.position.set(x, 0.12, -0.4);

        // ----- Base rouge laquée (pupitre incliné) -----
        const base = new THREE.Mesh(
          new THREE.BoxGeometry(0.95, 1.1, 0.75),
          new THREE.MeshStandardMaterial({ color: 0xcc0a18, metalness: 0.6, roughness: 0.15 })
        );
        base.position.y = 0.55;
        machine.add(base);

        // Liseré blanc horizontal
        const stripe = new THREE.Mesh(
          new THREE.BoxGeometry(0.97, 0.06, 0.77),
          new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.25 })
        );
        stripe.position.y = 0.95;
        machine.add(stripe);

        // Plateau incliné (interface de pari)
        const consoleTop = new THREE.Mesh(
          new THREE.BoxGeometry(0.88, 0.05, 0.5),
          new THREE.MeshStandardMaterial({ color: 0x0d1117, metalness: 0.7, roughness: 0.3 })
        );
        consoleTop.position.set(0, 1.12, 0.05);
        consoleTop.rotation.x = -0.35;
        machine.add(consoleTop);

        // Écran tactile incliné (glow rouge léger)
        const touch = new THREE.Mesh(
          new THREE.PlaneGeometry(0.78, 0.4),
          new THREE.MeshBasicMaterial({ color: 0xff2a38 })
        );
        touch.position.set(0, 1.15, 0.085);
        touch.rotation.x = -0.35 - Math.PI / 2 + Math.PI / 2; // aligné sur top incliné
        touch.rotation.x = -0.35;
        machine.add(touch);

        // Boutons colorés modernes sur la base
        const btnColors = [0xffffff, 0xe00e1a, 0xffd700];
        for (let b = 0; b < 3; b++) {
          const btn = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.06, 0.035, 18),
            new THREE.MeshStandardMaterial({
              color: btnColors[b], emissive: btnColors[b], emissiveIntensity: 0.6, roughness: 0.25,
            })
          );
          btn.rotation.x = Math.PI / 2;
          btn.position.set(-0.22 + b * 0.22, 0.7, 0.38);
          machine.add(btn);
        }

        // Fente tickets (imprimante)
        const slot = new THREE.Mesh(
          new THREE.BoxGeometry(0.45, 0.025, 0.04),
          new THREE.MeshStandardMaterial({ color: 0x0d1117 })
        );
        slot.position.set(0, 0.35, 0.38);
        machine.add(slot);

        // Tige montante qui tient l'écran LED
        const pole = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.6, 0.12),
          new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.8, roughness: 0.15 })
        );
        pole.position.set(0, 1.5, -0.25);
        machine.add(pole);

        // ----- Écran LED haut (grand panneau noir avec texture animée "cotes") -----
        const ledCanvas = document.createElement('canvas');
        ledCanvas.width = 512; ledCanvas.height = 256;
        const lctx = ledCanvas.getContext('2d');
        lctx.fillStyle = '#0d1117';
        lctx.fillRect(0, 0, 512, 256);
        // Bandeau GambleBet
        lctx.fillStyle = '#e00e1a';
        lctx.fillRect(0, 0, 512, 56);
        lctx.fillStyle = '#fff';
        lctx.font = 'bold 34px Georgia';
        lctx.textAlign = 'center';
        lctx.fillText('BENZBET', 256, 40);
        // Faux cotes LIVE
        lctx.fillStyle = '#ffd700';
        lctx.font = 'bold 20px monospace';
        lctx.textAlign = 'left';
        const odds = [
          ['PSG - Real', '2.10  3.40  2.85'],
          ['Celtics - Nuggets', '1.65  —   2.25'],
          ['Sinner - Alcaraz', '1.95  —   1.88'],
          ['Djokovic - Ruud', '1.45  —   2.70'],
        ];
        odds.forEach((row, i) => {
          lctx.fillStyle = i % 2 ? '#fff' : '#ff9aa2';
          lctx.fillText(row[0], 22, 100 + i * 36);
          lctx.fillStyle = '#ffd700';
          lctx.fillText(row[1], 280, 100 + i * 36);
        });
        // Pastille LIVE clignotante (statique image)
        lctx.fillStyle = '#e00e1a';
        lctx.beginPath(); lctx.arc(470, 30, 8, 0, Math.PI * 2); lctx.fill();
        lctx.fillStyle = '#fff';
        lctx.font = 'bold 12px Arial';
        lctx.fillText('LIVE', 448, 34);

        const ledTex = new THREE.CanvasTexture(ledCanvas);
        const led = new THREE.Mesh(
          new THREE.PlaneGeometry(1.4, 0.75),
          new THREE.MeshBasicMaterial({ map: ledTex })
        );
        led.position.set(0, 2.1, -0.24);
        machine.add(led);

        // Cadre blanc autour de l'écran
        const frame = new THREE.Mesh(
          new THREE.BoxGeometry(1.5, 0.82, 0.06),
          new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.5, roughness: 0.25 })
        );
        frame.position.set(0, 2.1, -0.28);
        machine.add(frame);

        // Petit logo BB rouge au pied
        const footLogo = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.08, 0.02),
          new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.35 })
        );
        footLogo.position.set(0, 0.15, 0.38);
        machine.add(footLogo);

        return machine;
      };

      // 4 totems alignés le long du podium
      const xs = [-3.3, -1.1, 1.1, 3.3];
      xs.forEach(x => group.add(makeTotem(x)));

      // Comptoir bookmaker blanc laqué + liseré rouge
      const counter = new THREE.Mesh(
        new THREE.BoxGeometry(6, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.3 })
      );
      counter.position.set(0, 0.5, 2.2);
      group.add(counter);

      const counterStripe = new THREE.Mesh(
        new THREE.BoxGeometry(6.05, 0.1, 1.02),
        new THREE.MeshStandardMaterial({ color: 0xe00e1a, emissive: 0xe00e1a, emissiveIntensity: 0.25 })
      );
      counterStripe.position.set(0, 0.95, 2.2);
      group.add(counterStripe);

      // Bookmaker 3D (conservé)
      const bookmaker = createDealer3D({ skin: '#d4a888', hair: '#4a2818', eyes: '#2a1808', beard: false, glasses: true, gender: 'm' });
      bookmaker.position.set(0, 0, 3.0);
      bookmaker.rotation.y = Math.PI;
      group.add(bookmaker);

      // Grande enseigne LED BENZBET rouge & blanche suspendue
      const neonCanvas = document.createElement('canvas');
      neonCanvas.width = 1024; neonCanvas.height = 256;
      const nctx = neonCanvas.getContext('2d');
      nctx.fillStyle = '#0d1117';
      nctx.fillRect(0, 0, 1024, 256);
      // Halo rouge
      nctx.shadowColor = '#ff2a38';
      nctx.shadowBlur = 40;
      nctx.fillStyle = '#e00e1a';
      nctx.fillRect(40, 60, 944, 140);
      nctx.shadowBlur = 0;
      // Texte blanc
      nctx.fillStyle = '#fff';
      nctx.font = 'bold 130px Georgia';
      nctx.textAlign = 'center';
      nctx.fillText('GAMBLELIFE', 360, 170);
      // BET dans un box blanc/rouge inversé
      nctx.fillStyle = '#fff';
      nctx.fillRect(540, 70, 400, 140);
      nctx.fillStyle = '#e00e1a';
      nctx.fillText('BET', 740, 170);
      // Slogan
      nctx.fillStyle = '#ffd700';
      nctx.font = 'bold 28px Georgia';
      nctx.fillText('PARIS SPORTIFS · COTES EN DIRECT', 512, 235);

      const ntex = new THREE.CanvasTexture(neonCanvas);
      const neonSign = new THREE.Mesh(
        new THREE.PlaneGeometry(7, 1.75),
        new THREE.MeshBasicMaterial({ map: ntex, transparent: true })
      );
      neonSign.position.set(0, 4.3, -0.3);
      group.add(neonSign);

      // Barres LED rouge & blanche décoratives au sol
      for (let i = 0; i < 4; i++) {
        const ledBar = new THREE.Mesh(
          new THREE.BoxGeometry(1.6, 0.04, 0.08),
          new THREE.MeshStandardMaterial({
            color: i % 2 === 0 ? 0xe00e1a : 0xffffff,
            emissive: i % 2 === 0 ? 0xe00e1a : 0xffffff,
            emissiveIntensity: 0.55,
          })
        );
        ledBar.position.set(-3.3 + i * 2.2, 0.14, 1.3);
        group.add(ledBar);
      }

      // Lumières d'ambiance rouge / blanche
      const nlight1 = new THREE.PointLight(0xe00e1a, 1.2, 8);
      nlight1.position.set(-2.5, 3.2, 1);
      group.add(nlight1);
      const nlight2 = new THREE.PointLight(0xffffff, 0.9, 8);
      nlight2.position.set(2.5, 3.2, 1);
      group.add(nlight2);
      const nlight3 = new THREE.PointLight(0xffd700, 0.5, 6);
      nlight3.position.set(0, 4, 0);
      group.add(nlight3);

      // Zone d'interaction élargie (couvre les 4 totems)
      const zone = new THREE.Mesh(
        new THREE.SphereGeometry(4.5, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      zone.userData = { zoneId: 'benzbet' };
      zone.position.set(0, 1, 0.5);
      group.add(zone);

      scene.add(group);
      return { zone };
    };
    const benzBetObj = createGambleBet();

    // Liste globale des zones d'interaction
    const interactZones = [
      bj.zone, rl.zone, hc.zone, pk.zone,
      barObj.zone, toiletObj.zone, atmObj.zone, wheelObj.zone, shopObj.zone, benzBetObj.zone,
    ];

    // ========== PORTE DE SORTIE 3D (retour à la rue) ==========
    // Positionnée près du spawn (z=14), face au joueur, encadrée or.
    const exitDoorGroup = new THREE.Group();
    exitDoorGroup.position.set(0, 0, 17.5);
    // Cadre doré (pilier gauche/droit + linteau)
    const doorFrameMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 1, roughness: 0.15, emissive: 0x2a1a00, emissiveIntensity: 0.3 });
    for (let s = -1; s <= 1; s += 2) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.4, 0.22), doorFrameMat);
      pillar.position.set(s * 1.25, 1.7, 0);
      exitDoorGroup.add(pillar);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.22, 0.22), doorFrameMat);
    lintel.position.set(0, 3.4, 0);
    exitDoorGroup.add(lintel);
    // Panneau de porte (bois + émissif léger pour signaler l'interaction)
    const doorPanel = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 3, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x6a3a1a, metalness: 0.2, roughness: 0.7, emissive: 0x3a1a00, emissiveIntensity: 0.25 })
    );
    doorPanel.position.set(0, 1.6, 0);
    exitDoorGroup.add(doorPanel);
    // Poignée dorée
    const handle = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1, roughness: 0.15 })
    );
    handle.position.set(0.7, 1.6, 0.1);
    exitDoorGroup.add(handle);
    // Enseigne lumineuse "SORTIE" au-dessus
    const exitSignCvs = document.createElement('canvas');
    exitSignCvs.width = 512; exitSignCvs.height = 128;
    const escx = exitSignCvs.getContext('2d');
    escx.fillStyle = '#0a0f1a'; escx.fillRect(0, 0, 512, 128);
    escx.shadowColor = '#3fe6ff'; escx.shadowBlur = 30;
    escx.fillStyle = '#3fe6ff'; escx.font = 'bold 72px Georgia'; escx.textAlign = 'center';
    escx.fillText('SORTIE', 256, 86);
    escx.shadowBlur = 0;
    escx.fillStyle = '#fff'; escx.font = 'italic 22px Georgia';
    escx.fillText('← retour rue', 256, 118);
    const exitSignTex = new THREE.CanvasTexture(exitSignCvs);
    const exitSignMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 0.8),
      new THREE.MeshBasicMaterial({ map: exitSignTex, transparent: true })
    );
    exitSignMesh.position.set(0, 3.95, 0.01);
    exitDoorGroup.add(exitSignMesh);
    // Flèches verte clignotantes au sol
    const exitArrow = new THREE.Mesh(
      new THREE.RingGeometry(0.5, 0.85, 24),
      new THREE.MeshBasicMaterial({ color: 0x3fe6ff, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    );
    exitArrow.rotation.x = -Math.PI / 2;
    exitArrow.position.set(0, 0.04, 0.8);
    exitDoorGroup.add(exitArrow);
    exitDoorGroup.userData.__pulseArrow = exitArrow;
    scene.add(exitDoorGroup);
    // Zone d'interaction (invisible)
    const exitZone = new THREE.Mesh(
      new THREE.BoxGeometry(3, 3, 2),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    exitZone.position.set(0, 1.5, 17.5);
    exitZone.userData = { zoneId: 'exit' };
    scene.add(exitZone);
    interactZones.push(exitZone);

    // Colonnes décoratives
    [[-10, 10], [10, 10], [-10, -10], [10, -10]].forEach(([x, z]) => {
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.5, 6, 12),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 })
      );
      col.position.set(x, 3, z);
      col.castShadow = true;
      scene.add(col);
      // Cap décoratif
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.4, 0.3, 12),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 })
      );
      cap.position.set(x, 6.1, z);
      scene.add(cap);
    });

    // Bannières du pays sur les murs
    casino.flag.forEach((col, i) => {
      const colInt = parseInt(col.slice(1), 16);
      const banner = new THREE.Mesh(
        new THREE.PlaneGeometry(1.5, 3),
        new THREE.MeshStandardMaterial({ color: colInt, side: THREE.DoubleSide })
      );
      banner.position.set(-19.9, 3, -10 + i * 3);
      banner.rotation.y = Math.PI / 2;
      scene.add(banner);
      const banner2 = banner.clone();
      banner2.position.set(19.9, 3, -10 + i * 3);
      banner2.rotation.y = -Math.PI / 2;
      scene.add(banner2);
    });

    // ========== CONTRÔLES ==========
    const direction = new THREE.Vector3();
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    const SPEED = 0.11;
    // État assis (smooth) : 1.7 debout, 1.05 assis
    let camTargetY = 1.7;
    let camY = 1.7;
    const SIT_ZONES = new Set(['blackjack', 'roulette', 'highcard', 'poker']);
    const getSpeedMul = () => {
      const v = profile && profile.equippedVehicle;
      const def = VEHICLES.find(x => x.id === v);
      return def ? def.speedMul : 1;
    };
    const ROOM_HALF = 18;
    let isPointerLocked = false;

    // ========== COLLISION DETECTION ==========
    // Collect AABB (axis-aligned bounding boxes in XZ plane) of all significant
    // obstacles in the scene so the player can't walk through tables, slot
    // machines, counters, walls, etc.
    // Called once per animate frame (cheap – precomputed list).
    const colliders = [];
    const PLAYER_RADIUS = 0.2; // rayon de collision du joueur (réduit pour pouvoir s'approcher des tables)
    const collectColliders = () => {
      colliders.length = 0;
      const tmpBox = new THREE.Box3();
      scene.traverse((obj) => {
        if (!obj.isMesh) return;
        if (!obj.geometry) return;
        // Skip les meshes invisibles (zones de proximité, déclencheurs, etc.)
        if (obj.visible === false) return;
        if (obj.material && obj.material.visible === false) return;
        // Respect les flags explicites posés côté createTable/NPC/etc.
        // Remonte aussi la hiérarchie pour chercher un ancêtre marqué noCollide
        let ancestor = obj;
        while (ancestor) {
          if (ancestor.userData && ancestor.userData.noCollide) return;
          ancestor = ancestor.parent;
        }
        obj.updateWorldMatrix(true, false);
        tmpBox.setFromObject(obj);
        const sizeY = tmpBox.max.y - tmpBox.min.y;
        const sizeX = tmpBox.max.x - tmpBox.min.x;
        const sizeZ = tmpBox.max.z - tmpBox.min.z;
        // Skip ultra-plat (sols, tapis, decals)
        if (sizeY < 0.25) return;
        // Skip ce qui est au-dessus du torse (lustres, enseignes, plafond)
        if (tmpBox.min.y > 1.6) return;
        // Skip ce qui est au ras du sol
        if (tmpBox.max.y < 0.3) return;
        // Skip murs/plafonds/sols gigantesques (ils bloqueraient partout)
        if (sizeX > 40 || sizeZ > 40) return;
        // Skip plateaux de tables : larges mais fins en hauteur (sizeY < 0.4 et très large)
        if (sizeY < 0.4 && (sizeX > 1.5 || sizeZ > 1.5)) return;
        // Skip tout petit (cartes, balles, chips, jetons)
        if (sizeX < 0.25 && sizeZ < 0.25) return;
        colliders.push({
          minX: tmpBox.min.x - PLAYER_RADIUS,
          maxX: tmpBox.max.x + PLAYER_RADIUS,
          minZ: tmpBox.min.z - PLAYER_RADIUS,
          maxZ: tmpBox.max.z + PLAYER_RADIUS,
        });
      });
    };

    const pointInAnyCollider = (x, z) => {
      for (let i = 0; i < colliders.length; i++) {
        const c = colliders[i];
        if (x >= c.minX && x <= c.maxX && z >= c.minZ && z <= c.maxZ) return true;
      }
      return false;
    };

    const onKeyDown = (e) => {
      switch (e.code) {
        case 'ArrowUp': case 'KeyW': case 'KeyZ': keysRef.current.forward = true; break;
        case 'ArrowDown': case 'KeyS': keysRef.current.backward = true; break;
        case 'ArrowLeft': case 'KeyA': case 'KeyQ': keysRef.current.left = true; break;
        case 'ArrowRight': case 'KeyD': keysRef.current.right = true; break;
        case 'KeyE': case 'Space':
          if (nearZoneRef.current && zoneCallbacksRef.current[nearZoneRef.current]) {
            zoneCallbacksRef.current[nearZoneRef.current]();
          }
          break;
        case 'Escape':
          if (document.pointerLockElement) document.exitPointerLock();
          break;
      }
    };
    const onKeyUp = (e) => {
      switch (e.code) {
        case 'ArrowUp': case 'KeyW': case 'KeyZ': keysRef.current.forward = false; break;
        case 'ArrowDown': case 'KeyS': keysRef.current.backward = false; break;
        case 'ArrowLeft': case 'KeyA': case 'KeyQ': keysRef.current.left = false; break;
        case 'ArrowRight': case 'KeyD': keysRef.current.right = false; break;
      }
    };
    const onMouseMove = (e) => {
      if (!isPointerLocked) return;
      euler.setFromQuaternion(camera.quaternion);
      euler.y -= (e.movementX || 0) * 0.002;
      euler.x -= (e.movementY || 0) * 0.002;
      euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));
      camera.quaternion.setFromEuler(euler);
    };
    const onClick = (e) => {
      // Ne pas lock si on clique sur un bouton HUD
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
      if (!isPointerLocked) renderer.domElement.requestPointerLock();
    };
    const onPointerLockChange = () => {
      isPointerLocked = document.pointerLockElement === renderer.domElement;
      if (isPointerLocked) setShowInstructions(false);
    };

    // Contrôles tactiles : glisser au doigt pour tourner la tête
    let touchLookId = null;
    let lastTouchX = 0, lastTouchY = 0;
    const onTouchStart = (e) => {
      setShowInstructions(false);
      // Ignorer si on touche un bouton
      if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.closest('.hud-control')) return;
      for (const t of e.changedTouches) {
        if (touchLookId === null) {
          touchLookId = t.identifier;
          lastTouchX = t.clientX;
          lastTouchY = t.clientY;
        }
      }
    };
    const onTouchMove = (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.closest('.hud-control')) return;
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === touchLookId) {
          const dx = t.clientX - lastTouchX;
          const dy = t.clientY - lastTouchY;
          lastTouchX = t.clientX;
          lastTouchY = t.clientY;
          euler.setFromQuaternion(camera.quaternion);
          euler.y -= dx * 0.005;
          euler.x -= dy * 0.005;
          euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));
          camera.quaternion.setFromEuler(euler);
        }
      }
    };
    const onTouchEnd = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === touchLookId) touchLookId = null;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onClick);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false });
    renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
    renderer.domElement.addEventListener('touchend', onTouchEnd);

    // LOOP
    let animFrameId;
    let wheelRot = 0;
    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const k = keysRef.current;
      direction.z = Number(k.forward) - Number(k.backward);
      direction.x = Number(k.right) - Number(k.left);
      direction.normalize();

      if (direction.z !== 0 || direction.x !== 0) {
        const cameraDir = new THREE.Vector3();
        camera.getWorldDirection(cameraDir);
        cameraDir.y = 0;
        cameraDir.normalize();
        const right = new THREE.Vector3();
        right.crossVectors(camera.up, cameraDir).normalize();
        const movement = new THREE.Vector3();
        const speedMul = getSpeedMul();
        movement.add(cameraDir.multiplyScalar(direction.z * SPEED * speedMul));
        movement.add(right.multiplyScalar(-direction.x * SPEED * speedMul));

        // ===== Collision resolution (slide along axis) =====
        // Test each axis independently so the player can slide along walls/obstacles
        // instead of being stuck. We refresh colliders once the first time we move
        // (some meshes may have been added async after the initial scene build).
        if (colliders.length === 0) collectColliders();

        const startX = camera.position.x;
        const startZ = camera.position.z;

        // Try X movement
        const newX = Math.max(-ROOM_HALF, Math.min(ROOM_HALF, startX + movement.x));
        if (!pointInAnyCollider(newX, startZ)) camera.position.x = newX;

        // Try Z movement
        const newZ = Math.max(-ROOM_HALF, Math.min(ROOM_HALF, startZ + movement.z));
        if (!pointInAnyCollider(camera.position.x, newZ)) camera.position.z = newZ;
      }

      // ===== Animation s'asseoir près des tables de jeu =====
      // Désactivée en lobby : l'animation "sit" n'est déclenchée que quand le
      // joueur ouvre réellement le mini-jeu (pas juste en passant à côté).
      camTargetY = 1.7;
      camY += (camTargetY - camY) * 0.12;
      camera.position.y = camY;

      if (rl.wheel) rl.wheel.rotation.y += 0.012;
      if (wheelObj.wheelDisc) wheelObj.wheelDisc.rotation.z += 0.003;
      wheelRot += 0.02;

      // Horodatage pour toutes les animations suivantes
      const nowTime = Date.now();

      // ===== Animation bille de roulette (rouleau sur la piste) =====
      if (rl.ball) {
        rl.ball.userData.angle += rl.ball.userData.ballSpeed;
        const ba = rl.ball.userData.angle;
        const br = rl.ball.userData.radius;
        rl.ball.position.x = Math.cos(ba) * br;
        rl.ball.position.z = Math.sin(ba) * br;
        // Petit rebond vertical pour simuler le roulis
        rl.ball.position.y = 1.27 + Math.abs(Math.sin(ba * 6)) * 0.02;
        // Rotation sur elle-même
        rl.ball.rotation.x += 0.2;
        rl.ball.rotation.z += 0.15;
        // Ralentissement progressif puis repos dans une poche (cycle 12s)
        const cyc = (nowTime % 12000) / 12000;
        if (cyc < 0.7) {
          rl.ball.userData.ballSpeed = 0.08 * (1 - cyc / 0.7) + 0.015;
        } else {
          // Repos dans une poche: vitesse très faible = suit la rotation du disque
          rl.ball.userData.ballSpeed = 0.012;
          rl.ball.userData.radius = 0.95 + Math.sin(nowTime * 0.002) * 0.03;
        }
        if (cyc > 0.98) {
          // relancer au nouveau cycle
          rl.ball.userData.ballSpeed = 0.09;
          rl.ball.userData.radius = 1.25;
        }
      }

      // ===== Animation cartes distribuées (cycle permanent) =====
      allTables.forEach((tbl) => {
        if (!tbl.cards) return;
        const CYCLE = 8000; // redeal toutes les 8s
        const local = (nowTime - tbl.cards.userData.cycleStart) % CYCLE;
        tbl.cards.children.forEach((card) => {
          const ud = card.userData;
          const t = Math.max(0, Math.min(1, (local - ud.delay) / ud.duration));
          if (local < ud.delay) {
            // Avant deal : cachée dans le sabot du croupier
            card.position.copy(ud.startPos);
            card.visible = false;
          } else if (local < CYCLE - 1000) {
            card.visible = true;
            // Animation vol de carte avec arc
            card.position.lerpVectors(ud.startPos, ud.endPos, t);
            card.position.y += Math.sin(t * Math.PI) * 0.6;
            // Petit flip pendant le vol
            if (t < 1) card.rotation.x = t * Math.PI * 2;
            else card.rotation.x = 0;
          } else {
            // Fade-out fin de cycle
            card.visible = false;
          }
        });
      });

      // Animation balles en vol
      
      // Animer les TVs (moins souvent pour perf)
      if (nowTime % 100 < 17) {
        tvTexturesRef.forEach(tv => drawTVFrame(tv, nowTime));
      }
      
      // Animer les PNJ
      npcs.forEach((npcData, i) => {
        const { mesh, path, phase } = npcData;
        // Skip si mort : laisse la position actuelle
        if (mesh.userData.dead) return;
        const t = (Math.sin(nowTime * path.speed * 0.001 + phase) + 1) / 2;
        mesh.position.x = path.x0 + (path.x1 - path.x0) * t;
        mesh.position.z = path.z0 + (path.z1 - path.z0) * t;
        // Direction de marche
        const dx = path.x1 - path.x0;
        const dz = path.z1 - path.z0;
        const dir = Math.cos(nowTime * path.speed * 0.001 + phase);
        mesh.rotation.y = Math.atan2(dir > 0 ? dx : -dx, dir > 0 ? dz : -dz);
        // Petit bop de marche
        mesh.position.y = Math.abs(Math.sin(nowTime * 0.008 + i)) * 0.05;
        // Balancement des jambes/bras pour un mouvement réaliste
        const swing = Math.sin(nowTime * 0.01 + i) * 0.45;
        if (mesh.userData.legL) mesh.userData.legL.rotation.x = swing;
        if (mesh.userData.legR) mesh.userData.legR.rotation.x = -swing;
        if (mesh.userData.armL) mesh.userData.armL.rotation.x = -swing * 0.8;
        if (mesh.userData.armR) mesh.userData.armR.rotation.x = swing * 0.8;
      });
      
      bulletsRef.current = bulletsRef.current.filter(b => {
        const elapsed = nowTime - b.startTime;
        const t = Math.min(elapsed / b.duration, 1);
        if (b.onUpdate) {
          b.onUpdate(b.mesh, t);
        } else {
          b.mesh.position.lerpVectors(b.startPos, b.endPos, t);
        }
        if (t >= 1) {
          scene.remove(b.mesh);
          // Dispose geometries + materials pour éviter une fuite GPU sur les rockets/grenades répétés
          try {
            b.mesh.traverse((child) => {
              if (child.geometry) child.geometry.dispose();
              if (child.material) {
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach(m => m && m.dispose && m.dispose());
              }
            });
          } catch (_e) { /* noop */ }
          return false;
        }
        return true;
      });

      // Animation flammes (lance-flammes)
      flamesRef.current.forEach(f => {
        const elapsed = nowTime - f.startTime;
        // Récupérer la position actuelle de la caméra (suit le joueur)
        const camPos = new THREE.Vector3();
        f.camera.getWorldPosition(camPos);
        const camDir = new THREE.Vector3();
        f.camera.getWorldDirection(camDir);
        const right = new THREE.Vector3().crossVectors(camDir, f.camera.up).normalize();
        const muzzlePos = camPos.clone()
          .add(camDir.clone().multiplyScalar(0.6))
          .add(right.clone().multiplyScalar(0.25))
          .add(new THREE.Vector3(0, -0.25, 0));
        
        f.particles.forEach(p => {
          const localElapsed = elapsed - p.startDelay;
          if (localElapsed < 0) {
            p.mesh.visible = false;
            return;
          }
          if (localElapsed > p.life || elapsed > f.duration + 500) {
            p.mesh.visible = false;
            return;
          }
          p.mesh.visible = true;
          // Position : va dans la direction de la caméra, de 0 à 3m
          const progress = localElapsed / p.life;
          const distance = progress * 3;
          const pos = muzzlePos.clone()
            .add(camDir.clone().multiplyScalar(distance))
            .add(right.clone().multiplyScalar(p.offsetX))
            .add(new THREE.Vector3(0, p.offsetY, 0));
          p.mesh.position.copy(pos);
          // Grossir puis rétrécir
          const scale = 1 + progress * 2;
          p.mesh.scale.set(scale, scale, scale);
          // Fade
          p.mesh.material.opacity = 0.9 * (1 - progress);
        });
      });

      // Animation sang (gravité)
      bloodRef.current.forEach(b => {
        const elapsed = nowTime - b.startTime;
        const dt = 0.016;
        b.drops.forEach(d => {
          if (!d.landed) {
            d.mesh.position.x += d.vx * dt;
            d.mesh.position.y += d.vy * dt;
            d.mesh.position.z += d.vz * dt;
            d.vy -= 9.8 * dt; // gravité
            if (d.mesh.position.y < -1.6) {
              d.mesh.position.y = -1.6;
              d.vx *= 0.3;
              d.vz *= 0.3;
              d.vy = 0;
              d.landed = true;
              d.mesh.scale.y = 0.2; // aplatir au sol
            }
          }
        });
      });

      // FOV dynamique pour visée 1ère personne
      const targetFov = isAimingRef.current ? 40 : 75;
      if (Math.abs(camera.fov - targetFov) > 0.5) {
        camera.fov += (targetFov - camera.fov) * 0.2;
        camera.updateProjectionMatrix();
      }

      // Proximité zones
      let closest = null;
      let closestDist = 4.2; // rayon proximité (augmenté pour que le bouton apparaisse même à distance)
      interactZones.forEach((zone) => {
        const worldPos = new THREE.Vector3();
        zone.getWorldPosition(worldPos);
        const dist = camera.position.distanceTo(worldPos);
        if (dist < closestDist) {
          closestDist = dist;
          closest = zone.userData.zoneId;
        }
      });
      if (closest !== nearZoneRef.current) {
        nearZoneRef.current = closest;
        setNearZone(closest);
      }

      // ========== Vue 3ème personne : avatar + caméra orbitale ==========
      const tps = viewModeRef.current === 'third' || arrivingRef.current;
      playerAvatar.visible = tps;
      // ========== ANIMATION D'ARRIVÉE — cinématique 4s ==========
      if (arrivingRef.current) {
        const elapsed = (performance.now() - arrivalStartRef.current) / 1000; // 0..4
        const progress = Math.min(1, elapsed / 4);
        // Caméra orbitale qui regarde le joueur arriver
        // Position du joueur (spawn) = camera.position courante
        const playerX = camera.position.x;
        const playerZ = camera.position.z;
        // Caméra : démarre haute et lointaine, descend vers le joueur
        const angle = progress * Math.PI * 0.5; // léger arc
        const dist = 6 - progress * 2.5;        // 6m -> 3.5m
        const camY = 5.5 - progress * 2.5;      // 5.5m -> 3.0m
        camera.position.set(
          playerX + Math.cos(angle) * dist,
          camY,
          playerZ + Math.sin(angle) * dist + 4
        );
        camera.lookAt(playerX, 1.4, playerZ);
        // Avatar visible et orienté
        playerAvatar.visible = true;
        playerAvatar.position.set(playerX, 0, playerZ);
        playerAvatar.rotation.y = angle - Math.PI / 2;
        // Léger bob "chargement de matière"
        playerAvatar.position.y = Math.max(0, 0.2 - progress * 0.2);
        // Render
        updateRemoteAvatars();
        renderer.render(scene, camera);
      } else if (tps) {
        // camera direction (horizontal)
        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);
        camDir.y = 0; camDir.normalize();
        // Position avatar devant la caméra (à l'emplacement que la caméra aurait en 1ère pers.)
        // Les `camera.position` continuent d'être mis à jour par les déplacements (WASD/joystick)
        // comme s'ils représentaient la tête du joueur — on garde la logique existante.
        playerAvatar.position.set(camera.position.x, 0, camera.position.z);
        // Orientation : regarde dans la même direction que la caméra
        playerAvatar.rotation.y = Math.atan2(camDir.x, camDir.z);

        // Léger balancement des bras/jambes si le joueur bouge
        const isMoving = keysRef.current.forward || keysRef.current.backward || keysRef.current.left || keysRef.current.right;
        const t = performance.now() * 0.008;
        const swing = isMoving ? Math.sin(t) * 0.3 : 0;
        if (playerAvatar.userData.leftArm)  playerAvatar.userData.leftArm.rotation.x = swing;
        if (playerAvatar.userData.rightArm) playerAvatar.userData.rightArm.rotation.x = -swing;
        if (playerAvatar.userData.leftLeg)  playerAvatar.userData.leftLeg.rotation.x = -swing;
        if (playerAvatar.userData.rightLeg) playerAvatar.userData.rightLeg.rotation.x = swing;
        // Avatar toujours au sol (plus de baisse auto près des tables)
        playerAvatar.position.y = 0;

        // Recule la caméra derrière l'avatar pour le rendu en vue TPS
        // On crée une caméra "virtuelle" en clonant temporairement la position
        const origPos = camera.position.clone();
        camera.position.x = origPos.x - camDir.x * 2.8;
        camera.position.z = origPos.z - camDir.z * 2.8;
        camera.position.y = 2.3;
        // MP : mise à jour des avatars distants avant render
        updateRemoteAvatars();
        renderer.render(scene, camera);
        // Restore pour que la logique de mouvement suivante fonctionne normalement
        camera.position.copy(origPos);
      } else {
        // MP : mise à jour des avatars distants avant render
        updateRemoteAvatars();
        renderer.render(scene, camera);
      }

      // MP : matérialiser les tirs distants en balles visibles
      if (remoteShotsRef.current.length > 0) {
        const shots = remoteShotsRef.current.splice(0);
        shots.forEach(s => {
          // Créer une balle éphémère
          const from = s.from.clone();
          const to = s.to.clone();
          const geom = new THREE.SphereGeometry(0.08, 6, 6);
          const mat = new THREE.MeshBasicMaterial({ color: 0xffee55 });
          const b = new THREE.Mesh(geom, mat);
          b.position.copy(from);
          scene.add(b);
          const startTime = Date.now();
          const duration = 300;
          bulletsRef.current.push({
            mesh: b, startTime, duration,
            startPos: from, endPos: to, weaponType: s.weapon,
          });
        });
      }

      // MP : envoyer notre position (throttle 100ms)
      if (mpRef.current && nowTime - lastPosSentRef.current > 100) {
        lastPosSentRef.current = nowTime;
        mpRef.current.sendPos(
          camera.position.x,
          camera.position.y,
          camera.position.z,
          camera.rotation.y,
          selectedWeaponRef.current,
          { skin: profile?.skin, outfit: profile?.outfit, hair: profile?.hair }
        );
      }
    };
    animate();

    const onResize = () => {
      width = mount.clientWidth;
      height = mount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      window.removeEventListener('resize', onResize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const zoneLabels = {
    blackjack: { icon: '🃏', name: 'BLACKJACK' },
    roulette: { icon: '🎡', name: 'ROULETTE' },
    highcard: { icon: '🎴', name: 'CARTE HAUTE' },
    poker: { icon: '♠', name: 'POKER HOLDEM' },
    bar: { icon: '🍸', name: 'BAR' },
    toilet: { icon: '🚻', name: 'TOILETTES' },
    atm: { icon: '🏧', name: 'DISTRIBUTEUR' },
    wheel: { icon: '🎡', name: 'ROUE FORTUNE' },
    shop: { icon: '🏎', name: 'GAMBLELIFE STORE' },
    benzbet: { icon: '🎟️', name: 'BENZBET' },
    exit: { icon: '🚪', name: 'SORTIE — VERS LA RUE' },
  };

  // Gestion tactile des flèches (hold-to-move)
  const setKey = (key, value) => {
    keysRef.current[key] = value;
  };

  // Refs pour le tir
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const allDealersRef = useRef([]);
  const allNpcsRef = useRef([]); // PNJ tuables
  const bulletsRef = useRef([]); // balles en vol
  const casingsRef = useRef([]); // douilles au sol
  const bloodRef = useRef([]); // particules de sang
  const flamesRef = useRef([]); // particules de flammes
  const [slashActive, setSlashActive] = useState(false); // animation slash armes blanches
  const [isAiming, setIsAiming] = useState(false); // visée 1ère personne
  const isAimingRef = useRef(false);
  useEffect(() => { isAimingRef.current = isAiming; }, [isAiming]);

  // Démarrer l'ambiance casino au montage
  useEffect(() => {
    try { sfx.startAmbience(); } catch (_e) { /* noop */ }
    return () => { try { sfx.stopAmbience(); } catch (_e) { /* noop */ } };
  }, []);

  // ===== MULTIJOUEUR : refs partagées =====
  const lastPosSentRef = useRef(0);
  const selectedWeaponRef = useRef(null);
  useEffect(() => { selectedWeaponRef.current = selectedWeapon; }, [selectedWeapon]);
  const pendingRemoteUpdatesRef = useRef({}); // dernière snapshot reçue {id: playerData}
  const remoteShotsRef = useRef([]); // tirs distants à animer

  // Construire un avatar basique pour un joueur distant
  const buildRemoteAvatar = (pdata) => {
    const scene = sceneRefLocal.current;
    if (!scene) return null;
    const group = new THREE.Group();
    const skinHex = (typeof pdata.skin === 'string' && pdata.skin.startsWith('#'))
      ? parseInt(pdata.skin.slice(1), 16) : 0xe0b48a;
    // Corps
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.3, 1.1, 12),
      new THREE.MeshStandardMaterial({ color: 0x223388 })
    );
    body.position.y = 1.0;
    group.add(body);
    // Tête
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 14, 14),
      new THREE.MeshStandardMaterial({ color: skinHex })
    );
    head.position.y = 1.75;
    group.add(head);
    // Cheveux
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.23, 14, 14, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    hair.position.y = 1.82;
    group.add(hair);
    // Bras
    const armMat = new THREE.MeshStandardMaterial({ color: 0x223388 });
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.7, 8), armMat);
    armL.position.set(-0.33, 1.2, 0);
    group.add(armL);
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.7, 8), armMat);
    armR.position.set(0.33, 1.2, 0);
    group.add(armR);
    // Jambes
    const legMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.8, 8), legMat);
    legL.position.set(-0.12, 0.4, 0);
    group.add(legL);
    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.8, 8), legMat);
    legR.position.set(0.12, 0.4, 0);
    group.add(legR);
    // Badge pseudo au-dessus (billboard via CanvasTexture)
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pdata.name || '?', 128, 32);
    const tex = new THREE.CanvasTexture(canvas);
    const nameSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    nameSprite.position.y = 2.3;
    nameSprite.scale.set(1.2, 0.3, 1);
    group.add(nameSprite);
    group.position.set(pdata.x || 0, 0, pdata.z || 0);
    group.userData = { legL, legR, armL, armR, nameSprite, lastPos: new THREE.Vector3(pdata.x, 0, pdata.z) };
    scene.add(group);
    return group;
  };

  const removeRemoteAvatar = (id) => {
    const scene = sceneRefLocal.current;
    const entry = remotePlayersRef.current[id];
    if (entry && scene) {
      scene.remove(entry.mesh);
      entry.mesh.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material?.dispose) o.material.dispose();
      });
    }
    delete remotePlayersRef.current[id];
  };

  const updateRemoteAvatars = () => {
    const snap = pendingRemoteUpdatesRef.current;
    if (!snap) return;
    const myId = myIdRef.current;
    // Add/update
    Object.values(snap).forEach((pd) => {
      if (!pd || !pd.id) return;
      if (pd.id === myId) return; // skip self
      let entry = remotePlayersRef.current[pd.id];
      if (!entry) {
        const mesh = buildRemoteAvatar(pd);
        if (!mesh) return;
        entry = { mesh, data: pd };
        remotePlayersRef.current[pd.id] = entry;
      }
      entry.data = pd;
      // Interpolation douce vers la position cible
      const m = entry.mesh;
      const target = new THREE.Vector3(pd.x || 0, 0, pd.z || 0);
      m.position.x += (target.x - m.position.x) * 0.2;
      m.position.z += (target.z - m.position.z) * 0.2;
      // Rotation
      m.rotation.y += ((pd.rotY || 0) - m.rotation.y) * 0.25;
      // Animation marche si bouge
      const moved = m.userData.lastPos.distanceTo(target) > 0.005;
      const t = performance.now() * 0.008;
      const swing = moved ? Math.sin(t) * 0.3 : 0;
      if (m.userData.legL) m.userData.legL.rotation.x = swing;
      if (m.userData.legR) m.userData.legR.rotation.x = -swing;
      if (m.userData.armL) m.userData.armL.rotation.x = -swing * 0.8;
      if (m.userData.armR) m.userData.armR.rotation.x = swing * 0.8;
      m.userData.lastPos.copy(target);
      // Masquer si HP = 0
      m.visible = (pd.hp || 100) > 0;
    });
    // Remove disparus
    const aliveIds = new Set(Object.keys(snap));
    Object.keys(remotePlayersRef.current).forEach((id) => {
      if (!aliveIds.has(id)) removeRemoteAvatar(id);
    });
  };

  // Connexion WebSocket au serveur multijoueur
  useEffect(() => {
    if (!mpOnline) return;
    const username = profile?.name || 'Anon';
    const client = new MPClient({
      serverId: mpServerId,
      username,
      onMessage: (msg) => {
        if (msg.type === 'welcome') {
          myIdRef.current = msg.you?.id;
          // initial snapshot
          const map = {};
          (msg.players || []).forEach(p => { map[p.id] = p; });
          pendingRemoteUpdatesRef.current = map;
          setOnlinePlayersCount(msg.players?.length || 1);
          setChatMessages(msg.chat || []);
        } else if (msg.type === 'snapshot') {
          const map = {};
          (msg.players || []).forEach(p => { map[p.id] = p; });
          pendingRemoteUpdatesRef.current = map;
          setOnlinePlayersCount(msg.players?.length || 1);
          // HP personnel
          const me = (msg.players || []).find(p => p.id === myIdRef.current);
          if (me) setMyHp(me.hp);
        } else if (msg.type === 'player_joined') {
          setChatMessages((prev) => [...prev, { from: 'SYSTÈME', text: `${msg.player.name} a rejoint.`, ts: Date.now() / 1000 }].slice(-30));
        } else if (msg.type === 'player_left') {
          removeRemoteAvatar(msg.id);
        } else if (msg.type === 'chat') {
          setChatMessages((prev) => [...prev, msg].slice(-30));
        } else if (msg.type === 'shot') {
          // Animer un tir distant
          remoteShotsRef.current.push({
            from: new THREE.Vector3(msg.x, msg.y, msg.z),
            to: new THREE.Vector3(msg.tx, msg.ty, msg.tz),
            weapon: msg.weapon,
            start: performance.now(),
          });
          try { sfx.play(msg.weapon || 'gun'); } catch (_e) { /* noop */ }
        } else if (msg.type === 'kill') {
          setKillFeed((prev) => [...prev, { ...msg, ts: Date.now() }].slice(-5));
          setTimeout(() => setKillFeed((prev) => prev.filter(k => Date.now() - k.ts < 5000)), 5500);
          try { sfx.play('explosion'); } catch (_e) { /* noop */ }
        } else if (msg.type === 'damage') {
          if (msg.target === myIdRef.current) {
            setMyHp(msg.hp);
          }
        } else if (msg.type === 'respawn') {
          // noop, snapshot suivant mettra à jour
        }
      },
      onOpen: () => {
        setChatMessages((prev) => [...prev, { from: 'SYSTÈME', text: `Connecté au serveur ${mpServerId.toUpperCase()}`, ts: Date.now() / 1000 }].slice(-30));
      },
      onClose: () => {
        // Tenter de rester silencieux, le client gère la reco
      },
    });
    mpRef.current = client;
    client.connect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => {
      client.close();
      mpRef.current = null;
      myIdRef.current = null;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const remoteSnap = remotePlayersRef.current;
      Object.keys(remoteSnap).forEach(removeRemoteAvatar);
      pendingRemoteUpdatesRef.current = {};
    };
  }, [mpOnline, mpServerId, profile?.name]);

  // Envoi chat
  const sendChatMessage = () => {
    const text = chatInput.trim();
    if (!text || !mpRef.current) return;
    mpRef.current.sendChat(text);
    setChatInput('');
    setShowChatInput(false);
  };
  // Ouverture chat avec touche T
  useEffect(() => {
    if (!mpOnline) return;
    const onKey = (e) => {
      if (e.key === 't' || e.key === 'T') {
        if (!showChatInput) {
          e.preventDefault();
          setShowChatInput(true);
          setTimeout(() => chatInputRef.current?.focus(), 50);
        }
      } else if (e.key === 'Escape' && showChatInput) {
        setShowChatInput(false);
        setChatInput('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mpOnline, showChatInput]);

  // Créer une balle qui vole de l'arme vers l'impact
  const createBullet = (fromPos, toPos, weaponType) => {
    const scene = sceneRef.current;
    if (!scene) return;
    
    // Taille de la balle selon le type d'arme
    let bulletGeom, bulletMat;
    if (weaponType === 'rocket') {
      bulletGeom = new THREE.ConeGeometry(0.1, 0.4, 8);
      bulletMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
    } else if (weaponType === 'flame') {
      bulletGeom = new THREE.SphereGeometry(0.15, 8, 8);
      bulletMat = new THREE.MeshBasicMaterial({ color: 0xff4400 });
    } else {
      bulletGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.08, 6);
      bulletMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    }
    const bullet = new THREE.Mesh(bulletGeom, bulletMat);
    bullet.position.copy(fromPos);
    
    // Trainée de lumière pour balle
    if (weaponType !== 'flame' && weaponType !== 'rocket') {
      const trail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6),
        new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.6 })
      );
      bullet.add(trail);
    }
    
    scene.add(bullet);
    
    const startTime = Date.now();
    const duration = weaponType === 'rocket' ? 300 : weaponType === 'flame' ? 200 : 150;
    const startPos = fromPos.clone();
    const endPos = toPos.clone();
    
    // Orienter la balle vers la cible
    bullet.lookAt(endPos);
    bullet.rotateX(Math.PI / 2);
    
    bulletsRef.current.push({ mesh: bullet, startTime, duration, startPos, endPos, weaponType });
  };

  // Projectile lancé (couteau, grenade) — suit une trajectoire en arc
  const createThrowable = (fromPos, toPos, kind) => {
    const scene = sceneRef.current;
    if (!scene) return;
    let mesh;
    if (kind === 'grenade') {
      mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 10, 10),
        new THREE.MeshStandardMaterial({ color: 0x2a3a20, metalness: 0.5, roughness: 0.55 })
      );
      // Goupille
      const pin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.04, 6),
        new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8 })
      );
      pin.position.y = 0.09;
      mesh.add(pin);
    } else if (kind === 'bolt') {
      mesh = new THREE.Group();
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.35, 6),
        new THREE.MeshStandardMaterial({ color: 0x4a2a10 })
      );
      shaft.rotation.z = Math.PI / 2;
      mesh.add(shaft);
      const tip = new THREE.Mesh(
        new THREE.ConeGeometry(0.03, 0.08, 6),
        new THREE.MeshStandardMaterial({ color: 0xb0b0b0, metalness: 0.9 })
      );
      tip.rotation.z = -Math.PI / 2;
      tip.position.x = 0.2;
      mesh.add(tip);
    } else {
      // Couteau de lancer: lame + manche
      mesh = new THREE.Group();
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.04, 0.01),
        new THREE.MeshStandardMaterial({ color: 0xe0e0e0, metalness: 0.95, roughness: 0.08 })
      );
      mesh.add(blade);
      const handle = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.03, 0.025),
        new THREE.MeshStandardMaterial({ color: 0x1a0a00 })
      );
      handle.position.x = -0.18;
      mesh.add(handle);
    }
    mesh.position.copy(fromPos);
    scene.add(mesh);
    const startTime = Date.now();
    const duration = 500;
    const startPos = fromPos.clone();
    const endPos = toPos.clone();
    bulletsRef.current.push({
      mesh, startTime, duration, startPos, endPos, weaponType: 'throwable', kind,
      onUpdate: (m, t) => {
        m.position.lerpVectors(startPos, endPos, t);
        m.position.y += Math.sin(t * Math.PI) * 0.6;
        m.rotation.y += 0.6;
        m.rotation.z += 0.3;
      },
    });
  };

  // Explosion : sphère lumineuse + onde de choc
  const createExplosion = (pos) => {
    const scene = sceneRef.current;
    if (!scene) return;
    // Throttle : si une explosion est créée < 80 ms après la dernière, on skip pour éviter de saturer le GPU
    const now = Date.now();
    if (createExplosion._lastAt && (now - createExplosion._lastAt) < 80) return;
    createExplosion._lastAt = now;
    try { sfx.play('explosion'); } catch (_e) { /* noop */ }
    const group = new THREE.Group();
    group.position.copy(pos);
    // Flash initial (géométries allégées)
    const flashGeo = new THREE.SphereGeometry(0.3, 10, 8);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffeeaa, transparent: true, opacity: 1 });
    const flash = new THREE.Mesh(flashGeo, flashMat);
    group.add(flash);
    // Boule de feu
    const fireGeo = new THREE.SphereGeometry(0.5, 12, 10);
    const fireMat = new THREE.MeshBasicMaterial({ color: 0xff5a1a, transparent: true, opacity: 0.9 });
    const fire = new THREE.Mesh(fireGeo, fireMat);
    group.add(fire);
    // Onde de choc
    const shockGeo = new THREE.RingGeometry(0.5, 0.7, 20);
    const shockMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
    const shock = new THREE.Mesh(shockGeo, shockMat);
    shock.rotation.x = -Math.PI / 2;
    shock.position.y = -1;
    group.add(shock);
    // Lumière ponctuelle (intensité réduite + distance courte pour éviter les recompilations shader sur AoE multiple)
    const light = new THREE.PointLight(0xff8833, 2, 6);
    group.add(light);

    scene.add(group);
    const start = Date.now();
    const duration = 700;
    let cancelled = false;
    const cleanup = () => {
      if (cancelled) return;
      cancelled = true;
      scene.remove(group);
      // Dispose pour éviter la fuite GPU
      flashGeo.dispose(); flashMat.dispose();
      fireGeo.dispose();  fireMat.dispose();
      shockGeo.dispose(); shockMat.dispose();
    };
    const anim = () => {
      if (cancelled) return;
      const el = Date.now() - start;
      const t = Math.min(el / duration, 1);
      const scale = 1 + t * 6;
      fire.scale.setScalar(scale);
      flash.scale.setScalar(1 + t * 3);
      flashMat.opacity = Math.max(0, 1 - t * 2);
      fireMat.opacity = Math.max(0, 0.9 - t);
      shock.scale.setScalar(1 + t * 5);
      shockMat.opacity = Math.max(0, 0.8 - t);
      light.intensity = Math.max(0, 4 * (1 - t));
      if (t < 1) requestAnimationFrame(anim);
      else cleanup();
    };
    anim();
    // Garde-fou : s'assure du nettoyage même si l'anim est bloquée
    setTimeout(cleanup, duration + 500);
  };

  // Rayon laser instantané
  const createLaserBeam = (fromPos, toPos) => {
    const scene = sceneRef.current;
    if (!scene) return;
    const dir = new THREE.Vector3().subVectors(toPos, fromPos);
    const length = dir.length();
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, length, 8),
      new THREE.MeshBasicMaterial({ color: 0xff0033, transparent: true, opacity: 0.95 })
    );
    const mid = fromPos.clone().add(toPos).multiplyScalar(0.5);
    beam.position.copy(mid);
    beam.lookAt(toPos);
    beam.rotateX(Math.PI / 2);
    scene.add(beam);
    const start = Date.now();
    const duration = 250;
    const anim = () => {
      const el = Date.now() - start;
      const t = Math.min(el / duration, 1);
      beam.material.opacity = 0.95 * (1 - t);
      beam.scale.x = beam.scale.z = 1 + t * 1.5;
      if (t < 1) requestAnimationFrame(anim);
      else scene.remove(beam);
    };
    anim();
  };

  
  // Créer une douille qui reste 20s
  const createCasing = (pos, weaponType) => {
    if (weaponType === 'rocket' || weaponType === 'flame' || weaponType === 'melee') return;
    const scene = sceneRef.current;
    if (!scene) return;
    
    const casingGroup = new THREE.Group();
    // Cylindre doré (douille)
    const casing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.05, 6),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.3 })
    );
    casingGroup.add(casing);
    
    casingGroup.position.copy(pos);
    casingGroup.position.y = 0.02; // au sol
    casingGroup.rotation.z = Math.PI / 2; // couché
    casingGroup.rotation.y = Math.random() * Math.PI * 2;
    
    scene.add(casingGroup);
    
    const createdAt = Date.now();
    casingsRef.current.push({ mesh: casingGroup, createdAt, scene });
    
    // Retirer après 20s
    setTimeout(() => {
      scene.remove(casingGroup);
      casingsRef.current = casingsRef.current.filter(c => c.mesh !== casingGroup);
    }, 20000);
  };
  
  // Créer particules de sang qui giclent
  const createBloodSplash = (pos) => {
    const scene = sceneRef.current;
    if (!scene) return;
    
    const bloodGroup = new THREE.Group();
    bloodGroup.position.copy(pos);
    scene.add(bloodGroup);
    
    // 8 gouttes (réduit de 15 pour alléger GPU pendant les AoE)
    const drops = [];
    const geos = [];
    const mats = [];
    for (let i = 0; i < 8; i++) {
      const g = new THREE.SphereGeometry(0.04 + Math.random() * 0.05, 5, 4);
      const m = new THREE.MeshStandardMaterial({ 
        color: 0x8b0000, 
        emissive: 0x4a0000,
        emissiveIntensity: 0.3,
      });
      const drop = new THREE.Mesh(g, m);
      geos.push(g); mats.push(m);
      const vx = (Math.random() - 0.5) * 4;
      const vy = 2 + Math.random() * 3;
      const vz = (Math.random() - 0.5) * 4;
      bloodGroup.add(drop);
      drops.push({ mesh: drop, vx, vy, vz, landed: false });
    }
    
    const startTime = Date.now();
    bloodRef.current.push({ group: bloodGroup, drops, startTime, duration: 1500 });
    
    // Retirer après 5s et disposer les ressources GPU
    setTimeout(() => {
      scene.remove(bloodGroup);
      bloodRef.current = bloodRef.current.filter(b => b.group !== bloodGroup);
      geos.forEach(g => g.dispose());
      mats.forEach(m => m.dispose());
    }, 5000);
  };

  // Tir avec effets visuels complets
  const doShoot = () => {
    if (!selectedWeapon) return;
    // Do not block on `shooting` state while in auto-fire mode
    onShoot && onShoot();
    // Son de l'arme
    try { sfx.play(selectedWeapon); } catch (_e) { /* noop */ }
    
    const camera = cameraRef.current;
    const dealers = allDealersRef.current;
    const npcs = allNpcsRef.current || [];
    const targets = [...dealers, ...npcs]; // tout ce qui est tuable
    
    if (!camera) { return; }
    
    const weaponDef = WEAPONS.find(w => w.id === selectedWeapon);
    const weaponType = weaponDef?.type || 'gun';
    
    const cameraPos = new THREE.Vector3();
    camera.getWorldPosition(cameraPos);
    const cameraDir = new THREE.Vector3();
    camera.getWorldDirection(cameraDir);

    // ====== MP : détection PvP & broadcast ======
    if (mpRef.current) {
      const tip = cameraPos.clone().add(cameraDir.clone().multiplyScalar(30));
      mpRef.current.sendShot(cameraPos.x, cameraPos.y, cameraPos.z, tip.x, tip.y, tip.z, selectedWeapon);
      // Hit sur joueur distant : cône 30m, dot > 0.995 (précision au laser) sauf bazooka
      const isAoe = weaponType === 'rocket' || selectedWeapon === 'grenade';
      const dmg = weaponType === 'melee' ? 50 : weaponType === 'rocket' ? 100 : weaponType === 'laser' ? 60 : 25;
      Object.values(remotePlayersRef.current).forEach((entry) => {
        const pd = entry.data;
        if (!pd || pd.hp <= 0) return;
        const rp = new THREE.Vector3(pd.x, pd.y || 1.5, pd.z);
        const toT = new THREE.Vector3().subVectors(rp, cameraPos);
        const dist = toT.length();
        if (dist > 30) return;
        toT.normalize();
        const dotDir = cameraDir.dot(toT);
        const accept = weaponType === 'melee' ? (dist < 3 && dotDir > 0.5)
                     : isAoe ? dotDir > 0.88
                     : dotDir > 0.98;
        if (accept) {
          mpRef.current.sendHit(pd.id, selectedWeapon, dmg);
        }
      });
    }
    
    // ====== ARMES BLANCHES (couteau, machette) ======
    if (weaponType === 'melee') {
      setSlashActive(true);
      setTimeout(() => setSlashActive(false), 1000);
      
      // Trouver cible proche (3m)
      let hitTarget = null;
      let bestDist = 3;
      for (const t of targets) {
        if (t.userData.dead) continue;
        const tp = new THREE.Vector3();
        t.getWorldPosition(tp);
        const distance = cameraPos.distanceTo(tp);
        if (distance > bestDist) continue;
        const toT = new THREE.Vector3().subVectors(tp, cameraPos).normalize();
        const dot = cameraDir.dot(toT);
        if (dot > 0.4) {
          hitTarget = t;
          bestDist = distance;
        }
      }
      
      if (hitTarget) {
        setTimeout(() => {
          const bp = new THREE.Vector3();
          hitTarget.getWorldPosition(bp);
          bp.y += 1.6;
          createBloodSplash(bp);
          if (!hitTarget.userData.dead) killTarget(hitTarget);
        }, 400);
      }
      
      setTimeout(() => setSlashActive(false), 700);
      return;
    }
    
    // ====== LANCE-FLAMMES ======
    if (weaponType === 'flame') {
      // Créer des flammes qui jaillissent pendant 2s
      createFlameStream(cameraPos, cameraDir, camera);
      
      // Touche tous les ennemis dans un cône de 3m
      targets.forEach(t => {
        if (t.userData.dead) return;
        const tp = new THREE.Vector3();
        t.getWorldPosition(tp);
        const distance = cameraPos.distanceTo(tp);
        if (distance > 3.5) return;
        const toT = new THREE.Vector3().subVectors(tp, cameraPos).normalize();
        const dot = cameraDir.dot(toT);
        if (dot > 0.5) { // cône large
          setTimeout(() => {
            const bp = new THREE.Vector3();
            t.getWorldPosition(bp);
            bp.y += 1.6;
            createBloodSplash(bp);
            if (!t.userData.dead) killTarget(t);
          }, 500);
        }
      });
      
      // flame duration handled by flameStream lifecycle
      return;
    }

    // ====== ARMES LANCÉES (couteaux de lancer, grenades) ======
    if (weaponType === 'throwable') {
      const right = new THREE.Vector3().crossVectors(cameraDir, camera.up).normalize();
      const throwStart = cameraPos.clone()
        .add(cameraDir.clone().multiplyScalar(0.5))
        .add(right.clone().multiplyScalar(0.25))
        .add(new THREE.Vector3(0, -0.2, 0));

      // Lancer direct, cherche cible dans cône 15m
      let hitTarget = null;
      let bestDist = 15;
      for (const t of targets) {
        if (t.userData.dead) continue;
        const tp = new THREE.Vector3();
        t.getWorldPosition(tp);
        const distance = cameraPos.distanceTo(tp);
        if (distance > bestDist) continue;
        const toT = new THREE.Vector3().subVectors(tp, cameraPos).normalize();
        const dot = cameraDir.dot(toT);
        if (dot > 0.7) {
          hitTarget = t;
          bestDist = distance;
        }
      }
      const endPos = hitTarget
        ? hitTarget.getWorldPosition(new THREE.Vector3()).setY((hitTarget.getWorldPosition(new THREE.Vector3()).y) + 1.5)
        : cameraPos.clone().add(cameraDir.clone().multiplyScalar(12));

      createThrowable(throwStart, endPos, weaponDef?.projectile || 'blade');

      const flightTime = 500;
      if (weaponDef?.projectile === 'grenade') {
        // Grenade: explosion à l'impact avec AoE 3m
        setTimeout(() => {
          createExplosion(endPos);
          targets.forEach(t => {
            if (t.userData.dead) return;
            const tp = new THREE.Vector3();
            t.getWorldPosition(tp);
            const distToBlast = tp.distanceTo(endPos);
            if (distToBlast <= 3) {
              const bp = tp.clone(); bp.y += 1.6;
              createBloodSplash(bp);
              killTarget(t);
            }
          });
        }, flightTime);
      } else {
        // Couteau/carreau : dégât simple à l'impact
        if (hitTarget) {
          setTimeout(() => {
            if (!hitTarget.userData.dead) {
              const bp = new THREE.Vector3();
              hitTarget.getWorldPosition(bp);
              bp.y += 1.6;
              createBloodSplash(bp);
              killTarget(hitTarget);
            }
          }, flightTime);
        }
      }
      return;
    }

    // ====== LASER (fusil laser - rayon instantané) ======
    if (weaponType === 'laser') {
      const right = new THREE.Vector3().crossVectors(cameraDir, camera.up).normalize();
      const laserStart = cameraPos.clone()
        .add(cameraDir.clone().multiplyScalar(0.5))
        .add(right.clone().multiplyScalar(0.3))
        .add(new THREE.Vector3(0, -0.3, 0));
      const laserEnd = cameraPos.clone().add(cameraDir.clone().multiplyScalar(40));
      createLaserBeam(laserStart, laserEnd);
      // Traverse tout : kills TOUS les ennemis dans un cylindre fin de 40m
      targets.forEach(t => {
        if (t.userData.dead) return;
        const tp = new THREE.Vector3();
        t.getWorldPosition(tp);
        const toT = new THREE.Vector3().subVectors(tp, cameraPos);
        const along = toT.dot(cameraDir);
        if (along < 0 || along > 40) return;
        const proj = cameraPos.clone().add(cameraDir.clone().multiplyScalar(along));
        if (proj.distanceTo(tp) < 0.9) {
          const bp = tp.clone(); bp.y += 1.6;
          createBloodSplash(bp);
          killTarget(t);
        }
      });
      return;
    }
    
    // ====== ARMES À FEU (pistolet, fusil, bazooka) ======
    const right = new THREE.Vector3().crossVectors(cameraDir, camera.up).normalize();
    const gunPos = cameraPos.clone()
      .add(cameraDir.clone().multiplyScalar(0.5))
      .add(right.clone().multiplyScalar(0.3))
      .add(new THREE.Vector3(0, -0.3, 0));
    
    let targetPos = null;
    let hitTarget = null;
    
    for (const t of targets) {
      if (t.userData.dead) continue;
      const tp = new THREE.Vector3();
      t.getWorldPosition(tp);
      
      const distance = cameraPos.distanceTo(tp);
      if (distance > 25) continue;
      
      const toT = new THREE.Vector3().subVectors(tp, cameraPos).normalize();
      const dot = cameraDir.dot(toT);
      const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
      
      const toleranceBase = isAiming ? 0.08 : 0.2;
      const tolerance = Math.max(toleranceBase, 1.0 / distance);
      if (angle < tolerance) {
        targetPos = tp.clone();
        targetPos.y += 1.7;
        hitTarget = t;
        break;
      }
    }
    
    if (!targetPos) {
      targetPos = cameraPos.clone().add(cameraDir.clone().multiplyScalar(15));
    }
    
    createBullet(gunPos, targetPos, weaponType);
    
    // Éjecter douille
    setTimeout(() => {
      const casingPos = cameraPos.clone()
        .add(right.clone().multiplyScalar(0.5));
      casingPos.y = 0.05;
      createCasing(casingPos, weaponType);
    }, 100);
    
    if (hitTarget) {
      const flightTime = weaponType === 'rocket' ? 300 : 150;
      setTimeout(() => {
        if (weaponType === 'rocket') {
          // Bazooka: explosion au point d'impact, AoE 3m
          const blastCenter = targetPos.clone();
          createExplosion(blastCenter);
          targets.forEach(t => {
            if (t.userData.dead) return;
            const tp = new THREE.Vector3();
            t.getWorldPosition(tp);
            const distToBlast = tp.distanceTo(blastCenter);
            if (distToBlast <= 3) {
              const bp = tp.clone(); bp.y += 1.6;
              createBloodSplash(bp);
              killTarget(t);
            }
          });
        } else {
          if (!hitTarget.userData.dead) {
            const bloodPos = new THREE.Vector3();
            hitTarget.getWorldPosition(bloodPos);
            bloodPos.y += 1.6;
            createBloodSplash(bloodPos);
            killTarget(hitTarget);
          }
        }
      }, flightTime);
    } else if (weaponType === 'rocket') {
      // Tir de bazooka sans cible touchée : quand même explosion au bout de la trajectoire
      setTimeout(() => {
        const blastCenter = targetPos.clone();
        createExplosion(blastCenter);
        targets.forEach(t => {
          if (t.userData.dead) return;
          const tp = new THREE.Vector3();
          t.getWorldPosition(tp);
          if (tp.distanceTo(blastCenter) <= 3) {
            const bp = tp.clone(); bp.y += 1.6;
            createBloodSplash(bp);
            killTarget(t);
          }
        });
      }, 300);
    }
    
    // shooting state controlled by fire button press/release
  };
  
  // Créer un flux de flammes devant le joueur (lance-flammes)
  const createFlameStream = (origin, direction, camera) => {
    const scene = sceneRef.current;
    if (!scene) return;
    
    const flameGroup = new THREE.Group();
    const flameCount = 30;
    const startTime = Date.now();
    const duration = 2000;
    
    const particles = [];
    for (let i = 0; i < flameCount; i++) {
      const flame = new THREE.Mesh(
        new THREE.SphereGeometry(0.12 + Math.random() * 0.1, 8, 8),
        new THREE.MeshBasicMaterial({ 
          color: Math.random() < 0.5 ? 0xff4400 : 0xffaa00,
          transparent: true,
          opacity: 0.8,
        })
      );
      flameGroup.add(flame);
      particles.push({
        mesh: flame,
        startDelay: (i / flameCount) * 500,
        offsetX: (Math.random() - 0.5) * 0.3,
        offsetY: (Math.random() - 0.5) * 0.3,
        life: 800 + Math.random() * 400,
      });
    }
    
    scene.add(flameGroup);
    flamesRef.current.push({
      group: flameGroup,
      particles,
      startTime,
      duration,
      origin: origin.clone(),
      direction: direction.clone(),
      camera,
    });
    
    // Retirer après durée + life max
    setTimeout(() => {
      scene.remove(flameGroup);
      flamesRef.current = flamesRef.current.filter(f => f.group !== flameGroup);
    }, duration + 1500);
  };
  
  const killTarget = (target) => {
    target.userData.dead = true;
    const originalRotation = target.rotation.z;
    const originalPosY = target.position.y;
    
    const startTime = Date.now();
    const fallDuration = 600;
    const fallAnim = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / fallDuration, 1);
      const eased = 1 - Math.pow(1 - t, 2);
      target.rotation.z = originalRotation + (Math.PI / 2) * eased;
      target.position.y = originalPosY - 0.8 * eased;
      if (t < 1) requestAnimationFrame(fallAnim);
    };
    fallAnim();
    
    setTimeout(() => {
      const respawnStart = Date.now();
      const respawnDuration = 500;
      const respawnAnim = () => {
        const elapsed = Date.now() - respawnStart;
        const t = Math.min(elapsed / respawnDuration, 1);
        target.rotation.z = originalRotation + (Math.PI / 2) * (1 - t);
        target.position.y = originalPosY - 0.8 * (1 - t);
        if (t < 1) requestAnimationFrame(respawnAnim);
        else {
          target.rotation.z = originalRotation;
          target.position.y = originalPosY;
          target.userData.dead = false;
        }
      };
      respawnAnim();
    }, 10000);
  };


  const nextTrophy = TROPHIES.find(t => t.threshold > (profile?.totalWinnings || 0));
  const earned = TROPHIES.filter(t => (profile?.totalWinnings || 0) >= t.threshold);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#000', touchAction: 'none' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* === ANIMATION D'ARRIVÉE TÉLÉPORTATION (4s) === */}
      {arriving && (
        <div
          data-testid="casino-arrival-overlay"
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            zIndex: 9999, overflow: 'hidden',
          }}
        >
          {/* Flash blanc qui démarre intense, fade out */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, rgba(180,220,255,0.65) 35%, rgba(255,255,255,0) 75%)',
            animation: 'arrival-flash 4s ease-out forwards',
          }} />
          {/* Anneaux de téléportation qui montent */}
          <div style={{
            position: 'absolute', left: '50%', bottom: '32%',
            transform: 'translateX(-50%)',
            width: 240, height: 60,
            borderRadius: '50%',
            border: '3px solid rgba(180,220,255,0.85)',
            boxShadow: '0 0 60px rgba(180,220,255,0.85), inset 0 0 30px rgba(255,255,255,0.6)',
            animation: 'arrival-ring1 2.4s ease-out infinite',
          }} />
          <div style={{
            position: 'absolute', left: '50%', bottom: '34%',
            transform: 'translateX(-50%)',
            width: 200, height: 50,
            borderRadius: '50%',
            border: '2px solid rgba(255,215,0,0.6)',
            animation: 'arrival-ring2 2.4s ease-out 0.4s infinite',
          }} />
          {/* Texte d'arrivée */}
          <div style={{
            position: 'absolute', top: '38%', left: '50%',
            transform: 'translate(-50%,-50%)',
            color: '#fff', textAlign: 'center',
            textShadow: '0 0 24px #fff, 0 0 48px #3fe6ff',
            animation: 'arrival-text 4s ease-out forwards',
          }}>
            <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: 8 }}>GAMBLELIFE</div>
            <div style={{ fontSize: 14, letterSpacing: 6, marginTop: 4, color: '#3fe6ff' }}>★ ENTRÉE EN MATIÈRE ★</div>
          </div>
          <style>{`
            @keyframes arrival-flash {
              0%   { opacity: 1; }
              25%  { opacity: 0.85; }
              60%  { opacity: 0.4; }
              100% { opacity: 0; }
            }
            @keyframes arrival-ring1 {
              0%   { transform: translateX(-50%) translateY(40px) scale(0.3); opacity: 0; }
              30%  { opacity: 1; }
              100% { transform: translateX(-50%) translateY(-200px) scale(1.3); opacity: 0; }
            }
            @keyframes arrival-ring2 {
              0%   { transform: translateX(-50%) translateY(40px) scale(0.3); opacity: 0; }
              30%  { opacity: 1; }
              100% { transform: translateX(-50%) translateY(-180px) scale(1.5); opacity: 0; }
            }
            @keyframes arrival-text {
              0%   { transform: translate(-50%,-50%) scale(0.4); opacity: 0; filter: blur(20px); }
              30%  { transform: translate(-50%,-50%) scale(1.1); opacity: 1; filter: blur(0px); }
              80%  { transform: translate(-50%,-50%) scale(1.0); opacity: 1; }
              100% { transform: translate(-50%,-60%) scale(1.0); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {/* === MENU UNIVERSEL — accessible partout === */}
      <UniversalMenu
        profile={profile}
        balance={balance}
        deviceType={deviceType}
        onOpenTrophies={onOpenTrophies}
        onOpenQuests={onOpenQuests}
        onOpenShop={onOpenShop}
        onChangeDevice={() => { /* TODO bring back to deviceSelect */ }}
        position="top-right"
      />

      {/* HUD Haut */}
      <div className="hud-control" style={{
        position: 'absolute', top: 10, left: 10, right: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        pointerEvents: 'none', fontFamily: 'Georgia, serif', zIndex: 10,
      }}>
        <div style={{
          background: 'rgba(0,0,0,0.75)',
          border: `1px solid ${casino.primary}`,
          borderRadius: 8, padding: 8,
          color: '#fff', pointerEvents: 'auto', fontSize: 12,
        }}>
          <div style={{ color: '#cca366', fontSize: 10 }}>{profile.name} • {casino.country}</div>
          <div style={{ fontSize: 18, color: '#ffd700', fontWeight: 'bold' }}>{fmt(balance)} $</div>
          {/* VIP badge: n skins luxe équipés → bonus de style */}
          {(() => {
            const H = HAIR_CATALOG[profile.hair ?? 0];
            const O = OUTFIT_CATALOG[profile.outfit ?? 0];
            const S = SHOES_CATALOG[profile.shoes ?? 0];
            const luxuryCount = (H && H.price >= 500000 ? 1 : 0) + (O && O.price >= 500000 ? 1 : 0) + (S && S.price >= 500000 ? 1 : 0);
            if (luxuryCount < 2) return null;
            const mul = luxuryCount >= 4 ? 1.75 : luxuryCount >= 3 ? 1.5 : 1.25;
            return (
              <div data-testid="vip-badge" style={{
                marginTop: 6, padding: '3px 8px',
                borderRadius: 14,
                background: luxuryCount >= 3 ? 'linear-gradient(90deg, #ffd700, #ff00cc)' : 'rgba(212,175,55,.25)',
                color: luxuryCount >= 3 ? '#000' : '#ffd700',
                fontSize: 10, fontWeight: 800, letterSpacing: 1,
                display: 'inline-block',
              }}>
                {luxuryCount >= 3 ? '⭐ VIP' : '✨ STYLE'} ×{mul}
              </div>
            );
          })()}
        </div>
        <button onClick={() => setShowMenu(true)}
          style={{
            background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
            border: `1px solid ${casino.secondary}`,
            color: '#fff', borderRadius: 8, padding: '8px 14px',
            cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold',
            pointerEvents: 'auto', fontSize: 13,
          }}>☰ MENU</button>
      </div>

      {/* CONTRÔLES MOBILE/HUD - Flèches en bas à gauche */}
      <div className="hud-control" style={{
        position: 'absolute', bottom: 20, left: 20,
        display: 'grid',
        gridTemplateColumns: '50px 50px 50px',
        gridTemplateRows: '50px 50px 50px',
        gap: 4, zIndex: 20, pointerEvents: 'auto',
      }}>
        <div />
        <ArrowButton dir="↑" onPress={(v) => setKey('forward', v)} />
        <div />
        <ArrowButton dir="←" onPress={(v) => setKey('left', v)} />
        <div />
        <ArrowButton dir="→" onPress={(v) => setKey('right', v)} />
        <div />
        <ArrowButton dir="↓" onPress={(v) => setKey('backward', v)} />
        <div />
      </div>

      {/* BOUTONS ACTION - Inventaire + Tir */}
      <div className="hud-control" style={{
        position: 'absolute', bottom: 20, right: 20,
        display: 'flex', flexDirection: 'column', gap: 10,
        zIndex: 20, pointerEvents: 'auto',
      }}>
        {/* Bouton basculer vue 1ère / 3ème personne (au-dessus de l'inventaire) */}
        <button
          onClick={() => setViewMode(v => v === 'first' ? 'third' : 'first')}
          data-testid="view-toggle-btn"
          style={{
            width: 60, height: 44, borderRadius: 22,
            background: 'rgba(0,0,0,0.75)',
            border: `2px solid ${casino.secondary}`,
            color: casino.secondary,
            fontSize: 11, fontWeight: 'bold', cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
          }}>
          {viewMode === 'first' ? '👁️ 1P' : '🧍 3P'}
        </button>
        {/* Bouton Monter / Descendre du véhicule (visible si possédé) */}
        {profile && (profile.vehicles || []).length > 0 && (
          <button
            onClick={() => {
              const owned = profile.vehicles || [];
              const current = profile.equippedVehicle;
              if (!current) { onToggleVehicle && onToggleVehicle(owned[0]); return; }
              const idx = owned.indexOf(current);
              const next = idx >= owned.length - 1 ? null : owned[idx + 1];
              onToggleVehicle && onToggleVehicle(next);
            }}
            data-testid="vehicle-toggle-btn"
            title={profile.equippedVehicle ? `Descendre / changer (${profile.equippedVehicle})` : 'Monter sur un véhicule'}
            style={{
              width: 60, height: 44, borderRadius: 22,
              background: profile.equippedVehicle
                ? `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`
                : 'rgba(0,0,0,0.75)',
              border: `2px solid ${casino.secondary}`,
              color: '#fff', fontSize: 20, cursor: 'pointer',
              boxShadow: profile.equippedVehicle ? '0 0 12px rgba(212,175,55,.4)' : '0 4px 10px rgba(0,0,0,0.6)',
            }}>
            {profile.equippedVehicle === 'skateboard' ? '🛹'
              : profile.equippedVehicle === 'bike' ? '🚴'
              : '🚶'}
          </button>
        )}
        <button onClick={() => setShowInventory(true)} style={{
          width: 60, height: 60, borderRadius: '50%',
          background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
          border: `2px solid ${casino.secondary}`,
          color: '#fff', fontSize: 28, cursor: 'pointer',
          boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
        }}>🎒</button>
        {selectedWeapon && (
          <button onClick={() => setIsAiming(a => !a)} style={{
            width: 60, height: 60, borderRadius: '50%',
            background: isAiming 
              ? 'radial-gradient(circle, #ffd700, #8b6914)'
              : 'rgba(0,0,0,0.7)',
            border: `2px solid ${isAiming ? '#fff' : '#ffd700'}`,
            color: isAiming ? '#000' : '#ffd700',
            fontSize: 11, fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: isAiming ? '0 0 20px #ffd700' : '0 4px 10px rgba(0,0,0,0.6)',
          }}>
            <div style={{ fontSize: 22 }}>🎯</div>
            <div style={{ fontSize: 8 }}>{isAiming ? 'VISE' : 'VISER'}</div>
          </button>
        )}
        {/* Bouton CHICHA — visible si chicha équipée. Animation tube 3s + fumée 4s */}
        {hasHookah && (
          <button
            data-testid="lobby-hookah-btn"
            onClick={useHookahFn}
            disabled={usingHookah}
            style={{
              width: 52, height: 52, borderRadius: '50%',
              background: usingHookah
                ? 'linear-gradient(135deg, #ff6a3a, #c41e3a)'
                : 'linear-gradient(135deg, rgba(255,215,0,0.85), rgba(200,168,90,0.95))',
              border: `2px solid ${usingHookah ? '#fff' : '#ffd700'}`,
              color: '#000',
              fontSize: 11, fontWeight: 'bold',
              cursor: usingHookah ? 'wait' : 'pointer',
              boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
            }}>
            <div style={{ fontSize: 22 }}>💨</div>
            <div style={{ fontSize: 8 }}>{usingHookah ? '...' : 'CHICHA'}</div>
          </button>
        )}
        <button
          data-testid="lobby-fire-btn"
          onPointerDown={(e) => {
            e.preventDefault();
            if (!selectedWeapon) return;
            firingRef.current = true;
            setShooting(true);
            // Auto-fire loop
            const weaponDef = WEAPONS.find(w => w.id === selectedWeapon);
            const rpm = weaponDef?.type === 'gun' ? (selectedWeapon === 'shotgun' ? 90 : 300)
                      : weaponDef?.type === 'rocket' ? 40
                      : weaponDef?.type === 'flame' ? 600
                      : 180;
            const interval = Math.max(60, Math.floor(60000 / rpm));
            const fireOnce = () => {
              if (!firingRef.current) return;
              doShoot();
              // Spawn a visible bullet overlay (only while firing)
              const id = Date.now() + Math.random();
              setMuzzleKey(k => k + 1);
              setVisibleBullets(bs => [...bs, { id, startTime: Date.now() }]);
              setTimeout(() => setVisibleBullets(bs => bs.filter(b => b.id !== id)), 500);
            };
            fireOnce();
            const t = setInterval(fireOnce, interval);
            // Store interval on ref so we can clear
            firingRef.currentInterval = t;
          }}
          onPointerUp={() => {
            firingRef.current = false;
            if (firingRef.currentInterval) clearInterval(firingRef.currentInterval);
            firingRef.currentInterval = null;
            setShooting(false);
          }}
          onPointerLeave={() => {
            firingRef.current = false;
            if (firingRef.currentInterval) clearInterval(firingRef.currentInterval);
            firingRef.currentInterval = null;
            setShooting(false);
          }}
          onPointerCancel={() => {
            firingRef.current = false;
            if (firingRef.currentInterval) clearInterval(firingRef.currentInterval);
            firingRef.currentInterval = null;
            setShooting(false);
          }}
          disabled={!selectedWeapon}
          style={{
            width: 70, height: 70, borderRadius: '50%',
            background: selectedWeapon
              ? `radial-gradient(circle, #ff4444, #8b0000)`
              : '#555',
            border: '3px solid #ffd700',
            color: '#fff', fontSize: 14, fontWeight: 'bold',
            cursor: selectedWeapon ? 'pointer' : 'not-allowed',
            boxShadow: shooting ? '0 0 30px #ff8800' : (selectedWeapon ? '0 0 20px #ff4444' : 'none'),
            opacity: selectedWeapon ? 1 : 0.5,
            animation: shooting ? 'shootRecoil 0.12s infinite' : 'none',
            touchAction: 'none', userSelect: 'none',
          }}>
          <div style={{ fontSize: 22 }}>💥</div>
          <div style={{ fontSize: 9 }}>TIRER</div>
        </button>
        {selectedWeapon && (
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            border: `1px solid ${casino.secondary}`,
            borderRadius: 6, padding: 6,
            textAlign: 'center', fontSize: 10, color: '#fff',
            fontFamily: 'Georgia, serif',
          }}>
            <WeaponIcon id={selectedWeapon} size={32} />
            <div>{WEAPONS.find(w => w.id === selectedWeapon)?.name.split(' ')[0]}</div>
          </div>
        )}
      </div>

      {/* Réticule de visée au centre */}
      {selectedWeapon && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          pointerEvents: 'none', zIndex: 10,
        }}>
          <div style={{
            width: isAiming ? 40 : 20,
            height: isAiming ? 40 : 20,
            border: `2px solid ${isAiming ? '#ff4444' : 'rgba(255,255,255,0.6)'}`,
            borderRadius: '50%',
            transition: 'all 0.3s',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              width: isAiming ? 4 : 3, height: isAiming ? 4 : 3,
              background: isAiming ? '#ff4444' : '#fff',
              borderRadius: '50%',
              transform: 'translate(-50%,-50%)',
            }} />
            {isAiming && (
              <>
                <div style={{
                  position: 'absolute', top: -10, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 1, height: 8, background: '#ff4444',
                }} />
                <div style={{
                  position: 'absolute', bottom: -10, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 1, height: 8, background: '#ff4444',
                }} />
                <div style={{
                  position: 'absolute', top: '50%', left: -10,
                  transform: 'translateY(-50%)',
                  width: 8, height: 1, background: '#ff4444',
                }} />
                <div style={{
                  position: 'absolute', top: '50%', right: -10,
                  transform: 'translateY(-50%)',
                  width: 8, height: 1, background: '#ff4444',
                }} />
              </>
            )}
          </div>
        </div>
      )}

      {/* Overlay vignette quand on vise (effet de lunette) */}
      {isAiming && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)',
          pointerEvents: 'none', zIndex: 9,
        }} />
      )}

      {/* ====== CHICHA EN MAIN (G4) ====== */}
      {hasHookah && viewMode === 'first' && (
        <FPHookahView hookahId={equippedHookah} isUsing={usingHookah} />
      )}

      {/* ====== ARME EN MAIN (1ère personne) ====== */}
      {selectedWeapon && viewMode === 'first' && (
        <div style={{
          position: 'absolute', right: '12%', bottom: -20,
          width: 360, pointerEvents: 'none', zIndex: 11,
          filter: 'drop-shadow(0 10px 20px rgba(0,0,0,.6))',
          animation: shooting ? 'recoilAnim 0.12s infinite' : 'none',
        }}>
          <FPWeaponView id={selectedWeapon} />
        </div>
      )}

      {/* ====== VÉHICULE SOUS LES PIEDS (1ère personne) ====== */}
      {profile && profile.equippedVehicle && viewMode === 'first' && (
        <div style={{
          position: 'absolute', left: '50%', bottom: -40,
          transform: 'translateX(-50%)',
          width: 260, pointerEvents: 'none', zIndex: 11,
          filter: 'drop-shadow(0 6px 14px rgba(0,0,0,.7))',
          opacity: 0.95,
        }}>
          <VehicleGraphic id={profile.equippedVehicle} />
        </div>
      )}

      {/* ====== PERSONNAGE (3ème personne) ====== */}
      {/* Vue 3ème personne : l'avatar 3D est maintenant rendu directement dans la scène Three.js,
          pas besoin de l'overlay SVG. Le FPWeaponView overlay ne s'affiche qu'en 1ère personne. */}
      {false && viewMode === 'third' && (
        <div style={{
          position: 'absolute', left: '50%', bottom: 80,
          transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 11,
        }}>
          <TPPlayerView
            profile={profile}
            selectedWeapon={selectedWeapon}
            firing={shooting}
          />
        </div>
      )}

      {/* ====== BALLES VISIBLES (uniquement pendant le tir) ====== */}
      {visibleBullets.map(b => (
        <div key={b.id} style={{
          position: 'absolute',
          right: '20%',     // start position near weapon muzzle
          bottom: '25%',
          width: 8, height: 18,
          background: 'linear-gradient(180deg, #fffbe5, #ffae00)',
          borderRadius: 4,
          boxShadow: '0 0 12px #ffcd3c, 0 0 24px #ffae00',
          zIndex: 12, pointerEvents: 'none',
          animation: 'bulletFlyOverlay 0.5s linear forwards',
        }} />
      ))}

      {/* ====== MUZZLE FLASH ====== */}
      {shooting && selectedWeapon && viewMode === 'first' && (
        <div key={muzzleKey} style={{
          position: 'absolute',
          right: '22%', bottom: '28%',
          width: 100, height: 100,
          background: 'radial-gradient(circle, #fff8c0 0%, #ffb636 35%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none', zIndex: 13,
          mixBlendMode: 'screen',
          animation: 'muzzleFlashAnim 0.1s ease-out',
        }} />
      )}

      {/* Animation SLASH pour couteau/machette (trait blanc de G à D) */}
      {slashActive && (
        <div style={{
          position: 'absolute', inset: 0,
          pointerEvents: 'none', zIndex: 16,
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: '30%', left: '-20%',
            width: '140%', height: '40%',
            background: 'linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.95) 45%, rgba(255,255,255,0.95) 55%, transparent 80%)',
            transform: 'skewY(-8deg)',
            animation: 'slashAnim 1s ease-out forwards',
            filter: 'blur(2px)',
          }} />
          {/* Trait net au-dessus */}
          <div style={{
            position: 'absolute',
            top: '45%', left: '-10%',
            width: '120%', height: 4,
            background: 'linear-gradient(90deg, transparent 15%, rgba(255,255,255,1) 50%, transparent 85%)',
            transform: 'rotate(-8deg)',
            animation: 'slashAnim 1s ease-out forwards',
            boxShadow: '0 0 20px rgba(255,255,255,0.9)',
          }} />
        </div>
      )}

      {/* Flash de tir */}
      {shooting && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 85% 80%, rgba(255,200,0,0.4), transparent 40%)',
          pointerEvents: 'none', zIndex: 15,
          animation: 'muzzleFlash 0.3s ease-out',
        }} />
      )}

      {/* Indicateur proximité */}
      {nearZone && zoneLabels[nearZone] && (
        <div className="hud-control"
          data-testid={nearZone === 'exit' ? 'lobby-exit-label' : `lobby-zone-${nearZone}`}
          style={{
          position: 'absolute', top: '40%', left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.85)',
          border: `2px solid ${casino.secondary}`,
          borderRadius: 12, padding: '10px 20px',
          color: '#fff', fontFamily: 'Georgia, serif',
          textAlign: 'center', zIndex: 20,
          animation: 'pulseGlow 1.5s ease-in-out infinite',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ fontSize: 16, color: casino.secondary, marginBottom: 4 }}>
            {zoneLabels[nearZone].icon} {zoneLabels[nearZone].name}
          </div>
          <button
            data-testid={nearZone === 'exit' ? 'lobby-exit-action-btn' : `lobby-zone-action-${nearZone}`}
            onClick={() => zoneCallbacksRef.current[nearZone] && zoneCallbacksRef.current[nearZone]()}
            style={{
              padding: '8px 18px',
              background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
              border: 'none', borderRadius: 6, color: '#fff',
              fontFamily: 'inherit', cursor: 'pointer', fontWeight: 'bold',
              fontSize: 14,
            }}>{nearZone === 'exit' ? 'SORTIR' : 'ENTRER'}</button>
        </div>
      )}

      {/* Instructions démarrage */}
      {showInstructions && (
        <div className="hud-control" style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          background: 'rgba(0,0,0,0.92)',
          border: `2px solid ${casino.secondary}`,
          borderRadius: 12, padding: 20,
          color: '#fff', fontFamily: 'Georgia, serif',
          textAlign: 'center', maxWidth: 360, zIndex: 30,
        }}>
          <div style={{ fontSize: 20, color: casino.secondary, marginBottom: 10, letterSpacing: 2 }}>
            BIENVENUE
          </div>
          <div style={{ fontSize: 13, color: '#cca366', marginBottom: 12, fontStyle: 'italic' }}>
            {casino.name} • {casino.tagline}
          </div>
          <div style={{ textAlign: 'left', fontSize: 13, lineHeight: 1.6 }}>
            <div>📱 <strong>Mobile :</strong></div>
            <div>• Flèches en bas à gauche = déplacement</div>
            <div>• Glisser au doigt = tourner la tête</div>
            <div>• 🎒 = inventaire armes</div>
            <div>• 🎯 = tirer avec l'arme sélectionnée</div>
            <br/>
            <div>💻 <strong>PC :</strong></div>
            <div>• ZQSD/WASD/Flèches = déplacement</div>
            <div>• Clic pour verrouiller la souris</div>
            <div>• E ou Espace = interagir</div>
          </div>
          <button onClick={() => setShowInstructions(false)}
            style={{
              marginTop: 16, padding: '10px 28px',
              background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
              border: 'none', borderRadius: 8, color: '#fff',
              fontFamily: 'inherit', fontSize: 15, fontWeight: 'bold',
              cursor: 'pointer', letterSpacing: 2,
            }}>ENTRER</button>
        </div>
      )}

      {/* INVENTAIRE */}
      {showInventory && (
        <div className="hud-control" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
          zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, fontFamily: 'Georgia, serif',
        }}>
          <div style={{
            background: `linear-gradient(145deg, #1a0a0a, #0a0503)`,
            border: `2px solid ${casino.primary}`, borderRadius: 14,
            maxWidth: 500, width: '100%', padding: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ color: casino.secondary, margin: 0, letterSpacing: 2 }}>🎒 INVENTAIRE</h3>
              <button onClick={() => setShowInventory(false)} style={{
                background: 'transparent', border: `1px solid ${casino.secondary}`,
                color: casino.secondary, padding: '6px 12px', borderRadius: 6,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>✕</button>
            </div>
            {weapons.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#888', padding: 30 }}>
                Pas d'arme dans l'inventaire. Visite l'armurerie !
              </div>
            ) : (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: 10,
              }}>
                {weapons.map(wId => {
                  const w = WEAPONS.find(x => x.id === wId);
                  const isSelected = selectedWeapon === wId;
                  return (
                    <button key={wId}
                      onClick={() => { setSelectedWeapon(wId); setShowInventory(false); }}
                      style={{
                        padding: 12,
                        background: isSelected 
                          ? `linear-gradient(135deg, ${casino.secondary}33, ${casino.primary}33)` 
                          : 'rgba(0,0,0,0.4)',
                        border: `2px solid ${isSelected ? casino.secondary : '#444'}`,
                        borderRadius: 10, color: '#fff',
                        cursor: 'pointer', fontFamily: 'inherit',
                        textAlign: 'center',
                      }}>
                      <WeaponIcon id={wId} size={50} />
                      <div style={{ fontSize: 11, fontWeight: 'bold', marginTop: 4 }}>{w.name}</div>
                      <div style={{ fontSize: 9, color: '#cca366' }}>{w.damage}</div>
                      {isSelected && (
                        <div style={{
                          fontSize: 10, color: casino.secondary, fontWeight: 'bold', marginTop: 4,
                        }}>✓ ÉQUIPÉE</div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {selectedWeapon && (
              <button onClick={() => { setSelectedWeapon(null); }}
                style={{
                  width: '100%', marginTop: 12, padding: 10,
                  background: 'transparent', border: '1px solid #888',
                  color: '#888', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                }}>Déséquiper</button>
            )}
          </div>
        </div>
      )}

      {/* MENU */}
      {showMenu && (
        <div className="hud-control" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
          zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, overflowY: 'auto', fontFamily: 'Georgia, serif',
        }}>
          <div style={{
            background: `linear-gradient(145deg, #1a0a0a, #0a0503)`,
            border: `2px solid ${casino.primary}`, borderRadius: 14,
            maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{
              padding: '14px 20px', borderBottom: `1px solid ${casino.primary}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'rgba(0,0,0,0.4)',
            }}>
              <div style={{ color: casino.secondary, fontSize: 18, fontWeight: 'bold' }}>
                {casino.country} {casino.name}
              </div>
              <button onClick={() => setShowMenu(false)} style={{
                background: 'transparent', border: `1px solid ${casino.secondary}`,
                color: casino.secondary, padding: '6px 12px', borderRadius: 6,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>✕</button>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: 8, marginBottom: 16,
              }}>
                <StatCard label="Solde" value={fmt(balance || 0) + ' $'} color="#ffd700" />
                <StatCard label="Gains cum." value={fmt(profile?.totalWinnings || 0) + ' $'} color="#00ff88" />
                <StatCard label="Trophées" value={`${earned.length}/${TROPHIES.length}`} color="#ff6b9d" />
                <StatCard label="Armes" value={(weapons || []).length} color={casino.primary} />
              </div>

              {nextTrophy && (
                <div style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: `1px solid ${nextTrophy.color}`,
                  borderRadius: 8, padding: 10, marginBottom: 12,
                }}>
                  <div style={{ color: nextTrophy.color, fontSize: 11, marginBottom: 4 }}>
                    Prochain : {nextTrophy.icon} {nextTrophy.name}
                  </div>
                  <div style={{ background: '#333', height: 5, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(100, ((profile?.totalWinnings || 0) / nextTrophy.threshold) * 100)}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${nextTrophy.color}, #fff)`,
                    }} />
                  </div>
                </div>
              )}

              <div style={{ color: '#cca366', fontSize: 12, marginBottom: 10, textAlign: 'center', fontStyle: 'italic' }}>
                💡 Déplace-toi dans le casino pour accéder aux jeux, bar, WC, ATM, roue, boutique et GambleBet
              </div>

              <button onClick={() => { setShowMenu(false); onOpenTrophies(); }} style={menuBtnStyle('#ff6b9d')}>
                🏆 Voir tous les trophées
              </button>

              <button onClick={() => { setShowMenu(false); onOpenCharacter && onOpenCharacter(); }}
                data-testid="menu-character-btn"
                style={{ ...menuBtnStyle('#b48cff'), marginTop: 10 }}>
                👤 Personnaliser le personnage
              </button>

              <button onClick={() => { setShowMenu(false); onOpenQuests && onOpenQuests(); }}
                data-testid="menu-quests-btn"
                style={{ ...menuBtnStyle('#ffd43b'), marginTop: 10 }}>
                🎯 Quêtes du jour
              </button>

              <button onClick={() => { setShowMenu(false); onChangeCasino && onChangeCasino(); }} style={{
                ...menuBtnStyle(casino.accent),
                marginTop: 10,
              }}>
                🌍 Changer de casino
              </button>

              <button onClick={() => { setShowMenu(false); onReplayTutorial?.(); }} style={{
                width: '100%', marginTop: 10, padding: 10,
                background: 'rgba(63,230,255,0.15)',
                border: '1px solid #3fe6ff', color: '#3fe6ff',
                borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
              }} data-testid="menu-replay-tutorial">❔ Revoir le tutoriel</button>

              <button onClick={() => { setShowMenu(false); onExitCasino?.(); }} style={{
                width: '100%', marginTop: 10, padding: 10,
                background: 'linear-gradient(135deg, #d4af37, #8b6914)',
                border: '1px solid #ffd700', color: '#fff',
                borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 800,
              }} data-testid="menu-exit-casino">🚪 Sortir (voir la rue)</button>

              <button onClick={() => { setShowMenu(false); onLogout(); }} style={{
                width: '100%', marginTop: 10, padding: 10,
                background: 'rgba(180,40,40,0.3)',
                border: '1px solid #aa3030', color: '#ff7777',
                borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
              }}>Déconnexion</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(255,215,0,0.6); }
          50% { box-shadow: 0 0 40px rgba(255,215,0,0.9); }
        }
        @keyframes shootRecoil {
          0% { transform: scale(1); }
          50% { transform: scale(0.85); }
          100% { transform: scale(1); }
        }
        @keyframes muzzleFlash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes recoilAnim {
          0% { transform: translate(0,0) rotate(0); }
          50% { transform: translate(-10px, 8px) rotate(-3deg); }
          100% { transform: translate(0,0) rotate(0); }
        }
        @keyframes muzzleFlashAnim {
          0% { opacity: 1; transform: scale(0.6); }
          100% { opacity: 0; transform: scale(1.4); }
        }
        @keyframes bulletFlyOverlay {
          0% { right: 22%; bottom: 28%; opacity: 1; transform: scale(1); }
          100% { right: 50%; bottom: 50%; opacity: 0; transform: scale(0.3); }
        }
      `}</style>

      {/* ====== MULTIJOUEUR HUD ====== */}
      {mpOnline && (
        <>
          {/* Badge serveur + joueurs en ligne */}
          <div
            data-testid="mp-server-badge"
            style={{
              position: 'absolute', top: 10, left: 10, zIndex: 50,
              background: 'rgba(224,14,26,0.85)', color: '#fff',
              padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700,
              letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8,
              pointerEvents: 'none',
            }}
          >
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: '#7fff7f',
              boxShadow: '0 0 6px #7fff7f',
            }} />
            SERVEUR {mpServerId?.toUpperCase()} · {onlinePlayersCount} EN LIGNE
          </div>

          {/* Barre de vie */}
          <div style={{
            position: 'absolute', top: 40, left: 10, zIndex: 50,
            width: 180, background: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: 6,
            pointerEvents: 'none',
          }}>
            <div style={{ fontSize: 10, color: '#fff', marginBottom: 2 }}>HP : {myHp}/100</div>
            <div style={{
              height: 8, background: '#333', borderRadius: 4, overflow: 'hidden',
            }}>
              <div
                data-testid="mp-hp-bar"
                style={{
                width: `${myHp}%`, height: '100%',
                background: myHp > 50 ? '#22c55e' : myHp > 25 ? '#f59e0b' : '#dc2626',
                transition: 'width .2s',
              }} />
            </div>
          </div>

          {/* Kill feed */}
          {killFeed.length > 0 && (
            <div style={{
              position: 'absolute', top: 10, right: 10, zIndex: 50,
              pointerEvents: 'none',
            }}>
              {killFeed.map((k, i) => (
                <div key={`${k.ts}-${i}`} style={{
                  background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '6px 12px',
                  borderRadius: 4, fontSize: 12, marginBottom: 4, fontWeight: 700,
                }}>
                  <span style={{ color: '#7fff7f' }}>{k.killer}</span>
                  <span style={{ margin: '0 6px', color: '#f59e0b' }}>💀 {k.weapon}</span>
                  <span style={{ color: '#ff9090' }}>{k.victim}</span>
                </div>
              ))}
            </div>
          )}

          {/* Chat fenêtre (bas gauche) */}
          <div style={{
            position: 'absolute', bottom: 120, left: 10, zIndex: 50,
            width: 330, maxHeight: 200, overflowY: 'auto',
            background: 'rgba(0,0,0,0.55)', borderRadius: 6, padding: 8,
            pointerEvents: 'none', fontSize: 12, color: '#fff',
          }} data-testid="mp-chat-log">
            {chatMessages.slice(-8).map((m, i) => (
              <div key={`${m.ts}-${i}`} style={{ marginBottom: 2 }}>
                <b style={{ color: m.from === 'SYSTÈME' ? '#ffd700' : '#7fceff' }}>{m.from}:</b>{' '}
                <span>{m.text}</span>
              </div>
            ))}
          </div>

          {/* Champ chat (activé par T) */}
          {showChatInput && (
            <div style={{
              position: 'absolute', bottom: 80, left: 10, zIndex: 60,
              width: 330, display: 'flex', gap: 6,
            }}>
              <input
                ref={chatInputRef}
                data-testid="mp-chat-input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') sendChatMessage();
                  if (e.key === 'Escape') { setShowChatInput(false); setChatInput(''); }
                }}
                placeholder="Message (Entrée pour envoyer)…"
                style={{
                  flex: 1, padding: '8px 10px', borderRadius: 4,
                  border: '1px solid #ffd700', background: 'rgba(0,0,0,0.8)',
                  color: '#fff', fontSize: 13,
                }}
              />
              <button
                data-testid="mp-chat-send"
                onClick={sendChatMessage}
                style={{
                  padding: '6px 12px', borderRadius: 4, border: 'none',
                  background: '#ffd700', color: '#000', fontWeight: 700,
                  cursor: 'pointer', fontSize: 12,
                }}
              >Envoyer</button>
            </div>
          )}

          {/* Bouton ouvrir chat (mobile) */}
          {!showChatInput && (
            <button
              data-testid="mp-chat-open"
              onClick={() => { setShowChatInput(true); setTimeout(() => chatInputRef.current?.focus(), 50); }}
              style={{
                position: 'absolute', bottom: 80, left: 10, zIndex: 55,
                padding: '6px 12px', borderRadius: 4, border: '1px solid #ffd700',
                background: 'rgba(0,0,0,0.6)', color: '#ffd700', cursor: 'pointer',
                fontSize: 12, fontWeight: 700,
              }}
            >💬 Chat (T)</button>
          )}
        </>
      )}
    </div>
  );
};

// Bouton fléché avec press/hold support

export default Lobby3D;
